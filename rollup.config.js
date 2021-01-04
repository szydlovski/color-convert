export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/bundle.js',
      format: 'esm'
    },
    {
      file: 'dist/bundle.cjs',
      format: 'cjs'
    }
  ]
};