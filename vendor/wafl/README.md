# WAFL 1.0 — language core

WAFL (Web Application Firewall Language) is the database-backed, declarative
policy language for NetGoat. This package is **milestone 1** of the
specification: the formal grammar, field/operator/action schema, lexer, parser,
type checker, reference evaluator, and the shared conformance suite.

It does **not** yet contain the MongoDB models, control-plane API, browser
editor, edge artifact pipeline, or SFT generator. Those are milestones 2–6.
The dashboard now validates WAFL rules before saving, and stream-server compiles
the supported request-field subset into the Go agent's bounded WAFScript
runtime. This bridge is not yet the signed artifact pipeline described in
milestone 4.

> Naming: the draft circulated as both `GWL-X` and `WAFL`. This package uses
> WAFL; the language version string is `"1.0"`. Renaming is a mechanical
> change limited to docs and package paths.

## Layout

```
grammar/wafl.ebnf        Formal EBNF grammar
schema/fields.json       Versioned field registry (shared contract)
schema/operators.json    Operator catalogue (editor autocomplete)
schema/actions.json      Action catalogue + parameter rules
src/lexer.ts             Tokenizer with spans and stable diagnostics
src/parser.ts            Precedence-climbing parser + rule shorthand
src/typechecker.ts       Field/operator/dataset typing, suggestions
src/regex.ts             Bounded-regex static analysis
src/evaluator.ts         Three-valued reference evaluator + traces
src/policy.ts            Policy compilation, ordering, decisions, simulation
conformance/expressions.json   Cross-runtime fixtures
```

## Quick start

```bash
bun test            # 91 tests
bun run conformance # standalone fixture runner, exits non-zero on mismatch
```

```ts
import { compilePolicy, evaluatePolicy } from "@netgoat/wafl";

const compiled = compilePolicy({
  name: "Production API protection",
  languageVersion: "1.0",
  enabled: true,
  mode: "simulate",
  defaultAction: "allow",
  rules: [{
    id: "rule_sqli",
    name: "Block SQL injection",
    enabled: true,
    priority: 100,
    expression: "attack.sqli == true",
    action: { type: "block", status: 403 },
  }],
});

const decision = evaluatePolicy(compiled.policy!, { "attack.sqli": true });
// { effect: "block", enforced: false, ... } — simulate never enforces
```

## Semantics that matter

### Three-valued logic

A field can be `true`, `false`, or `unknown`. `unknown` arises when a field is
absent for the current request phase, a detector is unavailable, a dataset
version is missing at the edge, or a runtime value has the wrong type. Only
`true` matches a rule. `not unknown` is `unknown`, so a missing reputation
signal can never become a positive security signal.

`null` is different from missing: `client.country == null` is `true` when the
context explicitly contains `null`, and `unknown` when the field was never
populated.

### Precedence

```
parentheses / index  >  not  >  comparisons  >  and  >  or
```

This follows the specification literally, which means `not a == b` parses as
`(not a) == b` and is a type error. Write `not (a == b)`. The type checker
attaches that suggestion to the error. If the specification is revised to put
`not` below comparisons, only `PREC_NOT` in `src/parser.ts` changes.

Comparisons are non-associative: `a == b == c` is a `CHAINED_COMPARISON`
error rather than a silent reinterpretation.

### Field access

The context is a **flat map keyed by field path**, which keeps the contract
identical across TypeScript, Go, and Rust:

```ts
{
  "request.method": "POST",
  "request.headers": { "User-Agent": "curl/8.0" },
  "client.ip": "203.0.113.7",
  "client.ip.reputation": "suspicious",
  "attack.sqli": { value: true, confidence: 0.91, version: "2026-01" },
}
```

The spec lists `client.ip` and `client.ip.reputation` as separate fields but
`client.ip` is also a scalar, so a nested object cannot represent both. A flat
map resolves the collision and is what an edge agent already produces.

`request.headers["name"]` is case-insensitive; `request.query["name"]` is
case-sensitive. This index syntax is an addition: the draft's operator list had
no way to address a single header or query parameter.

Detector signals may be raw values or `{ value, confidence?, source?, version?,
available? }`. `available: false` evaluates as `unknown` and is never treated
as a detection.

### Datasets

