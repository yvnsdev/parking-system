// Reemplaza estas dos variables con tus datos reales
const supabaseUrl = 'https://tznbyobyfyrpgdbsyhsf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bmJ5b2J5ZnlycGdkYnN5aHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDg4MTksImV4cCI6MjA2NDkyNDgxOX0.4ZW1Sq0zduznaGjjJradMiu9uofK2l-HM4mBaNaaXfU';

// Crea el cliente Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variables globales
let vehiculos = [];
let configuracion = {
    totalEspacios: 24,
    tarifaPorMinuto: 30
};
let espacioSeleccionado = null;

// Función para inicializar la aplicación después del login
async function inicializarAplicacion() {
    // Cargar datos iniciales
    await cargarDatosIniciales();

    // Configurar eventos de la interfaz
    configurarEventosUI();

    // Generar mapa inicial
    await generarMapaEstacionamiento();
    await actualizarEstadisticas();
}

// Cargar datos iniciales desde Supabase
async function cargarDatosIniciales() {
    try {
        // Cargar vehículos
        const { data: vehiculosData, error: vehiculosError } = await supabase
            .from('vehiculos')
            .select('*');

        if (vehiculosError) throw vehiculosError;
        vehiculos = vehiculosData || [];

        // Cargar configuración
        const { data: configData, error: configError } = await supabase
            .from('configuracion')
            .select('*')

        if (configError) throw configError;
        configuracion = configData || {
            totalEspacios: 24,
            tarifaPorMinuto: 30
        };

        // Actualizar UI con configuración
        document.getElementById('total-espacios').value = configuracion.totalEspacios;
        document.getElementById('tarifa-hora').value = configuracion.tarifaPorMinuto;

    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showAlert('error', 'Error al cargar datos iniciales');
    }
}

// Configurar eventos de la interfaz
function configurarEventosUI() {
    const placaInput = document.getElementById('placa');
    placaInput.addEventListener('input', formatearPlaca);

    const marcaSelect = document.getElementById('marca');
    const modeloSelect = document.getElementById('modelo');
    marcaSelect.addEventListener('change', () => actualizarModelos(marcaSelect, modeloSelect));

    // Inicialmente deshabilitar modelo hasta que se seleccione marca
    modeloSelect.disabled = true;

    // Configurar otros eventos...
    configurarEventosTabs();
    configurarEventosFormularios();
    configurarEventosConfiguracion();
    configurarReloj();
    configurarBusqueda();
}

// Formatear placa de vehículo
function formatearPlaca() {
    const placaInput = document.getElementById('placa');
    let valor = placaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    let formateado = '';
    if (valor.length >= 2) {
        formateado += valor.slice(0, 2);
    } else {
        formateado += valor;
    }

    if (valor.length >= 4) {
        formateado += '-' + valor.slice(2, 4);
    } else if (valor.length > 2) {
        formateado += '-' + valor.slice(2);
    }

    if (valor.length >= 6) {
        formateado += '·' + valor.slice(4, 6);
    } else if (valor.length > 4) {
        formateado += '·' + valor.slice(4);
    }

    placaInput.value = formateado;
}

// Actualizar modelos según marca seleccionada
function actualizarModelos(marcaSelect, modeloSelect) {
    const modelosPorMarca = {
        toyota: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Yaris'],
        ford: ['Focus', 'Fiesta', 'Mustang', 'Explorer', 'F-150'],
        chevrolet: ['Cruze', 'Malibu', 'Camaro', 'Silverado', 'Equinox'],
        honda: ['Civic', 'Accord', 'CR-V', 'Fit', 'Pilot'],
        bmw: ['Serie 3', 'Serie 5', 'X3', 'X5', 'Z4'],
        mercedes: ['Clase A', 'Clase C', 'Clase E', 'GLE', 'GLA'],
        nissan: ['Sentra', 'Altima', 'Leaf', 'Rogue', 'Frontier'],
        volkswagen: ['Golf', 'Polo', 'Passat', 'Tiguan', 'Jetta'],
        audi: ['A3', 'A4', 'A6', 'Q5', 'Q7']
    };

    const marcaSeleccionada = marcaSelect.value;
    const modelos = modelosPorMarca[marcaSeleccionada] || [];

    // Limpiar opciones actuales
    modeloSelect.innerHTML = '<option value="" disabled selected>Seleccione un modelo</option>';

    // Agregar nuevas opciones según la marca
    modelos.forEach(modelo => {
        const option = document.createElement('option');
        option.value = modelo.toLowerCase().replace(/\s+/g, '-');
        option.textContent = modelo;
        modeloSelect.appendChild(option);
    });

    // Habilitar o deshabilitar select modelo según disponibilidad
    modeloSelect.disabled = modelos.length === 0;
}

