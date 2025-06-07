<?php
session_start();
require 'php/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = $_POST['usuario'];
    $password = $_POST['password'];
    
    try {
        $stmt = $conn->prepare("SELECT id, usuario, password, nombre, rol FROM empleados WHERE usuario = ?");
        $stmt->execute([$usuario]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($empleado && password_verify($password, $empleado['password'])) {
            $_SESSION['empleado_id'] = $empleado['id'];
            $_SESSION['empleado_nombre'] = $empleado['nombre'];
            $_SESSION['empleado_rol'] = $empleado['rol'];
            header('Location: dashboard.php');
            exit();
        } else {
            $error = "Usuario o contraseña incorrectos";
        }
    } catch (PDOException $e) {
        $error = "Error al conectar con la base de datos";
        error_log("Login error: " . $e->getMessage());
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <title>Login - Gestor de Estacionamiento</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>Iniciar Sesión</h1>
        <?php if (isset($error)): ?>
            <div class="alert alert-danger"><?= $error ?></div>
        <?php endif; ?>
        <form method="POST">
            <div class="form-group">
                <label for="usuario">Usuario:</label>
                <input type="text" id="usuario" name="usuario" required>
            </div>
            <div class="form-group">
                <label for="password">Contraseña:</label>
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Ingresar</button>
        </form>
    </div>
</body>
</html>