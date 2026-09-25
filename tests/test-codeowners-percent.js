#!/usr/bin/env node

/**
 * Tests for the "%" organization placeholder in CODEOWNERS owner tokens.
 *
 * GITHUB_REPOSITORY must be set before requiring the module: the module
 * captures `owner` at load time.
 */

process.env.GITHUB_REPOSITORY = "swirldslabs/chewie-sandbox";
process.env.GITHUB_TOKEN = "test-token";
process.env.TEAM_START_WITH = "@%/";

const {
  expandOrgPlaceholder,
  parseCodeowners,
  teamStartWith,
} = require("../auto-unapprove.js");

let failures = 0;

function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`   ✅ ${name}`);
  } else {
    console.log(`   ❌ ${name}\n      expected: ${e}\n      actual:   ${a}`);
    failures++;
  }
}

console.log("🧪 ORG PLACEHOLDER TESTS");
console.log("========================");
console.log("");

console.log("1. expandOrgPlaceholder()");
check(
  "expands the @%/ prefix",
  expandOrgPlaceholder("@%/platform-ci", "swirldslabs"),
  "@swirldslabs/platform-ci",
);
check(
  "expands against a different org",
  expandOrgPlaceholder("@%/platform-ci", "PandasWhoCode"),
  "@PandasWhoCode/platform-ci",
);
check(
  "leaves a plain user untouched",
  expandOrgPlaceholder("@alice", "swirldslabs"),
  "@alice",
);
check(
  "leaves an already-qualified team untouched",
  expandOrgPlaceholder("@hiero-ledger/ci", "swirldslabs"),
  "@hiero-ledger/ci",
);
check(
  "leaves an email untouched",
  expandOrgPlaceholder("dev@example.com", "swirldslabs"),
  "dev@example.com",
);
check(
  "leaves a stray % untouched",
  expandOrgPlaceholder("@foo%bar", "swirldslabs"),
  "@foo%bar",
);
check(
  "leaves @% with no slash untouched",
  expandOrgPlaceholder("@%", "swirldslabs"),
  "@%",
);
check(
  "is a no-op when the org is empty",
  expandOrgPlaceholder("@%/platform-ci", ""),
  "@%/platform-ci",
);
console.log("");

console.log("2. parseCodeowners()");
const content = [
  "# a comment",
  "",
  "*                 @%/platform-ci",
  "/docs/            @%/docs-team @alice",
  "/legacy/          @hiero-ledger/ci",
  "# trailing comment line",
].join("\n");

check("expands the catch-all rule", parseCodeowners(content, "swirldslabs"), [
  { path: "*", owners: ["@swirldslabs/platform-ci"] },
  { path: "/docs/", owners: ["@swirldslabs/docs-team", "@alice"] },
  { path: "/legacy/", owners: ["@hiero-ledger/ci"] },
]);

check(
  "resolves the same file differently per org",
  parseCodeowners(content, "PandasWhoCode")[0],
  { path: "*", owners: ["@PandasWhoCode/platform-ci"] },
);

check(
  "defaults the org to GITHUB_REPOSITORY's owner",
  parseCodeowners("*  @%/platform-ci")[0],
  { path: "*", owners: ["@swirldslabs/platform-ci"] },
);
console.log("3. TEAM_START_WITH expansion");
check(
  "expands @%/ in the team-start-with prefix",
  teamStartWith,
  "@swirldslabs/",
);
console.log("");

if (failures > 0) {
  console.log(`❌ ${failures} test(s) failed`);
  process.exit(1);
}
console.log("✅ All org placeholder tests passed!");
