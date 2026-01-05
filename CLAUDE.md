# CLAUDE.md

> Augmented Coding Patterns + Directives-Execution-Orchestration for reliable AI-assisted development.

---

## Core Philosophy

Augmented coding is about teaching the AI what you would do - externalizing your reasoning step by step so the agent can pick it up and run with it.

**Key Principles:**
- Small steps and iteration are essential - break big tasks into tiny, verifiable steps
- Feedback loops are critical - the more ways to verify success, the more autonomy is possible
- Context management prevents drift - smaller, focused contexts lead to better results
- Delete mercilessly - outdated documentation actively harms AI performance
- Test first is more obvious than ever - agents need all the feedback they can get

**Why deterministic execution matters:** 90% accuracy per step = 59% success over 5 steps. Push complexity into deterministic code.

---

## Ground Rules

ALWAYS follow these rules in every interaction:

### Communication
- ALWAYS start replies with a STARTER_SYMBOL emoji (default: 🔧)
- Be extremely succinct - avoid verbose explanations
- One question at a time - never overwhelm with multiple questions
- Warn proactively if you detect potential issues or mistakes

### Process
- Work in small, verifiable steps - never make large changes at once
- State expectations before running code (Hypothesize pattern)
- Run tests before AND after changes
- Commit frequently at stable checkpoints
- Ask "what would you recommend?" before proposing solutions (Reverse Direction)

### Context Management
- Track what files you've read using context markers
- When context gets large, summarize and save to files
- Delete or ignore outdated documentation
- Focus on one task at a time

---

## Starter Symbols (Process Identity)

Use these emojis to indicate current state:

| Symbol | State | Description |
|--------|-------|-------------|
| 🔧 | Default | General working state |
| 🔴 | TDD Red | Writing a failing test |
| 🟢 | TDD Green | Making the test pass |
| 🧹 | Refactor | Improving code without changing behavior |
| ✅ | Task Complete | Task finished successfully |
| ⚠️ | Warning | Issue detected, needs attention |
| 🔍 | Investigating | Analyzing or exploring |
| 📝 | Planning | Creating a plan or documentation |
| 🚀 | Deploying | Deployment or release activities |

When a starter symbol is missing, something is wrong - context may be drifting.

---

## 3-Layer Architecture (DEO)

When automations emerge, use this pattern:

**Layer 1: Directives** (`directives/`)
- SOPs in Markdown defining goals, inputs, tools, outputs, edge cases
- Living documents—update when you discover API limits, better approaches, or common errors

**Layer 2: Orchestration** (You/Claude)
- Read directives, call execution scripts in order, handle errors
- Don't do work yourself—route to scripts

**Layer 3: Execution** (`execution/`)
- Deterministic Python scripts for API calls, data processing, file operations
- Environment variables in `.env`

---

## Directory Structure

```
SUPER/
├── CLAUDE.md              # This file - ground rules
├── process/               # ACP: Process files for workflows
│   ├── tdd.md            # TDD red-green-refactor cycle
│   ├── feature.md        # New feature workflow
│   └── bugfix.md         # Bug investigation workflow
├── docs/
│   ├── architecture.md   # System overview (keep updated!)
│   ├── decisions.md      # ADRs - why we chose X over Y
│   └── requirements.md   # Current requirements
├── memory/
│   ├── goal.md           # Current goal and tasks
│   ├── state.md          # Current state indicator
│   └── learnings/        # Accumulated knowledge
├── directives/           # DEO: SOPs (add when needed)
├── execution/            # DEO: Scripts (add when needed)
├── src/                  # Source code
├── tests/                # Test files
└── .tmp/                 # Intermediate files (gitignored)
```

---

## Key Patterns

### 🤖 To Augment Oneself
Before taking action, pause to explore what you would do manually:
- What steps would you take?
- What considerations matter?
- Externalize reasoning step by step

### 📄 Process Files
Use markdown files to describe tasks:
```markdown
STARTER_SYMBOL=✅

# Task Name

Intent: Brief description of the goal

1. First step
2. Second step
3. Verify with tests
4. Ask for review
```

### 🔀 Subagent / Subtask
For complex tasks, delegate to fresh contexts:
- Pass necessary information through files (Cross-Context Memory)
- Summarize results when complete
- Return to initiator

### 🌐 HATEOAG (Hypertext as Engine of Agent Guidance)
Use hypertext to guide navigation through:
- Process files
- Documentation
- Code references
- Memory files

Links invite the agent to jump, read, and act.

