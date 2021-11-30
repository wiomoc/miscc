import { marked, Renderer, Parser } from 'marked'
import hljs from 'highlight.js'

let metaEntries
const meta = {
  name: 'meta',
  level: 'block',
  start(src) { return src.match(/^---/)?.index },
  tokenizer(src) {
    const rule = /^---([\s\S\n]+)---/
    const blockMatch = rule.exec(src)
    if (blockMatch) {
      const block = blockMatch[1]
      for (const keyValueMatch of block.matchAll(/^(\S+):\s*(.+)$/gm)) {
        metaEntries.set(keyValueMatch[1], keyValueMatch[2])
      }
      return {
        type: 'space',
        raw: blockMatch[0]
      }
    }
  }
}

let footnotes
const footnoteRef = {
  name: 'footnoteRef',
  level: 'inline',
  start(src) { return src.match(/\[\^/)?.index },
  tokenizer(src) {
    const rule = /^\[\^(\S+)\](?!:)/
    const match = rule.exec(src)
    if (match) {
      return {
        type: 'footnoteRef',
        raw: match[0],
        name: match[1]
      }
    }
  },
  renderer(token) {
    const footnote = footnotes.get(token.name);
    if (!footnote) {
      console.warn(`Unknown footnote '${token.name}'`)
      return ''
    } else {
      return `<sup><a href="#anchor-${token.name}">${footnote.number}</a></sup>`
    }
  }
}

const footnoteDef = {
  name: 'footnoteDef',
  level: 'inline',
  start(src) { return src.match(/\[\^\S+\]:/)?.index },
  tokenizer(src) {
    const rule = /^\[\^(\S+)\]:\s?(.*)\n?/
    const match = rule.exec(src)

    if (match) {
      footnotes.set(match[1], {
        content: this.lexer.inlineTokens(match[2]),
        number: footnotes.size + 1
      })
      return {
        type: 'footnoteDef',
        raw: match[0],
      }
    }
  },
  renderer() {
    return '';
  }
}

let assetResolver
let pageResolver

const renderer = {
  link(ref, title, text) {
    if (ref === null) {
      return text
    }
    let href = pageResolver(ref)
    if (!href) {
      href = ref
    }
    return Renderer.prototype.link.call(this, href, title, text)
  },

  image(ref, title, text) {
    if (ref === null) {
      return text
    }
    let href = assetResolver(ref)
    if (!href) {
      href = ref
    } else if (ref.endsWith('.html')) {
      return `<iframe src="${href}">${text}</iframe>`
    }
    return Renderer.prototype.image.call(this, href, title, text)
  }
}

marked.use({ extensions: [meta, footnoteDef, footnoteRef], renderer })

let containsCode
marked.setOptions({
  highlight: (code, language) => {
    containsCode = true
    if (language) {
      return hljs.highlight(code, { language }).value
    } else {
      return hljs.highlightAuto(code).value
    }
  }
})

// Not reentrant
export function parseMarkdown(markdownSource, resolver) {
  footnotes = new Map()
  metaEntries = new Map()
  containsCode = false
  assetResolver = resolver.assetResolver
  pageResolver = resolver.pageResolver
  const parser = new Parser()
  let html = marked.parse(markdownSource, {
    parser: parser
  })
  if (footnotes.size) {
    html += "<ol>\n"
    const footnoteEntries = [...footnotes.entries()];
    footnoteEntries.sort((a, b) => a[1].number - b[1].number)
    for (const [name, footnote] of footnoteEntries) {
      html += `<li id="anchor-${name}">${Parser.parseInline(footnote.content)}</li>\n`
    }
    html += "</ol>"
  }

  return {
    metaEntries,
    containsCode,
    html
  }
}
