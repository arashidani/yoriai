---
name: review-merge-request
description: Review a teammate's pull request or merge request in this project and prepare a respectful completion comment. Use when Codex is asked to review an MR/PR, inspect its diff or checks, or draft review feedback. Do not summarize the author's changes unless the user explicitly asks. Present the exact review status and comments, then wait for explicit user approval before submitting a review, approving, requesting changes, or posting comments.
---

# Review Merge Request

## Review the change

- Inspect the diff, relevant code paths, and available checks before commenting.
- Report actionable defects accurately. Do not approve or use LGTM when a blocking issue remains.
- Do not restate or summarize the author's changes unless the user explicitly requests it.

## Leave the completion comment

When no blocking issue remains, leave one short top-level comment:

```text
レビューしました。LGTMです！🙆‍♂️
```

When changes are needed, leave actionable inline comments as necessary, then add one short top-level comment without summarizing the diff:

```text
レビューしました。確認をお願い致します 🙇‍♂️
```

## Handle additional instructions

Append user-specified text before the final respectful closing. Follow explicit instructions about the review's scope, tone, or required wording.

## Confirm before external actions

- First present the proposed review status and every top-level or inline comment exactly as it will be submitted.
- Wait for explicit user approval after the preview before submitting the review, approving, requesting changes, or posting any comment.
- Do not push code, update an MR/PR, or change its state as part of a review unless the user separately approves that action.
