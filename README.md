# SupTV

Play the most recent Sup!? video by search string.

- p2fk.io: https://p2fk.io
- SupTV repository: https://github.com/embiimob/SupTV
- Live demo: https://supgalaxy.org/TV

## Standalone player

Open `index.html` from the repository root in a browser to launch the fullscreen-capable SupTV player.
It auto-loads trending searches from `https://bitfossil.org/GetTrendingRootSearches?qty=100`, selects up to the top 5 search strings, pulls up to 100 records for each search, combines them, sorts by newest `BlockDate`, and starts playback immediately.
If the trending API is empty/unavailable, it falls back to `mp4` as the default.
The search field starts empty; submitting your own query still runs a normal keyword search, while submitting empty keeps the trending-default behavior.
Playback uses a larger queue for trending mode (up to 500 combined results) and advances until exhausted, then shows an off-air screen.
You can skip the current video with **Skip** (or mobile left-swipe), and the UI now includes queue + buffering indicators for long streams.
You can set the startup keyword with `?q=yourkeyword` (example: `index.html?q=mp4`).

## Pointing `index.html` at a local p2fk-compatible API

Edit `index.html` and update these constants near the top of the script:

- `P2FK_BASE_URL` (default: `https://p2fk.io`) → set this to your local API base URL
- `TRENDING_SEARCHES_ENDPOINT` (default: `https://bitfossil.org/GetTrendingRootSearches?qty=100`) → set this to your local trending endpoint if needed

Example local values:

- `P2FK_BASE_URL = 'http://localhost:5000'`
- `TRENDING_SEARCHES_ENDPOINT = 'http://localhost:5000/GetTrendingRootSearches?qty=100'`
