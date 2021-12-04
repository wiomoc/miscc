import fs from 'fs'
import { promisify } from 'util'
import {
  parseMarkdown
} from './markdown.js'
import ejs from 'ejs'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

export async function transformPost(post, context) {
  const srcFile = post.src
  const {
    pageResolver,
    assetResolver,
    tags: allTags,
    config
  } = context
  const content = await readFile(srcFile, 'UTF-8')
  const fileStat = await stat(srcFile)
  const creationDate = fileStat.ctime

  const {
    metaEntries,
    containsCode,
    html
  } = parseMarkdown(content, {
    pageResolver: (ref) => pageResolver(ref, post.dest),
    assetResolver: (ref) => assetResolver(ref, srcFile, post.dest)
  })

  const templateName = metaEntries.get('template') || 'post'
  const template = `${config.dirs.template}/pages/${templateName}.ejs`

  const title = metaEntries.get('title')
  const tagNames = metaEntries.get('tags')
  const priv = metaEntries.get('private') === 'true'
  const tags = []
  if (tagNames) {
    for (let tagName of tagNames.split(',')) {
      tagName = tagName.trim()
      const tag = allTags.get(tagName)
      if (!tag) {
        throw new Error(`Tag '${tagName}' doesn't exist`)
      }
      tags.push(tag)
    }
  }
  post.tags = tags
  post.title = title
  post.private = priv
  post.creationDate = creationDate

  const data = {
    ref: (ref) => pageResolver(ref, post.dest),
    asset: (ref) => assetResolver(ref, template, post.dest),
    contentHtml: html,
    containsCode,
    metaEntries,
    ...post
  }

  const resultHtml = await ejs.renderFile(template, data, {
    root: config.dirs.template
  })

  await writeFile(config.dirs.outputBase + '/' + post.dest, resultHtml, { encoding: 'UTF-8' })
}

export async function generateIndex(posts, context) {
  const {
    pageResolver,
    assetResolver,
    tags,
    config
  } = context
  const template = `${config.dirs.template}/pages/index.ejs`
  const dest = 'index.html'

  const data = {
    ref: (ref) => pageResolver(ref, "/"),
    asset: (ref) => assetResolver(ref, template, "/"),
    posts,
    tags
  }

  const resultHtml = await ejs.renderFile(template, data, {
    root: config.dirs.template
  })

  await writeFile(config.dirs.outputBase + '/' + dest, resultHtml, { encoding: 'UTF-8' })
}
