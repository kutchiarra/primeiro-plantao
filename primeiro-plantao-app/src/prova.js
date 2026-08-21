import { acharFarmaco, acharExame, exames } from './dados/catalogo.js';

// Gerador de prova: função pura do caso. Mesma seed => mesmas perguntas,
// mesma ordem, sempre — sem Math.random()/Date.now() cru.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function embaralhar(lista, seed) {
  const rand = mulberry32(seed);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function questaoDiagnostico(caso, seed) {
  const alternativas = embaralhar([
    { id: 'correta', texto: caso.gabarito.diagnostico, correta: true },
    ...caso.gabarito.diferenciais.map((d, i) => ({ id: `dif${i}`, texto: d, correta: false })),
  ], seed);
  return {
    id: 'diagnostico', tipo: 'multipla',
    enunciado: `Diante do quadro de ${caso.persona.nome.split(' ')[0]} (${caso.persona.idade} anos), qual é o diagnóstico mais provável?`,
    alternativas,
    explicacao: `Referência: ${caso.gabarito.referencia}.`,
  };
}

function questoesLabs(caso, seed) {
  const candidatos = Object.entries(caso.labs).filter(([, l]) => l.indicado && l.peso >= 8);
  const outrosIds = exames.map((e) => e.id);
  return candidatos.slice(0, 2).map(([id, l], i) => {
    const distratores = embaralhar(
      outrosIds.filter((x) => x !== id && !caso.labs[x]?.indicado), seed + i + 1,
    ).slice(0, 3).map((x) => acharExame(x)?.nome);
    const alternativas = embaralhar([
      { id: 'correta', texto: acharExame(id).nome, correta: true },
      ...distratores.map((t, j) => ({ id: `d${j}`, texto: t, correta: false })),
    ], seed + i + 10);
    return {
      id: `lab-${id}`, tipo: 'multipla',
      enunciado: 'Qual exame é indispensável para fechar este caso (o de maior peso diagnóstico)?',
      alternativas,
      explicacao: l.metaMin ? `Meta de tempo: ${l.metaMin} min da chegada.` : 'Sem meta de tempo definida para este exame no caso.',
    };
  });
}

function questoesContraindicado(caso, seed) {
  const contraindicados = Object.entries(caso.condutas).filter(([, c]) => c.classe === 'contraindicado');
  const candidatosDistrator = Object.entries(caso.condutas).filter(([, c]) => c.classe !== 'contraindicado');
  return contraindicados.map(([id, c], i) => {
    const distratores = embaralhar(candidatosDistrator, seed + i + 20).slice(0, 3)
      .map(([fid]) => acharFarmaco(fid)?.nome);
    const alternativas = embaralhar([
      { id: 'correta', texto: acharFarmaco(id).nome, correta: true },
      ...distratores.map((t, j) => ({ id: `d${j}`, texto: t, correta: false })),
    ], seed + i + 30);
    return {
      id: `contraindicado-${id}`, tipo: 'multipla',
      enunciado: 'Qual conduta abaixo é CONTRAINDICADA neste quadro?',
      alternativas,
      explicacao: c.explicacao,
    };
  });
}

function questaoTempoResposta(caso) {
  const c = caso.condutas[caso.gabarito.condutaChave];
  const f = acharFarmaco(caso.gabarito.condutaChave);
  if (!c || !f) return null;
  return {
    id: 'tempo-resposta', tipo: 'dissertativa',
    enunciado: `Qual o tempo-alvo, em minutos, para "${f.nome}" neste quadro? (${caso.gabarito.rotuloTempo})`,
    respostaEsperada: c.janela != null ? `até ${c.janela} min` : 'sem janela definida',
    explicacao: c.explicacao,
  };
}

export function gerarProva(caso) {
  const seed = hash(caso.id);
  const questoes = [
    questaoDiagnostico(caso, seed),
    ...questoesLabs(caso, seed),
    ...questoesContraindicado(caso, seed),
    questaoTempoResposta(caso),
  ].filter(Boolean);
  return { casoId: caso.id, casoTitulo: caso.titulo, questoes };
}
