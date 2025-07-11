// Usar el cliente Supabase ya creado en index.html
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js';
import { generarResumenTotalizado } from './src/generarResumenTotalizado.js';

const supabase = window.supabase;

async function cargarResumen() {
  const { data, error } = await supabase
    .from('resumen_totalizado')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Error cargando datos:', error.message);
    return;
  }

  renderTabla(data);
  renderGraficos(data);
}

function renderTabla(datos) {
  const tbody = document.getElementById('tablaDatos');
  tbody.innerHTML = '';

  datos.forEach(item => {
    const row = document.createElement('tr');

    // Estilo para subtotales y total general
    if (item.es_subtotal) {
      row.classList.add(item.parroquia === '' ? 'total-general' : 'subtotal');
    }

    row.innerHTML = `
      <td>${item.codigo_centro}</td>
      <td>${item.nombre_centro || '—'}</td>
      <td>${item.parroquia || '—'}</td>
      <td>${item.electores}</td>
      <td>${item.encuestados}</td>
      <td>${item.si}</td>
      <td>${item.no}</td>
      <td>${item.nose}</td>
      <td>${item.porcentaje_participacion}%</td>
    `;
    tbody.appendChild(row);
  });
}

function renderGraficos(datos) {
  const centros = datos
    .filter(d => !d.es_subtotal)
    .map(d => d.nombre_centro || d.codigo_centro);

  const participacion = datos
    .filter(d => !d.es_subtotal)
    .map(d => d.porcentaje_participacion);

  new Chart(document.getElementById('graficoBarras'), {
    type: 'bar',
    data: {
      labels: centros,
      datasets: [{
        label: '% Participación',
        data: participacion,
        backgroundColor: '#063970'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });

  const totalSi = datos.reduce((acc, d) => acc + d.si, 0);
  const totalNo = datos.reduce((acc, d) => acc + d.no, 0);
  const totalNs = datos.reduce((acc, d) => acc + d.nose, 0);

  new Chart(document.getElementById('graficoCircular'), {
    type: 'pie',
    data: {
      labels: ['Sí', 'No', 'No sé'],
      datasets: [{
        data: [totalSi, totalNo, totalNs],
        backgroundColor: ['#28a745', '#dc3545', '#ffc107']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await cargarResumen();

  const botonActualizar = document.getElementById('actualizarResumen');

  if (botonActualizar) {
    botonActualizar.addEventListener('click', async () => {
      botonActualizar.disabled = true;
      botonActualizar.textContent = '🔄 Actualizando...';

      try {
        await generarResumenTotalizado();
        await cargarResumen();
        botonActualizar.textContent = '✅ Actualizado correctamente';
      } catch (err) {
        console.error('⚠️ Error al actualizar resumen:', err);
        botonActualizar.textContent = '⚠️ Falló actualización';
      }

      setTimeout(() => {
        botonActualizar.textContent = '📡 Actualizar resumen';
        botonActualizar.disabled = false;
      }, 3000);
    });
  }
});
