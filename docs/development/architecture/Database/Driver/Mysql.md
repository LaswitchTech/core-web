# MySQL/MariaDB Driver

Class: `Laswitchtech\CoreWeb\Database\Driver\Mysql`

## Purpose

PDO-based MySQL/MariaDB driver for shared and server deployments where a database server is running externally rather than file-based SQLite used for zero-config local development.

## Contract

Implements `DriverInterface::connect(array $config): \Laswitchtech\CoreWeb\Database\Connection`.

The factory method receives a configuration array, validates the environment, resolves the DSN string, constructs a `PDO` instance with safety options, and returns a thin `Connection` wrapper. No additional database capabilities (query builder, migrations, ORM) are provided — raw SQL via `Connection::query()` and `Connection::prepare()` remain available after this step.

## Configuration Keys

| key            | type              | default       | required               | notes                                          |
| -------------- | ----------------- | ------------- | ---------------------- | ------------------------------------------------ |
| host           | string            | `127.0.0.1`   | no                     | MySQL/MariaDB server hostname                    |
| port           | int               | `3306`        | no                     | Server port                                      |
| database       | string            | `` (empty)    | yes, unless `dsn` given| Target schema/schema name; must be non-empty     |
| charset        | string            | `utf8mb4`     | no                     | Connection character set                         |
| username       | string            | `` (empty)    | no                     | Authentication username                          |
| password       | string            | `` (empty)    | no                     | Authentication password                          |
| dsn            | string `\| null`  | `null`        | no                     | If non-empty, used verbatim as the PDO DSN       |

## DSN Behavior

### With a provided DSN override

If `config['dsn']` is a non-empty string, it is used **verbatim** as the PDO DSN; all other MySQL host/port/database/charset keys are retained but ignored for DSN construction.

```
php cli core.db.connect mysql --dsn_override="mysql:host=localhost;port=3307;dbname=mydb;charset=utf8mb4"
```

### With an empty-string DSN

If `config['dsn']` is explicitly present but an empty string, a `DatabaseException` is thrown:

```
MySQL DSN must not be empty.
```

### Without a DSN (default path)

When `dsn` is not provided in the config array, the driver builds the DSN from individual keys:

```
mysql:host={host};port={port};dbname={database};charset={charset}
```

In this mode, `database` **must** be a non-empty string; otherwise a `DatabaseException` is thrown:

```
MySQL database name must not be empty unless a DSN is provided.
```

## MariaDB Support

The driver name `mariadb` is accepted as an alias for `mysql` in the `database.driver` config key. Both values (`"mysql"` and `"mariadb"`) map to `Mysql` because MariaDB uses the MySQL protocol and `PDO::MYSQL_ATTR_*` options are fully compatible.

MariaDB can also be used by supplying a DSN override with a `mysql://` or `mariadb://` prefix — PDO accepts both transparently.

## Validation Order

1. **Extension check** — `pdo_mysql` extension must be loaded; otherwise throws `DatabaseException('The PDO MySQL extension (pdo_mysql) is not loaded.')`.
2. **Empty DSN** — If `dsn` key is present but empty string, throws `DatabaseException('MySQL DSN must not be empty.')`.
3. **Missing database** — If no DSN is provided and `database` is empty or missing, throws `DatabaseException('MySQL database name must not be empty unless a DSN is provided.')`.

## PDO Options

```php
PDO::ATTR_ERRMODE             => PDO::ERRMODE_EXCEPTION,
PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
PDO::ATTR_EMULATE_PREPARES    => false,
PDO::ATTR_PERSISTENT          => false,
```

- ERRMODE_EXCEPTION — all database errors are thrown as `PDOException`.
- FETCH_ASSOC — all result rows are associative arrays.
- EMULATE_PREPARES => false — uses native prepared statements for correct type binding and SQL injection protection.
- PERSISTENT => false — no persistent connections; each Connection instance creates a new PDO link.

## Error Handling

| Condition                               | Exception message pattern                          |
| --------------------------------------- | -------------------------------------------------- |
| `pdo_mysql` not loaded                  | The PDO MySQL extension (pdo_mysql) is not loaded. |
| Empty-string DSN provided               | MySQL DSN must not be empty.                       |
| No DSN and empty database name          | MySQL database name must not be empty unless a DSN is provided. |
| PDO::construct() fails                   | PDO MySQL connection failed: {original_message}    |

PDOException from `new PDO()` is wrapped in `DatabaseException` with the original `PDOException` set as the previous exception. The wrapper allows callers to catch all database errors via `use Throwable` or `use DatabaseException`.

## Out of Scope — Phase 2A

The following are explicitly **not** included in this driver implementation and are deferred:

- Query Builder (SELECT / INSERT / UPDATE / DELETE composition)
- JOIN support (INNER, LEFT, RIGHT — even though MySQL and MariaDB support them)
- Schema migrations or DDL helpers
- Object-Relational Mapping (ORM) or model classes
- Admin UI for database configuration
- TLS/SSL connections (MYSQL_ATTR_SSL_CA, MYSQL_ATTR_SSL_VERIFY_SERVER_CERT, etc.)
- Transaction helper wrappers (`transaction($callback)`, `inTransaction()`) — raw PDO `beginTransaction()`, `commit()`, and `rollBack()` pass through via `Connection`
- Connection pooling or persistent connection support
- `MYSQL_ATTR_INIT_COMMAND` (SET NAMES / custom initialization statements)
- Collation configuration (charset is configurable; collation always defaults to `{charset}_general_ci` at the engine level, not in this driver)

These capabilities are tracked as separate KANBAN tasks.

## Example Usage

### SQLite (default)

```json
{
    "database": {
        "driver": "sqlite",
        "path": "data/app.db"
    }
}
```

### MySQL via individual config keys

```json
{
    "database": {
        "driver": "mysql",
        "host": "10.0.1.50",
        "port": 3306,
        "database": "myapp_production",
        "charset": "utf8mb4",
        "username": "myapp_user",
        "password": "secret_password"
    }
}
```

### MariaDB alias

Same as MySQL but with `"driver": "mariadb"` — maps to `new Mysql()` identically.

### DSN override (full control)

```json
{
    "database": {
        "driver": "mysql",
        "dsn": "mysql:host=db.internal;port=3307;dbname=myapp;charset=utf8mb4"
    }
}
```
