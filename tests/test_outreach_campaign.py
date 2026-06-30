import csv
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path

from scripts.outreach_campaign import (
    ACTIVITY_FIELDS,
    LEAD_FIELDS,
    CampaignError,
    Paths,
    initialize,
    is_suppressed,
    mark_sent,
    prepare,
    read_csv,
    record_response,
    set_approval,
    suppressed_values,
    validate_leads,
    write_csv,
)


def lead(lead_id="lead-1", email="sales@example.com", status="researched"):
    row = {field: "" for field in LEAD_FIELDS}
    row.update(
        {
            "lead_id": lead_id,
            "segment": "print_partner",
            "business_name": "Example Print LLC",
            "contact_email": email,
            "contact_type": "role",
            "jurisdiction": "US",
            "source_url": "https://example.com/contact",
            "trigger_url": "https://example.com/business-cards",
            "business_reason": "its public business-card printing page",
            "discovered_on": "2026-06-30",
            "status": status,
        }
    )
    return row


class OutreachCampaignTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.paths = Paths(Path(self.temp.name))
        initialize(self.paths)
        self.paths.sender.write_text(
            json.dumps(
                {
                    "sender_name": "Abhik",
                    "business_name": "vCard QR Code Generator",
                    "sender_email": "contact@vcardqrcodegenerator.com",
                    "postal_address": "123 Business Street, Test City, NY 10001",
                }
            ),
            encoding="utf-8",
        )

    def tearDown(self):
        self.temp.cleanup()

    def test_rejects_non_us_lead(self):
        row = lead()
        row["jurisdiction"] = "CA"
        write_csv(self.paths.leads, LEAD_FIELDS, [row])
        self.assertTrue(any("US jurisdiction only" in error for error in validate_leads(self.paths)))

    def test_requires_approval_before_send(self):
        write_csv(self.paths.leads, LEAD_FIELDS, [lead()])
        with self.assertRaises(CampaignError):
            mark_sent(self.paths, "lead-1", 1, date(2026, 7, 1))

    def test_approval_creates_draft_with_unsubscribe_and_address(self):
        write_csv(self.paths.leads, LEAD_FIELDS, [lead()])
        set_approval(self.paths, ["lead-1"])
        prepare(self.paths, date(2026, 7, 1), 5, "print_partner")
        draft = next(self.paths.drafts.rglob("*.txt")).read_text(encoding="utf-8")
        self.assertIn("Unsubscribe: mailto:", draft)
        self.assertIn("123 Business Street", draft)
        self.assertIn("Advertisement / commercial message", draft)

    def test_unsubscribe_suppresses_and_stops_followups(self):
        write_csv(self.paths.leads, LEAD_FIELDS, [lead(status="contacted")])
        record_response(self.paths, "lead-1", "unsubscribe", "Requested removal")
        self.assertTrue(is_suppressed("sales@example.com", suppressed_values(self.paths)))
        self.assertEqual(read_csv(self.paths.leads)[0]["status"], "suppressed")

    def test_legal_threat_suppresses_domain_and_pauses_campaign(self):
        write_csv(self.paths.leads, LEAD_FIELDS, [lead(status="contacted")])
        record_response(self.paths, "lead-1", "legal_threat", "Threatened legal action")
        state = json.loads(self.paths.state.read_text(encoding="utf-8"))
        self.assertTrue(state["paused"])
        self.assertTrue(is_suppressed("other@example.com", suppressed_values(self.paths)))
        with self.assertRaises(CampaignError):
            prepare(self.paths, date(2026, 7, 1), 5, None)

    def test_five_new_contact_daily_limit(self):
        rows = [lead(f"lead-{n}", f"sales{n}@example{n}.com", status="approved") for n in range(1, 7)]
        write_csv(self.paths.leads, LEAD_FIELDS, rows)
        for n in range(1, 6):
            mark_sent(self.paths, f"lead-{n}", 1, date.today())
        with self.assertRaises(CampaignError):
            mark_sent(self.paths, "lead-6", 1, date.today())


if __name__ == "__main__":
    unittest.main()
