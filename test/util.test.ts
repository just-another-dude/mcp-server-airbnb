// Offline unit tests for the pure helpers in util.ts. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanObject,
  diagnoseJsonPath,
  pickBySchema,
  flattenArraysInObject,
  findPdpPresentation,
  extractAmenities,
  extractHighlights,
  keyAmenityGroups,
} from "../util.js";

test("cleanObject drops nulls and __typename at every depth", () => {
  const obj: any = { a: 1, b: null, __typename: "X", c: { d: undefined, e: 2, __typename: "Y" } };
  cleanObject(obj);
  assert.deepEqual(obj, { a: 1, c: { e: 2 } });
});

test("diagnoseJsonPath reports where a path breaks", () => {
  assert.equal(diagnoseJsonPath({ a: { b: 1 } }, ["a", "b"]), "Path valid");
  assert.match(diagnoseJsonPath({ a: { x: 1 } }, ["a", "b"]), /Key 'b' not found. Available keys: \[x\]/);
  assert.match(diagnoseJsonPath({ a: null }, ["a", "b"]), /parent is null/);
});

test("pickBySchema keeps only allow-listed keys, recursing into arrays", () => {
  const obj = { keep: 1, drop: 2, nested: [{ k: 1, secret: 2 }, { k: 3 }] };
  assert.deepEqual(pickBySchema(obj, { keep: true, nested: { k: true } }), {
    keep: 1,
    nested: [{ k: 1 }, { k: 3 }],
  });
});

test("pickBySchema does not follow inherited properties", () => {
  const obj = Object.create({ inherited: "leak" });
  obj.own = 1;
  assert.deepEqual(pickBySchema(obj, { own: true, inherited: true }), { own: 1 });
});

test("flattenArraysInObject joins arrays into strings but keeps top-level keys", () => {
  assert.deepEqual(
    flattenArraysInObject({ title: "T", items: [{ a: "x", b: "y" }, { a: "z" }] }),
    { title: "T", items: "x: y, z" },
  );
});

test("findPdpPresentation returns the first pdpPresentation or null", () => {
  const pdp = { amenities: {} };
  assert.equal(findPdpPresentation({ niobeClientData: [["k", { data: {} }], ["k", { data: { node: { pdpPresentation: pdp } } }]] }), pdp);
  assert.equal(findPdpPresentation({}), null);
  assert.equal(findPdpPresentation(null), null);
});

test("extractAmenities marks unavailable items only in mixed groups", () => {
  const pdp = {
    amenities: {
      title: "What this place offers",
      seeAllAmenitiesGroups: [
        { title: "Heating and cooling", amenities: [{ title: "Air conditioning", available: false }, { title: "Heating", available: true }] },
        { title: "Not included", amenities: [{ title: "Washer", available: false }] },
        { title: "Empty", amenities: [] },
      ],
    },
  };
  assert.deepEqual(extractAmenities(pdp), {
    title: "What this place offers",
    seeAllAmenitiesGroups: [
      { title: "Heating and cooling", amenities: ["Air conditioning — unavailable", "Heating"] },
      { title: "Not included", amenities: ["Washer"] },
    ],
  });
  assert.equal(extractAmenities({}), null);
});

test("keyAmenityGroups keys groups by title, merging duplicates and defaulting to Other", () => {
  assert.deepEqual(
    keyAmenityGroups({ seeAllAmenitiesGroups: [{ title: "A", amenities: ["1"] }, { amenities: ["2"] }, { title: "A", amenities: ["3"] }] }),
    { seeAllAmenitiesGroups: { A: ["1", "3"], Other: ["2"] } },
  );
  assert.equal(keyAmenityGroups(null), null);
});

test("extractHighlights handles string and object subtitles and skips untitled entries", () => {
  assert.deepEqual(
    extractHighlights({ highlights: [{ title: "Parking", subtitle: "Free" }, { title: "Wifi", subtitle: { text: "Fast" } }, { subtitle: "orphan" }] }),
    { highlights: ["Parking: Free", "Wifi: Fast"] },
  );
  assert.equal(extractHighlights({ highlights: [] }), null);
});
