# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for a security problem.

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/netgoat-xyz/frontend/security/advisories/new)
for this repository. Include:

- the affected component and version or commit,
- a description of the impact,
- reproduction steps or a proof of concept,
- any suggested fix.

You will get an acknowledgement, an assessment, and a disclosure timeline.

## Supported versions

This branch is pre-release. Fixes land on `frontend-v2`; there are no
maintained release branches for it yet.

## Handling secrets

- Secrets are read from the environment only. `.env` is git-ignored; only
  `.env.example` with placeholders is committed.
- CI runs `gitleaks` on every push and pull request.
- If you believe a secret was committed, rotate it first, then open a private
  report. Removing the commit is not enough.
