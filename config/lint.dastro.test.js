import { ESLint } from 'eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';
import dastroEslint from './eslint.dastro.mjs';
import stylelintConfig from './stylelint.dastro.mjs';

const lintScss = async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: 'src/sass/module.scss',
    config: stylelintConfig,
  });
  return results[0].warnings.map((w) => w.rule);
};

describe('stylelint: transition all', () => {
  it('flags the keyword in transitions and transition tokens', async () => {
    expect(await lintScss('a { transition: all .2s; }')).toEqual(['dastro/no-transition-all']);
    expect(await lintScss('a { transition: opacity .2s, all .3s; }')).toEqual(['dastro/no-transition-all']);
    expect(await lintScss(':root { --base-transition-all: all .3s ease; }')).toEqual(['dastro/no-transition-all']);
    expect(await lintScss('$transition-default: all .3s;')).toEqual(['dastro/no-transition-all']);
  });

  it('ignores "all" inside names', async () => {
    expect(await lintScss('a { transition: var(--base-transition-all); }')).toEqual([]);
    expect(await lintScss('a { transition: opacity var(--ease-all-in); }')).toEqual([]);
  });
});

describe('stylelint: colour literals', () => {
  it('flags hex, named and literal rgb/hsl colours', async () => {
    expect(await lintScss('a { color: #fff; }')).toEqual(['dastro/no-colour-literal']);
    expect(await lintScss('a { color: black; }')).toEqual(['dastro/no-colour-literal']);
    expect(await lintScss('a { background: linear-gradient(rgba(0, 0, 0, .6), transparent); }')).toEqual([
      'dastro/no-colour-literal',
    ]);
  });

  it('allows tokens, color-mix, @property initial values and mask colours', async () => {
    expect(await lintScss('a { color: color-mix(in srgb, var(--black) 50%, transparent); }')).toEqual([]);
    expect(await lintScss('a { color: currentColor; border-color: transparent; }')).toEqual([]);
    expect(
      await lintScss('@property --c { syntax: "<color>"; inherits: false; initial-value: #000; }'),
    ).toEqual([]);
    expect(await lintScss('a { mask-image: linear-gradient(black, transparent); }')).toEqual([]);
    expect(await lintScss('a { -webkit-mask-image: linear-gradient(rgba(0,0,0,1), #0000); }')).toEqual([]);
  });

  it('honours disable comments', async () => {
    expect(
      await lintScss('a {\n  /* stylelint-disable-next-line dastro/no-colour-literal -- logo */\n  color: #fff;\n}'),
    ).toEqual([]);
    expect(
      await lintScss(
        'a {\n  /* stylelint-disable-next-line dastro/no-colour-literal -- scrim */\n  background: linear-gradient(\n    rgba(0, 0, 0, .6),\n    #000\n  );\n}',
      ),
    ).toEqual([]);
  });
});

describe('eslint: target-blank-rel', () => {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [...eslintPluginAstro.configs.recommended, ...dastroEslint],
  });
  const lintAstro = async (markup) => {
    const [result] = await eslint.lintText(`---\nconst rest = {}; const external = true;\n---\n${markup}\n`, {
      filePath: 'src/components/Test.astro',
    });
    return result.messages.filter((m) => m.ruleId?.startsWith('dastro/')).map((m) => m.ruleId);
  };

  it('flags a static or conditional _blank without rel, spread or not', async () => {
    expect(await lintAstro('<a href="/x" target="_blank">x</a>')).toEqual(['dastro/target-blank-rel']);
    expect(await lintAstro('<a href="/x" target="_blank" {...rest}>x</a>')).toEqual(['dastro/target-blank-rel']);
    expect(await lintAstro(`<a href="/x" target={external ? '_blank' : '_self'}>x</a>`)).toEqual([
      'dastro/target-blank-rel',
    ]);
  });

  it('accepts rel, a dynamic rel and non-blank targets', async () => {
    expect(await lintAstro('<a href="/x" target="_blank" rel="noopener noreferrer" {...rest}>x</a>')).toEqual([]);
    expect(await lintAstro(`<a href="/x" target={external ? '_blank' : '_self'} rel={external ? 'noopener' : undefined}>x</a>`)).toEqual([]);
    expect(await lintAstro(`<a href="/x" target={external ? '_top' : '_self'}>x</a>`)).toEqual([]);
  });

  it('leaves accesskey on skip links alone', async () => {
    const [result] = await eslint.lintText('<a href="#main" accesskey="1">Skip</a>\n', {
      filePath: 'src/components/SkipLinks.astro',
    });
    expect(result.messages.map((m) => m.ruleId)).not.toContain('astro/jsx-a11y/no-access-key');
  });
});
