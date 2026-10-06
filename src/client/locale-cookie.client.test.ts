import { afterEach, describe, expect, test, vi } from 'vitest';
import { setLocaleCookie } from './locale-cookie.client.ts';

/** Captures what the helper assigns to `document.cookie`. */
function writtenCookie(write: () => void) {
  const written: string[] = [];

  vi.stubGlobal('document', {
    set cookie(value: string) {
      written.push(value);
    },
  });
  write();

  expect(written).toHaveLength(1);

  const [nameValue, ...attributes] = written[0].split('; ');

  return { nameValue, attributes };
}

describe('setLocaleCookie', () => {
  afterEach(() => vi.unstubAllGlobals());

  test('writes the site locale under the given cookie name', () => {
    expect(
      writtenCookie(() => setLocaleCookie('locale', 'de_CH')).nameValue,
    ).toBe('locale=de_CH');
    expect(writtenCookie(() => setLocaleCookie('lang', 'en')).nameValue).toBe(
      'lang=en',
    );
  });

  test('for the whole site, SameSite=Lax, one year', () => {
    const { attributes } = writtenCookie(() =>
      setLocaleCookie('locale', 'fr_FR'),
    );

    expect(attributes).toContain('Path=/');
    expect(attributes).toContain('SameSite=Lax');
    expect(attributes).toContain('Max-Age=31536000');
  });

  test('the max age can be overridden', () => {
    const { attributes } = writtenCookie(() =>
      setLocaleCookie('locale', 'fr_FR', { maxAge: 3600 }),
    );

    expect(attributes).toContain('Max-Age=3600');
    expect(attributes).not.toContain('Max-Age=31536000');
  });
});
