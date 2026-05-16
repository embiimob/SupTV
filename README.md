# SupTV

Play the most recent Sup!? video by search string.

## Standalone player

Open `index.html` from the repository root in a browser to launch the fullscreen-capable SupTV player.
It auto-searches p2fk.io (default query: `game`), starts playback immediately, and overlays live social cards sourced from the same search results.
The search field starts empty; submitting an empty query still searches the default `game` keyword.
Playback uses a finite queue (up to 50 results) and advances until exhausted, then shows an off-air screen.
You can skip the current video with **Skip** (or mobile left-swipe), and the UI now includes queue + buffering indicators for long streams.
You can set the startup keyword with `?q=yourkeyword` (example: `index.html?q=game`).
