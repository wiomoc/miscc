import { parseMarkdown } from '../src/markdown.js'

describe('parse markdown', () => {
  test('smoke test', () => {
    const md = `
---
tags: abc, 123
title: eqweqw
---

lorum ipsum[^1]
warum ist die banane krumm?[^banana]
[^1]: https://loremipsum.de/
[^banana]: https://banana.de/
Link: [google](gg)
Link: [bing](https://bing.com)
Img: ![flower](ff)


        console.log("123", x, 234)

    `
    const resolver = {
      assetResolver(ref) {
        if (ref === 'ff') {
          return 'ff.png'
        }
      },
      pageResolver(ref) {
        if (ref === 'gg') {
          return 'https://google.com'
        }
      }
    }
    expect(parseMarkdown(md, resolver)).toEqual({
      metaEntries: new Map(Object.entries({ tags: 'abc, 123', title: 'eqweqw' })),
      containsCode: true,
      html: '<p>lorum ipsum<sup><a href="#anchor-1">1</a></sup>\n' +
        'warum ist die banane krumm?<sup><a href="#anchor-banana">2</a></sup>\n' +
        'Link: <a href="https://google.com">google</a>\n' +
        'Link: <a href="https://bing.com">bing</a>\n' +
        'Img: <img src="ff.png" alt="flower"></p>\n' +
        '<pre><code>    console.<span class="hljs-built_in">log</span>(<span class="hljs-string">&quot;123&quot;</span>, x, <span class="hljs-number">234</span>)\n' +
        '</code></pre>\n' +
        '<ol>\n' +
        '<li id="anchor-1"><a href="https://loremipsum.de/">https://loremipsum.de/</a></li>\n' +
        '<li id="anchor-banana"><a href="https://banana.de/">https://banana.de/</a></li>\n' +
        '</ol>'
    })
  })

  test('without meta - no code', () => {
    expect(parseMarkdown(`
lorum ipsum
warum ist die banane krumm?
\`abc\`
`, {})).toEqual({
      metaEntries: new Map(),
      containsCode: false,
      html: '<p>lorum ipsum\n' +
        'warum ist die banane krumm?\n' +
        '<code>abc</code></p>\n'
    })
  })
})
