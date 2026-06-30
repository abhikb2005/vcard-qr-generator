import csv
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMPORT_DIR = ROOT / "docs" / "google-ads" / "import"


def rows(name):
    with (IMPORT_DIR / name).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


class GoogleAdsPilotTests(unittest.TestCase):
    def test_campaigns_are_paused_search_only_and_budget_capped(self):
        campaigns = rows("campaigns.csv")
        self.assertEqual(len(campaigns), 2)
        self.assertEqual(sum(int(row["Budget"]) for row in campaigns), 300)
        self.assertEqual(sorted(int(row["Budget"]) for row in campaigns), [90, 210])
        for row in campaigns:
            self.assertEqual(row["Campaign Type"], "Search")
            self.assertEqual(row["Status"], "Paused")
            self.assertEqual(row["Networks"], "Google Search")

    def test_keywords_use_exact_or_phrase_only(self):
        keywords = rows("keywords.csv")
        self.assertGreaterEqual(len(keywords), 10)
        self.assertEqual({row["Match type"] for row in keywords}, {"Exact", "Phrase"})
        self.assertFalse(any("free" in row["Keyword"].lower() for row in keywords))

    def test_required_negative_intent_is_blocked(self):
        negatives = rows("negative-keywords.csv")
        by_campaign = {}
        for row in negatives:
            by_campaign.setdefault(row["Campaign"], set()).add(row["Negative keyword"].lower())
        required = {"free", "scanner", "reader", "jobs", "api", "download"}
        for values in by_campaign.values():
            self.assertTrue(required.issubset(values))

    def test_responsive_search_ads_respect_character_limits(self):
        ads = rows("responsive-search-ads.csv")
        self.assertEqual(len(ads), 3)
        for row in ads:
            headlines = [value for key, value in row.items() if key.startswith("Headline")]
            descriptions = [value for key, value in row.items() if key.startswith("Description")]
            self.assertGreaterEqual(len([value for value in headlines if value]), 10)
            self.assertEqual(len([value for value in descriptions if value]), 4)
            self.assertTrue(all(len(value) <= 30 for value in headlines))
            self.assertTrue(all(len(value) <= 90 for value in descriptions))

    def test_forecast_is_read_only(self):
        source = (ROOT / "scripts" / "google_ads_pilot_forecast.py").read_text(encoding="utf-8")
        self.assertIn("generate_keyword_forecast_metrics", source)
        self.assertNotIn("mutate_campaigns", source)
        self.assertNotIn("CampaignService", source)


if __name__ == "__main__":
    unittest.main()
