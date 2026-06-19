<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Router;

/**
 * Immutable HTTP request representation.
 * Documentation: docs/development/architecture/Router/Request.md
 *
 * Wraps $_SERVER / $_GET / $_POST so handlers receive a clean value object
 * rather than raw globals.
 */
final class Request
{
    private readonly string $method;
    private readonly string $path;
    private readonly string $queryString;
    /** @var array<string, mixed> */
    private readonly array $query;
    /** @var array<string, mixed> */
    private readonly array $params;
    /** @var array<string, mixed> */
    private readonly array $postBody;

    /* ─── Construction ──────────────────────────────────────────────── */

    /**
     * @param  string   $method       Normalised HTTP method (GET, POST, …)
     * @param  string   $path         URL path without query (e.g. /users/42)
     * @param  string   $queryString  Raw query string without leading "?"
     * @param  array    $query        $_GET data
     * @param  array    $params       Route path parameters (filled during dispatch)
     * @param  array    $postBody     $_POST / parsed form body
     */
    public function __construct(
        string $method,
        string $path,
        string $queryString = '',
        array  $query      = [],
        array  $params     = [],
        array  $postBody   = [],
    ) {
        $this->method        = strtoupper($method);
        $this->path          = rtrim('/' . ltrim($path, '/'), '/') ?: '/';
        $this->queryString   = $queryString;
        $this->query         = $query + $_GET;
        $this->params        = $params;
        $this->postBody      = $postBody + $_POST;
    }

    /* ─── Required entry point ─────────────────────────────────────── */

    /** Create a Request from current ($_SERVER, $_GET, $_POST) state. */
    public static function fromGlobals(): self
    {
        $method   = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri      = $_SERVER['REQUEST_URI'] ?? '/';

        // Split query string from the path.
        $queryString  = '';
        $path         = $uri;
        if (str_contains($uri, '?')) {
            [$path, $queryString] = explode('?', $uri, 2);
        }

        // Normalise: single leading slash, strip trailing slash.
        $path       = rtrim('/' . ltrim($path, '/'), '/') ?: '/';

        return new self(
            method:          $method,
            path:            $path,
            queryString:     $queryString,
            query:           [],               // merge handled in __construct
            params:          [],               // filled during dispatch
            postBody:        [],               // merge handled in __construct
        );
    }

    /* ─── Required public API ──────────────────────────────────────── */

    /** URL path segment (/users/42). */
    public function path(): string { return $this->path; }

    /** Normalised HTTP method (GET / POST / PUT / DELETE / PATCH). */
    public function method(): string { return $this->method; }

    /** Query-string parameters ($_GET, merged with constructor arg). */
    public function query(): array { return $this->query; }

    /** GET/POST/PUT… helper shorthands. */
    public function isGet():     bool { return $this->method === 'GET'; }
    public function isPost():    bool { return $this->method === 'POST'; }
    public function isPut():     bool { return $this->method === 'PUT'; }
    public function isDelete():  bool { return $this->method === 'DELETE'; }
    public function isPatch():   bool { return $this->method === 'PATCH'; }

    /** Route path parameters filled by the dispatcher (e.g. ['id' => 42]). */
    public function params(): array { return $this->params; }

    /** GET / POST body parameters ($_GET, $_POST merged with constructor args). */
    public function post(): array { return $this->postBody; }
}

