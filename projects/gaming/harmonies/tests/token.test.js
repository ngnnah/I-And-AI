import { test } from "node:test";
import assert from "node:assert/strict";

import { canPlaceToken, calculateTerrain, hasAnimalCube } from "../js/game/token-manager.js";

test("terrain: red alone = building, gray x2 = mountain, green on brown = tree", () => {
  assert.equal(calculateTerrain([{ color: "red" }]), "building");
  assert.equal(calculateTerrain([{ color: "gray" }, { color: "gray" }]), "mountain");
  assert.equal(calculateTerrain([{ color: "brown" }, { color: "green" }]), "tree");
});

test("stacking rules: green on brown OK, blue can't be stacked on", () => {
  const brown = { q: 0, r: 0, stack: [{ color: "brown" }] };
  assert.equal(canPlaceToken(brown, "green").valid, true);

  const blue = { q: 0, r: 0, stack: [{ color: "blue" }] };
  assert.equal(canPlaceToken(blue, "gray").valid, false);
});

test("an animal cube blocks further stacking on that hex", () => {
  const hex = { q: 0, r: 0, stack: [{ color: "gray" }] };
  const placedAnimals = [{ cardId: "penguin", hexKey: "0_0" }];

  // hasAnimalCube recognizes the live { hexKey } shape
  assert.equal(hasAnimalCube(hex, placedAnimals), true);

  // Without cube info the placement is allowed; with it, blocked.
  assert.equal(canPlaceToken(hex, "gray").valid, true);
  assert.equal(canPlaceToken(hex, "gray", placedAnimals).valid, false);
});
