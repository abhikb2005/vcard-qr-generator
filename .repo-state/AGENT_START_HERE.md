# Agent Start Here

Last updated: 2026-06-07

This file is mandatory startup context for AI agents working in `vcard-qr-generator`.

## Current Clean State

As of 2026-06-07:

- The only active local worktree should be the main repo folder: `C:\Users\abhik\OneDrive\Documents\GitHub\vcard-qr-generator`
- `main` was reset to clean `origin/main`.
- Old worktree folder clutter was removed.
- Product/site work that was previously dirty was preserved on a safety branch.
- Private outreach data was not committed.

## Mandatory First Commands

Run these before editing:

```powershell
git status -sb
git branch --show-current
git branch --format="%(refname:short)"
git stash list
git worktree list
```

If `git status -sb` does not show a clean branch, stop and inspect before editing.

## Branches Already In Progress

Do not create a new branch until you check these existing branches:

```text
safety/vcard-product-work-20260607
backup/vcard-main-before-cleanup-20260607
codex/dynamic-seo-engine
backup-restore-attempt
fix-backup
fix/adsense-remediation-01
```

Meaning:

- `safety/vcard-product-work-20260607`: preserved product/site work from the old dirty main branch.
- `backup/vcard-main-before-cleanup-20260607`: pointer to the old local main before cleanup.
- `codex/dynamic-seo-engine`: preserved unique dynamic SEO work.
- `backup-restore-attempt`, `fix-backup`, `fix/adsense-remediation-01`: old branches with unique historical commits. Review before deleting.

If your task sounds related to any of these, inspect that branch first.

## Rules For New Work

- Prefer working on clean `main` for tiny documentation-only changes.
- For product/code changes, create one clearly named branch only after checking existing branches.
- Do not create worktrees unless the user explicitly asks or there is a strong reason.
- If you create a branch or worktree, record:
  - branch/worktree name
  - reason it exists
  - files in scope
  - cleanup condition
  - date created

## Forbidden Without Explicit Approval

- `git reset --hard`
- `git clean -fd` or `git clean -fdx`
- branch deletion
- worktree deletion
- stash drop
- merge to `main`
- rebase shared branches
- push
- force push
- deleting files that were not created by the current agent
- committing private outreach/contact data

## End Of Session Checklist

Before ending, report:

```text
git status -sb
current branch
files changed
tests/checks run
whether a branch/worktree/stash needs cleanup
```

If the repo is not clean, explain exactly what remains and why.
