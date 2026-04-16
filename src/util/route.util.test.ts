import { describe, expect, it } from 'vitest';
import { parseQueryParams, slugify, withUrlExtras } from './route.util.ts';

describe('slugify', () => {
  it('should convert string to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('UPPERCASE')).toBe('uppercase');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
    expect(slugify('multiple   spaces')).toBe('multiple-spaces');
  });

  it('should replace special characters with hyphens', () => {
    expect(slugify('hello\\world')).toBe('hello-world');
    expect(slugify('hello.world')).toBe('hello-world');
    expect(slugify('hello_world')).toBe('hello-world');
    expect(slugify('hello:world')).toBe('hello-world');
    expect(slugify('hello;world')).toBe('hello-world');
  });

  it('should replace non-alphanumeric characters with hyphens', () => {
    expect(slugify('hello@world')).toBe('hello-world');
    expect(slugify('hello#world')).toBe('hello-world');
    expect(slugify('hello$world')).toBe('hello-world');
    expect(slugify('hello%world')).toBe('hello-world');
    expect(slugify('hello&world')).toBe('hello-world');
    expect(slugify('hello*world')).toBe('hello-world');
    expect(slugify('hello+world')).toBe('hello-world');
    expect(slugify('hello=world')).toBe('hello-world');
    expect(slugify('hello?world')).toBe('hello-world');
    expect(slugify('hello!world')).toBe('hello-world');
  });

  it('should handle multiple consecutive special characters', () => {
    expect(slugify('hello...world')).toBe('hello-world');
    expect(slugify('hello___world')).toBe('hello-world');
    expect(slugify('hello   \\\\  world')).toBe('hello-world');
    expect(slugify('hello::;;world')).toBe('hello-world');
  });

  it('should preserve numbers', () => {
    expect(slugify('hello123world')).toBe('hello123world');
    expect(slugify('test 123 456')).toBe('test-123-456');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('should handle string with only special characters', () => {
    expect(slugify('!@#$%^&*()')).toBe('');
    expect(slugify('...__::')).toBe('');
  });

  it('should handle complex mixed cases', () => {
    expect(slugify('Hello World! This is a Test_123')).toBe(
      'hello-world-this-is-a-test-123',
    );
    expect(slugify('My.File_Name:Version;2.0')).toBe(
      'my-file-name-version-2-0',
    );
    expect(slugify('Special\\Characters/And\\More')).toBe(
      'special-characters-and-more',
    );
    expect(slugify('!Special/Characters\\And/More!')).toBe(
      'special-characters-and-more',
    );
  });

  it('should handle leading and trailing special characters', () => {
    expect(slugify('...hello world...')).toBe('hello-world');
    expect(slugify('___test___')).toBe('test');
    expect(slugify('   spaced   ')).toBe('spaced');
  });
});

describe('withUrlExtras', () => {
  it('returns the url unchanged when no options given', () => {
    expect(withUrlExtras('/foo')).toBe('/foo');
    expect(withUrlExtras('/foo', {})).toBe('/foo');
    expect(withUrlExtras('/foo', { query: {} })).toBe('/foo');
    expect(withUrlExtras('/foo', { hash: '' })).toBe('/foo');
  });

  it('appends simple query params', () => {
    expect(
      withUrlExtras('/foo', { query: { page: 'first', search: 'test' } }),
    ).toBe('/foo?page=first&search=test');
  });

  it('stringifies numbers and booleans', () => {
    expect(
      withUrlExtras('/foo', { query: { page: 2, active: true, off: false } }),
    ).toBe('/foo?page=2&active=true&off=false');
  });

  it('skips null and undefined values', () => {
    expect(
      withUrlExtras('/foo', {
        query: { a: 'x', b: null, c: undefined, d: 'y' },
      }),
    ).toBe('/foo?a=x&d=y');
  });

  it('repeats key for array values, skipping nullish entries', () => {
    expect(
      withUrlExtras('/foo', { query: { tag: ['a', 'b', null, 'c'] } }),
    ).toBe('/foo?tag=a&tag=b&tag=c');
  });

  it('omits empty arrays entirely', () => {
    expect(withUrlExtras('/foo', { query: { tag: [] } })).toBe('/foo');
  });

  it('url-encodes special characters in keys and values', () => {
    expect(
      withUrlExtras('/foo', { query: { 'q&a': 'hello world', u: 'é/ñ' } }),
    ).toBe('/foo?q%26a=hello+world&u=%C3%A9%2F%C3%B1');
  });

  it('preserves insertion order', () => {
    expect(withUrlExtras('/foo', { query: { z: '1', a: '2', m: '3' } })).toBe(
      '/foo?z=1&a=2&m=3',
    );
  });

  it('appends a hash fragment', () => {
    expect(withUrlExtras('/foo', { hash: 'section' })).toBe('/foo#section');
  });

  it('combines query and hash', () => {
    expect(
      withUrlExtras('/foo', { query: { k: 'v' }, hash: 'frag' }),
    ).toBe('/foo?k=v#frag');
  });

  it('merges with existing query on the input url', () => {
    expect(
      withUrlExtras('/foo?existing=1', { query: { page: 'first' } }),
    ).toBe('/foo?existing=1&page=first');
  });

  it('replaces an existing hash on the input url', () => {
    expect(withUrlExtras('/foo#old', { hash: 'new' })).toBe('/foo#new');
  });

  it('preserves the existing hash when no hash option is given', () => {
    expect(withUrlExtras('/foo#old', { query: { k: 'v' } })).toBe(
      '/foo?k=v#old',
    );
  });

  it('keeps absolute urls absolute', () => {
    expect(
      withUrlExtras('https://example.com/item', {
        query: { page: 'first' },
        hash: 'top',
      }),
    ).toBe('https://example.com/item?page=first#top');
  });
});

describe('parseQueryParams', () => {
  it('returns an empty object for nullish or empty input', () => {
    expect(parseQueryParams(undefined)).toEqual({});
    expect(parseQueryParams(null)).toEqual({});
    expect(parseQueryParams('')).toEqual({});
    expect(parseQueryParams('   ')).toEqual({});
    expect(parseQueryParams('?')).toEqual({});
  });

  it('parses a simple query string', () => {
    expect(parseQueryParams('page=first&search=test')).toEqual({
      page: 'first',
      search: 'test',
    });
  });

  it('strips a leading question mark', () => {
    expect(parseQueryParams('?page=first&search=test')).toEqual({
      page: 'first',
      search: 'test',
    });
  });

  it('collects repeated keys into an array', () => {
    expect(parseQueryParams('tag=a&tag=b&tag=c')).toEqual({
      tag: ['a', 'b', 'c'],
    });
  });

  it('url-decodes keys and values', () => {
    expect(parseQueryParams('?q%26a=hello+world&u=%C3%A9')).toEqual({
      'q&a': 'hello world',
      u: 'é',
    });
  });

  it('mixes single and repeated keys', () => {
    expect(parseQueryParams('page=2&tag=a&tag=b')).toEqual({
      page: '2',
      tag: ['a', 'b'],
    });
  });

  it('round-trips through withUrlExtras', () => {
    const query = parseQueryParams('?page=first&search=hello+world&tag=a&tag=b');
    expect(withUrlExtras('/item', { query })).toBe(
      '/item?page=first&search=hello+world&tag=a&tag=b',
    );
  });

  it('preserves empty values', () => {
    expect(parseQueryParams('a=&b=x')).toEqual({ a: '', b: 'x' });
  });

  it('treats a flag-style key without value as empty string', () => {
    expect(parseQueryParams('?draft&page=2')).toEqual({
      draft: '',
      page: '2',
    });
  });

  it('keeps everything after the first = as the value', () => {
    expect(parseQueryParams('token=abc=def&x=1')).toEqual({
      token: 'abc=def',
      x: '1',
    });
  });

  it('decodes + as space in values', () => {
    expect(parseQueryParams('q=hello+world')).toEqual({ q: 'hello world' });
  });

  it('trims surrounding whitespace on input', () => {
    expect(parseQueryParams('   ?page=1&q=a   ')).toEqual({
      page: '1',
      q: 'a',
    });
  });

  it('tolerates multiple leading question marks', () => {
    // The first "?" is stripped explicitly; URLSearchParams strips another.
    expect(parseQueryParams('??page=1')).toEqual({ page: '1' });
  });

  it('handles a trailing ampersand', () => {
    expect(parseQueryParams('a=1&')).toEqual({ a: '1' });
  });

  it('handles consecutive ampersands without producing empty-key entries', () => {
    expect(parseQueryParams('a=1&&b=2')).toEqual({ a: '1', b: '2' });
  });
});
