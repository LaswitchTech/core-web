# DataTables Plugin

First-party DataTables 2.x assets with Bootstrap 5 integration, including
Responsive, Select, and Buttons extensions.

## What It Provides

Registers the full DataTables suite: core, Bootstrap 5 styling,
Responsive, Select, Buttons (with ColVis, HTML5 export, and Print),
ColumnControl, RowGroup, Scroller, and StateRestore extensions.

## Assets

All assets use scope `plugins/datatables`.

### Core

| File | Type | Default |
|------|------|---------|
| `datatables.min.js` | JavaScript | Yes |
| `datatables.bootstrap5.min.js` | JavaScript | No |
| `datatables.bootstrap5.min.css` | CSS | Yes |

### Responsive

| File | Type | Default |
|------|------|---------|
| `datatables.responsive.min.js` | JavaScript | No |
| `responsive.bootstrap5.min.js` | JavaScript | No |
| `responsive.bootstrap5.min.css` | CSS | No |

### Select

| File | Type | Default |
|------|------|---------|
| `datatables.select.min.js` | JavaScript | No |
| `select.bootstrap5.min.js` | JavaScript | No |
| `select.bootstrap5.min.css` | CSS | No |

### Buttons

| File | Type | Default |
|------|------|---------|
| `dataTables.buttons.min.js` | JavaScript | No |
| `buttons.bootstrap5.min.js` | JavaScript | No |
| `buttons.bootstrap5.min.css` | CSS | No |
| `buttons.colVis.min.js` | JavaScript | No |
| `buttons.html5.min.js` | JavaScript | No |
| `buttons.print.min.js` | JavaScript | No |

### ColumnControl

| File | Type | Default |
|------|------|---------|
| `dataTables.columnControl.min.js` | JavaScript | No |
| `columnControl.bootstrap5.min.js` | JavaScript | No |
| `columnControl.bootstrap5.min.css` | CSS | No |

### RowGroup

| File | Type | Default |
|------|------|---------|
| `dataTables.rowGroup.min.js` | JavaScript | No |
| `rowGroup.bootstrap5.min.js` | JavaScript | No |
| `rowGroup.bootstrap5.min.css` | CSS | No |

### Scroller

| File | Type | Default |
|------|------|---------|
| `dataTables.scroller.min.js` | JavaScript | No |
| `scroller.bootstrap5.min.js` | JavaScript | No |
| `scroller.bootstrap5.min.css` | CSS | No |

### StateRestore

| File | Type | Default |
|------|------|---------|
| `dataTables.stateRestore.min.js` | JavaScript | No |
| `stateRestore.bootstrap5.min.js` | JavaScript | No |
| `stateRestore.bootstrap5.min.css` | CSS | No |

## Usage

The core JS and Bootstrap 5 CSS are included automatically. Add a
`<table>` with the `table` class and initialize:

```html
<table id="myTable" class="table">
    <thead>
        <tr><th>Name</th><th>Email</th><th>Role</th></tr>
    </thead>
    <tbody>
        <tr><td>Alice</td><td>alice@example.com</td><td>Admin</td></tr>
        <tr><td>Bob</td><td>bob@example.com</td><td>Editor</td></tr>
    </tbody>
</table>

<script>
$(function() {
    $('#myTable').DataTable();
});
</script>
```

### With Responsive

Include the responsive assets, then enable the option:

```php
$assets->include('plugins/datatables/datatables.responsive.min.js');
$assets->include('plugins/datatables/responsive.bootstrap5.min.js');
$assets->include('plugins/datatables/responsive.bootstrap5.min.css');
```

```js
$('#myTable').DataTable({ responsive: true });
```

### With Buttons (Export / Print)

```php
$assets->include('plugins/datatables/dataTables.buttons.min.js');
$assets->include('plugins/datatables/buttons.bootstrap5.min.js');
$assets->include('plugins/datatables/buttons.bootstrap5.min.css');
$assets->include('plugins/datatables/buttons.colVis.min.js');
$assets->include('plugins/datatables/buttons.html5.min.js');
$assets->include('plugins/datatables/buttons.print.min.js');
```

> **Note:** The HTML5 export button requires JSZip and PDFMake, which are
> registered by the `jszip` and `pdfmake` plugins (both dependencies of
> this plugin).

```js
$('#myTable').DataTable({
    dom: 'Bfrtip',
    buttons: ['copy', 'csv', 'excel', 'pdf', 'print', 'colvis']
});
```

### With Select

```php
$assets->include('plugins/datatables/datatables.select.min.js');
$assets->include('plugins/datatables/select.bootstrap5.min.js');
$assets->include('plugins/datatables/select.bootstrap5.min.css');
```

```js
$('#myTable').DataTable({ select: true });
```

## Dependencies

- `jquery`
- `bootstrap`
- `jszip` (for HTML5 export)
- `pdfmake` (for PDF export)
