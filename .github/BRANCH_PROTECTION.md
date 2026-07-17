# Branch protection

The repo is set up so `main` is protected: nothing lands on it except via a pull
request whose CI is green and whose commits satisfy Conventional Commits +
the scope allowlist in `commitlint.config.mjs`. Everything below the "Workflow"
section is code and lives in the repo; the "GitHub settings" section describes
the one-time UI configuration that turns those checks into hard gates.

## Workflow (already in the repo)

- `.github/workflows/ci.yml` — runs on every pull request:
  - **Backend · typecheck, lint, test**
  - **Frontend · typecheck, build**
  - **Commit messages** (commitlint against the PR's commit range)
- `.husky/pre-commit` — runs `lint-staged` (Prettier) on staged files.
- `.husky/commit-msg` — runs commitlint locally before the commit lands, so
  developers get feedback before they push.
- `.github/CODEOWNERS` — auto-requests review on every PR.
- `.github/PULL_REQUEST_TEMPLATE.md` — PR authors get a prompt for summary,
  changes, testing notes.

## GitHub settings (one-time UI setup)

Settings → Branches → Add branch protection rule for `main`:

- **Require a pull request before merging**
  - Require approvals: 1 (or more)
  - Dismiss stale approvals when new commits are pushed: ✔
  - Require review from Code Owners: ✔
- **Require status checks to pass before merging**
  - Require branches to be up to date before merging: ✔
  - Required checks:
    - `Backend · typecheck, lint, test`
    - `Frontend · typecheck, build`
    - `Commit messages`
- **Require conversation resolution before merging**: ✔
- **Require linear history**: ✔ (forces squash or rebase merges — no merge
  commits, cleaner log)
- **Do not allow bypassing the above settings**: ✔ (blocks admin bypass too)
- **Restrict who can push to matching branches**: leave empty — no one pushes
  directly. All landing happens via PR merges.

Settings → General → Pull Requests:

- **Allow squash merging**: ✔ (default merge strategy)
- **Allow merge commits**: ✗
- **Allow rebase merging**: ✔ (for authors who want to preserve granular
  history)
- **Always suggest updating pull request branches**: ✔
- **Automatically delete head branches**: ✔ (keeps the branch list clean)

## Developer flow

```
git checkout -b feat/rename-vehicles
# edit code
git add …
git commit -m "feat(backend): rename …"   # commit-msg hook runs commitlint
                                          # pre-commit hook runs lint-staged
git push -u origin feat/rename-vehicles
gh pr create --fill                       # PR template pre-fills
# CI runs three checks on the PR
# reviewer approves (CODEOWNERS)
gh pr merge --squash --delete-branch      # or via the UI
```

Direct pushes to `main` are rejected at the GitHub side by the protection
rule. Anyone bypassing local hooks (`git commit --no-verify`) still hits the
same checks on the PR — the hooks are a shortcut, not a bypass.
