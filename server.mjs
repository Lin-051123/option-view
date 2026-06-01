import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};
const companyProfiles = {
  AAPL: { name: "Apple Inc.", exchange: "NASDAQ" },
  MSFT: { name: "Microsoft Corporation", exchange: "NASDAQ" },
  NVDA: { name: "NVIDIA Corporation", exchange: "NASDAQ" },
  TSLA: { name: "Tesla, Inc.", exchange: "NASDAQ" },
  AMD: { name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ" },
  META: { name: "Meta Platforms, Inc.", exchange: "NASDAQ" },
  AMZN: { name: "Amazon.com, Inc.", exchange: "NASDAQ" },
  GOOGL: { name: "Alphabet Inc.", exchange: "NASDAQ" },
  GOOG: { name: "Alphabet Inc.", exchange: "NASDAQ" },
  ASTS: { name: "AST SpaceMobile, Inc.", exchange: "NASDAQ" },
  NFLX: { name: "Netflix, Inc.", exchange: "NASDAQ" },
  AVGO: { name: "Broadcom Inc.", exchange: "NASDAQ" },
  PLTR: { name: "Palantir Technologies Inc.", exchange: "NYSE" },
  MU: { name: "Micron Technology, Inc.", exchange: "NASDAQ" },
  INTC: { name: "Intel Corporation", exchange: "NASDAQ" },
  COIN: { name: "Coinbase Global, Inc.", exchange: "NASDAQ" },
  MSTR: { name: "MicroStrategy Incorporated", exchange: "NASDAQ" },
  ARM: { name: "Arm Holdings plc", exchange: "NASDAQ" },
  SMCI: { name: "Super Micro Computer, Inc.", exchange: "NASDAQ" },
  APP: { name: "AppLovin Corporation", exchange: "NASDAQ" },
  RIVN: { name: "Rivian Automotive, Inc.", exchange: "NASDAQ" },
  SOFI: { name: "SoFi Technologies, Inc.", exchange: "NASDAQ" },
  HOOD: { name: "Robinhood Markets, Inc.", exchange: "NASDAQ" },
  JPM: { name: "JPMorgan Chase & Co.", exchange: "NYSE" },
  BAC: { name: "Bank of America Corporation", exchange: "NYSE" },
  XOM: { name: "Exxon Mobil Corporation", exchange: "NYSE" },
  CVX: { name: "Chevron Corporation", exchange: "NYSE" },
  OXY: { name: "Occidental Petroleum Corporation", exchange: "NYSE" },
  UNH: { name: "UnitedHealth Group Incorporated", exchange: "NYSE" },
  LLY: { name: "Eli Lilly and Company", exchange: "NYSE" },
  WMT: { name: "Walmart Inc.", exchange: "NYSE" },
  DIS: { name: "The Walt Disney Company", exchange: "NYSE" },
  NKE: { name: "NIKE, Inc.", exchange: "NYSE" },
  COST: { name: "Costco Wholesale Corporation", exchange: "NASDAQ" },
  CRM: { name: "Salesforce, Inc.", exchange: "NYSE" },
  ORCL: { name: "Oracle Corporation", exchange: "NYSE" },
  BA: { name: "The Boeing Company", exchange: "NYSE" },
  GE: { name: "GE Aerospace", exchange: "NYSE" },
  F: { name: "Ford Motor Company", exchange: "NYSE" },
  GM: { name: "General Motors Company", exchange: "NYSE" },
  UBER: { name: "Uber Technologies, Inc.", exchange: "NYSE" },
  SHOP: { name: "Shopify Inc.", exchange: "NYSE" },
  SNOW: { name: "Snowflake Inc.", exchange: "NYSE" },
  BABA: { name: "Alibaba Group Holding Limited", exchange: "NYSE" },
  TSM: { name: "Taiwan Semiconductor Manufacturing Company Limited", exchange: "NYSE" },
  NIO: { name: "NIO Inc.", exchange: "NYSE" },
  PFE: { name: "Pfizer Inc.", exchange: "NYSE" },
  MRK: { name: "Merck & Co., Inc.", exchange: "NYSE" },
  RGTI: { name: "Rigetti Computing, Inc.", exchange: "NASDAQ" },
  NOK: { name: "Nokia Oyj", exchange: "NYSE" },
  QCOM: { name: "QUALCOMM Incorporated", exchange: "NASDAQ" },
  SPY: { name: "SPDR S&P 500 ETF Trust", exchange: "AMEX" },
  QQQ: { name: "Invesco QQQ Trust", exchange: "NASDAQ" }
};
const symbolCache = new Map();
const cacheTtlMs = 5 * 60 * 1000;
const quoteCache = new Map();
const quoteCacheTtlMs = 15 * 1000;
const candleCache = new Map();
const candleCacheTtlMs = 60 * 1000;

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (url.pathname === "/api/symbol-search") {
      await handleSymbolSearch(url, response);
      return;
    }
    if (url.pathname === "/api/options-volume") {
      await handleOptionsVolume(url, response);
      return;
    }
    if (url.pathname === "/api/quote") {
      await handleQuote(url, response);
      return;
    }
    if (url.pathname === "/api/candles") {
      await handleCandles(url, response);
      return;
    }
    if (url.pathname === "/robots.txt") {
      await handleRobots(request, response);
      return;
    }
    if (url.pathname === "/sitemap.xml") {
      await handleSitemap(request, response);
      return;
    }
    await serveStatic(url, request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
}).listen(port, () => {
  console.log(`option view running at http://localhost:${port}`);
});

