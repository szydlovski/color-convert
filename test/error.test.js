import testCases from './cases.test.js';
import { convertMap, getSupportedSpaces } from '../src/index.js';

function getValuesError(values, targetValues, opts = {}) {
	const { ignoreHue = false, loopHue = false, hueIndex = 0 } = opts;
	return Math.max(
		...values.map((value, index) => {
			if (ignoreHue && index === hueIndex) return 0;
			if (loopHue && index === hueIndex) {
				const err = targetValues[index] - value;
				return Math.min(
					Math.abs(err),
					Math.abs(err + 360),
					Math.abs(err - 360)
				);
			}
			return Math.abs(targetValues[index] - value);
		})
	);
}

const spaces = getSupportedSpaces();

const ignoreList = [];
const hueSpaces = ['hsl', 'hsv', 'hsi', 'hwb', 'lch'];

const [errorData, largeErrors] = computeErrorData();
prettyPrintErrorData(errorData, largeErrors);

function computeErrorData() {
	const errorData = {};
	const largeErrors = [];
	for (const sourceSpace of spaces) {
		errorData[sourceSpace] = {};
		for (const targetSpace of spaces) {
			if (targetSpace === sourceSpace) continue;
			const errors = [];
			for (const testCase of testCases) {
				const sourceColor = testCase[sourceSpace];
				const expectedResult = testCase[targetSpace];
				const converter = convertMap[sourceSpace].to[targetSpace];
				const actualResult = converter(...sourceColor);
				const isHueBased = hueSpaces.includes(targetSpace);
				const isHwbGrayscale =
					targetSpace === 'hwb' &&
					Math.round(expectedResult[1] + expectedResult[2]) >= 1;
				const isHslHsvGrayscale =
					['hsl', 'hsv'].includes(targetSpace) && expectedResult[1] === 0;
				const isLch = 'lch' === targetSpace;
				const caseError = getValuesError(actualResult, expectedResult, {
					ignoreHue: isHwbGrayscale || isHslHsvGrayscale || isLch,
					loopHue: isHueBased,
					hueIndex: targetSpace.indexOf('h'),
				});
				const isIgnored =
					ignoreList.includes(sourceSpace) || ignoreList.includes(targetSpace);
				if (caseError > 1 && !isIgnored) {
					largeErrors.push({
						sourceSpace,
						targetSpace,
						error: caseError,
						testCase,
						actualResult,
					});
				} else {
					errors.push(caseError);
				}				
			}
			errorData[sourceSpace][targetSpace] = {
				min: Math.min(...errors),
				max: Math.max(...errors),
				avg: errors.reduce((total, next) => total + next) / errors.length,
				median: errors.sort()[Math.round(errors.length / 2)],
			};
		}
	}
	return [errorData, largeErrors];
}

function prettyPrintErrorData(errorData, largeErrors) {
	console.log(`Error data computed from ${testCases.length} test cases.\n`);
	const redLog = (str) => `\x1b[31m${str}\x1b[0m`;
	const yellowLog = (str) => `\x1b[33m${str}\x1b[0m`;
	for (const [sourceSpace, targetSpaces] of Object.entries(errorData)) {
		console.log(`  converting from ${sourceSpace} to:`);
		for (const [targetSpace, errors] of Object.entries(targetSpaces)) {
			let { min, max, avg, median } = errors;
			[min, max, avg, median] = [min, max, avg, median].map((value) => {
				const fixed = value.toFixed(4);
				return value > 0.2
					? redLog(fixed)
					: value > 0.05
					? yellowLog(fixed)
					: fixed;
			});
			console.log(
				`    ${targetSpace}: (${min} - ${max}, mean: ${avg}, median: ${median})`
			);
		}
		console.log('\n');
	}
	if (largeErrors.length > 0) {
		console.log(redLog('LARGE ERRORS'));
		for (const largeError of largeErrors) {
			const {sourceSpace, targetSpace, error, testCase, actualResult} = largeError;
			console.log(`\n  From ${sourceSpace} to ${targetSpace}`);
			console.log(`    Error: ${redLog(error.toFixed(4))}`);
			console.log('    RGB:', testCase.rgb);
			console.log('    Arguments:', testCase[sourceSpace]);
			console.log('    Expected:', testCase[targetSpace]);
			console.log('    Actual:', actualResult);
		}
	}
}

// (async () => {
//   const wait = ms => new Promise(resolve => {
//     setTimeout(() => {
//       resolve();
//     }, ms)
//   });
//   const valueSets = [];
//   for (let r = 0.5; r <= 255; r += 84) {
//     for (let g = 0.5; g <= 255; g += 84) {
//       for (let b = 0.5; b <= 255; b += 84) {
//         valueSets.push([r,g,b]);
//       }
//     }
//   }
//   console.log(valueSets);
//   console.log(`Getting ${valueSets.length} entries, this will take approximately ${valueSets.length/60} minutes`);
//   const [rInput, gInput, bInput] = [1,2,3].map(i => document.querySelector(`input[name="DAT${i}"`));
//   const convertButton = document.querySelector('a[name="resultPUSH"]');
//   const parseColors = str => {
//     const [rgb, hsl, hsv, hsi, cmy, cmyk, xyz, yxy, lab, lch, luv, lchuv] = str
//       .split('\n')
//       .filter((str) => str !== '')
//       .filter((value, index) => [0, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14].includes(index))
//       .map((line) => line.split(/\s/g).filter((part) => part !== ''));
//     const floats = (strs, scales = [1, 1, 1]) =>
//       strs.map((str, index) => parseFloat(str) * scales[index]);
//     return {
//       rgb: floats([rgb[3], rgb[4], rgb[5]]),
//       hsl: floats([hsl[3], hsl[4], hsl[5]], [360, 100, 100]),
//       hsv: floats([hsv[3], hsv[4], hsv[5]], [360, 100, 100]),
//       hsi: floats([hsi[3], hsi[4], hsi[5]], [360, 100, 100]),
//       cmy: floats([cmy[3], cmy[4], cmy[5]], [100, 100, 100]),
//       cmyk: floats([cmyk[3], cmyk[4], cmyk[5], cmyk[6]], [100, 100, 100, 100]),
//       xyz: floats([xyz[2], xyz[3], xyz[4]]),
//       yxy: floats([yxy[2], yxy[3], yxy[4]]),
//       lab: floats([lab[2], lab[3], lab[4]]),
//       lch: floats([lch[2], lch[3], lch[4]]),
//       luv: floats([luv[2], luv[3], luv[4]]),
//       lchuv: floats([lchuv[2], lchuv[3], lchuv[4]]),
//     };
//   }
//   const parsedColors = [];
//   for (const values of valueSets) {
//     const [r,g,b] = values;
//     rInput.value = r;
//     gInput.value = g;
//     bInput.value = b;
//     convertButton.click();
//     await wait(1000);
//     parsedColors.push(parseColors(document.getElementById('resultBACK').children[1].innerText))
//   }
//   console.log(JSON.stringify(parsedColors));
// })();
