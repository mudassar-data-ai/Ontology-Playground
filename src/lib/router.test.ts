import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseHash, routeToHash, navigate, currentRoute, onRouteChange } from './router';

describe('parseHash', () => {
  it('returns home for empty hash', () => {
    expect(parseHash('')).toEqual({ page: 'home' });
  });

  it('returns home for "#/"', () => {
    expect(parseHash('#/')).toEqual({ page: 'home' });
  });

  it('returns home for "#"', () => {
    expect(parseHash('#')).toEqual({ page: 'home' });
  });

  it('returns home for unknown paths', () => {
    expect(parseHash('#/unknown/stuff')).toEqual({ page: 'home' });
  });

  it('parses catalogue route without id', () => {
    expect(parseHash('#/catalogue')).toEqual({ page: 'catalogue', ontologyId: undefined });
  });

  it('parses catalogue route with id', () => {
    expect(parseHash('#/catalogue/cosmic-coffee')).toEqual({
      page: 'catalogue',
      ontologyId: 'cosmic-coffee',
    });
  });

  it('parses embed route with id', () => {
    expect(parseHash('#/embed/cosmic-coffee')).toEqual({
      page: 'embed',
      ontologyId: 'cosmic-coffee',
    });
  });

  it('returns home for embed route without id', () => {
    expect(parseHash('#/embed')).toEqual({ page: 'home' });
  });

  it('handles leading slash variations', () => {
    expect(parseHash('#catalogue/test')).toEqual({ page: 'catalogue', ontologyId: 'test' });
  });
});

describe('routeToHash', () => {
  it('converts home route', () => {
    expect(routeToHash({ page: 'home' })).toBe('#/');
  });

  it('converts catalogue route without id', () => {
    expect(routeToHash({ page: 'catalogue' })).toBe('#/catalogue');
  });

  it('converts catalogue route with id', () => {
    expect(routeToHash({ page: 'catalogue', ontologyId: 'cosmic-coffee' })).toBe(
      '#/catalogue/cosmic-coffee',
    );
  });

  it('converts embed route', () => {
    expect(routeToHash({ page: 'embed', ontologyId: 'cosmic-coffee' })).toBe(
      '#/embed/cosmic-coffee',
    );
  });
});

describe('roundtrip', () => {
  const routes = [
    { page: 'home' as const },
    { page: 'catalogue' as const },
    { page: 'catalogue' as const, ontologyId: 'healthcare' },
    { page: 'embed' as const, ontologyId: 'finance-ledger' },
  ];

  for (const route of routes) {
    it(`roundtrips ${JSON.stringify(route)}`, () => {
      expect(parseHash(routeToHash(route))).toEqual(route);
    });
  }
});

describe('navigate + currentRoute', () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('sets the hash via navigate()', () => {
    navigate({ page: 'catalogue', ontologyId: 'test' });
    expect(window.location.hash).toBe('#/catalogue/test');
    expect(currentRoute()).toEqual({ page: 'catalogue', ontologyId: 'test' });
  });
});

describe('onRouteChange', () => {
  let originalHash: string;

  beforeEach(() => {
    originalHash = window.location.hash;
  });

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('calls listener on hashchange', async () => {
    const listener = vi.fn();
    const unsub = onRouteChange(listener);

    window.location.hash = '#/catalogue';
    // hashchange fires asynchronously
    await new Promise((r) => setTimeout(r, 50));

    expect(listener).toHaveBeenCalledWith({ page: 'catalogue', ontologyId: undefined });

    unsub();
  });

  it('stops calling listener after unsubscribe', async () => {
    const listener = vi.fn();
    const unsub = onRouteChange(listener);
    unsub();

    window.location.hash = '#/embed/test';
    await new Promise((r) => setTimeout(r, 50));

    expect(listener).not.toHaveBeenCalled();
  });
});
