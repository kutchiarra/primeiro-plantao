import { acharExame, acharFarmaco } from './dados/catalogo.js';

export const ACELERACAO = 30; // 1 s real = 30 s de plantão

const semAcento = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const limite = (v, min, max) => Math.max(min, Math.min(max, v));

// ---------------------------------------------------------------------------
// Fala da paciente. Casamento por gatilho: é o Bloco B do prompt, sem o modelo.
// ---------------------------------------------------------------------------
export function responder(caso, textoDoMedico, jaRevelado) {
  const t = semAcento(textoDoMedico);
  const bate = (item) => item.gatilhos.some((g) => t.includes(semAcento(g)));

  for (const s of caso.segredos) if (bate(s)) return { fala: s.fala, revelou: s.chave };
  for (const r of caso.roteiro) {
    if (bate(r) && !jaRevelado.includes(r.chave)) return { fala: r.fala, revelou: r.chave };
  }
  for (const r of caso.roteiro) if (bate(r)) return { fala: 'Isso eu já falei, doutor. ' + r.fala, revelou: null };
  const e = caso.evasivas;
  return { fala: e[Math.floor(Math.random() * e.length)], revelou: null };
}

const JARGAO = ['precordial', 'dispneia', 'diaforese', 'epigastralgia', 'sincope',
  'anamnese', 'iamcsst', 'sca', 'tep', 'supra de st', 'anafilaxia', 'broncoespasmo'];

export function lerPostura(falasDoMedico) {
  const todas = falasDoMedico.map(semAcento).join(' ');
  return {
    apresentou: /(meu nome e|sou (o|a) (dr|dra|doutor|doutora|medic))|vou te atender|me chamo/.test(todas),
    explicou: /(vou (te )?(examinar|pedir|passar|dar|colocar|aplicar))|(voce vai sentir)|(a senhora vai sentir)|(eu vou)/.test(todas),
    acolheu: /(medo|preocupa|calma|estou aqui|to aqui|entendeu|tudo bem)/.test(todas),
    usouJargao: JARGAO.some((j) => todas.includes(j)),
    perguntas: falasDoMedico.length,
  };
}

// ---------------------------------------------------------------------------
// Farmacodinâmica. Curva triangular: sobe de início até o pico, decai até o
// fim da duração. A dose escala o efeito; a interação do caso amplifica.
// ---------------------------------------------------------------------------
export function fracaoDoEfeito(pd, dt) {
  if (dt < pd.inicio) return 0;
  if (dt >= pd.duracao) return 0;
  if (dt < pd.pico) return (dt - pd.inicio) / Math.max(0.1, pd.pico - pd.inicio);
  return 1 - (dt - pd.pico) / Math.max(0.1, pd.duracao - pd.pico);
}

const PARAMETROS = ['fc', 'pas', 'pad', 'spo2', 'fr', 'temp', 'etco2', 'dor'];

// Estado fisiológico como função pura do tempo: mesma linha do tempo, mesmos
// números. É o que permite redesenhar a tendência inteira a qualquer momento.
export function estado(caso, tMin, administracoes) {
  const base = { ...caso.base };
  const deriva = caso.evolucao ? caso.evolucao(tMin) : {};
  for (const k of PARAMETROS) if (deriva[k]) base[k] += deriva[k];

  const ativos = [];
  for (const adm of administracoes) {
    const f = acharFarmaco(adm.id);
    if (!f) continue;
    const dt = tMin - adm.minuto;
    const frac = fracaoDoEfeito(f.pd, dt);
    const inter = caso.interacoes?.[adm.id];
    const amp = inter?.fator ?? 1;
    const contrib = {};
    for (const [k, valor] of Object.entries(f.pd.efeito)) {
      const delta = valor * frac * adm.fator * amp;
      contrib[k] = delta;
      base[k] = (base[k] ?? 0) + delta;
    }
    if (dt >= 0) {
      ativos.push({
        ...adm, nome: f.nome, via: f.via, nota: f.nota, contrib, amp,
        motivo: inter?.motivo, frac,
        fase: dt < f.pd.inicio ? 'latencia' : dt < f.pd.pico ? 'subindo' : frac > 0 ? 'caindo' : 'terminado',
        restante: Math.max(0, f.pd.duracao - dt),
      });
    }
  }

  // Ruído fisiológico determinístico: some se o tempo for o mesmo.
  const osc = (k) => Math.sin(tMin * k) * 1.4;
  const v = {
    fc: Math.round(limite(base.fc + osc(6.1), 20, 220)),
    pas: Math.round(limite(base.pas + osc(4.3), 40, 260)),
    pad: Math.round(limite(base.pad + osc(3.7), 20, 160)),
    spo2: Math.round(limite(base.spo2, 50, 100)),
    fr: Math.round(limite(base.fr, 4, 60)),
    temp: Math.round(limite(base.temp, 33, 42) * 10) / 10,
    etco2: Math.round(limite(base.etco2, 10, 70)),
    dor: Math.round(limite(base.dor, 0, 10)),
  };
  v.pam = Math.round((v.pas + 2 * v.pad) / 3);
  return { v, ativos };
}

