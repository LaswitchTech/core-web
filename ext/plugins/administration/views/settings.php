<?php

declare(strict_types=1);
?>

<div
    id="admin-system-settings"
    class="admin-system-settings"
    data-settings-entries="<?= htmlspecialchars(
        json_encode(
            $settingsEntries ?? [],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES,
        ),
        ENT_QUOTES | ENT_SUBSTITUTE,
        'UTF-8',
    ) ?>"
></div>
