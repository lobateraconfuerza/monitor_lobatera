import supabase from './supabase.js';

async function cargarResumen() {
  const { data, error } = await supabase
    .from('resumen_totalizado')
    .select('*')
    .eq('es_subtotal', false);

  if (error) {
    console.error('Error cargando datos:', error.message);
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
  });
}

function renderGraficos(datos) {
  const centros = datos.map(d => d.nombre_centro || d.codigo_centro);
  const participacion = datos.map(d => d.porcentaje_participacion);

  // Gráfico de barras
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
    options: { responsive: true }
  });

  // Gráfico circular con totales
  const si = datos.reduce((a, b) => a + b.si, 0);
  const no = datos.reduce((a, b) => a + b.no, 0);
  const nose = datos.reduce((a, b) => a + b.nose, 0);

  new Chart(document.getElementById('graficoCircular'), {
    type: 'pie',
    data: {
      labels: ['Sí', 'No', 'No sé'],
      datasets: [{
        data: [si, no, nose],
        backgroundColor: ['#28a745', '#dc3545', '#6c757d']
      }]
    }
  });
}

cargarResumen();
