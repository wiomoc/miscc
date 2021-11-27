import { readConfiguration } from './config.js'
import { PageTracker } from './pageTracker.js';
import { AssetTracker } from './assetTracker.js';
import { transformPost, generateIndex } from './transformer.js';
import { mkdirIfNotExists } from './utils.js'
import process from 'process';

async function main() {
    if (process.env["INPUT_FOLDER"]) process.chdir(process.env["INPUT_FOLDER"]);
    const config = readConfiguration("miscc.yml");
    const pageTracker = new PageTracker();
    pageTracker.discover();
    const assetTracker = new AssetTracker();
    const outputDir = "dist";

    const context = {
        tags: config.tags,
        pageResolver: pageTracker.resolve.bind(pageTracker),
        assetResolver: assetTracker.resolve.bind(assetTracker),
    }
    mkdirIfNotExists(outputDir);
    mkdirIfNotExists(outputDir + "/posts");
    await Promise.all([...pageTracker.posts]
        .map(post => transformPost(post, outputDir, context)))

    await generateIndex(pageTracker.publicPosts, outputDir, context);
    await assetTracker.copyToOutput(outputDir);
}

main()