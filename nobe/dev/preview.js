import { distDirURL } from './utils.js'

const server = Bun.serve({
	async fetch(req) {
		const url = new URL(req.url)

		if (url.pathname.endsWith('/')) {
			url.pathname += 'index.html'
		}

		const pathname = url.pathname.slice(1)
		const fileURL = new URL(pathname, distDirURL)
		const file = Bun.file(fileURL)

		return new Response(file)
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
