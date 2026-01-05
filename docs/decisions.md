# Architecture Decision Records

> Document significant technical decisions and their rationale.

---

## ADR-001: Project Structure (ACP + DEO)

**Date:** 2025-12-31
**Status:** Accepted

### Context
Setting up a new full-stack app project that will be developed with AI assistance.

### Decision
Use Augmented Coding Patterns (ACP) as the primary methodology with a light Directives-Execution-Orchestration (DEO) layer for automations as needed.

### Rationale
- ACP provides process rigor (TDD, small steps, feedback loops)
- DEO provides execution reliability when automations emerge
- For mostly-coding work, ACP is primary
- DEO folders added only when recurring automations needed

### Consequences
- Process files guide AI collaboration
- Memory folder enables cross-session context
- Must maintain `memory/goal.md` and `memory/state.md`
- Must follow TDD workflow for new features

---

## ADR-002: [Title]

**Date:** [YYYY-MM-DD]
**Status:** [Proposed | Accepted | Deprecated | Superseded]

### Context
[What is the issue that we're seeing that is motivating this decision?]

### Decision
[What is the change that we're proposing and/or doing?]

### Rationale
[Why is this the best choice among alternatives?]

### Alternatives Considered
1. [Alternative 1]: [Why rejected]
2. [Alternative 2]: [Why rejected]

### Consequences
- [What becomes easier?]
- [What becomes harder?]
- [What are the risks?]

---

## Template

Copy this for new decisions:

```markdown
## ADR-XXX: [Title]

**Date:** [YYYY-MM-DD]
**Status:** [Proposed | Accepted | Deprecated | Superseded]

### Context
[What is the issue?]

### Decision
[What are we doing?]

### Rationale
[Why this choice?]

### Alternatives Considered
1. [Alternative]: [Why rejected]

### Consequences
- [Impact]
```

---

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| 001 | Project Structure (ACP + DEO) | Accepted | 2025-12-31 |
