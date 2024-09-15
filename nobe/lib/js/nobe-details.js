import { reduceMotion } from './utils.js'

const validate = (el) => {
	return (
		el &&
		el.nodeType === 1 &&
		el.nodeName === 'DETAILS' &&
		el.classList.contains('nobe-details')
	)
}

const observer = new MutationObserver((entries) => {
	for (const entry of entries) {
		const details = entry.target
		const content =
			validate(details) &&
			document.documentElement.classList.contains('nobe-details-enabled') &&
			reduceMotion.matches === false &&
			details.querySelector(':scope > :not(summary)')

		if (content) {
			toggle(details, content)
		}
	}
})

const observe = () => {
	observer.observe(document.body, {
		subtree: true,
		childList: true,
		attributeFilter: ['open'],
	})
}

/**
 *
 * @param {HTMLDetailsElement} el
 * @param {boolean} open
 */
const open = (el, open) => {
	observer.disconnect()
	el.open = open
	observe()
}

/**
 *
 * @param {HTMLDetailsElement} details
 * @param {HTMLElement} content
 */
const toggle = (details, content) => {
	// remove existing event listeners
	content.removeEventListener('transitionend', end)

	// store [open] state and .nobe-open and .nobe-shut value
	const opened = details.open
	const nobeOpen = details.classList.contains('nobe-open')
	const nobeShut = details.classList.contains('nobe-shut')
	const sliding = nobeOpen || nobeShut

	// make sure markers don't skip transition
	if (!sliding) {
		details.classList.add(opened ? 'nobe-shut' : 'nobe-open')
	}

	// set details.open to true
	open(details, true)

	if (sliding) {
		/**
		 * 1. in safari jumps to open or shut before transitioning :/
		 * 2. use rAF because gCS occasionally totally skips transition in Safari
		 */
		requestAnimationFrame(() => {
			if (nobeOpen) {
				content.style.blockSize = '0px'
				details.classList.remove('nobe-open')
				details.classList.add('nobe-shut')
			} else {
				content.style.blockSize = 'var(--nobe-details-size)'
				details.classList.remove('nobe-shut')
				details.classList.add('nobe-open')
			}
			content.addEventListener('transitionend', end)
		})
	} else {
		const animationDur = getComputedStyle(details).animationDuration
		const dur = parseFloat(animationDur)
		const blockSize = getComputedStyle(content).blockSize
		const size = parseFloat(blockSize)

		// if dur and size are real positive numbers then slide smoothly
		if (Number.isFinite(dur) && dur > 0 && Number.isFinite(size) && size > 0) {
			let from = 'var(--nobe-details-size)',
				to = '0px',
				remove = 'nobe-open',
				add = 'nobe-shut'

			if (opened) {
				from = '0px'
				to = 'var(--nobe-details-size)'
				remove = 'nobe-shut'
				add = 'nobe-open'
			}

			const time = `${Math.round(
				1000 * dur + Math.min(0.2 * size, 1000 * dur)
			)}ms`

			details.classList.remove(remove)
			details.classList.add(add)

			details.style.setProperty('--nobe-details-size', blockSize)
			details.style.setProperty('--nobe-details-time', time)

			content.style.transitionDuration = 'var(--nobe-details-time)'
			content.style.transitionProperty = 'height, width, block-size'
			content.style.overflow = 'hidden'
			content.style.blockSize = from

			getComputedStyle(content).opacity

			content.style.blockSize = to

			content.addEventListener('transitionend', end)
		} else {
			details.classList.remove('nobe-open')
			details.classList.remove('nobe-shut')
			open(details, opened)
		}
	}
}

/**
 * For when `transitionend` fires
 * @param {TransitionEvent} e
 */
const end = (e) => {
	const details = e.target.parentNode

	if (!validate(details)) {
		return
	}

	const prop = e.propertyName

	if (prop !== 'height' && prop !== 'width' && prop !== 'block-size') {
		return
	}

	// remove [open]
	if (details.classList.contains('nobe-shut')) {
		open(details, false)
	}

	// remove open and shut classes
	details.classList.remove('nobe-open')
	details.classList.remove('nobe-shut')

	// remove details styles
	details.style.removeProperty('--nobe-details-size')
	details.style.removeProperty('--nobe-details-time')

	if (details.getAttribute('style') === '') {
		details.removeAttribute('style')
	}

	// remove content styles
	const content = details.querySelector(':scope > :not(summary)')

	content.style.removeProperty('transition-duration')
	content.style.removeProperty('transition-property')
	content.style.removeProperty('overflow')
	content.style.removeProperty('block-size')

	if (content.getAttribute('style') === '') {
		content.removeAttribute('style')
	}

	content.removeEventListener('transitionend', end)
}

export const init = () => {
	document.documentElement.classList.add('nobe-details-enabled')
	observe()
}

export const halt = () => {
	document.documentElement.classList.remove('nobe-details-enabled')
	observer.disconnect()
}
