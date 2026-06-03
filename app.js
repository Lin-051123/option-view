const DEFAULT_SYMBOLS = [
  "NVDA", "TSLA", "AAPL", "AMD", "MSFT", "AMZN", "META", "PLTR", "ASTS", "MU",
  "INTC", "COIN", "MSTR", "NFLX", "GOOGL", "AVGO", "ARM", "SMCI", "APP", "RIVN",
  "SOFI", "HOOD", "JPM", "BAC", "XOM"
];
const REFRESH_MS = 60000;
const FUTU_REFRESH_MS = 15000;
const QUOTE_REFRESH_MS = 5000;
const TRADINGVIEW_SCRIPT_URL = "https://s3.tradingview.com/tv.js";
const LOCAL_SYMBOLS = [
  ["AAPL", "Apple Inc.", "NASDAQ"],
  ["MSFT", "Microsoft Corporation", "NASDAQ"],
  ["NVDA", "NVIDIA Corporation", "NASDAQ"],
  ["TSLA", "Tesla, Inc.", "NASDAQ"],
  ["AMD", "Advanced Micro Devices, Inc.", "NASDAQ"],
  ["META", "Meta Platforms, Inc.", "NASDAQ"],
  ["AMZN", "Amazon.com, Inc.", "NASDAQ"],
  ["GOOGL", "Alphabet Inc.", "NASDAQ"],
  ["GOOG", "Alphabet Inc.", "NASDAQ"],
  ["ASTS", "AST SpaceMobile, Inc.", "NASDAQ"],
  ["NFLX", "Netflix, Inc.", "NASDAQ"],
  ["AVGO", "Broadcom Inc.", "NASDAQ"],
  ["COST", "Costco Wholesale Corporation", "NASDAQ"],
  ["PEP", "PepsiCo, Inc.", "NASDAQ"],
  ["ADBE", "Adobe Inc.", "NASDAQ"],
  ["INTC", "Intel Corporation", "NASDAQ"],
  ["CSCO", "Cisco Systems, Inc.", "NASDAQ"],
  ["QCOM", "QUALCOMM Incorporated", "NASDAQ"],
  ["CRM", "Salesforce, Inc.", "NYSE"],
  ["ORCL", "Oracle Corporation", "NYSE"],
  ["HPE", "Hewlett Packard Enterprise Company", "NYSE"],
  ["BA", "The Boeing Company", "NYSE"],
  ["GE", "GE Aerospace", "NYSE"],
  ["F", "Ford Motor Company", "NYSE"],
  ["GM", "General Motors Company", "NYSE"],
  ["BABA", "Alibaba Group Holding Limited", "NYSE"],
  ["TSM", "Taiwan Semiconductor Manufacturing Company Limited", "NYSE"],
  ["NIO", "NIO Inc.", "NYSE"],
  ["MRK", "Merck & Co., Inc.", "NYSE"],
  ["RGTI", "Rigetti Computing, Inc.", "NASDAQ"],
  ["NOK", "Nokia Oyj", "NYSE"],
  ["AMAT", "Applied Materials, Inc.", "NASDAQ"],
  ["MU", "Micron Technology, Inc.", "NASDAQ"],
  ["PYPL", "PayPal Holdings, Inc.", "NASDAQ"],
  ["SBUX", "Starbucks Corporation", "NASDAQ"],
  ["PLTR", "Palantir Technologies Inc.", "NYSE"],
  ["SNOW", "Snowflake Inc.", "NYSE"],
  ["SHOP", "Shopify Inc.", "NYSE"],
  ["UBER", "Uber Technologies, Inc.", "NYSE"],
  ["COIN", "Coinbase Global, Inc.", "NASDAQ"],
  ["RIVN", "Rivian Automotive, Inc.", "NASDAQ"],
  ["SOFI", "SoFi Technologies, Inc.", "NASDAQ"],
  ["HOOD", "Robinhood Markets, Inc.", "NASDAQ"],
  ["MSTR", "MicroStrategy Incorporated", "NASDAQ"],
  ["ARM", "Arm Holdings plc", "NASDAQ"],
  ["SMCI", "Super Micro Computer, Inc.", "NASDAQ"],
  ["BBAI", "BigBear.ai Holdings, Inc.", "NYSE"],
  ["IONQ", "IonQ, Inc.", "NYSE"],
  ["APP", "AppLovin Corporation", "NASDAQ"],
  ["CRWD", "CrowdStrike Holdings, Inc.", "NASDAQ"],
  ["PANW", "Palo Alto Networks, Inc.", "NASDAQ"],
  ["DDOG", "Datadog, Inc.", "NASDAQ"],
  ["NET", "Cloudflare, Inc.", "NYSE"],
  ["JPM", "JPMorgan Chase & Co.", "NYSE"],
  ["BAC", "Bank of America Corporation", "NYSE"],
  ["WFC", "Wells Fargo & Company", "NYSE"],
  ["GS", "The Goldman Sachs Group, Inc.", "NYSE"],
  ["MS", "Morgan Stanley", "NYSE"],
  ["V", "Visa Inc.", "NYSE"],
  ["MA", "Mastercard Incorporated", "NYSE"],
  ["BRK.B", "Berkshire Hathaway Inc.", "NYSE"],
  ["UNH", "UnitedHealth Group Incorporated", "NYSE"],
  ["LLY", "Eli Lilly and Company", "NYSE"],
  ["JNJ", "Johnson & Johnson", "NYSE"],
  ["PFE", "Pfizer Inc.", "NYSE"],
  ["MRNA", "Moderna, Inc.", "NASDAQ"],
  ["XOM", "Exxon Mobil Corporation", "NYSE"],
  ["CVX", "Chevron Corporation", "NYSE"],
  ["OXY", "Occidental Petroleum Corporation", "NYSE"],
  ["DIS", "The Walt Disney Company", "NYSE"],
  ["NKE", "NIKE, Inc.", "NYSE"],
  ["WMT", "Walmart Inc.", "NYSE"],
  ["TGT", "Target Corporation", "NYSE"],
  ["HD", "The Home Depot, Inc.", "NYSE"],
  ["LOW", "Lowe's Companies, Inc.", "NYSE"],
  ["SPY", "SPDR S&P 500 ETF Trust", "AMEX"],
  ["QQQ", "Invesco QQQ Trust", "NASDAQ"],
  ["IWM", "iShares Russell 2000 ETF", "AMEX"],
  ["DIA", "SPDR Dow Jones Industrial Average ETF", "AMEX"],
  ["TLT", "iShares 20+ Year Treasury Bond ETF", "NASDAQ"],
  ["GLD", "SPDR Gold Shares", "AMEX"],
  ["SLV", "iShares Silver Trust", "AMEX"]
].map(([symbol, name, exchange]) => ({ symbol, name, exchange }));

