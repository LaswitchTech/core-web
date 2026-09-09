<?php

declare(strict_types=1);

?>
<div
    id="admin-overview-customization-controls"
    class="admin-overview-customization-controls"
></div>

<div
    id="admin-overview-widgets"
    class="admin-overview-widgets"
    data-overview-order-endpoint="/admin/overview/order"
    data-overview-entries="<?= htmlspecialchars(
        json_encode(
            $overviewEntries ?? [],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        ),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8',
    ) ?>"
></div>
