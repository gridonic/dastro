import { describe, expect, it } from 'vitest';
import { slugify } from './route.util.ts';

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
