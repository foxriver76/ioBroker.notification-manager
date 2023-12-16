module.exports = {
    parserOptions: {
        project: ['./tsconfig.json', './admin/tsconfig.json'],
        ecmaFeatures: {
            jsx: true,
        },
    },
    extends: ["@foxriver76/eslint-config"],
    plugins: ['react'],
    settings: {
        react: {
            version: 'detect',
        },
    }
};
