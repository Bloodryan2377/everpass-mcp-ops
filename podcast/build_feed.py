#!/usr/bin/env python3
"""
build_feed.py — generate a valid podcast RSS feed for the EverPass briefs.

Why this exists
---------------
The hand-rolled feed at briefs.everpasspipeline.com would not play in Apple
Podcasts / Spotify because it:
  1. only ever contained ONE <item> (the morning brief) — the end-of-day
     episode was never written into the XML;
  2. used a bare filename in <enclosure> (e.g. "morning-2026-06-29.mp3")
     instead of an absolute URL — players cannot fetch a relative enclosure;
  3. was missing the channel-level iTunes tags Apple/Spotify REQUIRE
     (itunes:image, itunes:category, itunes:author, itunes:owner, itunes:explicit).

This builder fixes all three. It scans a directory of .mp3 episodes, derives
absolute enclosure URLs from a configured base URL, computes byte length and
duration for each file, and emits a feed that validates against Apple Podcasts
and Spotify requirements.

Usage
-----
    python3 build_feed.py --config config.json \
        --audio-dir /path/to/mp3s \
        --out everpass-briefs.xml

Stdlib only — no pip installs. Runs anywhere Python 3.8+ runs.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import re
import struct
import sys
from email.utils import format_datetime


# --------------------------------------------------------------------------
# Episode filename conventions
# --------------------------------------------------------------------------
# Morning brief:     morning-YYYY-MM-DD.mp3
# End-of-day brief:  eod-YYYY-MM-DD.mp3 | endofday-... | end-of-day-... | evening-...
#
# Each kind maps to a human title and a default publish hour (local), used only
# when an episode's pubDate isn't supplied in the manifest.
KINDS = {
    "morning": {
        "patterns": [r"^morning[-_](\d{4}-\d{2}-\d{2})\.mp3$"],
        "title": "EverPass Morning Brief",
        "default_hour": 7,
    },
    "eod": {
        "patterns": [
            r"^eod[-_](\d{4}-\d{2}-\d{2})\.mp3$",
            r"^end[-_]?of[-_]?day[-_](\d{4}-\d{2}-\d{2})\.mp3$",
            r"^evening[-_](\d{4}-\d{2}-\d{2})\.mp3$",
        ],
        "title": "EverPass End-of-Day Brief",
        "default_hour": 17,
    },
}


def classify(filename: str):
    """Return (kind, date) for a known episode filename, else (None, None)."""
    name = filename.lower()
    for kind, spec in KINDS.items():
        for pat in spec["patterns"]:
            m = re.match(pat, name)
            if m:
                return kind, m.group(1)
    return None, None


# --------------------------------------------------------------------------
# MP3 duration (stdlib, no ffmpeg). Handles CBR and VBR (Xing/Info) MP3s.
# --------------------------------------------------------------------------
_BITRATES = {  # kbps, indexed by MPEG version key then bitrate index
    "1": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
    "2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
}
_SAMPLE_RATES = {
    3: [44100, 48000, 32000],  # MPEG1
    2: [22050, 24000, 16000],  # MPEG2
    0: [11025, 12000, 8000],   # MPEG2.5
}


def _id3v2_size(data: bytes) -> int:
    """Length of a leading ID3v2 tag, or 0 if none."""
    if len(data) < 10 or data[:3] != b"ID3":
        return 0
    size = (data[6] << 21) | (data[7] << 14) | (data[8] << 7) | data[9]
    return size + 10


def mp3_duration_seconds(path: str):
    """Best-effort MP3 length in whole seconds. None if it can't be parsed."""
    try:
        with open(path, "rb") as fh:
            data = fh.read()
    except OSError:
        return None
    if not data:
        return None

    pos = _id3v2_size(data)
    # Find the first valid MPEG audio frame sync.
    while pos < len(data) - 4:
        if data[pos] == 0xFF and (data[pos + 1] & 0xE0) == 0xE0:
            hdr = data[pos:pos + 4]
            parsed = _parse_frame_header(hdr)
            if parsed:
                break
        pos += 1
    else:
        return None

    version_bits, bitrate, sample_rate, samples_per_frame, side_info = parsed

    # VBR? Look for a Xing/Info header inside this first frame.
    xing_off = pos + 4 + side_info
    frame_count = None
    if data[xing_off:xing_off + 4] in (b"Xing", b"Info"):
        flags = struct.unpack(">I", data[xing_off + 4:xing_off + 8])[0]
        if flags & 0x1:  # frames field present
            frame_count = struct.unpack(">I", data[xing_off + 8:xing_off + 12])[0]

    if frame_count:
        return int(round(frame_count * samples_per_frame / sample_rate))

    # CBR fallback: audio bytes * 8 / bitrate.
    if bitrate:
        audio_bytes = len(data) - pos
        return int(round(audio_bytes * 8 / (bitrate * 1000)))
    return None


