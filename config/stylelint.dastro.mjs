// Shared stylelint config for dastro projects:
//   stylelint.config.mjs → export { default } from 'dastro/config/stylelint';
// Colours and fonts come from the token files; everything else references them.
export default {
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
    'color-no-hex': [true, { message: 'Use a colour token from _colors.scss instead of a hex literal.' }],
    'color-named': ['never', { message: 'Use a colour token from _colors.scss instead of a named colour.' }],
    'declaration-property-value-disallowed-list': [
      {
        transition: [/\ball\b/],
        'transition-property': [/\ball\b/],
        // absolute sizes only; em and % stay for relative cases (sup, sub, root)
        'font-size': [/^\s*[\d.]+\s*(px|rem|pt)\s*$/],
        'font-family': [/^(?!\s*(var\(|inherit|initial|unset|\$))/],
        font: [/\d(px|rem|pt)\b/],
        // colour functions with literal channels; rgba(var(--x), .5) and rgba($x, .5) stay allowed
        '/.*/': [/\b(rgba?|hsla?)\(\s*[\d.]/],
      },
      {
        message: (property, value) =>
          property.startsWith('transition') && /\ball\b/.test(value)
            ? 'Name the transitioned properties instead of "all".'
            : /\b(rgba?|hsla?)\(/.test(value)
              ? 'Use a colour token from _colors.scss instead of a colour literal.'
              : 'Use a font type ($font-types / text-* class) or a font token instead of a literal.',
      },
    ],
  },
};
