# JSZip Plugin

First-party JSZip 3.x browser assets for client-side ZIP archive generation.

## What It Provides

Registers the JSZip minified build as a default asset.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `jszip.min.js` | JavaScript | `plugins/jszip` | Yes |

## Usage

JSZip is included automatically. Create and manipulate ZIP archives in
the browser:

```js
const zip = new JSZip();

// Add files
zip.file("hello.txt", "Hello from JSZip!");
zip.folder("images").file("logo.png", base64Data, { base64: true });

// Generate the archive
zip.generateAsync({ type: "blob" }).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "archive.zip";
    a.click();
    URL.revokeObjectURL(url);
});
```

This plugin is a dependency of the `datatables` plugin (used by the
HTML5 export button to generate `.xlsx` and `.csv` downloads).

## Dependencies

None.
