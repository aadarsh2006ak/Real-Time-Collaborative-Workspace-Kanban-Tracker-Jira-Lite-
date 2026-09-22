const { computePosition, GAP } = require('../src/utils/position');

describe('Fractional Position Computation', () => {
  it('should return GAP (1024) for empty column (no before, no after)', async () => {
    const pos = await computePosition(null, null);
    expect(pos).toBe(GAP);
  });

  it('should return before.position + GAP when appending to end of column', async () => {
    const beforePos = 1024;
    const pos = await computePosition(beforePos, null);
    expect(pos).toBe(2048);
  });

  it('should return after.position / 2 when inserting at top of column', async () => {
    const afterPos = 1024;
    const pos = await computePosition(null, afterPos);
    expect(pos).toBe(512);
  });

  it('should return the midpoint between two adjacent tasks', async () => {
    const beforePos = 1024;
    const afterPos = 2048;
    const pos = await computePosition(beforePos, afterPos);
    expect(pos).toBe(1536);
  });

  it('should accurately compute fine fractional position between close numbers', async () => {
    const beforePos = 1536;
    const afterPos = 1537;
    const pos = await computePosition(beforePos, afterPos);
    expect(pos).toBe(1536.5);
  });
});
