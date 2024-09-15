import { details, ripple } from './nobeui.js'

details.init()
ripple.init()

// close sidebar when clicking a sidebar link
const docsSidebarToggle = document.querySelector('#docs-sidebar-toggle')

const anchors = document.querySelectorAll('aside a')

for (const anchor of anchors) {
	anchor.onclick = () => {
		docsSidebarToggle.checked = false
	}
}

// color scheme picker
const radios = document.getElementsByName('docs-color-scheme')

for (const radio of radios) {
	radio.onchange = (e) => {
		const val = e.target.value
		document.documentElement.dataset.colorScheme = val
		localStorage.setItem('nobeui-docs-color-scheme', val)
	}
}

onstorage = (e) => {
	if (e.key === 'nobeui-docs-color-scheme') {
		const val = e.newValue

		document.documentElement.dataset.colorScheme = val

		for (const radio of radios) {
			if (radio.value === val) {
				radio.checked = true
			}
		}
	}
}

// smooth scrolling toggle
document.querySelector('[name="docs-smooth-scrolling"]').onchange = (e) => {
	if (e.target.checked) {
		document.documentElement.dataset.smoothScrolling = ''
		localStorage.setItem('nobeui-docs-smooth-scrolling', '1')
	} else {
		delete document.documentElement.dataset.smoothScrolling
		localStorage.setItem('nobeui-docs-smooth-scrolling', '')
	}
}

// save sidebar state
onbeforeunload = () => {
	const details = []
	const sidebarEl = document.querySelector('.docs-sidebar')
	const scrollTop = sidebarEl.scrollTop

	for (const detailsEl of sidebarEl.querySelectorAll('details')) {
		if (detailsEl.open) {
			details.push(true)
		} else {
			details.push(false)
		}
	}

	const sidebar = { details, scrollTop }

	sessionStorage.setItem('nobeui-docs-sidebar', JSON.stringify(sidebar))
}
