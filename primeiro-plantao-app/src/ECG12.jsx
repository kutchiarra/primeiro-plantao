import { useEffect, useRef } from 'react';
import { amplitude } from './FitaECG.jsx';

// ECG de 12 derivações como o papel que sai da máquina: quatro colunas de três
// derivações e uma tira de ritmo em D2 embaixo. O supra do caso é distribuído
// pelas derivações — parede inferior sobe em D2, D3 e aVF e desce em D1 e aVL.
const MM = 3.2;
const LINHA_S = 2.4;   // segundos por coluna
const RITMO_S = 9.6;

const DERIVACOES = [
  [{ nome: 'I', amp: 0.62, st: -0.35 }, { nome: 'aVR', amp: -0.48, st: -0.40 }, { nome: 'V1', amp: 0.45, st: 0.02 }, { nome: 'V4', amp: 1.10, st: 0.00 }],
  [{ nome: 'II', amp: 1.00, st: 1.00 }, { nome: 'aVL', amp: -0.34, st: -0.50 }, { nome: 'V2', amp: 0.90, st: 0.05 }, { nome: 'V5', amp: 0.85, st: 0.02 }],
  [{ nome: 'III', amp: 0.88, st: 1.05 }, { nome: 'aVF', amp: 0.95, st: 1.00 }, { nome: 'V3', amp: 1.00, st: 0.05 }, { nome: 'V6', amp: 0.60, st: 0.02 }],
];

export default function ECG12({ fc, supra = 0, paciente, minuto }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const largura = cv.parentElement.clientWidth || 460;
    const alturaLinha = 24 * MM;
    const altura = alturaLinha * 3 + 30 * MM + 26;
    cv.width = Math.round(largura * dpr);
    cv.height = Math.round(altura * dpr);
    cv.style.width = largura + 'px';
    cv.style.height = altura + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#FCF1EC';
    ctx.fillRect(0, 0, largura, altura);

    // papel milimetrado
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#F3DAD2';
    ctx.beginPath();
    for (let x = 0; x < largura; x += MM) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, altura); }
    for (let y = 0; y < altura; y += MM) { ctx.moveTo(0, y + .5); ctx.lineTo(largura, y + .5); }
    ctx.stroke();
    ctx.strokeStyle = '#E7B4A5';
    ctx.beginPath();
    for (let x = 0; x < largura; x += 5 * MM) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, altura); }
    for (let y = 0; y < altura; y += 5 * MM) { ctx.moveTo(0, y + .5); ctx.lineTo(largura, y + .5); }
    ctx.stroke();

    const rr = 60 / Math.max(30, fc);
    const desenhar = (der, x0, y0, larguraPx, segundos, deslocamento = 0) => {
      ctx.strokeStyle = '#17110E';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const passos = Math.floor(larguraPx);
      for (let i = 0; i < passos; i++) {
        const t = deslocamento + (i / passos) * segundos;
        const f = (t % rr) / rr;
        const val = amplitude(f, supra * der.st) * der.amp;
        const y = y0 - val * 10 * MM;
        i === 0 ? ctx.moveTo(x0 + i, y) : ctx.lineTo(x0 + i, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#17110E';
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillText(der.nome, x0 + 4, y0 - 9 * MM);
    };

    const colunas = 4;
    const larguraCol = (largura - 8) / colunas;
    DERIVACOES.forEach((linha, l) => {
      const y = 26 + alturaLinha * l + alturaLinha * 0.55;
      linha.forEach((der, c) => {
        desenhar(der, 4 + larguraCol * c, y, larguraCol - 6, LINHA_S, c * LINHA_S);
        if (c > 0) {
          ctx.strokeStyle = '#D9A492';
          ctx.beginPath();
          ctx.moveTo(4 + larguraCol * c - 3, y - 8 * MM);
          ctx.lineTo(4 + larguraCol * c - 3, y + 8 * MM);
          ctx.stroke();
        }
      });
    });

    // tira de ritmo
    const yRitmo = 26 + alturaLinha * 3 + 14 * MM;
    desenhar({ nome: 'II · ritmo', amp: 1, st: 1 }, 4, yRitmo, largura - 12, RITMO_S);

    // cabeçalho impresso
    ctx.fillStyle = '#A8695A';
    ctx.font = '500 9.5px "IBM Plex Mono", monospace';
    ctx.fillText(`${paciente}   FC ${fc} bpm   25 mm/s   10 mm/mV   minuto ${minuto}`, 5, 14);
  }, [fc, supra, paciente, minuto]);

  return <canvas ref={ref} className="ecg12" aria-label="Eletrocardiograma de 12 derivações" />;
}
