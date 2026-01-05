# Bug Fix Process

> Workflow for investigating and fixing bugs with AI assistance.

STARTER_SYMBOL=🔍

---

## Phase 1: Reproduce

### Steps
1. Get clear description of the bug
2. Identify steps to reproduce
3. Write a FAILING test that demonstrates the bug
4. Verify test fails for the right reason

### Questions to gather
- What is the expected behavior?
- What is the actual behavior?
- Steps to reproduce?
- Environment details (browser, OS, etc.)?
- When did it start happening?

### Template
```markdown
## Bug: [Short description]

**Expected:** [What should happen]
**Actual:** [What happens instead]

**Steps to reproduce:**
1. [Step 1]
2. [Step 2]
3. [Observe bug]

**Environment:** [Browser/OS/Version]
```

### Checkpoint
- [ ] Bug reproduced
- [ ] Failing test written
- [ ] Test fails for correct reason

---

## Phase 2: Investigate

### Steps
1. State hypothesis about root cause
2. Add logging/debugging to verify
3. Trace the code path
4. Identify the exact location of the bug

### Hypothesis template
```
I suspect the bug is in [location] because [reasoning].
I expect to see [X] but we're getting [Y].
```

### Investigation techniques
- Add console.log at key points
- Check recent git commits
- Review related tests
- Search for similar issues

### Checkpoint
- [ ] Root cause identified
- [ ] Location of bug pinpointed
- [ ] Hypothesis verified

---

## Phase 3: Fix

### Steps
1. State the minimal fix needed
2. Make the SMALLEST change possible
3. Run the failing test - should now pass
4. Run full test suite - no regressions

### Rules
- Don't refactor while fixing
- Don't fix "nearby" issues
- One fix per commit
- Keep the change minimal

### Checkpoint
- [ ] Fix implemented
- [ ] Originally failing test now passes
- [ ] No other tests broken

---

## Phase 4: Verify

### Steps
1. Test the fix manually (if applicable)
2. Check for related edge cases
3. Add additional tests if gaps found
4. Review the fix for unintended consequences

### Questions to verify
- Does this fix all variations of the bug?
- Could this break something else?
- Are there similar bugs elsewhere?
- Should we add more test coverage?

### Checkpoint
- [ ] Manual testing passed
- [ ] Edge cases covered
- [ ] No regressions

---

## Phase 5: Document

### Steps
1. Commit with clear message explaining the fix
2. Add to `memory/learnings/` if significant
3. Update tests if behavior changed intentionally
4. Close related issues/tickets

### Commit message format
```
fix: [short description of what was fixed]

Root cause: [why the bug existed]
Solution: [what was changed to fix it]

Fixes #[issue number]
```

### Learning template
```markdown
# learnings/bug-[date]-[short-name].md

## Bug
[Description of what went wrong]

## Root Cause
[Why it happened]

## Fix
[What we changed]

## Prevention
[How to avoid this in future]
```

### Checkpoint
- [ ] Committed with clear message
- [ ] Learning documented (if significant)
- [ ] Update starter to ✅

---

## Common Bug Patterns

| Pattern | Typical Cause | Investigation |
|---------|---------------|---------------|
| Works locally, fails in prod | Environment config | Check env vars, API URLs |
| Intermittent failure | Race condition | Add logging, check async code |
| Works for some users | Data-dependent | Check user data differences |
| Recently started | Recent change | Git bisect, review commits |
| After dependency update | Breaking change | Check changelog, lock versions |

---

## If Investigation Stalls

1. **State what you know** - Write it down
2. **State what you don't know** - Identify gaps
3. **Rubber duck** - Explain the bug out loud
4. **Fresh eyes** - Take a break or ask for help
5. **Bisect** - Find the commit that introduced it
6. **Simplify** - Create minimal reproduction
