document.addEventListener('DOMContentLoaded', async function () {
    // Configuración de Supabase
    const supabaseUrl = 'https://wcvqfkavoqmkwyhxzesr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdnFma2F2b3Fta3d5aHh6ZXNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNTk0ODEsImV4cCI6MjA2NDgzNTQ4MX0.1R8fc9-3IFXIGVWjfwcy-fyRaAsy76PUCPG8-Nsw_8g';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Variables
    let vehiculos = [];
    let configuracion = {
        totalEspacios: 24,
        tarifaPorHora: 10
    };
    
    let totalEspacios = configuracion.totalEspacios;
    let tarifaPorHora = configuracion.tarifaPorHora;
    let espacioSeleccionado = null;

    // Cargar datos iniciales
    await cargarDatosIniciales();
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

    // Función para cargar datos iniciales desde Supabase
    async function cargarDatosIniciales() {
        try {
            // Cargar vehículos
            const { data: vehiculosData, error: vehiculosError } = await supabase
                .from('vehiculos')
                .select('*');
            
            if (!vehiculosError) {
                vehiculos = vehiculosData || [];
            } else {
                console.error('Error cargando vehículos:', vehiculosError);
                showAlert('error', 'Error al cargar los vehículos');
            }
            
            // Cargar configuración
            const { data: configData, error: configError } = await supabase
                .from('configuracion')
                .select('*')
                .single();
            
            if (!configError && configData) {
                configuracion = configData;
                totalEspacios = configuracion.total_espacios || 24;
                tarifaPorHora = configuracion.tarifa_por_hora || 10;
            } else {
                console.error('Error cargando configuración:', configError);
                // Crear configuración inicial si no existe
                await crearConfiguracionInicial();
            }
        } catch (error) {
            console.error('Error inicial:', error);
            showAlert('error', 'Error al cargar los datos iniciales');
        }
    }
    
    // Función para crear configuración inicial
    async function crearConfiguracionInicial() {
        const { data, error } = await supabase
            .from('configuracion')
            .insert([
                { 
                    total_espacios: 24, 
                    tarifa_por_hora: 10 
                }
            ])
            .select()
            .single();
            
        if (!error && data) {
            configuracion = data;
            totalEspacios = configuracion.total_espacios;
            tarifaPorHora = configuracion.tarifa_por_hora;
        } else {
            console.error('Error creando configuración:', error);
        }
    }

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
        document.getElementById('total-espacios').value = configuracion.total_espacios;
        document.getElementById('tarifa-hora').value = configuracion.tarifa_por_hora;
    }

    // Registrar entrada de vehículo
    formEntrada.addEventListener('submit', async function (e) {
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

        try {
            // Verificar si ya existe un vehículo con la misma placa estacionado
            const { data: vehiculoExistente, error: existenteError } = await supabase
                .from('vehiculos')
                .select('*')
                .eq('placa', placa)
                .eq('estado', 'estacionado')
                .maybeSingle();
            
            if (vehiculoExistente) {
                showAlert('error', `Ya hay un vehículo con placa ${placa} estacionado.`);
                return;
            }

            // Verificar si el espacio ya está ocupado
            const { data: espacioOcupado, error: espacioError } = await supabase
                .from('vehiculos')
                .select('*')
                .eq('espacio', espacioSeleccionado)
                .eq('estado', 'estacionado')
                .maybeSingle();
            
            if (espacioOcupado) {
                showAlert('error', `El espacio ${espacioSeleccionado} ya está ocupado.`);
                return;
            }

            // Insertar nuevo vehículo
            const { data: nuevoVehiculo, error: insertError } = await supabase
                .from('vehiculos')
                .insert([
                    {
                        placa,
                        marca,
                        modelo,
                        color,
                        conductor,
                        espacio: espacioSeleccionado,
                        hora_entrada: horaEntrada.toISOString(),
                        estado: 'estacionado'
                    }
                ])
                .select()
                .single();
            
            if (!insertError && nuevoVehiculo) {
                vehiculos.push(nuevoVehiculo);
                showAlert('success', `Vehículo con placa ${placa} registrado en espacio ${espacioSeleccionado}.`);
                formEntrada.reset();
                espacioSeleccionado = null;
                generarMapaEstacionamiento();
                actualizarEstadisticas();
            } else {
                console.error('Error insertando vehículo:', insertError);
                showAlert('error', 'Error al registrar el vehículo');
            }
        } catch (error) {
            console.error('Error en registro de entrada:', error);
            showAlert('error', 'Error al registrar el vehículo');
        }
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
    buscarPlacaBtn.addEventListener('click', async function () {
        const placa = placaSalidaInput.value.toUpperCase();
        
        try {
            const { data: vehiculo, error } = await supabase
                .from('vehiculos')
                .select('*')
                .eq('placa', placa)
                .eq('estado', 'estacionado')
                .maybeSingle();
            
            if (error || !vehiculo) {
                showAlert('error', 'No se encontró un vehículo estacionado con esa placa.');
                previewPago.classList.add('hidden');
                return;
            }

            // Calcular previsualización de pago
            const horaSalida = new Date();
            const horaEntrada = new Date(vehiculo.hora_entrada);
            const tiempoEstacionadoMs = horaSalida.getTime() - horaEntrada.getTime();
            const tiempoEstacionadoHoras = tiempoEstacionadoMs / (1000 * 60 * 60);
            const totalPagar = Math.ceil(tiempoEstacionadoHoras) * tarifaPorHora;

            // Mostrar previsualización
            document.getElementById('preview-hora-entrada').textContent = horaEntrada.toLocaleTimeString();
            document.getElementById('preview-hora-salida').textContent = horaSalida.toLocaleTimeString();
            document.getElementById('preview-tiempo').textContent = `${tiempoEstacionadoHoras.toFixed(2)} horas`;
            document.getElementById('preview-total').textContent = `$${totalPagar.toFixed(2)}`;

            previewPago.classList.remove('hidden');
        } catch (error) {
            console.error('Error buscando vehículo:', error);
            showAlert('error', 'Error al buscar el vehículo');
        }
    });

    // Registrar salida de vehículo
    formSalida.addEventListener('submit', async function (e) {
        e.preventDefault();

        const placa = placaSalidaInput.value.toUpperCase();
        const pagado = document.getElementById('pagado').value;
        
        try {
            // Obtener el vehículo
            const { data: vehiculo, error: getError } = await supabase
                .from('vehiculos')
                .select('*')
                .eq('placa', placa)
                .eq('estado', 'estacionado')
                .maybeSingle();
            
            if (getError || !vehiculo) {
                showAlert('error', 'No se encontró un vehículo estacionado con esa placa.');
                return;
            }

            const horaSalida = new Date();
            const horaEntrada = new Date(vehiculo.hora_entrada);
            const tiempoEstacionadoMs = horaSalida.getTime() - horaEntrada.getTime();
            const tiempoEstacionadoHoras = tiempoEstacionadoMs / (1000 * 60 * 60);
            const totalPagar = Math.ceil(tiempoEstacionadoHoras) * tarifaPorHora;

            // Actualizar vehículo
            const { data: updatedVehiculo, error: updateError } = await supabase
                .from('vehiculos')
                .update({
                    hora_salida: horaSalida.toISOString(),
                    tiempo_estacionado_horas: tiempoEstacionadoHoras,
                    total_pagar: totalPagar,
                    pagado: pagado === 'si',
                    estado: 'salio'
                })
                .eq('id', vehiculo.id)
                .select()
                .single();
            
            if (!updateError && updatedVehiculo) {
                // Actualizar lista local
                const index = vehiculos.findIndex(v => v.id === vehiculo.id);
                if (index !== -1) {
                    vehiculos[index] = updatedVehiculo;
                }
                
                showAlert('success', `Salida registrada para placa ${placa}. Total: $${totalPagar.toFixed(2)}`);
                formSalida.reset();
                previewPago.classList.add('hidden');
                actualizarTablaVehiculos();
                actualizarEstadisticas();
                generarMapaEstacionamiento();
            } else {
                console.error('Error actualizando vehículo:', updateError);
                showAlert('error', 'Error al registrar la salida');
            }
        } catch (error) {
            console.error('Error en registro de salida:', error);
            showAlert('error', 'Error al registrar la salida');
        }
    });

    // Función para actualizar la tabla de vehículos
    async function actualizarTablaVehiculos() {
        try {
            const { data: vehiculosEstacionados, error } = await supabase
                .from('vehiculos')
                .select('*')
                .eq('estado', 'estacionado');
            
            if (error) {
                console.error('Error cargando vehículos:', error);
                showAlert('error', 'Error al cargar los vehículos');
                return;
            }
            
            tablaVehiculos.innerHTML = '';

            if (vehiculosEstacionados.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = `<td colspan="7" style="text-align: center;">No hay vehículos estacionados</td>`;
                tablaVehiculos.appendChild(row);
                return;
            }

            vehiculosEstacionados.forEach(vehiculo => {
                const row = document.createElement('tr');
                const horaEntrada = new Date(vehiculo.hora_entrada);

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
        } catch (error) {
            console.error('Error actualizando tabla:', error);
            showAlert('error', 'Error al cargar los vehículos');
        }
    }

    // Función para actualizar estadísticas
    async function actualizarEstadisticas() {
        try {
            // Vehículos activos
            const { count: vehiculosActivos, error: activosError } = await supabase
                .from('vehiculos')
                .select('*', { count: 'exact' })
                .eq('estado', 'estacionado');
            
            if (!activosError) {
                vehiculosActivosEl.textContent = vehiculosActivos || 0;
            }
            
            // Ingresos hoy
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            const { data: ingresosData, error: ingresosError } = await supabase
                .from('vehiculos')
                .select('total_pagar')
                .eq('estado', 'salio')
                .gte('hora_salida', hoy.toISOString())
                .eq('pagado', true);
            
            if (!ingresosError) {
                const ingresosHoy = ingresosData.reduce((sum, v) => sum + (v.total_pagar || 0), 0);
                ingresosHoyEl.textContent = `$${ingresosHoy.toFixed(2)}`;
            }
            
            // Tiempo promedio y pagos pendientes
            const { data: tiemposData, error: tiemposError } = await supabase
                .from('vehiculos')
                .select('tiempo_estacionado_horas, pagado')
                .eq('estado', 'salio');
            
            if (!tiemposError) {
                // Tiempo promedio
                const tiempos = tiemposData.map(v => v.tiempo_estacionado_horas || 0);
                const promedio = tiempos.length > 0
                    ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
                    : 0;
                promedioTiempoEl.textContent = `${promedio.toFixed(2)}h`;

                // Pagos pendientes
                const pendientes = tiemposData.filter(v => !v.pagado).length;
                pendientesPagoEl.textContent = pendientes;
            }
        } catch (error) {
            console.error('Error actualizando estadísticas:', error);
            showAlert('error', 'Error al cargar las estadísticas');
        }
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

    // Manejo de eliminación de datos
    document.getElementById('btn-eliminar').addEventListener('click', async function() {
        const tipo = document.getElementById('tipo-eliminacion').value;
        
        try {
            if (tipo === 'todo') {
                if (confirm('¿Está seguro que desea eliminar TODOS los registros? Esta acción no se puede deshacer.')) {
                    const { error } = await supabase
                        .from('vehiculos')
                        .delete()
                        .neq('id', 0); // Elimina todos los registros
                    
                    if (!error) {
                        vehiculos = [];
                        showAlert('success', 'Todos los registros han sido eliminados');
                        actualizarTablaVehiculos();
                        generarMapaEstacionamiento();
                        actualizarEstadisticas();
                    } else {
                        console.error('Error eliminando registros:', error);
                        showAlert('error', 'Error al eliminar los registros');
                    }
                }
            } else if (tipo === 'salidos') {
                const { error } = await supabase
                    .from('vehiculos')
                    .delete()
                    .eq('estado', 'salio');
                
                if (!error) {
                    vehiculos = vehiculos.filter(v => v.estado === 'estacionado');
                    showAlert('success', 'Registros de vehículos salidos eliminados');
                    actualizarTablaVehiculos();
                    generarMapaEstacionamiento();
                    actualizarEstadisticas();
                } else {
                    console.error('Error eliminando registros:', error);
                    showAlert('error', 'Error al eliminar los registros');
                }
            } else if (tipo === 'antiguos') {
                const limite = new Date();
                limite.setDate(limite.getDate() - 30);
                
                const { error } = await supabase
                    .from('vehiculos')
                    .delete()
                    .eq('estado', 'salio')
                    .lt('hora_salida', limite.toISOString());
                
                if (!error) {
                    vehiculos = vehiculos.filter(v => {
                        if (v.estado === 'estacionado') return true;
                        const fechaSalida = new Date(v.hora_salida);
                        return fechaSalida > limite;
                    });
                    showAlert('success', 'Registros antiguos eliminados');
                    actualizarTablaVehiculos();
                    generarMapaEstacionamiento();
                    actualizarEstadisticas();
                } else {
                    console.error('Error eliminando registros:', error);
                    showAlert('error', 'Error al eliminar los registros');
                }
            }
        } catch (error) {
            console.error('Error en eliminación:', error);
            showAlert('error', 'Error al eliminar los registros');
        }
    });

    // Configuración de espacios
    document.getElementById('btn-guardar-espacios').addEventListener('click', async function() {
        const nuevosEspacios = parseInt(document.getElementById('total-espacios').value);
        
        if (nuevosEspacios < 1) {
            showAlert('error', 'El número de espacios debe ser al menos 1');
            return;
        }
        
        // Verificar que no haya más vehículos estacionados que el nuevo total
        const { count: vehiculosEstacionados, error: countError } = await supabase
            .from('vehiculos')
            .select('*', { count: 'exact' })
            .eq('estado', 'estacionado');
        
        if (countError || (vehiculosEstacionados && vehiculosEstacionados > nuevosEspacios)) {
            showAlert('error', `No puede reducir a ${nuevosEspacios} espacios porque hay ${vehiculosEstacionados} vehículos estacionados`);
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('configuracion')
                .update({ total_espacios: nuevosEspacios })
                .eq('id', configuracion.id)
                .select()
                .single();
            
            if (!error && data) {
                configuracion = data;
                totalEspacios = configuracion.total_espacios;
                showAlert('success', `Configuración guardada: ${nuevosEspacios} espacios totales`);
                generarMapaEstacionamiento();
            } else {
                console.error('Error actualizando configuración:', error);
                showAlert('error', 'Error al guardar la configuración');
            }
        } catch (error) {
            console.error('Error en configuración:', error);
            showAlert('error', 'Error al guardar la configuración');
        }
    });

    // Configuración de tarifa
    document.getElementById('btn-guardar-tarifa').addEventListener('click', async function() {
        const nuevaTarifa = parseFloat(document.getElementById('tarifa-hora').value);
        
        if (nuevaTarifa <= 0) {
            showAlert('error', 'La tarifa debe ser mayor que 0');
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('configuracion')
                .update({ tarifa_por_hora: nuevaTarifa })
                .eq('id', configuracion.id)
                .select()
                .single();
            
            if (!error && data) {
                configuracion = data;
                tarifaPorHora = configuracion.tarifa_por_hora;
                showAlert('success', `Tarifa actualizada: $${nuevaTarifa} por hora`);
            } else {
                console.error('Error actualizando tarifa:', error);
                showAlert('error', 'Error al actualizar la tarifa');
            }
        } catch (error) {
            console.error('Error en tarifa:', error);
            showAlert('error', 'Error al actualizar la tarifa');
        }
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