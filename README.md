# color-convert

A small but fairly comprehensive library for all your color conversion needs.

# Usage
```
npm install @szydlovski/color-convert
```
```javascript
import { rgbToHsv, hslToLab } from '@szydlovski/color-convert';

rgbToHsv(176, 56, 132) =>
[ 322, 68.18181818181817, 69.01960784313725 ]

hslToLab(275, 80, 60) =>
[ 50.340274857407536, 65.70357606981392, -66.20142815311705 ]

import { convertMap, getSupportedSpaces } from '@szydlovski/color-convert';

convertMap['rgb'].to['lch'](54,132,210) =>
[ 53.96062402947487, 47.095647357266465, 273.6522227803063 ]

getSupportedSpaces() =>
[ 'hsl', 'hsv', 'hwb', 'lab', 'lch', 'rgb', 'xyz' ]

// also available as cjs

const { rgbToHsv, hslToLab, convertMap, getSupportedSpaces } = require('@szydlovski/color-convert/cjs');
```

# Supported color spaces

| Color space | Available as | Value range |
| ------------- | ------------- | ------------- |
| sRGB | rgb | (0÷255, 0÷255, 0÷255)
| HSL | hsl | (0÷360, 0÷100, 0÷100)
| HSV | hsv | (0÷360, 0÷100, 0÷100)
| HWB | hwb | (0÷360, 0÷100, 0÷100)
| CIE-XYZ | xyz | (0÷95, 0÷100, 0÷109)*
| CIE-Lab | lab | (0÷100, -86÷98, -107÷94)*
| CIE-LCh(ab) | lch | (0÷100, 0÷134, 0÷360)*

<sub>\* All CIE conversions use a D65/2° standard illuminant `[95.047, 100, 108.883]`. The stated value ranges are approximate and refer to conversions from the sRGB spectrum. XYZ component ranges depend on the illuminant, Lab `a` and `b` components are typically clamped to -128÷127, while the range of LCh `c` for `chroma` is theoretically unbounded.</sub>

# API

Converters are exported by the module in two ways:

1. As functions named `<spaceFrom>To<spaceTo>` in lower camel case, for example `rgbToHsv(args)` or `hslToLch(args)`.
2. As a single object `convertMap`, with all combinations of converters accesible as `convertMap.<spaceFrom>.to.<spaceTo>`, for example `convertMap.rgb.to.lab(args)`. This allows for convenient programmatic conversions, i.e. `convertMap[fromSpace].to[toSpace](args)`.

All conversion functions take separate values as arguments, i.e. `rgbToHsl(r, g, b)` and return arrays with values in the order corresponding to the target space name (i.e. `[h, s, v]` for `<sourceSpace>toHsv`).

Neither the arguments nor the return values are clamped before or after conversion*.

<sub>* With the exception of conversion from CIE spaces to hue based spaces, where the intermediate `rgb` values are clamped to 0÷255.</sub>

# Limitations

Different color spaces are capable of describing different colors, and this effect becomes even more pronounced once you get into the CIE spaces. Because of that, and the inherent error present in floating point math, color conversion are almost never exact 1:1 transformations, and thus may be irreversible.

Through testing, I have determined the error for most conversions to have a median well below `0.01`. Larger errors are present when converting back an forth between more standard spaces (`rgb`, `hsl`, `hsv`) and CIE spaces (`xyz`, `lab`, `lch`) - up to a mean of `0.06`, median of `0.03`. This is a limitation of the underlying math, but the resulting color differences are practically guaranteed to be imperceptible to the human eye.

# TODO

- Add missing color spaces - HSI, HunterLab, maybe CIE-Luv and CIE-LCh(uv)