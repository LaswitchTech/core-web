# PDFMake Plugin

First-party pdfmake 0.2.x browser assets for client-side PDF generation.

## What It Provides

Registers the pdfmake minified build (default) and the VFS fonts bundle
(opt-in) as assets.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `pdfmake.min.js` | JavaScript | `plugins/pdfmake` | Yes |
| `vfs_fonts.js` | JavaScript | `plugins/pdfmake` | No |

## Usage

The core library is included automatically. The `vfs_fonts.js` file
provides the built-in font definitions (Roboto) and must be included
before generating any PDF:

```php
$assets->include('plugins/pdfmake/vfs_fonts.js');
```

Then create a PDF:

```js
const docDefinition = {
    content: [
        { text: "Hello World", style: "header" },
        { text: "This is a paragraph." },
        { table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
                ["Name", "Value"],
                ["Framework", "Core-Web"],
                ["Version", "1.0"]
            ]
        }}
    ],
    styles: {
        header: { fontSize: 22, bold: true, margin: [0, 0, 0, 10] }
    }
};

pdfMake.createPdf(docDefinition).download("report.pdf");
```

To open in a new tab instead of downloading:

```js
pdfMake.createPdf(docDefinition).open();
```

This plugin is a dependency of the `datatables` plugin (used by the
HTML5 export button for PDF export).

## Dependencies

None.
