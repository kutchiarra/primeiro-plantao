import { useEffect, useRef, useState } from 'react';

// Registrador multicanal no mesmo papel da fita: uma faixa por parâmetro, com
// escala própria. Três escalas empilhadas no mesmo quadro só confundem quem lê.
// As marcas verticais são as injeções — é onde se vê o remédio agindo.
// Passar o cursor lê o papel ponto a ponto, como quem confere o impresso.
const FAIXAS = {
  fc: { min: 40, max: 190, cor: '#17110E', rotulo: 'FC' },
  pas: { min: 40, max: 220, cor: '#1B3FA0', rotulo: 'PAS' },
  spo2: { min: 70, max: 100, cor: '#2C6A4A', rotulo: 'SpO₂' },
};
const ORDEM = ['fc', 'pas', 'spo2'];
const BANDA = 42;
const MARGEM = 42;

export default function Tendencia({ historico, marcas, janelaMin = 30 }) {
  const ref = useRef(null);
  const escala = useRef({ tIni: 0, tFim: janelaMin, largura: 440 });
  const [leitura, setLeitura] = useState(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const largura = cv.parentElement.clientWidth || 440;
    const altura = ORDEM.length * BANDA + 18;
    cv.width = Math.round(largura * dpr);
    cv.height = Math.round(altura * dpr);
    cv.style.width = largura + 'px';
    cv.style.height = altura + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tFim = Math.max(janelaMin, historico.length ? historico[historico.length - 1].t : 0);
    const tIni = Math.max(0, tFim - janelaMin);
    escala.current = { tIni, tFim, largura };
    const x = (t) => ((t - tIni) / Math.max(0.1, tFim - tIni)) * (largura - MARGEM - 4) + MARGEM;

    ctx.fillStyle = '#FCF1EC';
    ctx.fillRect(0, 0, largura, altura);
    const pontos = historico.filter((p) => p.t >= tIni);

    ORDEM.forEach((chave, i) => {
      const fx = FAIXAS[chave];
      const topo = 8 + i * BANDA, base = topo + BANDA - 14;
      const y = (valor) => base - ((valor - fx.min) / (fx.max - fx.min)) * (base - topo);

      ctx.strokeStyle = '#F0D3CB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGEM, base + 0.5); ctx.lineTo(largura - 4, base + 0.5);
      ctx.moveTo(MARGEM, topo + 0.5); ctx.lineTo(largura - 4, topo + 0.5);
      ctx.stroke();

      ctx.fillStyle = fx.cor;
      ctx.font = '500 9.5px "IBM Plex Mono", monospace';
      ctx.fillText(fx.rotulo, 4, topo + 11);
      ctx.fillStyle = '#8C7C74';
      ctx.font = '500 8.5px "IBM Plex Mono", monospace';
      ctx.fillText(fx.max, 4, topo + 22);
      ctx.fillText(fx.min, 4, base);

      if (pontos.length > 1) {
        ctx.strokeStyle = fx.cor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pontos.forEach((p, j) => {
          const px = x(p.t), py = y(p[chave]);
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        });
        ctx.stroke();
        const ult = pontos[pontos.length - 1];
        ctx.fillStyle = fx.cor;
        ctx.beginPath(); ctx.arc(x(ult.t), y(ult[chave]), 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.font = '500 11px "IBM Plex Mono", monospace';
        ctx.fillText(ult[chave], Math.min(x(ult.t) + 6, largura - 30), y(ult[chave]) - 5);
      }

      if (leitura) {
        ctx.fillStyle = fx.cor;
        ctx.beginPath(); ctx.arc(x(leitura.t), y(leitura[chave]), 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#FCF1EC'; ctx.lineWidth = 1; ctx.stroke();
      }
    });

    const alturaFaixas = ORDEM.length * BANDA;
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    for (const m of marcas) {
      if (m.t < tIni) continue;
      const px = x(m.t);
      ctx.strokeStyle = '#C08A7C';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px, alturaFaixas); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#A8695A';
      ctx.fillText(m.rotulo, Math.min(px + 3, largura - 46), alturaFaixas + 9);
    }

    if (leitura) {
      const px = x(leitura.t);
      ctx.strokeStyle = '#8C7C74';
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px, alturaFaixas); ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = '#B0776A';
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.fillText(`${Math.round(tIni)}′`, MARGEM, altura - 3);
    ctx.fillText(`${Math.round(tFim)}′`, largura - 26, altura - 3);
  }, [historico, marcas, janelaMin, leitura]);

  function mover(e) {
    if (!historico.length) return;
    const caixa = e.currentTarget.getBoundingClientRect();
    const { tIni, tFim, largura } = escala.current;
    const t = tIni + ((e.clientX - caixa.left - MARGEM) / Math.max(1, largura - MARGEM - 4)) * (tFim - tIni);
    let perto = historico[0];
    for (const p of historico) if (Math.abs(p.t - t) < Math.abs(perto.t - t)) perto = p;
    const px = ((perto.t - tIni) / Math.max(0.1, tFim - tIni)) * (largura - MARGEM - 4) + MARGEM;
    setLeitura({ ...perto, px });
  }

  const doseNoMinuto = leitura
    ? marcas.filter((m) => Math.abs(m.t - leitura.t) < 0.6).map((m) => m.rotulo)
    : [];

  return (
    <div className="tendencia">
      <div className="tendencia__legenda">
        <span className="rotulo">Tendência</span>
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
