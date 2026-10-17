import { describe, it, expect } from 'vitest';
import { parseLength, formatLength } from '../../src/units/feetInches.js';

describe('parseLength', () => {
  it('parses feet and inches with marks', () => {
    expect(parseLength('12\' 6"')).toBe(150);
    expect(parseLength("12'6")).toBe(150);
  });

  it('treats a bare number as feet', () => {
    expect(parseLength('12.5')).toBe(150);
  });

  it('parses inches only', () => {
    expect(parseLength('150"')).toBe(150);
    expect(parseLength('6in')).toBe(6);
  });

  it.each(['abc', '', '   ', '0', '-3', "0'", '12\'abc'])('rejects %j', (text) => {
    expect(parseLength(text)).toBeNull();
  });

  it('rejects non-string input', () => {
    expect(parseLength(undefined)).toBeNull();
    expect(parseLength(NaN)).toBeNull();
  });
});

describe('formatLength', () => {
  it('formats feet and inches', () => {
    expect(formatLength(150)).toBe('12\' 6"');
    expect(formatLength(144)).toBe("12'");
    expect(formatLength(6)).toBe('6"');
  });

  it('round-trips through parseLength', () => {
    for (const x of [6, 13, 150, 144, 97.5]) {
      expect(parseLength(formatLength(x))).toBe(x);
    }
  });
});
