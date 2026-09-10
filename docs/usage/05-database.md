# Database

Core-Web ships a thin database facade over PDO with a fluent query builder.
SQLite is the zero-setup default; MySQL/MariaDB is a config switch.

## Getting the Database

```php
$c = \Laswitchtech\CoreWeb\Bootstrap::container();

$db = $c->resolve('database');       // Database facade (recommended)
$conn = $c->resolve('db_connection'); // raw Connection (thin PDO wrapper)
```

## Drivers

Configured in the `database` section (see [Configuration](02-configuration.md)):

```json
{ "database": { "driver": "sqlite", "path": "data/app.db" } }
```

or

```json
{
    "database": {
        "driver": "mysql",
        "host": "127.0.0.1",
        "port": 3306,
        "database": "myapp",
        "username": "app",
        "password": "secret",
        "charset": "utf8mb4"
    }
}
```

An explicit `dsn` key, when present, overrides the individual MySQL keys.

## The Query Builder

### SELECT

```php
$rows = $db->select('users')->all();

$row = $db->select('users', ['id', 'name', 'email'])
          ->where('id', '=', 42)
          ->fetch();                 // ?array — null when no row

$paged = $db->select('posts')
            ->where('published', '=', 1)
            ->orderBy('created_at', 'DESC')
            ->limit(20)
            ->offset(40)
            ->all();
```

`where()` accepts two forms:

```php
->where('age', '>=', 18)            // column, operator, value
->where(['a' => 1, 'b' => 2])       // shorthand: column => value (AND)
```

`orWhere()` chains with OR instead of AND.

### Joins

```php
$posts = $db->select('posts', ['id', 'title', 'author'])
            ->join('users', 'posts.user_id', '=', 'users.id')
            ->orderBy('posts.created_at', 'DESC')
            ->all();

// LEFT JOIN:
->leftJoin('comments', 'posts.id', '=', 'comments.post_id')
```

### INSERT / UPDATE / DELETE

```php
// execute() returns the number of affected rows.
$db->insert('users', ['name' => 'Ada', 'email' => 'ada@example.com'])->execute();

$db->update('users', ['name' => 'Ada L.'])
   ->where('id', '=', 1)
   ->execute();

$db->delete('users')
   ->where('id', '=', 1)
   ->execute();
```

## Transactions

```php
$db->transaction(function ($db) {
    $db->insert('orders', ['user_id' => 1, 'total' => 99])->execute();
    $db->update('inventory', ['qty' => 40])
       ->where('sku', '=', 'SKU-1')
       ->execute();

    // Any thrown exception rolls back the whole transaction:
    // throw new \RuntimeException('rollback');
});
```

The callback receives the same facade. Any exception rolls back; returning
commits and returns the callback's value. `$db->inTransaction()` reports
whether you're inside one (for nested transaction handling).

## Raw PDO

When the builder isn't enough, drop down to PDO directly:

```php
$stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute(['ada@example.com']);
$user = $stmt->fetch(\PDO::FETCH_ASSOC);

$db->query('SELECT 1');
$pdo = $db->pdo(); // the underlying PDO instance
```

## Conventions

- Table names: `snake_case`, plural (`users`, `order_items`).
- SQLite file location defaults to `data/app.db`; the directory is created
  on first write.
- All builder queries use PDO prepared statements — pass values, never
  interpolate them into SQL.

## Migration Support

Schema changes are managed with migration files — see
[Migrations & Seeding](06-migrations-and-seeding.md).
