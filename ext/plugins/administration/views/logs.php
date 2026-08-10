<?php

declare(strict_types=1);

?>
<div
    id="admin-log-viewer"
    class="admin-log-viewer"
    data-log-endpoint="/admin/logs/data"
    data-log-channels="<?= htmlspecialchars(
        json_encode(
            $logChannels ?? [],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        ),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8',
    ) ?>"
    data-log-levels="<?= htmlspecialchars(
        json_encode(
            $logLevels ?? [],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        ),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8',
    ) ?>"
></div>
