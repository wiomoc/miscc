import { readConfiguration } from './config.js'
import { PageTracker } from './pageTracker.js'
import { AssetTracker } from './assetTracker.js'
import { transformPost, generateOverview } from './transformer.js'
import { mkdirIfNotExists } from './utils.js'
import process from 'process'

async function main() {
  if (process.env.INPUT_DIR) process.chdir(process.env.INPUT_DIR)
  const config = readConfiguration('miscc.yml')
  const outputBaseDirEnv = process.env.INPUT_OUTDIR
  if (outputBaseDirEnv) {
    config.dirs.outputBase = outputBaseDirEnv;
  }
  const pageTracker = new PageTracker(config)
  pageTracker.discover()
  const assetTracker = new AssetTracker(config)
  await assetTracker.mayRunNpmInstall()

  const context = {
    tags: config.tags,
    pageResolver: pageTracker.resolve.bind(pageTracker),
    assetResolver: assetTracker.resolve.bind(assetTracker),
    config
  }
  mkdirIfNotExists(config.dirs.outputBase)
  mkdirIfNotExists(config.dirs.outputBase + '/' + config.dirs.postsOutput)
  await Promise.all([...pageTracker.posts]
    .map(post => transformPost(post, context)))

  const publicPostsDateDesc = pageTracker.publicPosts.sort((a, b) => b.creationDate.valueOf() - a.creationDate.valueOf());
  await generateOverview(publicPostsDateDesc, context, "index", "index.html")
  if (config.rss) {
    await generateOverview(publicPostsDateDesc, context, "rss", "rss.xml")
  }
  await assetTracker.copyToOutput()
}

main()
