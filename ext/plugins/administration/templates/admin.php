<?php

declare(strict_types=1);

echo isset($viewContent) && is_string($viewContent)
    ? $viewContent
    : '';
