from __future__ import annotations

import csv
import json
import os
import time
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
KEYWORDS_FILE = ROOT / "docs" / "google-ads" / "import" / "keywords.csv"
NEGATIVES_FILE = ROOT / "docs" / "google-ads" / "import" / "negative-keywords.csv"
OUTPUT_FILE = ROOT / ".private" / "google-ads" / "pilot-forecast.json"
REQUIRED_ENV = (
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
)


def require_environment() -> None:
    missing = [name for name in REQUIRED_ENV if not os.getenv(name)]
    if missing:
        raise SystemExit(f"Missing Google Ads credentials: {', '.join(missing)}")


def load_client():
    try:
        from google.ads.googleads.client import GoogleAdsClient
    except ImportError as exc:
        raise SystemExit("Install the google-ads package before running the forecast") from exc

    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "use_proto_plus": True,
    }
    login_customer_id = os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID")
    if login_customer_id:
        config["login_customer_id"] = login_customer_id.replace("-", "")
    return GoogleAdsClient.load_from_dict(config)


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def account_currency(client, customer_id: str) -> str:
    service = client.get_service("GoogleAdsService")
    query = "SELECT customer.currency_code FROM customer LIMIT 1"
    response = service.search(customer_id=customer_id, query=query)
    return next(iter(response)).customer.currency_code


def forecast_campaign(
    client, customer_id: str, campaign_name: str, geo_id: str, max_cpc_inr: int
) -> dict[str, object]:
    keywords = [row for row in read_rows(KEYWORDS_FILE) if row["Campaign"] == campaign_name]
    negatives = [row for row in read_rows(NEGATIVES_FILE) if row["Campaign"] == campaign_name]
    if not keywords:
        raise SystemExit(f"No keywords found for {campaign_name}")

    googleads_service = client.get_service("GoogleAdsService")
    campaign = client.get_type("CampaignToForecast")
    campaign.bidding_strategy.manual_cpc_bidding_strategy.max_cpc_bid_micros = max_cpc_inr * 1_000_000
    campaign.geo_target_constants.append(googleads_service.geo_target_constant_path(geo_id))
    campaign.language_constants.append(googleads_service.language_constant_path("1000"))

    groups: dict[str, object] = {}
    for row in keywords:
        group_name = row["Ad group"]
        if group_name not in groups:
            groups[group_name] = client.get_type("ForecastAdGroup")
        keyword = client.get_type("KeywordInfo")
        keyword.text = row["Keyword"]
        keyword.match_type = getattr(client.enums.KeywordMatchTypeEnum, row["Match type"].upper())
        groups[group_name].keywords.append(keyword)

    # ForecastAdGroup no longer accepts negatives in Google Ads API v23.
    # The forecast remains narrow because every positive is exact or phrase match;
    # negatives are still mandatory in the paused campaign import pack.
    for group in groups.values():
        campaign.ad_groups.append(group)

    request = client.get_type("GenerateKeywordForecastMetricsRequest")
    request.customer_id = customer_id
    request.campaign = campaign
    request.forecast_period.start_date = (date.today() + timedelta(days=1)).isoformat()
    request.forecast_period.end_date = (date.today() + timedelta(days=10)).isoformat()
    response = client.get_service("KeywordPlanIdeaService").generate_keyword_forecast_metrics(request=request)
    metrics = response.campaign_forecast_metrics
    return {
        "campaign": campaign_name,
        "max_cpc_inr": max_cpc_inr,
        "keywords": len(keywords),
        "campaign_negatives": len(negatives),
        "period": {
            "start": request.forecast_period.start_date,
            "end": request.forecast_period.end_date,
        },
        "clicks": float(metrics.clicks or 0),
        "average_cpc_micros": int(metrics.average_cpc_micros or 0),
        "cost_micros": int(metrics.cost_micros or 0),
    }


def main() -> int:
    require_environment()
    client = load_client()
    customer_id = os.environ["GOOGLE_ADS_CUSTOMER_ID"].replace("-", "")
    currency = account_currency(client, customer_id)
    campaign_names = [
        "VCardQR_Dynamic_Search_Pilot",
        "VCardQR_Logo_Search_Pilot",
    ]
    markets = {"United States": "2840", "India": "2356"}
    scenarios = []
    for market, geo_id in markets.items():
        for max_cpc_inr in (30, 60, 100, 150):
            forecasts = []
            for name in campaign_names:
                if scenarios or forecasts:
                    time.sleep(6)
                forecasts.append(
                    forecast_campaign(client, customer_id, name, geo_id, max_cpc_inr)
                )
            clicks = sum(float(item["clicks"]) for item in forecasts)
            cost = sum(int(item["cost_micros"]) for item in forecasts) / 1_000_000
            scenarios.append(
                {
                    "market": market,
                    "geo_id": geo_id,
                    "max_cpc_inr": max_cpc_inr,
                    "total_clicks": clicks,
                    "total_cost": cost,
                    "launch_gate": "pass" if clicks >= 30 and cost <= 3000 else "fail",
                    "campaigns": forecasts,
                }
            )
    passing = [scenario for scenario in scenarios if scenario["launch_gate"] == "pass"]
    gate = currency == "INR" and bool(passing)
    report = {
        "generated_on": date.today().isoformat(),
        "customer_currency": currency,
        "forecast_days": 10,
        "launch_gate": "pass" if gate else "fail",
        "gate_requirements": {
            "currency": "INR",
            "minimum_clicks": 30,
            "maximum_cost": 3000,
        },
        "recommended_scenario": min(passing, key=lambda item: item["total_cost"]) if passing else None,
        "scenarios": scenarios,
        "note": "Forecast only. No campaign was created or changed.",
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if gate else 3


if __name__ == "__main__":
    raise SystemExit(main())
