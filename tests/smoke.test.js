import { describe, it, expect, beforeEach } from 'vitest';

describe('app bootstrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('mounts app root', async () => {
    await import('../src/main.js');
    expect(document.getElementById('app').innerHTML).not.toBe('');
  });
});
