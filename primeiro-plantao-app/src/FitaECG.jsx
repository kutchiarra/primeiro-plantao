import { useEffect, useRef } from 'react';

// Fita de ECG: papel milimetrado que corre da direita para a esquerda,
// com a agulha parada na ponta. 25 mm/s, 10 mm/mV, como no impresso.
const MM = 4;            // px por milímetro
const PX_S = 25 * MM;    // 25 mm/s
const HZ = PX_S;         // 1 amostra por pixel
const ALTURA = 170;

// Morfologia PQRST em fração do intervalo RR. supra = elevação do segmento ST
// em mV — é o supradesnivelamento de parede inferior deste caso, em D2.
export function amplitude(f, supra) {
  if (f < 0.08) return 0;
  if (f < 0.18) return 0.14 * Math.sin(((f - 0.08) / 0.1) * Math.PI);   // onda P
  if (f < 0.225) return 0;                                              // PR
  if (f < 0.245) return -0.09 * ((f - 0.225) / 0.02);                   // Q
  if (f < 0.265) return -0.09 + 1.35 * ((f - 0.245) / 0.02);            // R
  if (f < 0.295) return 1.26 - 1.55 * ((f - 0.265) / 0.03);             // S
  if (f < 0.34) return -0.29 + (0.29 + supra) * ((f - 0.295) / 0.045);  // volta ao ST
  if (f < 0.44) return supra;                                           // segmento ST
  if (f < 0.66) return supra + 0.34 * Math.sin(((f - 0.44) / 0.22) * Math.PI); // T apiculada
  return 0;
}

export default function FitaECG({ fc, supra = 0.26, rotulo = 'II' }) {
  const canvasRef = useRef(null);
  const buffer = useRef([]);
  const fase = useRef(0);
  const passo = useRef(0);
  const fcRef = useRef(fc);
  fcRef.current = fc;

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let larguraCss = 0, raf = 0, anterior = performance.now(), acumulado = 0;

    const medir = () => {
      const dpr = window.devicePixelRatio || 1;
      larguraCss = cv.parentElement.clientWidth || 600;
      cv.width = Math.round(larguraCss * dpr);
      cv.height = Math.round(ALTURA * dpr);
      cv.style.width = larguraCss + 'px';
      cv.style.height = ALTURA + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(cv.parentElement);

    const amostrar = () => {
      const rr = 60 / Math.max(30, fcRef.current);
      fase.current += 1 / HZ / rr;
      if (fase.current >= 1) fase.current -= 1;
      const base = Math.sin(passo.current / 260) * 0.02;      // deriva da linha de base
      const ruido = (Math.random() - 0.5) * 0.012;
      buffer.current.push(amplitude(fase.current, supra) + base + ruido);
      passo.current += 1;
      if (buffer.current.length > 3000) buffer.current.shift();
    };

    const grade = (deslocamento) => {
      const off = deslocamento % (5 * MM);
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#F3DAD2';
      ctx.beginPath();
      for (let x = -off; x < larguraCss; x += MM) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, ALTURA); }
      for (let y = 0; y < ALTURA; y += MM) { ctx.moveTo(0, y + 0.5); ctx.lineTo(larguraCss, y + 0.5); }
      ctx.stroke();
      ctx.strokeStyle = '#E3A797';
      ctx.beginPath();
      for (let x = -off; x < larguraCss; x += 5 * MM) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, ALTURA); }
      for (let y = ALTURA % (5 * MM); y < ALTURA; y += 5 * MM) { ctx.moveTo(0, y + 0.5); ctx.lineTo(larguraCss, y + 0.5); }
      ctx.stroke();
    };

    const desenhar = () => {
      const meio = ALTURA * 0.62;
      ctx.fillStyle = '#FCF1EC';
      ctx.fillRect(0, 0, larguraCss, ALTURA);
      grade(passo.current);

      const n = buffer.current.length;
      const visiveis = Math.min(n, Math.floor(larguraCss));
      ctx.strokeStyle = '#17110E';
      ctx.lineWidth = 1.7;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < visiveis; i++) {
        const v = buffer.current[n - visiveis + i];
        const x = larguraCss - visiveis + i;
        const y = meio - v * 10 * MM;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // agulha
      const ultimo = meio - (buffer.current[n - 1] || 0) * 10 * MM;
      ctx.fillStyle = '#17110E';
      ctx.beginPath();
      ctx.moveTo(larguraCss, ultimo - 5);
      ctx.lineTo(larguraCss, ultimo + 5);
      ctx.lineTo(larguraCss - 7, ultimo);
      ctx.closePath();
      ctx.fill();

      // etiqueta impressa no papel
      ctx.fillStyle = '#B0776A';
      ctx.font = '500 10px "IBM Plex Mono", monospace';
      ctx.fillText(`${rotulo}   25 mm/s   10 mm/mV`, 10, 16);
    };

    const laco = (agora) => {
      // A largura pode mudar sem que o ResizeObserver veja (painel oculto no
      // primeiro quadro, por exemplo). Reconferir por quadro é barato.
      const atual = cv.parentElement.clientWidth || 600;
      if (atual !== larguraCss) medir();
      const dt = Math.min(0.1, (agora - anterior) / 1000);
      anterior = agora;
      acumulado += dt;
      const alvo = 1 / HZ;
      while (acumulado >= alvo) { amostrar(); acumulado -= alvo; }
      desenhar();
      raf = requestAnimationFrame(laco);
    };

    // Preenche a fita antes do primeiro quadro: em aba oculta o navegador não
    // chama requestAnimationFrame, e o papel apareceria em branco na volta.
    for (let i = 0; i < 1400; i++) amostrar();
    desenhar();
    if (!reduzido) raf = requestAnimationFrame(laco);
    const aoVoltar = () => { if (!document.hidden) { medir(); desenhar(); } };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [supra, rotulo]);

  return <canvas ref={canvasRef} className="fita" aria-label="Traçado de ECG, derivação II" />;
}
