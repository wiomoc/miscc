import YAML from 'yaml'
import fs from 'fs'

export function readConfiguration(path) {
  let configString
  try {
    configString = fs.readFileSync(path, 'UTF-8')
  } catch (e) {
    throw new Error(`Configuration file '${path}' not found`)
  }
  const configYaml = YAML.parse(configString)

  const tags = new Map()
  if (configYaml.tags) {
    if (typeof configYaml.tags !== 'object') {
      throw new Error(`Invalid type '${typeof configYaml.tags}' for tags`)
    }
    for (const tagName in configYaml.tags) {
      if (tags.has(tagName)) {
        throw new Error(`Duplicate tag '${tagName}'`)
      }
      const yamlTag = configYaml.tags[tagName]
      if (!yamlTag.title || typeof yamlTag.title !== 'string') {
        throw new Error(`Tag '${tagName}': title missing or wrong type`)
      }
      const tag = {
        title: yamlTag.title,
        color: yamlTag.color
      }
      tags.set(tagName, tag)
    }
  }

  const dirs = {}
  const yamlDirs = configYaml.dirs || {}
  dirs.outputBase = yamlDirs.outputBase || "dist"
  dirs.template = yamlDirs.template || "template"
  dirs.assets = yamlDirs.assets || "assets"
  dirs.assetsOutput = yamlDirs.assetsOutput || "assets"
  dirs.posts = yamlDirs.posts || "posts"
  dirs.postsOutput = yamlDirs.postsOutput || "posts"

  return {
    tags,
    dirs
  }
}
