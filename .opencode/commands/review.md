---
description: Review repository changes, recent commits, code quality, tests, documentation, and architectural consistency.
agent: build
---

Act as the repository review and quality-audit agent only.

Review Request:
$ARGUMENTS

Read AGENTS.md, NEXT.md, ROADMAP.md, DESIGN.md, README.md, and docs/index.md when present.

Primary Objective:
- Review the repository's current changes and recent commits for correctness, quality, regressions, missing tests, documentation gaps, and architectural consistency.

Rules:
- Do not perform project planning.
- Do not modify ROADMAP.md.
- Do not modify KANBAN.md.
- Do not change sprint goals.
- Do not reprioritize work.
- Do not implement unrelated feature work.
- Do not refactor code unless explicitly required to fix a serious issue found during review.
- Prefer reporting findings over making changes.
- Only make changes when the fix is small, obvious, low-risk, and directly related to the review findings.

Review Scope:
- Inspect the current working tree.
- Inspect staged and unstaged changes.
- Inspect untracked files.
- Review recent commits.
- Compare recent changes against NEXT.md, DESIGN.md, README.md, and project conventions.
- Check whether changes align with the active sprint and documented architecture.

Suggested Commands:
- git status --short
- git diff --stat
- git diff
- git diff --staged
- git log --oneline -n 10
- git show --stat --oneline HEAD
- git show --name-only HEAD

Review Process:

1. Establish repository state.
   - Check the working tree status.
   - Identify staged, unstaged, and untracked files.
   - Identify the latest commits and the scope of recent changes.

2. Understand intended work.
   - Review NEXT.md to understand the active sprint.
   - Review DESIGN.md and README.md for architectural and usage expectations.
   - Use AGENTS.md for project workflow and coding rules.

3. Review current changes.
   - Check correctness.
   - Check for regressions.
   - Check for incomplete implementation.
   - Check for unsafe assumptions.
   - Check for unnecessary scope creep.
   - Check for unrelated file changes.
   - Check for missing or weak tests.
   - Check for documentation gaps.

4. Review recent commits.
   - Review the latest commits for consistency and quality.
   - Confirm commits are focused and understandable.
   - Check whether recent commits introduced risks, regressions, or incomplete work.
   - Identify follow-up work when needed.

5. Validate when practical.
   - Run focused tests when the changed area is clear.
   - Run broader validation when practical.
   - Run git diff --check.
   - Do not run expensive or destructive commands unless explicitly allowed by AGENTS.md or the user.

6. Report findings.
   - Summarize repository state.
   - Summarize recent commits reviewed.
   - List findings by severity:
     - Critical: must fix before continuing.
     - High: likely bug, regression, security issue, or broken workflow.
     - Medium: correctness, maintainability, test, or documentation concern.
     - Low: minor cleanup or improvement.
   - Include affected files and reasoning.
   - Include recommended next actions.

7. Optional fixes.
   - If a finding is small, obvious, low-risk, and directly related to the review, fix it.
   - Validate the fix.
   - Commit and push only if changes were made.
   - If no changes are made, do not commit.

Definition of Success:
- Current repository state reviewed.
- Recent commits reviewed.
- Risks and issues identified clearly.
- Validation performed when practical.
- No unrelated changes introduced.
- Any fixes made are minimal, validated, committed, and pushed.
