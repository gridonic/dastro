import { describe, expect, it } from 'vitest';
import { compareVersions, rangeWithinPeer } from './versions.js';

describe('compareVersions', () => {
  it('orders releases by major, minor and patch', () => {
    expect(compareVersions('3.3.0', '3.2.3')).toBeGreaterThan(0);
    expect(compareVersions('3.2.3', '3.3.0')).toBeLessThan(0);
    expect(compareVersions('3.10.0', '3.9.9')).toBeGreaterThan(0);
    expect(compareVersions('3.2.3', '3.2.3')).toBe(0);
  });

  it('ranks a prerelease below its release', () => {
    expect(compareVersions('3.3.0', '3.3.0-beta.1')).toBeGreaterThan(0);
    expect(compareVersions('3.3.0-beta.1', '3.3.0')).toBeLessThan(0);
  });

  it('ranks a prerelease above the previous release', () => {
    expect(compareVersions('3.3.0-beta.1', '3.2.3')).toBeGreaterThan(0);
    expect(compareVersions('3.2.3', '3.3.0-beta.1')).toBeLessThan(0);
  });

  it('orders prereleases of the same release by number', () => {
    expect(compareVersions('3.3.0-beta.2', '3.3.0-beta.1')).toBeGreaterThan(0);
    expect(compareVersions('3.3.0-beta.10', '3.3.0-beta.9')).toBeGreaterThan(0);
    expect(compareVersions('3.3.0-beta.1', '3.3.0-beta.1')).toBe(0);
  });

  it('selects the release patch when upgrading from its prerelease', () => {
    const patchVersions = ['3.2.0', '3.2.2', '3.3.0'];

    expect(
      patchVersions.filter((v) => compareVersions(v, '3.3.0-beta.1') > 0),
    ).toEqual(['3.3.0']);
  });
});

describe('rangeWithinPeer', () => {
  it('accepts a range at or above the peer minimum in the same major', () => {
    expect(rangeWithinPeer('^7.4.2', '^7.0.0')).toBe(true);
    expect(rangeWithinPeer('^7.0.0', '^7.0.0')).toBe(true);
  });

  it('rejects a range below the peer minimum', () => {
    expect(rangeWithinPeer('^7.0.0', '^7.2.0')).toBe(false);
  });

  it('rejects a range in another major', () => {
    expect(rangeWithinPeer('^6.3.0', '^7.0.0')).toBe(false);
    expect(rangeWithinPeer('^8.0.0', '^7.0.0')).toBe(false);
  });

  it('treats the minor as the breaking segment on 0.x', () => {
    expect(rangeWithinPeer('^0.13.2', '^0.13.0')).toBe(true);
    expect(rangeWithinPeer('^0.12.0', '^0.13.0')).toBe(false);
  });

  it('rejects ranges without a version', () => {
    expect(rangeWithinPeer('latest', '^7.0.0')).toBe(false);
  });
});
