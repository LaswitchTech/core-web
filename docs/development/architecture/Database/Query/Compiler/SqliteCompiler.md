# SqliteCompiler

## Metadata

- **File:** `src/Database/Query/Compiler/SqliteCompiler.php`
- **Namespace:** `Laswitchtech\CoreWeb\Database\Query\Compiler`
- **Implements:** `CompilerInterface`

## Purpose

Compiles query intent into SQLite-specific SQL using double-quote identifier quoting and positional `?` placeholders.

## Identifier Quoting

Uses double quotes (`"`) to wrap all identifiers per the SQL standard that SQLite follows:

| Input | Compiled |
|-------|----------|
| `users` | `"users"` |
| `users.id` | `"users"."id"` |
| `name` | `"name"` |
| `*` | `*` (unquoted) |

## Placeholder Style

All bound values use positional placeholders:

```sql
SELECT * FROM "users" WHERE "id" = ? AND "active" = ?
```

## Boolean Casting

SQLite does not have a native boolean type — it stores booleans as INTEGER (0 or 1). `SqliteCompiler` casts all `bool` parameters to `(int)` before adding them to the params array:

```php
// PHP: where('active', true) → SQL: WHERE "active" = ? → param: 1
// PHP: where('archived', false) → SQL: WHERE "archived" = ? → param: 0
```

## Feature Support

| Feature | Status | Notes |
|---------|--------|-------|
| SELECT * | ✅ | Unquoted `*` literal. |
| Explicit columns | ✅ | Each column quoted individually. |
| FROM | ✅ | Table name always double-quoted. |
| WHERE (AND/OR) | ✅ | All operators from WhereClause supported. |
| IN clause | ✅ | Array values expanded to multiple `?` placeholders. |
| IS NULL / IS NOT NULL | ✅ | No parameters bound; literal SQL appended. |
| INNER JOIN | ✅ | Column-to-column only (JoinClause). |
| LEFT JOIN | ✅ | Same as INNER JOIN, different keyword. |
| ORDER BY | ✅ | Supports multiple columns via Builder. |
| LIMIT | ✅ | Non-negative integer literal appended directly to SQL. |
| OFFSET | ✅ | Non-negative integer, including 0; integer literal appended to SQL. |

## Operators

Join ON conditions accept six comparison operators, validated by `JoinClause`:

````text
=  !=  <  >  <=  >=
````

## Deferred Features

| Feature | Status | Notes |
|---------|--------|-------|
| RIGHT JOIN | ❌ deferred | Not yet implemented; reserved for post-V1.0. |

## SQL Output Examples

### Simple query

```php
$db->select('users')->where(['id' => 1])
```

```sql
SELECT * FROM "users" WHERE "id" = ?
```

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

```sql
SELECT "id", "name" FROM "users" INNER JOIN "orders" ON "users"."id" = "orders"."user_id" WHERE "active" = ? ORDER BY "name" ASC LIMIT 10 OFFSET 20
```

Params: `[1]` (boolean `true` cast to integer `1`)

### OR conditions

```php
$db->select('users')->where(['status' => 'approved'])->orWhere('status', 'pending')
```

```sql
SELECT * FROM "users" WHERE "status" = ? OR "status" = ?
```

Params: `['approved', 'pending']`

### INSERT (compileInsert)

```php
$db->insert('users', ['name' => 'Alice', 'active' => true])->execute();
```

```sql
INSERT INTO "users" ("name", "active") VALUES (?, ?)
```

Params: `['Alice', 1]` — boolean `true` cast to `(int)` `1`. Param order follows `$data` key insertion order.

### UPDATE (compileUpdate)

```php
$db->update('users', ['status' => 'inactive'])
    ->where(['id' => 5])
    ->orWhere('archived', true)
    ->execute();
```

````sql
UPDATE "users" SET "status" = ? WHERE "id" = ? OR "archived" = ?
````

Params: `['inactive', 5, 1]` — **SET values appear before WHERE values** in the params array (index 0 is SET param; indices 1–2 are WHERE params). Boolean `true` cast to `(int)` `1`.

### DELETE (compileDelete)

```php
$db->delete('users')->where(['id' => 1])->execute();
```

````sql
DELETE FROM "users" WHERE "id" = ?
````

Params: `[1]` — WHERE params follow clause-addition order.