async function handleSymbolSearch(url, response) {
  const q = (url.searchParams.get("q") || "").trim();
  const limit = clamp(Number(url.searchParams.get("limit") || 12), 1, 50);
  if (!q) {
    sendJson(response, 200, { data: [] });
    return;
  }
  const endpoint = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=${limit}&newsCount=0&listsCount=0`;
  const payload = await fetchJson(endpoint);
  const data = (payload.quotes || [])
    .filter((quote) => ["EQUITY", "ETF"].includes(quote.quoteType))
    .slice(0, limit)
    .map((quote) => ({
      symbol: normalizeDisplaySymbol(quote.symbol),
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: normalizeExchange(quote.exchange),
      type: quote.quoteType
    }));
  sendJson(response, 200, { data });
}

async function handleOptionsVolume(url, response) {
  const symbols = [...new Set((url.searchParams.get("symbols") || "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => /^[A-Z0-9.-]{1,12}$/.test(symbol)))]
    .slice(0, 25);
  const maxExpirations = clamp(Number(url.searchParams.get("maxExpirations") || 24), 1, 52);
  if (!symbols.length) {
    sendJson(response, 200, { data: [] });
    return;
  }

  const data = await mapWithConcurrency(symbols, 2, async (symbol) => {
    try {
      return await fetchOptionsForSymbol(symbol, maxExpirations);
    } catch (error) {
      return {
        symbol,
        name: companyProfiles[symbol]?.name || symbol,
        exchange: companyProfiles[symbol]?.exchange || "NASDAQ",
        price: 0,
        change: 0,
        marketCap: null,
        contracts: [],
        error: error.message || "No data"
      };
    }
  });
  sendJson(response, 200, {
    provider: "cboe-delayed-quotes-adapter",
    refreshedAt: new Date().toISOString(),
    data
  });
}

async function handleQuote(url, response) {
  const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(symbol)) {
    sendJson(response, 400, { error: "Invalid symbol" });
    return;
  }
  try {
    const quote = await fetchQuoteForSymbol(symbol);
    sendJson(response, 200, {
      provider: "cboe-delayed-quote-adapter",
      refreshedAt: new Date().toISOString(),
      data: quote
    });
  } catch (error) {
    sendJson(response, 502, {
      provider: "cboe-delayed-quote-adapter",
      refreshedAt: new Date().toISOString(),
      error: error.message || "Unable to load quote"
    });
  }
}

async function handleCandles(url, response) {
  const symbol = (url.searchParams.get("symbol") || "").trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(symbol)) {
    sendJson(response, 400, { error: "Invalid symbol" });
    return;
  }
  try {
    const candles = await fetchCandlesForSymbol(symbol);
    sendJson(response, 200, {
      provider: "nasdaq-historical-adapter",
      refreshedAt: new Date().toISOString(),
      data: candles
    });
  } catch (error) {
    sendJson(response, 502, {
      provider: "nasdaq-historical-adapter",
      refreshedAt: new Date().toISOString(),
      error: error.message || "Unable to load candlestick data"
    });
  }
}

async function fetchOptionsForSymbol(symbol, maxExpirations) {
  const cacheKey = `${symbol}:${maxExpirations}`;
  const cached = symbolCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < cacheTtlMs) {
    return cached.data;
  }
  const profile = await fetchCompanyProfile(symbol);
  const cboeSymbol = toCboeSymbol(symbol);
  const payload = await fetchJson(`https://cdn.cboe.com/api/global/delayed_quotes/options/${encodeURIComponent(cboeSymbol)}.json`);
  const data = payload.data;
  if (!data || !Array.isArray(data.options)) {
    throw new Error(`No option chain returned for ${symbol}`);
  }

  const contracts = data.options
    .map((contract) => normalizeOptionContract(symbol, contract))
    .filter(Boolean);
  const allowedExpirations = unique(contracts.map((contract) => contract.expiration))
    .sort()
    .slice(0, maxExpirations);

  const result = {
    symbol,
    name: profile.name || data.symbol || symbol,
    exchange: profile.exchange || normalizeExchange(data.exchange_id),
    price: numberOrZero(data.current_price),
    change: numberOrZero(data.price_change_percent),
    marketCap: profile.marketCap,
    contracts: contracts.filter((contract) => allowedExpirations.includes(contract.expiration))
  };
  symbolCache.set(cacheKey, { savedAt: Date.now(), data: result });
  return result;
}

