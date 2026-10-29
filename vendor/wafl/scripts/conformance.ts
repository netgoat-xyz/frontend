/**
 * Standalone conformance runner. Exits non-zero on any mismatch so CI can
 * gate the Rust/Go implementations against the same fixtures.
 *
 *   bun run conformance
 */
import fixtures from "../conformance/expressions.json";
import { parseExpression, parseRule } from "../src/parser";
import { typecheck, type DatasetDefinition } from "../src/typechecker";
import { evaluateExpression, type RuntimeDataset } from "../src/evaluator";

interface Case {
  name: string;
  expression: string;
  context: Record<string, unknown>;
  datasets?: Record<string, { type: RuntimeDataset["type"]; values: string[] }>;
  expect: "true" | "false" | "unknown";
}

interface InvalidCase {
  name: string;
  expression?: string;
  rule?: string;
  errors: string[];
  suggestion?: string;
}

let failures = 0;
let total = 0;

for (const testCase of fixtures.cases as Case[]) {
  total++;
  const definitions: Record<string, DatasetDefinition> = {};
  for (const [name, dataset] of Object.entries(testCase.datasets ?? {})) {
    definitions[name] = { name, type: dataset.type };
  }

  const parsed = parseExpression(testCase.expression);
  const checked = typecheck(parsed.expression, { datasets: definitions });
  const errors = [...parsed.diagnostics, ...checked.diagnostics].filter((d) => d.severity === "error");
  if (errors.length > 0) {
    failures++;
    console.log(`FAIL ${testCase.name}: compile errors ${errors.map((e) => e.code).join(", ")}`);
    continue;
  }

  const result = evaluateExpression(checked.typed, testCase.context, {
    datasets: testCase.datasets as Record<string, RuntimeDataset>,
  });
  const actual = result.value === true ? "true" : result.value === false ? "false" : "unknown";
  if (actual !== testCase.expect) {
    failures++;
    console.log(`FAIL ${testCase.name}: expected ${testCase.expect}, got ${actual}`);
  }
}

for (const testCase of fixtures.invalid as InvalidCase[]) {
  total++;
  const diagnostics = testCase.rule
    ? parseRule(testCase.rule).diagnostics
    : (() => {
        const parsed = parseExpression(testCase.expression!);
        const checked = typecheck(parsed.expression, { datasets: {} });
        return [...parsed.diagnostics, ...checked.diagnostics];
      })();

  const codes = diagnostics.map((d) => d.code);
  const missing = testCase.errors.filter((code) => !codes.includes(code as never));
  if (missing.length > 0) {
    failures++;
    console.log(`FAIL ${testCase.name}: missing ${missing.join(", ")} (got ${codes.join(", ") || "none"})`);
  }
}

console.log(`\n${total - failures}/${total} conformance cases passed (language ${fixtures.languageVersion}).`);
if (failures > 0) process.exit(1);
