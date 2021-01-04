'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function buildConvertMap(allConverters) {
	const convertMap = {};
	Object.entries(allConverters).forEach(([name, converter]) => {
		const [from, to] = name
			.match(/(.+)To(.+)/)
			.slice(1, 3)
			.map((space) => space.toLowerCase());
		if (!convertMap[from]) {
			convertMap[from] = { to: {} };
		}
		convertMap[from].to[to] = converter;
	});
	return convertMap;
}

function composeConverters(...converters) {
	return function (...args) {
		return converters.reduce((result, converter) => converter(...result), args);
	};
}

const defaultIlluminant = [95.047, 100, 108.883];

function rgbToHsv(r, g, b) {
	(r /= 255), (g /= 255), (b /= 255);

	let h, s, v;

	const min = Math.min(r, g, b);
	const max = Math.max(r, g, b);
	const delta = max - min;

	v = max;

	if (delta === 0) {
		// grayscale
		h = 0;
		s = 0;
	} else {
		s = delta / max;
		const deltaR = ((max - r) / 6 + delta / 2) / delta;
		const deltaG = ((max - g) / 6 + delta / 2) / delta;
		const deltaB = ((max - b) / 6 + delta / 2) / delta;
		switch (max) {
			case r:
				h = deltaB - deltaG;
				break;
			case g:
				h = 1 / 3 + deltaR - deltaB;
				break;
			case b:
				h = 2 / 3 + deltaG - deltaR;
				break;
		}
	}

	if (h < 0) h += 1;
	if (h > 1) h -= 1;

	return [h * 360, s * 100, v * 100];
}

function hsvToRgb(h, s, v) {
	//H, S and V input range = 0 ÷ 1.0
	//R, G and B output range = 0 ÷ 255

	(h /= 360), (s /= 100), (v /= 100);

	let r, g, b;

	if (s == 0) {
		r = v;
		g = v;
		b = v;
	} else {
		let hp = h * 6;
		if (hp == 6) hp = 0; //h must be < 1
		let i = Math.floor(hp); //Or ... i = floor( hp )
		let c1 = v * (1 - s);
		let c2 = v * (1 - s * (hp - i));
		let c3 = v * (1 - s * (1 - (hp - i)));

		if (i == 0) {
			r = v;
			g = c3;
			b = c1;
		} else if (i == 1) {
			r = c2;
			g = v;
			b = c1;
		} else if (i == 2) {
			r = c1;
			g = v;
			b = c3;
		} else if (i == 3) {
			r = c1;
			g = c2;
			b = v;
		} else if (i == 4) {
			r = c3;
			g = c1;
			b = v;
		} else {
			r = v;
			g = c1;
			b = c2;
		}
	}
	return [r * 255, g * 255, b * 255];
}

function hsvToHsl(h, s, v) {
	(s /= 100), (v /= 100);

	const l = v - (v * s) / 2;
	let s2;
	if (l === 0 || l === 1) {
		s2 = 0;
	} else {
		s2 = (v - l) / Math.min(l, 1 - l);
	}
	return [h, s2 * 100, l * 100];
}

function hslToHsv(h, s, l) {
	(s /= 100), (l /= 100);

	const v = l + s * Math.min(l, 1 - l);
	let s2;
	if (v === 0) {
		s2 = 0;
	} else {
		s2 = 2 - (2 * l) / v;
	}
	return [h, s2 * 100, v * 100];
}

