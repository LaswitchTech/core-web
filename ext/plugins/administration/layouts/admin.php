<?php

declare(strict_types=1);

$assetHelper = $helpers->resolve('asset');
$cssOutput = $assetHelper->css(
    \Laswitchtech\CoreWeb\Bootstrap::container(),
);
$jsOutput = $assetHelper->js(
    \Laswitchtech\CoreWeb\Bootstrap::container(),
);

echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administration</title>
' . $cssOutput . '
</head>
<body>
<div class="container-fluid">
    <div class="row">
        <nav class="col-sm-3 col-md-2 sidebar">
<ul class="nav flex-column">
<li class="nav-item"><a class="nav-link" href="/admin">Dashboard</a></li>
</ul>
</nav>
<main class="col-sm-9 ms-sm-10 p-4">';

echo isset($templateContent) && is_string($templateContent)
    ? $templateContent
    : '';

echo '
</main>
</div>
</div>
' . $jsOutput . '
</body>
</html>';