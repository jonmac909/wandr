# Current State

> Quick reference for current process state. Update after each phase change.

---

## Status

| Field | Value |
|-------|-------|
| **Phase** | 📝 Planning |
| **Current Task** | Project setup |
| **Blockers** | None |
| **Last Commit** | (none yet) |
| **Tests** | 0 passing, 0 failing |

---

## Phase Reference

| Symbol | Phase | Next Action |
|--------|-------|-------------|
| 📝 | Planning | Define requirements and test list |
| 🔴 | TDD Red | Write failing test |
| 🟢 | TDD Green | Make test pass |
| 🧹 | Refactor | Improve code, keep tests green |
| 🔍 | Investigating | Debug or explore |
| ⚠️ | Warning | Issue needs attention |
| ✅ | Complete | Task done |

---

## Quick Actions

**To start TDD:**
1. Update this file: Phase = 🔴
2. Pick first test from `goal.md`
3. Follow `process/tdd.md`

**To record a decision:**
1. Add to `docs/decisions.md`
2. Update `goal.md` decisions table

**To save a learning:**
1. Create `memory/learnings/[topic].md`
2. Note what you learned and why it matters

---

## Session Handoff

> Fill this in before ending a session to help next session pick up.

**What was accomplished:**
- [List items]

**What's next:**
- [List items]

**Important context:**
- [Anything the next session needs to know]