async function fetchCandlesForSymbol(symbol) {
  const cached = candleCache.get(symbol);
  if (cached && Date.now() - cached.savedAt < candleCacheTtlMs) {
    return cached.data;
  }
  const toDate = isoDate(new Date());
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const fromDate = isoDate(from);
  const payload = await fetchJson(
    `https://api.nasdaq.com/api/quote/${encodeURIComponent(toYahooSymbol(symbol))}/historical?assetclass=stocks&fromdate=${fromDate}&todate=${toDate}&limit=10`,
    nasdaqHeaders()
  );
  const rows = payload.data?.tradesTable?.rows;
  if (!Array.isArray(rows)) {
    throw new Error(`No historical candles returned for ${symbol}`);
  }
  const candles = rows
    .map((row) => normalizeHistoricalCandle(row))
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5);
  if (!candles.length) {
    throw new Error(`No historical candles returned for ${symbol}`);
  }
  candleCache.set(symbol, { savedAt: Date.now(), data: candles });
  return candles;
}

async function fetchQuoteForSymbol(symbol) {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.savedAt < quoteCacheTtlMs) {
    return { ...cached.data, cached: true };
  }
  const cboeSymbol = toCboeSymbol(symbol);
  try {
    const payload = await fetchJson(`https://cdn.cboe.com/api/global/delayed_quotes/quotes/${encodeURIComponent(cboeSymbol)}.json`);
    const data = payload.data;
    if (!data || !Number.isFinite(Number(data.current_price))) {
      throw new Error(`No quote returned for ${symbol}`);
    }
    const quote = {
      symbol,
      exchange: normalizeExchange(data.exchange_id),
      price: numberOrZero(data.current_price),
      change: numberOrZero(data.price_change_percent),
      priceChange: numberOrZero(data.price_change),
      bid: numberOrNull(data.bid),
      ask: numberOrNull(data.ask),
      volume: numberOrZero(data.volume),
      lastTradeTime: data.last_trade_time || "",
      timestamp: payload.timestamp || "",
      source: "cboe-delayed-quote"
    };
    quoteCache.set(symbol, { savedAt: Date.now(), data: quote });
    return quote;
  } catch (error) {
    if (cached) {
      return { ...cached.data, stale: true, warning: error.message || "Quote refresh failed" };
    }
    const optionQuote = cachedOptionQuote(symbol);
    if (optionQuote) {
      quoteCache.set(symbol, { savedAt: Date.now(), data: optionQuote });
      return { ...optionQuote, stale: true, warning: error.message || "Quote refresh failed" };
    }
    throw error;
  }
}

function cachedOptionQuote(symbol) {
  for (const [key, cached] of symbolCache) {
    if (!key.startsWith(`${symbol}:`) || !cached?.data || cached.data.price <= 0) {
      continue;
    }
    return {
      symbol,
      exchange: cached.data.exchange,
      price: numberOrZero(cached.data.price),
      change: numberOrZero(cached.data.change),
      priceChange: 0,
      bid: null,
      ask: null,
      volume: 0,
      lastTradeTime: "",
      timestamp: new Date(cached.savedAt).toISOString(),
      source: "cboe-options-chain-cache"
    };
  }
  return null;
}

async function fetchCompanyProfile(symbol) {
  const fallback = companyProfiles[symbol] || { name: symbol, exchange: "NASDAQ" };
  const nasdaqMarketCap = await fetchNasdaqMarketCap(symbol).catch(() => null);
  return { ...fallback, marketCap: nasdaqMarketCap };
}

async function fetchNasdaqMarketCap(symbol) {
  const payload = await fetchJson(
    `https://api.nasdaq.com/api/quote/${encodeURIComponent(toYahooSymbol(symbol))}/summary?assetclass=stocks`,
    nasdaqHeaders()
  );
  return parseFormattedNumber(payload.data?.summaryData?.MarketCap?.value);
}

function nasdaqHeaders() {
  return {
    accept: "application/json",
    "user-agent": "Mozilla/5.0",
    origin: "https://www.nasdaq.com",
    referer: "https://www.nasdaq.com/"
  };
}

