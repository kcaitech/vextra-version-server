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
        sourcemap: true,
        banner: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
        `.trim()
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