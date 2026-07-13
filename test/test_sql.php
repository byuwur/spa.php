<?php
require_once "../_var.php";
require_once "{$TO_HOME}/_functions.php";

$_ENV["APP_ENV"] = "DEV";
$assertions = 0;

/**
 * Counts an assertion and stops the test when its condition is false.
 * @param bool $condition Condition that must be true.
 * @param string $message Failure message.
 * @param string|null $passed Optional success message. Defaults to the failure message.
 * @return void
 * @throws RuntimeException When the assertion fails.
 */
function sql_test_assert(bool $condition, string $message, ?string $passed = null): void
{
  global $assertions;
  $assertions++;
  if (!$condition)
    throw new RuntimeException($message);
  echo "[PASS] " . ($passed ?? $message) . PHP_EOL;
  echo "<br>";
}

/**
 * Executes a callback and verifies the class and optional code of its exception.
 * @param callable $callback Code expected to throw.
 * @param string $class Expected exception class.
 * @param int|null $code Optional expected exception code.
 * @return Throwable The captured exception.
 * @throws RuntimeException When no exception is thrown or it does not match.
 */
function sql_test_throws(callable $callback, string $class, ?int $code = null): Throwable
{
  try {
    $callback();
  } catch (Throwable $error) {
    sql_test_assert(
      $error instanceof $class,
      "Expected {$class}, got " . get_class($error) . ".",
      "Thrown exception matches {$class}."
    );
    if ($code !== null)
      sql_test_assert(
        $error->getCode() === $code,
        "Expected error code {$code}, got {$error->getCode()}.",
        "Thrown exception keeps error code {$code}."
      );
    return $error;
  }
  throw new RuntimeException("Expected {$class} to be thrown.");
}

/**
 * Minimal mysqli_result replacement used to test SELECT queries without MySQL.
 */
class SqlTestResult
{
  public int $num_rows;
  private array $rows;

  /**
   * Stores rows in the order fetch_assoc() must return them.
   * @param array $rows Rows returned by the fake result.
   */
  public function __construct(array $rows)
  {
    $this->rows = array_values($rows);
    $this->num_rows = count($rows);
  }

  /**
   * Returns and removes the next result row.
   * @return array|null The next row, or null when exhausted.
   */
  public function fetch_assoc(): ?array
  {
    return count($this->rows) ? array_shift($this->rows) : null;
  }
}

/**
 * Minimal mysqli_stmt replacement used to inspect bindings and control results.
 * Each behavior may define return, affected, insert_id, or a Throwable in throw.
 */
class SqlTestStatement
{
  public int $affected_rows = 0;
  public int $insert_id = 0;
  public bool $closed = false;
  public array $bound = [];
  public int $executions = 0;
  private array $behaviors;
  private $result;

  /**
   * Configures sequential execute() behaviors and an optional SELECT result.
   * @param array $behaviors Results consumed by consecutive execute() calls.
   * @param mixed $result Value returned by get_result().
   */
  public function __construct(array $behaviors = [], $result = false)
  {
    $this->behaviors = array_values($behaviors);
    $this->result = $result;
  }

  /**
   * Records parameter types and values for binding-order assertions.
   * @param string $types MySQLi parameter type string.
   * @param mixed ...$values Values bound by reference.
   * @return bool Always true in the fake statement.
   */
  public function bind_param(string $types, &...$values): bool
  {
    $this->bound[] = ["types" => $types, "values" => array_values($values)];
    return true;
  }

  /**
   * Applies the next configured behavior as one statement execution.
   * @return bool Configured execution result, true by default.
   * @throws Throwable When the behavior contains a throw value.
   */
  public function execute(): bool
  {
    $this->executions++;
    $behavior = array_shift($this->behaviors) ?? [];
    if (($behavior["throw"] ?? null) instanceof Throwable)
      throw $behavior["throw"];
    $this->affected_rows = (int) ($behavior["affected"] ?? 0);
    $this->insert_id = (int) ($behavior["insert_id"] ?? 0);
    return (bool) ($behavior["return"] ?? true);
  }

  /**
   * Returns the configured SELECT result.
   * @return mixed Fake result or false.
   */
  public function get_result()
  {
    return $this->result;
  }

