# SortableJS Plugin

First-party SortableJS 1.x drag-and-drop assets.

## What It Provides

Registers the SortableJS minified build as a default asset.

## Assets

| File | Type | Scope | Default |
|------|------|-------|---------|
| `sortable.min.js` | JavaScript | `plugins/sortablejs` | Yes |

## Usage

SortableJS is included automatically. Make any list or grid draggable:

```html
<ul id="myList" class="list-group">
    <li class="list-group-item">Item 1</li>
    <li class="list-group-item">Item 2</li>
    <li class="list-group-item">Item 3</li>
</ul>

<script>
new Sortable(document.getElementById('myList'), {
    animation: 150,
    onEnd: function (evt) {
        console.log('Moved from', evt.oldIndex, 'to', evt.newIndex);
    }
});
</script>
```

### Grid Layout

```html
<div id="grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
</div>

<script>
new Sortable(document.getElementById('grid'), {
    animation: 150
});
</script>
```

### Common Options

| Option | Type | Description |
|--------|------|-------------|
| `animation` | number | Transition duration in ms |
| `handle` | string | CSS selector for drag handle |
| `draggable` | string | CSS selector for draggable items |
| `group` | string/object | Allow cross-list dragging |
| `onEnd` | function | Callback after drag ends |
| `onSort` | function | Callback after reorder |

## Dependencies

None.
