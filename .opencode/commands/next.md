---
description: Generate a focused execution plan for the next sprint based on the current state of the KANBAN board, and update NEXT.md accordingly.
agent: coder
---

Read AGENTS.md, NEXT.md, ROADMAP.md, DESIGN.md, and README.md.

Act as the implementation agent only.

NEXT.md is the authoritative execution plan.
ROADMAP.md is generated strategic context.
KANBAN.md is managed by the Project Management application.

Do not read or update KANBAN.md.
Do not reprioritize work.
Do not change sprint goals.
Do not create new sprint goals.
Do not perform project planning.
Do not modify ROADMAP.md.

Before making changes:
- Review the Goal, Status, Design, Files, and Tasks sections of NEXT.md.
- Treat the Design section as authoritative implementation guidance.
- Follow architectural constraints, compatibility requirements, and implementation notes defined in NEXT.md.
- Use the Files section to determine the expected scope of work.
- Avoid modifying files that are not listed unless absolutely necessary to complete the task safely.

Execution rules:
- Complete only the first unchecked task that is ready to be executed.
- Respect task dependencies and logical execution order.
- Keep the change small and focused.
- Follow existing project patterns.
- Avoid unrelated refactors.
- Do not skip ahead to future tasks.

Validation:
- Run focused validation first.
- Run broader validation when practical.
- Run git diff --check.
- Resolve issues introduced by the current task before proceeding.

After successful validation:
- Mark the completed task as checked ([x]) in NEXT.md.
- Update implementation notes only when required to accurately reflect completed work.
- Add immediate follow-up tasks only when they are strictly required to safely continue execution of the current sprint.
- Update documentation or README.md if behavior changed.

Sprint completion:
- If all tasks in NEXT.md are completed, update the sprint status to Completed.
- Do not generate new work.
- Do not create additional sprint goals.
- Leave sprint planning to the /plan command.

Finally:
- Commit all task-related changes.
- Push the resulting commit.
