<?php
session_start();
require 'php/config.php';

if (!isset($_SESSION['empleado_id'])) {
    header('Location: login.php');
    exit();
}

$id_registro = $_GET['id'] ?? null;

if ($id_registro) {
    // Verificar si está pagado
    $stmt = $conn->prepare("SELECT pagado FROM registros WHERE id = ?");
    $stmt->bind_param("i", $id_registro);
    $stmt->execute();
    $result = $stmt->get_result();
    $registro = $result->fetch_assoc();
    
    if ($registro && $registro['pagado']) {
        // Registrar salida
        $hora_salida = date('Y-m-d H:i:s');
        $stmt = $conn->prepare("UPDATE registros SET hora_salida = ? WHERE id = ?");
        $stmt->bind_param("si", $hora_salida, $id_registro);
        $stmt->execute();
        
        header('Location: dashboard.php?msg=salida_ok');
        exit();
    } else {
        header('Location: pago.php?id=' . $id_registro . '&error=no_pagado');
        exit();
    }
}

header('Location: dashboard.php');
exit();
?>