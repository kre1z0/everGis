export default {
    input: './temp/everGis.js',
    output: {
        file: './dist/everGis.js',
        format: 'umd',
        name: 'sGis',
        sourcemap: true
    },
    globals: {
        sgis: 'sGis'
    },
    external: ['sgis']
}