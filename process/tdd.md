# TDD Process

> Test-Driven Development workflow for AI-assisted coding.

---

## Red Phase

STARTER_SYMBOL=🔴

### Steps
1. Pick next test from test list in `memory/goal.md`
2. Write the test as a single English sentence first
3. Convert to actual test code
4. Run tests - expect exactly ONE failure
5. State what you expect to happen (Hypothesize)

### Example
```markdown
Test: "User can register with valid email"

I expect this test to fail with "User is not defined"
because we haven't created the User model yet.
```

### Checkpoint
- [ ] Test written and failing
- [ ] Failure message matches expectation
- [ ] Update starter to 🟢, proceed to Green Phase

---

## Green Phase

STARTER_SYMBOL=🟢

### Steps
1. Make the SMALLEST change to pass the test
2. Don't add extra functionality
3. Don't refactor yet
4. Run tests - ALL should pass

### Rules
- Fake it till you make it (return hardcoded values if needed)
- Only write code that makes the current test pass
- Resist the urge to "improve" while green

### Checkpoint
- [ ] Test passes
- [ ] No other tests broken
- [ ] Update starter to 🧹, proceed to Refactor Phase

---

## Refactor Phase

STARTER_SYMBOL=🧹

### Steps
1. Look for improvements (NO behavior change)
2. Make ONE small refactoring
3. Run tests - must still pass
4. Commit if tests pass

### What to look for
- Duplication to remove
- Names to clarify
- Long methods to extract
- Magic numbers to name

### Rules
- Never change behavior during refactor
- If tests fail, undo immediately
- One refactoring at a time

### Checkpoint
- [ ] Code improved
- [ ] All tests still pass
- [ ] Committed checkpoint
- [ ] Return to 🔴 for next test

---

## TDD ZOMBIES

Use this order for test cases:

| Letter | Meaning | Example |
|--------|---------|---------|
| Z | Zero | Empty list, null, zero |
| O | One | Single item, one user |
| M | Many | Multiple items, edge cases |
| B | Boundary | Min/max values, limits |
| I | Interface | Public API contracts |
| E | Exception | Error handling, failures |
| S | Simple | Happy path scenarios |

---

## Test List Template

Keep in `memory/goal.md`:

```markdown
## Test List for [Feature]

- [ ] Zero: Empty state returns empty array
- [ ] One: Single item is returned correctly
- [ ] Many: Multiple items sorted by date
- [ ] Boundary: Max 100 items returned
- [ ] Interface: Returns proper JSON structure
- [ ] Exception: Returns 404 for missing resource
- [ ] Simple: Basic CRUD operations work
```

---

## Quick Commands

```bash
# Run tests
npm test

# Run single test file
npm test -- path/to/test.ts

# Run tests in watch mode
npm test -- --watch

# Create checkpoint
git add -A && git commit -m "🔴 failing test: [description]"
git add -A && git commit -m "🟢 passing: [description]"
git add -A && git commit -m "🧹 refactor: [description]"
```
