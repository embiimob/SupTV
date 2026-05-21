# SupTV

SupTV is a local-first, single-file web app (`index.html`) for discovering, playing, and now **posting** p2fk/IPFS video content.

- p2fk.io: https://p2fk.io  
- SupTV repository: https://github.com/embiimob/SupTV  
- Live demo: https://supgalaxy.org/TV

SupTV is software you run yourself, not a hosted streaming company.

## What SupTV is now

SupTV currently has two main roles:

1. **Viewer mode**  
   Searches p2fk data, builds queues, and streams playable media through IPFS gateways.
2. **Poster mode (Compose)**  
   Lets you create signed p2fk-compatible posts from the browser using a built-in **testnet3 legacy wallet flow**.

## Quick start

1. Clone this repo.
2. Open `index.html` in a browser from your cloned repository directory.
3. Optional: use `?q=keyword` to preload a query, e.g. `index.html?q=mp4`.
4. Open **✎ Compose** in the top bar to post.

## Runtime behavior (viewer/search side)

At runtime SupTV:

1. Loads trending search stats from `GetTrendingRootSearches`.
2. Picks up to 20 unique keywords.
3. Fetches keyword-channel messages + search results per keyword.
4. Merges/dedupes by txid and builds a round-robin queue.
5. Starts playback as soon as enough early results arrive (fast-start behavior).
6. Falls back to default keyword (`mp4`) if trending data is empty/unavailable.

SupTV displays p2fk trending output; it does not compute its own trend score model.

## Posting flow (Compose)

The new Compose flow is designed for p2fk-compatible posting with browser-side signing:

1. **Import/unlock wallet**  
   - Uses built-in wallet mode only (`🔑 Built-in (testnet3 legacy)`).
   - Accepts **testnet3 legacy WIF** private keys.
   - Derives a legacy testnet3 sender address.
2. **Create post content**  
   - Enter message text (hashtags supported).
   - Add IPFS video attachment input(s).
   - SupTV validates attachment reachability and canonicalizes to `IPFS:<cid>/<filename.ext>`.
3. **Build sendmany payload**  
   - Converts post body into DiscoBall/p2fk sendmany-compatible recipient outputs.
   - Signs the required payload hash in-browser.
4. **Build and broadcast BTC tx (testnet3)**  
   - Pulls confirmed UTXOs.
   - Estimates fee rate.
   - Builds/signs legacy P2PKH tx.
   - Broadcasts raw hex.

## Testnet3 wallet-like behavior (important)

SupTV’s built-in wallet behavior is intentionally constrained:

- **Network:** testnet3 only (`USE_P2FK_MAINNET = false` by default)
- **Address type:** legacy P2PKH
- **Key type:** WIF private key import/unlock
- **Change model:** two deterministic change addresses are derived from the same root WIF
- **Routing rule:** when a derived change address is the source of selected UTXOs, change is sent to the *opposite* derived address
- **Consolidation support:** change UTXOs can be consolidated back to main address from Compose controls

This keeps the posting flow recoverable from a single root WIF while separating change paths.

## API calls SupTV uses and why

### p2fk API (read/search/trending)

| Endpoint | Purpose in SupTV |
| --- | --- |
| `GET /GetTrendingRootSearches?qty=<n>` | Fetches trending search terms + stats used for trending UI and queue seed keywords. |
| `GET /GetPublicAddressByKeyword/<keyword>?mainnet=false` | Resolves keyword-channel address for that keyword. |
| `GET /GetPublicMessagesByAddress/<address>?skip=<n>&qty=<n>&mainnet=false` | Pulls public channel messages for keyword/address timelines. |
| `GET /GetKnownRootsBySearchString?searchString=<term>&skip=<n>&qty=<n>&mainnet=false&showSystemFiles=false` | Main searchable roots/messages query used by manual search and trending keyword expansion. |

### testnet3 chain API (wallet/tx side via mempool.space)

`MEMPOOL_TESTNET_API` default: `https://mempool.space/testnet/api`

| Endpoint | Purpose in SupTV |
| --- | --- |
| `GET /address/<addr>` | Reads confirmed/unconfirmed balance stats for composer wallet panels. |
| `GET /address/<addr>/utxo` | Fetches spendable UTXOs for main + derived change addresses. |
| `GET /v1/fees/recommended` | Gets fee estimates (falls back to default fee rate if unavailable). |
| `POST /tx` (body=`raw tx hex`) | Broadcasts signed legacy transaction for post send or consolidation. |

### IPFS/gateway checks

| Behavior | Purpose in SupTV |
| --- | --- |
| `HEAD` request to candidate gateway URL | Validates that an attachment URL/URN resolves and is reachable before adding to post. |

## Key configuration constants

In `index.html`, adjust:

- `P2FK_BASE_URL` (default: `https://p2fk.io`)
- `USE_P2FK_MAINNET` (default: `false`, intended for testnet3 flow)
- `MEMPOOL_TESTNET_API` (default: `https://mempool.space/testnet/api`)
- `TRENDING_STATS_LIMIT` (default: `100`)
- `TRENDING_SEARCH_QTY` (default: `200`)
- `STANDARD_SEARCH_QTY` (default: `200`)
- `IPFS_GATEWAY_URLS` (gateway list used for media resolution/verification)

## Security and usage notes

- Treat the built-in wallet as a convenience feature for **testnet3** posting workflow, not a production custody solution.
- Use your own trusted API/gateway endpoints if you need stronger privacy/censorship resistance.
- Public gateways and public APIs can see request metadata; self-hosting reduces third-party visibility.
