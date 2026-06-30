# Compliant Outreach Pilot

This runbook implements a 30-lead, US-only outreach pilot without committing contact data or sending messages automatically.

## Safety Boundary

- Real leads, suppression records, activity logs, sender identity, and drafts live under `.private/outreach/`, which is gitignored.
- Never import contact data captured by a QR form. Static QR generation remains client-side and private.
- Never buy or guess email addresses, scrape authenticated platforms, or contact uncertain jurisdictions.
- A person must approve each lead before a draft can be generated.
- A person must send each message. The tool records sends but never connects to an email provider.
- No more than five new contacts may be recorded on one calendar day.
- Every draft requires sender identity, a valid postal address, an advertisement disclosure, and an unsubscribe mechanism.

This workflow supports process control; it is not a substitute for legal advice.

## Setup

```powershell
py -3 scripts\outreach_campaign.py init
```

Complete `.private/outreach/sender.json` locally. Do not commit or paste the postal address into tracked files.

Populate `.private/outreach/leads.csv` using public business sources. Required states are:

- `researched`: source and commercial reason recorded, not approved for contact.
- `approved`: CEO approved the contact for the next batch.
- `contacted`: at least one touch was sent manually.
- `positive`: human sales response required within one business day.
- `closed`: ordinary rejection; address is suppressed.
- `suppressed`: unsubscribe; no further contact.
- `legal_hold`: legal threat; email and domain suppressed and campaign paused.

## Approval And Drafting

Validate sources and the sender profile:

```powershell
py -3 scripts\outreach_campaign.py validate
```

After CEO review, approve no more than one five-lead batch:

```powershell
py -3 scripts\outreach_campaign.py approve print-01 print-02 print-03 print-04 print-05
py -3 scripts\outreach_campaign.py prepare --segment print_partner --limit 5
```

Review each generated text file under `.private/outreach/drafts/YYYY-MM-DD/`. Sending remains manual. After sending one message:

```powershell
py -3 scripts\outreach_campaign.py mark-sent print-01 --touch 1
```

Touch 2 becomes eligible three days after touch 1. Touch 3 becomes eligible on day 9. Any recorded response cancels eligibility for all later touches.

## Response Handling

Positive response:

```powershell
py -3 scripts\outreach_campaign.py record-response print-01 --type positive --notes "Asked about client QR workflow"
```

Stop automation immediately. Reply manually within one business day, ask whether the need is a one-time branded QR or an editable/team QR, provide the appropriate attributed URL, and log verified Dodo revenue separately.

Rejection or unsubscribe:

```powershell
py -3 scripts\outreach_campaign.py record-response print-01 --type rejected --notes "Not interested"
py -3 scripts\outreach_campaign.py record-response print-02 --type unsubscribe --notes "Requested removal"
```

Both stop follow-ups. Unsubscribe is permanent unless the recipient later gives fresh, documented consent.

Legal threat:

```powershell
py -3 scripts\outreach_campaign.py record-response print-03 --type legal_threat --notes "Preserve the exact message privately"
```

This suppresses the address and company domain and pauses the whole campaign. Do not argue, admit liability, delete evidence, or resume selling. Notify the CEO and qualified counsel. Resume only after written clearance:

```powershell
py -3 scripts\outreach_campaign.py resume --reason "CEO and counsel clearance recorded outside Git"
```

## Review Gates

- After 15 sends, stop and review replies before approving another batch.
- After 30 sends: zero replies means replace targeting or opening message; replies without visits means replace the offer; visits without checkout starts means investigate message-to-page fit.
- A verified Dodo sale completes the immediate revenue goal. Keep only the winning segment for the next cycle.
