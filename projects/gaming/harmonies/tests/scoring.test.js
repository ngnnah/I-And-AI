import { test } from "node:test";
import assert from "node:assert/strict";

import {
  scoreTreesModule,
  scoreMountainsModule,
  scoreFieldsModule,
  scoreBuildingsModule,
  scoreWaterModule,
  scoreAnimalsModule,
} from "../js/game/scoring-engine.js";
import { calculateTerrain } from "../js/game/token-manager.js";

// Build a hex { q, r, stack, terrain } from a list of token colors.
function mkHex(q, r, colors) {
  const stack = colors.map((color) => ({ color }));
  return { q, r, stack, terrain: calculateTerrain(stack) };
}
// Assemble a hexGrid keyed "q_r" from hex objects.
function grid(...hexes) {
  const g = {};
  for (const h of hexes) g[`${h.q}_${h.r}`] = h;
  return g;
}

test("tall tree (2 brown + green) scores 7 (real Harmonies value)", () => {
  const g = grid(mkHex(0, 0, ["brown", "brown", "green"]));
  assert.equal(scoreTreesModule(g), 7);
});

test("tree heights: bush=1, tree=3, tall=7", () => {
  assert.equal(scoreTreesModule(grid(mkHex(0, 0, ["green"]))), 1);
  assert.equal(scoreTreesModule(grid(mkHex(0, 0, ["brown", "green"]))), 3);
});

test("two adjacent height-2 mountains score 3 each = 6; isolated mountain = 0", () => {
  const adjacent = grid(mkHex(0, 0, ["gray", "gray"]), mkHex(1, 0, ["gray", "gray"]));
  assert.equal(scoreMountainsModule(adjacent), 6);
  const isolated = grid(mkHex(0, 0, ["gray", "gray"]));
  assert.equal(scoreMountainsModule(isolated), 0);
});

test("field group of 2 = 5; single yellow = 0", () => {
  const pair = grid(mkHex(0, 0, ["yellow"]), mkHex(1, 0, ["yellow"]));
  assert.equal(scoreFieldsModule(pair), 5);
  const single = grid(mkHex(0, 0, ["yellow"]));
  assert.equal(scoreFieldsModule(single), 0);
});

test("river of length 3 = 5 points (Side A)", () => {
  const river = grid(mkHex(0, 0, ["blue"]), mkHex(1, 0, ["blue"]), mkHex(2, 0, ["blue"]));
  assert.equal(scoreWaterModule(river, "A"), 5);
});

test("building must be stacked: lone red = 0, stacked red with 3 diff neighbors = 5", () => {
  // Lone red on the ground never scores.
  assert.equal(scoreBuildingsModule(grid(mkHex(0, 0, ["red"]))), 0);

  // Stacked red (gray+red = building) surrounded by 3 different top-colors.
  const g = grid(
    mkHex(0, 0, ["gray", "red"]), // building (height 2)
    mkHex(1, 0, ["blue"]),        // top color blue
    mkHex(-1, 0, ["yellow"]),     // top color yellow
    mkHex(0, 1, ["green"])        // top color green
  );
  assert.equal(scoreBuildingsModule(g), 5);
});

test("animal scoring: MORE cubes placed = MORE points (indexed from end)", () => {
  const cards = [{ id: "t", scoring: [15, 9, 4], maxPlacements: 3 }];
  const place = (n) => Array.from({ length: n }, (_, i) => ({ cardId: "t", hexKey: `${i}_0` }));
  assert.equal(scoreAnimalsModule(place(1), cards), 4);
  assert.equal(scoreAnimalsModule(place(2), cards), 9);
  assert.equal(scoreAnimalsModule(place(3), cards), 15);
  assert.equal(scoreAnimalsModule(place(0), cards), 0);
});
