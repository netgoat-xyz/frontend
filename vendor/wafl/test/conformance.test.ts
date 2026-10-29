import { describe, expect, test } from "bun:test";
import fixtures from "../conformance/expressions.json";
import { parseExpression, parseRule } from "../src/parser";
import { typecheck, type DatasetDefinition } from "../src/typechecker";
import { evaluateExpression, type RuntimeDataset } from "../src/evaluator";
import type { TypedExpr } from "../src/ast";

interface ConformanceCase {
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

function definitions(datasets: ConformanceCase["datasets"]): Record<string, DatasetDefinition> {
  const out: Record<string, DatasetDefinition> = {};
  for (const [name, dataset] of Object.entries(datasets ?? {})) out[name] = { name, type: dataset.type };
  return out;
}

function run(expression: string, context: Record<string, unknown>, datasets: ConformanceCase["datasets"]) {
  const parsed = parseExpression(expression);
  expect(parsed.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  const checked = typecheck(parsed.expression, { datasets: definitions(datasets) });
  expect(checked.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
  return evaluateExpression(checked.typed as TypedExpr, context, { datasets: datasets as Record<string, RuntimeDataset> });
}

describe(`WAFL ${fixtures.languageVersion} conformance`, () => {
  for (const testCase of fixtures.cases as ConformanceCase[]) {
    test(testCase.name, () => {
      const result = run(testCase.expression, testCase.context, testCase.datasets);
      const actual = result.value === true ? "true" : result.value === false ? "false" : "unknown";
      expect(actual).toBe(testCase.expect);
    });
  }

  for (const testCase of fixtures.invalid as InvalidCase[]) {
    test(`invalid: ${testCase.name}`, () => {
      const diagnostics = testCase.rule
        ? parseRule(testCase.rule).diagnostics
        : (() => {
            const parsed = parseExpression(testCase.expression!);
            const checked = typecheck(parsed.expression, { datasets: {} });
            return [...parsed.diagnostics, ...checked.diagnostics];
          })();

      const codes = diagnostics.map((d) => d.code);
      for (const expected of testCase.errors) {
        expect(codes).toContain(expected as never);
      }
      if (testCase.suggestion) {
        const match = diagnostics.find((d) => d.suggestion === testCase.suggestion);
        expect(match).toBeDefined();
      }
    });
  }
});
