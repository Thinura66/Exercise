# Worktree Setup

Use a git worktree when starting any Jira story or feature branch. Never develop directly on `main`.

## When to use a worktree

- Starting any new Jira story (e.g. AIEX-770)
- Any change that requires a PR before merging
- Parallel work on multiple stories simultaneously

## Create a worktree

```bash
# General pattern
git worktree add ../ai-development-thinura-<branch-name> -b <branch-name>

# Example for a feature story
git worktree add ../ai-development-thinura-feat-AIEX-770-middleware -b feat/AIEX-770-middleware

# Example for a bug fix
git worktree add ../ai-development-thinura-fix-AIEX-123-login -b fix/AIEX-123-login
```

## Branch naming

| Type    | Pattern                              |
|---------|--------------------------------------|
| Feature | `feat/AIEX-<id>-<short-description>` |
| Bug fix | `fix/AIEX-<id>-<short-description>`  |
| Chore   | `chore/<short-description>`          |

## Worktree root location

All worktrees live **one level up** from the project root:

```
D:\Exercise\
  ai-development-thinura\                          ← main (read-only, never develop here)
  ai-development-thinura-feat-AIEX-770-middleware\ ← feature worktree
  ai-development-thinura-fix-AIEX-123-login\       ← fix worktree
```

## Manage worktrees

```bash
git worktree list                                              # List all active worktrees
git worktree remove ../ai-development-thinura-feat-AIEX-770-middleware  # Remove after merging
```
