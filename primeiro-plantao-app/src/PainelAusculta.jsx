import { useEffect, useRef, useState } from 'react';
import { iniciarCoracao, iniciarPulmao } from './ausculta.js';

const ALTURA = 96;

// Painel de ausculta/pulso: canvas + requestAnimationFrame, mesmo padrão da
// FitaECG (ref lido a cada quadro, sem re-assinar o efeito por mudança de
// vitais). Cria o grafo de áudio uma vez por manobra e o desliga no cleanup.
export default function PainelAusculta({ manobra, v, audioCtx, aoFechar }) {
  const canvasRef = useRef(null);
  const vRef = useRef(v);
  // Mesmo motivo da FitaECG: o agendador de áudio lê o ref a cada batida.
  useEffect(() => { vRef.current = v; }, [v]);
  const [mudo, setMudo] = useState(false);
  const ganhoRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx2d = cv.getContext('2d');
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let larguraCss = 0, raf = 0;

    const medir = () => {
      const dpr = window.devicePixelRatio || 1;
      larguraCss = cv.parentElement.clientWidth || 400;
      cv.width = Math.round(larguraCss * dpr);
      cv.height = Math.round(ALTURA * dpr);
      cv.style.width = larguraCss + 'px';
      cv.style.height = ALTURA + 'px';
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(cv.parentElement);

    let no = null;
    let ganho = null;
    if (manobra.tipo === 'ausculta-cardiaca' || manobra.tipo === 'ausculta-pulmonar') {
      ganho = audioCtx.createGain();
      ganho.gain.value = mudo ? 0 : 1;
      ganho.connect(audioCtx.destination);
      ganhoRef.current = ganho;
      no = manobra.tipo === 'ausculta-cardiaca'
        ? iniciarCoracao(audioCtx, ganho, { get current() { return vRef.current.fc; } })
        : iniciarPulmao(audioCtx, ganho,
            { get current() { return vRef.current.fr; } },
            { get current() { return vRef.current.spo2; } },
            manobra.som?.textura);
    }

    let fase = 0;
    const desenhar = () => {
      ctx2d.fillStyle = '#FCF1EC';
      ctx2d.fillRect(0, 0, larguraCss, ALTURA);
      ctx2d.strokeStyle = '#17110E';
      ctx2d.lineWidth = 1.6;
      ctx2d.beginPath();
      const meio = ALTURA / 2;
      const passos = Math.max(1, Math.floor(larguraCss));
      for (let x = 0; x < passos; x++) {
        let y;
        if (manobra.tipo === 'pulso') {
          const fc = Math.max(30, vRef.current.fc);
          const rr = 60 / fc;
          const amplitude = vRef.current.pas < 90 ? 6 : 16; // pulso fino quando PA baixa
          const f = (((x / passos) * 6 + fase) % rr) / rr;
          y = meio - Math.max(0, Math.sin(f * Math.PI)) ** 3 * amplitude;
        } else {
          y = meio + Math.sin((x / passos) * 8 * Math.PI + fase * 6) * 8;
        }
        if (x === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
      }
      ctx2d.stroke();
    };

    const laco = () => {
      fase += 0.02;
      desenhar();
      raf = requestAnimationFrame(laco);
    };
    desenhar();
    if (!reduzido) raf = requestAnimationFrame(laco);

    const aoVoltar = () => { if (!document.hidden) { medir(); desenhar(); } };
    document.addEventListener('visibilitychange', aoVoltar);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', aoVoltar);
      no?.parar();
      ganho?.disconnect();
      ganhoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manobra.id, audioCtx]);

  // Alterna mudo sobre o grafo de áudio já existente, sem recriar osciladores.
  useEffect(() => {
    ganhoRef.current?.gain.setTargetAtTime(mudo ? 0 : 1, audioCtx.currentTime, 0.05);
  }, [mudo, audioCtx]);

  return (
    <div className="painel-ausculta">
      <div className="painel-ausculta__topo">
        <b>{manobra.nome}</b>
        <div className="painel-ausculta__acoes">
          {manobra.tipo !== 'pulso' && (
            <button type="button" className="secundario" onClick={() => setMudo((m) => !m)}>
              {mudo ? 'Ativar som' : 'Silenciar'}
            </button>
          )}
          <button type="button" className="secundario" onClick={aoFechar}>Fechar</button>
        </div>
      </div>
      <canvas ref={canvasRef} aria-label={`Traçado de ${manobra.nome.toLowerCase()}`} />
      <p className="painel-ausculta__achado tabular">{manobra.achado(v)}</p>
    </div>
  );
}
