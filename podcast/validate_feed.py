#!/usr/bin/env python3
"""
validate_feed.py — check a podcast RSS feed against Apple Podcasts / Spotify
hard requirements. Use it on the live feed to see exactly why it won't accept,
and on build_feed.py output as a regression gate.

    python3 validate_feed.py everpass-briefs.xml

Exit 0 = passes all hard requirements. Exit 1 = one or more failures printed.
Warnings (recommended-but-not-required) never fail the build on their own.

Stdlib only.
"""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

ITUNES = "http://www.itunes.com/dtds/podcast-1.0.dtd"


def q(tag):
    return f"{{{ITUNES}}}{tag}"


def is_absolute_http(url: str) -> bool:
    try:
        p = urlparse(url or "")
        return p.scheme in ("http", "https") and bool(p.netloc)
    except ValueError:
        return False


def validate(path: str):
    errors, warnings = [], []
    try:
        tree = ET.parse(path)
    except ET.ParseError as exc:
        return [f"XML is not well-formed: {exc}"], []
    root = tree.getroot()
    channel = root.find("channel")
    if channel is None:
        return ["No <channel> element — not a valid RSS feed."], []

    # ---- Channel-level hard requirements (Apple + Spotify) ----
    def ctext(tag, itunes=False):
        el = channel.find(q(tag) if itunes else tag)
        return (el.text or "").strip() if el is not None and el.text else ""

    if not ctext("title"):
        errors.append("channel <title> is missing or empty.")
    if not ctext("description") and not ctext("summary", itunes=True):
        errors.append("channel needs <description> (or <itunes:summary>).")
    if not ctext("language"):
        warnings.append("channel <language> missing (recommended, e.g. en-us).")

    img = channel.find(q("image"))
    img_href = img.get("href") if img is not None else ""
    if not is_absolute_http(img_href):
        errors.append("channel <itunes:image href> missing or not an absolute "
                      "http(s) URL. Apple/Spotify REQUIRE cover art "
                      "(1400–3000px square JPG/PNG).")

    if channel.find(q("category")) is None:
        errors.append("channel <itunes:category> missing. Apple/Spotify "
                      "REQUIRE at least one category.")

    if not ctext("explicit", itunes=True):
        errors.append("channel <itunes:explicit> missing (must be true/false).")

    if not ctext("author", itunes=True):
        warnings.append("channel <itunes:author> missing (recommended).")

    owner = channel.find(q("owner"))
    owner_email = ""
    if owner is not None:
        em = owner.find(q("email"))
        owner_email = (em.text or "").strip() if em is not None and em.text else ""
    if not owner_email:
        warnings.append("channel <itunes:owner><itunes:email> missing — "
                        "Apple uses it to verify feed ownership at submission.")

    # ---- Items ----
    items = channel.findall("item")
    if not items:
        errors.append("Feed has zero <item> episodes — nothing to play.")
    for i, item in enumerate(items, 1):
        title_el = item.find("title")
        label = (title_el.text or f"#{i}").strip() if title_el is not None else f"#{i}"
        enc = item.find("enclosure")
        if enc is None:
            errors.append(f"item '{label}': no <enclosure> — episode has no audio.")
            continue
        url = enc.get("url", "")
        if not is_absolute_http(url):
            errors.append(f"item '{label}': <enclosure url> is not an absolute "
                          f"http(s) URL ('{url}'). Players cannot fetch a relative "
                          f"enclosure — this is the classic 'shows but won't play' bug.")
        if enc.get("type", "").lower() not in ("audio/mpeg", "audio/mp3", "audio/x-m4a", "audio/mp4"):
            warnings.append(f"item '{label}': <enclosure type> is "
                            f"'{enc.get('type', '')}' (expected audio/mpeg).")
        length = enc.get("length", "")
        if not length.isdigit() or length == "0":
            warnings.append(f"item '{label}': <enclosure length> should be the "
                            f"file size in bytes (got '{length}').")
        if item.find("guid") is None:
            warnings.append(f"item '{label}': no <guid> — episodes may duplicate "
                            f"or disappear across rebuilds.")
        if item.find("pubDate") is None:
            warnings.append(f"item '{label}': no <pubDate>.")

    return errors, warnings


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print("usage: validate_feed.py <feed.xml>", file=sys.stderr)
        return 2
    path = argv[0]
    errors, warnings = validate(path)

    for w in warnings:
        print(f"  WARN  {w}")
    for e in errors:
        print(f"  FAIL  {e}")

    if errors:
        print(f"\n{len(errors)} hard failure(s), {len(warnings)} warning(s). "
              f"Apple/Spotify will reject this feed.")
        return 1
    print(f"\nPASS — feed meets Apple/Spotify hard requirements "
          f"({len(warnings)} warning(s)).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
