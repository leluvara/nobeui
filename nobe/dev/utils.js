const cwdURL = Bun.pathToFileURL(process.cwd())

if (cwdURL.pathname.endsWith('/') === false) {
	cwdURL.pathname += '/'
}

export const nobeDirURL = new URL('./nobe/', cwdURL)
export const wwwDirURL = new URL('./nobe/www/', cwdURL)
export const distDirURL = new URL('./dist/', cwdURL)
