// Shared ESLint rules for dastro projects. Append after the project's own presets:
//   import dastroEslint from 'dastro/config/eslint';
//   export default defineConfig(..., ...dastroEslint);
// Needs eslint-plugin-astro and eslint-plugin-jsx-a11y in the project (boilerplate default).
import eslintPluginAstro from 'eslint-plugin-astro';

const attr = (node, name) =>
  node.attributes.find((a) => a.type === 'JSXAttribute' && a.name?.name === name);

const staticValue = (attribute) =>
  attribute?.value?.type === 'Literal' ? attribute.value.value : undefined;

// target="_blank", or an expression that can yield '_blank' (target={external ? '_blank' : '_self'})
const mayBeBlank = (context, target) => {
  if (!target?.value) return false;
  if (target.value.type === 'Literal') return target.value.value === '_blank';
  return /(['"`])_blank\1/.test(context.sourceCode.getText(target.value));
};

// HTML elements only; components (Link, Seo, …) handle their own attributes
const isHtmlElement = (node) =>
  node.name?.type === 'JSXIdentifier' && /^[a-z]/.test(node.name.name);

const dastroPlugin = {
  rules: {
    'target-blank-rel': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'target="_blank" needs rel="noopener noreferrer" (or use the Link component)',
        },
        schema: [],
      },
      create(context) {
        return {
          JSXOpeningElement(node) {
            if (!isHtmlElement(node)) return;
            if (!mayBeBlank(context, attr(node, 'target'))) return;
            // a spread may carry rel at runtime, but the rel has to be visible here
            const rel = attr(node, 'rel');
            if (rel && (staticValue(rel) === undefined || /\bnoopener\b/.test(staticValue(rel)))) return;
            context.report({
              node,
              message:
                'target="_blank" without rel="noopener": add rel="noopener noreferrer" or use the Link component.',
            });
          },
        };
      },
    },
    'no-empty-title': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow an empty title attribute' },
        schema: [],
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name?.name !== 'title') return;
            if (!isHtmlElement(node.parent)) return;
            if (staticValue(node) !== '') return;
            context.report({
              node,
              message: 'Empty title="": omit the attribute instead.',
            });
          },
        };
      },
    },
  },
};

// eslint-plugin-astro's jsx-a11y preset, downgraded to warnings
const a11yWarnings = eslintPluginAstro.configs['jsx-a11y-recommended'].map(
  (config) =>
    config.rules
      ? {
          ...config,
          rules: Object.fromEntries(
            Object.entries(config.rules).map(([rule, setting]) => {
              const [level, ...options] = [setting].flat();
              const off = level === 'off' || level === 0;
              // skip links set accesskey on purpose
              if (rule.endsWith('/no-access-key')) return [rule, 'off'];
              return [rule, off ? setting : ['warn', ...options]];
            }),
          ),
        }
      : config,
);

export default [
  ...a11yWarnings,
  {
    files: ['**/*.astro', '**/*.jsx', '**/*.tsx'],
    plugins: { dastro: dastroPlugin },
    rules: {
      'dastro/target-blank-rel': 'error',
      'dastro/no-empty-title': 'error',
    },
  },
];
