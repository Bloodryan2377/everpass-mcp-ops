# EverPass Briefs — podcast feed builder

A self-contained, version-controlled generator for the EverPass morning +
end-of-day audio briefs feed (`everpass-briefs.xml`). Stdlib Python only — no
pip installs, runs anywhere Python 3.8+ runs.

## Why this exists — what was broken

The hand-rolled feed at `briefs.everpasspipeline.com` would not load in Apple
Podcasts or Spotify, and wouldn't reliably play even from the raw URL. Three
root causes (run `validate_feed.py` against the live file to confirm each):

1. **Only the morning episode was ever in the feed.** The end-of-day brief was
   never written as a second `<item>`, so "EOD doesn't work" = it didn't exist
   in the XML. This builder scans for **both** `morning-*.mp3` and `eod-*.mp3`
   and emits one `<item>` per file.

2. **The enclosure pointed at a bare filename** (`morning-2026-06-29.mp3`)
   instead of an absolute URL. RSS enclosure URLs **must** be absolute — a
   podcast player has no base to resolve a relative path against, so the
   episode shows but won't play. This builder writes
   `base_url + filename` as a full `https://…` enclosure URL.

3. **The channel was missing the iTunes tags Apple/Spotify require** —
   `itunes:image`, `itunes:category`, `itunes:explicit`, `itunes:owner`.
   Without cover art + a category, Apple and Spotify reject the feed outright,
   so nothing shows up to play. This builder emits all of them.

> Note: a browser showing the feed as raw XML text is **normal** — an RSS feed
> isn't a web page. You don't open the feed URL in Safari; you paste it into
> Apple Podcasts Connect / Spotify for Podcasters (see below), or into a
> podcast app's "add by URL".

## Files

| File | What it does |
|---|---|
| `build_feed.py` | Scans an mp3 directory → writes a valid `everpass-briefs.xml`. |
| `validate_feed.py` | Checks any feed against Apple/Spotify hard requirements. Exit 1 on failure — use as a regression gate and to diagnose the live feed. |
| `config.example.json` | Channel metadata template. Copy to `config.json` and fill in. |

## Episode filename conventions

The builder recognizes these in the audio directory (case-insensitive):

- **Morning:** `morning-YYYY-MM-DD.mp3`
- **End-of-day:** `eod-YYYY-MM-DD.mp3` · `endofday-YYYY-MM-DD.mp3` · `end-of-day-YYYY-MM-DD.mp3` · `evening-YYYY-MM-DD.mp3`

For each file it derives the title, publish date/time, byte length, and (when
parseable) duration. Anything in `config.json`'s optional `episodes` map
overrides those per-file.

## Run it

```bash
cd podcast
cp config.example.json config.json     # then edit: base_url, image_url, owner.email
python3 build_feed.py \
    --config config.json \
    --audio-dir "/path/to/the/mp3/folder" \
    --out everpass-briefs.xml
python3 validate_feed.py everpass-briefs.xml    # must print PASS
```

Then upload `everpass-briefs.xml` to the same host/folder it's served from
(next to the `.mp3` files and `cover.jpg`). Wire those two commands into
whatever local job already produces the mp3s — generate audio → `build_feed.py`
→ `validate_feed.py` → upload.

### Before the first run — two things that must be real

- **`base_url`** must be the absolute `https://…` folder the mp3s are actually
  served from. Enclosure URLs are `base_url + filename`; if the host or token
  is wrong, every episode 404s.
- **`image_url`** must point at a real, reachable **square** cover image,
  1400–3000px, JPG or PNG. Apple and Spotify both reject feeds without one.
  Upload `cover.jpg` alongside the mp3s.

## Diagnose the current live feed

```bash
curl -s "https://briefs.everpasspipeline.com/<token>/everpass-briefs.xml" -o live.xml
python3 validate_feed.py live.xml
```

Every `FAIL` line is a reason Apple/Spotify rejects it; fix it (or just
regenerate with `build_feed.py`) and re-validate.

## Submitting to Apple Podcasts & Spotify

The feed URL is the only thing you submit — both platforms pull episodes from it.

- **Apple Podcasts:** [podcastsconnect.apple.com](https://podcastsconnect.apple.com)
  → add a show → paste the feed URL → validate. Apple emails the address in
  `<itunes:owner>` to verify ownership.
- **Spotify:** [podcasters.spotify.com](https://podcasters.spotify.com) → add
  your podcast → paste the feed URL.

### Private feed caveat

`config.example.json` sets `itunes:block = yes`, which keeps the feed **out of
the public Apple/Spotify directories** while still letting you subscribe by URL
in a podcast app. That fits a private brief.

Apple Podcasts Connect and Spotify for Podcasters publish to the **public**
directory — submitting a `block=yes` feed there may be refused or delisted. So:

- **Keep it private** (just you): set `block: "yes"` and add the feed URL
  directly in a podcast app via *Library → add a show by URL* (Apple Podcasts,
  Overcast, Pocket Casts all support this). No Connect/Spotify submission.
- **List it publicly:** set `block: "no"`, regenerate, then submit via Connect /
  Spotify for Podcasters. Only do this if a public listing is actually intended
  — the token in the URL is the only thing keeping it unlisted today.
