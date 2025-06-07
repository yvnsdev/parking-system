<?php
require 'config.php';

// Registrar nuevo vehículo (adaptado para PostgreSQL)
function registrarVehiculo($datos) {
    global $conn;
    
    try {
        // Iniciar transacción
        $conn->beginTransaction();
        
        // Insertar cliente
        $stmt = $conn->prepare("INSERT INTO clientes (nombre, telefono) VALUES (?, ?) RETURNING id");
        $stmt->execute([$datos['nombre'], $datos['telefono']]);
        $cliente_id = $stmt->fetchColumn();
        
        // Insertar vehículo
        $stmt = $conn->prepare("INSERT INTO vehiculos (cliente_id, placa, tipo) VALUES (?, ?, ?) RETURNING id");
        $stmt->execute([$cliente_id, $datos['placa'], $datos['tipo']]);
        $vehiculo_id = $stmt->fetchColumn();
        
        // Insertar registro
        $hora_entrada = date('Y-m-d H:i:s');
        $stmt = $conn->prepare("INSERT INTO registros (vehiculo_id, hora_entrada) VALUES (?, ?)");
        $stmt->execute([$vehiculo_id, $hora_entrada]);
        
        // Confirmar transacción
        $conn->commit();
        return true;
    } catch (PDOException $e) {
        $conn->rollBack();
        error_log("Error en registrarVehiculo: " . $e->getMessage());
        return false;
    }
}

// Obtener vehículos estacionados (adaptado para PostgreSQL)
function obtenerVehiculosEstacionados() {
    global $conn;
    
    try {
        $query = "SELECT r.id, c.nombre, v.placa, v.tipo, r.hora_entrada 
                 FROM registros r
                 JOIN vehiculos v ON r.vehiculo_id = v.id
                 JOIN clientes c ON v.cliente_id = c.id
                 WHERE r.hora_salida IS NULL";
        
        $stmt = $conn->query($query);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error en obtenerVehiculosEstacionados: " . $e->getMessage());
        return [];
    }
}
?>