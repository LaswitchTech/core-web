<?php
/**
 * Core-Web HTTP Entry Point
 *
 * Ultra-minimal bootstrapping — one line of actual code:
 *   1. Autoload Composer classes
 *   2. Bootstrap the application in "ROUTER" mode
 */

require_once __DIR__ . '/vendor/autoload.php';

new Laswitchtech\CoreWeb\Bootstrap('ROUTER');
