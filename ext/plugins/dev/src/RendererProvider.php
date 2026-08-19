<?php

declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Plugin\Dev;

use Laswitchtech\CoreWeb\Renderer\Registry;
use Laswitchtech\CoreWeb\Renderer\Resource\Entry;

final class RendererProvider
{
    public static function registerResources(array $context): void
    {
        if (
            !isset($context['registry'])
            || !($context['registry'] instanceof Registry)
        ) {
            return;
        }

        $pluginRoot = dirname(__DIR__);

        $context['registry']->add(
            'dev.preview',
            Entry::TYPE_VIEW,
            $pluginRoot . '/views/preview.php',
            Entry::PROVIDER_PLUGIN,
            0,
            [],
        );
    }
}
