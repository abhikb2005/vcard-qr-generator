# AGENTS.md — QuirkyQuoteMakr POD Project

> **Any agent asked about the POD project, QuirkyQuoteMakr, POD status, or "where are we" must read this file FIRST.**

## ⚠️ FIRST THING: Read the Status Tracker

Before answering ANY question about the POD project status, progress, next steps, or schedule:

1. **Read `ideas/pod-quirkyquotemakr/POD_STATUS_TRACKER.md`** — this is the single source of truth for what's done, what's pending, and where we are on the timeline.
2. **Read `ideas/pod-quirkyquotemakr/MARKETING_PLAYBOOK.md`** — this is the 13-week marketing plan with weekly checklists, decision gates, and strategy.
3. **Calculate the current week** based on `launch_date` in the status tracker vs today's date.
4. **Report to the user:**
   - Current week number in the 13-week plan
   - What should be completed by now (based on the schedule)
   - What's actually completed (based on checkboxes in the tracker)
   - What's overdue (scheduled but not checked off)
   - What's next (this week's tasks)
   - Any decision gates coming up

## How to Answer "Where Are We?"

When the user asks any variant of:
- "Where are we on the POD project?"
- "What's the status of QuirkyQuoteMakr?"
- "What's completed, what's pending?"
- "Where do we start?"
- "What should I be doing this week?"

**Follow this script:**

```
1. Read POD_STATUS_TRACKER.md
2. Get launch_date from the tracker
3. Calculate: current_week = ceil((today - launch_date) / 7)
4. If current_week > 13: we're past the 90-day plan — check Gate 4 status
5. Report:
   - "We're in Week X of the 13-week marketing plan."
   - "Completed: [list checked items for weeks up to now]"
   - "Overdue: [list unchecked items for past weeks]"
   - "This week's tasks: [list items for current week]"
   - "Next gate: [Gate N — criteria]"
   - "Blockers: [any noted blockers in the tracker]"
```

## Updating the Tracker

After completing any POD-related work:
1. Check off completed items in `POD_STATUS_TRACKER.md`
2. Add notes in the "Agent Notes" section with date and what was done
3. Update `last_updated` at the top of the tracker

## Key Files

### In this repo (`vcard-qr-generator/ideas/pod-quirkyquotemakr/`)
| File | Purpose |
|------|---------|
| `POD_STATUS_TRACKER.md` | **Read first** — schedule, checkboxes, current status |
| `MARKETING_PLAYBOOK.md` | Full 13-week strategy, SEO formulas, Pinterest plan, tool stack |

### In the `the-dark-cave` repo (`C:\Users\abhik\OneDrive\Documents\GitHub\the-dark-cave\ideas\pod-quirkyquotemakr\`)
| File | Purpose |
|------|---------|
| `PRODUCT_BRIEF.md` | PM brief — what works, priorities, go-to-market sequencing |
| `AUTOMATION_SETUP_GUIDE.md` | Pipeline blueprint (M1→M4) |
| `pod-automation/HANDOFF.md` | Technical handoff with thread history |
| `pod-automation/config/settings.json` | Pipeline configuration |
| `pod-automation/m4_upload/output/listings.json` | All 32 design listings |
| `pod-automation/m4_upload/output/upload_progress.json` | **Actual upload count** — read this for real numbers |
| `pod-automation/m3_design/output/` | All 32 design PNGs |

> ⚠️ **Always read `upload_progress.json` from `the-dark-cave` repo for the true upload count.** Do not guess from thread history.

## Standing Rules

- **Phase 3 automation** (social, hub, DroidClaw) requires AKB's explicit approval before building
- Use **Edge not Chrome** for browser automation
- Never commit secrets
- Budget ceiling: **$50/month**
- Follow the blueprint in `AUTOMATION_SETUP_GUIDE.md`
- Do NOT proceed past any Decision Gate without AKB's explicit go-ahead
