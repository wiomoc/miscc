import fs from 'fs';
import { promisify } from 'util';
import {
    parseMarkdown
} from './markdown.js';
import ejs from 'ejs';


const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);
const templateDir = "template"

export async function transformPost(post, outputBaseDir, context) {
    const srcFile = post.src;
    const {
        pageResolver,
        assetResolver,
        tags: allTags
    } = context;
    const content = await readFile(srcFile, "UTF-8");
    const fileStat = await stat(srcFile);
    const creationDate = fileStat.ctime;

    const {
        metaEntries,
        containsCode,
        html
    } = parseMarkdown(content, {
        pageResolver,
        assetResolver: (ref) => assetResolver(ref, srcFile)
    });

    let templateName = metaEntries.get("template") || "post";
    const template = `${templateDir}/pages/${templateName}.ejs`

    const title = metaEntries.get("title");
    const tagNames = metaEntries.get("tags");
    const tags = []
    if (tagNames) {
        for (let tagName of tagNames.split(",")) {
            tagName = tagName.trim();
            const tag = allTags.get(tagName);
            if (!tag) {
                throw new Error(`Tag '${tagName}' doesn't exist`);
            }
            tags.push(tag);
        }
    }
    post.tags = tags;
    post.title = title;
    post.creationDate = creationDate;

    const data = {
        ref: pageResolver,
        asset: assetResolver,
        contentHtml: html,
        containsCode,
        metaEntries,
        ...post
    }

    const resultHtml = await ejs.renderFile(template, data, {
        root: templateDir
    });

    await writeFile(outputBaseDir + "/" + post.dest, resultHtml, { encoding: "UTF-8" });
}

export async function generateIndex(posts, outputBaseDir, context) {
    const {
        pageResolver,
        assetResolver,
        tags
    } = context;
    const template = `${templateDir}/pages/index.ejs`

    const data = {
        ref: pageResolver,
        asset: assetResolver,
        posts,
        tags
    }

    const resultHtml = await ejs.renderFile(template, data, {
        root: templateDir
    });

    await writeFile(outputBaseDir + "/index.html", resultHtml, { encoding: "UTF-8" });
}
