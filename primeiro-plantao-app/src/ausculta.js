// Motor de síntese de ausculta. Web Audio puro, sem assets externos.
// Agendamento por lookahead (ctx.currentTime), não setInterval tocando som
// direto — evita o drift de temporizador do JS. Mesmo padrão de "ref lido a
// cada iteração" da FitaECG (fcRef), para acompanhar os vitais ao vivo sem
// recriar o grafo de áudio a cada tick.

const ANTECEDENCIA_S = 0.12; // até onde agendamos à frente
const TICK_MS = 25;          // frequência de checagem do agendador

export function criarAudioContexto() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function tocarThud(ctx, destino, tempo, freq, duracaoS, pico) {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, tempo);
  amp.gain.setValueAtTime(0.0001, tempo);
  amp.gain.linearRampToValueAtTime(pico, tempo + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, tempo + duracaoS);
  osc.connect(amp).connect(destino);
  osc.start(tempo);
  osc.stop(tempo + duracaoS + 0.02);
}

// Coração: lub-dub. Relê fcRef.current a cada batida, então acompanha o
// v.fc ao vivo sem precisar recriar o agendador.
export function iniciarCoracao(ctx, destino, fcRef) {
  let proximo = ctx.currentTime + 0.05;
  let ativo = true;
  const id = setInterval(() => {
    if (!ativo || document.hidden) return;
    while (proximo < ctx.currentTime + ANTECEDENCIA_S) {
      tocarThud(ctx, destino, proximo, 65, 0.09, 0.85);         // lub (B1)
      tocarThud(ctx, destino, proximo + 0.16, 48, 0.07, 0.5);   // dub (B2)
      const fc = Math.max(30, Math.min(220, fcRef.current));
      proximo += 60 / fc;
    }
  }, TICK_MS);
  return { parar: () => { ativo = false; clearInterval(id); } };
}

// Ruído branco em loop — base compartilhada para o sopro respiratório.
function criarRuido(ctx) {
  const dur = 2;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const dados = buf.getChannelData(0);
  for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

const PERFIL_PULMAO = {
  limpo: { freq: 300, q: 0.6, picoInsp: 0.10, picoExp: 0.05 },
  sibilo: { freq: 500, q: 8, picoInsp: 0.08, picoExp: 0.22 },     // mais audível na expiração
  estridor: { freq: 1000, q: 12, picoInsp: 0.24, picoExp: 0.06 }, // mais audível na inspiração
};

// Pulmão: sopro de inspiração/expiração cronometrado por FR, com textura de
// filtro passa-faixa. A gravidade da textura patológica vem só de spo2Ref —
// nunca de uma droga específica — então qualquer tratamento que melhore a
// oxigenação suaviza o som automaticamente.
export function iniciarPulmao(ctx, destino, frRef, spo2Ref, textura) {
  const ruido = criarRuido(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = 'bandpass';
  const envelope = ctx.createGain();
  envelope.gain.value = 0;
  ruido.connect(filtro).connect(envelope).connect(destino);
  ruido.start();

  let proximo = ctx.currentTime + 0.05;
  let ativo = true;
  const perfil = PERFIL_PULMAO[textura] || PERFIL_PULMAO.limpo;

  const id = setInterval(() => {
    if (!ativo || document.hidden) return;
    while (proximo < ctx.currentTime + ANTECEDENCIA_S) {
      const fr = Math.max(6, Math.min(60, frRef.current));
      const ciclo = 60 / fr;
      const gravidade = Math.max(0, Math.min(1, (94 - spo2Ref.current) / 15));
      const inspS = ciclo * 0.4, expS = ciclo * 0.6;

      filtro.frequency.setValueAtTime(perfil.freq, proximo);
      filtro.Q.setValueAtTime(perfil.q, proximo);
      envelope.gain.setValueAtTime(0.0001, proximo);
      envelope.gain.linearRampToValueAtTime(perfil.picoInsp * (0.4 + 0.6 * gravidade), proximo + inspS * 0.3);
      envelope.gain.linearRampToValueAtTime(0.0001, proximo + inspS);
      envelope.gain.linearRampToValueAtTime(perfil.picoExp * (0.4 + 0.6 * gravidade), proximo + inspS + expS * 0.3);
      envelope.gain.linearRampToValueAtTime(0.0001, proximo + ciclo);

      proximo += ciclo;
    }
  }, TICK_MS);

  return { parar: () => { ativo = false; clearInterval(id); try { ruido.stop(); } catch { /* já parado */ } } };
}
