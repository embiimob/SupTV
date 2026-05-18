# SupTV

SupTV is a browser-based video player UI for p2fk data.  
It is software you run yourself (`index.html`) — **not** a streaming company or hosted platform.

- p2fk.io: https://p2fk.io  
- SupTV repository: https://github.com/embiimob/SupTV  
- Live demo: https://supgalaxy.org/TV

> The demo URL is just a convenient host for the same client app. SupTV itself is not a service business; it is a local-first app you can run anywhere.

## What SupTV is (and is not)

SupTV is:
- A single-page web app (`index.html`)
- A player + queue + search UI over p2fk/IPFS-linked media
- Open software you can run locally

SupTV is **not**:
- A streaming CDN
- A centralized content platform
- A company or subscription service

## Quick start (local)

1. Clone this repo.
2. Open `index.html` in a browser.
3. Optional: use `?q=keyword` to start with a specific query (example: `index.html?q=mp4`).

## Technical overview

At runtime, SupTV does this:

1. **Loads trending terms** from `GetTrendingRootSearches?qty=100` (`TRENDING_STATS_LIMIT`).
2. Selects up to **20 unique keywords** (`TRENDING_KEYWORD_LIMIT`).
3. Fetches per-keyword results with bounded concurrency (**4 at a time**, `TRENDING_KEYWORD_FETCH_CONCURRENCY`):
   - keyword channel messages (`GetPublicAddressByKeyword` + `GetPublicMessagesByAddress`)
   - text search results (`GetKnownRootsBySearchString`)
4. Uses a **fast-start** model: playback begins as soon as first keyword results are ready.
5. Builds a trending queue using **round-robin batching** (5-per-keyword batches, `TRENDING_KEYWORD_BATCH_SIZE`) with dedupe.
6. Caps trending queue size at **500** (`TRENDING_MAX_PLAYLIST_ITEMS`).
7. If trending is empty/unavailable, falls back to `mp4` (`DEFAULT_KEYWORD`).
8. Shows queue status, ticker stats, clickable queue items, and top trending searches in the banner panel.

For direct keyword search, SupTV combines:
- keyword-channel messages, and
- paged search-window results (up to `STANDARD_SEARCH_QTY`, default 200)

## Trending logic from p2fk.io and why it is fair

SupTV reads trending rows from p2fk and displays ranking + metrics in the UI.

It also parses metric field variants so payload schema differences do not break the UI, including:
- search-volume fields: `successfulSearchCount`, `searchTotal`, `searchCount`, `count`, `total` (and PascalCase variants)
- result-volume fields: `lastResultCount`, `averageResultCount`, `maxResultCount`, `resultTotal`, `results`, `totalResults`, `resultCount` (and PascalCase variants)

Fairness properties in SupTV’s playback assembly:
- **Diversity by design:** round-robin batching prevents one keyword from dominating the queue.
- **Bounded influence:** each keyword contributes in equal-size chunks per cycle.
- **Deduplication:** repeated txids are collapsed so duplicates don’t inflate exposure.
- **Transparent display:** top searches + result counts are shown in the banner and ticker.

## Censorship resistance when running locally

Running SupTV locally reduces central control because the player is just static client code.

For strongest censorship resistance and privacy, run your own stack:
- a local/self-hosted p2fk-compatible API (`P2FK_BASE_URL`)
- your own trusted IPFS gateway (or node)

When search/API infrastructure is self-hosted, query behavior is controlled by you, and search processing stays in your environment instead of a third-party hosted endpoint.

## Privacy & security recommendations

Because media is fetched from IPFS gateways (default list includes `ipfs.io`), consider:

- **Use a VPN** to reduce IP-based correlation by public gateways.
- **Self-host an IPFS gateway/node** and update `IPFS_GATEWAY_URLS` to trusted endpoints.
- **Self-host the p2fk API** and set `P2FK_BASE_URL` to your local endpoint.
- **Serve SupTV over HTTPS** (or local trusted origin) to prevent network tampering.
- **Use a hardened browser profile** (strict tracking protection, minimal extensions).
- **Segment network context** (separate browser/container/VM for media browsing).

## Configure local API endpoint

Edit `index.html` constants near the top of the script:

- `P2FK_BASE_URL` (default: `https://p2fk.io`)
- `TRENDING_SEARCH_QTY` (default: `200`)
- `STANDARD_SEARCH_QTY` (default: `200`)

Example:

- `P2FK_BASE_URL = 'http://localhost:5000'`
- `TRENDING_SEARCH_QTY = 100`

`TRENDING_SEARCHES_ENDPOINT` is derived as:
`${P2FK_BASE_URL}/GetTrendingRootSearches?qty=${TRENDING_STATS_LIMIT}`
