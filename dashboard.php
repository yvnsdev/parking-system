<?php
session_start();
require 'php/config.php';
require 'php/db_operations.php';

if (!isset($_SESSION['empleado_id'])) {
    header('Location: login.php');
    exit();
}

$vehiculos = obtenerVehiculosEstacionados();
$mensaje = $_GET['msg'] ?? null;
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - Gestor de Estacionamiento</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>Vehículos Estacionados</h1>

        <?php if ($mensaje === 'salida_ok'): ?>
            <div class="alert alert-success">Vehículo retirado correctamente</div>
        <?php endif; ?>

        <div class="header-actions">
            <span>Bienvenido, <?= $_SESSION['empleado_nombre'] ?></span>
            <a href="logout.php" class="btn btn-danger">Cerrar Sesión</a>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Placa</th>
                    <th>Tipo</th>
                    <th>Hora Entrada</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($vehiculos as $vehiculo): ?>
                <tr>
                    <td><?= $vehiculo['id'] ?></td>
                    <td><?= htmlspecialchars($vehiculo['nombre']) ?></td>
                    <td><?= htmlspecialchars($vehiculo['placa']) ?></td>
                    <td><?= htmlspecialchars($vehiculo['tipo']) ?></td>
                    <td><?= $vehiculo['hora_entrada'] ?></td>
                    <td>
                        <a href="pago.php?id=<?= $vehiculo['id'] ?>" class="btn">Registrar Pago</a>
                        <a href="salida.php?id=<?= $vehiculo['id'] ?>" class="btn btn-danger">Registrar Salida</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>