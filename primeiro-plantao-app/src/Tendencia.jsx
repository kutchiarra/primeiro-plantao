import { useEffect, useRef, useState } from 'react';

// Tendência dos parâmetros ao longo do plantão, no mesmo papel da fita.
// As marcas verticais são as injeções: é onde se vê o remédio agindo.
// Passar o cursor lê o papel ponto a ponto, como quem confere o impresso.
const ALTURA = 132;
const FAIXAS = {
  fc: { min: 40, max: 190, cor: '#17110E', rotulo: 'FC' },
  pas: { min: 40, max: 220, cor: '#1B3FA0', rotulo: 'PAS' },
  spo2: { min: 70, max: 100, cor: '#2C6A4A', rotulo: 'SpO₂' },
};

export default function Tendencia({ historico, marcas, janelaMin = 30 }) {
  const ref = useRef(null);
  const escala = useRef({ tIni: 0, tFim: janelaMin, largura: 440 });
  const [leitura, setLeitura] = useState(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const largura = cv.parentElement.clientWidth || 440;
    cv.width = Math.round(largura * dpr);
    cv.height = Math.round(ALTURA * dpr);
    cv.style.width = largura + 'px';
    cv.style.height = ALTURA + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const topo = 14, base = ALTURA - 16;
    const tFim = Math.max(janelaMin, historico.length ? historico[historico.length - 1].t : 0);
    const tIni = Math.max(0, tFim - janelaMin);
    escala.current = { tIni, tFim, largura };
    const x = (t) => ((t - tIni) / Math.max(0.1, tFim - tIni)) * (largura - 8) + 4;
    const y = (valor, faixa) => base - ((valor - faixa.min) / (faixa.max - faixa.min)) * (base - topo);

    ctx.fillStyle = '#FCF1EC';
    ctx.fillRect(0, 0, largura, ALTURA);

    ctx.strokeStyle = '#F3DAD2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let px = 0; px < largura; px += 8) { ctx.moveTo(px + .5, 0); ctx.lineTo(px + .5, ALTURA); }
    for (let py = 0; py < ALTURA; py += 8) { ctx.moveTo(0, py + .5); ctx.lineTo(largura, py + .5); }
    ctx.stroke();

    ctx.font = '500 9px "IBM Plex Mono", monospace';
    for (const m of marcas) {
      if (m.t < tIni) continue;
      const px = x(m.t);
      ctx.strokeStyle = '#C08A7C';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, topo - 6); ctx.lineTo(px, base); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#A8695A';
      ctx.fillText(m.rotulo, Math.min(px + 3, largura - 46), topo - 6);
    }

    for (const [chave, faixa] of Object.entries(FAIXAS)) {
      const pontos = historico.filter((p) => p.t >= tIni);
      if (pontos.length < 2) continue;
      ctx.strokeStyle = faixa.cor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      pontos.forEach((p, i) => {
        const px = x(p.t), py = y(p[chave], faixa);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
      const ult = pontos[pontos.length - 1];
      ctx.fillStyle = faixa.cor;
      ctx.beginPath(); ctx.arc(x(ult.t), y(ult[chave], faixa), 2.4, 0, Math.PI * 2); ctx.fill();
    }

    if (leitura) {
      const px = x(leitura.t);
      ctx.strokeStyle = '#8C7C74';
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(px, topo - 8); ctx.lineTo(px, base); ctx.stroke();
      ctx.setLineDash([]);
      for (const [chave, faixa] of Object.entries(FAIXAS)) {
        ctx.fillStyle = faixa.cor;
        ctx.beginPath(); ctx.arc(px, y(leitura[chave], faixa), 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FCF1EC'; ctx.lineWidth = 1; ctx.stroke();
      }
    }

    ctx.fillStyle = '#B0776A';
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.fillText(`${Math.round(tIni)}′`, 4, ALTURA - 4);
    ctx.fillText(`${Math.round(tFim)}′`, largura - 26, ALTURA - 4);
  }, [historico, marcas, janelaMin, leitura]);

  function mover(e) {
    if (!historico.length) return;
    const caixa = e.currentTarget.getBoundingClientRect();
    const { tIni, tFim, largura } = escala.current;
    const t = tIni + ((e.clientX - caixa.left - 4) / Math.max(1, largura - 8)) * (tFim - tIni);
    let perto = historico[0];
    for (const p of historico) if (Math.abs(p.t - t) < Math.abs(perto.t - t)) perto = p;
    const px = ((perto.t - tIni) / Math.max(0.1, tFim - tIni)) * (largura - 8) + 4;
    setLeitura({ ...perto, px });
  }

  const doseNoMinuto = leitura
    ? marcas.filter((m) => Math.abs(m.t - leitura.t) < 0.6).map((m) => m.rotulo)
    : [];

  return (
    <div className="tendencia">
      <div className="tendencia__legenda">
        <span className="rotulo">Tendência</span>
        <em style={{ color: '#17110E' }}>FC</em>
        <em style={{ color: '#1B3FA0' }}>PAS</em>
        <em style={{ color: '#2C6A4A' }}>SpO₂</em>
        <span className="tendencia__dica">passe o cursor para ler</span>
      </div>
      <div className="tendencia__papel">
        <canvas ref={ref} onMouseMove={mover} onMouseLeave={() => setLeitura(null)}
          aria-label="Tendência de frequência cardíaca, pressão sistólica e saturação" />
        {leitura && (
          <div className="tendencia__leitura tabular"
            style={{ left: Math.min(Math.max(leitura.px, 4), escala.current.largura - 132) }}>
            <b>{Math.round(leitura.t)}′</b>
            <span style={{ color: '#17110E' }}>FC {leitura.fc}</span>
            <span style={{ color: '#1B3FA0' }}>PAS {leitura.pas}</span>
            <span style={{ color: '#2C6A4A' }}>SpO₂ {leitura.spo2}</span>
            {doseNoMinuto.length > 0 && <em>{doseNoMinuto.join(', ')}</em>}
          </div>
        )}
      </div>
    </div>
  );
}