const state = {
  symbols: [...DEFAULT_SYMBOLS],
  selectedSymbol: "ASTS",
  selectedExpiry: "",
  metric: "openInterest",
  source: "auto",
  topCount: 20,
  rows: [],
  sourceLabel: "Live API",
  sourceTimestamp: "",
  error: "",
  refreshTimer: null,
  quoteTimer: null,
  quoteLoading: false,
  quotes: {},
  chartRequestId: 0,
  loading: false,
  demoTick: 0
};

const dom = {
  symbolSearch: document.querySelector("#symbolSearch"),
  symbolSuggestions: document.querySelector("#symbolSuggestions"),
  addSymbolButton: document.querySelector("#addSymbolButton"),
  symbolsInput: document.querySelector("#symbolsInput"),
  symbolSelect: document.querySelector("#symbolSelect"),
  metricSelect: document.querySelector("#metricSelect"),
  expirySelect: document.querySelector("#expirySelect"),
  sourceSelect: document.querySelector("#sourceSelect"),
  autoRefresh: document.querySelector("#autoRefresh"),
  refreshHint: document.querySelector("#refreshHint"),
  topCount: document.querySelector("#topCount"),
  topCountValue: document.querySelector("#topCountValue"),
  refreshButton: document.querySelector("#refreshButton"),
  resetButton: document.querySelector("#resetButton"),
  sourceBadge: document.querySelector("#sourceBadge"),
  updatedAt: document.querySelector("#updatedAt"),
  reportKicker: document.querySelector("#reportKicker"),
  reportTitle: document.querySelector("#reportTitle"),
  selectedQuote: document.querySelector("#selectedQuote"),
  summaryLine: document.querySelector("#summaryLine"),
  dataNotice: document.querySelector("#dataNotice"),
  summaryTable: document.querySelector("#summaryTable"),
  candleTitle: document.querySelector("#candleTitle"),
  candleMeta: document.querySelector("#candleMeta"),
  candleChart: document.querySelector("#candleChart"),
  squeezeSignals: document.querySelector("#squeezeSignals"),
  rankingBody: document.querySelector("#rankingBody"),
  chartTitle: document.querySelector("#chartTitle"),
  chartLine: document.querySelector("#chartLine"),
  putChart: document.querySelector("#putChart"),
  putAxisMid: document.querySelector("#putAxisMid"),
  putAxisMax: document.querySelector("#putAxisMax"),
  callChart: document.querySelector("#callChart"),
  callAxisMid: document.querySelector("#callAxisMid"),
  callAxisMax: document.querySelector("#callAxisMax"),
  axisLabel: document.querySelector("#axisLabel"),
  symbolTabs: document.querySelector("#symbolTabs"),
  tradingViewLink: document.querySelector("#tradingViewLink")
};

let searchTimer;
let tradingViewScriptPromise;
let focusedSymbolRequestId = 0;

function parseSymbols(value) {
  return [...new Set(value
    .split(/[,\s]+/)
    .map((item) => item.trim().toUpperCase())
    .filter((item) => /^[A-Z0-9.-]{1,12}$/.test(item)))]
    .slice(0, 25);
}

function syncSymbolsInput() {
  dom.symbolsInput.value = state.symbols.join(", ");
}

function configureLocalDataSources() {
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const futuOption = [...dom.sourceSelect.options].find((option) => option.value === "futu");
  if (futuOption && !isLocalhost) {
    futuOption.disabled = true;
    futuOption.textContent = "Futu OpenD (local only)";
  }
}

function placeholderRow(symbol) {
  const profile = LOCAL_SYMBOLS.find((item) => item.symbol === symbol);
  return {
    symbol,
    name: profile?.name || symbol,
    exchange: profile?.exchange || "NASDAQ",
    price: 0,
    change: 0,
    marketCap: null,
    contracts: [],
    loading: true
  };
}

function mergeRows(incomingRows) {
  const rowsBySymbol = new Map(state.rows.map((row) => [row.symbol, row]));
  incomingRows.forEach((row) => rowsBySymbol.set(row.symbol, row));
  return state.symbols
    .map((symbol) => rowsBySymbol.get(symbol))
    .filter(Boolean);
}

function seededRandom(seed) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return () => {
    hash += hash << 13;
    hash ^= hash >>> 7;
    hash += hash << 3;
    hash ^= hash >>> 17;
    hash += hash << 5;
    return ((hash >>> 0) % 10000) / 10000;
  };
}

function nextFridays(count) {
  const start = new Date();
  const day = start.getDay();
  const delta = (5 - day + 7) % 7 || 7;
  const expiries = Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + delta + index * 7);
    return expiryFromDate(date);
  });
  if (!expiries.some((expiry) => expiry.value === "2026-06-18")) {
    expiries.splice(0, 0, {
      value: "2026-06-18",
      label: "06/18/26",
      type: "weekly"
    });
  }
  return expiries.slice(0, count);
}

function expiryFromDate(date) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return {
    value: `${date.getFullYear()}-${mm}-${dd}`,
    label: `${mm}/${dd}/${yy}`,
    type: "weekly"
  };
}

