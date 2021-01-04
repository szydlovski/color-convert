export function buildConvertMap(allConverters) {
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

export function composeConverters(...converters) {
	return function (...args) {
		return converters.reduce((result, converter) => converter(...result), args);
	};
}

export const defaultIlluminant = [95.047, 100, 108.883];