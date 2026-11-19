// Shared stylelint config for dastro projects:
//   stylelint.config.mjs → export { default } from 'dastro/config/stylelint';
// Colours and fonts come from the token files; everything else references them.
import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { checkAgainstRule, report, ruleMessages },
} = stylelint;

// `all` as a keyword, not inside a name like --base-transition-all
const TRANSITION_ALL = /(^|[\s,(])all(?=$|[\s,)])/i;
// colour functions with literal channels; rgba($x, .5) and color-mix(var(--x) …) stay allowed
const COLOUR_FUNCTION_LITERAL = /\b(rgba?|hsla?)\(\s*[\d.]/i;

const insideAtRule = (node, name) => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && parent.name.toLowerCase() === name) return true;
  }
  return false;
};

// Places where a literal colour is not a design colour:
// @property initial-value must be a literal; mask colours only carry alpha.
const colourLiteralAllowed = (decl) =>
  insideAtRule(decl, 'property') || /^(-webkit-)?mask/i.test(decl.prop);

const colourRule = 'dastro/no-colour-literal';
const colourMessages = ruleMessages(colourRule, {
  rejected: (what) => `Use a colour token from _colors.scss instead of ${what}.`,
});

const noColourLiteral = createPlugin(colourRule, (enabled) => async (root, result) => {
  if (!enabled) return;
  // reported on the whole declaration, so a disable comment above a multi-line value works
  const reportUnlessAllowed = (node, message) => {
    if (node?.type === 'decl' && colourLiteralAllowed(node)) return;
    report({ ruleName: colourRule, result, node, message });
  };
  for (const [ruleName, ruleSettings, what] of [
    ['color-no-hex', true, 'a hex literal'],
    ['color-named', 'never', 'a named colour'],
  ]) {
    await checkAgainstRule({ ruleName, ruleSettings, root, result }, (warning) =>
      reportUnlessAllowed(warning.node, colourMessages.rejected(what)),
    );
  }
  root.walkDecls((decl) => {
    if (COLOUR_FUNCTION_LITERAL.test(decl.value)) reportUnlessAllowed(decl, colourMessages.rejected('a colour literal'));
  });
});
noColourLiteral.ruleName = colourRule;
noColourLiteral.messages = colourMessages;

const transitionRule = 'dastro/no-transition-all';
const transitionMessages = ruleMessages(transitionRule, {
  rejected: 'Name the transitioned properties instead of "all".',
});

// transition / transition-property, plus custom properties and SCSS variables that hold a transition
const isTransitionDecl = (prop) => /^(transition(-property)?|--.*transition.*|\$.*transition.*)$/i.test(prop);

const noTransitionAll = createPlugin(transitionRule, (enabled) => (root, result) => {
  if (!enabled) return;
  root.walkDecls((decl) => {
    if (!isTransitionDecl(decl.prop) || !TRANSITION_ALL.test(decl.value)) return;
    report({ ruleName: transitionRule, result, node: decl, message: transitionMessages.rejected, word: 'all' });
  });
});
noTransitionAll.ruleName = transitionRule;
noTransitionAll.messages = transitionMessages;

export default {
  plugins: [noColourLiteral, noTransitionAll],
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    // token sources
    'src/sass/root/_colors.scss',
    'src/sass/typography/_font-types.scss',
    'src/sass/typography/_base.scss',
    'src/sass/shared/_print.scss',
    // internal tooling, not site output
    'src/components/styleguide/**',
    'src/components/debug/**',
  ],
  overrides: [
    { files: ['**/*.scss'], customSyntax: 'postcss-scss' },
    { files: ['**/*.astro', '**/*.html'], customSyntax: 'postcss-html' },
  ],
  rules: {
    [colourRule]: true,
    [transitionRule]: true,
    'declaration-property-value-disallowed-list': [
      {
        // absolute sizes only; em and % stay for relative cases (sup, sub, root)
        'font-size': [/^\s*[\d.]+\s*(px|rem|pt)\s*$/],
        'font-family': [/^(?!\s*(var\(|inherit|initial|unset|\$))/],
        font: [/\d(px|rem|pt)\b/],
      },
      { message: 'Use a font type ($font-types / text-* class) or a font token instead of a literal.' },
    ],
  },
};
