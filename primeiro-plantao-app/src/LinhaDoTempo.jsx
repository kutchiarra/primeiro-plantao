import { useEffect, useRef, useState } from 'react';

// A linha do tempo do atendimento: o que a lista de achados não mostra.
// A lista diz "ECG pedido no minuto 14". Isto mostra os 14 minutos —
// e o vazio entre uma ação e a próxima, que é o que ensina ritmo.
// Cada marca é um dado: nada aqui é ornamento.
const REGISTROS = [
  { chave: 'perguntas', rotulo: 'perguntas' },
  { chave: 'exame', rotulo: 'exame físico' },
  { chave: 'exames', rotulo: 'exames' },
  { chave: 'condutas', rotulo: 'condutas' },
  { chave: 'pressao', rotulo: 'PA sistólica' },
];
const ALT = 34;
const TOPO = 26;
const RAIL = 78;

export default function LinhaDoTempo({ linha, minFinal }) {
  const ref = useRef(null);
  const [leitura, setLeitura] = useState(null);
  const escala = useRef({ x0: RAIL, larg: 400, tMax: 1 });

  const altura = TOPO + REGISTROS.length * ALT + 26;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const largura = cv.parentElement.clientWidth || 640;
    cv.width = Math.round(largura * dpr);
    cv.height = Math.round(altura * dpr);
    cv.style.width = largura + 'px';
    cv.style.height = altura + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const x0 = RAIL, x1 = largura - 10;
    const tMax = Math.max(minFinal, 10, ...linha.metas.map((m) => m.t));
    escala.current = { x0, larg: x1 - x0, tMax };
    const X = (t) => x0 + ((x1 - x0) * t) / tMax;
    const base = (i) => TOPO + i * ALT + ALT - 10;

    ctx.fillStyle = '#FCF1EC';
    ctx.fillRect(0, 0, largura, altura);

    // papel milimetrado, só sob o campo
    ctx.lineWidth = 1;
    for (const [cor, passo] of [['#F3DAD2', 4], ['#E7B4A5', 20]]) {
      ctx.strokeStyle = cor;
      ctx.beginPath();
      for (let x = x0; x <= x1; x += passo) { ctx.moveTo(x + .5, TOPO - 8); ctx.lineTo(x + .5, altura - 22); }
      for (let y = TOPO - 8; y <= altura - 22; y += passo) { ctx.moveTo(x0, y + .5); ctx.lineTo(x1, y + .5); }
      ctx.stroke();
    }

    // metas do caso: as janelas que a diretriz impõe
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    for (const m of linha.metas) {
      const px = X(m.t);
      const estourou = m.feitoEm == null || m.feitoEm > m.t;
      ctx.strokeStyle = estourou ? '#B8241C' : '#2C6A4A';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(px, TOPO - 8); ctx.lineTo(px, altura - 22); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = estourou ? '#B8241C' : '#2C6A4A';
      ctx.fillText(m.rotulo, Math.min(px + 3, largura - 62), TOPO - 12);
    }

    // linhas de base e rótulos dos registros
    REGISTROS.forEach((r, i) => {
      const y = base(i);
      ctx.strokeStyle = '#D9C3B9';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, y + .5); ctx.lineTo(x1, y + .5); ctx.stroke();
      ctx.fillStyle = '#74645C';
      ctx.font = '500 9px "IBM Plex Mono", monospace';
      ctx.fillText(r.rotulo, 4, y);
    });

    const tique = (i, t, cor, alt = 16, larg = 1.2) => {
      const y = base(i), px = X(t);
      ctx.strokeStyle = cor; ctx.lineWidth = larg;
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y - alt); ctx.stroke();
    };

    for (const t of linha.perguntas) tique(0, t, '#1B3FA0', 14, 1);
    for (const t of linha.exame) tique(1, t, '#17110E', 14, 1);

    // exames: a barra é a espera; vazada quando o resultado nunca foi aberto
    const yEx = base(2);
    for (const p of linha.exames) {
      const a = X(p.minuto), b = X(Math.min(p.prontoEm, tMax));
      ctx.fillStyle = p.visto ? '#17110E' : '#FCF1EC';
      ctx.strokeStyle = p.indicado ? '#17110E' : '#B8241C';
      ctx.lineWidth = 1.3;
      // tracejada = o resultado chegou e ficou fechado
      ctx.setLineDash(p.visto ? [] : [3, 2]);
      ctx.beginPath(); ctx.rect(a, yEx - 13, Math.max(4, b - a), 9);
      ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
    }

    // condutas: contraindicado sai em carmim
    for (const c of linha.condutas) {
      tique(3, c.minuto, c.classe === 'contraindicado' ? '#B8241C' : c.classe === 'esperado' ? '#2C6A4A' : '#17110E', 16, 1.4);
    }

    // pressão sistólica: a consequência, no mesmo eixo
    const yP = base(4), h = 22;
    const pas = linha.historico.filter((p) => p.pas);
    if (pas.length > 1) {
      const min = 50, max = 200;
      ctx.strokeStyle = '#1B3FA0'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      pas.forEach((p, i) => {
        const px = X(Math.min(p.t, tMax));
        const py = yP - ((p.pas - min) / (max - min)) * h;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // eixo do tempo
    ctx.fillStyle = '#B0776A';
    ctx.font = '500 9px "IBM Plex Mono", monospace';
    ctx.fillText('0′', x0, altura - 8);
    ctx.fillText(Math.round(tMax) + '′', x1 - 22, altura - 8);

    if (leitura != null) {
      const px = X(leitura);
      ctx.strokeStyle = '#74645C';
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(px, TOPO - 8); ctx.lineTo(px, altura - 22); ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [linha, minFinal, altura, leitura]);

  function mover(e) {
    const caixa = e.currentTarget.getBoundingClientRect();
    const { x0, larg, tMax } = escala.current;
    const t = ((e.clientX - caixa.left - x0) / Math.max(1, larg)) * tMax;
    setLeitura(Math.max(0, Math.min(tMax, t)));
  }

  const noMinuto = leitura == null ? [] : [
    ...linha.condutas.filter((c) => Math.abs(c.minuto - leitura) < 0.8).map((c) => c.nome),
    ...linha.exames.filter((p) => Math.abs(p.minuto - leitura) < 0.8).map((p) => p.nome),
  ];

  return (
    <section className="cronologia">
      <h2 className="rotulo">A linha do tempo do seu atendimento</h2>
      <p className="cronologia__nota">
        Cada marca é uma ação sua, no minuto em que aconteceu. A barra de exame é a espera pelo resultado:
        cheia quer dizer que você abriu, tracejada quer dizer que ficou pronto e você não olhou.
        As verticais são as janelas do caso — verdes quando cumpridas, vermelhas quando estouraram.
      </p>
      <div className="cronologia__papel">
        <canvas ref={ref} onMouseMove={mover} onMouseLeave={() => setLeitura(null)}
          aria-label="Linha do tempo do atendimento por registros" />
        {leitura != null && (
          <div className="cronologia__leitura tabular">
            {Math.round(leitura)}′{noMinuto.length > 0 && <em>{noMinuto.join(' · ')}</em>}
          </div>
        )}
      </div>
      <ul className="cronologia__legenda">
        <li className="lg-azul">pergunta</li>
        <li className="lg-tinta">exame</li>
        <li className="lg-verde">conduta esperada</li>
        <li className="lg-vermelho">contraindicada · janela estourada</li>
      </ul>
    </section>
  );
}
