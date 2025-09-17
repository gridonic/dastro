import { expect, test } from 'vitest';
import { dastroContainerTest } from '../../../test/_testing-core/dastro-test.ts';
import { buildTestPageRecord } from '../../../test/_testing-core/routing-test-utils.ts';

// @ts-ignore
import RecordLink from './RecordLink.astro';

test('record link renders additional attributes', async () => {
  const { renderToString } = await dastroContainerTest();

  const result = await renderToString(RecordLink, {
    props: {
      record: buildTestPageRecord('home'),
      'data-additional-attribute': 'test-value',
    },
  });

  expect(result).toContain('data-additional-attribute="test-value"');
});
