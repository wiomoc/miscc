import {
  babel
} from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import {
  spawn
} from 'child_process'
const getTag = () => {
  return new Promise((resolve, reject) => {
    let output = "";
    const git = spawn("git", ["describe", "--tags"]);
    git.stdout.on("data", (chunk) => output += chunk);
    git.on('close', () => {
      resolve(output.trim())
    })
    git.on('error', () => {
      reject();
    })
  })
}

export default async () => ({
  input: 'src/index.js',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
    intro: `global.MISCC_VERSION = ${JSON.stringify(await getTag())};`
  },
  plugins: [
    babel({
      babelHelpers: 'bundled'
    }),
    commonjs(),
    json(),
    nodeResolve({
      jsnext: true,
      main: false
    })
  ]
})
