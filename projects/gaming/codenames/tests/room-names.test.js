/**
 * Test room name generation for uniqueness and diversity
 */

import { generateDisplayName, ADJECTIVES, NOUNS } from '../js/data/room-names.js';

console.log('Testing Room Name Generation\n');
console.log(`Dictionary size: ${ADJECTIVES.length} adjectives × ${NOUNS.length} nouns = ${ADJECTIVES.length * NOUNS.length} possible combinations\n`);

// Generate 50 names and check for duplicates
const names = new Set();
const testCount = 50;

console.log(`Generating ${testCount} room names:\n`);
for (let i = 0; i < testCount; i++) {
  const name = generateDisplayName();
  names.add(name);
  console.log(`${i + 1}. ${name}`);
  
  // Add small delay to ensure time-based seed changes
  await new Promise(resolve => setTimeout(resolve, 10));
}

console.log(`\n✓ Generated ${names.size} unique names out of ${testCount} attempts`);
console.log(`  Collision rate: ${((testCount - names.size) / testCount * 100).toFixed(1)}%`);
console.log(`  Expected collision rate with ${ADJECTIVES.length * NOUNS.length} combinations: very low\n`);

if (names.size === testCount) {
  console.log('✓ All names are unique - PASS');
} else {
  console.log(`⚠ Found ${testCount - names.size} duplicate(s) - acceptable with random generation`);
}

// Test name format
const sampleName = generateDisplayName();
const parts = sampleName.split(' ');
if (parts.length === 2 && parts[0] === parts[0].toUpperCase() && parts[1] === parts[1].toUpperCase()) {
  console.log(`✓ Name format correct: "${sampleName}" - PASS\n`);
} else {
  console.error(`✗ Name format incorrect: "${sampleName}" - FAIL\n`);
}
