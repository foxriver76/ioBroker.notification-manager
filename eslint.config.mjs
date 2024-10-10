import config, { reactConfig } from '@iobroker/eslint-config';

// only apply the React config to tsx files
reactConfig[0].files = ['**/*.tsx']

export default [
    { ignores: ['test/**/*.js', '*.config.mjs', 'build', 'admin/build'] } ,
    ...config,
    ...reactConfig
];