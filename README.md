# SupTV

Play the most recent Sup!? video by search string.

- p2fk.io: https://p2fk.io
- SupTV repository: https://github.com/embiimob/SupTV
- Live demo: https://supgalaxy.org/TV

## Standalone player

Open `index.html` from the repository root in a browser to launch the fullscreen-capable SupTV player.
It auto-loads trending searches from `https://p2fk.io/GetTrendingRootSearches?qty=20` (where `20` matches `TRENDING_KEYWORD_LIMIT` in `index.html`).
It selects up to the top 20 search strings, pulls up to 200 records for each search in a single request, then builds the queue in round-robin batches of 5 videos per search string (cycling through all keywords until all results are exhausted, up to 500 total).
Results are cached for the session so clicking the SupTV logo to return to trending replays instantly without re-fetching.
Playback then starts immediately.
Standard keyword searches fetch up to 200 results in a single request for better discovery.
- `STANDARD_SEARCH_QTY` (default: `200`) → change this to adjust the standard keyword search fetch size
If the trending API is empty/unavailable, it falls back to `mp4` as the default.
The search field starts empty; submitting your own query still runs a normal keyword search, while submitting empty keeps the trending-default behavior.
Playback uses a larger queue for trending mode (up to 500 results) and advances until exhausted, then shows an off-air screen.
You can skip the current video with **Skip** (or mobile left-swipe), and the UI now includes queue + buffering indicators for long streams.
You can set the startup keyword with `?q=yourkeyword` (example: `index.html?q=mp4`).

## Pointing `index.html` at a local p2fk-compatible API

Edit `index.html` and update these constants near the top of the script:

- `P2FK_BASE_URL` (default: `https://p2fk.io`) → set this to your local API base URL
- `TRENDING_SEARCH_QTY` (default: `200`) → change this only if you want a different per-keyword trending fetch size
- `STANDARD_SEARCH_QTY` (default: `200`) → change this only if you want a different standard keyword search fetch size

Example local values:

- `P2FK_BASE_URL = 'http://localhost:5000'`
- `TRENDING_SEARCH_QTY = 100`

`TRENDING_SEARCHES_ENDPOINT` is derived from these values in code (`${P2FK_BASE_URL}/GetTrendingRootSearches?qty=${TRENDING_SEARCH_QTY}`).
