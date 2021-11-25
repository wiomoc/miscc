import { marked } from 'marked'
import hljs from 'highlight.js';

let metaEntries;
const meta = {
    name: 'meta',
    level: 'block',
    start(src) { return src.match(/^\[/m)?.index; },
    tokenizer(src, tokens) {
        const rule = /^\[(\w+)\]:\s?(.+)(?:\n|$)+/;
        const match = rule.exec(src);
        if (match) {
            metaEntries.set(match[1], match[2]);
            return {
                type: 'space',
                raw: match[0]
            }
        }
    },
};

marked.use({ extensions: [meta] });

let containsCode
marked.setOptions({
    highlight: (code, language) => {
        containsCode = true;
        if (language) {
            return hljs.highlight(code, { language }).value
        } else {
            return hljs.highlightAuto(code).value
        }
    }
});

export function parseMarkdown(markdownSource) {
    metaEntries = new Map();
    containsCode = false;
    const html = marked.parse(markdownSource)
    return {
        metaEntries,
        containsCode,
        html
    }
}