// Configurar eventos de las pestañas
function configurarEventosTabs() {
    const tabButtons = document.querySelectorAll('.sidebar li');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const tabId = button.getAttribute('data-tab');

            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Agregar clase active al botón y contenido seleccionado
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');

            // Actualizar contenido según la pestaña
            if (tabId === 'vehiculos') {
                await actualizarTablaVehiculos();
            } else if (tabId === 'reportes') {
                await actualizarEstadisticas();
                inicializarGraficos();
            } else if (tabId === 'configuracion') {
                document.getElementById('total-espacios').value = configuracion.totalEspacios;
                document.getElementById('tarifa-hora').value = configuracion.tarifaPorMinuto;
            }
        });
    });
}

// Configurar eventos de formularios
function configurarEventosFormularios() {
    const formEntrada = document.getElementById('form-entrada');
    const formSalida = document.getElementById('form-salida');
    const buscarPlacaBtn = document.getElementById('buscar-placa');

    // Agregar campo de espacio al formulario
    const espacioInput = document.createElement('div');
    espacioInput.className = 'form-group';
    espacioInput.innerHTML = `
        <label for="espacio"><i class="fas fa-map-marker-alt"></i> Espacio:</label>
        <input type="text" id="espacio" placeholder="Seleccione un espacio" readonly>
    `;
    formEntrada.querySelector('.form-grid').appendChild(espacioInput);

    // Registrar entrada de vehículo
    formEntrada.addEventListener('submit', async (e) => {
        e.preventDefault();
        await registrarEntradaVehiculo();
    });

    // Buscar vehículo para salida
    buscarPlacaBtn.addEventListener('click', async () => {
        await buscarVehiculoParaSalida();
    });

    // Registrar salida de vehículo
    formSalida.addEventListener('submit', async (e) => {
        e.preventDefault();
        await registrarSalidaVehiculo();
    });
}

// Configurar eventos de configuración
function configurarEventosConfiguracion() {
    document.getElementById('btn-eliminar').addEventListener('click', async () => {
        await eliminarRegistros();
    });

    document.getElementById('btn-guardar-espacios').addEventListener('click', async () => {
        await actualizarConfiguracionEspacios();
    });

    document.getElementById('btn-guardar-tarifa').addEventListener('click', async () => {
        await actualizarConfiguracionTarifa();
    });

    document.getElementById('btn-exportar-excel').addEventListener('click', exportarAExcel);
}

// Configurar reloj
function configurarReloj() {
    const currentTimeDisplay = document.getElementById('current-time');

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
}

// Configurar búsqueda
function configurarBusqueda() {
    const buscarVehiculoInput = document.getElementById('buscar-vehiculo');
    buscarVehiculoInput.addEventListener('input', (e) => {
        actualizarTablaVehiculos(e.target.value);
    });
}

// Registrar entrada de vehículo
async function registrarEntradaVehiculo() {
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
        const { data: vehiculosExistentes, error: existeError } = await supabase
            .from('vehiculos')
            .select('*')
            .eq('placa', placa)
            .eq('estado', 'estacionado');

        if (existeError) throw existeError;
        
        // Cambio clave: Verificar si hay algún vehículo con esa placa estacionado
        if (vehiculosExistentes && vehiculosExistentes.length > 0) {
            showAlert('error', `Ya hay un vehículo con placa ${placa} estacionado.`);
            return;
        }

        // Verificar si el espacio ya está ocupado
        const { data: espaciosOcupados, error: espacioError } = await supabase
            .from('vehiculos')
            .select('*')
            .eq('espacio', espacioSeleccionado)
            .eq('estado', 'estacionado');

        if (espacioError) throw espacioError;
        
        // Cambio clave: Verificar si hay algún vehículo en ese espacio
        if (espaciosOcupados && espaciosOcupados.length > 0) {
            showAlert('error', `El espacio ${espacioSeleccionado} ya está ocupado.`);
            return;
        }

        // Resto del código permanece igual...
        const { data: nuevoVehiculo, error: insertError } = await supabase
            .from('vehiculos')
            .insert([{
                placa,
                marca,
                modelo,
                color,
                conductor,
                espacio: espacioSeleccionado,
                hora_entrada: horaEntrada.getTime(),
                estado: 'estacionado'
            }]);

        if (insertError) throw insertError;

        showAlert('success', `Vehículo con placa ${placa} registrado en espacio ${espacioSeleccionado}.`);

        // Limpiar formulario y actualizar datos
        document.getElementById('form-entrada').reset();
        espacioSeleccionado = null;

        // Recargar datos
        await cargarDatosIniciales();
        await generarMapaEstacionamiento();
        await actualizarEstadisticas();

    } catch (error) {
        console.error('Error registrando entrada:', error);
        showAlert('error', 'Error al registrar entrada del vehículo');
    }
}

