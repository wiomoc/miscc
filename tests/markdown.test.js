import { parseMarkdown } from '../src/markdown.js'

describe('parse markdown', () => {
    test('smoke test', () => {
        expect(parseMarkdown(`
[tags]: abc, 123
[title]: eqweqw

lorum ipsum
warum ist die banane krumm?


        console.log("123", x, 234)
    `)).toEqual({
            metaEntries: new Map(Object.entries({ 'tags': 'abc, 123', 'title': 'eqweqw' })),
            containsCode: true,
            html: '<p>lorum ipsum\n' +
                'warum ist die banane krumm?</p>\n' +
                '<pre><code>    console.<span class="hljs-built_in">log</span>(<span class="hljs-string">&quot;123&quot;</span>, x, <span class="hljs-number">234</span>)\n' +
                '</code></pre>\n'
        });
    });

    test('without meta - no code', () => {
        expect(parseMarkdown(`
lorum ipsum
warum ist die banane krumm?
\`abc\`
`)).toEqual({
            metaEntries: new Map(),
            containsCode: false,
            html: '<p>lorum ipsum\n' +
                'warum ist die banane krumm?\n' +
                '<code>abc</code></p>\n'
        });
    });
})