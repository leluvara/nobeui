import { readdir, rm } from 'node:fs/promises'
import { highlight } from './highlight.js'
import * as postcss from './postcss.js'
import * as rollup from './rollup.js'
import { distDirURL, wwwDirURL } from './utils.js'

await rm(distDirURL, { recursive: true, force: true })

const wwwFileNames = await readdir(wwwDirURL)

for (const name of wwwFileNames) {
	if (name.startsWith('.')) {
		continue
	}

	const fileURL = new URL(name, wwwDirURL)
	const file = Bun.file(fileURL)
	const mime = file.type

	let content

	if (mime.startsWith('text/html')) {
		content = await file.text()
		content = await highlight(content)
	} else if (mime.startsWith('text/css')) {
		content = await file.text()
		content = await postcss.serve(fileURL, content, true)
	} else if (mime.startsWith('text/javascript')) {
		content = await rollup.serve(fileURL, true)
	} else {
		content = file
	}

	await Bun.write(new URL(name, distDirURL), content)
}