// Buscar vehículo para salida
async function buscarVehiculoParaSalida() {
    const placa = document.getElementById('placa-salida').value.toUpperCase();
    const previewPago = document.getElementById('preview-pago');

    try {
        const { data: vehiculo, error } = await supabase
            .from('vehiculos')
            .select('*')
            .eq('placa', placa)
            .eq('estado', 'estacionado')

        if (error || !vehiculo) {
            showAlert('error', 'No se encontró un vehículo estacionado con esa placa.');
            previewPago.classList.add('hidden');
            return;
        }

        // Calcular previsualización de pago
        const horaSalida = new Date();
        const horaEntrada = new Date(vehiculo.hora_entrada);
        const tiempoEstacionadoMs = horaSalida.getTime() - horaEntrada.getTime();
        const tiempoEstacionadoMinutos = Math.ceil(tiempoEstacionadoMs / (1000 * 60));
        const totalPagar = tiempoEstacionadoMinutos * configuracion.tarifaPorMinuto;

        // Mostrar previsualización
        document.getElementById('preview-hora-entrada').textContent = horaEntrada.toLocaleTimeString();
        document.getElementById('preview-hora-salida').textContent = horaSalida.toLocaleTimeString();
        document.getElementById('preview-tiempo').textContent = `${tiempoEstacionadoMinutos} minutos`;
        document.getElementById('preview-total').textContent = `$${totalPagar.toLocaleString('es-CL')}`;

        previewPago.classList.remove('hidden');

    } catch (error) {
        console.error('Error buscando vehículo:', error);
        showAlert('error', 'Error al buscar vehículo');
    }
}

// Registrar salida de vehículo
async function registrarSalidaVehiculo() {
    const placa = document.getElementById('placa-salida').value.toUpperCase();
    const pagado = document.getElementById('pagado').value;
    const previewPago = document.getElementById('preview-pago');

    try {
        // Obtener vehículo
        const { data: vehiculo, error: getError } = await supabase
            .from('vehiculos')
            .select('*')
            .eq('placa', placa)
            .eq('estado', 'estacionado')

        if (getError || !vehiculo) {
            showAlert('error', 'No se encontró un vehículo estacionado con esa placa.');
            return;
        }

        // Calcular valores
        const horaSalida = new Date();
        const horaEntrada = new Date(vehiculo.hora_entrada);
        const tiempoEstacionadoMs = horaSalida.getTime() - horaEntrada.getTime();
        const tiempoEstacionadoMinutos = Math.ceil(tiempoEstacionadoMs / (1000 * 60));
        const totalPagar = tiempoEstacionadoMinutos * configuracion.tarifaPorMinuto;

        // Actualizar vehículo
        const { error: updateError } = await supabase
            .from('vehiculos')
            .update({
                hora_salida: horaSalida.getTime(),
                tiempo_estacionado: tiempoEstacionadoMinutos,
                total_pagar: totalPagar,
                pagado: pagado === 'si',
                estado: 'retirado'
            })
            .eq('placa', placa);

        if (updateError) throw updateError;

        showAlert('success', `Salida registrada para placa ${placa}. Total: $${totalPagar.toLocaleString('es-CL')}`);

        // Limpiar formulario
        document.getElementById('form-salida').reset();
        previewPago.classList.add('hidden');

        // Recargar datos
        await cargarDatosIniciales();
        await actualizarTablaVehiculos();
        await actualizarEstadisticas();
        await generarMapaEstacionamiento();

    } catch (error) {
        console.error('Error registrando salida:', error);
        showAlert('error', 'Error al registrar salida del vehículo');
    }
}

