import { babel } from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const config = {
    input: 'src/index.js',
    output: {
        file: 'dist/index.cjs',
        format: 'cjs'
    },
    plugins: [
        babel({ babelHelpers: 'bundled' }),
        commonjs(),
        json(),
        nodeResolve({
            jsnext: true,
            main: false
        })
    ]
};

export default config;