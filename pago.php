<?php
session_start();
require 'php/config.php';
require 'php/db_operations.php';

if (!isset($_SESSION['empleado_id'])) {
    header('Location: login.php');
    exit();
}

$id_registro = $_GET['id'] ?? null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $id_registro) {
    $monto = $_POST['monto'];
    $metodo = $_POST['metodo'];
    $empleado_id = $_SESSION['empleado_id'];
    
    $stmt = $conn->prepare("UPDATE registros SET pagado = TRUE, monto = ?, metodo_pago = ?, empleado_id = ? WHERE id = ?");
    $stmt->bind_param("dsii", $monto, $metodo, $empleado_id, $id_registro);
    $stmt->execute();
    
    header('Location: dashboard.php');
    exit();
}

// Obtener información del vehículo
$stmt = $conn->prepare("SELECT r.id, v.placa, v.tipo, c.nombre, r.hora_entrada 
                       FROM registros r
                       JOIN vehiculos v ON r.vehiculo_id = v.id
                       JOIN clientes c ON v.cliente_id = c.id
                       WHERE r.id = ? AND r.hora_salida IS NULL");
$stmt->bind_param("i", $id_registro);
$stmt->execute();
$result = $stmt->get_result();
$registro = $result->fetch_assoc();

// Calcular tiempo y monto
if ($registro) {
    $entrada = new DateTime($registro['hora_entrada']);
    $ahora = new DateTime();
    $intervalo = $ahora->diff($entrada);
    
    $horas = $intervalo->h + ($intervalo->days * 24);
    $minutos = $intervalo->i;
    
    // Tarifas (puedes cambiarlas)
    $tarifas = [
        'auto' => ['primera_hora' => 20, 'horas_extra' => 15],
        'moto' => ['primera_hora' => 10, 'horas_extra' => 8],
        'camion' => ['primera_hora' => 30, 'horas_extra' => 25]
    ];
    
    $tipo = $registro['tipo'];
    $monto_calculado = $tarifas[$tipo]['primera_hora'];
    
    if ($horas > 1) {
        $monto_calculado += ($horas - 1) * $tarifas[$tipo]['horas_extra'];
    }
    
    // Cobrar por fracción de hora (15 minutos)
    if ($minutos > 15 && $horas == 0) {
        $monto_calculado = $tarifas[$tipo]['primera_hora'];
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <title>Registrar Pago</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>Registrar Pago</h1>
        
        <?php if ($registro): ?>
        <div class="info-vehiculo">
            <p><strong>Placa:</strong> <?= $registro['placa'] ?></p>
            <p><strong>Tipo:</strong> <?= ucfirst($registro['tipo']) ?></p>
            <p><strong>Cliente:</strong> <?= $registro['nombre'] ?></p>
            <p><strong>Hora de entrada:</strong> <?= $registro['hora_entrada'] ?></p>
            <p><strong>Tiempo estacionado:</strong> <?= $horas ?> horas y <?= $minutos ?> minutos</p>
            <p><strong>Monto a cobrar:</strong> $<?= number_format($monto_calculado, 2) ?></p>
        </div>
        
        <form method="POST">
            <input type="hidden" name="monto" value="<?= $monto_calculado ?>">
            
            <div class="form-group">
                <label for="metodo">Método de Pago:</label>
                <select id="metodo" name="metodo" required>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                </select>
            </div>
            
            <button type="submit">Confirmar Pago</button>
            <a href="dashboard.php" class="btn btn-secondary">Cancelar</a>
        </form>
        <?php else: ?>
            <p class="alert alert-danger">Registro no encontrado o vehículo ya retirado</p>
            <a href="dashboard.php" class="btn">Volver al dashboard</a>
        <?php endif; ?>
    </div>
</body>
</html>