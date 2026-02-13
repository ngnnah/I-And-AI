# Test Suite for Ito Game

Comprehensive test coverage for all core game logic, themes, state management, and gameplay scenarios.

## Test Statistics

- **Total Tests**: 100
- **Test Files**: 4
- **Coverage**: Core game logic, themes, state management, and gameplay scenarios

## Running Tests

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Test Files

### 1. `game-logic.test.js` (31 tests)

Tests core game logic functions:

- **pickThemes** (7 tests)
  - Unique theme selection
  - Excluding used themes
  - Theme exhaustion and reset
  - Edge cases (zero count, negative count)
  - Theme structure validation

- **dealNumbers** (10 tests)
  - Unique number assignment
  - Kids mode (1-10) and Adults mode (1-100)
  - Player ID mapping
  - Input validation (empty array, invalid rangeMax)
  - Randomness verification

- **checkOrder** (10 tests)
  - Correct ascending order detection
  - Error detection and index reporting
  - Edge cases (single player, empty array)
  - Tie handling
  - Input validation

- **getDifficultyPreset** (4 tests)
  - Kids and Adults presets
  - Default behavior

### 2. `themes.test.js` (23 tests)

Validates theme data integrity:

- **Data integrity** (4 tests)
  - Structure validation
  - Unique IDs
  - Required properties
  - Minimum theme count (50+)

- **Category tests** (6 tests)
  - All expected categories present
  - Proper question formats per category
  - Category-specific validation

- **Quality checks** (4 tests)
  - No empty text
  - All end with question marks
  - Child-friendly content
  - Reasonable length

- **Distribution** (1 test)
  - Balanced themes across categories

### 3. `game-state.test.js` (26 tests)

Tests state management and persistence:

- **setLocalPlayer** (2 tests)
  - Setting player ID and name
  - localStorage persistence

- **getStoredPlayer** (3 tests)
  - Retrieving stored player
  - Handling missing data
  - Handling corrupted data

- **restorePlayer** (3 tests)
  - Successful restoration
  - Failed restoration
  - Partial data handling

- **Game state** (3 tests)
  - Setting/updating game data
  - Clearing game state

- **Player queries** (4 tests)
  - isLocalPlayerInGame
  - isLocalPlayerHost

- **Integration scenarios** (3 tests)
  - Complete player setup flow
  - Game join flow
  - Non-host player scenarios

### 4. `gameplay-scenarios.test.js` (20 tests)

End-to-end gameplay testing:

- **Kids mode** (3 tests)
  - Full game with 3 players
  - 8 rounds with theme variety
  - Max players (10) game

- **Adults mode** (2 tests)
  - Full game with 5 players
  - 10 rounds with theme variety

- **Perfect games** (2 tests)
  - Ascending order validation
  - Handling ties

- **Failed rounds** (3 tests)
  - Immediate swap errors
  - Errors in large groups
  - Multiple errors

- **Edge cases** (4 tests)
  - 2-player games
  - Single player
  - Reverse order (worst case)
  - Last-position mistake

- **Multi-round simulations** (2 tests)
  - Complete game simulation
  - Games with mistakes

- **Theme exhaustion** (2 tests)
  - Using all available themes
  - Marathon games (20+ rounds)

- **Statistical properties** (2 tests)
  - Fair number distribution
  - Uniform theme category selection

## Test Coverage

### Functions Tested
✅ `pickThemes` - Theme selection logic  
✅ `dealNumbers` - Number distribution  
✅ `checkOrder` - Order validation  
✅ `getDifficultyPreset` - Difficulty settings  
✅ `setLocalPlayer` - Player management  
✅ `restorePlayer` - State persistence  
✅ `isLocalPlayerInGame` - Game membership  
✅ `isLocalPlayerHost` - Host detection  

### Not Covered (Firebase/UI)
⚠️ Firebase sync functions (require mock setup)  
⚠️ Screen components (require DOM testing)  
⚠️ Firebase config (credentials management)  

## Test Quality Standards

All tests follow these principles:

1. **Isolation** - Each test is independent
2. **Clear intent** - Test names describe what they verify
3. **Fast execution** - All 100 tests run in <1 second
4. **Edge cases** - Tests cover boundaries and error conditions
5. **Real scenarios** - Gameplay tests simulate actual game flows

## Adding New Tests

When adding features, ensure tests cover:

1. **Happy path** - Expected usage works correctly
2. **Edge cases** - Boundaries and limits
3. **Error handling** - Invalid inputs
4. **Integration** - Feature works with existing code

Example test template:

```javascript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../js/game/your-module.js';

describe('Your Feature', () => {
  it('should do what it claims', () => {
    const result = yourFunction(validInput);
    expect(result).toBe(expectedOutput);
  });

  it('should handle edge case', () => {
    expect(() => yourFunction(invalidInput)).toThrow('Expected error');
  });
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

- Fast execution (< 1 second)
- No external dependencies required
- Deterministic results (statistical tests have wide tolerances)

## Known Limitations

1. **Randomness tests** - Statistical tests may occasionally fail due to random chance (probability < 0.1%)
2. **Firebase mocking** - Firebase sync functions not tested (requires additional setup)
3. **UI tests** - Screen components require DOM testing framework

## Future Improvements

- [ ] Add Firebase sync mocking for integration tests
- [ ] Add UI component tests with Testing Library
- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests for game screens
- [ ] Add performance benchmarks for game logic
