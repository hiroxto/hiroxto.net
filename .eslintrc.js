module.exports = {
  root: true,
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/strongly-recommended',
    'plugin:promise/recommended',
    'standard',
  ],
  plugins: [
    '@typescript-eslint',
    'vue',
    'promise',
  ],
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    semi: ['error', 'always'],
    'no-console': 'off',
    'no-new': 'off',
    indent: ['error', 2],
    'quote-props': ['error', 'as-needed'],
    'vue/script-indent': ['error', 2, { baseIndent: 0, switchCase: 1 }],
    'vue/html-indent': ['error', 2, { attribute: 1, closeBracket: 0, baseIndent: 1 }],
    'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'always' }],
    'vue/component-name-in-template-casing': ['error', 'kebab-case'],
    'vue/html-self-closing': ['error', { html: { void: 'never', normal: 'never', component: 'never' } }],
    'vue/max-attributes-per-line': ['error', { singleline: 2 }],
    'vue/this-in-template': ['error'],
    'promise/catch-or-return': ['error', { allowThen: true, terminationMethod: ['catch', 'asCallback', 'finally'] }],
    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        indent: 'off',
      },
    },
  ],
};
