import { reduceMotion } from './utils.js'

// Color parsing https://stackoverflow.com/a/19366389
function memoize(factory, ctx) {
	const cache = {}

	return function (key) {
		if (!(key in cache)) {
			cache[key] = factory.call(ctx, key)
		}
		return cache[key]
	}
}

function colorToRGBA() {
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = 1

	const ctx = canvas.getContext('2d')

	return memoize(function (color) {
		ctx.clearRect(0, 0, 1, 1)
		// In order to detect invalid values,
		// we can't rely on col being in the same format as what fillStyle is computed as,
		// but we can ask it to implicitly compute a normalized value twice and compare.
		ctx.fillStyle = '#000'
		ctx.fillStyle = color
		const computed = ctx.fillStyle
		ctx.fillStyle = '#fff'
		ctx.fillStyle = color
		if (computed !== ctx.fillStyle) {
			return // invalid
		}
		ctx.fillRect(0, 0, 1, 1)

		return [...ctx.getImageData(0, 0, 1, 1).data]
	})
}

const queue = new Map()

const ripples = new Map()

const forbiddens = ['.nobe-select', '.nobe-stripes']

let getRGBA,
	isDown = false

const getEl = (el) => {
	while (el.parentNode) {
		if (el.classList.contains('nobe-ripple')) {
			for (const forbidden of forbiddens) {
				if (el.matches(forbidden)) {
					return
				}
			}
			return el
		} else if (el.tagName === 'BODY') {
			return
		} else {
			el = el.parentNode
		}
	}
}

const attempt = (el, x, y) => {
	if (reduceMotion.matches) {
		return
	}

	el = getEl(el)

	if (!el) {
		return
	}

	if (queue.has(el)) {
		return
	}

	queue.set(el, {
		x: x,
		y: y,
		// At minimum how many setTimeouts to go through
		checks: 99,
	})

	check()
}

// poll and check for :active selector
const check = () => {
	let checksLeft = 0

	for (const [el, pos] of queue) {
		if (el.matches(':active')) {
			create(el, pos)
			queue.delete(el)
			if (queue.size < 1) {
				return
			}
		} else {
			const checks = --pos.checks
			checksLeft = checksLeft < checks ? checks : checksLeft
		}
	}

	if (isDown || checksLeft > 0) {
		setTimeout(check)
	} else {
		queue.clear()
	}
}

const create = (el, pos) => {
	const rect = el.getBoundingClientRect(),
		styles = getComputedStyle(el),
		duration = 1000 * parseFloat(styles.animationDuration),
		colorVariable = styles.getPropertyValue('--nobe-ripple-bg'),
		color = getRGBA(colorVariable) || [211, 211, 211, 127],
		alpha = Math.round((color[3] / 255) * 1e3) / 1e3,
		x = pos.x - rect.left,
		y = pos.y - rect.top,
		dx = Math.max(Math.abs(x), Math.abs(pos.x - rect.right)),
		dy = Math.max(Math.abs(y), Math.abs(pos.y - rect.bottom)),
		diameter = 2.06 * Math.sqrt(dx * dx + dy * dy)

	requestAnimationFrame((timeStamp) => {
		const wave = {
			rgb: `${color[0]}, ${color[1]}, ${color[2]}`,
			a: alpha,
			a0: alpha,
			x0: x,
			y0: y,
			x: x,
			y: y,
			size: 0,
			sizeMax: diameter,
			fillStart: timeStamp,
			fillDuration: duration + 0.15 * diameter,
			released: false,
			fadeStart: null,
			fadeDuration: duration,
		}

		if (ripples.has(el)) {
			ripples.get(el).push(wave)
		} else {
			ripples.set(el, [wave])
			// If drawing not already in progress then kick it off here
			if (ripples.size === 1) {
				draw(timeStamp)
			}
		}
	})
}

const draw = (timeStamp) => {
	for (const [el, waves] of ripples) {
		// Initialize style strings
		let image = ``,
			size = ``,
			position = ``

		// Update waves & styles
		for (const wave of waves) {
			if (wave.released === false && isDown === false) {
				wave.released = true
			}

			if (wave.fadeStart === null) {
				// progress = cubicOut
				const t = (timeStamp - wave.fillStart) / wave.fillDuration,
					progress = Math.max(0, Math.min(1, (t - 1) * (t - 1) * (t - 1) + 1))

				wave.size = Math.round(wave.sizeMax * progress)
				wave.x = Math.round(wave.x0 - 0.5 * wave.size)
				wave.y = Math.round(wave.y0 - 0.5 * wave.size)

				if (wave.released === true && progress >= 1) {
					wave.fadeStart = timeStamp
				}
			}

			if (wave.fadeStart !== null) {
				// progress = linear in reverse
				const t = (timeStamp - wave.fadeStart) / wave.fadeDuration,
					progress = Math.max(0, Math.min(1, 1 - t))

				wave.a = Math.max(0, Math.round(wave.a0 * progress * 1e3) / 1e3)
			}

			image += `radial-gradient(rgba(${wave.rgb}, ${wave.a}) calc(69% - 1px), rgba(${wave.rgb}, 0) 69%),`
			size += `${wave.size}px ${wave.size}px,`
			position += `${wave.x}px ${wave.y}px,`
		}

		// Update styles on element & remove last comma with .slice()
		el.style.backgroundImage = image.slice(0, -1)
		el.style.backgroundSize = size.slice(0, -1)
		el.style.backgroundPosition = position.slice(0, -1)

		// Remove oldest wave if its alpha is <= 0
		if (waves[0].a <= 0) {
			waves.shift()

			// If no waves left
			if (waves.length < 1) {
				el.style.removeProperty('background-image')
				el.style.removeProperty('background-size')
				el.style.removeProperty('background-position')
				if (el.getAttribute('style') === '') {
					el.removeAttribute('style')
				}
				ripples.delete(el)
			}
		}
	}

	// Request next frame
	if (ripples.size > 0) {
		requestAnimationFrame(draw)
	}
}

const pointerDown = (e) => {
	isDown = true
	attempt(e.target, e.clientX, e.clientY)
}

const pointerCancel = () => {
	isDown = false
}

const pointerUp = () => {
	isDown = false
}

export const init = () => {
	if (!getRGBA) {
		getRGBA = colorToRGBA()
	}

	document.documentElement.classList.add('nobe-ripple-enabled')
	document.addEventListener('pointerdown', pointerDown)
	document.addEventListener('pointercancel', pointerCancel)
	document.addEventListener('pointerup', pointerUp)
}

export const halt = () => {
	document.documentElement.classList.remove('nobe-ripple-enabled')
	document.removeEventListener('pointerdown', pointerDown)
	document.removeEventListener('pointercancel', pointerCancel)
	document.removeEventListener('pointerup', pointerUp)
}
