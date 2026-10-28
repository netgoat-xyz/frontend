# Contributing

Thanks for helping with NetGoat. This branch (`frontend-v2`) is an active
rewrite, so please keep changes small and reviewable.

## Workflow

1. Branch from `frontend-v2`. Use `feat/<short-slug>`, `fix/<short-slug>`,
   `docs/<short-slug>` or `chore/<short-slug>`.
2. Make the change, then run the same checks CI runs:

   ```bash
   bun install --frozen-lockfile
   bun run lint
   bun run typecheck
   bun run build
   ```

3. Commit with a Conventional Commit subject, for example
   `feat(dashboard): add per-domain WAF toggle`.
4. Open a pull request against `frontend-v2`. Fill in the template and link the
   issue it closes.
5. A pull request is ready to merge when CI is green and a reviewer approves.

Never commit `.env`, credentials, keys, `node_modules`, or `.next`.

## Pull requests

- One logical change per pull request.
- Describe the user-visible effect and how you verified it.
- Add screenshots for UI changes.
- Do not force-push a branch under review; push follow-up commits instead.

## Known lint debt

`eslint.config.mjs` downgrades several React Compiler rules
(`react-hooks/set-state-in-effect`, `react-hooks/refs`, `react-hooks/purity`,
`react-hooks/immutability`) to warnings. These flag pre-existing patterns in
this branch. Fixing them changes runtime behaviour, so they are tracked as
debt rather than blocking CI. Please do not add new violations; converting an
existing component is welcome as a focused pull request.

## Reviews

CI covers lint, typecheck, build, a Docker build and secret scanning. CodeRabbit
is enabled for automated review where the repository has it installed. Neither
replaces a human reviewer, and no bot may approve or merge its own change.