  /**
   * Marks the statement as closed for cleanup assertions.
   * @return void
   */
  public function close(): void
  {
    $this->closed = true;
  }
}

/**
 * Minimal mysqli replacement that returns one controlled test statement.
 */
class SqlTestConnection
{
  public int $errno = 0;
  public string $error = "";
  public array $queries = [];
  public SqlTestStatement $statement;

  /**
   * @param SqlTestStatement $statement Statement returned by prepare().
   */
  public function __construct(SqlTestStatement $statement)
  {
    $this->statement = $statement;
  }

  /**
   * Records the SQL text and returns the configured statement.
   * @param string $query SQL prepared by the executor.
   * @return SqlTestStatement Configured fake statement.
   */
  public function prepare(string $query): SqlTestStatement
  {
    $this->queries[] = $query;
    return $this->statement;
  }
}

// Shared schema and rows used by the builder and executor tests.
$valid = [
  "id" => ["column" => "ID", "type" => "i"],
  "name" => ["column" => "NAME", "type" => "s"],
  "score" => ["column" => "SCORE", "type" => "i"]
];
$rows = [
  ["name" => "First", "id" => 1],
  ["name" => "Second", "id" => 2]
];

// Built-query execution preserves builder field order and batch metadata.
$create = build_sql_query("c", "", "test", ["name", "id"], [], "", $valid, $rows, [], [], ["strict" => true]);
sql_test_assert(!$create->error, "Strict INSERT should build.");
sql_test_assert($create->query === "INSERT INTO test (ID, NAME) VALUES (?, ?)", "INSERT fields should follow the valid map order.");
sql_test_assert($create->field_keys === ["id", "name"], "Built queries should retain API field keys.");
sql_test_assert($create->param_types === "is", "INSERT parameter types should match field order.");

$statement = new SqlTestStatement([
  ["affected" => 1, "insert_id" => 10],
  ["affected" => 1, "insert_id" => 11]
]);

$created = execute_sql_query(new SqlTestConnection($statement), $create, ["throw" => true]);
sql_test_assert($created->successes === 2 && $created->affected_rows === 2, "Batch INSERT metadata should be complete.");
sql_test_assert($created->insert_ids === [10, 11] && $created->insert_id === 11, "Batch INSERT IDs should be returned.");
sql_test_assert($statement->bound[0]["values"] === [1, "First"], "INSERT values should use built field order.");
sql_test_assert($statement->closed, "Successful statements should close.");

// The original seven-argument execution signature remains compatible.
$statement = new SqlTestStatement([
  ["affected" => 1, "insert_id" => 20],
  ["affected" => 1, "insert_id" => 21]
]);
$legacy_created = execute_sql_query(new SqlTestConnection($statement), $create->query, $create->param_types, $create->param_values, ["name", "id"], $rows, $valid);
sql_test_assert(!$legacy_created->error && $legacy_created->successes === 2, "The legacy execution signature should remain supported.");
sql_test_assert($statement->bound[0]["values"] === [1, "First"], "Legacy execution should follow the builder field order.");

// UPDATE endings, binding order, and configurable no-op behavior.
$update = build_sql_query("U", "", "test", ["name"], ["id" => 7], " LIMIT 1 ", $valid, [["name" => "Same"]], [], [], ["strict" => true]);
sql_test_assert($update->query === "UPDATE test SET NAME = ? WHERE ID = ? LIMIT 1", "UPDATE endings should be appended.");
sql_test_assert($update->param_types === "si", "UPDATE field and condition types should stay ordered.");
$statement = new SqlTestStatement([["affected" => 0]]);
$updated = execute_sql_query(new SqlTestConnection($statement), $update, ["throw" => true, "allow_noop" => true]);
sql_test_assert(!$updated->error && $updated->affected === 0, "Allowed no-op updates should succeed.");
sql_test_assert($statement->bound[0]["values"] === ["Same", 7], "UPDATE values should bind fields before conditions.");

$statement = new SqlTestStatement([["affected" => 0]]);
$legacy_noop = execute_sql_query(new SqlTestConnection($statement), $update);
sql_test_assert($legacy_noop->error && $legacy_noop->errno === 999, "Legacy no-op behavior should remain available by default.");