export const gravidade = (v) =>
  v.pas < 90 || v.spo2 < 90 || v.fc > 150 || v.pam < 65 ? 'critico'
    : v.pas < 100 || v.spo2 < 93 || v.fr > 28 ? 'atencao' : 'estavel';

// ---------------------------------------------------------------------------
// Leitura do gabarito do caso, com padrão para o que não está listado.
// ---------------------------------------------------------------------------
export const labDoCaso = (caso, id) =>
  caso.labs[id] || { indicado: false, aceitavel: false, peso: 0, flag: 'normal',
    resultado: 'Sem alterações relevantes para este caso.' };

export const condutaDoCaso = (caso, id) =>
  caso.condutas[id] || { classe: 'desnecessario', peso: 2,
    explicacao: 'Não faz parte do manejo deste caso.' };

// ---------------------------------------------------------------------------
// Pontuação. Anamnese, investigação e conduta são determinísticas.
// ---------------------------------------------------------------------------
const CUSTO_REF = 120;

export function pontuar(caso, { revelados, pedidos, administracoes, postura, hipotese, minFinal }) {
  const achados = [];

  // Anamnese ---------------------------------------------------------------
  const universo = [...caso.roteiro, ...caso.segredos];
  const pesoTotal = universo.reduce((s, r) => s + r.peso, 0);
  const ganhoA = universo.filter((r) => revelados.includes(r.chave)).reduce((s, r) => s + r.peso, 0);
  const anamnese = Math.round((ganhoA / pesoTotal) * 25);
  for (const r of universo) {
    if (!revelados.includes(r.chave) && r.peso >= 4) {
      achados.push({ pilar: 'Anamnese', severidade: r.critico ? 'critico' : 'importante',
        titulo: `Não perguntou: ${r.rotulo.toLowerCase()}`,
        texto: r.critico
          ? 'Era a informação que mudava a conduta, e a paciente não ia oferecer sozinha.'
          : 'Tema de peso alto no raciocínio deste caso. Ficou fora da sua anamnese.' });
    }
  }

  // Investigação -----------------------------------------------------------
  let ganho = 0, desperdicio = 0;
  for (const p of pedidos) {
    const ex = acharExame(p.id), g = labDoCaso(caso, p.id);
    if (!ex) continue;
    if (g.indicado || g.aceitavel) {
      ganho += g.peso;
      if (!p.visto && minFinal >= p.prontoEm) {
        desperdicio += 1;
        achados.push({ pilar: 'Investigação', severidade: 'refinamento',
          titulo: `Pediu e não abriu: ${ex.nome}`,
          texto: 'O resultado ficou pronto e você encerrou sem olhar.' });
      }
      if (g.metaMin && p.minuto > g.metaMin) {
        achados.push({ pilar: 'Investigação', severidade: 'importante',
          titulo: `${ex.nome} pedido no minuto ${p.minuto}`,
          texto: `A meta deste exame é ${g.metaMin} minutos da chegada.` });
      }
    } else {
      const base = ex.custo / CUSTO_REF + ((ex.invasivo || 1) - 1) * 0.4;
      desperdicio += base;
      achados.push({ pilar: 'Investigação', severidade: ex.custo > 500 ? 'importante' : 'refinamento',
        titulo: `Fora do racional: ${ex.nome}`,
        texto: `R$ ${ex.custo} e ${ex.tat} min do relógio, sem mudar a sua conduta aqui.` });
    }
  }
  const pesoMaxInv = Object.values(caso.labs).filter((l) => l.indicado).reduce((s, l) => s + l.peso, 0) || 1;
  const investigacao = limite(Math.round(((ganho - desperdicio) / pesoMaxInv) * 25), 0, 25);

  for (const [id, g] of Object.entries(caso.labs)) {
    if (g.indicado && g.peso >= 8 && !pedidos.some((p) => p.id === id)) {
      achados.push({ pilar: 'Investigação', severidade: 'critico',
        titulo: `Não pediu: ${acharExame(id)?.nome}`,
        texto: 'Sem este exame o caso não fecha.' });
    }
  }

  // Conduta ----------------------------------------------------------------
  let pontos = 0;
  const pesoMaxCond = Object.values(caso.condutas).filter((c) => c.classe === 'esperado')
    .reduce((s, c) => s + c.peso, 0) || 1;
  const jaContado = new Set();
  for (const a of administracoes) {
    const c = condutaDoCaso(caso, a.id), f = acharFarmaco(a.id);
    if (!f || jaContado.has(a.id)) continue;
    jaContado.add(a.id);
    if (c.classe === 'esperado') {
      const dentro = a.minuto <= (c.janela ?? 999);
      pontos += dentro ? c.peso : c.peso / 2;
      if (!dentro) {
        achados.push({ pilar: 'Conduta', severidade: 'importante',
          titulo: `${f.nome} fora da janela`,
          texto: `Feito no minuto ${a.minuto}; a janela é de ${c.janela} min. Vale metade.` });
      }
    } else if (c.classe === 'contraindicado') {
      pontos -= c.peso * 2;
      achados.push({ pilar: 'Conduta', severidade: 'critico', titulo: `Contraindicado: ${f.nome}`, texto: c.explicacao });
    } else if (c.classe === 'desnecessario') {
      pontos -= c.peso;
      achados.push({ pilar: 'Conduta', severidade: 'refinamento', titulo: `Sem indicação: ${f.nome}`, texto: c.explicacao });
    }
  }
  for (const [id, c] of Object.entries(caso.condutas)) {
    if (c.classe === 'esperado' && !administracoes.some((a) => a.id === id)) {
      achados.push({ pilar: 'Conduta', severidade: c.peso >= 10 ? 'critico' : 'importante',
        titulo: `Não prescreveu: ${acharFarmaco(id)?.nome}`, texto: c.explicacao });
    }
  }
  const conduta = limite(Math.round((pontos / pesoMaxCond) * 35), 0, 35);

  // Soft skills ------------------------------------------------------------
  let soft = 0;
  if (postura.apresentou) soft += 5;
  else achados.push({ pilar: 'Soft skills', severidade: 'importante', titulo: 'Não se apresentou',
    texto: 'O paciente passou o atendimento inteiro sem saber quem estava cuidando dele.' });
  if (postura.explicou) soft += 4;
  else achados.push({ pilar: 'Soft skills', severidade: 'refinamento', titulo: 'Não explicou o que ia fazer',
    texto: 'Dizer o próximo passo em voz alta baixa a ansiedade e melhora o que o paciente conta.' });
  if (postura.acolheu) soft += 3;
  if (!postura.usouJargao) soft += 3;
  else achados.push({ pilar: 'Soft skills', severidade: 'refinamento', titulo: 'Falou em jargão com o paciente',
    texto: 'Termo técnico com paciente vira silêncio, não vira informação.' });
  soft = Math.min(15, soft);

  const acertouDx = caso.gabarito.aceita.test(hipotese || '');
  if (!acertouDx) {
    achados.push({ pilar: 'Conduta', severidade: 'critico', titulo: 'Hipótese principal não bate com o caso',
      texto: `Diagnóstico do caso: ${caso.gabarito.diagnostico}.` });
  }

  const ordem = { critico: 0, importante: 1, refinamento: 2 };
  achados.sort((a, b) => ordem[a.severidade] - ordem[b.severidade]);

  const chave = administracoes.find((a) => a.id === caso.gabarito.condutaChave);
  return {
    anamnese, investigacao, conduta, soft,
    total: anamnese + investigacao + conduta + soft,
    achados, acertouDx,
    minutoChave: chave ? chave.minuto : null,
  };
}
