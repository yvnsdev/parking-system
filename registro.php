<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registro de Vehículo</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <h1>Registro de Entrada</h1>
        <form id="registroForm">
            <div class="form-group">
                <label for="nombre">Nombre del Cliente:</label>
                <input type="text" id="nombre" name="nombre" required>
            </div>
            
            <div class="form-group">
                <label for="placa">Placa del Vehículo:</label>
                <input type="text" id="placa" name="placa" required>
            </div>
            
            <div class="form-group">
                <label for="tipo">Tipo de Vehículo:</label>
                <select id="tipo" name="tipo" required>
                    <option value="auto">Auto</option>
                    <option value="moto">Moto</option>
                    <option value="camion">Camión</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="telefono">Teléfono:</label>
                <input type="tel" id="telefono" name="telefono">
            </div>
            
            <button type="submit">Registrar Entrada</button>
        </form>
    </div>

    <script src="js/main.js"></script>
</body>
</html>