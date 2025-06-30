import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import terser from '@rollup/plugin-terser';

export default defineConfig({
    input: 'src/server.ts',
    output: {
        file: 'dist/server.mjs',
        format: 'es',
        sourcemap: true
    },
    plugins: [
        resolve({
            preferBuiltins: true,
            exportConditions: ['node']
        }),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false,
            sourceMap: true
        }),
        terser()
    ],
    external: [
        'express',
        'morgan',
        'yargs',
        'mongodb',
        'skia-canvas',
        'js-yaml',
        'uuid',
        'ws',
        'ali-oss',
        'aws-sdk'
    ]
}); 