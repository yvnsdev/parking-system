document.addEventListener('DOMContentLoaded', function () {
    // Variables
    let vehiculos = JSON.parse(localStorage.getItem('vehiculos')) || [];
    let configuracion = JSON.parse(localStorage.getItem('configuracion')) || {
        totalEspacios: 24,
        tarifaPorHora: 10
    };
    
    let totalEspacios = configuracion.totalEspacios;
    let tarifaPorHora = configuracion.tarifaPorHora;
    let espacioSeleccionado = null;

    generarMapaEstacionamiento();

    // Elementos del DOM
    const tabButtons = document.querySelectorAll('.sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');
    const formEntrada = document.getElementById('form-entrada');
    const formSalida = document.getElementById('form-salida');
    const buscarPlacaBtn = document.getElementById('buscar-placa');
    const placaSalidaInput = document.getElementById('placa-salida');
    const previewPago = document.getElementById('preview-pago');
    const tablaVehiculos = document.querySelector('#tabla-vehiculos tbody');
    const currentTimeDisplay = document.getElementById('current-time');

    // Elementos de estadísticas
    const vehiculosActivosEl = document.getElementById('vehiculos-activos');
    const ingresosHoyEl = document.getElementById('ingresos-hoy');
    const promedioTiempoEl = document.getElementById('promedio-tiempo');
    const pendientesPagoEl = document.getElementById('pendientes-pago');

    // Actualizar hora actual cada segundo
    function updateCurrentTime() {
        const now = new Date();
        currentTimeDisplay.textContent = now.toLocaleString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();

    // Agregar campo de espacio al formulario
    const espacioInput = document.createElement('div');
    espacioInput.className = 'form-group';
    espacioInput.innerHTML = `
        <label for="espacio"><i class="fas fa-map-marker-alt"></i> Espacio:</label>
        <input type="text" id="espacio" readonly>
    `;
    formEntrada.querySelector('.form-grid').appendChild(espacioInput);

    // Manejo de pestañas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Actualizar contenido según la pestaña
            if (tabId === 'vehiculos') {
                actualizarTablaVehiculos();
            } else if (tabId === 'reportes') {
                actualizarEstadisticas();
            } else if (tabId === 'configuracion') {
                cargarConfiguracion();
            }
        });
    });

    // Función para cargar configuración
    function cargarConfiguracion() {
        document.getElementById('total-espacios').value = configuracion.totalEspacios;
        document.getElementById('tarifa-hora').value = configuracion.tarifaPorHora;
    }

    // Registrar entrada de vehículo
    formEntrada.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!espacioSeleccionado) {
            showAlert('error', 'Por favor selecciona un espacio en el mapa');
            return;
        }

        const placa = document.getElementById('placa').value.toUpperCase();
        const marca = document.getElementById('marca').value;
        const modelo = document.getElementById('modelo').value;
        const color = document.getElementById('color').value;
        const conductor = document.getElementById('conductor').value;
        const horaEntrada = new Date();

        // Verificar si ya existe un vehículo con la misma placa estacionado
        const vehiculoExistente = vehiculos.find(v => v.placa === placa && v.estado === 'estacionado');
        if (vehiculoExistente) {
            showAlert('error', `Ya hay un vehículo con placa ${placa} estacionado.`);
            return;
        }

        // Verificar si el espacio ya está ocupado
        const espacioOcupado = vehiculos.find(v => v.espacio === espacioSeleccionado && v.estado === 'estacionado');
        if (espacioOcupado) {
            showAlert('error', `El espacio ${espacioSeleccionado} ya está ocupado.`);
            return;
        }

        const vehiculo = {
            placa,
            marca,
            modelo,
            color,
            conductor,
            espacio: espacioSeleccionado,
            horaEntrada: horaEntrada.getTime(),
            estado: 'estacionado'
        };

        vehiculos.push(vehiculo);
        guardarEnLocalStorage();

        showAlert('success', `Vehículo con placa ${placa} registrado en espacio ${espacioSeleccionado}.`);
        formEntrada.reset();
        espacioSeleccionado = null;
        generarMapaEstacionamiento();
        actualizarEstadisticas();
    });

    // Generar mapa de estacionamiento
    function generarMapaEstacionamiento() {
        const parkingMap = document.getElementById('parking-map');
        parkingMap.innerHTML = '';

        // Obtener las placas de los vehículos estacionados
        const vehiculosEstacionados = vehiculos.filter(v => v.estado === 'estacionado');
        const espaciosOcupados = vehiculosEstacionados.map(v => v.espacio);

        for (let i = 1; i <= totalEspacios; i++) {
            const espacio = document.createElement('div');
            espacio.className = 'parking-space';
            espacio.dataset.espacio = i;

            // Verificar si el espacio está ocupado
            const ocupado = espaciosOcupados.includes(i);
            if (ocupado) {
                espacio.classList.add('occupied');
                const vehiculo = vehiculosEstacionados.find(v => v.espacio === i);
                espacio.innerHTML = `
                <span class="parking-space-number">${i}</span>
                <span class="parking-space-car"><i class="fas fa-car"></i></span>
                <span class="parking-space-placa">${vehiculo.placa}</span>
            `;
            } else {
                espacio.innerHTML = `
                <span class="parking-space-number">${i}</span>
                <span class="parking-space-car"><i class="fas fa-car"></i></span>
            `;
            }

            // Solo permitir seleccionar espacios disponibles
            if (!ocupado) {
                espacio.addEventListener('click', function () {
                    // Deseleccionar el espacio anterior
                    if (espacioSeleccionado) {
                        document.querySelector(`.parking-space[data-espacio="${espacioSeleccionado}"]`)
                            .classList.remove('selected');
                    }

                    // Seleccionar el nuevo espacio
                    espacioSeleccionado = i;
                    this.classList.add('selected');

                    // Mostrar el espacio seleccionado en el formulario
                    document.getElementById('espacio').value = i;
                });
            }

            parkingMap.appendChild(espacio);
        }
    }

    // Buscar vehículo para salida
    buscarPlacaBtn.addEventListener('click', function () {
        const placa = placaSalidaInput.value.toUpperCase();
        const vehiculo = vehiculos.find(v => v.placa === placa && v.estado === 'estacionado');

        if (!vehiculo) {
            showAlert('error', 'No se encontró un vehículo estacionado con esa placa.');
            previewPago.classList.add('hidden');
            return;
        }

        // Calcular previsualización de pago
        const horaSalida = new Date();
        const horaEntrada = new Date(vehiculo.horaEntrada);
        const tiempoEstacionadoMs = horaSalida.getTime() - horaEntrada.getTime();
        const tiempoEstacionadoHoras = tiempoEstacionadoMs / (1000 * 60 * 60);
        const totalPagar = Math.ceil(tiempoEstacionadoHoras) * tarifaPorHora;

        // Mostrar previsualización
        document.getElementById('preview-hora-entrada').textContent = horaEntrada.toLocaleTimeString();
        document.getElementById('preview-hora-salida').textContent = horaSalida.toLocaleTimeString();
        document.getElementById('preview-tiempo').textContent = `${tiempoEstacionadoHoras.toFixed(2)} horas`;
        document.getElementById('preview-total').textContent = `$${totalPagar.toFixed(2)}`;

        previewPago.classList.remove('hidden');
    });

    // Registrar salida de vehículo
    formSalida.addEventListener('submit', function (e) {
        e.preventDefault();

        const placa = placaSalidaInput.value.toUpperCase();
        const pagado = document.getElementById('pagado').value;
        const vehiculoIndex = vehiculos.findIndex(v => v.placa === placa && v.estado === 'estacionado');

        if (vehiculoIndex === -1) {
            showAlert('error', 'No se encontró un vehículo estacionado con esa placa.');
            return;
        }

        const horaSalida = new Date();
        const horaEntrada = new Date(vehiculos[vehiculoIndex].horaEntrada);
        const tiempoEstacionadoMs = horaSalida.getTime() - horaEntrada.getTime();
        const tiempoEstacionadoHoras = tiempoEstacionadoMs / (1000 * 60 * 60);
        const totalPagar = Math.ceil(tiempoEstacionadoHoras) * tarifaPorHora;

        // Actualizar vehículo
        vehiculos[vehiculoIndex].horaSalida = horaSalida.getTime();
        vehiculos[vehiculoIndex].tiempoEstacionadoHoras = tiempoEstacionadoHoras;
        vehiculos[vehiculoIndex].totalPagar = totalPagar;
        vehiculos[vehiculoIndex].pagado = pagado === 'si';
        vehiculos[vehiculoIndex].estado = 'salio';

        guardarEnLocalStorage();

        showAlert('success', `Salida registrada para placa ${placa}. Total: $${totalPagar.toFixed(2)}`);
        formSalida.reset();
        previewPago.classList.add('hidden');
        actualizarTablaVehiculos();
        actualizarEstadisticas();
        generarMapaEstacionamiento();
    });

    // Función para actualizar la tabla de vehículos
    function actualizarTablaVehiculos() {
        tablaVehiculos.innerHTML = '';

        const vehiculosEstacionados = vehiculos.filter(v => v.estado === 'estacionado');

        if (vehiculosEstacionados.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" style="text-align: center;">No hay vehículos estacionados</td>`;
            tablaVehiculos.appendChild(row);
            return;
        }

        vehiculosEstacionados.forEach(vehiculo => {
            const row = document.createElement('tr');
            const horaEntrada = new Date(vehiculo.horaEntrada);

            row.innerHTML = `
                <td>${vehiculo.placa}</td>
                <td>${vehiculo.marca}</td>
                <td>${vehiculo.modelo}</td>
                <td>${vehiculo.color}</td>
                <td>${vehiculo.conductor}</td>
                <td>${horaEntrada.toLocaleTimeString()}</td>
                <td><span class="badge badge-success">Estacionado</span></td>
            `;

            tablaVehiculos.appendChild(row);
        });
    }

    // Función para actualizar estadísticas
    function actualizarEstadisticas() {
        // Vehículos activos
        const vehiculosActivos = vehiculos.filter(v => v.estado === 'estacionado').length;
        vehiculosActivosEl.textContent = vehiculosActivos;

        // Ingresos hoy
        const hoy = new Date().setHours(0, 0, 0, 0);
        const ingresosHoy = vehiculos
            .filter(v => v.estado === 'salio' && new Date(v.horaSalida) >= hoy && v.pagado)
            .reduce((sum, v) => sum + v.totalPagar, 0);
        ingresosHoyEl.textContent = `$${ingresosHoy.toFixed(2)}`;

        // Tiempo promedio
        const tiempos = vehiculos
            .filter(v => v.estado === 'salio')
            .map(v => v.tiempoEstacionadoHoras);
        const promedio = tiempos.length > 0 ?
            (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(2) : 0;
        promedioTiempoEl.textContent = `${promedio}h`;

        // Pagos pendientes
        const pendientes = vehiculos
            .filter(v => v.estado === 'salio' && !v.pagado).length;
        pendientesPagoEl.textContent = pendientes;
    }

    // Mostrar notificación
    function showAlert(type, message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;

        document.body.appendChild(alert);

        setTimeout(() => {
            alert.classList.add('show');
        }, 10);

        alert.querySelector('.close-btn').addEventListener('click', () => {
            alert.classList.remove('show');
            setTimeout(() => {
                alert.remove();
            }, 300);
        });

        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    }

    // Guardar en localStorage
    function guardarEnLocalStorage() {
        localStorage.setItem('vehiculos', JSON.stringify(vehiculos));
        localStorage.setItem('configuracion', JSON.stringify(configuracion));
    }

    // Manejo de eliminación de datos
    document.getElementById('btn-eliminar').addEventListener('click', function() {
        const tipo = document.getElementById('tipo-eliminacion').value;
        
        if (tipo === 'todo') {
            if (confirm('¿Está seguro que desea eliminar TODOS los registros? Esta acción no se puede deshacer.')) {
                vehiculos = [];
                localStorage.setItem('vehiculos', JSON.stringify(vehiculos));
                showAlert('success', 'Todos los registros han sido eliminados');
                actualizarTablaVehiculos();
                generarMapaEstacionamiento();
                actualizarEstadisticas();
            }
        } else if (tipo === 'salidos') {
            vehiculos = vehiculos.filter(v => v.estado === 'estacionado');
            localStorage.setItem('vehiculos', JSON.stringify(vehiculos));
            showAlert('success', 'Registros de vehículos salidos eliminados');
            actualizarTablaVehiculos();
            generarMapaEstacionamiento();
            actualizarEstadisticas();
        } else if (tipo === 'antiguos') {
            const limite = new Date();
            limite.setDate(limite.getDate() - 30);
            vehiculos = vehiculos.filter(v => {
                if (v.estado === 'estacionado') return true;
                const fechaSalida = new Date(v.horaSalida);
                return fechaSalida > limite;
            });
            localStorage.setItem('vehiculos', JSON.stringify(vehiculos));
            showAlert('success', 'Registros antiguos eliminados');
            actualizarTablaVehiculos();
            generarMapaEstacionamiento();
            actualizarEstadisticas();
        }
    });

    // Configuración de espacios
    document.getElementById('btn-guardar-espacios').addEventListener('click', function() {
        const nuevosEspacios = parseInt(document.getElementById('total-espacios').value);
        
        if (nuevosEspacios < 1) {
            showAlert('error', 'El número de espacios debe ser al menos 1');
            return;
        }
        
        // Verificar que no haya más vehículos estacionados que el nuevo total
        const vehiculosEstacionados = vehiculos.filter(v => v.estado === 'estacionado').length;
        if (vehiculosEstacionados > nuevosEspacios) {
            showAlert('error', `No puede reducir a ${nuevosEspacios} espacios porque hay ${vehiculosEstacionados} vehículos estacionados`);
            return;
        }
        
        configuracion.totalEspacios = nuevosEspacios;
        totalEspacios = nuevosEspacios;
        localStorage.setItem('configuracion', JSON.stringify(configuracion));
        showAlert('success', `Configuración guardada: ${nuevosEspacios} espacios totales`);
        generarMapaEstacionamiento();
    });

    // Configuración de tarifa
    document.getElementById('btn-guardar-tarifa').addEventListener('click', function() {
        const nuevaTarifa = parseFloat(document.getElementById('tarifa-hora').value);
        
        if (nuevaTarifa <= 0) {
            showAlert('error', 'La tarifa debe ser mayor que 0');
            return;
        }
        
        configuracion.tarifaPorHora = nuevaTarifa;
        tarifaPorHora = nuevaTarifa;
        localStorage.setItem('configuracion', JSON.stringify(configuracion));
        showAlert('success', `Tarifa actualizada: $${nuevaTarifa} por hora`);
    });

    // Inicializar
    if (document.querySelector('.sidebar li.active')) {
        const activeTab = document.querySelector('.sidebar li.active').getAttribute('data-tab');
        document.getElementById(activeTab).classList.add('active');

        if (activeTab === 'vehiculos') {
            actualizarTablaVehiculos();
        } else if (activeTab === 'reportes') {
            actualizarEstadisticas();
        } else if (activeTab === 'configuracion') {
            cargarConfiguracion();
        }
    }

    // Añadir estilos dinámicos para las alertas
    const style = document.createElement('style');
    style.textContent = `
        .alert {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.35rem;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 300px;
            box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.2);
            transform: translateX(150%);
            transition: transform 0.3s ease-out;
            z-index: 1000;
        }
        
        .alert.show {
            transform: translateX(0);
        }
        
        .alert-success {
            background-color: var(--success);
        }
        
        .alert-error {
            background-color: var(--danger);
        }
        
        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0 0.5rem;
        }
        
        .badge {
            display: inline-block;
            padding: 0.35em 0.65em;
            font-size: 0.75em;
            font-weight: 700;
            line-height: 1;
            color: #fff;
            text-align: center;
            white-space: nowrap;
            vertical-align: baseline;
            border-radius: 0.25rem;
        }
        
        .badge-success {
            background-color: var(--success);
        }
    `;
    document.head.appendChild(style);
});