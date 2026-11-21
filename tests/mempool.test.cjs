const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto, createHash } = require('node:crypto');
const { performance } = require('node:perf_hooks');

const html = fs.readFileSync('index.html', 'utf8');
const constants = html.slice(html.indexOf("    const MEMPOOL_TESTNET_API ="), html.indexOf("    const BTC_DUST_LIMIT_SAT ="))
  .replace('const MEMPOOL_INTERVAL_MS = 10000;', 'const MEMPOOL_INTERVAL_MS = 60;');
const helpers = html.slice(html.indexOf('    let mempoolPreferred = 0;'), html.indexOf('    const tickerLabel ='));

function setup(fetch) {
  const context = vm.createContext({ fetch, performance, setTimeout, clearTimeout, AbortController, crypto: webcrypto });
  vm.runInContext(`${constants}
    async function sha256Bytes(bytes) { return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)); }
    function bytesToHex(bytes) { return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''); }
    function hexToBytes(hex) { return new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16))); }
    ${helpers}
    globalThis.api = { mempoolRequest, mempoolJson, broadcastMempoolTx, MEMPOOL_APIS };`, context);
  return context.api;
}

function reply(status, text = '', headers = {}) {
  return new Response(text, { status, headers });
}

test('uses primary plus 47 Testnet3 nodes and retains failover preference', async () => {
  const calls = [];
  const api = setup(async url => {
    calls.push(url);
    return url.startsWith('https://mempool.space/') ? reply(503) : reply(200, '{"value":1}');
  });
  assert.equal(api.MEMPOOL_APIS.length, 48);
  assert.ok(api.MEMPOOL_APIS.every(url => url.endsWith('/testnet/api')));
  assert.equal((await api.mempoolJson('/address/a')).value, 1);
  await api.mempoolJson('/address/b');
  assert.match(calls[0], /^https:\/\/mempool\.space\//);
  assert.match(calls[1], /^https:\/\/node201\.va1\./);
  assert.match(calls[2], /^https:\/\/node201\.va1\./);
});

test('times out a stalled request and does not retry ordinary client errors', async () => {
  let count = 0;
  const api = setup((url, options) => {
    count++;
    if (count === 1) return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
    return Promise.resolve(reply(400, 'bad request'));
  });
  await assert.rejects(api.mempoolJson('/address/a'), /HTTP 400.*bad request/);
  assert.equal(count, 2);
});

test('limits concurrent request starts and pauses after 429', async () => {
  const starts = [];
  const api = setup(async url => {
    starts.push(performance.now());
    return reply(200, '{}');
  });
  await Promise.all(Array.from({ length: 11 }, (_, i) => api.mempoolJson(`/address/${i}`)));
  assert.ok(starts[10] - starts[0] >= 55, `11th request started after ${starts[10] - starts[0]}ms`);

  const retryStarts = [];
  const retryApi = setup(async () => {
    retryStarts.push(performance.now());
    return retryStarts.length === 1 ? reply(429) : reply(200, '{}');
  });
  await retryApi.mempoolJson('/address/a');
  assert.ok(retryStarts[1] - retryStarts[0] >= 55);
});

test('recognizes a previously accepted transaction after a failed broadcast response', async () => {
  let count = 0;
  const api = setup(async () => ++count === 1
    ? reply(503)
    : reply(400, 'sendrawtransaction RPC error: txn-already-in-mempool'));
  const raw = '01020304';
  const first = createHash('sha256').update(Buffer.from(raw, 'hex')).digest();
  const txid = Buffer.from(createHash('sha256').update(first).digest()).reverse().toString('hex');
  assert.equal(await api.broadcastMempoolTx(raw), txid);
});

test('rejects invalid responses and retries on another node', async () => {
  let count = 0;
  const api = setup(async () => ++count === 1 ? reply(200, 'not json') : reply(200, '{"ok":true}'));
  assert.equal((await api.mempoolJson('/address/a')).ok, true);
  assert.equal(count, 2);
});

test('honors Retry-After when longer than the normal queue pause', async () => {
  const starts = [];
  const api = setup(async () => {
    starts.push(performance.now());
    return starts.length === 1 ? reply(429, '', { 'Retry-After': '1' }) : reply(200, '{}');
  });
  await api.mempoolJson('/address/a');
  assert.ok(starts[1] - starts[0] >= 990);
});
