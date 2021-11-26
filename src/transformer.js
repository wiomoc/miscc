import fs from 'fs';
import { promisify } from 'util';
import {
    parseMarkdown
} from './markdown.js';
import ejs from 'ejs';


const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const templateDir = "template"

export async function transformPost(srcFile, destFile, context) {
    const {
        pageResolver,
        assetResolver,
        tags: allTags
    } = context;
    const content = await readFile(srcFile, "UTF-8");

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
            tags.push(tagName);
        }
    }

    const data = {
        ref: pageResolver,
        asset: assetResolver,
        contentHtml: html,
        title,
        containsCode,
        metaEntries,
        tags
    }

    const resultHtml = await ejs.renderFile(template, data, {
        root: templateDir
    });

    await writeFile(destFile, resultHtml, { encoding: "UTF-8" });
}