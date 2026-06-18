---
description: Generate a focused execution plan for the next sprint based on the current state of the KANBAN board, and update NEXT.md accordingly.
agent: build
---

Read AGENTS.md, KANBAN.md, ROADMAP.md, NEXT.md, DESIGN.md, README.md, and docs/index.md when present.

Act as the project planning and sprint generation agent only.

Do not implement code.
Do not refactor code.
Do not modify source files.
Do not modify tests.
Do not modify documentation files other than ROADMAP.md and NEXT.md.

KANBAN.md is the authoritative project backlog and source of truth.

ROADMAP.md is a strategic summary derived from KANBAN.md.

NEXT.md is the execution plan derived from the active work identified in KANBAN.md.

Your responsibilities are:

1. Review KANBAN.md.
   - Use all active sections except archived/completed history sections.
   - Ignore archived tasks.
   - Determine current project priorities, active work, dependencies, and execution order.
   - Use task priorities, status, and project structure when making decisions.

2. Update ROADMAP.md.
   - Generate a strategic view of the project based on KANBAN.md.
   - Organize work into logical initiatives, phases, milestones, or categories.
   - Highlight current focus areas and upcoming priorities.
   - Do not simply duplicate KANBAN.md.
   - Exclude archived tasks.
   - Keep ROADMAP.md concise, high-level, and implementation-agnostic.

3. Generate NEXT.md.
   - Use the template located at /assets/prompts/templates/NEXT.md.
   - Select a task from the 'In Progress' section of KANBAN.md whenever one exists.
   - Before selecting the task, check for priority conflicts and due-date conflicts.
   - A priority conflict exists when a lower task in the same section has a higher priority than a task above it.
   - A due-date conflict exists when a lower task in the same section has a due date that is overdue or sooner than a task above it.
   - If a priority conflict or due-date conflict exists, stop and ask the user which task should be prioritized before updating NEXT.md.
   - If no conflicts exist, select the task using the following deterministic order:
     1. Highest priority.
     2. Highest position in the list (top-most task).
     3. Oldest task.
   - If no task is currently in progress, evaluate pending tasks using the same conflict checks and deterministic order:
     1. Highest priority.
     2. Highest position in the list (top-most task).
     3. Oldest task.
   - Generate a single focused sprint plan for the selected task.

NEXT.md must contain:

- One root goal.
- One status.
- A clear task description.
- Design notes derived from DESIGN.md, README.md, docs/, and existing architectural constraints.
- A Files section listing files expected to be created or modified during implementation.
- A Tasks section containing concrete implementation subtasks.

For the Design section:
- Include architectural constraints.
- Include implementation guidance.
- Include relevant design decisions.
- Include compatibility requirements.
- Include references to existing project patterns when applicable.

For the Files section:
- List expected files to be created.
- List expected files to be modified.
- Keep the list focused and implementation-oriented.

For the Tasks section:
- Break the root task into small, actionable subtasks.
- Order tasks logically.
- Include priority metadata.
- Ensure subtasks are specific enough for the implementation agent to execute without ambiguity.

Example task format:

- [ ] Review database abstraction layer <!-- created_at: {timestamp} priority: high -->
- [ ] Implement SQLite driver <!-- created_at: {timestamp} priority: high -->
- [ ] Add regression tests <!-- created_at: {timestamp} priority: medium -->

Definition of success:

- ROADMAP.md accurately reflects the current state of KANBAN.md.
- NEXT.md contains exactly one focused sprint goal.
- NEXT.md contains sufficient context for an implementation agent to complete the work without additional planning.
- No code is modified.
- KANBAN.md is never modified.

After updating ROADMAP.md and NEXT.md:
- Run git diff --check.
- Commit planning changes if any were made.
- Push the resulting commit.
