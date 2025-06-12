import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://rnsvucshdbjyihzoalts.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuc3Z1Y3NoZGJqeWloem9hbHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2OTc2NjgsImV4cCI6MjA2NTI3MzY2OH0.bk5PJoXvgxbIHuN6l7cT8IuP0wBRw8zgcdggEkvjKvw'
const supabase = createClient(supabaseUrl, supabaseKey)

// Función para inicializar la aplicación después del login
async function inicializarAplicacion() {
    const placaInput = document.getElementById('placa');

    placaInput.addEventListener('input', () => {
        let valor = placaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Formatear según patrón BB-CC·12
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
    });

    const modelosPorMarca = {
        toyota: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Yaris', 'Land Cruiser'],
        ford: ['Focus', 'Fiesta', 'Mustang', 'Explorer', 'F-150', 'Escape'],
        chevrolet: ['Cruze', 'Malibu', 'Camaro', 'Silverado', 'Equinox', 'Tracker'],
        honda: ['Civic', 'Accord', 'CR-V', 'Fit', 'Pilot', 'HR-V'],
        bmw: ['Serie 1', 'Serie 3', 'Serie 5', 'X3', 'X5', 'Z4'],
        mercedes: ['Clase A', 'Clase C', 'Clase E', 'GLE', 'GLA', 'GLC'],
        nissan: ['Versa', 'Sentra', 'Altima', 'Leaf', 'Rogue', 'Frontier'],
        volkswagen: ['Golf', 'Polo', 'Passat', 'Tiguan', 'Jetta', 'T-Cross'],
        audi: ['A3', 'A4', 'A6', 'Q5', 'Q7', 'Q3'],
        hyundai: ['Accent', 'Elantra', 'Tucson', 'Santa Fe', 'Kona', 'Creta'],
        kia: ['Rio', 'Cerato', 'Sportage', 'Seltos', 'Sorento', 'Picanto'],
        mazda: ['Mazda2', 'Mazda3', 'CX-3', 'CX-5', 'CX-9', 'MX-5'],
        subaru: ['Impreza', 'Legacy', 'Forester', 'Outback', 'XV'],
        peugeot: ['208', '308', '2008', '3008', '5008'],
        renault: ['Logan', 'Sandero', 'Duster', 'Kwid', 'Captur'],
        fiat: ['500', 'Panda', 'Tipo', 'Argo', 'Cronos', 'Toro'],
        jeep: ['Renegade', 'Compass', 'Wrangler', 'Cherokee', 'Grand Cherokee'],
        dodge: ['Challenger', 'Charger', 'Durango', 'Journey'],
        ram: ['1500', '2500', '3500'],
        tesla: ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
        volvo: ['S60', 'S90', 'XC40', 'XC60', 'XC90'],
        mitsubishi: ['Mirage', 'Lancer', 'ASX', 'Outlander', 'Eclipse Cross'],
        suzuki: ['Swift', 'Vitara', 'Celerio', 'Baleno', 'Jimny'],
        chery: ['Tiggo 2', 'Tiggo 3', 'Tiggo 5', 'Tiggo 7', 'Tiggo 8'],
        geely: ['Coolray', 'Emgrand', 'Azkarra', 'Okavango', 'GX3'],
        otro: ['Otro']
    };

    const marcaSelect = document.getElementById('marca');
    const modeloSelect = document.getElementById('modelo');

    // Cargar dinámicamente las marcas
    Object.keys(modelosPorMarca).forEach(marca => {
        const option = document.createElement('option');
        option.value = marca;
        option.textContent = marca.charAt(0).toUpperCase() + marca.slice(1);
        marcaSelect.appendChild(option);
    });

    marcaSelect.addEventListener('change', () => {
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

        // Habilitar o deshabilitar select modelo
        modeloSelect.disabled = modelos.length === 0;
    });

    // Inicialmente deshabilitar el select de modelos
    modeloSelect.disabled = true;

    // Variables
    let vehiculos = [];
    let configuracion = {
        totalEspacios: 24,
        tarifaPorMinuto: 30
    };

    // Cargar datos iniciales desde Supabase
    try {
        // Cargar vehículos
        const { data: vehiculosData, error: vehiculosError } = await supabase
            .from('vehiculos')
            .select('*');

        if (!vehiculosError) {
            vehiculos = vehiculosData || [];
        } else {
            console.error('Error al cargar vehículos:', vehiculosError);
            showAlert('error', 'Error al cargar los vehículos');
        }

        // Cargar configuración
        const { data: configData, error: configError } = await supabase
            .from('configuracion')
            .select('*')
            .single();

        if (!configError && configData) {
            configuracion = configData;
        } else {
            // Si no hay configuración, crear una por defecto
            const { error: insertError } = await supabase
                .from('configuracion')
                .insert([configuracion]);

            if (insertError) {
                console.error('Error al crear configuración inicial:', insertError);
                showAlert('error', 'Error al inicializar configuración');
            }
        }
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showAlert('error', 'Error al cargar los datos iniciales');
    }

    let totalEspacios = configuracion.totalEspacios;
    let tarifaPorMinuto = configuracion.tarifaPorMinuto;
    let espacioSeleccionado = null;

    // Función para inicializar gráficos
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
                    backgroundColor: ['#1db489', '#7a7f9b'],
                    hoverBackgroundColor: ['#0b7056', '#5f637a']
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
                    hoverBackgroundColor: '#0b7056',
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
                    backgroundColor: 'rgba(0, 120, 212, 0.05)',
                    borderColor: '#0078d4',
                    pointBackgroundColor: '#0078d4',
                    pointHoverBackgroundColor: '#0078d4',
                    borderWidth: 2,
                    pointBorderColor: '#fff',
                    pointHoverRadius: 5,
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
                    new Date(v.horaSalida).toDateString() === date.toDateString() &&
                    v.pagado)
                .reduce((sum, v) => sum + v.totalPagar, 0);

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
            const horaEntrada = new Date(v.horaEntrada).getHours();
            result.valores[horaEntrada]++;
        });

        return result;
    }

    // Función para exportar a Excel
    function exportarAExcel() {
        // Preparar datos
        const datos = vehiculos.map(v => {
            const horaEntrada = new Date(v.horaEntrada);
            const horaSalida = v.horaSalida ? new Date(v.horaSalida) : null;

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
                'Tiempo Estacionado (minutos)': v.tiempoEstacionadoMinutos || '',
                'Total a Pagar': v.totalPagar ? `$${v.totalPagar.toLocaleString('es-CL')}` : '',
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
    }

    // Función para filtrar vehículos según el término de búsqueda
    function filtrarVehiculos(termino) {
        termino = termino.toLowerCase();
        return vehiculos.filter(vehiculo => {
            return (
                vehiculo.placa.toLowerCase().includes(termino) ||
                vehiculo.marca.toLowerCase().includes(termino) ||
                vehiculo.modelo.toLowerCase().includes(termino) ||
                vehiculo.color.toLowerCase().includes(termino) ||
                vehiculo.conductor.toLowerCase().includes(termino)
            );
        });
    }

    // Función para actualizar la tabla con vehículos filtrados
    function actualizarTablaVehiculos(filtro = '') {
        const tablaVehiculos = document.querySelector('#tabla-vehiculos tbody');
        tablaVehiculos.innerHTML = '';

        let vehiculosMostrados = vehiculos;

        if (filtro) {
            vehiculosMostrados = filtrarVehiculos(filtro);
        }

        if (vehiculosMostrados.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="7" style="text-align: center;">No se encontraron vehículos</td>`;
            tablaVehiculos.appendChild(row);
            return;
        }

        // Nuevas etiquetas para móviles (sin "Color", con "Acciones")
        const labels = ['Placa', 'Marca', 'Modelo', 'Conductor', 'Tiempo (min)', 'Estado', 'Acciones'];

        vehiculosMostrados.forEach(vehiculo => {
            const row = document.createElement('tr');
            const horaEntrada = new Date(vehiculo.horaEntrada);

            let tiempoEstacionado = '-';
            if (vehiculo.estado === 'retirado' && vehiculo.horaSalida) {
                const horaSalida = new Date(vehiculo.horaSalida);
                const tiempoMs = horaSalida.getTime() - horaEntrada.getTime();
                tiempoEstacionado = Math.round(tiempoMs / (1000 * 60));
            } else if (vehiculo.estado === 'estacionado') {
                const tiempoMs = new Date().getTime() - horaEntrada.getTime();
                tiempoEstacionado = Math.round(tiempoMs / (1000 * 60));
            }

            const celdas = [
                vehiculo.placa,
                vehiculo.marca,
                vehiculo.modelo,
                vehiculo.conductor,
                tiempoEstacionado,
                vehiculo.estado === 'estacionado'
                    ? '<span class="badge badge-success">Estacionado</span>'
                    : '<span class="badge badge-secondary">Retirado</span>',
                `
            <div class="dropdown">
                <button class="dropdown-toggle" title="Opciones">⋮</button>
                <div class="dropdown-menu hidden">
                    <button class="dropdown-item" onclick="editarVehiculo('${vehiculo.placa}')">Editar</button>
                    <button class="dropdown-item" onclick="eliminarVehiculo('${vehiculo.placa}')">Eliminar</button>
                </div>
            </div>
            `
            ];

            celdas.forEach((contenido, index) => {
                const celda = document.createElement('td');
                celda.innerHTML = contenido;
                celda.setAttribute('data-label', labels[index]);
                row.appendChild(celda);
            });

            tablaVehiculos.appendChild(row);
        });
    }

    document.addEventListener('click', function (event) {
        const toggle = event.target.closest('.dropdown-toggle');
        if (toggle) {
            const menu = toggle.nextElementSibling;
            document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
            menu.classList.toggle('hidden');
            return;
        }

        if (!event.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
        }
    });

    window.eliminarVehiculo = async function (placa) {
        const confirmacion = await Swal.fire({
            title: '¿Eliminar vehículo?',
            text: `¿Estás seguro de que deseas eliminar el vehículo con placa ${placa}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74a3b',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar'
        });

        if (!confirmacion.isConfirmed) return;

        // Buscar el vehículo antes de eliminarlo para saber el espacio
        const vehiculo = vehiculos.find(v => v.placa === placa);
        const espacio = vehiculo?.espacio;

        // Eliminar en Supabase
        const { error } = await supabase
            .from('vehiculos')
            .delete()
            .eq('placa', placa);

        if (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo eliminar el vehículo.', 'error');
            return;
        }

        // Eliminar localmente
        vehiculos = vehiculos.filter(v => v.placa !== placa);

        // Liberar visualmente el espacio en el mapa
        if (espacio) {
            const celda = document.querySelector(`.parking-space[data-espacio="${espacio}"]`);
            if (celda) {
                celda.classList.remove('occupied');
                celda.classList.add('available');
                celda.innerHTML = `
                    <span class="parking-space-number">${espacio}</span>
                    <i class="fas fa-car parking-space-car"></i>
                `;
            }
        }

        actualizarTablaVehiculos();
        Swal.fire('Eliminado', 'El vehículo ha sido eliminado.', 'success');
    };

    window.editarVehiculo = function (placa) {
        const vehiculo = vehiculos.find(v => v.placa === placa);
        if (!vehiculo) return;

        document.getElementById('edit-placa').value = vehiculo.placa;
        document.getElementById('edit-marca').value = vehiculo.marca;
        document.getElementById('edit-modelo').value = vehiculo.modelo;
        document.getElementById('edit-conductor').value = vehiculo.conductor;

        document.getElementById('modal-editar').classList.remove('hidden');
    };

    document.getElementById('form-editar-vehiculo').addEventListener('submit', async function (e) {
        e.preventDefault();

        const placa = document.getElementById('edit-placa').value;
        const marca = document.getElementById('edit-marca').value.trim();
        const modelo = document.getElementById('edit-modelo').value.trim();
        const conductor = document.getElementById('edit-conductor').value.trim();

        const { error } = await supabase
            .from('vehiculos')
            .update({ marca, modelo, conductor })
            .eq('placa', placa);

        if (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo actualizar el vehículo.', 'error');
            return;
        }

        const vehiculo = vehiculos.find(v => v.placa === placa);
        if (vehiculo) {
            vehiculo.marca = marca;
            vehiculo.modelo = modelo;
            vehiculo.conductor = conductor;
        }

        actualizarTablaVehiculos();
        document.getElementById('modal-editar').classList.add('hidden');
        Swal.fire('Guardado', 'Los datos fueron actualizados.', 'success');
    });

    document.getElementById('cancelar-edicion').addEventListener('click', () => {
        document.getElementById('modal-editar').classList.add('hidden');
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

    // Mostrar notificación
    function showAlert(type, message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.zIndex = '9999';
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

    // Guardar vehículos en Supabase
    async function guardarVehiculos() {
        try {
            // Primero eliminamos todos los registros existentes (esto es simplificado)
            const { error: deleteError } = await supabase
                .from('vehiculos')
                .delete()
                .neq('id', 0); // Esto eliminará todos los registros

            if (deleteError) throw deleteError;

            // Luego insertamos todos los vehículos actuales
            const { error: insertError } = await supabase
                .from('vehiculos')
                .insert(vehiculos);

            if (insertError) throw insertError;

            return true;
        } catch (error) {
            console.error('Error al guardar vehículos:', error);
            showAlert('error', 'Error al guardar los vehículos');
            return false;
        }
    }

    // Guardar configuración en Supabase
    async function guardarConfiguracion() {
        try {
            const { error } = await supabase
                .from('configuracion')
                .update(configuracion)
                .eq('id', 1); // Asumiendo que hay solo un registro de configuración con ID 1

            if (error) throw error;

            return true;
        } catch (error) {
            console.error('Error al guardar configuración:', error);
            showAlert('error', 'Error al guardar la configuración');
            return false;
        }
    }

    // Función para actualizar estadísticas
    function actualizarEstadisticas() {
        // Vehículos activos
        const vehiculosActivos = vehiculos.filter(v => v.estado === 'estacionado').length;
        document.getElementById('vehiculos-activos').textContent = vehiculosActivos;

        // Ingresos hoy
        const hoy = new Date().setHours(0, 0, 0, 0);
        const ingresosHoy = vehiculos
            .filter(v => v.estado === 'retirado' && new Date(v.horaSalida) >= hoy && v.pagado)
            .reduce((sum, v) => sum + v.totalPagar, 0);
        document.getElementById('ingresos-hoy').textContent = `$${ingresosHoy.toLocaleString('es-CL')}`;

        // Tiempo promedio (en minutos)
        const tiempos = vehiculos
            .filter(v => v.estado === 'retirado')
            .map(v => v.tiempoEstacionadoMinutos);
        const promedio = tiempos.length > 0
            ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
            : 0;
        document.getElementById('promedio-tiempo').textContent = `${Math.round(promedio)} min`;

        // Pagos pendientes
        const pendientes = vehiculos
            .filter(v => v.estado === 'retirado' && !v.pagado).length;
        document.getElementById('pendientes-pago').textContent = pendientes;
    }

    // Función para cargar configuración
    function cargarConfiguracion() {
        document.getElementById('total-espacios').value = configuracion.totalEspacios;
        document.getElementById('tarifa-hora').value = configuracion.tarifaPorMinuto;
    }

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
                inicializarGraficos();
            } else if (tabId === 'configuracion') {
                cargarConfiguracion();
            }
        });
    });

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
            estado: 'estacionado',
            horaSalida: null,
            tiempoEstacionadoMinutos: null,
            totalPagar: null,
            pagado: null
        };

        try {
            // Insertar el nuevo vehículo en Supabase
            const { data, error } = await supabase
                .from('vehiculos')
                .insert([vehiculo])
                .select();

            if (error) throw error;

            // Agregar el vehículo a la lista local con el ID generado por Supabase
            if (data && data.length > 0) {
                vehiculos.push(data[0]);
            } else {
                vehiculos.push(vehiculo);
            }

            showAlert('success', `Vehículo con placa ${placa} registrado en espacio ${espacioSeleccionado}.`);
            formEntrada.reset();
            espacioSeleccionado = null;
            generarMapaEstacionamiento();
            actualizarEstadisticas();
        } catch (error) {
            console.error('Error al registrar vehículo:', error);
            showAlert('error', 'Error al registrar el vehículo');
        }
    });

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
        const tiempoEstacionadoMinutos = Math.ceil(tiempoEstacionadoMs / (1000 * 60));
        const totalPagar = tiempoEstacionadoMinutos * configuracion.tarifaPorMinuto;

        // Mostrar previsualización
        document.getElementById('preview-hora-entrada').textContent = horaEntrada.toLocaleTimeString();
        document.getElementById('preview-hora-salida').textContent = horaSalida.toLocaleTimeString();
        document.getElementById('preview-tiempo').textContent = `${tiempoEstacionadoMinutos} minutos`;
        document.getElementById('preview-total').textContent = `$${totalPagar.toLocaleString('es-CL')}`;

        previewPago.classList.remove('hidden');
    });

    // Registrar salida de vehículo
    formSalida.addEventListener('submit', async function (e) {
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
        const tiempoEstacionadoMinutos = Math.ceil(tiempoEstacionadoMs / (1000 * 60));
        const totalPagar = tiempoEstacionadoMinutos * configuracion.tarifaPorMinuto;

        // Actualizar vehículo localmente
        vehiculos[vehiculoIndex].horaSalida = horaSalida.getTime();
        vehiculos[vehiculoIndex].tiempoEstacionadoMinutos = tiempoEstacionadoMinutos;
        vehiculos[vehiculoIndex].totalPagar = totalPagar;
        vehiculos[vehiculoIndex].pagado = pagado === 'si';
        vehiculos[vehiculoIndex].estado = 'retirado';

        try {
            // Actualizar el vehículo en Supabase
            const { error } = await supabase
                .from('vehiculos')
                .update({
                    horaSalida: horaSalida.getTime(),
                    tiempoEstacionadoMinutos: tiempoEstacionadoMinutos,
                    totalPagar: totalPagar,
                    pagado: pagado === 'si',
                    estado: 'retirado'
                })
                .eq('id', vehiculos[vehiculoIndex].id);

            if (error) throw error;

            showAlert('success', `Salida registrada para placa ${placa}. Total: $${totalPagar.toLocaleString('es-CL')}`);
            formSalida.reset();
            previewPago.classList.add('hidden');
            actualizarTablaVehiculos();
            actualizarEstadisticas();
            generarMapaEstacionamiento();
        } catch (error) {
            console.error('Error al registrar salida:', error);
            showAlert('error', 'Error al registrar la salida del vehículo');
        }
    });

    // Manejo de eliminación de datos
    document.getElementById('btn-eliminar').addEventListener('click', async function () {
        const tipo = document.getElementById('tipo-eliminacion').value;

        if (tipo === 'todo') {
            Swal.fire({
                title: '¿Eliminar TODOS los registros?',
                text: "Esta acción no se puede deshacer y perderás todos los datos.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar todo',
                cancelButtonText: 'Cancelar',
                backdrop: `
                rgba(0,0,0,0.7)
                left top
                no-repeat
            `
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        // Eliminar todos los vehículos en Supabase
                        const { error } = await supabase
                            .from('vehiculos')
                            .delete()
                            .neq('id', 0);

                        if (error) throw error;

                        vehiculos = [];
                        showAlert('success', 'Todos los registros han sido eliminados');
                        actualizarTablaVehiculos();
                        generarMapaEstacionamiento();
                        actualizarEstadisticas();

                        Swal.fire(
                            '¡Eliminado!',
                            'Todos los registros han sido borrados.',
                            'success'
                        );
                    } catch (error) {
                        console.error('Error al eliminar registros:', error);
                        showAlert('error', 'Error al eliminar los registros');
                    }
                }
            });
        } else if (tipo === 'salidos') {
            Swal.fire({
                title: 'Eliminar vehículos salidos',
                text: "¿Deseas eliminar solo los registros de vehículos que ya salieron?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        // Obtener IDs de vehículos a eliminar
                        const idsAEliminar = vehiculos
                            .filter(v => v.estado === 'retirado')
                            .map(v => v.id);

                        // Eliminar en Supabase
                        if (idsAEliminar.length > 0) {
                            const { error } = await supabase
                                .from('vehiculos')
                                .delete()
                                .in('id', idsAEliminar);

                            if (error) throw error;
                        }

                        // Actualizar lista local
                        vehiculos = vehiculos.filter(v => v.estado === 'estacionado');
                        showAlert('success', 'Registros de vehículos salidos eliminados');
                        actualizarTablaVehiculos();
                        generarMapaEstacionamiento();
                        actualizarEstadisticas();
                    } catch (error) {
                        console.error('Error al eliminar vehículos salidos:', error);
                        showAlert('error', 'Error al eliminar vehículos salidos');
                    }
                }
            });
        } else if (tipo === 'antiguos') {
            Swal.fire({
                title: 'Eliminar registros antiguos',
                html: "¿Deseas eliminar registros con más de <b>30 días</b> de antigüedad?<br><small>Los vehículos estacionados no serán afectados</small>",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar antiguos',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const limite = new Date();
                        limite.setDate(limite.getDate() - 30);

                        // Obtener IDs de vehículos a eliminar
                        const idsAEliminar = vehiculos
                            .filter(v => {
                                if (v.estado === 'estacionado') return false;
                                const fechaSalida = new Date(v.horaSalida);
                                return fechaSalida <= limite;
                            })
                            .map(v => v.id);

                        // Eliminar en Supabase
                        if (idsAEliminar.length > 0) {
                            const { error } = await supabase
                                .from('vehiculos')
                                .delete()
                                .in('id', idsAEliminar);

                            if (error) throw error;
                        }

                        // Actualizar lista local
                        vehiculos = vehiculos.filter(v => {
                            if (v.estado === 'estacionado') return true;
                            const fechaSalida = new Date(v.horaSalida);
                            return fechaSalida > limite;
                        });

                        showAlert('success', 'Registros antiguos eliminados');
                        actualizarTablaVehiculos();
                        generarMapaEstacionamiento();
                        actualizarEstadisticas();

                        Swal.fire(
                            '¡Hecho!',
                            'Los registros antiguos han sido eliminados.',
                            'success'
                        );
                    } catch (error) {
                        console.error('Error al eliminar registros antiguos:', error);
                        showAlert('error', 'Error al eliminar registros antiguos');
                    }
                }
            });
        }
    });

    // Configuración de espacios
    document.getElementById('btn-guardar-espacios').addEventListener('click', async function () {
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

        try {
            // Actualizar configuración en Supabase
            const { error } = await supabase
                .from('configuracion')
                .update({ totalEspacios: nuevosEspacios })
                .eq('id', 1);

            if (error) throw error;

            showAlert('success', `Configuración guardada: ${nuevosEspacios} espacios totales`);
            generarMapaEstacionamiento();
        } catch (error) {
            console.error('Error al actualizar configuración de espacios:', error);
            showAlert('error', 'Error al guardar la configuración de espacios');
        }
    });

    // Configuración de tarifa
    document.getElementById('btn-guardar-tarifa').addEventListener('click', async function () {
        const nuevaTarifa = parseFloat(document.getElementById('tarifa-hora').value);

        if (nuevaTarifa <= 0) {
            showAlert('error', 'La tarifa debe ser mayor que 0');
            return;
        }

        configuracion.tarifaPorMinuto = nuevaTarifa;
        tarifaPorMinuto = nuevaTarifa;

        try {
            // Actualizar configuración en Supabase
            const { error } = await supabase
                .from('configuracion')
                .update({ tarifaPorMinuto: nuevaTarifa })
                .eq('id', 1);

            if (error) throw error;

            showAlert('success', `Tarifa actualizada: $${nuevaTarifa.toLocaleString('es-CL')} por minuto`);
        } catch (error) {
            console.error('Error al actualizar tarifa:', error);
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
            inicializarGraficos();
        } else if (activeTab === 'configuracion') {
            cargarConfiguracion();
        }
    }

    // Botón exportar Excel
    document.getElementById('btn-exportar-excel').addEventListener('click', exportarAExcel);

    // Agregar evento de búsqueda
    const buscarVehiculoInput = document.getElementById('buscar-vehiculo');
    buscarVehiculoInput.addEventListener('input', function (e) {
        actualizarTablaVehiculos(e.target.value);
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

    // Generar mapa inicial
    generarMapaEstacionamiento();
    actualizarEstadisticas();
}

// Manejar el formulario de login
document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Verificar credenciales en Supabase
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            throw new Error('*Usuario o contraseña incorrectos');
        }

        // Login exitoso
        localStorage.setItem('usuarioLogueado', JSON.stringify(data));
        localStorage.setItem('isLoggedIn', 'true');

        // Ocultar login y mostrar dashboard
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('login-error').classList.add('hidden');

        // Mostrar mensaje de bienvenida
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `
            <span>Bienvenido, ${data.nombre}</span>
            <button class="close-btn">&times;</button>
        `;
        document.body.appendChild(alert);
        setTimeout(() => alert.classList.add('show'), 10);
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }, 5000);

        // Inicializar la aplicación
        inicializarAplicacion();

    } catch (error) {
        const errorMsg = document.getElementById('login-error');
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const loginContainer = document.querySelector('.login-container');

        // Mostrar mensaje de error
        errorMsg.textContent = error.message;
        errorMsg.classList.remove('hidden');

        // Aplicar estilos de error
        usernameInput.classList.add('input-error');
        passwordInput.classList.add('input-error');

        // Agregar animación de "shake"
        loginContainer.classList.remove('shake'); // Reiniciar si ya está aplicada
        void loginContainer.offsetWidth; // Forzar repaint
        loginContainer.classList.add('shake');
    }
});

// Verificar estado de login al cargar la página
document.addEventListener('DOMContentLoaded', async function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuarioLogueado'));

    if (isLoggedIn && usuarioLogueado) {
        // Verificar si el usuario aún existe en Supabase
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', usuarioLogueado.id)
                .single();

            if (error || !data) {
                throw new Error('La sesión ha expirado');
            }

            document.getElementById('login-overlay').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            inicializarAplicacion();
        } catch (error) {
            // Limpiar estado de login inválido
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('usuarioLogueado');
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('login-overlay').classList.remove('hidden');

            // Mostrar mensaje de error
            const alert = document.createElement('div');
            alert.className = 'alert alert-error';
            alert.innerHTML = `
                <span>${error.message}</span>
                <button class="close-btn">&times;</button>
            `;
            document.body.appendChild(alert);
            setTimeout(() => alert.classList.add('show'), 10);
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }, 5000);
        }
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