function hslToRgb(h, s, l) {
	(h /= 360), (s /= 100), (l /= 100);

	let r, g, b;

	if (s == 0) {
		// grayscale
		r = g = b = l;
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [r * 255, g * 255, b * 255];
}

function rgbToHsl(r, g, b) {
	(r /= 255), (g /= 255), (b /= 255);

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);

	let h, s, l;

	l = (max + min) / 2;

	if (max == min) {
		// grayscale
		h = s = 0;
	} else {
		const d = max - min;
		s = l < 0.5 ? d / (max + min) : d / (2 - max - min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return [h * 360, s * 100, l * 100];
}

function hsvToHwb(h, s, v) {
	(s /= 100), (v /= 100);
	const w = (1 - s) * v;
	const b = 1 - v;
	return [h, w * 100, b * 100];
}

function hwbToHsv(h, w, b) {
	(w /= 100), (b /= 100);
	const wbSum = w + b;
	if (wbSum > 1) {
		w /= wbSum;
		b /= wbSum;
	}
	const v = 1 - b;
	const s = v === 0 ? 0 : 1 - w / v;
	if ([h,s,v].some(v => isNaN(v))) {
		console.log([h,w,b]);
	}
	return [h, s * 100, v * 100];
}

function rgbToXyz(r, g, b) {
	//X, Y and Z output refer to a D65/2° standard illuminant.

	(r /= 255), (g /= 255), (b /= 255);

	if (r > 0.04045) {
		r = ((r + 0.055) / 1.055) ** 2.4;
	} else {
		r = r / 12.92;
	}
	if (g > 0.04045) {
		g = ((g + 0.055) / 1.055) ** 2.4;
	} else {
		g = g / 12.92;
	}
	if (b > 0.04045) {
		b = ((b + 0.055) / 1.055) ** 2.4;
	} else {
		b = b / 12.92;
	}

	r = r * 100;
	g = g * 100;
	b = b * 100;

	return [
		r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
		r * 0.2126729 + g * 0.7151522 + b * 0.072175,
		r * 0.0193339 + g * 0.119192 + b * 0.9503041,
	];
}

function xyzToRgb(x, y, z) {
	//X, Y and Z input refer to a D65/2° standard illuminant.
	//sR, sG and sB (standard RGB) output range = 0 ÷ 255

	(x /= 100), (y /= 100), (z /= 100);

	let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
	let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
	let b = x * 0.0557 + y * -0.204 + z * 1.057;

	if (r > 0.0031308) {
		r = 1.055 * r ** (1 / 2.4) - 0.055;
	} else {
		r = 12.92 * r;
	}
	if (g > 0.0031308) {
		g = 1.055 * g ** (1 / 2.4) - 0.055;
	} else {
		g = 12.92 * g;
	}
	if (b > 0.0031308) {
		b = 1.055 * b ** (1 / 2.4) - 0.055;
	} else {
		b = 12.92 * b;
	}

	return [r * 255, g * 255, b * 255];
}

function labToXyz(l, a, b) {
	let y = (l + 16) / 116;
	let x = a / 500 + y;
	let z = y - b / 200;

	if (y ** 3 > 0.008856) {
		y = y ** 3;
	} else {
		y = (y - 16 / 116) / 7.787;
	}
	if (x ** 3 > 0.008856) {
		x = x ** 3;
	} else {
		x = (x - 16 / 116) / 7.787;
	}
	if (z ** 3 > 0.008856) {
		z = z ** 3;
	} else {
		z = (z - 16 / 116) / 7.787;
	}

	const [refX, refY, refZ] = defaultIlluminant;
	return [x * refX, y * refY, z * refZ];
}

function xyzToLab(x, y, z) {
	const [refX, refY, refZ] = defaultIlluminant;

	x /= refX;
	y /= refY;
	z /= refZ;

	if (x > 0.008856) {
		x = x ** (1 / 3);
	} else {
		x = 7.787 * x + 16 / 116;
	}
	if (y > 0.008856) {
		y = y ** (1 / 3);
	} else {
		y = 7.787 * y + 16 / 116;
	}
	if (z > 0.008856) {
		z = z ** (1 / 3);
	} else {
		z = 7.787 * z + 16 / 116;
	}

	return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function labToLch(labL, labA, labB) {
	let var_H = Math.atan2(labB, labA);

	if (var_H > 0) var_H = (var_H / Math.PI) * 180;
	else var_H = 360 - (Math.abs(var_H) / Math.PI) * 180;

	return [labL, Math.sqrt(labA ** 2 + labB ** 2), var_H];
}

function lchToLab(l, c, h) {
	const hr = (h * Math.PI) / 180;
	const a = Math.cos(hr) * c;
	const b = Math.sin(hr) * c;
	return [l, a, b];
}

function clamp(value, min, max) {
	return value < min ? min : value > max ? max : value;
}

function clampRgb(r, g, b) {
	return [r, g, b].map((value) => clamp(value, 0, 255));
}

const rgbToLab = composeConverters(rgbToXyz, xyzToLab);
const rgbToLch = composeConverters(rgbToLab, labToLch);
const rgbToHwb = composeConverters(rgbToHsv, hsvToHwb);

const hslToXyz = composeConverters(hslToRgb, rgbToXyz);
const hslToLab = composeConverters(hslToXyz, xyzToLab);
const hslToLch = composeConverters(hslToLab, labToLch);
const hslToHwb = composeConverters(hslToHsv, hsvToHwb);

const hsvToXyz = composeConverters(hsvToRgb, rgbToXyz);
const hsvToLab = composeConverters(hsvToXyz, xyzToLab);
const hsvToLch = composeConverters(hsvToLab, labToLch);

const xyzToHsl = composeConverters(xyzToRgb, clampRgb, rgbToHsl);
const xyzToHsv = composeConverters(xyzToRgb, clampRgb, rgbToHsv);
const xyzToHwb = composeConverters(xyzToHsv, hsvToHwb);
const xyzToLch = composeConverters(xyzToLab, labToLch);

const labToRgb = composeConverters(labToXyz, xyzToRgb);
const labToHsl = composeConverters(labToRgb, clampRgb, rgbToHsl);
const labToHsv = composeConverters(labToRgb, clampRgb, rgbToHsv);
const labToHwb = composeConverters(labToHsv, hsvToHwb);

const lchToRgb = composeConverters(lchToLab, labToRgb);
const lchToXyz = composeConverters(lchToLab, labToXyz);
const lchToHsl = composeConverters(lchToRgb, clampRgb, rgbToHsl);
const lchToHsv = composeConverters(lchToRgb, clampRgb, rgbToHsv);
const lchToHwb = composeConverters(lchToHsv, hsvToHwb);

const hwbToRgb = composeConverters(hwbToHsv, hsvToRgb);
const hwbToHsl = composeConverters(hwbToHsv, hsvToHsl);
const hwbToXyz = composeConverters(hwbToRgb, rgbToXyz);
const hwbToLab = composeConverters(hwbToXyz, xyzToLab);
const hwbToLch = composeConverters(hwbToLab, labToLch);

var allConverters = /*#__PURE__*/Object.freeze({
	__proto__: null,
	rgbToHsv: rgbToHsv,
	hsvToRgb: hsvToRgb,
	hsvToHsl: hsvToHsl,
	hslToHsv: hslToHsv,
	hslToRgb: hslToRgb,
	rgbToHsl: rgbToHsl,
	hsvToHwb: hsvToHwb,
	hwbToHsv: hwbToHsv,
	rgbToXyz: rgbToXyz,
	xyzToRgb: xyzToRgb,
	labToXyz: labToXyz,
	xyzToLab: xyzToLab,
	labToLch: labToLch,
	lchToLab: lchToLab,
	rgbToLab: rgbToLab,
	rgbToLch: rgbToLch,
	rgbToHwb: rgbToHwb,
	hslToXyz: hslToXyz,
	hslToLab: hslToLab,
	hslToLch: hslToLch,
	hslToHwb: hslToHwb,
	hsvToXyz: hsvToXyz,
	hsvToLab: hsvToLab,
	hsvToLch: hsvToLch,
	xyzToHsl: xyzToHsl,
	xyzToHsv: xyzToHsv,
	xyzToHwb: xyzToHwb,
	xyzToLch: xyzToLch,
	labToRgb: labToRgb,
	labToHsl: labToHsl,
	labToHsv: labToHsv,
	labToHwb: labToHwb,
	lchToRgb: lchToRgb,
	lchToXyz: lchToXyz,
	lchToHsl: lchToHsl,
	lchToHsv: lchToHsv,
	lchToHwb: lchToHwb,
	hwbToRgb: hwbToRgb,
	hwbToHsl: hwbToHsl,
	hwbToXyz: hwbToXyz,
	hwbToLab: hwbToLab,
	hwbToLch: hwbToLch
});

const convertMap = buildConvertMap(allConverters);
const getSupportedSpaces = () => Object.keys(convertMap);

exports.convertMap = convertMap;
exports.getSupportedSpaces = getSupportedSpaces;
exports.hslToHsv = hslToHsv;
exports.hslToHwb = hslToHwb;
exports.hslToLab = hslToLab;
exports.hslToLch = hslToLch;
exports.hslToRgb = hslToRgb;
exports.hslToXyz = hslToXyz;
exports.hsvToHsl = hsvToHsl;
exports.hsvToHwb = hsvToHwb;
exports.hsvToLab = hsvToLab;
exports.hsvToLch = hsvToLch;
exports.hsvToRgb = hsvToRgb;
exports.hsvToXyz = hsvToXyz;
exports.hwbToHsl = hwbToHsl;
exports.hwbToHsv = hwbToHsv;
exports.hwbToLab = hwbToLab;
exports.hwbToLch = hwbToLch;
exports.hwbToRgb = hwbToRgb;
exports.hwbToXyz = hwbToXyz;
exports.labToHsl = labToHsl;
exports.labToHsv = labToHsv;
exports.labToHwb = labToHwb;
exports.labToLch = labToLch;
exports.labToRgb = labToRgb;
exports.labToXyz = labToXyz;
exports.lchToHsl = lchToHsl;
exports.lchToHsv = lchToHsv;
exports.lchToHwb = lchToHwb;
exports.lchToLab = lchToLab;
exports.lchToRgb = lchToRgb;
exports.lchToXyz = lchToXyz;
exports.rgbToHsl = rgbToHsl;
exports.rgbToHsv = rgbToHsv;
exports.rgbToHwb = rgbToHwb;
exports.rgbToLab = rgbToLab;
exports.rgbToLch = rgbToLch;
exports.rgbToXyz = rgbToXyz;
exports.xyzToHsl = xyzToHsl;
exports.xyzToHsv = xyzToHsv;
exports.xyzToHwb = xyzToHwb;
exports.xyzToLab = xyzToLab;
exports.xyzToLch = xyzToLch;
exports.xyzToRgb = xyzToRgb;
