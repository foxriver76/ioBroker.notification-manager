import config from '@iobroker/eslint-config';

export default [
    { ignores: ['test/**/*.js', '*.config.mjs', 'build'] } ,
    ...config,
];