function normalizeHistoricalCandle(row) {
  const date = isoDateFromNasdaqDate(row.date);
  const open = parseFormattedNumber(row.open);
  const high = parseFormattedNumber(row.high);
  const low = parseFormattedNumber(row.low);
  const close = parseFormattedNumber(row.close);
  if (!date || ![open, high, low, close].every(Number.isFinite)) {
    return null;
  }
  return {
    date,
    label: row.date,
    open,
    high,
    low,
    close,
    volume: parseFormattedNumber(row.volume)
  };
}

function normalizeOptionContract(symbol, contract) {
  const parsed = parseOsiSymbol(contract.option);
  if (!parsed) {
    return null;
  }
  const expiration = parsed.expiration;
  const expirationLabel = labelFromIso(expiration);
  return {
    symbol,
    side: parsed.side,
    strike: parsed.strike,
    expiration,
    expirationLabel,
    expirationType: "listed",
    label: `${symbol} ${expirationLabel} ${parsed.strike.toFixed(1)}${parsed.side === "call" ? "C" : "P"}`,
    openInterest: numberOrZero(contract.open_interest),
    buyVolume: numberOrZero(contract.volume),
    delta: numberOrZero(contract.delta),
    gamma: numberOrZero(contract.gamma),
    iv: numberOrZero(contract.iv)
  };
}

async function serveStatic(url, request, response) {
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(root, decodeURIComponent(pathname)));
  if (!filePath.startsWith(root)) {
    sendText(response, 403, "Forbidden");
    return;
  }
  let body = await readFile(filePath);
  if (pathname === "/index.html") {
    body = Buffer.from(body.toString("utf8").replaceAll("__SITE_ORIGIN__", siteOriginFromRequest(request)));
  }
  response.writeHead(200, {
    "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "cache-control": "no-store"
  });
  response.end(body);
}

async function handleRobots(request, response) {
  const origin = siteOriginFromRequest(request);
  sendText(response, 200, `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
}

async function handleSitemap(request, response) {
  const origin = siteOriginFromRequest(request);
  response.writeHead(200, {
    "content-type": "application/xml; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeXml(origin)}/</loc>\n    <changefreq>hourly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`);
}

async function fetchJson(url, headers = {}) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "option-view/1.0",
      ...headers
    }
  });
  if (!response.ok) {
    throw new Error(`Upstream ${response.status} for ${url}`);
  }
  return response.json();
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, status, body) {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(body);
}

function siteOriginFromRequest(request) {
  if (process.env.SITE_URL) {
    return process.env.SITE_URL.replace(/\/$/, "");
  }
  const host = request.headers.host || `localhost:${port}`;
  const forwardedProto = request.headers["x-forwarded-proto"];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || (request.socket?.encrypted ? "https" : "http");
  return `${proto}://${host}`;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeExchange(exchange) {
  const key = String(exchange || "").toUpperCase();
  const map = {
    NMS: "NASDAQ",
    NCM: "NASDAQ",
    NGM: "NASDAQ",
    NAS: "NASDAQ",
    NYQ: "NYSE",
    NYS: "NYSE",
    ASE: "AMEX",
    PCX: "AMEX",
    "1": "NYSE",
    "2": "NASDAQ",
    "3": "AMEX"
  };
  return map[key] || key || "NASDAQ";
}

function normalizeDisplaySymbol(symbol) {
  return String(symbol || "").toUpperCase().replace(/-/g, ".");
}

function toCboeSymbol(symbol) {
  return String(symbol || "").toUpperCase().replace(/\./g, "_");
}

function toYahooSymbol(symbol) {
  return String(symbol || "").toUpperCase().replace(/\./g, "-");
}

function parseOsiSymbol(value) {
  const match = String(value || "").match(/^(.+?)(\d{6})([CP])(\d{8})$/);
  if (!match) {
    return null;
  }
  const [, , yymmdd, sideCode, strikeCode] = match;
  const year = `20${yymmdd.slice(0, 2)}`;
  const month = yymmdd.slice(2, 4);
  const day = yymmdd.slice(4, 6);
  return {
    expiration: `${year}-${month}-${day}`,
    side: sideCode === "P" ? "put" : "call",
    strike: Number(strikeCode) / 1000
  };
}

function labelFromIso(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value || "N/A";
  }
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${yy}`;
}

function isoDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoDateFromNasdaqDate(value) {
  const match = String(value || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return "";
  }
  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function numberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function numberOrNull(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseFormattedNumber(value) {
  const cleaned = String(value || "").replace(/[$,%\s,]/g, "");
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
      await sleep(200);
    }
  });
  await Promise.all(runners);
  return results;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function unique(values) {
  return [...new Set(values)];
}