def _parse_frame_header(hdr: bytes):
    if len(hdr) < 4:
        return None
    b1, b2 = hdr[1], hdr[2]
    version_bits = (b1 >> 3) & 0x3   # 3=MPEG1, 2=MPEG2, 0=MPEG2.5
    layer_bits = (b1 >> 1) & 0x3     # 1=LayerIII
    if version_bits == 1 or layer_bits == 0:
        return None
    bitrate_idx = (b2 >> 4) & 0xF
    sr_idx = (b2 >> 2) & 0x3
    if bitrate_idx in (0, 15) or sr_idx == 3:
        return None
    br_key = "1" if version_bits == 3 else "2"
    bitrate = _BITRATES[br_key][bitrate_idx]
    sample_rate = _SAMPLE_RATES[version_bits][sr_idx]
    if not bitrate or not sample_rate:
        return None
    # Layer III samples/frame: 1152 (MPEG1) or 576 (MPEG2/2.5).
    samples_per_frame = 1152 if version_bits == 3 else 576
    channel_mode = (hdr[3] >> 6) & 0x3
    mono = channel_mode == 3
    if version_bits == 3:        # MPEG1
        side_info = 17 if mono else 32
    else:                        # MPEG2 / 2.5
        side_info = 9 if mono else 17
    return version_bits, bitrate, sample_rate, samples_per_frame, side_info


def fmt_duration(seconds):
    if seconds is None:
        return None
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


# --------------------------------------------------------------------------
# Feed assembly
# --------------------------------------------------------------------------
def esc(text: str) -> str:
    return html.escape(str(text), quote=True)


def join_url(base: str, name: str) -> str:
    return base.rstrip("/") + "/" + name.lstrip("/")


def build_items(audio_dir: str, base_url: str, manifest: dict, tz: dt.timezone):
    """Scan audio_dir for known episodes; return item dicts newest-first."""
    items = []
    overrides = manifest.get("episodes", {}) if manifest else {}
    for fname in sorted(os.listdir(audio_dir)):
        if not fname.lower().endswith(".mp3"):
            continue
        kind, date_str = classify(fname)
        if not kind:
            print(f"  skip (unrecognized name): {fname}", file=sys.stderr)
            continue
        path = os.path.join(audio_dir, fname)
        try:
            size = os.path.getsize(path)
        except OSError:
            print(f"  skip (cannot stat): {fname}", file=sys.stderr)
            continue

        ov = overrides.get(fname, {})
        date = dt.date.fromisoformat(date_str)
        hour = KINDS[kind]["default_hour"]
        pub = ov.get("pubDate")
        if pub:
            pub_dt = dt.datetime.fromisoformat(pub)
            if pub_dt.tzinfo is None:
                pub_dt = pub_dt.replace(tzinfo=tz)
        else:
            pub_dt = dt.datetime(date.year, date.month, date.day, hour, 0, tzinfo=tz)

        duration = ov.get("duration") or fmt_duration(mp3_duration_seconds(path))
        title = ov.get("title") or f"{KINDS[kind]['title']} — {date_str}"
        summary = ov.get("summary") or f"Auto-generated EverPass {kind} brief for {date_str}."

        items.append({
            "kind": kind,
            "date": date_str,
            "title": title,
            "summary": summary,
            "url": join_url(base_url, fname),
            "length": size,
            "duration": duration,
            "guid": fname,
            "pub_dt": pub_dt,
        })

    items.sort(key=lambda it: it["pub_dt"], reverse=True)
    return items


