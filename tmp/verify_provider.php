<?php
require __DIR__ . '/../vendor/autoload.php';

new Laswitchtech\CoreWeb\Bootstrap('CLI');

$registry = new Laswitchtech\CoreWeb\Plugin\Administration\Settings\Registry();

Laswitchtech\CoreWeb\Plugin\Administration\SystemSettingsProvider::register([
    'registry' => $registry,
    'container' => Laswitchtech\CoreWeb\Bootstrap::container(),
    'mode' => 'web',
]);

$export = $registry->export();

echo json_encode(
    $export,
    JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES,
), PHP_EOL;

echo "COUNT=", count($export), PHP_EOL;
