import hljs from 'highlight.js/lib/core'

import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import xml from 'highlight.js/lib/languages/xml'

hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', js)

const html = { html: true }

const rewriter = new HTMLRewriter()

const handler = {
	async element(element) {
		const dataNobeui = element.getAttribute('data-nobeui')

		if (dataNobeui) {
			const fileContent = await Bun.file(dataNobeui).text()
			element.setInnerContent(hljs.highlightAuto(fileContent).value, html)
		} else {
			element
				.prepend('<!-- nobeui-highlight-tag -->', html)
				.append('<!-- /nobeui-highlight-tag -->', html)
		}

		element.removeAttribute('data-nobeui')
	},
}

rewriter.on('code.hljs', handler)

const regex =
	/<!-- nobeui-highlight-tag -->([^]*?)<!-- \/nobeui-highlight-tag -->/g

export const highlight = async (content) => {
	content = await rewriter.transform(content)

	content = content.replace(regex, (m, g) => hljs.highlightAuto(g).value)

	return content
}
