document.addEventListener('DOMContentLoaded', function() {
    const registroForm = document.getElementById('registroForm');
    
    if (registroForm) {
        registroForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                nombre: document.getElementById('nombre').value,
                placa: document.getElementById('placa').value,
                tipo: document.getElementById('tipo').value,
                telefono: document.getElementById('telefono').value
            };
            
            fetch('php/db_operations.php?action=registrar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Vehículo registrado con éxito!');
                    registroForm.reset();
                } else {
                    alert('Error al registrar: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error al conectar con el servidor');
            });
        });
    }
});