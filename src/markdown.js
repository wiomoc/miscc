import { marked, Renderer } from 'marked'
import hljs from 'highlight.js';

let metaEntries;
const meta = {
    name: 'meta',
    level: 'block',
    start(src) { return src.match(/^---/)?.index; },
    tokenizer(src, tokens) {
        const rule = /^---([\s\S\n]+)---/;
        const blockMatch = rule.exec(src);
        if (blockMatch) {
            const block = blockMatch[1];
            for (let keyValueMatch of block.matchAll(/^(\S+):\s*(.+)$/gm)) {
                metaEntries.set(keyValueMatch[1], keyValueMatch[2]);
            }
            return {
                type: 'space',
                raw: blockMatch[0]
            }
        }
    },
};

let assetResolver;
let pageResolver;

const renderer = {
    link(ref, title, text) {
        if (ref === null) {
            return text;
        }
        let href = pageResolver(ref);
        if (!href) {
            href = ref;
        }
        return Renderer.prototype.link.call(this, href, title, text)
    },

    image(ref, title, text) {
        if (ref === null) {
            return text;
        }
        let href = assetResolver(ref);
        if (!href) {
            href = ref;
        }
        return Renderer.prototype.image.call(this, href, title, text)
    }
}

marked.use({ extensions: [meta], renderer });

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

// Not reentrant
export function parseMarkdown(markdownSource, resolver) {
    metaEntries = new Map();
    containsCode = false;
    assetResolver = resolver.assetResolver;
    pageResolver = resolver.pageResolver;
    const html = marked.parse(markdownSource)
    return {
        metaEntries,
        containsCode,
        html
    }
}