function demoData(symbols) {
  const expiries = nextFridays(52);
  return symbols.map((symbol) => {
    const profile = LOCAL_SYMBOLS.find((item) => item.symbol === symbol);
    const random = seededRandom(`${Math.floor(Date.now() / REFRESH_MS)}-${state.demoTick}-${symbol}`);
    const spot = 20 + random() * 480;
    const contracts = [];
    expiries.forEach((expiry, expiryIndex) => {
      const distanceBase = expiryIndex + 1;
      for (let index = 0; index < 16; index += 1) {
        const callStrike = Math.max(1, Math.round((spot + (index - 4) * (2 + random() * 6)) / 5) * 5);
        const putStrike = Math.max(1, Math.round((spot - (index - 3) * (2 + random() * 6)) / 5) * 5);
        contracts.push(createContract(symbol, expiry, "call", callStrike, random, distanceBase, index));
        contracts.push(createContract(symbol, expiry, "put", putStrike, random, distanceBase, index));
      }
    });
    return {
      symbol,
      name: profile?.name || symbol,
      exchange: profile?.exchange || "NASDAQ",
      price: spot,
      change: -4 + random() * 8,
      marketCap: null,
      contracts
    };
  });
}

function createContract(symbol, expiry, side, strike, random, distanceBase, index) {
  const sideBias = side === "call" ? 1.22 : 0.82;
  const rankCurve = Math.max(0.12, 1 - index * 0.055);
  const expiryCurve = 1 / Math.sqrt(distanceBase);
  const openInterest = Math.round((8000 + random() * 52000) * sideBias * rankCurve * expiryCurve);
  const buyVolume = Math.round(openInterest * (0.08 + random() * 0.28));
  return {
    symbol,
    side,
    strike,
    expiration: expiry.value,
    expirationLabel: expiry.label,
    expirationType: expiry.type,
    label: `${symbol} ${expiry.label} ${strike.toFixed(1)}${side === "call" ? "C" : "P"}`,
    openInterest,
    buyVolume
  };
}