// Eliminar registros según criterio
async function eliminarRegistros() {
    const tipo = document.getElementById('tipo-eliminacion').value;

    try {
        if (tipo === 'todo') {
            if (!confirm('¿Está seguro que desea eliminar TODOS los registros? Esta acción no se puede deshacer.')) {
                return;
            }

            const { error } = await supabase
                .from('vehiculos')
                .delete()
                .neq('placa', ''); // Elimina todos los registros

            if (error) throw error;

            showAlert('success', 'Todos los registros han sido eliminados');

        } else if (tipo === 'salidos') {
            const { error } = await supabase
                .from('vehiculos')
                .delete()
                .eq('estado', 'retirado');

            if (error) throw error;

            showAlert('success', 'Registros de vehículos salidos eliminados');

        } else if (tipo === 'antiguos') {
            const limite = new Date();
            limite.setDate(limite.getDate() - 30);

            const { error } = await supabase
                .from('vehiculos')
                .delete()
                .lt('hora_salida', limite.getTime());

            if (error) throw error;

            showAlert('success', 'Registros antiguos eliminados');
        }

        // Recargar datos
        await cargarDatosIniciales();
        await actualizarTablaVehiculos();
        await generarMapaEstacionamiento();
        await actualizarEstadisticas();

    } catch (error) {
        console.error('Error eliminando registros:', error);
        showAlert('error', 'Error al eliminar registros');
    }
}

// Actualizar configuración de espacios
async function actualizarConfiguracionEspacios() {
    const nuevosEspacios = parseInt(document.getElementById('total-espacios').value);

    if (nuevosEspacios < 1) {
        showAlert('error', 'El número de espacios debe ser al menos 1');
        return;
    }

    try {
        // Verificar que no haya más vehículos estacionados que el nuevo total
        const { count: vehiculosEstacionados, error: countError } = await supabase
            .from('vehiculos')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'estacionado');

        if (countError) throw countError;

        if (vehiculosEstacionados > nuevosEspacios) {
            showAlert('error', `No puede reducir a ${nuevosEspacios} espacios porque hay ${vehiculosEstacionados} vehículos estacionados`);
            return;
        }

        // Actualizar configuración
        const { error } = await supabase
            .from('configuracion')
            .update({ total_espacios: nuevosEspacios })
            .eq('id', 1);

        if (error) throw error;

        configuracion.totalEspacios = nuevosEspacios;
        showAlert('success', `Configuración guardada: ${nuevosEspacios} espacios totales`);

        // Actualizar mapa
        await generarMapaEstacionamiento();

    } catch (error) {
        console.error('Error actualizando espacios:', error);
        showAlert('error', 'Error al actualizar configuración de espacios');
    }
}

// Actualizar configuración de tarifa
async function actualizarConfiguracionTarifa() {
    const nuevaTarifa = parseFloat(document.getElementById('tarifa-hora').value);

    if (nuevaTarifa <= 0) {
        showAlert('error', 'La tarifa debe ser mayor que 0');
        return;
    }

    try {
        const { error } = await supabase
            .from('configuracion')
            .update({ tarifa_por_minuto: nuevaTarifa })
            .eq('id', 1);

        if (error) throw error;

        configuracion.tarifaPorMinuto = nuevaTarifa;
        showAlert('success', `Tarifa actualizada: $${nuevaTarifa.toLocaleString('es-CL')} por minuto`);

    } catch (error) {
        console.error('Error actualizando tarifa:', error);
        showAlert('error', 'Error al actualizar tarifa');
    }
}

