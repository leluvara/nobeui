import terser from '@rollup/plugin-terser'
import { rollup } from 'rollup'

export const serve = async (fileURL, minify) => {
	const input = Bun.fileURLToPath(fileURL)
	const bundle = await rollup({ input, external: './nobeui.js' })
	const plugins = minify ? [terser()] : []
	const { output } = await bundle.generate({ plugins })
	return output[0].code
}
