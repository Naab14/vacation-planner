import { describe, it, expect } from 'vitest';
import { operatorInitials, operatorColor, operatorIcon } from '../operatorIcon';

describe('operatorInitials', () => {
  it('takes first + last initial for multi-word names', () => {
    expect(operatorInitials('Anna Lindgren')).toBe('AL');
  });
  it('takes two letters for a single name', () => {
    expect(operatorInitials('Cher')).toBe('CH');
  });
  it('handles empty input', () => {
    expect(operatorInitials('')).toBe('?');
  });
});

describe('operatorColor', () => {
  it('is deterministic for the same key', () => {
    expect(operatorColor('op1')).toBe(operatorColor('op1'));
  });
  it('returns a hex colour', () => {
    expect(operatorColor('whoever')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('operatorIcon', () => {
  it('keys colour by id so renames keep the colour stable', () => {
    const a = operatorIcon({ id: 'op1', name: 'Anna Lindgren' });
    const b = operatorIcon({ id: 'op1', name: 'Anna Svensson' });
    expect(a.color).toBe(b.color);
    expect(b.initials).toBe('AS');
  });
});
