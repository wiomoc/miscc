import {
  readConfiguration
} from '../src/config'
import {
  withTempFile
} from './utils.js'

describe('read config', () => {
  test('smoke test', () => {
    withTempFile(`
tags:
    embedded:
        title: Embedded
        color: '#FFF'
    misc:
        title: Misc
        color: '#F0F'
dirs:
    assets: assets2
abc: 123`, (configFile) => {
      expect(readConfiguration(configFile)).toEqual({
        tags: new Map(Object.entries({
          embedded: {
            title: 'Embedded',
            color: '#FFF'
          },
          misc: {
            title: 'Misc',
            color: '#F0F'
          }
        })),
        dirs: {
          assets: "assets2",
          assetsOutput: "assets",
          outputBase: "dist",
          posts: "posts",
          postsOutput: "posts",
          template: "template",
        }
      })
    })
  })

  test('empty', () => {
    withTempFile(`
abc: 123`, (configFile) => {
      expect(readConfiguration(configFile)).toEqual({
        tags: new Map(),
        dirs: {
          assets: "assets",
          assetsOutput: "assets",
          outputBase: "dist",
          posts: "posts",
          postsOutput: "posts",
          template: "template",
        }
      })
    })
  })

  test('file not exists', () => {
    expect(() => readConfiguration('foo')).toThrow("Configuration file 'foo' not found")
  })
})
