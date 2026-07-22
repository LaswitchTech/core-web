<?php

declare(strict_types=1);

?>
<div
    id="admin-overview-widgets"
    class="admin-overview-widgets"
    data-overview-widgets="<?= htmlspecialchars(
        json_encode(
            $overviewWidgets ?? [],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        ),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8',
    ) ?>"
></div>
