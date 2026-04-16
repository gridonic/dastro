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

test('record link appends query params to href', async () => {
  const { renderToString } = await dastroContainerTest();

  const result = await renderToString(RecordLink, {
    props: {
      record: buildTestPageRecord('some-item'),
      query: { page: 'first', search: 'test' },
    },
  });

  expect(result).toContain('href="/some-item-de?page=first&#38;search=test"');
});

test('record link appends a hash fragment to href', async () => {
  const { renderToString } = await dastroContainerTest();

  const result = await renderToString(RecordLink, {
    props: {
      record: buildTestPageRecord('some-item'),
      hash: 'section',
    },
  });

  expect(result).toContain('href="/some-item-de#section"');
});

test('record link combines query and hash on href', async () => {
  const { renderToString } = await dastroContainerTest();

  const result = await renderToString(RecordLink, {
    props: {
      record: buildTestPageRecord('some-item'),
      query: { page: 2 },
      hash: 'top',
    },
  });

  expect(result).toContain('href="/some-item-de?page=2#top"');
});