### 🧭 Orchestrator Pattern
For complex workflows, create an orchestrator:
```markdown
# orchestrator.md

STARTER_SYMBOL=🎯

1. Check current state in `state.md`
2. Route to appropriate process:
   - 🔴: Run `process/tdd.md`
   - 🟢: Make it pass
   - 🧹: Run refactor
3. Update state after completion
4. Loop until task complete
```

### ✂️ Split Process (Divide to Prevent Drift)
When processes are too long:
1. Break into smaller process files
2. Use orchestrator to coordinate
3. Track progress with state indicators
4. Use checkpoints between steps

### 🤔 Hypothesize
Before running code, state expectations:
```
I expect this test to fail with "undefined method 'authenticate'"
because we haven't implemented the User model yet.
```

This reinforces intent and catches misalignment early.

### ❓ Ask, Don't Tell (Reverse Direction)
**Instead of:** "Use React for the frontend"
**Ask:** "What frontend frameworks would you recommend for this use case?"

This:
- Keeps solution space open
- Leverages AI knowledge
- Avoids answer injection
- Creates learning opportunities

### ✅ Test First (Non-negotiable)
- No production code without a failing test
- Write tests as single lines of English first
- Tests provide feedback for the agent
- Keep code running at all times

Example test list:
```markdown
# Tests for User Authentication

- User can register with valid email
- Registration fails with invalid email format
- Registration fails with existing email
- User can login with correct credentials
- Login fails with wrong password
```

### 🪜 One Problem at a Time
- Break big steps into smaller ones
- Take the smallest step first
- Solve one problem before moving to the next
- Use vertical slicing
- Apply TDD ZOMBIES (Zero, One, Many, Boundary, Interface, Exception, Simple)

### 💾 Cross-Context Memory
AI forgets between contexts. Use persistent files in `memory/`:
- `goal.md` - Current objective and task list
- `state.md` - TDD phase, blockers, current task
- `learnings/*.md` - Decisions and knowledge to preserve

### 🛡️ Refactor Guard
For legacy code refactoring:
1. Make smallest possible change
2. Have AI review for behavior changes
3. Run tests
4. If safe, commit automatically
5. If issues found, warn immediately

### 🫷 Stop
When things go wrong:
- Stop immediately
- Don't let bad output contaminate context
- Roll back to last good state
- Use "Ask, don't tell" for recovery

### ⚙️ Algorithmify
Automate what can be automated:
- Have the agent write scripts for repetitive tasks
- Deterministic beats stochastic
- Preserve cognitive capacity for creative work

### 💎 Stdout Distillation
Reduce verbose output to essential signals:
```bash
#!/bin/bash
# test.sh - Distilled output

if ! output=$(npm test 2>&1); then
    echo "$output"
    exit 1
fi

passed=$(echo "$output" | grep -c "passing")
echo "✅ All $passed tests passed"
```

### 🚧 Constraints
Constrain what the agent can do:
- Lock certain files from modification
- Require tests before changes
- Use refactoring tools instead of free editing
- Set boundaries on scope

### 🖥️ CLI First
Prefer command-line tools:
- Text in, text out matches LLM nature
- Composable Unix-style tools
- Easy to script and automate

### 🔎 Semantic Zoom
Adjust detail level based on need:

**Zoomed Out (High Level):**
```
Give me the architecture overview of this repo
```

**Zoomed In (Detailed):**
```
Explain line by line what this function does
```

Use zoom to:
- Get quick overviews
- Deep dive when needed
- Keep responses scannable

### 🔄 Feedback Flip
After generating output, immediately review it:
```
Now review what you just produced:
- Did you miss anything from the requirements?
- Are there any issues with this approach?
- What could be improved?
```

Surprisingly effective even with the same agent.

### 📚 Knowledge Checkpoint
Save important learnings to files:
```markdown
# learnings/authentication-approach.md

## What We Learned
- JWT works better than sessions for our mobile app
- Need to handle token refresh carefully
- Rate limiting is essential

## Decisions
- Using RS256 for JWT signing
- 15 minute access token expiry
- 7 day refresh token expiry
```

---

## DEO Patterns (When Automations Emerge)

### 🔍 Check for Existing Tools First
Before writing a script, check `execution/` and the directive. Only create new scripts if none exist.

### 🔄 Self-Annealing Loop
When something breaks: Fix it → Update the script → Test → Update directive → System is stronger.

### 📦 Deliverables vs Intermediates
- **Deliverables:** Google Sheets, Slides (cloud-based, user-accessible)
- **Intermediates:** `.tmp/` files (regenerated as needed, never committed)

