[![npm version](https://img.shields.io/npm/v/iqc-canvas)](https://www.npmjs.com/package/iqc-canvas)

Screenshot Iphone WhatsApp Chat Generator by Hann Universe

## Installation

```bash
git clone https://github.com/Hanzz98/iqc-canvas.git
cd iqc-canvas
npm install
```

## Example Code

```javascript
const { generateIQC } = require("iqc-canvas");

const result = await generateIQC('Hello World', '00.00', {
  baterai: [true, "100"],
  operator: true,
  timebar: true,
  wifi: true
});

console.log(result)
```

## Output JSON

```
{
    success: true,
    image: <buffer>,
    mimeType: 'image/png',
    timestamp: 1767772355,
    message: 'Created by Hann Universe npm:iqc-canvas'
}
```