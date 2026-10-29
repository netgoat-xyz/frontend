import type { DiagnosticCode } from "./diagnostics";

export interface RegexCheck {
  ok: boolean;
  code?: DiagnosticCode;
  message?: string;
}

const MAX_REGEX_LENGTH = 512;

/**
 * Conservative static analysis for the `matches` operator.
 *
 * The normative bounded-time engine is Rust's `regex` crate. JavaScript has
 * no equivalent built in, so the reference implementation rejects the
 * constructs that crate cannot execute (backreferences, lookaround, atomic
 * groups, conditionals) and additionally rejects nested unbounded
 * quantifiers, which are the classic catastrophic-backtracking shape.
 *
 * This is defense in depth, not a formal guarantee. The Rust evaluator is
 * the normative implementation for conformance.
 */
export function analyzeRegex(source: string): RegexCheck {
  if (source.length > MAX_REGEX_LENGTH) {
    return {
      ok: false,
      code: "REGEX_TOO_LONG",
      message: `Regular expression is ${source.length} characters; the limit is ${MAX_REGEX_LENGTH}.`,
    };
  }

  if (/\\[1-9]/.test(source)) {
    return { ok: false, code: "REGEX_UNSAFE", message: "Backreferences are not supported by the bounded regex engine." };
  }
  if (source.includes("\\k<")) {
    return { ok: false, code: "REGEX_UNSAFE", message: "Named backreferences are not supported by the bounded regex engine." };
  }
  for (const construct of ["(?=", "(?!", "(?<=", "(?<!", "(?>", "(?(", "(?P="]) {
    if (source.includes(construct)) {
      return {
        ok: false,
        code: "REGEX_UNSAFE",
        message: `Lookaround, atomic groups, and conditionals are not supported (found '${construct}').`,
      };
    }
  }

  // Detect a quantified group whose body already contains an unbounded
  // quantifier: (a+)+, (a*)*, (\w+)*, and friends.
  const stack: Array<{ unbounded: boolean }> = [{ unbounded: false }];
  let inClass = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;

    if (ch === "\\") {
      i++;
      continue;
    }
    if (inClass) {
      if (ch === "]") inClass = false;
      continue;
    }
    if (ch === "[") {
      inClass = true;
      continue;
    }
    if (ch === "(") {
      stack.push({ unbounded: false });
      continue;
    }
    if (ch === ")") {
      if (stack.length === 1) break;
      const group = stack.pop()!;
      const next = source[i + 1];
      const quantified = next === "*" || next === "+" || (next === "{" && /^\{\d+,\}/.test(source.slice(i + 1)));
      if (quantified && group.unbounded) {
        return {
          ok: false,
          code: "REGEX_UNSAFE",
          message: "Nested unbounded quantifiers are not allowed (catastrophic backtracking risk).",
        };
      }
      if (group.unbounded) stack[stack.length - 1]!.unbounded = true;
      continue;
    }
    if (ch === "*" || ch === "+") {
      stack[stack.length - 1]!.unbounded = true;
      continue;
    }
    if (ch === "{") {
      const close = source.indexOf("}", i + 1);
      if (close > i && /^\{\d+,\}$/.test(source.slice(i, close + 1))) {
        stack[stack.length - 1]!.unbounded = true;
      }
    }
  }

  try {
    // `u` matches the Unicode semantics of the Rust regex crate more closely
    // than the default legacy mode.
    new RegExp(source, "u");
  } catch (error) {
    return {
      ok: false,
      code: "INVALID_REGEX",
      message: `Invalid regular expression: ${(error as Error).message}`,
    };
  }

  return { ok: true };
}
