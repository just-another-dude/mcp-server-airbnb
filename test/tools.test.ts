// Contract for the tool schemas the server advertises to MCP clients.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AIRBNB_TOOLS } from "../tools.js";

test("the server advertises exactly the two read-only Airbnb tools", () => {
  assert.deepEqual(AIRBNB_TOOLS.map((t) => t.name), ["airbnb_search", "airbnb_listing_details"]);
});

test("no tool lets the caller switch off the robots.txt check", () => {
  // Whether robots.txt is honoured is the operator's decision (IGNORE_ROBOTS_TXT
  // or --ignore-robots-txt), never the model's: a per-call switch can be flipped
  // by anything that steers the model, including text inside a listing.
  for (const tool of AIRBNB_TOOLS) {
    const props = Object.keys(tool.inputSchema.properties ?? {});
    assert.ok(
      !props.some((p) => /robots/i.test(p)),
      `${tool.name} exposes a robots override: ${props.join(", ")}`,
    );
  }
});

test("required inputs are unchanged", () => {
  const [search, details] = AIRBNB_TOOLS;
  assert.deepEqual(search.inputSchema.required, ["location"]);
  assert.deepEqual(details.inputSchema.required, ["id"]);
});
