<?php
// Configuración para Supabase
define('DB_HOST', 'db.wcvqfkavoqmkwyhxzesr.supabase.co');
define('DB_PORT', '5432');
define('DB_USER', 'postgres');
define('DB_PASS', 'S1yX6P12trAgc75f');
define('DB_NAME', 'postgres');

$dsn = "pgsql:host=".DB_HOST.";port=".DB_PORT.";dbname=".DB_NAME;
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::PGSQL_ATTR_SSL_MODE => PDO::PGSQL_SSL_MODE_REQUIRE
];

try {
    $conn = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}