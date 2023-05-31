module.exports = {
    root: true,
    parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.svelte'],
    },
    overrides: [
        {
            files: ['*.svelte'],
            parser: 'svelte-eslint-parser',
            parserOptions: {
                parser: '@typescript-eslint/parser',
            },
        },
    ],
    env: {
        node: true,
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:promise/recommended',
        'plugin:svelte/recommended',
        'standard',
    ],
    plugins: [
        '@typescript-eslint',
        'promise',
    ],
    rules: {
        'comma-dangle': ['error', 'always-multiline'],
        semi: ['error', 'always'],
        'no-console': 'off',
        'no-new': 'off',
        indent: ['error', 4],
        'quote-props': ['error', 'as-needed'],
        'promise/catch-or-return': ['error', { allowThen: true, terminationMethod: ['catch', 'asCallback', 'finally'] }],
        '@typescript-eslint/array-type': ['error', { default: 'array' }],
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
};
