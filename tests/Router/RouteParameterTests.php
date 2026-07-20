<?php declare(strict_types = 1);

namespace Laswitchtech\CoreWeb\Router;

use PHPUnit\Framework\TestCase;
use Laswitchtech\CoreWeb\Router\Request\Web;

/**
 * Tests for the terminal catch-all route syntax and ordinary dynamic parameter regression.
 * Covers every spec-requirement: valid captures, coercion guards, invalid-pattern rejection,
 * method-not-allowed, and boundary cases.
 */
final class RouteParameterTests extends TestCase
{

    /* ─── Catch-all pass cases ──────────────────────────────────────── */

    public function test_catch_all_single_segment(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/files/{path...}', static function (Web $request): Response {
            return Response::text(get_debug_type($request->param('path')) . ':' . $request->param('path'));
        });

        $response = $router->dispatch(new Web('GET', '/files/card.js'));
        self::assertSame(200, $response->statusCode());
        self::assertSame('string:card.js', $response->body());
    }

    public function test_catch_all_two_segments(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/files/{path...}', static function (Web $request): Response {
            return Response::text(get_debug_type($request->param('path')) . ':' . $request->param('path'));
        });

        $response = $router->dispatch(new Web('GET', '/files/components/card.js'));
        self::assertSame(200, $response->statusCode());
        self::assertSame('string:components/card.js', $response->body());
    }

    public function test_catch_all_three_segments(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/files/{path...}', static function (Web $request): Response {
            return Response::text(get_debug_type($request->param('path')) . ':' . $request->param('path'));
        });

        $response = $router->dispatch(new Web('GET', '/files/components/forms/select.js'));
        self::assertSame(200, $response->statusCode());
        self::assertSame('string:components/forms/select.js', $response->body());
    }

    public function test_catch_all_numeric_segment(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/files/{path...}', static function (Web $request): Response {
            return Response::text(get_debug_type($request->param('path')) . ':' . $request->param('path'));
        });

        $response = $router->dispatch(new Web('GET', '/files/42'));
        self::assertSame(200, $response->statusCode());
        // The whole catch-all stays a string even when numerically coercible.
        self::assertSame('string:42', $response->body());
    }

    /* ─── Dynamic parameter before catch-all ────────────────────────── */

    public function test_dynamic_before_catch_all(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/plugins/{extension}/{file...}', static function (Web $request): Response {
            return Response::text(
                $request->param('extension') . '|' . $request->param('file')
            );
        });

        $response = $router->dispatch(new Web('GET', '/plugins/bootstrap/js/bootstrap.min.js'));
        self::assertSame(200, $response->statusCode());
        self::assertSame('bootstrap|js/bootstrap.min.js', $response->body());
    }

    /* ─── Ordinary parameter regression ─────────────────────────────── */

    public function test_ordinary_int_parameter_coerces_to_int(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/users/{id}', static function (Web $request): Response {
            return Response::text(get_debug_type($request->param('id')) . ':' . $request->param('id'));
        });

        $response = $router->dispatch(new Web('GET', '/users/42'));
        self::assertSame(200, $response->statusCode());
        self::assertSame('int:42', $response->body());
    }

    public function test_ordinary_float_parameter_coerces_to_float(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/items/{price}', static function (Web $request): Response {
            return Response::text(get_debug_type($request->param('price')) . ':' . $request->param('price'));
        });

        $response = $router->dispatch(new Web('GET', '/items/9.95'));
        self::assertSame(200, $response->statusCode());
        self::assertSame('float:9.95', $response->body());
    }

    public function test_ordinary_string_parameter_stays_string(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/users/{slug}', static function (Web $request): Response {
            return Response::text(get_debug_type($request->param('slug')) . ':' . $request->param('slug'));
        });

        $response = $router->dispatch(new Web('GET', '/users/alice'));
        self::assertSame(200, $response->statusCode());
        self::assertSame('string:alice', $response->body());
    }

    /* ─── Path rejection (existing catch-all route; no match) ───────── */

    public function test_catch_all_path_exact_match_rejects(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/files/{path...}', static function (Web $_req): Response {
            return Response::text('unexpected-route-hit');
        });

        // /files is not the catch-all prefix plus a segment; only "/" would match when path="/".
        $response = $router->dispatch(new Web('GET', '/files'));
        self::assertSame(404, $response->statusCode());
    }

    public function test_catch_all_trailing_slash_rejects(): void
    {
        $router = new Router(Router::MODE_WEB);
        $router->get('/files/{path...}', static function (Web $_req): Response {
            return Response::text('unexpected-route-hit');
        });

        $response = $router->dispatch(new Web('GET', '/files/'));
        self::assertSame(404, $response->statusCode());
    }

    /* ─── Invalid pattern rejection (must never match) ──────────────── */

    /** Helper: register an invalid-pattern route on a fresh Router and dispatch. Returns status. */
    private function dispatchInvalidPattern(string $pattern, string $requestPath): int
    {
        $router = new Router(Router::MODE_WEB);
        // Register the invalid pattern; it should cause matchParams to return null → 404.
        $router->get($pattern, static function (Web $_req): Response {
            return Response::text('unexpected-route-hit');
        });

        $response = $router->dispatch(new Web('GET', $requestPath));
        return $response->statusCode();
    }

    public function test_non_terminal_catch_all_pattern_rejected(): void
    {
        // /files/{path...}/edit — catch-all is not the final segment.
        $status = $this->dispatchInvalidPattern('/files/{path...}/edit', '/files/something/edit');
        self::assertSame(404, $status);
    }

    public function test_bare_brace_catch_all_pattern_rejected(): void
    {
        // /files/{...} — the inner part must be name..., not just ...
        $status = $this->dispatchInvalidPattern('/files/{...}', '/files/something');
        self::assertSame(404, $status);
    }

    public function test_double_dot_pattern_rejected(): void
    {
        // /files/{path..} — only exactly ... is valid.
        $status = $this->dispatchInvalidPattern('/files/{path..}', '/files/something');
        self::assertSame(404, $status);
    }

    public function test_suffix_after_brace_pattern_rejected(): void
    {
        // /files/{path...}suffix — text after the closing brace is invalid.
        $status = $this->dispatchInvalidPattern('/files/{path...}suffix', '/files/something');
        self::assertSame(404, $status);
    }

    /* ─── Method-not-allowed regression ─────────────────────────────── */

    public function test_catch_all_method_not_allowed(): void
    {
        $router = new Router(Router::MODE_WEB);
        // Register catch-all under POST only.
        $router->post('/files/{path...}', static function (Web $_req): Response {
            return Response::text('unexpected-route-hit');
        });

        // Dispatch GET — should get 405, not a spurious 200 or crash.
        $response = $router->dispatch(new Web('GET', '/files/components/card.js'));
        self::assertSame(405, $response->statusCode());
    }

    /* ─── Path boundaries ──────────────────────────────────────────── */

    public function test_catch_all_requires_postfix_segment(): void
    {
        // A catch-all route /files/{path...} needs ≥1 segment after "/files".
        $router = new Router(Router::MODE_WEB);
        $router->get('/files/{path...}', static function (Web $request): Response {
            return Response::text($request->param('path'));
        });

        // With one or more postfix segments — the catch-all fires and no leading slash is prepended.
        $responseWith  = $router->dispatch(new Web('GET', '/files/a/b'));
        self::assertSame(200, $responseWith->statusCode());
        self::assertSame('a/b', $responseWith->body());

        // A path that is only "/" does not satisfy a catch-all requiring ≥1 segments past "/files".
        $responseRoot = $router->dispatch(new Web('GET', '/'));
        self::assertSame(404, $responseRoot->statusCode());
    }

}