// Generar mapa de estacionamiento
async function generarMapaEstacionamiento() {
    const parkingMap = document.getElementById('parking-map');
    parkingMap.innerHTML = '';

    try {
        // Obtener vehículos estacionados
        const { data: vehiculosEstacionados, error } = await supabase
            .from('vehiculos')
            .select('*')
            .eq('estado', 'estacionado');

        if (error) throw error;

        const espaciosOcupados = vehiculosEstacionados?.map(v => v.espacio) || [];

        for (let i = 1; i <= configuracion.totalEspacios; i++) {
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
    } catch (error) {
        console.error('Error generando mapa:', error);
        showAlert('error', 'Error al generar mapa de estacionamiento');
    }
}

// Actualizar tabla de vehículos
async function actualizarTablaVehiculos(filtro = '') {
    const tablaVehiculos = document.querySelector('#tabla-vehiculos tbody');
    tablaVehiculos.innerHTML = '';

    try {
        let query = supabase
            .from('vehiculos')
            .select('*')
            .order('hora_entrada', { ascending: false });

        if (filtro) {
            const termino = filtro.toLowerCase();
            query = query.or(
                `placa.ilike.%${termino}%,marca.ilike.%${termino}%,modelo.ilike.%${termino}%,color.ilike.%${termino}%,conductor.ilike.%${termino}%`
            );
        }

        const { data: vehiculosMostrados, error } = await query;

        if (error) throw error;

        if (vehiculosMostrados.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" style="text-align: center;">No se encontraron vehículos</td>`;
            tablaVehiculos.appendChild(row);
            return;
        }

        vehiculosMostrados.forEach(vehiculo => {
            const row = document.createElement('tr');
            const horaEntrada = new Date(vehiculo.hora_entrada);
            const horaSalida = vehiculo.hora_salida ? new Date(vehiculo.hora_salida) : null;

            row.innerHTML = `
                <td>${vehiculo.placa}</td>
                <td>${vehiculo.marca}</td>
                <td>${vehiculo.modelo}</td>
                <td>${vehiculo.color}</td>
                <td>${vehiculo.conductor}</td>
                <td>${horaEntrada.toLocaleTimeString()}</td>
                <td>${horaSalida ? horaSalida.toLocaleTimeString() : '-'}</td>
                <td>
                    ${vehiculo.estado === 'estacionado' ?
                    '<span class="badge badge-success">Estacionado</span>' :
                    '<span class="badge badge-secondary">Retirado</span>'}
                </td>
            `;

            tablaVehiculos.appendChild(row);
        });
    } catch (error) {
        console.error('Error actualizando tabla:', error);
        showAlert('error', 'Error al cargar vehículos');
    }
}

// Actualizar estadísticas
async function actualizarEstadisticas() {
    try {
        // Vehículos activos
        const { count: vehiculosActivos, error: activosError } = await supabase
            .from('vehiculos')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'estacionado');

        if (activosError) throw activosError;
        document.getElementById('vehiculos-activos').textContent = vehiculosActivos || 0;

        // Ingresos hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const { data: ingresosHoyData, error: ingresosError } = await supabase
            .from('vehiculos')
            .select('total_pagar')
            .eq('estado', 'retirado')
            .gte('hora_salida', hoy.getTime())
            .eq('pagado', true);

        if (ingresosError) throw ingresosError;

        const ingresosHoy = ingresosHoyData?.reduce((sum, v) => sum + (v.total_pagar || 0), 0) || 0;
        document.getElementById('ingresos-hoy').textContent = `$${ingresosHoy.toLocaleString('es-CL')}`;

        // Tiempo promedio (en minutos)
        const { data: tiemposData, error: tiemposError } = await supabase
            .from('vehiculos')
            .select('tiempo_estacionado')
            .eq('estado', 'retirado');

        if (tiemposError) throw tiemposError;

        const tiempos = tiemposData?.map(v => v.tiempo_estacionado) || [];
        const promedio = tiempos.length > 0 ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;
        document.getElementById('promedio-tiempo').textContent = `${Math.round(promedio)} min`;

        // Pagos pendientes
        const { count: pendientes, error: pendientesError } = await supabase
            .from('vehiculos')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'retirado')
            .eq('pagado', false);

        if (pendientesError) throw pendientesError;
        document.getElementById('pendientes-pago').textContent = pendientes || 0;

    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        showAlert('error', 'Error al actualizar estadísticas');
    }
}

