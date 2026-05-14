---
name: ai-sdlc-workflow
description: Reference guide mapping each SDLC stage to the AI tool or skill used in this project
metadata:
  type: project
  audience: Embla team
  created: 2026-05-14
---

# AI SDLC Workflow — Skill Swap Board

AI accelerates every phase of development in this project, but the developer stays accountable for every decision. This guide tells you **which tool or skill to reach for at each stage** of the lifecycle.

---

## Reference Matrix

| Stage | What AI does here | Tool / Skill | Quick example |
|---|---|---|---|
| **Requirements** | Break a product idea into Epics → Stories → Tasks; create Jira tickets from a spec | `embla-core:jira` | `/jira spec docs/superpowers/specs/my-feature.md` |
| **Design / Spec** | Explore intent, propose approaches, write and commit a spec doc | `superpowers:brainstorming` → `superpowers:writing-plans` | Invoke `/brainstorm`, approve design → writing-plans is auto-invoked |
| **Implementation** | Execute plan tasks in isolation, write code against spec, enforce TDD cycle | `superpowers:subagent-driven-development` + `superpowers:test-driven-development` | `/develop` via `embla-core` on a Jira story |
| **Testing** | Generate test cases, run test suite, verify coverage and correctness against spec | `superpowers:verification-before-completion` + Vitest via Claude Code | Run before any "done" claim or PR creation |
| **Review** | Multi-agent code review across quality, security, performance, and risk | `embla-core:review` or `superpowers:requesting-code-review` | `/review <PR_ID>` on an open PR |
| **Deploy** | Verify branch is clean, run pre-deploy checks, complete the development branch | `superpowers:finishing-a-development-branch` | Invoke after all checks pass |

---

## Tool Index

| Tool / Skill | What it does | Where to learn more |
|---|---|---|
| **Claude Code + Superpowers skills** | AI-assisted dev workflow: brainstorming, TDD, systematic debugging, code review, verification | `C:\Users\ThinuraKahaduwa\.claude\plugins\` |
| **`embla-core:jira`** | Creates Jira Epics, Stories, and Tasks from a spec file through a guided per-item review flow | `/jira` in Claude Code |
| **`embla-core:develop`** | Handles story fetch, assignment, status transition, branch creation, and PR guidance for a Jira story | `/develop` in Claude Code |
| **`embla-core:review`** | Runs 7 parallel review agents (code-quality, security, performance, risk, coverage, dependency, requirement) on a PR | `/review <PR_ID>` in Claude Code |
| **Claude API / Anthropic SDK** | Custom integrations; used when building AI-powered features into the app itself (not dev tooling) | `claude-api` skill |

---

## Key Principles

- **AI suggests, developer decides.** Every AI output — spec, plan, test, or review comment — is a starting point, not a final answer.
- **Spec before code.** Never start implementation without an approved spec committed to `docs/superpowers/specs/`.
- **Verify before claiming done.** Always invoke `superpowers:verification-before-completion` before opening a PR or marking a story complete.
- **One skill per phase.** If you're unsure which skill to use, look up your current SDLC stage in the matrix above — there is one clear answer per stage.
