# MysqlCompiler

## Metadata

- **File:** `src/Database/Query/Compiler/MysqlCompiler.php`
- **Namespace:** `Laswitchtech\CoreWeb\Database\Query\Compiler`
- **Implements:** `CompilerInterface`

## Purpose

Compiles query intent into MySQL / MariaDB-specific SQL using backtick identifier quoting and positional `?` placeholders.

MySQL and MariaDB share the same compiler because they use identical SELECT syntax for the features covered in Phase 1D (no dialect-specific differences in quoting, placeholder style, or paging).

## Identifier Quoting

Uses backticks (\`) to wrap all identifiers per MySQL convention:

| Input | Compiled |
|-------|----------|
| `users` | `` `users` `` |
| `users.id` | `` `users`.`id` `` |
| `name` | `` `name` `` |
| `*` | `*` (unquoted) |

## Placeholder Style

All bound values use positional placeholders:

```sql
SELECT * FROM `users` WHERE `id` = ? AND `active` = ?
```

Both MySQL and MariaDB support positional `?` bound parameters via PDO.

## Boolean Casting

MySQL/MariaDB stores booleans as TINYINT(1). `MysqlCompiler` casts all `bool` parameters to `(int)` before adding them to the params array — identical behavior to SqliteCompiler:

```php
// PHP: where('active', true) → SQL: WHERE `active` = ? → param: 1
// PHP: where('archived', false) → SQL: WHERE `archived` = ? → param: 0
```

## Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| SELECT * | ✅ | Unquoted `*` literal. |
| Explicit columns | ✅ | Each column quoted individually with backticks. |
| FROM | ✅ | Table name always backtick-quoted. |
| WHERE (AND/OR) | ✅ | All operators from WhereClause supported. |
| IN clause | ✅ | Array values expanded to multiple `?` placeholders. |
| IS NULL / IS NOT NULL | ✅ | No parameters bound; literal SQL appended. |
| INNER JOIN | ✅ | Column-to-column only (JoinClause). |
| LEFT JOIN | ✅ | Same as INNER JOIN, different keyword. |
| ORDER BY | ✅ | Supports multiple columns via Builder. |
| LIMIT | ✅ | Non-negative integer literal appended directly to SQL. |
| OFFSET | ✅ | Non-negative integer, including 0; integer literal appended to SQL. |

## SQL Output Examples

### Simple query

```php
$db->select('users')->where(['id' => 1])
```

````sql
SELECT * FROM `users` WHERE `id` = ?
````

Params: `[1]`

### Join with ordering and paging

```php
$db->select('users', ['id', 'name'])
   ->join('orders', 'users.id', '=', 'orders.user_id')
   ->where(['active' => true])
   ->orderBy('name')
   ->limit(10)
   ->offset(20)
```

````sql
SELECT `id`, `name` FROM `users` INNER JOIN `orders` ON `users`.`id` = `orders`.`user_id` WHERE `active` = ? ORDER BY `name` ASC LIMIT 10 OFFSET 20
````

Params: `[1]` (boolean `true` cast to integer `1`)

### OR conditions

```php
$db->select('users')->where(['status' => 'approved'])->orWhere('status', 'pending')
```

````sql
SELECT * FROM `users` WHERE `status` = ? OR `status` = ?
````

Params: `['approved', 'pending']`

## Shared with MariaDB

The same compiler file handles both MySQL and MariaDB drivers. No separate MariaDBCompiler is needed because the Phase 1D feature set produces identical SQL on both platforms. If a dialect-specific difference emerges in later phases (e.g., `REGEXP` vs `RLIKE`, different `LIMIT/OFFSET` syntax), the compilers can diverge.
