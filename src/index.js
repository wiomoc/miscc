import { readConfiguration } from './config.js'
import { PageTracker } from './pageTracker.js';
import { AssetTracker } from './assetTracker.js';
import { transformPost, generateIndex } from './transformer.js';
import { mkdirIfNotExists } from './utils.js'
import process from 'process';

async function main() {
    if (process.env["INPUT_DIR"]) process.chdir(process.env["INPUT_DIR"]);
    const outputBaseDir = process.env["INPUT_OUTDIR"] || "dist";
    const config = readConfiguration("miscc.yml");
    const pageTracker = new PageTracker();
    pageTracker.discover();
    const assetTracker = new AssetTracker();

    const context = {
        tags: config.tags,
        pageResolver: pageTracker.resolve.bind(pageTracker),
        assetResolver: assetTracker.resolve.bind(assetTracker),
    }
    mkdirIfNotExists(outputBaseDir);
    mkdirIfNotExists(outputBaseDir + "/posts");
    await Promise.all([...pageTracker.posts]
        .map(post => transformPost(post, outputBaseDir, context)))

    await generateIndex(pageTracker.publicPosts, outputBaseDir, context);
    await assetTracker.copyToOutput(outputBaseDir);
}

main()