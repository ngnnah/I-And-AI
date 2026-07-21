import { test } from "node:test";
import assert from "node:assert/strict";

import { getPatternOrientations, getNeighbors } from "../js/game/hex-grid.js";

test("a 2-hex 'domino' pattern yields exactly 6 orientations (one per direction)", () => {
  const pattern = [
    { q: 0, r: 0, terrain: "tree", isPlacementHex: true },
    { q: 1, r: 0, terrain: "water", isPlacementHex: false },
  ];
  const orientations = getPatternOrientations(pattern);
  assert.equal(orientations.length, 6);

  // The non-origin hex should land on each of the 6 neighbor directions exactly once.
  const dirs = new Set(getNeighbors(0, 0).map((n) => `${n.q}_${n.r}`));
  const seen = new Set();
  for (const o of orientations) {
    const placement = o.find((h) => h.isPlacementHex);
    assert.ok(placement, "every orientation keeps a placement hex");
    assert.equal(placement.q, 0);
    assert.equal(placement.r, 0);
    const other = o.find((h) => !h.isPlacementHex);
    seen.add(`${other.q}_${other.r}`);
    assert.equal(other.terrain, "water", "terrain is preserved through transforms");
  }
  assert.deepEqual([...seen].sort(), [...dirs].sort());
});

test("orientations preserve hex count, terrain multiset, and height fields", () => {
  const pattern = [
    { q: 0, r: 0, terrain: "mountain", height: 3, isPlacementHex: false },
    { q: 1, r: 0, terrain: "field", isPlacementHex: true },
  ];
  const termKey = (p) => p.map((h) => `${h.terrain}:${h.height ?? ""}`).sort().join(",");
  const base = termKey(pattern);
  for (const o of getPatternOrientations(pattern)) {
    assert.equal(o.length, pattern.length);
    assert.equal(termKey(o), base);
    assert.equal(o.filter((h) => h.isPlacementHex).length, 1);
  }
});

test("the identity orientation is always included", () => {
  const pattern = [
    { q: 0, r: 0, terrain: "field", isPlacementHex: true },
    { q: 1, r: -1, terrain: "rock", isPlacementHex: false },
    { q: 0, r: 1, terrain: "rock", isPlacementHex: false },
  ];
  const key = (p) => p.map((h) => `${h.q},${h.r}`).sort().join("|");
  const target = key(pattern);
  const found = getPatternOrientations(pattern).some((o) => key(o) === target);
  assert.ok(found, "original coordinates appear among the orientations");
});
