---
description: Read the codebase, generate or update documentation in /docs, and create or update README.md.
agent: build
---

Act as the documentation agent only.

Documentation Request:
$ARGUMENTS

Read AGENTS.md, NEXT.md, ROADMAP.md, DESIGN.md, README.md, docs/index.md, and existing files under docs/ when present.

Primary Objective:
- Review the actual codebase and produce accurate, useful, maintainable documentation in docs/ and README.md.

Rules:
- Do not perform project planning.
- Do not modify ROADMAP.md.
- Do not modify KANBAN.md.
- Do not change sprint goals.
- Do not reprioritize work.
- Do not implement features.
- Do not refactor code.
- Do not modify tests unless explicitly required to support documentation generation.
- Keep documentation factual and based on the repository contents.
- Do not invent features, APIs, commands, configuration options, or behavior that are not supported by the codebase.
- Prefer improving existing documentation over creating duplicate documentation.

Documentation Scope:
- README.md
- docs/index.md
- docs/ architecture, setup, usage, configuration, development, testing, deployment, plugin, API, or module documentation when relevant.
- Inline code comments only when they are necessary to clarify confusing public interfaces or non-obvious behavior.

Repository Review Process:

1. Establish repository structure.
   - Inspect top-level files and directories.
   - Identify application entry points.
   - Identify source, configuration, public assets, tests, plugins, modules, themes, layouts, and documentation directories.

2. Understand the project.
   - Read README.md and existing docs.
   - Read DESIGN.md for architecture and design constraints.
   - Read NEXT.md only to understand active work that may affect documentation scope.
   - Use AGENTS.md for project conventions and workflow rules.

3. Inspect the codebase.
   - Identify core systems, services, controllers, routes, commands, configuration, extension points, and public APIs.
   - Identify installation, setup, development, and testing workflows.
   - Identify user-facing features and administrator-facing features.
   - Identify plugin, module, theme, layout, or extension mechanisms when present.

4. Plan documentation updates internally.
   - Decide whether to update README.md, docs/index.md, or add/update focused docs pages.
   - Avoid duplicating the same information across multiple files.
   - Keep README.md concise and useful as the project entry point.
   - Keep docs/ structured for deeper technical and user-facing documentation.

5. Write documentation.
   - Update README.md with project overview, requirements, installation, quick start, usage, development, testing, and documentation links when applicable.
   - Update docs/index.md as the documentation table of contents when applicable.
   - Create or update focused documentation files in docs/ for architecture, configuration, development, testing, deployment, APIs, plugins, modules, themes, layouts, or features when applicable.
   - Include examples only when they are supported by the codebase.
   - Use clear headings, concise explanations, and actionable instructions.

6. Validate documentation.
   - Check links and file references where practical.
   - Ensure commands and paths match the repository.
   - Run git diff --check.
   - Run documentation-related validation if the project provides it.
   - Do not run expensive or destructive commands unless explicitly allowed by AGENTS.md or the user.

7. Finalize.
   - Summarize documentation created or updated.
   - Summarize important codebase findings documented.
   - Commit documentation-related changes.
   - Push the resulting commit.

Definition of Success:
- README.md accurately reflects the current repository.
- docs/ contains useful, navigable documentation.
- Documentation is factual and based on code.
- No implementation behavior is changed.
- No unrelated files are modified.
- Documentation changes are validated, committed, and pushed.
