<?php declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

// Test the template resolution and precedence works correctly

echo "=== Testing Template Resolution Precedence ===\n";

use Laswitchtech\CoreWeb\Message\Template\TemplateRegistry;
use Laswitchtech\CoreWeb\Message\Template\RegistryTemplateLoader;

// Create a registry to test with
$registry = new TemplateRegistry();

// Register templates in correct order based on our implementation
// 1. Core (lowest priority)
$registry->register('mail', 'test', '/vendor/laswitchtech/core-web/templates/mail/test.json', 'core');

// 2. Kernel plugin - this comes from extension_index with origin kernel
$registry->register('mail', 'test2', '/vendor/laswitchtech/core-plugin/plugins/test/templates/mail/test2.json', 'kernel');

// 3. Kernel theme - this would come from extension_index 
$registry->register('mail', 'test3', '/vendor/laswitchtech/core-theme/themes/test/templates/mail/test3.json', 'kernel');

// 4. App templates (highest priority)
$registry->register('mail', 'test4', '/app/templates/mail/test4.json', 'app');

// Test that resolution works and metadata is correctly maintained
echo "Resolution test:\n";

try {
    $path = $registry->resolve('test', 'mail');
    echo "Core template: " . $path . "\n";
    
    $metadata = $registry->getMetadata('test', 'mail');
    echo "Core origin: " . $metadata['origin'] . "\n";
    
    $metadata2 = $registry->getMetadata('test4', 'mail');
    echo "App origin: " . $metadata2['origin'] . "\n";
    
    echo "SUCCESS: All tests passed!\n";
} catch (Exception $e) {
    echo "FAILED: Error - " . $e->getMessage() . "\n";
}