def render_feed(cfg: dict, items: list, now: dt.datetime) -> str:
    base_url = cfg["base_url"]
    feed_url = cfg.get("feed_url") or join_url(base_url, "everpass-briefs.xml")
    last_build = max((it["pub_dt"] for it in items), default=now)

    lines = []
    a = lines.append
    a('<?xml version="1.0" encoding="UTF-8"?>')
    a('<rss version="2.0" '
      'xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" '
      'xmlns:atom="http://www.w3.org/2005/Atom" '
      'xmlns:content="http://purl.org/rss/1.0/modules/content/">')
    a("  <channel>")
    a(f"    <title>{esc(cfg['title'])}</title>")
    a(f"    <link>{esc(cfg.get('site_url', base_url))}</link>")
    a(f"    <language>{esc(cfg.get('language', 'en-us'))}</language>")
    a(f"    <description>{esc(cfg['description'])}</description>")
    a(f'    <atom:link href="{esc(feed_url)}" rel="self" type="application/rss+xml"/>')
    a(f"    <lastBuildDate>{format_datetime(last_build)}</lastBuildDate>")
    a(f"    <generator>everpass-mcp-ops/podcast/build_feed.py</generator>")
    # --- iTunes channel tags (required by Apple Podcasts & Spotify) ---
    a(f"    <itunes:author>{esc(cfg.get('author', cfg['title']))}</itunes:author>")
    a(f"    <itunes:summary>{esc(cfg['description'])}</itunes:summary>")
    a(f'    <itunes:explicit>{esc(cfg.get("explicit", "false"))}</itunes:explicit>')
    a(f'    <itunes:type>{esc(cfg.get("itunes_type", "episodic"))}</itunes:type>')
    a(f'    <itunes:image href="{esc(cfg["image_url"])}"/>')
    a(f'    <itunes:category text="{esc(cfg.get("category", "Business"))}">')
    if cfg.get("subcategory"):
        a(f'      <itunes:category text="{esc(cfg["subcategory"])}"/>')
    a("    </itunes:category>")
    owner = cfg.get("owner", {})
    a("    <itunes:owner>")
    a(f"      <itunes:name>{esc(owner.get('name', cfg.get('author', cfg['title'])))}</itunes:name>")
    a(f"      <itunes:email>{esc(owner.get('email', ''))}</itunes:email>")
    a("    </itunes:owner>")
    a(f'    <itunes:block>{esc(cfg.get("block", "yes"))}</itunes:block>')

    for it in items:
        a("    <item>")
        a(f"      <title>{esc(it['title'])}</title>")
        a(f"      <description>{esc(it['summary'])}</description>")
        a(f"      <itunes:summary>{esc(it['summary'])}</itunes:summary>")
        a(f'      <enclosure url="{esc(it["url"])}" '
          f'length="{it["length"]}" type="audio/mpeg"/>')
        a(f'      <guid isPermaLink="false">{esc(it["guid"])}</guid>')
        a(f"      <pubDate>{format_datetime(it['pub_dt'])}</pubDate>")
        if it["duration"]:
            a(f"      <itunes:duration>{esc(it['duration'])}</itunes:duration>")
        a(f'      <itunes:explicit>{esc(cfg.get("explicit", "false"))}</itunes:explicit>')
        a(f'      <itunes:episodeType>full</itunes:episodeType>')
        a("    </item>")

    a("  </channel>")
    a("</rss>")
    return "\n".join(lines) + "\n"


def parse_tz(offset: str) -> dt.timezone:
    """'+00:00' / '-04:00' / 'Z' -> tzinfo."""
    if not offset or offset.upper() == "Z":
        return dt.timezone.utc
    sign = 1 if offset[0] == "+" else -1
    hh, mm = offset[1:].split(":")
    return dt.timezone(sign * dt.timedelta(hours=int(hh), minutes=int(mm)))


def main(argv=None):
    ap = argparse.ArgumentParser(description="Build the EverPass podcast RSS feed.")
    ap.add_argument("--config", required=True, help="Channel config JSON.")
    ap.add_argument("--audio-dir", required=True, help="Directory of .mp3 episodes.")
    ap.add_argument("--out", required=True, help="Output XML path.")
    ap.add_argument("--now", help="Override 'now' (ISO 8601) for reproducible builds.")
    args = ap.parse_args(argv)

    with open(args.config, "r", encoding="utf-8") as fh:
        cfg = json.load(fh)

    for required in ("title", "description", "base_url", "image_url"):
        if not cfg.get(required):
            ap.error(f"config missing required key: {required}")

    tz = parse_tz(cfg.get("tz_offset", "+00:00"))
    now = dt.datetime.fromisoformat(args.now).replace(tzinfo=tz) if args.now \
        else dt.datetime.now(tz)

    manifest = cfg  # episode overrides live under cfg["episodes"] if present
    items = build_items(args.audio_dir, cfg["base_url"], manifest, tz)
    if not items:
        print("WARNING: no recognized episodes found in audio dir.", file=sys.stderr)

    xml = render_feed(cfg, items, now)
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(xml)

    kinds = ", ".join(sorted({it["kind"] for it in items})) or "(none)"
    print(f"Wrote {args.out}: {len(items)} episode(s) [{kinds}].")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
