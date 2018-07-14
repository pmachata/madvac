const path = require('path');

module.exports = {
    entry: {
        madvac: './src/madvac.js',
        'csp-tests': './src/csp-tests.js',
        'det-tests': './src/det-tests.js',
        'gen-tests': './src/gen-tests.js',
        'set128-asm-tests': './src/set128-asm-tests.js',
        'set128-tests': './src/set128-tests.js',
        'cons-asm-tests': './src/cons-asm-tests.js',
        'csp-asm-tests': './src/csp-asm-tests.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
        },
    },
};