---

## Context Markers

Track what's been read with markers in your starter symbol:
```markdown
When you read architecture.md, include 🏗️ in starter
When you read testing-standards.md, include 🧪 in starter
```

If markers disappear, that content left the context.

---

## Anti-Patterns to Avoid

| Anti-Pattern | Description |
|--------------|-------------|
| AI Slop | Never accept low-quality output without review |
| Answer Injection | Don't embed expected answers in prompts |
| Distracted Agent | Don't overload with too much context or tasks |
| Flying Blind | Never work without tests or feedback mechanisms |
| Perfect Recall Fallacy | Don't assume AI remembers earlier conversation |
| Silent Misalignment | Always verify AI understanding matches intent |
| Sunk Cost | Know when to stop and start fresh |
| Tell Me a Lie | Always verify AI claims - it hallucinates confidently |
| Unvalidated Leaps | Never allow large changes without incremental validation |

---

## AI Limitations to Remember

| Obstacle | Mitigation |
|----------|------------|
| Black Box (can't see reasoning) | Use context markers, hypothesize |
| Cannot Learn (forgets between sessions) | Cross-context memory files |
| Compliance Bias (tends to agree) | Ask for alternatives |
| Context Rot (earlier context fades) | Save to files, fresh contexts |
| Degrades Under Complexity | Split into smaller tasks |
| Limited Context (fixed window) | Manage context actively |
| Limited Focus | One thing at a time |
| Non-Determinism | Use tests for validation |
| Hallucinations | Always verify claims |

---

## MCP Servers (Available Tools)

MCP (Model Context Protocol) servers extend Claude's capabilities. These are configured at the user level (`~/.claude.json`) and available across all projects.

### 🧠 Claude Memory (`claude-memory`)
**Purpose:** Persistent memory across all Claude Code sessions.

**How it works:**
- Syncs all conversations to Supabase (every 2 minutes via cron)
- SessionStart hook auto-injects recent project context
- Searchable archive of all past work

**Tools:**
```
search_memory(query, days_back, max_results)  # Search past conversations
list_conversations(limit, days_back, project) # List recent sessions
```

**Usage:**
- "What did we decide about auth last week?" → Claude searches memory
- "How did I solve this in another project?" → Cross-project search
- Coming back after days away → Context is preserved

### 🌐 Chrome DevTools (`chrome-devtools`)
**Purpose:** Browser automation for testing and debugging.

**Tools:**
```
take_snapshot()           # Get page accessibility tree
take_screenshot()         # Capture page image
click(uid)               # Click element
fill(uid, value)         # Fill input field
navigate_page(url)       # Navigate to URL
list_pages()             # List open tabs
evaluate_script(fn)      # Run JavaScript
list_network_requests()  # View network activity
list_console_messages()  # View console logs
```

**Usage for testing:**
1. Start Chrome with remote debugging: `chrome --remote-debugging-port=9222`
2. Claude can navigate, interact, and verify UI behavior
3. Use for E2E testing, visual regression, debugging

### Adding MCP Servers to New Projects

User-level servers (in `~/.claude.json`) are automatically available everywhere.

To add project-specific servers, create `.mcp.json` in project root:
```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["package-name"]
    }
  }
}
```

---

## Tech Stack

- Framework: [TBD - Next.js recommended]
- Database: [TBD]
- Auth: [TBD]
- Testing: [TBD - Jest/Vitest recommended]

## Commands

```bash
npm run dev          # Local development
npm run test         # Run tests
npm run build        # Production build
```

---

## Quick Reference

```bash
# Check git status before starting
git status

# Create checkpoint commit
git add -A && git commit -m "checkpoint: [description]"

# Run tests (create test.sh for distilled output)
npm test
```

---

## Current State

- **Goal:** See `memory/goal.md`
- **Architecture:** See `docs/architecture.md`
- **Decisions:** See `docs/decisions.md`

---

> "Ask not what Claude Code can generate for you, but what feedback loop you can generate for Claude Code."

The more ways you can give AI to know whether it's succeeding, the more it can do with less supervision.

---

## References

- [Augmented Coding Patterns](https://lexler.github.io/augmented-coding-patterns/)
- [Gregor Riegler's Pattern Language](https://gregorriegler.com/2025/07/12/augmented-coding-pattern-language.html)
- [Process Files by Llewellyn Falco](https://www.youtube.com/watch?v=MMqahx1PRQo)
