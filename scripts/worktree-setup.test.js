import { describe, expect, it } from 'vitest';
import { mainWorktreeFrom, parseWorktreeInclude } from './worktree-setup.js';

describe('parseWorktreeInclude', () => {
  it('keeps plain paths and skips comments, blanks and globs', () => {
    expect(
      parseWorktreeInclude('# local secrets\n.env\n\n/.env.local\nconfig/*.json\n.cache/\n'),
    ).toEqual({ paths: ['.env', '.env.local', '.cache'], skipped: ['config/*.json'] });
  });
});

describe('mainWorktreeFrom', () => {
  it('returns the first worktree entry', () => {
    const porcelain =
      'worktree /repo/main\nHEAD abc\nbranch refs/heads/main\n\nworktree /repo.wt/feature\nHEAD def\n';
    expect(mainWorktreeFrom(porcelain)).toBe('/repo/main');
  });
});
