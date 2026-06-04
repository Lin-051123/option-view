# option view

`option view` is a lightweight options dashboard for comparing call and put open interest or volume by expiration date. Put options are shown separately in blue; call options are shown separately in red.

The page also includes an Option Volume Ranking table for a default 25-stock universe sorted by total option volume across all loaded expirations. The table shows symbol, company name, total option volume, call volume, put volume, volume put-call ratio, and market cap when the upstream quote source provides it.

## Run

For demo-only usage, open `index.html` directly.

For stock search and live polling, run the local server:

```bash
node server.mjs
```

Then open:

```text
http://localhost:4173
```

The browser refreshes option data every 60 seconds when Live API mode is enabled. Live mode does not silently replace failed API requests with synthetic values.

## Public Google Indexing

This app is prepared for Google indexing, but Google cannot index `localhost`. To make it searchable:

1. Deploy this folder to a public host such as Render, Railway, Fly.io, Vercel, or a VPS.
2. Set `SITE_URL` to the public origin, for example:

```bash
SITE_URL=https://your-domain.com node server.mjs
```

3. Make sure these public URLs return `200`:

```text
https://your-domain.com/
https://your-domain.com/robots.txt
https://your-domain.com/sitemap.xml
```

4. Add the domain to Google Search Console and submit:

```text
https://your-domain.com/sitemap.xml
```

The Node server dynamically generates canonical URLs, `robots.txt`, and `sitemap.xml` from `SITE_URL` or the request host.

## API Contract

The frontend calls:

```http
GET /api/symbol-search?q=AAPL&limit=12
GET /api/options-volume?symbols=ASTS,AAPL,MSFT&vendor=cboe&maxExpirations=52
```

Expected options response:

```json
{
  "data": [
    {
      "symbol": "ASTS",
      "name": "AST SpaceMobile",
      "exchange": "NASDAQ",
      "price": 42.15,
      "change": 1.21,
      "marketCap": 12345678900,
      "contracts": [
        {
          "side": "call",
          "strike": 100,
          "expiration": "2026-06-18",
          "expirationLabel": "06/18/26",
          "expirationType": "weekly",
          "label": "ASTS 06/18/26 100.0C",
          "openInterest": 52488,
          "buyVolume": 18400
        }
      ]
    }
  ]
}
```

## Data Source Notes

`server.mjs` uses Yahoo Finance search for user-entered symbol lookup, Nasdaq summary data for market cap, and Cboe delayed quotes for option-chain reads. The option numbers are real delayed market-data values from the upstream endpoint; they are not real-time exchange feeds and should be labeled as delayed.

For production real-time data:

1. Keep the frontend API shape above.
2. Replace the adapter inside `server.mjs` with your licensed TradingView, broker, OPRA, or market-data provider.
3. Return full `contracts` arrays so the UI can show many expirations and auto-aggregate calls, puts, totals, and ratios.

Real-time accuracy depends on the data provider. The frontend polls every 60 seconds, but delayed upstream data will still be delayed.

## Static Hosting Note

If you deploy as static files without `server.mjs`, replace `https://your-domain.com` in `robots.txt` and `sitemap.xml`, and replace `__SITE_ORIGIN__` in `index.html` with your real domain.
