import { describe, expect, it } from 'vitest';
import { classifySpecialSpawn } from '../src/core/specialEngine';

describe('specialEngine', () => {
  it('spawns a horizontal rocket from a 4-match', () => {
    const groups = [
      {
        cells: [
          { row: 2, col: 1 },
          { row: 2, col: 2 },
          { row: 2, col: 3 },
          { row: 2, col: 4 },
        ],
        length: 4,
      },
    ];
    const spawn = classifySpecialSpawn(groups, 'ruby', { row: 2, col: 2 });
    expect(spawn?.special).toBe('rocket-h');
  });

  it('spawns a bomb from a 5-match line', () => {
    const groups = [
      {
        cells: [
          { row: 1, col: 0 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 1, col: 3 },
          { row: 1, col: 4 },
        ],
        length: 5,
      },
    ];
    const spawn = classifySpecialSpawn(groups, 'sapphire');
    expect(spawn?.special).toBe('bomb');
  });

  it('spawns a propeller from a 2×2 square', () => {
    const groups = [
      {
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 0 },
          { row: 1, col: 1 },
        ],
        length: 4,
      },
    ];
    const spawn = classifySpecialSpawn(groups, 'emerald');
    expect(spawn?.special).toBe('propeller');
  });
});
