import { marked, Renderer, Parser } from 'marked'
import fr from 'front-matter'
import hljs from 'highlight.js'
import temml  from 'temml'

let footnotes
const footnoteRef = {
  name: 'footnoteRef',
  level: 'inline',
  start: (src) => src.match(/\[\^\S+\](?!:)/)?.index,
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
  start: (src) => src.match(/\[\^\S+\]:/)?.index,
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

const formular = {
  name: 'formular',
  level: 'inline',
  start: (src) => src.indexOf('$'),
  tokenizer(src) {
    const rule = /^\$([^$\n]*)\$/
    const match = rule.exec(src)

    if (match) {
      return {
        type: 'formular',
        raw: match[0],
        text: match[1].trim()
      }
    }
  },
  renderer(token) {
    return temml.renderToString(token.text);
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
    } else if (ref.endsWith('.mp4')) {
      return `<video autoplay muted loop><source src="${href}" type="video/mp4">${text}</video>`
    } else {
      return Renderer.prototype.image.call(this, href, title, text)
    }
  }
}

marked.use({ extensions: [footnoteDef, footnoteRef, formular], renderer })

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
  containsCode = false
  assetResolver = resolver.assetResolver
  pageResolver = resolver.pageResolver
  const frontMatter = fr(markdownSource);
  const metaEntries = new Map(Object.entries(frontMatter.attributes))
  let html = marked.parse(frontMatter.body, { langPrefix: "hljs " })
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