// Inicializar gráficos
function inicializarGraficos() {
    // Datos para los gráficos (ejemplo)
    const vehiculosEstacionados = vehiculos.filter(v => v.estado === 'estacionado').length;
    const vehiculosRetirados = vehiculos.filter(v => v.estado === 'retirado').length;

    // Gráfico de estado de vehículos
    const estadoCtx = document.getElementById('estadoVehiculosChart').getContext('2d');
    new Chart(estadoCtx, {
        type: 'doughnut',
        data: {
            labels: ['Estacionados', 'Retirados'],
            datasets: [{
                data: [vehiculosEstacionados, vehiculosRetirados],
                backgroundColor: [
                    '#4e73df',
                    '#858796'
                ],
                hoverBackgroundColor: [
                    '#2e59d9',
                    '#717384'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Estado de Vehículos',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Gráfico de ingresos por día (últimos 7 días)
    const ingresosCtx = document.getElementById('ingresosChart').getContext('2d');
    const ingresosData = calcularIngresosUltimosDias(7);
    new Chart(ingresosCtx, {
        type: 'bar',
        data: {
            labels: ingresosData.labels,
            datasets: [{
                label: 'Ingresos ($)',
                data: ingresosData.valores,
                backgroundColor: '#1cc88a',
                borderColor: '#1cc88a',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Ingresos últimos 7 días',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString('es-CL');
                        }
                    }
                }
            }
        }
    });

    // Gráfico de horas pico
    const horasPicoCtx = document.getElementById('horasPicoChart').getContext('2d');
    const horasPicoData = calcularHorasPico();
    new Chart(horasPicoCtx, {
        type: 'line',
        data: {
            labels: horasPicoData.labels,
            datasets: [{
                label: 'Entradas por hora',
                data: horasPicoData.valores,
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: '#4e73df',
                borderWidth: 2,
                pointBackgroundColor: '#4e73df',
                pointBorderColor: '#fff',
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#4e73df',
                pointHoverBorderColor: '#fff',
                pointHitRadius: 10,
                pointBorderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Horas pico de entrada',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Función para calcular ingresos de últimos días
function calcularIngresosUltimosDias(dias) {
    const result = {
        labels: [],
        valores: []
    };

    for (let i = dias - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

        const ingresos = vehiculos
            .filter(v => v.estado === 'retirado' &&
                new Date(v.hora_salida).toDateString() === date.toDateString() &&
                v.pagado)
            .reduce((sum, v) => sum + v.total_pagar, 0);

        result.labels.push(dateStr);
        result.valores.push(ingresos);
    }

    return result;
}

// Función para calcular horas pico
function calcularHorasPico() {
    const result = {
        labels: [],
        valores: new Array(24).fill(0)
    };

    // Generar etiquetas de horas (0-23)
    for (let i = 0; i < 24; i++) {
        result.labels.push(`${i}:00`);
    }

    // Contar entradas por hora
    vehiculos.forEach(v => {
        const horaEntrada = new Date(v.hora_entrada).getHours();
        result.valores[horaEntrada]++;
    });

    return result;
}

// Función para exportar a Excel
async function exportarAExcel() {
    try {
        // Obtener todos los vehículos
        const { data: vehiculosExportar, error } = await supabase
            .from('vehiculos')
            .select('*');

        if (error) throw error;

        // Preparar datos
        const datos = vehiculosExportar.map(v => {
            const horaEntrada = new Date(v.hora_entrada);
            const horaSalida = v.hora_salida ? new Date(v.hora_salida) : null;

            return {
                'Placa': v.placa,
                'Marca': v.marca,
                'Modelo': v.modelo,
                'Color': v.color,
                'Conductor': v.conductor,
                'Espacio': v.espacio,
                'Hora Entrada': horaEntrada.toLocaleString(),
                'Hora Salida': horaSalida ? horaSalida.toLocaleString() : '',
                'Estado': v.estado === 'estacionado' ? 'Estacionado' : 'Retirado',
                'Tiempo Estacionado (minutos)': v.tiempo_estacionado || '',
                'Total a Pagar': v.total_pagar ? `$${v.total_pagar.toLocaleString('es-CL')}` : '',
                'Pagado': v.pagado ? 'Sí' : v.pagado === false ? 'No' : ''
            };
        });

        // Crear hoja de trabajo
        const ws = XLSX.utils.json_to_sheet(datos);

        // Crear libro de trabajo
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");

        // Exportar archivo
        const fecha = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `registros_estacionamiento_${fecha}.xlsx`);

    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showAlert('error', 'Error al exportar a Excel');
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

// Manejar el formulario de login
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Verificar credenciales en Supabase
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', username)
            .eq('password', password)

        if (error || !usuario) {
            throw new Error('Credenciales inválidas');
        }

        // Login exitoso
        localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
        localStorage.setItem('isLoggedIn', 'true');

        // Ocultar login y mostrar dashboard
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

        showAlert('success', `Bienvenido, ${usuario.nombre}`);
        await inicializarAplicacion();

    } catch (error) {
        console.error('Error en login:', error);
        showAlert('error', 'Usuario o contraseña incorrectos');
    }
});

// Verificar estado de login al cargar la página
document.addEventListener('DOMContentLoaded', async function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));

    if (isLoggedIn && usuarioLogueado) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        await inicializarAplicacion();
    } else {
        // Limpiar posible estado previo inválido
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('usuarioLogueado');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-overlay').classList.remove('hidden');
    }

    // Manejar logout
    document.getElementById('logout-btn').addEventListener('click', function () {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('usuarioLogueado');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-overlay').classList.remove('hidden');
        document.getElementById('login-form').reset();
    });
});

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

    .badge-secondary {
        background-color: var(--secondary);
    }
`;
document.head.appendChild(style);