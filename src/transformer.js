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

  const {
    metaEntries,
    containsCode,
    html
  } = parseMarkdown(content, {
    pageResolver: (ref) => pageResolver(ref, post.dest),
    assetResolver: (ref) => assetResolver(ref, srcFile, post.dest)
  })

  let creationDate;
  if (metaEntries.has('date')) {
    creationDate = new Date(metaEntries.get('date'))
  } else {
    const fileStat = await stat(srcFile)
    creationDate = fileStat.ctime
  }


  const templateName = metaEntries.get('template') || 'post'
  const template = `${config.dirs.template}/pages/${templateName}.ejs`

  const title = metaEntries.get('title')
  let tagNames = metaEntries.get('tags')
  const priv = metaEntries.get('private') === true
  const tags = []
  if (tagNames) {
    if (!Array.isArray(tagNames)) {
      tagNames = tagNames.split(',');
    }
    for (let tagName of tagNames) {
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
    ...post,
    MISCC_VERSION: global.MISCC_VERSION
  }

  const resultHtml = await ejs.renderFile(template, data, {
    root: config.dirs.template
  })

  await writeFile(config.dirs.outputBase + '/' + post.dest, resultHtml, { encoding: 'UTF-8' })
}

export async function generateOverview(posts, context, templateName, dest) {
  const {
    pageResolver,
    assetResolver,
    tags,
    config
  } = context
  const template = `${config.dirs.template}/pages/${templateName}.ejs`
  const data = {
    ref: (ref) => pageResolver(ref, "/"),
    asset: (ref) => assetResolver(ref, template, "/"),
    posts,
    tags,
    MISCC_VERSION: global.MISCC_VERSION
  }

  const resultHtml = await ejs.renderFile(template, data, {
    root: config.dirs.template
  })

  await writeFile(config.dirs.outputBase + '/' + dest, resultHtml, { encoding: 'UTF-8' })
}
