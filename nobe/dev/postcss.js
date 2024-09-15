import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import postcss from 'postcss'
import postcssDarkTheme from 'postcss-dark-theme-class'
import postcssImport from 'postcss-import'

export const serve = async (fileURL, fileContent, minify) => {
	const from = Bun.fileURLToPath(fileURL)

	const plugins = [
		autoprefixer,
		postcssImport,
		postcssDarkTheme({
			darkSelector: '[data-color-scheme=dark]',
			lightSelector: '[data-color-scheme=light]',
		}),
	]

	if (minify) {
		plugins.push(cssnano())
	}

	const result = await postcss(plugins).process(fileContent, { from })

	return result.css
}
