import { watch } from 'node:fs/promises'

export class Watcher {
	static html = { html: true }
	static pathname = '/nobe-live-reload'

	static rewriter = new HTMLRewriter().on('body', {
		element(element) {
			element.append(
				`<script>
					(() => {
						const sse = new EventSource('${Watcher.pathname}')
						sse.onmessage = () => { location.reload() }
						onbeforeunload = () => { sse.close() }
					})()
				</script>`,
				Watcher.html
			)
		},
	})

	constructor(dir) {
		this.dir = dir
		this.clients = new Set()
	}

	connect(req) {
		const watcher = this

		const stream = new ReadableStream({
			start(controller) {
				watcher.clients.add(controller)

				req.signal.onabort = () => {
					watcher.clients.delete(controller)
				}
			},
		})

		return new Response(stream, {
			status: 200,
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		})
	}

	async reload() {
		for (const client of this.clients) {
			client.enqueue('data: 1\n\n')
			client.close()
		}

		this.clients.clear()
	}

	async start() {
		const watcher = watch(this.dir, { recursive: true })

		for await (const event of watcher) {
			await this.reload()
		}
	}
}
