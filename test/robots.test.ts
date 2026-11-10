// robots.txt decisions, offline, against a fixture shaped like Airbnb's real file:
// search (/s/...) disallowed for all agents, listing pages (/rooms/...) allowed.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isPathAllowed } from "../util.js";

const UA = "Mozilla/5.0 (test)";
const ROBOTS = ["User-agent: *", "Disallow: /s/", "Allow: /rooms/", ""].join("\n");

test("a path robots.txt allows is allowed, including its query string", () => {
  assert.equal(isPathAllowed(ROBOTS, "/rooms/53610715", UA), true);
  assert.equal(isPathAllowed(ROBOTS, "/rooms/53610715?adults=1&children=0", UA), true);
});

test("a path robots.txt disallows is refused", () => {
  assert.equal(isPathAllowed(ROBOTS, "/s/Paris--France/homes?adults=1", UA), false);
});

test("an absent robots.txt allows everything (existing fail-open behaviour)", () => {
  assert.equal(isPathAllowed("", "/s/anything", UA), true);
});

test("the result is always a boolean", () => {
  // robots-parser returns undefined for a URL it cannot place, which callers
  // negating the result would read as 'blocked'.
  for (const path of ["/rooms/1", "/s/x", "relative-without-slash"]) {
    assert.equal(typeof isPathAllowed(ROBOTS, path, UA), "boolean");
  }
});
