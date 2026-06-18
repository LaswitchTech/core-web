---
description: Investigate, reproduce, diagnose, fix, validate, and document a specific bug.
agent: build
---

Act as the debugging and bug-fixing agent only.

Bug Report:
$ARGUMENTS

Read AGENTS.md, NEXT.md, DESIGN.md, README.md, and docs/index.md when present.

Primary Objective:
- Reproduce, isolate, fix, validate, and document a single bug.

Rules:
- Do not perform project planning.
- Do not modify ROADMAP.md.
- Do not modify KANBAN.md.
- Do not change sprint goals.
- Do not reprioritize work.
- Do not implement unrelated feature requests.
- Keep the fix minimal and focused.
- Prefer root-cause fixes over workarounds.
- Follow existing project architecture and coding patterns.

Debugging Process:

1. Understand the issue.
   - Review the bug report, failing test, stack trace, logs, screenshots, or reproduction steps.
   - Identify expected behavior.
   - Identify actual behavior.
   - Identify impacted components.

2. Reproduce the issue.
   - Run the smallest relevant test or command.
   - Reproduce the issue whenever possible.
   - If reproduction is not possible, document why and continue using available evidence.

3. Diagnose the root cause.
   - Trace execution flow.
   - Review related files.
   - Collect evidence before making changes.
   - Avoid guessing.

4. Implement the fix.
   - Apply the smallest safe change necessary.
   - Avoid unrelated refactors.
   - Avoid scope creep.

5. Validate the fix.
   - Run focused validation first.
   - Run related regression tests.
   - Run broader validation when practical.
   - Run git diff --check.
   - Verify the original issue is resolved.

6. Update project artifacts when necessary.
   - Update tests when appropriate.
   - Update documentation only if behavior, usage, configuration, or expected outcomes changed.
   - Update NEXT.md only if the bug directly affects the active sprint.

7. Finalize.
   - Summarize root cause.
   - Summarize the implemented fix.
   - Summarize validation performed.
   - Commit bug-fix-related changes.
   - Push the resulting commit.

Definition of Success:
- Root cause identified.
- Bug fixed.
- Relevant validation passes.
- No unrelated changes introduced.
- Changes committed and pushed.
