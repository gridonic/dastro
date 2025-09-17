import { expect, describe, test } from 'vitest';
import {
  dastroTest,
  defaultTestLocale,
} from '../../test/_testing-core/dastro-test.ts';
import { buildTestPageRecord } from '../../test/_testing-core/routing-test-utils.ts';

describe('resolveRecordUrl', () => {
  function resolveRecordUrlTest() {
    const { routing } = dastroTest();

    const { resolveRecordUrl } = routing();
    return {
      resolveRecordUrl,
    };
  }

  test('should resolve default language to url without prefix', () => {
    const { resolveRecordUrl } = resolveRecordUrlTest();

    const result = resolveRecordUrl(
      buildTestPageRecord('home'),
      defaultTestLocale,
    );

    expect(result).toBe(`/home-de`);
  });

  test('should resolve other language url with prefix', () => {
    const { resolveRecordUrl } = resolveRecordUrlTest();

    const result = resolveRecordUrl(buildTestPageRecord('home'), 'en');

    expect(result).toBe('/en/home-en');
  });
});
