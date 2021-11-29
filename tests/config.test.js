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
        }))
      })
    })
  })

  test('empty', () => {
    withTempFile(`
abc: 123`, (configFile) => {
      expect(readConfiguration(configFile)).toEqual({
        tags: new Map()
      })
    })
  })

  test('file not exists', () => {
    expect(() => readConfiguration('foo')).toThrow("Configuration file 'foo' not found")
  })
})