// Strict mode blocks full-table mutations unless explicitly allowed.
$unsafe = build_sql_query("U", "", "test", ["name"], [], "", $valid, [["name" => "Unsafe"]], [], [], ["strict" => true]);
sql_test_assert($unsafe->error && $unsafe->query === "", "Strict mode should reject unscoped updates.");
$allowed = build_sql_query("U", "", "test", ["name"], [], "", $valid, [["name" => "Allowed"]], [], [], ["strict" => true, "allow_full_table" => true]);
sql_test_assert(!$allowed->error && $allowed->query === "UPDATE test SET NAME = ?", "Full-table mutations should require explicit permission.");

// Condition edge cases must produce valid SQL or an explicit build error.
$empty_in = build_sql_query("R", "*", "test", [], ["ids" => []], "", ["ids" => ["column" => "ID", "type" => "i", "condition" => "in"]], [], [], [], ["strict" => true]);
sql_test_assert($empty_in->query === "SELECT * FROM test WHERE 0 = 1", "Empty IN conditions should be valid and match nothing.");
$operator = build_sql_query("R", "*", "test", [], ["score" => 10], "", ["score" => ["column" => "SCORE", "type" => "i", "condition" => ">="]], [], [], [], ["strict" => true]);
sql_test_assert($operator->query === "SELECT * FROM test WHERE SCORE >= ?", "Symbolic comparison operators should be preserved.");
$symmetric = build_sql_query("R", "*", "test", [], ["score_from" => 9, "score_to" => 2], "", ["score" => ["column" => "SCORE", "type" => "i", "condition" => "symmetric"]], [], [], [], ["strict" => true]);
sql_test_assert($symmetric->param_types === "iiii" && $symmetric->param_values === [9, 2, 9, 2], "Symmetric ranges should bind a valid MySQL expression.");
$invalid_range = build_sql_query("R", "*", "test", [], ["score" => 9], "", ["score" => ["column" => "SCORE", "type" => "i", "condition" => "between"]], [], [], [], ["strict" => true]);
sql_test_assert($invalid_range->error, "Strict ranges should reject missing boundaries.");

// Strict mode rejects inconsistent batches and unknown condition fields.
$inconsistent = build_sql_query("C", "", "test", ["id", "name"], [], "", $valid, [["id" => 1, "name" => "One"], ["id" => 2]], [], [], ["strict" => true]);
sql_test_assert($inconsistent->error, "Strict batches should reject inconsistent rows instead of dropping columns.");
$unknown_condition = build_sql_query("R", "*", "test", [], ["tenant_typo" => 1], "", $valid, [], [], [], ["strict" => true]);
sql_test_assert($unknown_condition->error, "Strict mode should reject ignored condition fields.");

// Empty SELECT results are configurable while preserving legacy behavior.
$statement = new SqlTestStatement([], new SqlTestResult([]));
$empty_read = execute_sql_query(new SqlTestConnection($statement), "SELECT * FROM test", ["allow_empty" => true]);
sql_test_assert(!$empty_read->error && $empty_read->rows === 0 && $empty_read->data === [], "Empty reads should be optionally successful.");
$statement = new SqlTestStatement([], new SqlTestResult([]));
$legacy_empty = execute_sql_query(new SqlTestConnection($statement), "SELECT * FROM test");
sql_test_assert($legacy_empty->error, "Legacy empty-read behavior should remain available by default.");

// Thrown database errors retain their code and still close the statement.
$statement = new SqlTestStatement([["throw" => new RuntimeException("Duplicate", 1062)]]);
$connection = new SqlTestConnection($statement);
sql_test_throws(fn() => execute_sql_query($connection, $create, ["throw" => true]), RuntimeException::class, 1062);
sql_test_assert($statement->closed, "Throwing statements should close before the exception leaves.");

// Multiple UPDATE rows fail before any query can mutate the database.
$multiple_updates = build_sql_query("U", "", "test", ["name"], ["id" => 1], "", $valid, [["name" => "One"], ["name" => "Two"]], [], [], ["strict" => true]);
$statement = new SqlTestStatement();
sql_test_throws(fn() => execute_sql_query(new SqlTestConnection($statement), $multiple_updates, ["throw" => true]), InvalidArgumentException::class);
sql_test_assert($statement->executions === 0 && $statement->closed, "Multiple UPDATE rows should fail before execution.");

echo "SQL helper tests passed ({$assertions})." . PHP_EOL;
