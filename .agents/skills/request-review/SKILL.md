---
name: request-review
description: Draft a pull request or merge request review request for this project. Use when Codex needs to summarize implementation and verification, prepare an MR/PR description, request a teammate's review, or append user-provided review notes. Present the exact draft and wait for explicit user approval before creating, publishing, or requesting review. End the review-request text with a respectful Japanese closing such as 「レビューお願い致します 🙇‍♂️」.
---

# Request Review

## Prepare the request

- Inspect the actual diff, test results, and relevant issue context before writing.
- Use the platform's term when known: GitHub uses PR; GitLab uses MR. Treat “MR” and “PR” as the same workflow otherwise.
- Do not claim tests, behaviors, or review scope that were not verified.

## Write the MR/PR description

Use concise, friendly Japanese that is easy for frontend and backend engineers to understand. Describe the product or API behavior that changed, rather than implementation details or source-code edits.

```md
## 概要

- <変更の目的>

## 変更内容

- <アプリ上で変わることを、やさしく簡潔に書く>

## 確認内容

- <実行・確認した内容>

<ユーザーから指定された追記があればここに入れる>

レビューお願い致します 🙇‍♂️
```

Keep the closing as the final sentence. Use a similarly respectful variation only when it better matches the user's wording.

Write changes at this level of detail:

- `質問の投稿時に、同じ内容が重複して作られにくくなるようにしました。`
- `投稿に失敗した場合、原因を画面上で確認できるようにしました。`
- `投稿APIがエラー時にも決まった形式で応答するようにしました。`

Avoid listing file names, hooks, database queries, or other source-code-level details unless the user explicitly asks for them.

## Handle additional instructions

- Add user-specified text to the description without replacing the respectful closing.
- Preserve the user's intended meaning; improve only clarity, formatting, and politeness unless asked to rewrite it.
- Ask for clarification only when the requested content would make the MR/PR misleading or materially change its scope.

## Confirm before external actions

- First present the proposed title, MR/PR description, target branch, and any reviewer or label changes.
- Wait for explicit user approval after the preview before pushing, creating or updating an MR/PR, assigning reviewers, or sending a review request.
- Treat “looks good”, “that wording is fine”, or an equivalent clear confirmation as approval only for the previewed external actions.
- Follow the repository's existing PR/MR workflow and use the available platform integration when one is configured.