```wafl
client.ip in $trusted_ips
client.ip not in $internal_ranges
request.method in $safe_methods
```

Dataset types are `ip_set`, `cidr_set`, and `string_set`. A dataset that is
declared at compile time but missing at runtime evaluates as `unknown`, not
`false` — a missing allow-list must not silently admit traffic, and a missing
block-list must not silently deny it.

Published policies are expected to pin dataset versions; that belongs to the
artifact model in milestone 4.

### Actions

`allow`, `block`, `challenge`, `log`, `redirect`, `rate_limit`. `execute` is
rejected with `UNSUPPORTED_ACTION`.

`rate_limit` is **not** counted by the evaluator. It returns a directive
(`{ key, config }`) for a stateful backend; the policy only decides the bucket
key and threshold. `log` continues evaluation; the other actions terminate it.

### Rule ordering

Descending `priority`, then ascending rule `id`. The id tie-breaker is stable
across storage engines and runtimes, and is part of the conformance contract.

## Regex safety

The `matches` operator requires a **string literal** right operand so it can be
precompiled. The reference implementation rejects:

- backreferences and named backreferences
- lookahead, lookbehind, atomic groups, conditionals
- nested unbounded quantifiers such as `(a+)+`
- patterns longer than 512 characters

JavaScript has no RE2-equivalent engine, so this is defense in depth, not a
formal linear-time guarantee. The normative bounded engine is Rust's `regex`
crate (or Go's `regexp`, which has the same RE2 lineage). The TypeScript
implementation is for the editor, the API, and conformance — not for the
per-request data path.

## Stable diagnostic codes

`UNKNOWN_FIELD`, `UNKNOWN_DATASET`, `UNKNOWN_ACTION`, `UNSUPPORTED_ACTION`,
`TYPE_MISMATCH`, `INVALID_OPERATOR_FOR_TYPE`, `REGEX_UNSAFE`, `INVALID_REGEX`,
`REGEX_LITERAL_REQUIRED`, `CHAINED_COMPARISON`, `INVALID_IP`, `INVALID_CIDR`,
`INVALID_DURATION`, `INVALID_ACTION_PARAM`, `INVALID_REDIRECT_URL`,
`DUPLICATE_RULE_ID`, `UNSUPPORTED_LANGUAGE_VERSION`, and others in
`src/diagnostics.ts`.

Every diagnostic carries a `span`, and field/dataset errors carry a
`suggestion` for the editor's quick-fix.

## Deliberate decisions and open questions

Resolved in this implementation:

1. **Flat request context** instead of nested objects (see above).
2. **Index syntax** for headers and query parameters.
3. **Explicit `null` vs missing** distinction.
4. **Non-associative comparisons.**
5. **Rule-id tie-breaker.**
6. **`rate_limit` as a directive**, not an evaluator counter.
7. **`request.timestamp` typed as integer epoch milliseconds**, because the
   draft's type list has no timestamp type.

Still needs a product decision:

1. **Rust is not in the stack.** `netgoat` and `cass` are Go; only `frontend`
   is TypeScript. A Rust evaluator means introducing a new runtime (FFI or
   sidecar). The pragmatic choice is a **Go** evaluator sharing these fixtures.
2. **Where the control plane lives.** The spec prefers Mongoose, but `cass` is
   Go and `frontend` already depends on Mongoose. The policy API can live in
   the Next.js app (Mongoose, matching the draft) or in `cass` (official Go
   driver). This affects milestone 2.
3. **`not` precedence.** Spec-literal is implemented; flipping it is a
   one-line change and probably the better language design.

## Roadmap

| Milestone | Scope | State |
| --- | --- | --- |
| 1 | Grammar, schema, parser, type checker, reference evaluator, conformance | **done** |
| 2 | Mongoose models, draft/validate/publish API, audit, optimistic concurrency | partial: domain rules validate on save |
| 3 | Editor, autocomplete, diagnostics, simulator, version diff | partial: WAFL condition and action form |
| 4 | Canonical artifact, second-runtime evaluator, signing, atomic activation | partial: supported expressions compile into the Go agent runtime |
| 5 | Reputation, bot score, detectors, rate limiting, versioned datasets | not started |
| 6 | SFT generation, validation, dedup, splits, semantic evaluation | not started |