async function fetchBackendData(symbols) {
  const params = new URLSearchParams({
    symbols: symbols.join(","),
    vendor: "tradingview",
    source: state.source === "futu" ? "futu" : "cboe",
    maxExpirations: "52",
    t: String(Date.now())
  });
  const response = await fetch(`./api/options-volume?${params.toString()}`, {
    cache: "no-store",
    headers: { accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }
  const payload = await response.json();
  if (!Array.isArray(payload.data)) {
    throw new Error("Invalid options response");
  }
  return {
    provider: payload.provider || "Live API",
    refreshedAt: payload.refreshedAt || "",
    data: payload.data.map(normalizeRow)
  };
}

async function fetchSelectedQuote(symbol) {
  const params = new URLSearchParams({
    symbol,
    source: state.source === "futu" ? "futu" : "cboe",
    t: String(Date.now())
  });
  const response = await fetch(`./api/quote?${params.toString()}`, {
    cache: "no-store",
    headers: { accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Quote API ${response.status}`);
  }
  const payload = await response.json();
  if (!payload.data || payload.data.symbol !== symbol) {
    throw new Error("Invalid quote response");
  }
  return payload.data;
}

function normalizeRow(row) {
  const symbol = String(row.symbol || "").toUpperCase();
  const profile = LOCAL_SYMBOLS.find((item) => item.symbol === symbol);
  const rawContracts = Array.isArray(row.contracts)
    ? row.contracts
    : [...(row.topCalls || []), ...(row.topPuts || [])];
  return {
    symbol,
    name: row.name || profile?.name || symbol,
    exchange: row.exchange || profile?.exchange || "NASDAQ",
    price: finiteNumber(row.price),
    change: finiteNumber(row.change),
    priceChange: finiteNumber(row.priceChange),
    bid: nullableNumber(row.bid),
    ask: nullableNumber(row.ask),
    quoteVolume: finiteNumber(row.volume),
    lastTradeTime: row.lastTradeTime || "",
    quoteTimestamp: row.timestamp || row.quoteTimestamp || "",
    quoteSource: row.source || row.quoteSource || "",
    quoteStale: Boolean(row.stale || row.quoteStale),
    quoteWarning: row.warning || row.quoteWarning || "",
    marketCap: nullableNumber(row.marketCap),
    error: row.error || "",
    contracts: rawContracts.map((contract) => normalizeContract(symbol, contract))
  };
}

function normalizeContract(symbol, contract) {
  const side = String(contract.side || contract.type || "").toLowerCase().startsWith("p") ? "put" : "call";
  const expiration = String(contract.expiration || contract.expiry || "");
  const strike = finiteNumber(contract.strike);
  return {
    symbol,
    side,
    strike,
    expiration,
    expirationLabel: contract.expirationLabel || formatExpiryLabel(expiration),
    expirationType: contract.expirationType || "weekly",
    label: contract.label || contract.contract || `${symbol} ${formatExpiryLabel(expiration)} ${strike.toFixed(1)}${side === "call" ? "C" : "P"}`,
    openInterest: finiteNumber(contract.openInterest ?? contract.oi),
    buyVolume: finiteNumber(contract.buyVolume ?? contract.volume),
    delta: finiteNumber(contract.delta),
    gamma: finiteNumber(contract.gamma),
    iv: finiteNumber(contract.iv)
  };
}

function finiteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function nullableNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatExpiryLabel(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value || "N/A";
  }
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${yy}`;
}

async function loadData() {
  if (state.loading) {
    return;
  }
  state.symbols = parseSymbols(dom.symbolsInput.value);
  if (!state.symbols.length) {
    state.rows = [];
    render();
    return;
  }
  if (!state.symbols.includes(state.selectedSymbol)) {
    state.selectedSymbol = state.symbols[0];
  }

  state.loading = true;
  dom.refreshButton.disabled = true;
  try {
    if (state.source === "demo") {
      state.demoTick += 1;
      state.rows = demoData(state.symbols);
      state.sourceLabel = "Demo";
      state.sourceTimestamp = new Date().toISOString();
      state.error = "";
    } else {
      const payload = await fetchBackendData(state.symbols);
      state.rows = mergeRows(payload.data);
      state.sourceLabel = sourceLabelFor(payload.provider);
      state.sourceTimestamp = payload.refreshedAt;
      state.error = "";
    }
  } catch (error) {
    state.rows = [];
    state.sourceLabel = "Live API error";
    state.sourceTimestamp = "";
    state.error = error.message || "Unable to load live market data.";
  } finally {
    state.loading = false;
    dom.refreshButton.disabled = false;
    syncOptions();
    render();
    scheduleRefresh();
  }
}

function selectedRow() {
  return state.rows.find((row) => row.symbol === state.selectedSymbol) || state.rows[0];
}

function expiriesFor(row) {
  return [...new Map((row?.contracts || []).map((contract) => [
    contract.expiration,
    {
      value: contract.expiration,
      label: contract.expirationLabel || formatExpiryLabel(contract.expiration),
      type: contract.expirationType || "weekly"
    }
  ])).values()]
    .filter((expiry) => expiry.value)
    .sort((a, b) => a.value.localeCompare(b.value));
}

function currentContracts(row) {
  const contracts = row?.contracts || [];
  if (!state.selectedExpiry) {
    return contracts;
  }
  return contracts.filter((contract) => contract.expiration === state.selectedExpiry);
}

function metricLabel() {
  return state.metric === "openInterest" ? "Open Interest" : "Volume";
}

function syncOptions() {
  dom.symbolSelect.replaceChildren();
  state.rows.forEach((row) => {
    const option = document.createElement("option");
    option.value = row.symbol;
    option.textContent = row.symbol;
    dom.symbolSelect.append(option);
  });
  if (!state.rows.some((row) => row.symbol === state.selectedSymbol)) {
    state.selectedSymbol = state.rows[0]?.symbol || "";
  }
  dom.symbolSelect.value = state.selectedSymbol;

  const expiries = expiriesFor(selectedRow());
  if (!expiries.some((expiry) => expiry.value === state.selectedExpiry)) {
    state.selectedExpiry = expiries[0]?.value || "";
  }

  dom.expirySelect.replaceChildren();
  expiries.forEach((expiry) => {
    const option = document.createElement("option");
    option.value = expiry.value;
    option.textContent = `${expiry.label} (${expiry.type})`;
    dom.expirySelect.append(option);
  });
  dom.expirySelect.value = state.selectedExpiry;
}

function render() {
  const row = selectedRow();
  if (!row) {
    renderEmpty();
    return;
  }

  const contracts = currentContracts(row);
  const calls = contracts.filter((contract) => contract.side === "call");
  const puts = contracts.filter((contract) => contract.side === "put");
  const callTotal = sumMetric(calls);
  const putTotal = sumMetric(puts);
  const total = callTotal + putTotal;
  const ratio = callTotal ? putTotal / callTotal : 0;
  const expiryLabel = formatExpiryLabel(state.selectedExpiry);
  const label = metricLabel();

  dom.reportKicker.textContent = "option view";
  dom.reportTitle.textContent = `${label} Stats`;
  renderSelectedQuote(row);
  dom.summaryLine.replaceChildren(
    "Showing results for ",
    strong(row.symbol),
    `, ${expiryLabel}, calls & puts`
  );
  renderDataNotice(row);
  renderSummary(label, callTotal, putTotal, total, ratio);
  renderSqueezeAlerts(row);
  renderCandlestickChart(row);
  renderVolumeRanking();

  dom.chartTitle.textContent = `Highest ${label} Options by Side`;
  dom.chartLine.replaceChildren(
    "Showing results for ",
    strong(row.symbol),
    `, ${expiryLabel}, calls & puts`
  );
  renderSplitBars(puts, calls);
  renderTabs();
  loadSelectedQuote();

  const exchange = row.exchange || "NASDAQ";
  dom.tradingViewLink.href = `https://www.tradingview.com/symbols/${exchange}-${row.symbol}/options-chain/`;
  dom.sourceBadge.textContent = state.sourceLabel;
  dom.updatedAt.textContent = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function renderSelectedQuote(row) {
  const liveQuote = state.quotes[row.symbol] || {};
  const displayRow = { ...row, ...liveQuote };
  const price = Number.isFinite(displayRow.price) && displayRow.price > 0 ? currency(displayRow.price) : "Price N/A";
  const priceChange = Number.isFinite(displayRow.priceChange) && displayRow.priceChange !== 0
    ? signedCurrency(displayRow.priceChange)
    : "";
  const percentChange = Number.isFinite(displayRow.change) && displayRow.change !== 0
    ? `${displayRow.change > 0 ? "+" : ""}${displayRow.change.toFixed(2)}%`
    : "";
  const change = [priceChange, percentChange].filter(Boolean).join(" ");
  const quoteTime = displayRow.lastTradeTime || displayRow.quoteTimestamp;
  const source = displayRow.quoteSource === "futu-opend-realtime-quote"
    ? "Futu OpenD real-time quote"
    : displayRow.quoteSource === "cboe-options-chain-cache"
    ? "Cboe options-chain quote cache"
    : "Cboe delayed stock quote";
  const stale = displayRow.quoteStale
    ? " Showing the latest available true quote because the provider limited the newest refresh."
    : "";
  const warning = displayRow.quoteWarning ? ` ${displayRow.quoteWarning}` : "";
  dom.selectedQuote.textContent = change ? `${displayRow.symbol} ${price} ${change}` : `${displayRow.symbol} ${price}`;
  dom.selectedQuote.title = `${source}. Checks every ${QUOTE_REFRESH_MS / 1000} seconds while the page is open.${quoteTime ? ` Last trade: ${quoteTime}.` : ""}${stale}${warning}`;
  dom.selectedQuote.className = `quote-line${displayRow.change > 0 ? " positive" : displayRow.change < 0 ? " negative" : ""}`;
}

async function loadSelectedQuote() {
  if (state.source === "demo" || state.quoteLoading || !state.selectedSymbol) {
    return;
  }
  const requestedSymbol = state.selectedSymbol;
  state.quoteLoading = true;
  try {
    const quote = await fetchSelectedQuote(requestedSymbol);
    const quoteData = {
      price: finiteNumber(quote.price),
      change: finiteNumber(quote.change),
      priceChange: finiteNumber(quote.priceChange),
      bid: nullableNumber(quote.bid),
      ask: nullableNumber(quote.ask),
      quoteVolume: finiteNumber(quote.volume),
      lastTradeTime: quote.lastTradeTime || "",
      quoteTimestamp: quote.timestamp || "",
      quoteSource: quote.source || "",
      quoteStale: Boolean(quote.stale),
      quoteWarning: quote.warning || ""
    };
    state.quotes[quote.symbol] = quoteData;
    const row = state.rows.find((item) => item.symbol === quote.symbol);
    if (row) {
      Object.assign(row, quoteData);
    }
    if (state.selectedSymbol === quote.symbol) {
      renderSelectedQuote(row || { symbol: quote.symbol, ...quoteData });
      if (row) {
        renderSqueezeAlerts(row);
      }
    }
  } catch (error) {
    const row = selectedRow();
    if (row?.symbol === requestedSymbol) {
      dom.selectedQuote.title = `Quote update failed: ${error.message}`;
    }
  } finally {
    state.quoteLoading = false;
    if (state.selectedSymbol !== requestedSymbol) {
      loadSelectedQuote();
    }
  }
}

function renderCandlestickChart(row) {
  const symbol = row.symbol;
  const tradingViewSymbol = tradingViewSymbolFor(row);
  const requestId = state.chartRequestId + 1;
  state.chartRequestId = requestId;
  dom.candleTitle.textContent = `${symbol} Continuous 5D Candlestick Chart`;
  dom.candleChart.replaceChildren();

  if (state.source === "demo") {
    dom.candleMeta.textContent = "TradingView chart is available in live mode.";
    renderCandleMessage("Switch Data source to Live API first to load the continuous 5D chart.");
    return;
  }

  dom.candleMeta.textContent = `TradingView continuous 5D range with intraday candlesticks, ${tradingViewSymbol}.`;
  const host = document.createElement("div");
  host.className = "tradingview-chart-host";
  host.id = `tradingview-candle-${requestId}`;
  dom.candleChart.append(host);

  ensureTradingViewScript()
    .then(() => {
      if (state.chartRequestId !== requestId || !window.TradingView?.widget) {
        return;
      }
      createTradingViewWidget(host.id, tradingViewSymbol);
    })
    .catch(() => {
      if (state.chartRequestId === requestId) {
        dom.candleChart.replaceChildren();
        dom.candleMeta.textContent = "TradingView chart could not be loaded.";
        renderCandleMessage("Unable to load the TradingView continuous 5D chart.");
      }
    });
}

function renderCandleMessage(message) {
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  dom.candleChart.append(empty);
}

function ensureTradingViewScript() {
  if (window.TradingView?.widget) {
    return Promise.resolve();
  }
  if (!tradingViewScriptPromise) {
    tradingViewScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TRADINGVIEW_SCRIPT_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  return tradingViewScriptPromise;
}

function createTradingViewWidget(containerId, symbol) {
  new window.TradingView.widget({
    autosize: true,
    symbol,
    interval: "15",
    range: "5D",
    timezone: "America/New_York",
    theme: "light",
    style: "1",
    locale: "en",
    toolbar_bg: "#f6f8fb",
    enable_publishing: false,
    allow_symbol_change: false,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    save_image: false,
    calendar: false,
    support_host: "https://www.tradingview.com",
    container_id: containerId
  });
}

function tradingViewSymbolFor(row) {
  const exchange = normalizeTradingViewExchange(row.exchange);
  return `${exchange}:${row.symbol.replace(".", ".")}`;
}

function normalizeTradingViewExchange(exchange) {
  const value = String(exchange || "").toUpperCase();
  const map = {
    NAS: "NASDAQ",
    NMS: "NASDAQ",
    NCM: "NASDAQ",
    NGM: "NASDAQ",
    NYQ: "NYSE",
    NYS: "NYSE",
    ASE: "AMEX",
    PCX: "AMEX"
  };
  return map[value] || value || "NASDAQ";
}

function strong(text) {
  const element = document.createElement("strong");
  element.textContent = text;
  return element;
}

function renderDataNotice(row) {
  if (row.loading) {
    dom.dataNotice.textContent = `Loading delayed options-chain data for ${row.symbol}...`;
    return;
  }
  const timestamp = state.sourceTimestamp ? ` Refreshed ${new Date(state.sourceTimestamp).toLocaleString("en-US")}.` : "";
  const disclaimer = state.source === "futu"
    ? "Futu OpenD mode uses your local Futu connection. Real-time availability depends on your Futu market-data permissions; option ranking refreshes from subscribed option quotes."
    : state.source === "demo"
    ? "Demo mode uses synthetic data and should not be used for trading."
    : "Live mode uses Cboe delayed options-chain data; no synthetic fallback is shown.";
  const rowError = row.error ? ` ${row.error}` : "";
  dom.dataNotice.textContent = `${disclaimer}${timestamp}${rowError}`;
}

function sumMetric(contracts) {
  return contracts.reduce((sum, contract) => sum + finiteNumber(contract[state.metric]), 0);
}

function renderSummary(label, callTotal, putTotal, total, ratio) {
  dom.summaryTable.replaceChildren();
  [
    [`Call ${label} Total`, number(callTotal)],
    [`Put ${label} Total`, number(putTotal)],
    [`${label} Total`, number(total)],
    [`Put-Call ${label} Ratio`, ratio.toFixed(2)]
  ].forEach(([name, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";
    const term = document.createElement("dt");
    term.textContent = name;
    const description = document.createElement("dd");
    description.textContent = value;
    row.append(term, description);
    dom.summaryTable.append(row);
  });
}

function renderSqueezeAlerts(row) {
  dom.squeezeSignals.replaceChildren();
  const contracts = currentContracts(row);
  const liveQuote = state.quotes[row.symbol] || {};
  const displayRow = { ...row, ...liveQuote };
  const spot = finiteNumber(displayRow.price);
  const calls = contracts.filter((contract) => contract.side === "call");
  const puts = contracts.filter((contract) => contract.side === "put");
  const callVolume = sumField(calls, "buyVolume");
  const putVolume = sumField(puts, "buyVolume");
  const callOpenInterest = sumField(calls, "openInterest");
  const gammaAvailable = contracts.some((contract) => contract.gamma > 0);
  const expiry = formatExpiryLabel(state.selectedExpiry);

  if (!contracts.length || spot <= 0) {
    renderSignalCard({
      title: "Gamma Squeeze Watch",
      level: "Waiting",
      tone: "neutral",
      summary: "Waiting for the selected options chain and stock quote.",
      metrics: [["Expiration", expiry]]
    });
    renderSignalCard({
      title: "Short Squeeze Pressure",
      level: "Waiting",
      tone: "neutral",
      summary: "Waiting for delayed price and options activity.",
      metrics: [["Signal type", "Proxy only"]]
    });
    return;
  }

  const callGammaExposure = calls.reduce((sum, contract) => sum + gammaExposure(contract, spot), 0);
  const putGammaExposure = puts.reduce((sum, contract) => sum + gammaExposure(contract, spot), 0);
  const nearbyCalls = calls.filter((contract) => contract.strike >= spot * 0.98 && contract.strike <= spot * 1.05);
  const nearbyCallGammaExposure = nearbyCalls.reduce((sum, contract) => sum + gammaExposure(contract, spot), 0);
  const nearbyCallShare = callGammaExposure ? nearbyCallGammaExposure / callGammaExposure : 0;
  const callGammaShare = callGammaExposure + putGammaExposure
    ? callGammaExposure / (callGammaExposure + putGammaExposure)
    : 0;
  const callPutVolumeRatio = putVolume ? callVolume / putVolume : callVolume ? 9.99 : 0;
  const priceMomentum = clamp01(Math.max(0, finiteNumber(displayRow.change)) / 10);
  const callVolumeDominance = clamp01((callPutVolumeRatio - 1) / 2);
  const gammaScore = Math.round(100 * (
    nearbyCallShare * 0.45
    + callGammaShare * 0.30
    + callVolumeDominance * 0.15
    + priceMomentum * 0.10
  ));
  const callWall = [...calls]
    .filter((contract) => contract.gamma > 0 && contract.openInterest > 0)
    .sort((a, b) => gammaExposure(b, spot) - gammaExposure(a, spot))[0];
  const gammaLevel = signalLevel(gammaScore, 68, 45);
  renderSignalCard({
    title: "Gamma Squeeze Watch",
    level: gammaAvailable ? gammaLevel.label : "Unavailable",
    tone: gammaAvailable ? gammaLevel.tone : "neutral",
    score: gammaAvailable ? gammaScore : null,
    summary: gammaAvailable
      ? `${percent(nearbyCallShare)} of call gamma exposure sits from 2% below to 5% above spot for ${expiry}.`
      : "Gamma values are not available for the selected options chain.",
    metrics: [
      ["Call wall", callWall ? currency(callWall.strike) : "N/A"],
      ["Est. call GEX", compactCurrency(callGammaExposure)],
      ["Call / Put vol.", `${callPutVolumeRatio.toFixed(2)}x`]
    ],
    note: "Uses Cboe delayed gamma and open interest. Dealer positioning is not supplied."
  });

  const callTurnover = callOpenInterest ? callVolume / callOpenInterest : 0;
  const shortMomentum = clamp01(Math.max(0, finiteNumber(displayRow.change)) / 12);
  const shortScore = Math.round(100 * (
    shortMomentum * 0.65
    + shortMomentum * clamp01((callPutVolumeRatio - 1) / 3) * 0.20
    + shortMomentum * clamp01(callTurnover / 1.2) * 0.15
  ));
  const shortLevel = signalLevel(shortScore, 62, 36);
  renderSignalCard({
    title: "Short Squeeze Pressure",
    level: shortLevel.label,
    tone: shortLevel.tone,
    score: shortScore,
    summary: `${signedPercent(displayRow.change)} day move with ${callTurnover.toFixed(2)}x call-volume turnover.`,
    metrics: [
      ["Day move", signedPercent(displayRow.change)],
      ["Call turnover", `${callTurnover.toFixed(2)}x`],
      ["Stock volume", compact(finiteNumber(displayRow.quoteVolume))]
    ],
    note: "Proxy only. Short interest, float and borrow fee are not supplied by this feed."
  });
}

function renderSignalCard({ title, level, tone, score = null, summary, metrics, note = "" }) {
  const card = document.createElement("article");
  card.className = `signal-card ${tone}`;

  const header = document.createElement("div");
  header.className = "signal-card-header";
  const heading = document.createElement("h5");
  heading.textContent = title;
  const badge = document.createElement("span");
  badge.className = "signal-badge";
  badge.textContent = level;
  header.append(heading, badge);

  const scoreRow = document.createElement("div");
  scoreRow.className = "signal-score-row";
  const track = document.createElement("div");
  track.className = "signal-score-track";
  const fill = document.createElement("span");
  fill.style.width = `${score ?? 0}%`;
  track.append(fill);
  const value = document.createElement("strong");
  value.textContent = score === null ? "N/A" : `${score}/100`;
  scoreRow.append(track, value);

  const description = document.createElement("p");
  description.className = "signal-summary";
  description.textContent = summary;

  const metricList = document.createElement("dl");
  metricList.className = "signal-metrics";
  metrics.forEach(([name, metric]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = name;
    const detail = document.createElement("dd");
    detail.textContent = metric;
    item.append(term, detail);
    metricList.append(item);
  });

  card.append(header, scoreRow, description, metricList);
  if (note) {
    const footnote = document.createElement("p");
    footnote.className = "signal-note";
    footnote.textContent = note;
    card.append(footnote);
  }
  dom.squeezeSignals.append(card);
}

function gammaExposure(contract, spot) {
  return Math.abs(finiteNumber(contract.gamma)) * finiteNumber(contract.openInterest) * 100 * spot * spot * 0.01;
}

function sumField(contracts, field) {
  return contracts.reduce((sum, contract) => sum + finiteNumber(contract[field]), 0);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, finiteNumber(value)));
}

function signalLevel(score, highThreshold, watchThreshold) {
  if (score >= highThreshold) {
    return { label: "Elevated", tone: "elevated" };
  }
  if (score >= watchThreshold) {
    return { label: "Watch", tone: "watch" };
  }
  return { label: "Quiet", tone: "quiet" };
}

function percent(value) {
  return `${Math.round(clamp01(value) * 100)}%`;
}

function signedPercent(value) {
  const numeric = finiteNumber(value);
  return `${numeric > 0 ? "+" : ""}${numeric.toFixed(2)}%`;
}

function compactCurrency(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function renderVolumeRanking() {
  dom.rankingBody.replaceChildren();
  const rows = state.rows
    .map((row) => {
      const callVolume = row.contracts
        .filter((contract) => contract.side === "call")
        .reduce((sum, contract) => sum + finiteNumber(contract.buyVolume), 0);
      const putVolume = row.contracts
        .filter((contract) => contract.side === "put")
        .reduce((sum, contract) => sum + finiteNumber(contract.buyVolume), 0);
      return {
        row,
        callVolume,
        putVolume,
        totalVolume: callVolume + putVolume,
        putCallRatio: callVolume ? putVolume / callVolume : null
      };
    })
    .sort((a, b) => b.totalVolume - a.totalVolume);

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "No option volume data is available.";
    emptyRow.append(cell);
    dom.rankingBody.append(emptyRow);
    return;
  }

  rows.forEach((item, index) => {
    const tableRow = document.createElement("tr");
    tableRow.addEventListener("click", () => {
      state.selectedSymbol = item.row.symbol;
      syncOptions();
      render();
    });
    appendCell(tableRow, item.row.symbol, "symbol-cell");
    appendCell(tableRow, `${index + 1}. ${item.row.name || item.row.symbol}`, "name-cell");
    appendCell(tableRow, number(item.totalVolume), "numeric");
    appendCell(tableRow, number(item.callVolume), "numeric call-column");
    appendCell(tableRow, number(item.putVolume), "numeric put-column");
    appendCell(tableRow, item.putCallRatio === null ? "N/A" : item.putCallRatio.toFixed(2), "numeric");
    appendCell(tableRow, formatMarketCap(item.row.marketCap), "numeric");
    dom.rankingBody.append(tableRow);
  });
}

function appendCell(row, text, className = "") {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  row.append(cell);
}

function renderSplitBars(puts, calls) {
  renderBars(puts, dom.putChart, dom.putAxisMid, dom.putAxisMax);
  renderBars(calls, dom.callChart, dom.callAxisMid, dom.callAxisMax);
  dom.axisLabel.textContent = metricLabel();
}

function renderBars(contracts, chartElement, axisMidElement, axisMaxElement) {
  chartElement.replaceChildren();
  const ranked = [...contracts]
    .filter((contract) => contract[state.metric] > 0)
    .sort((a, b) => b[state.metric] - a[state.metric])
    .slice(0, state.topCount);

  if (!ranked.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No contracts match the current filters.";
    chartElement.append(empty);
    axisMidElement.textContent = "-";
    axisMaxElement.textContent = "-";
    return;
  }

  const max = Math.max(...ranked.map((contract) => contract[state.metric]));
  const axisMax = niceAxis(max);
  axisMidElement.textContent = compact(axisMax / 2);
  axisMaxElement.textContent = compact(axisMax);

  ranked.forEach((contract) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = contract.label;

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = `bar-fill ${contract.side}`;
    const width = Math.max(1, Math.min(100, (contract[state.metric] / axisMax) * 100));
    fill.style.width = `${width}%`;

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = number(contract[state.metric]);
    value.style.left = `${Math.min(width, 88)}%`;

    track.append(fill, value);
    row.append(label, track);
    chartElement.append(row);
  });
}

function niceAxis(value) {
  if (value <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function compact(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 0
  }).format(value);
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(value || 0));
}

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function signedCurrency(value) {
  const formatted = currency(Math.abs(value));
  return `${value > 0 ? "+" : "-"}${formatted}`;
}

function formatMarketCap(value) {
  if (!Number.isFinite(value)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

function renderTabs() {
  dom.symbolTabs.replaceChildren();
  state.rows.forEach((row) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `symbol-tab${row.symbol === state.selectedSymbol ? " active" : ""}`;
    button.textContent = row.symbol;
    button.addEventListener("click", () => {
      state.selectedSymbol = row.symbol;
      syncOptions();
      render();
    });
    dom.symbolTabs.append(button);
  });
}

function renderEmpty() {
  dom.summaryTable.replaceChildren();
  dom.rankingBody.replaceChildren();
  dom.candleChart.replaceChildren();
  dom.squeezeSignals.replaceChildren();
  dom.putChart.replaceChildren();
  dom.callChart.replaceChildren();
  dom.symbolTabs.replaceChildren();
  dom.dataNotice.textContent = state.error || "Live market data is not loaded.";
  dom.candleTitle.textContent = "5D Candlestick Chart";
  dom.candleMeta.textContent = state.error || "Live daily OHLC data is not loaded.";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = state.error || "Add at least one stock symbol.";
  const emptyRow = document.createElement("tr");
  const emptyCell = document.createElement("td");
  emptyCell.colSpan = 7;
  emptyCell.textContent = state.error || "No option volume data is available.";
  emptyRow.append(emptyCell);
  dom.rankingBody.append(emptyRow);
  dom.candleChart.append(empty.cloneNode(true));
  dom.putChart.append(empty);
  dom.callChart.append(empty.cloneNode(true));
  dom.putAxisMid.textContent = "-";
  dom.putAxisMax.textContent = "-";
  dom.callAxisMid.textContent = "-";
  dom.callAxisMax.textContent = "-";
}

async function lookupSymbols(query) {
  const normalized = query.trim().toUpperCase();
  if (!normalized) {
    return LOCAL_SYMBOLS.slice(0, 12);
  }
  try {
    const params = new URLSearchParams({ q: normalized, limit: "12" });
    const response = await fetch(`./api/symbol-search?${params.toString()}`, {
      cache: "no-store",
      headers: { accept: "application/json" }
    });
    if (response.ok) {
      const payload = await response.json();
      if (Array.isArray(payload.data) && payload.data.length) {
        return payload.data;
      }
    }
  } catch (error) {
    return localSymbolSearch(normalized);
  }
  return localSymbolSearch(normalized);
}

function localSymbolSearch(query) {
  return LOCAL_SYMBOLS
    .filter((item) => item.symbol.includes(query) || item.name.toUpperCase().includes(query))
    .slice(0, 12);
}

async function updateSymbolSuggestions() {
  const results = await lookupSymbols(dom.symbolSearch.value);
  dom.symbolSuggestions.replaceChildren();
  results.forEach((result) => {
    const option = document.createElement("option");
    option.value = result.symbol;
    option.label = `${result.name || result.symbol} ${result.exchange ? `(${result.exchange})` : ""}`;
    dom.symbolSuggestions.append(option);
  });
}

async function loadFocusedSymbol(symbol) {
  if (state.source === "demo") {
    loadData();
    return;
  }
  const requestId = focusedSymbolRequestId + 1;
  focusedSymbolRequestId = requestId;
  try {
    const payload = await fetchBackendData([symbol]);
    if (focusedSymbolRequestId !== requestId || !state.symbols.includes(symbol)) {
      return;
    }
    const row = payload.data.find((item) => item.symbol === symbol);
    if (!row) {
      throw new Error(`No option chain returned for ${symbol}`);
    }
    state.rows = mergeRows([row]);
    state.sourceLabel = payload.provider.includes("cboe") ? "Cboe delayed" : payload.provider;
    state.sourceTimestamp = payload.refreshedAt;
    state.error = "";
  } catch (error) {
    if (focusedSymbolRequestId !== requestId || !state.symbols.includes(symbol)) {
      return;
    }
    const row = state.rows.find((item) => item.symbol === symbol) || placeholderRow(symbol);
    row.loading = false;
    row.error = error.message || `Unable to load delayed options-chain data for ${symbol}.`;
    state.rows = mergeRows([row]);
  } finally {
    if (focusedSymbolRequestId === requestId && state.symbols.includes(symbol)) {
      syncOptions();
      render();
      loadSelectedQuote();
    }
  }
}

function addSymbolFromSearch() {
  const [symbol] = parseSymbols(dom.symbolSearch.value);
  if (!symbol) {
    return;
  }
  state.symbols = [symbol, ...state.symbols.filter((item) => item !== symbol)].slice(0, 25);
  state.selectedSymbol = symbol;
  if (!state.rows.some((row) => row.symbol === symbol)) {
    state.rows = mergeRows([placeholderRow(symbol)]);
  } else {
    state.rows = mergeRows([]);
  }
  syncSymbolsInput();
  dom.symbolSearch.value = "";
  syncOptions();
  render();
  loadSelectedQuote();
  loadFocusedSymbol(symbol);
}

function scheduleRefresh() {
  window.clearInterval(state.refreshTimer);
  updateRefreshHint();
  if (dom.autoRefresh.checked) {
    state.refreshTimer = window.setInterval(loadData, refreshIntervalMs());
  }
}

function refreshIntervalMs() {
  return state.source === "futu" ? FUTU_REFRESH_MS : REFRESH_MS;
}

function sourceLabelFor(provider) {
  const value = String(provider || "").toLowerCase();
  if (value.includes("futu")) {
    return "Futu OpenD real-time";
  }
  if (value.includes("cboe")) {
    return "Cboe delayed";
  }
  return provider || "Live API";
}

function updateRefreshHint() {
  dom.refreshHint.textContent = state.source === "futu"
    ? `Futu option ranking refreshes every ${FUTU_REFRESH_MS / 1000} seconds; selected stock quote checks every ${QUOTE_REFRESH_MS / 1000} seconds.`
    : `Options refresh every ${REFRESH_MS / 1000} seconds; selected stock quote checks every ${QUOTE_REFRESH_MS / 1000} seconds.`;
}

function scheduleQuoteRefresh() {
  window.clearInterval(state.quoteTimer);
  state.quoteTimer = window.setInterval(loadSelectedQuote, QUOTE_REFRESH_MS);
}

dom.refreshButton.addEventListener("click", loadData);
dom.resetButton.addEventListener("click", () => {
  state.symbols = [...DEFAULT_SYMBOLS];
  state.selectedSymbol = DEFAULT_SYMBOLS[0];
  syncSymbolsInput();
  loadData();
});
dom.symbolsInput.addEventListener("change", () => {
  state.symbols = parseSymbols(dom.symbolsInput.value);
  loadData();
});
dom.symbolSelect.addEventListener("change", (event) => {
  state.selectedSymbol = event.target.value;
  syncOptions();
  render();
  loadSelectedQuote();
});
dom.metricSelect.addEventListener("change", (event) => {
  state.metric = event.target.value;
  render();
});
dom.expirySelect.addEventListener("change", (event) => {
  state.selectedExpiry = event.target.value;
  render();
});
dom.sourceSelect.addEventListener("change", (event) => {
  state.source = event.target.value;
  scheduleRefresh();
  loadData();
});
dom.autoRefresh.addEventListener("change", scheduleRefresh);
dom.topCount.addEventListener("input", (event) => {
  state.topCount = Number(event.target.value);
  dom.topCountValue.textContent = String(state.topCount);
  render();
});
dom.symbolSearch.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(updateSymbolSuggestions, 180);
});
dom.symbolSearch.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addSymbolFromSearch();
  }
});
dom.addSymbolButton.addEventListener("click", addSymbolFromSearch);

configureLocalDataSources();
syncSymbolsInput();
updateSymbolSuggestions();
scheduleRefresh();
scheduleQuoteRefresh();
loadSelectedQuote();
loadData();
