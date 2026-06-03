#!/usr/bin/env python3
import json
import math
import sys
import time
from datetime import datetime


def load_futu_module():
    try:
        from futu import (  # type: ignore
            OpenQuoteContext,
            RET_OK,
            SubType,
            OptionType,
        )
        return {
            "name": "futu",
            "OpenQuoteContext": OpenQuoteContext,
            "RET_OK": RET_OK,
            "SubType": SubType,
            "OptionType": OptionType,
        }
    except Exception as futu_error:
        try:
            from moomoo import (  # type: ignore
                OpenQuoteContext,
                RET_OK,
                SubType,
                OptionType,
            )
            return {
                "name": "moomoo",
                "OpenQuoteContext": OpenQuoteContext,
                "RET_OK": RET_OK,
                "SubType": SubType,
                "OptionType": OptionType,
            }
        except Exception as moomoo_error:
            raise RuntimeError(
                "Futu API package is not installed. Run: python3 -m pip install futu-api. "
                f"Import errors: futu={futu_error}; moomoo={moomoo_error}"
            )


def main():
    try:
        request = json.load(sys.stdin)
        action = request.get("action")
        module = load_futu_module()
        ctx = module["OpenQuoteContext"](
            host=request.get("host") or "127.0.0.1",
            port=int(request.get("port") or 11111),
        )
        try:
            if action == "status":
                respond({"ok": True, "sdk": module["name"]})
            elif action == "quote":
                respond({
                    "ok": True,
                    "sdk": module["name"],
                    "data": fetch_quotes(ctx, module, request.get("symbols") or []),
                })
            elif action == "options":
                rows = fetch_options(
                    ctx,
                    module,
                    request.get("symbols") or [],
                    int(request.get("maxExpirations") or 6),
                    int(request.get("maxContractsPerSymbol") or 240),
                )
                respond({
                    "ok": True,
                    "sdk": module["name"],
                    "limits": {
                        "maxExpirations": int(request.get("maxExpirations") or 6),
                        "maxContractsPerSymbol": int(request.get("maxContractsPerSymbol") or 240),
                    },
                    "data": rows,
                })
            else:
                raise RuntimeError(f"Unknown Futu bridge action: {action}")
        finally:
            ctx.close()
    except Exception as error:
        respond({"ok": False, "error": str(error)})
        sys.exit(1)


def fetch_quotes(ctx, module, symbols):
    codes = [to_futu_code(symbol) for symbol in symbols]
    subscribe(ctx, module, codes)
    ret, data = ctx.get_stock_quote(codes)
    if ret != module["RET_OK"]:
        raise RuntimeError(str(data))
    return [normalize_quote_row(record, from_futu_code(record.get("code"))) for record in records(data)]


def fetch_options(ctx, module, symbols, max_expirations, max_contracts_per_symbol):
    rows = []
    for symbol in symbols:
        try:
            rows.append(fetch_options_for_symbol(ctx, module, symbol, max_expirations, max_contracts_per_symbol))
        except Exception as error:
            rows.append({
                "symbol": normalize_symbol(symbol),
                "name": normalize_symbol(symbol),
                "exchange": "US",
                "price": 0,
                "change": 0,
                "priceChange": 0,
                "volume": 0,
                "marketCap": None,
                "contracts": [],
                "error": str(error),
            })
    return rows


def fetch_options_for_symbol(ctx, module, symbol, max_expirations, max_contracts_per_symbol):
    normalized = normalize_symbol(symbol)
    underlying = to_futu_code(normalized)
    quote = fetch_quotes(ctx, module, [normalized])[0]
    spot = as_float(quote.get("price"))
    expirations = fetch_expirations(ctx, module, underlying, max_expirations)
    chain_records = []
    for expiration in expirations:
        ret, data = ctx.get_option_chain(code=underlying, start=expiration, end=expiration)
        if ret != module["RET_OK"]:
            continue
        chain_records.extend(records(data))
        time.sleep(0.15)

    selected = rank_option_chain(chain_records, spot, max_contracts_per_symbol)
    option_codes = [record.get("code") for record in selected if record.get("code")]
    quote_map = fetch_option_quote_map(ctx, module, option_codes)
    contracts = [normalize_option_contract(normalized, record, quote_map.get(record.get("code"), {})) for record in selected]
    contracts = [contract for contract in contracts if contract]

    return {
        "symbol": normalized,
        "name": quote.get("name") or normalized,
        "exchange": "US",
        "price": quote.get("price") or 0,
        "change": quote.get("change") or 0,
        "priceChange": quote.get("priceChange") or 0,
        "volume": quote.get("volume") or 0,
        "marketCap": None,
        "contracts": contracts,
    }


def fetch_expirations(ctx, module, code, max_expirations):
    ret, data = ctx.get_option_expiration_date(code=code)
    if ret != module["RET_OK"]:
        raise RuntimeError(str(data))
    values = []
    for record in records(data):
        strike_time = record.get("strike_time")
        if strike_time:
            values.append(str(strike_time))
    return sorted(set(values))[:max_expirations]


