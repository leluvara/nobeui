import { Watcher } from './Watcher.js'
import { highlight } from './highlight.js'
import * as postcss from './postcss.js'
import * as rollup from './rollup.js'
import { nobeDirURL, wwwDirURL } from './utils.js'

const watcher = new Watcher(nobeDirURL.href)
watcher.start()

const server = Bun.serve({
	idleTimeout: 0, // https://github.com/oven-sh/bun/issues/13811
	async fetch(req) {
		const url = new URL(req.url)

		if (url.pathname === Watcher.pathname) {
			return watcher.connect(req)
		}

		if (url.pathname.endsWith('/')) {
			url.pathname += 'index.html'
		}

		const pathname = url.pathname.slice(1) // slice '/' to make it relative
		const fileURL = new URL(pathname, wwwDirURL)
		const file = Bun.file(fileURL)
		const mime = file.type
		const headers = { headers: { 'content-type': mime } }

		let response

		if (mime.startsWith('text/html')) {
			let content = await file.text()
			content = Watcher.rewriter.transform(content) // add watcher <script>
			content = await highlight(content) // add code highlighting
			response = new Response(content, headers)
		} else if (mime.startsWith('text/css')) {
			let content = await file.text()
			content = await postcss.serve(fileURL, content) // bundle w/ postcss
			response = new Response(content, headers)
		} else if (mime.startsWith('text/javascript')) {
			let content = await rollup.serve(fileURL) // bundle w/ rollup
			response = new Response(content, headers)
		} else {
			// simply respond with a file
			response = new Response(file)
		}

		return response
	},
	error(err) {
		return new Response(`${err}\n${err.stack}`, {
			headers: {
				'Content-Type': 'text/plain',
			},
		})
	},
})

console.log(server.url.href)
