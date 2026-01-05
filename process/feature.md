# Feature Development Process

> Workflow for implementing new features with AI assistance.

STARTER_SYMBOL=📝

---

## Phase 1: Understanding

### Steps
1. Read requirements (user request or `docs/requirements.md`)
2. Ask clarifying questions - ONE at a time
3. Identify what already exists in codebase
4. Check `docs/architecture.md` for relevant patterns

### Questions to ask
- What is the expected user flow?
- What data is needed?
- What existing code can we reuse?
- What are the acceptance criteria?

### Checkpoint
- [ ] Requirements clear
- [ ] Scope defined
- [ ] No ambiguity remaining

---

## Phase 2: Test List

### Steps
1. Write tests as single English sentences
2. Order by TDD ZOMBIES (Zero, One, Many, Boundary, Interface, Exception, Simple)
3. Get user approval on test list before coding

### Template
```markdown
## Test List for [Feature Name]

### Happy Path
- User can [action] with valid [input]
- System returns [expected output]

### Edge Cases
- [Empty state] returns [behavior]
- [Invalid input] shows [error message]
- [Boundary condition] handles [correctly]

### Error Handling
- Missing [required field] returns 400
- Unauthorized user returns 401
- Not found returns 404
```

### Checkpoint
- [ ] Test list written
- [ ] User approved test list
- [ ] Save test list to `memory/goal.md`

---

## Phase 3: Implementation

### Steps
1. Follow TDD workflow (see `process/tdd.md`)
2. One test at a time: 🔴 → 🟢 → 🧹
3. Commit after each green phase
4. Update `memory/goal.md` as tests complete

### Rules
- Never skip tests
- Never write code without a failing test
- State hypothesis before running tests
- Keep changes small and verifiable

### Checkpoint
- [ ] All tests passing
- [ ] Code committed
- [ ] No skipped tests

---

## Phase 4: Documentation

### Steps
1. Update `docs/architecture.md` if new patterns introduced
2. Update `docs/decisions.md` if significant choices made
3. Add inline comments only where code isn't self-explanatory
4. Update README if user-facing changes

### What to document
- New API endpoints
- New database tables/fields
- Configuration options
- Breaking changes

### Checkpoint
- [ ] Architecture doc updated (if needed)
- [ ] Decision recorded (if needed)
- [ ] Changes documented

---

## Phase 5: Review

### Steps
1. Run full test suite
2. Review diff for unintended changes
3. Check for security issues (OWASP top 10)
4. Verify no hardcoded secrets

### Self-review checklist
- [ ] All tests pass
- [ ] No console.logs left
- [ ] No commented-out code
- [ ] No hardcoded values that should be config
- [ ] Error handling in place
- [ ] Input validation where needed

### Checkpoint
- [ ] Review complete
- [ ] Ready for commit/PR
- [ ] Update starter to ✅

---

## Commit Message Format

```
feat: [short description]

- [bullet point of what changed]
- [bullet point of what changed]

Tests: [number] added/modified
```

---

## If You Get Stuck

1. **Stop** - Don't let bad output contaminate context
2. **Summarize** - Write current state to `memory/goal.md`
3. **Ask** - "What would you recommend?" (Reverse Direction)
4. **Split** - Break the problem into smaller pieces
5. **Fresh context** - Start new conversation if needed
