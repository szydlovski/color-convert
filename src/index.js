import * as allConverters from './converters.js';
import { buildConvertMap } from './internals.js';

export * from './converters.js';
export const convertMap = buildConvertMap(allConverters);
export const getSupportedSpaces = () => Object.keys(convertMap);