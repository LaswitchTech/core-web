<?php declare(strict_types=1);
/**
 * Router smoke tests — requires zero dependencies.
 * Run:  php test/router_smoke.php
 */

require_once __DIR__ . '/../src/Router/Request.php';
require_once __DIR__ . '/../src/Router/Response.php';
require_once __DIR__ . '/../src/Router/Router.php';

use Laswitchtech\CoreWeb\Router\Request;
use Laswitchtech\CoreWeb\Router\Response;
use Laswitchtech\CoreWeb\Router\Router;

$passed = 0;
$failed = 0;

$assert = static function (string $label, bool $cond) use (&$passed, &$failed): void {
    if ($cond) {
        echo "  PASS: {$label}\n";
        $passed++;
    } else {
        echo "  FAIL: {$label}\n";
        $failed++;
    }
};

/* ════════════════════════════════════════════
 * Helper to build a Router and register routes
 * ════════════════════════════════════════════ */
$makeRouter = static function (): Router {
    $r = new Router();
    // Exact route at root
    $r->get('/', fn () => Response::html('root'));
    // Dynamic param route
    $r->get('/users/{id}', fn (Request $req) => Response::html((string) $req->param('id')));
    // Multi-param
    $r->get('/users/{uid}/posts/{slug}', fn (Request $req) => Response::html(
        "u={$req->param('uid')}s={$req->param('slug')}"
    ));
    // POST-only endpoint on same pattern as a GET route
    $r->post('/users/{id}', fn () => Response::html('created'));
    return $r;
};

/* ════════════════════════════════════════════
 * 1. Exact route — GET /
 * ════════════════════════════════════════════ */
echo "\n--- Exact route: GET / ---\n";
$router = $makeRouter();
$req    = new Request(method: 'GET', path: '/');
$res    = $router->dispatch($req);
$assert('status 200', $res->statusCode() === 200);
$assert('body "root"', $res->body() === 'root');

/* ════════════════════════════════════════════
 * 2. Parameter route — GET /users/42
 * ════════════════════════════════════════════ */
echo "\n--- Param route: GET /users/42 ---\n";
$router = $makeRouter();
$req    = new Request(method: 'GET', path: '/users/42');
$res    = $router->dispatch($req);
$assert('status 200', $res->statusCode() === 200);
$assert('body "42"',   $res->body() === '42');

/* ════════════════════════════════════════════
 * 3. Wrong method — POST /users/42 (only GET registered)
 * ════════════════════════════════════════════ */
echo "\n--- Wrong method: POST /users/42 ---\n";
$router = new Router();
$router->get('/users/{id}', fn () => Response::html('show'));
$req    = new Request(method: 'POST', path: '/users/42');
$res    = $router->dispatch($req);
$assert('status 405', $res->statusCode() === 405);

/* ════════════════════════════════════════════
 * 4. Unknown route — GET /does-not-exist
 * ════════════════════════════════════════════ */
echo "\n--- Unknown route: GET /does-not-exist ---\n";
$router = $makeRouter();
$req    = new Request(method: 'GET', path: '/does-not-exist');
$res    = $router->dispatch($req);
$assert('status 404', $res->statusCode() === 404);

/* ════════════════════════════════════════════
 * 5. Multi-param route ({uid}={slug} pattern)
 * ════════════════════════════════════════════ */
echo "\n--- Multi-param: GET /users/42/posts/hello-world ---\n";
$router = $makeRouter();
$req    = new Request(method: 'GET', path: '/users/42/posts/hello-world');
$res    = $router->dispatch($req);
$assert('status 200', $res->statusCode() === 200);
$assert('body correct', $res->body() === 'u=42s=hello-world');

/* ════════════════════════════════════════════
 * 6. Path must not partially match — /foo/users/42 ≠ /users/{id}
 * ════════════════════════════════════════════ */
echo "\n--- No partial match: GET /foo/users/42 ---\n";
$router = $makeRouter();
$req    = new Request(method: 'GET', path: '/foo/users/42');
$res    = $router->dispatch($req);
$assert('status 404 (no partial match)', $res->statusCode() === 404);

/* ════════════════════════════════════════════
 * 7. Query string preservation in Request
 * ════════════════════════════════════════════ */
echo "\n--- Query preservation: GET /search?q=hello ---\n";
$router = new Router();
$router->get('/search', function (Request $req) {
    return Response::html("q=" . $req->queryParam('q'));
});
$req    = new Request(method: 'GET', path: '/search', queryString: 'q=hello');
$res    = $router->dispatch($req);
$assert('body contains query', $res->body() === 'q=hello');

/* ════════════════════════════════════════════
 * 8. Request params are preserved on dispatch
 * ════════════════════════════════════════════ */
echo "\n--- Route param accessible via ->param() ---\n";
$router = $makeRouter();
$req    = new Request(method: 'GET', path: '/users/99');
$res    = $router->dispatch($req);
// The handler above returns the param as body; verify indirectly
$assert('body "99"', $res->body() === '99');

/* ════════════════════════════════════════════
 * 9. Root route does not match /anything
 * ════════════════════════════════════════════ */
echo "\n--- Root only: GET /anything ---\n";
$router = $makeRouter();
$req    = new Request(method: 'GET', path: '/anything');
$res    = $router->dispatch($req);
$assert('status 404', $res->statusCode() === 404);

/* ════════════════════════════════════════════
 * 10. POST on same pattern as GET — no route for POST only → should still be 404
 *      (when the method is not registered at all for that pattern).
 * ════════════════════════════════════════════ */
echo "\n--- POST on unregistered path (no 405 confusion) ---\n";
$router = new Router();
$router->get('/item/{id}', fn () => Response::html('show'));
$req    = new Request(method: 'POST', path: '/nonexistent/1');
$res    = $router->dispatch($req);
$assert('status 404 (not 405)', $res->statusCode() === 404);

/* ════════════════════════════════════════════
 * Summary
 * ════════════════════════════════════════════ */
echo "\n═══════════════════════════════════════════\n";
printf("Results: %d passed, %d failed\n", $passed, $failed);
if ($failed > 0) {
    exit(1);
}
echo "All smoke tests passed.\n";
