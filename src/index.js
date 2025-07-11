// Usar el cliente Supabase ya creado en index.html
import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js';
import { generarResumenTotalizado } from './src/generarResumenTotalizado.js';

const supabase = window.supabase;

async function cargarResumen() {
  const { data, error } = await supabase
    .from('resumen_totalizado')
    .select('*')
    .eq('es_subtotal', false);

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

  // Agrupar por parroquia
  const agrupado = {};
  datos.forEach(item => {
    const grupo = agrupado[item.parroquia] ?? [];
    grupo.push(item);
    agrupado[item.parroquia] = grupo;
  });

  let total = {
    electores: 0, encuestados: 0, si: 0, no: 0, nose: 0
  };

  for (const [parroquia, grupo] of Object.entries(agrupado)) {
    grupo.sort((a, b) => Number(a.codigo_centro) - Number(b.codigo_centro));

    grupo.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.codigo_centro}</td>
        <td>${item.nombre_centro || '—'}</td>
        <td>${item.parroquia}</td>
        <td>${item.electores}</td>
        <td>${item.encuestados}</td>
        <td>${item.si}</td>
        <td>${item.no}</td>
        <td>${item.nose}</td>
        <td>${item.porcentaje_participacion}%</td>
      `;
      tbody.appendChild(row);

      total.electores += item.electores;
      total.encuestados += item.encuestados;
      total.si += item.si;
      total.no += item.no;
      total.nose += item.nose;
    });

    // Fila subtotal por parroquia
    const subtotalRow = document.createElement('tr');
    subtotalRow.style.backgroundColor = '#eee';
    const enc = grupo.reduce((acc, i) => acc + i.encuestados, 0);
    const elect = grupo.reduce((acc, i) => acc + i.electores, 0);
    subtotalRow.innerHTML = `
      <td colspan="2"><strong>Total ${parroquia}</strong></td>
      <td>${parroquia}</td>
      <td>${elect}</td>
      <td>${enc}</td>
      <td>${grupo.reduce((acc, i) => acc + i.si, 0)}</td>
      <td>${grupo.reduce((acc, i) => acc + i.no, 0)}</td>
      <td>${grupo.reduce((acc, i) => acc + i.nose, 0)}</td>
      <td>${elect ? Math.round((enc / elect) * 100) : 0}%</td>
    `;
    tbody.appendChild(subtotalRow);
  }

  // Fila total general
  const totalRow = document.createElement('tr');
  totalRow.style.backgroundColor = '#ccc';
  totalRow.innerHTML = `
    <td colspan="2"><strong>Total General</strong></td>
    <td>—</td>
    <td>${total.electores}</td>
    <td>${total.encuestados}</td>
    <td>${total.si}</td>
    <td>${total.no}</td>
    <td>${total.nose}</td>
    <td>${total.electores ? Math.round((total.encuestados / total.electores) * 100) : 0}%</td>
  `;
  tbody.appendChild(totalRow);
}

function renderGraficos(datos) {
  const centros = datos
    .slice()
    .sort((a, b) => Number(a.codigo_centro) - Number(b.codigo_centro))
    .map(d => d.nombre_centro || d.codigo_centro);

  const participacion = datos
    .slice()
    .sort((a, b) => Number(a.codigo_centro) - Number(b.codigo_centro))
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
