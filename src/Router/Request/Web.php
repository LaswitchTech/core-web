<?php declare(strict_types=1);

namespace Laswitchtech\CoreWeb\Router\Request;

/**
 * Immutable HTTP request representation.
 * Documentation: docs/development/architecture/Router/Request.md
 *
 * Wraps $_SERVER / $_GET / $_POST so handlers receive a clean value object
 * rather than raw globals.
 */
final class Web
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

    /** @var array<string,mixed> */
    private readonly array $files;

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
        array  $files      = [],
    ) {
        $this->method        = strtoupper($method);
        $this->path          = rtrim('/' . ltrim($path, '/'), '/') ?: '/';
        $this->queryString   = $queryString;

        // Parse queryString into query array *only* when the caller did not
        // supply an explicit $_GET-like array (i.e. when using named-arg
        // construction in isolation rather than fromGlobals()).
        $this->query         = ($query === [] && $queryString !== '')
            ? self::parseQueryString($queryString)
            : $query;

        $this->params        = $params;
        $this->postBody      = $postBody;
        $this->files         = $files;
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
            query:           $_GET ?? [],
            params:          [],               // filled during dispatch
            postBody:        $_POST ?? [],
            files:           $_FILES ?? [],
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

    /** @return array<string,mixed> */
    public function files(): array
    {
        return $this->files;
    }

    /**
     * @return array{
     *     name:string,
     *     type:string,
     *     tmp_name:string,
     *     error:int,

     *     size:int
     * }|null
     */
    public function file(
        string $group,
        string $name,
    ): ?array {
        if (
            !isset($this->files[$group])
            || !is_array($this->files[$group])
        ) {
            return null;
        }

        $groupFiles = $this->files[$group];

        foreach (
            [
                'name',
                'type',
                'tmp_name',
                'error',
                'size',
            ] as $property
        ) {
            if (
                !isset($groupFiles[$property])
                || !is_array($groupFiles[$property])
                || !array_key_exists(
                    $name,

                    $groupFiles[$property],
                )
            ) {
                return null;
            }
        }

        return [
            'name' => (string) $groupFiles['name'][$name],
            'type' => (string) $groupFiles['type'][$name],
            'tmp_name' => (string) $groupFiles['tmp_name'][$name],
            'error' => (int) $groupFiles['error'][$name],
            'size' => (int) $groupFiles['size'][$name],
        ];
    }

    /** @return bool */
    public function hasUploadedFile(
        string $group,
        string $name,
    ): bool {
        $file = $this->file(
            $group,
            $name,
        );

        return $file !== null
            && $file['error'] === UPLOAD_ERR_OK;
    }

    /**
     * @return array{
     *     name:string,
     *     type:string,
     *     tmp_name:string,
     *     error:int,
     *     size:int
     * }|null
     */
    public function getUploadedFile(
        string $group,
        string $name,
    ): ?array {
        return $this->file($group, $name);
    }

    /* ─── Convenience accessors ────────────────────────────────────── */
    /** Shortcut for `$request->params()[$name]`. */
    public function param(string $name, mixed $default = null): mixed {
        return $this->params[$name] ?? $default;
    }

    /** Shortcut for `$request->query()[$name]`. */
    public function queryParam(string $name, mixed $default = null): mixed {
        return $this->query[$name] ?? $default;
    }

    /** Shortcut for `$request->post()[$name]`. */
    public function postParam(string $name, mixed $default = null): mixed {
        return $this->postBody[$name] ?? $default;
    }

    /** Raw query string without leading "?" */
    public function queryString(): string { return $this->queryString; }

    /* ─── Internal ─────────────────────────────────────────────────── */

    /** Parse a raw query string (without leading "?") into an associative array. */
    private static function parseQueryString(string $qs): array
    {
        $result = [];
        if ($qs === '') return $result;
        foreach (explode('&', $qs) as $pair) {
            if ($pair === '') continue;
            [$key, $value] = explode('=', $pair, 2) + ['', ''];
            $result[rawurldecode($key)] = rawurldecode($value);
        }
        return $result;
    }
}
