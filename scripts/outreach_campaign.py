from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import quote, urlencode, urlparse


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = ROOT / ".private" / "outreach"
LEAD_FIELDS = [
    "lead_id",
    "segment",
    "business_name",
    "contact_email",
    "contact_name",
    "contact_type",
    "jurisdiction",
    "source_url",
    "trigger_url",
    "business_reason",
    "discovered_on",
    "status",
    "touch_1_sent",
    "touch_2_sent",
    "touch_3_sent",
    "response_type",
    "notes",
]
SUPPRESSION_FIELDS = ["scope", "value", "reason", "recorded_on", "source_lead_id"]
ACTIVITY_FIELDS = ["timestamp", "lead_id", "event", "touch", "details"]
ALLOWED_SEGMENTS = {"print_partner", "conference_exhibitor", "real_estate_brokerage"}
ALLOWED_CONTACT_TYPES = {"role", "published_business_contact"}
RESPONSE_TYPES = {"positive", "rejected", "unsubscribe", "legal_threat"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class CampaignError(RuntimeError):
    pass


@dataclass(frozen=True)
class Paths:
    root: Path

    @property
    def leads(self) -> Path:
        return self.root / "leads.csv"

    @property
    def suppression(self) -> Path:
        return self.root / "suppression.csv"

    @property
    def activity(self) -> Path:
        return self.root / "activity.csv"

    @property
    def sender(self) -> Path:
        return self.root / "sender.json"

    @property
    def state(self) -> Path:
        return self.root / "state.json"

    @property
    def drafts(self) -> Path:
        return self.root / "drafts"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, fields: list[str], rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def append_csv(path: Path, fields: list[str], row: dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    exists = path.exists() and path.stat().st_size > 0
    with path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        if not exists:
            writer.writeheader()
        writer.writerow(row)


def load_state(paths: Paths) -> dict[str, object]:
    if not paths.state.exists():
        return {"paused": False, "pause_reason": ""}
    return json.loads(paths.state.read_text(encoding="utf-8"))


def save_state(paths: Paths, state: dict[str, object]) -> None:
    paths.state.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")


def initialize(paths: Paths) -> None:
    paths.root.mkdir(parents=True, exist_ok=True)
    paths.drafts.mkdir(exist_ok=True)
    if not paths.leads.exists():
        write_csv(paths.leads, LEAD_FIELDS, [])
    if not paths.suppression.exists():
        write_csv(paths.suppression, SUPPRESSION_FIELDS, [])
    if not paths.activity.exists():
        write_csv(paths.activity, ACTIVITY_FIELDS, [])
    if not paths.sender.exists():
        paths.sender.write_text(
            json.dumps(
                {
                    "sender_name": "",
                    "business_name": "vCard QR Code Generator",
                    "sender_email": "contact@vcardqrcodegenerator.com",
                    "postal_address": "",
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
    if not paths.state.exists():
        save_state(paths, {"paused": False, "pause_reason": ""})
    print(f"Initialized private outreach workspace: {paths.root}")


def validate_sender(paths: Paths) -> dict[str, str]:
    if not paths.sender.exists():
        raise CampaignError("Run init and complete sender.json before preparing drafts.")
    sender = json.loads(paths.sender.read_text(encoding="utf-8"))
    required = ("sender_name", "business_name", "sender_email", "postal_address")
    missing = [field for field in required if not str(sender.get(field, "")).strip()]
    if missing:
        raise CampaignError(f"Sender profile is incomplete: {', '.join(missing)}")
    if not EMAIL_RE.match(sender["sender_email"]):
        raise CampaignError("sender_email is invalid")
    return {field: str(sender[field]).strip() for field in required}


def validate_leads(paths: Paths) -> list[str]:
    leads = read_csv(paths.leads)
    errors: list[str] = []
    ids: set[str] = set()
    emails: set[str] = set()
    for line, lead in enumerate(leads, start=2):
        prefix = f"line {line}"
        for field in (
            "lead_id",
            "segment",
            "business_name",
            "contact_email",
            "contact_type",
            "jurisdiction",
            "source_url",
            "business_reason",
            "discovered_on",
            "status",
        ):
            if not lead.get(field, "").strip():
                errors.append(f"{prefix}: missing {field}")
        lead_id = lead.get("lead_id", "").strip().lower()
        email = lead.get("contact_email", "").strip().lower()
        if lead_id in ids:
            errors.append(f"{prefix}: duplicate lead_id {lead_id}")
        ids.add(lead_id)
        if email in emails:
            errors.append(f"{prefix}: duplicate email {email}")
        emails.add(email)
        if not EMAIL_RE.match(email):
            errors.append(f"{prefix}: invalid email")
        if lead.get("segment") not in ALLOWED_SEGMENTS:
            errors.append(f"{prefix}: invalid segment")
        if lead.get("contact_type") not in ALLOWED_CONTACT_TYPES:
            errors.append(f"{prefix}: invalid contact_type")
        if lead.get("jurisdiction", "").strip().upper() != "US":
            errors.append(f"{prefix}: pilot permits US jurisdiction only")
        for url_field in ("source_url", "trigger_url"):
            value = lead.get(url_field, "").strip()
            if value and urlparse(value).scheme not in {"http", "https"}:
                errors.append(f"{prefix}: invalid {url_field}")
        try:
            date.fromisoformat(lead.get("discovered_on", ""))
        except ValueError:
            errors.append(f"{prefix}: discovered_on must be YYYY-MM-DD")
    return errors


def suppressed_values(paths: Paths) -> tuple[set[str], set[str]]:
    emails: set[str] = set()
    domains: set[str] = set()
    for row in read_csv(paths.suppression):
        value = row.get("value", "").strip().lower()
        if row.get("scope") == "email":
            emails.add(value)
        elif row.get("scope") == "domain":
            domains.add(value)
    return emails, domains


def is_suppressed(email: str, suppressed: tuple[set[str], set[str]]) -> bool:
    emails, domains = suppressed
    normalized = email.strip().lower()
    domain = normalized.rsplit("@", 1)[-1]
    return normalized in emails or domain in domains


def utm_url(lead: dict[str, str], product: str) -> str:
    if product == "dynamic":
        base = "https://app.vcardqrcodegenerator.com/login"
    else:
        base = "https://www.vcardqrcodegenerator.com/logo-qr-code.html"
    query = urlencode(
        {
            "utm_source": "founder_outreach",
            "utm_medium": "email",
            "utm_campaign": "revenue_pilot_2026_07",
            "utm_content": f"{lead['segment']}_{lead['lead_id']}",
        }
    )
    return f"{base}?{query}"


def unsubscribe_link(sender_email: str, lead: dict[str, str]) -> str:
    subject = quote(f"Unsubscribe {lead['lead_id']}")
    body = quote("Please remove this address from future marketing messages.")
    return f"mailto:{sender_email}?subject={subject}&body={body}"


def message_for(lead: dict[str, str], touch: int, sender: dict[str, str]) -> str:
    first_name = lead.get("contact_name", "").strip().split(" ")[0] or "there"
    product = "dynamic" if lead["segment"] == "conference_exhibitor" else "logo"
    destination = utm_url(lead, product)
    if lead["segment"] == "print_partner":
        angle = (
            "You already help businesses produce cards and printed marketing. "
            "We provide scan-tested vCard QR files that can be added to client artwork without collecting their contact data."
        )
    elif lead["segment"] == "conference_exhibitor":
        angle = (
            "Your upcoming exhibit creates a short window for attendees to save the right contact details. "
            "An editable vCard QR can sit on booth material while letting your team update the destination after printing."
        )
    else:
        angle = (
            "Your open-house activity creates a natural use for a QR that lets visitors save the brokerage contact in one scan. "
            "The branded version is a $4.99 one-time purchase with no subscription."
        )

    if touch == 1:
        subject = f"QR contact handoff for {lead['business_name']}"
        body = f"I found {lead['business_name']} through {lead['business_reason']}.\n\n{angle}\n\nRelevant option: {destination}"
    elif touch == 2:
        subject = f"Re: QR contact handoff for {lead['business_name']}"
        body = (
            "A practical detail I should have included: the QR output is designed for print, "
            "and the contact data stays in the browser for static vCards.\n\n"
            f"Here is the relevant option again: {destination}"
        )
    elif touch == 3:
        subject = f"Closing the loop: {lead['business_name']}"
        body = (
            "I will close the loop after this note. If a branded static QR is enough, the one-time option is $4.99. "
            "If the printed destination needs future edits or scan analytics, the dynamic plan is the better fit.\n\n"
            f"Details: {destination}"
        )
    else:
        raise CampaignError("touch must be 1, 2, or 3")

    footer = (
        f"\n\nRegards,\n{sender['sender_name']}\n{sender['business_name']}\n"
        f"{sender['postal_address']}\n\nAdvertisement / commercial message.\n"
        f"Unsubscribe: {unsubscribe_link(sender['sender_email'], lead)}\n"
        "You may also reply with 'unsubscribe'."
    )
    return f"Subject: {subject}\n\nHi {first_name},\n\n{body}{footer}\n"


def log_activity(paths: Paths, lead_id: str, event: str, touch: str = "", details: str = "") -> None:
    append_csv(
        paths.activity,
        ACTIVITY_FIELDS,
        {
            "timestamp": datetime.now().astimezone().isoformat(timespec="seconds"),
            "lead_id": lead_id,
            "event": event,
            "touch": touch,
            "details": details,
        },
    )


def activity_for(paths: Paths, lead_id: str, event: str | None = None) -> list[dict[str, str]]:
    rows = [row for row in read_csv(paths.activity) if row.get("lead_id") == lead_id]
    return [row for row in rows if row.get("event") == event] if event else rows


def touch_due(lead: dict[str, str], today: date) -> int | None:
    if lead.get("response_type") or lead.get("status") not in {"approved", "contacted"}:
        return None
    sent = [lead.get(f"touch_{n}_sent", "").strip() for n in (1, 2, 3)]
    if not sent[0]:
        return 1
    if sent[0] and not sent[1] and today >= date.fromisoformat(sent[0]) + timedelta(days=3):
        return 2
    if sent[1] and not sent[2] and today >= date.fromisoformat(sent[0]) + timedelta(days=8):
        return 3
    return None


def prepare(paths: Paths, target_date: date, limit: int, segment: str | None) -> None:
    state = load_state(paths)
    if state.get("paused"):
        raise CampaignError(f"Campaign is paused: {state.get('pause_reason', '')}")
    errors = validate_leads(paths)
    if errors:
        raise CampaignError("Lead validation failed:\n- " + "\n- ".join(errors))
    sender = validate_sender(paths)
    suppressed = suppressed_values(paths)
    leads = read_csv(paths.leads)
    eligible = [
        lead
        for lead in leads
        if (not segment or lead["segment"] == segment)
        and touch_due(lead, target_date)
        and not is_suppressed(lead["contact_email"], suppressed)
    ]
    touch_ones_today = sum(
        1
        for row in read_csv(paths.activity)
        if row.get("event") == "sent"
        and row.get("touch") == "1"
        and row.get("timestamp", "").startswith(target_date.isoformat())
    )
    available_new = max(0, 5 - touch_ones_today)
    chosen: list[tuple[dict[str, str], int]] = []
    for lead in eligible:
        touch = touch_due(lead, target_date)
        if touch == 1 and available_new <= 0:
            continue
        if touch == 1:
            available_new -= 1
        chosen.append((lead, int(touch)))
        if len(chosen) >= limit:
            break
    if not chosen:
        print("No approved, unsuppressed leads are due.")
        return
    batch_dir = paths.drafts / target_date.isoformat()
    batch_dir.mkdir(parents=True, exist_ok=True)
    for lead, touch in chosen:
        output = batch_dir / f"{lead['lead_id']}-touch-{touch}.txt"
        output.write_text(message_for(lead, touch, sender), encoding="utf-8")
        log_activity(paths, lead["lead_id"], "drafted", str(touch), str(output))
        print(output)


def find_lead(leads: list[dict[str, str]], lead_id: str) -> dict[str, str]:
    try:
        return next(lead for lead in leads if lead.get("lead_id") == lead_id)
    except StopIteration as exc:
        raise CampaignError(f"Unknown lead_id: {lead_id}") from exc


def mark_sent(paths: Paths, lead_id: str, touch: int, sent_on: date) -> None:
    state = load_state(paths)
    if state.get("paused"):
        raise CampaignError(f"Campaign is paused: {state.get('pause_reason', '')}")
    leads = read_csv(paths.leads)
    lead = find_lead(leads, lead_id)
    if lead.get("status") not in {"approved", "contacted"}:
        raise CampaignError("Lead must be approved before sending")
    if is_suppressed(lead["contact_email"], suppressed_values(paths)):
        raise CampaignError("Lead is suppressed")
    if touch == 1:
        sent_today = sum(
            1
            for row in read_csv(paths.activity)
            if row.get("event") == "sent"
            and row.get("touch") == "1"
            and row.get("timestamp", "").startswith(sent_on.isoformat())
        )
        if sent_today >= 5:
            raise CampaignError("Five-new-contact daily limit reached")
    lead[f"touch_{touch}_sent"] = sent_on.isoformat()
    lead["status"] = "contacted"
    write_csv(paths.leads, LEAD_FIELDS, leads)
    log_activity(paths, lead_id, "sent", str(touch), sent_on.isoformat())


def add_suppression(paths: Paths, scope: str, value: str, reason: str, lead_id: str) -> None:
    normalized = value.strip().lower()
    existing = read_csv(paths.suppression)
    if any(row.get("scope") == scope and row.get("value", "").lower() == normalized for row in existing):
        return
    append_csv(
        paths.suppression,
        SUPPRESSION_FIELDS,
        {
            "scope": scope,
            "value": normalized,
            "reason": reason,
            "recorded_on": date.today().isoformat(),
            "source_lead_id": lead_id,
        },
    )


def record_response(paths: Paths, lead_id: str, response_type: str, notes: str) -> None:
    leads = read_csv(paths.leads)
    lead = find_lead(leads, lead_id)
    lead["response_type"] = response_type
    lead["notes"] = notes
    lead["status"] = {
        "positive": "positive",
        "rejected": "closed",
        "unsubscribe": "suppressed",
        "legal_threat": "legal_hold",
    }[response_type]
    if response_type in {"rejected", "unsubscribe", "legal_threat"}:
        add_suppression(paths, "email", lead["contact_email"], response_type, lead_id)
    if response_type == "legal_threat":
        domain = lead["contact_email"].lower().rsplit("@", 1)[-1]
        add_suppression(paths, "domain", domain, response_type, lead_id)
        save_state(paths, {"paused": True, "pause_reason": f"Legal threat from {lead_id}; CEO/counsel review required"})
    write_csv(paths.leads, LEAD_FIELDS, leads)
    log_activity(paths, lead_id, f"response_{response_type}", details=notes)


def set_approval(paths: Paths, lead_ids: list[str]) -> None:
    leads = read_csv(paths.leads)
    for lead_id in lead_ids:
        lead = find_lead(leads, lead_id)
        if lead.get("status") != "researched":
            raise CampaignError(f"{lead_id} must be in researched status")
        lead["status"] = "approved"
        log_activity(paths, lead_id, "approved", details="CEO batch approval recorded")
    write_csv(paths.leads, LEAD_FIELDS, leads)


def resume(paths: Paths, reason: str) -> None:
    save_state(paths, {"paused": False, "pause_reason": ""})
    log_activity(paths, "CAMPAIGN", "resumed", details=reason)


def report(paths: Paths) -> None:
    leads = read_csv(paths.leads)
    counts: dict[str, int] = {}
    for lead in leads:
        counts[lead.get("status", "unknown")] = counts.get(lead.get("status", "unknown"), 0) + 1
    print(json.dumps({"state": load_state(paths), "lead_count": len(leads), "statuses": counts}, indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Approval-gated outreach campaign manager")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init")
    sub.add_parser("validate")
    approve = sub.add_parser("approve")
    approve.add_argument("lead_ids", nargs="+")
    prep = sub.add_parser("prepare")
    prep.add_argument("--date", default=date.today().isoformat())
    prep.add_argument("--limit", type=int, default=5)
    prep.add_argument("--segment", choices=sorted(ALLOWED_SEGMENTS))
    sent = sub.add_parser("mark-sent")
    sent.add_argument("lead_id")
    sent.add_argument("--touch", type=int, choices=(1, 2, 3), required=True)
    sent.add_argument("--date", default=date.today().isoformat())
    response = sub.add_parser("record-response")
    response.add_argument("lead_id")
    response.add_argument("--type", choices=sorted(RESPONSE_TYPES), required=True)
    response.add_argument("--notes", default="")
    suppress = sub.add_parser("suppress")
    suppress.add_argument("--scope", choices=("email", "domain"), required=True)
    suppress.add_argument("--value", required=True)
    suppress.add_argument("--reason", required=True)
    resume_cmd = sub.add_parser("resume")
    resume_cmd.add_argument("--reason", required=True)
    sub.add_parser("report")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    paths = Paths(args.data_dir.resolve())
    try:
        if args.command == "init":
            initialize(paths)
        elif args.command == "validate":
            errors = validate_leads(paths)
            if errors:
                raise CampaignError("Lead validation failed:\n- " + "\n- ".join(errors))
            validate_sender(paths)
            print(f"Validated {len(read_csv(paths.leads))} leads and sender profile.")
        elif args.command == "approve":
            set_approval(paths, args.lead_ids)
        elif args.command == "prepare":
            prepare(paths, date.fromisoformat(args.date), min(args.limit, 5), args.segment)
        elif args.command == "mark-sent":
            mark_sent(paths, args.lead_id, args.touch, date.fromisoformat(args.date))
        elif args.command == "record-response":
            record_response(paths, args.lead_id, args.type, args.notes)
        elif args.command == "suppress":
            add_suppression(paths, args.scope, args.value, args.reason, "manual")
        elif args.command == "resume":
            resume(paths, args.reason)
        elif args.command == "report":
            report(paths)
    except (CampaignError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
