#!/usr/bin/env node

import { readConfiguration } from './config.js'
import { PageTracker } from './pageTracker.js';
import { AssetTracker } from './assetTracker.js';
import { transformPost, generateIndex } from './transformer.js';
import { mkdirIfNotExists } from './utils.js'

async function main() {
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
    await Promise.all([...pageTracker.posts.values()]
        .map(post => transformPost(post, outputDir, context)))

    await generateIndex(pageTracker.posts.values(), outputDir, context);
    await assetTracker.copyToOutput(outputDir);
}

await main()