import { defineScoreEval, type JsonValue } from "niceeval";
import {
  and,
  commandMatch,
  commandSucceeded,
  defineScoreMatch,
  defineValueMatch,
  equals,
  eventMatch,
  excludes,
  hasSections,
  includes,
  includesUrl,
  isDefined,
  isFalse,
  isTrue,
  jsonMatch,
  matches,
  not,
  or,
  pattern,
  referencesAnyPath,
  satisfies,
  similarity,
  toolMatch,
} from "niceeval/expect";

const fixtureSchema = {
  "~standard": {
    version: 1,
    vendor: "niceeval-preview",
    validate(value: unknown) {
      return value === "schema-ok"
        ? { value }
        : { issues: [{ message: "expected schema-ok" }] };
    },
  },
} as const;

function jsonValue(value: JsonValue): JsonValue {
  return value;
}

export default defineScoreEval({
  description: "Every public niceeval/expect factory with persisted matched and mismatched results",
  tags: ["gallery", "score", "matchers"],
  async test(t) {
    const turn = await t.send("preview/events");
    await turn.succeeded().orStop();

    t.check("alpha", includes("alpha")).score(1).label("includes:matched");
    t.check("alpha", includes("beta")).score(1).label("includes:mismatched");
    t.check("alpha", excludes("beta")).score(1).label("excludes:matched");
    t.check("alpha", excludes("alpha")).score(1).label("excludes:mismatched");
    t.check("alpha", pattern(/^alpha$/u)).score(1).label("pattern:matched");
    t.check("alpha", pattern(/^beta$/u)).score(1).label("pattern:mismatched");
    t.check("https://one.example", includesUrl(1)).score(1).label("includesUrl:matched");
    t.check("plain text", includesUrl(1)).score(1).label("includesUrl:mismatched");
    t.check("# One\n## Two", hasSections(2)).score(1).label("hasSections:matched");
    t.check("# One", hasSections(2)).score(1).label("hasSections:mismatched");
    const definedValue: unknown = "value";
    const undefinedValue: unknown = undefined;
    t.check(definedValue, isDefined<unknown>()).score(1).label("isDefined:matched");
    t.check(undefinedValue, isDefined<unknown>()).score(1).label("isDefined:mismatched");
    t.check(true, isTrue()).score(1).label("isTrue:matched");
    t.check(false, isTrue()).score(1).label("isTrue:mismatched");
    t.check(false, isFalse()).score(1).label("isFalse:matched");
    t.check(true, isFalse()).score(1).label("isFalse:mismatched");
    t.check({ value: 1 }, equals({ value: 1 })).score(1).label("equals:matched");
    t.check({ value: 1 }, equals({ value: 2 })).score(1).label("equals:mismatched");
    const schemaOk: unknown = "schema-ok";
    const schemaBad: unknown = "schema-bad";
    t.check(schemaOk, matches(fixtureSchema)).score(1).label("matches:matched");
    t.check(schemaBad, matches(fixtureSchema)).score(1).label("matches:mismatched");
    t.check(2, satisfies("positive", (value: number) => value > 0))
      .score(1).label("satisfies:matched");
    t.check(-1, satisfies("positive", (value: number) => value > 0))
      .score(1).label("satisfies:mismatched");

    const custom = defineValueMatch<string>({
      name: "custom value",
      evaluate: (value) => value === "custom-ok",
    });
    t.check("custom-ok", custom).score(1).label("defineValueMatch:matched");
    t.check("custom-bad", custom).score(1).label("defineValueMatch:mismatched");

    const jsonOk = jsonValue({ value: "json-ok" });
    const jsonBad = jsonValue({ value: "json-bad" });
    t.check(jsonOk, jsonMatch({ value: "json-ok" }))
      .score(1).label("jsonMatch:matched");
    t.check(jsonBad, jsonMatch({ value: "json-ok" }))
      .score(1).label("jsonMatch:mismatched");

    const pathMatch = referencesAnyPath(["fixtures/brief.txt"]);
    const matchingPath = jsonValue({ path: "fixtures/brief.txt" });
    const otherPath = jsonValue({ path: "other.txt" });
    t.check(matchingPath, pathMatch)
      .score(1).label("referencesAnyPath:matched");
    t.check(otherPath, pathMatch)
      .score(1).label("referencesAnyPath:mismatched");

    t.check("alpha", and(includes("alpha"), excludes("beta")))
      .score(1).label("and:matched");
    t.check("alpha", and(includes("alpha"), includes("beta")))
      .score(1).label("and:mismatched");
    t.check("alpha", or(includes("beta"), includes("alpha")))
      .score(1).label("or:matched");
    t.check("alpha", or(includes("beta"), includes("gamma")))
      .score(1).label("or:mismatched");
    t.check("alpha", not(includes("beta"))).score(1).label("not:matched");
    t.check("alpha", not(includes("alpha"))).score(1).label("not:mismatched");

    t.check("same", similarity("same").atLeast(1))
      .score(1).label("similarity:matched");
    t.check("different", similarity("same").atLeast(1))
      .score(1).label("similarity:mismatched");

    const customScore = defineScoreMatch<string>({
      name: "custom score",
      score: (value) => (value === "score-ok" ? 1 : 0),
    });
    t.check("score-ok", customScore.atLeast(1))
      .score(1).label("defineScoreMatch:matched");
    t.check("score-bad", customScore.atLeast(1))
      .score(1).label("defineScoreMatch:mismatched");

    t.check({ exitCode: 0 }, commandSucceeded())
      .score(1).label("commandSucceeded:matched");
    t.check({ exitCode: 1 }, commandSucceeded())
      .score(1).label("commandSucceeded:mismatched");

    turn.calledTool(toolMatch("lookup_fixture"))
      .score(1).label("toolMatch:matched");
    turn.calledTool(toolMatch("missing_tool"))
      .score(1).label("toolMatch:mismatched");

    turn.calledTool(commandMatch("node", {
      argsStart: ["--version"],
      excludes: ["--eval"],
      status: "completed",
    })).score(1).label("commandMatch:matched");
    turn.calledTool(commandMatch("missing-command"))
      .score(1).label("commandMatch:mismatched");

    turn.event(eventMatch("message", {
      role: "assistant",
      text: includes("PREVIEW_OK"),
    })).score(1).label("eventMatch:matched");
    turn.event(eventMatch("message", {
      role: "assistant",
      text: includes("MISSING_EVENT_MARKER"),
    })).score(1).label("eventMatch:mismatched");
  },
});
