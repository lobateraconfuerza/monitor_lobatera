// generarResumenTotalizado.js

async function generarResumenTotalizado() {
  const supabase = window.supabase;
  
  async function generarResumenTotalizado() {
    console.log('🔄 Actualizando filas en resumen_totalizado');
  
    const { data: centros, error: errCentros } = await supabase
      .from('resumen_totalizado')
      .select('id, codigo_centro, parroquia')
      .eq('es_subtotal', false);
  
    if (errCentros) {
      console.error('❌ Error leyendo centros:', errCentros.message);
      return;
    }
  
    const { data: votosRaw, error: errV } = await supabase
      .from('participacion_bot')
      .select('cedula, respuesta');
  
    if (errV) {
      console.error('❌ Error leyendo votos:', errV.message);
      return;
    }
  
    let votosPorCentro = {};
    let cedulasNoMapeadas = [];
  
    for (const { cedula, respuesta } of votosRaw) {
      const cedulaKey = cedula?.toString().padStart(8, '0');
  
      const { data: centroData, error } = await supabase
        .from('datos')
        .select('codigo_centro')
        .eq('cedula', cedulaKey)
        .maybeSingle();
  
      const centro = centroData?.codigo_centro?.toString().trim();
  
      if (!centro) {
        cedulasNoMapeadas.push(cedulaKey);
        continue;
      }
  
      votosPorCentro[centro] ??= { total: 0, si: 0, no: 0, nose: 0 };
      votosPorCentro[centro].total++;
  
      const r = respuesta?.toLowerCase();
      if (['si', 'no', 'nose'].includes(r)) votosPorCentro[centro][r]++;
    }
  
    if (cedulasNoMapeadas.length > 0) {
      console.warn(`⚠️ ${cedulasNoMapeadas.length} cédulas no asociadas:\n` +
        cedulasNoMapeadas.map(c => ` - ${c}`).join('\n'));
    }
  
    for (const { id, codigo_centro } of centros) {
      const { count: electCount } = await supabase
        .from('datos')
        .select('cedula', { head: true, count: 'exact' })
        .eq('codigo_centro', codigo_centro);
  
      const votos = votosPorCentro[codigo_centro] || {};
      const total = votos.total || 0;
      const si = votos.si || 0;
      const no = votos.no || 0;
      const nose = votos.nose || 0;
  
      const pPart = electCount ? +((total / electCount) * 100).toFixed(2) : 0;
      const pSi = total ? +((si / total) * 100).toFixed(2) : 0;
      const pNo = total ? +((no / total) * 100).toFixed(2) : 0;
      const pNs = total ? +((nose / total) * 100).toFixed(2) : 0;
  
      await supabase
        .from('resumen_totalizado')
        .update({
          electores: electCount,
          encuestados: total,
          si, no, nose,
          porcentaje_participacion: pPart,
          porcentaje_si: pSi,
          porcentaje_no: pNo,
          porcentaje_nose: pNs
        })
        .eq('id', id);
    }
  
    const { data: actualizados } = await supabase
      .from('resumen_totalizado')
      .select('*')
      .eq('es_subtotal', false);
  
    const agrupado = actualizados.reduce((acc, fila) => {
      const pq = fila.parroquia;
      acc[pq] ??= { elect: 0, enc: 0, si: 0, no: 0, ns: 0 };
      acc[pq].elect += fila.electores;
      acc[pq].enc += fila.encuestados;
      acc[pq].si += fila.si;
      acc[pq].no += fila.no;
      acc[pq].ns += fila.nose;
      return acc;
    }, {});
  
    for (const [pq, { elect, enc, si, no, ns }] of Object.entries(agrupado)) {
      await supabase
        .from('resumen_totalizado')
        .update({
          electores: elect,
          encuestados: enc,
          si, no, nose: ns,
          porcentaje_participacion: elect ? +((enc / elect) * 100).toFixed(2) : 0,
          porcentaje_si: enc ? +((si / enc) * 100).toFixed(2) : 0,
          porcentaje_no: enc ? +((no / enc) * 100).toFixed(2) : 0,
          porcentaje_nose: enc ? +((ns / enc) * 100).toFixed(2) : 0
        })
        .match({ parroquia: pq, codigo_centro: '0' });
    }
  
    const tot = Object.values(agrupado).reduce(
      (acc, v) => ({
        elect: acc.elect + v.elect,
        enc: acc.enc + v.enc,
        si: acc.si + v.si,
        no: acc.no + v.no,
        ns: acc.ns + v.ns
      }),
      { elect: 0, enc: 0, si: 0, no: 0, ns: 0 }
    );
  
    await supabase
      .from('resumen_totalizado')
      .update({
        electores: tot.elect,
        encuestados: tot.enc,
        si: tot.si,
        no: tot.no,
        nose: tot.ns,
        porcentaje_participacion: tot.elect ? +((tot.enc / tot.elect) * 100).toFixed(2) : 0,
        porcentaje_si: tot.enc ? +((tot.si / tot.enc) * 100).toFixed(2) : 0,
        porcentaje_no: tot.enc ? +((tot.no / tot.enc) * 100).toFixed(2) : 0,
        porcentaje_nose: tot.enc ? +((tot.ns / tot.enc) * 100).toFixed(2) : 0
      })
      .match({ parroquia: '', codigo_centro: '0' });
  
    console.log('✅ resumen_totalizado actualizado correctamente');
  }
}
export { generarResumenTotalizado };