def fetch_option_quote_map(ctx, module, codes):
    quote_map = {}
    for chunk in chunks(codes, 80):
        subscribe(ctx, module, chunk)
        ret, data = ctx.get_stock_quote(chunk)
        if ret != module["RET_OK"]:
            raise RuntimeError(str(data))
        for record in records(data):
            quote_map[record.get("code")] = record
        time.sleep(0.15)
    return quote_map


def subscribe(ctx, module, codes):
    if not codes:
        return
    try:
        ret, message = ctx.subscribe(codes, [module["SubType"].QUOTE], subscribe_push=False)
    except TypeError:
        ret, message = ctx.subscribe(codes, [module["SubType"].QUOTE], is_first_push=False, subscribe_push=False)
    if ret != module["RET_OK"]:
        raise RuntimeError(f"Futu subscribe failed: {message}")


def normalize_quote_row(record, symbol):
    price = first_number(record, ["last_price", "price", "pre_price", "after_price", "overnight_price"])
    prev_close = first_number(record, ["prev_close_price", "last_settle_price"])
    price_change = first_number(record, ["change_val", "price_change"])
    if price_change == 0 and price and prev_close:
        price_change = price - prev_close
    change_rate = first_number(record, ["change_rate", "pre_change_rate", "after_change_rate", "overnight_change_rate"])
    if change_rate == 0 and price_change and prev_close:
        change_rate = price_change / prev_close * 100
    return {
        "symbol": symbol,
        "name": record.get("name") or symbol,
        "exchange": "US",
        "price": price,
        "change": change_rate,
        "priceChange": price_change,
        "bid": first_nullable(record, ["bid_price", "bid"]),
        "ask": first_nullable(record, ["ask_price", "ask"]),
        "volume": first_number(record, ["volume", "pre_volume", "after_volume", "overnight_volume"]),
        "lastTradeTime": record.get("data_time") or "",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "futu-opend-realtime-quote",
    }


def normalize_option_contract(symbol, chain_record, quote_record):
    code = chain_record.get("code")
    strike = first_number(chain_record, ["strike_price"])
    expiration = str(chain_record.get("strike_time") or "")
    if not code or not expiration or strike <= 0:
        return None
    side = option_side(chain_record)
    label = f"{symbol} {label_from_date(expiration)} {strike:.1f}{'P' if side == 'put' else 'C'}"
    return {
        "symbol": symbol,
        "side": side,
        "strike": strike,
        "expiration": expiration,
        "expirationLabel": label_from_date(expiration),
        "expirationType": str(chain_record.get("expiration_cycle") or "listed").lower(),
        "label": label,
        "openInterest": first_number(quote_record, ["open_interest", "net_open_interest"]),
        "buyVolume": first_number(quote_record, ["volume"]),
        "delta": first_number(quote_record, ["delta"]),
        "gamma": first_number(quote_record, ["gamma"]),
        "iv": first_number(quote_record, ["implied_volatility"]),
    }


def rank_option_chain(chain_records, spot, max_contracts):
    if not chain_records:
        return []
    if spot <= 0:
        return chain_records[:max_contracts]
    return sorted(
        chain_records,
        key=lambda record: (
            str(record.get("strike_time") or ""),
            abs(first_number(record, ["strike_price"]) - spot),
        ),
    )[:max_contracts]


def option_side(record):
    value = str(record.get("option_type") or record.get("stock_type") or "").lower()
    code = str(record.get("code") or "").upper()
    if "put" in value or value.endswith(".put") or " P" in value or "P" in code[-12:]:
        return "put"
    return "call"


def records(data):
    if hasattr(data, "to_dict"):
        return data.to_dict("records")
    if isinstance(data, list):
        return data
    return []


def chunks(values, size):
    for index in range(0, len(values), size):
        yield values[index:index + size]


def normalize_symbol(symbol):
    return str(symbol or "").upper().replace("US.", "").replace("-", ".")


def to_futu_code(symbol):
    value = normalize_symbol(symbol)
    return value if value.startswith("US.") else f"US.{value}"


def from_futu_code(code):
    return normalize_symbol(code)


def as_float(value):
    try:
        number = float(value)
        if math.isfinite(number):
            return number
    except Exception:
        pass
    return 0


def first_number(record, keys):
    value = first_nullable(record, keys)
    return as_float(value)


def first_nullable(record, keys):
    for key in keys:
        value = record.get(key)
        if value is not None and value != "":
            return value
    return None


def label_from_date(value):
    try:
        date = datetime.strptime(str(value), "%Y-%m-%d")
        return date.strftime("%m/%d/%y")
    except Exception:
        return str(value or "N/A")


def respond(payload):
    print(json.dumps(payload, ensure_ascii=False, allow_nan=False))


if __name__ == "__main__":
    main()
