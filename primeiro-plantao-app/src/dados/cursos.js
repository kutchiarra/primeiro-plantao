// Camada de curso: é o que um professor monta para dar aula, e o que
// transforma o produto de "casos avulsos" em algo que uma instituição compra.
// Persistência local no protótipo; no produto são as tabelas cursos/aulas/
// turmas/matriculas/progresso_aula.

const CHAVE_CURSOS = 'pp.cursos.v1';
const CHAVE_PROGRESSO = 'pp.progresso.v1';

export const cursoSemente = {
  id: 'curso-emergencias-1',
  titulo: 'Emergências clínicas I',
  subtitulo: 'As três primeiras horas de plantão',
  instituicao: 'Liga de Emergência',
  autor: 'Coordenação do curso',
  publico: 'Internato e primeiro ano de residência',
  descricao:
    'Dois atendimentos em que a decisão certa depende de uma pergunta que quase ninguém faz. O aluno atende, decide e recebe o debriefing; você vê onde a turma inteira tropeçou.',
  codigoTurma: 'PP-7QK2',
  criadoEm: '2026-08-01',
  aulas: [
    {
      id: 'aula-1',
      titulo: 'Dor torácica: a pergunta que muda a conduta',
      objetivo: 'Reconhecer IAM com supra em 10 minutos e checar interação medicamentosa antes de prescrever nitrato.',
      casoId: 'PS-DT-001',
      notaDoPreceptor:
        'Peça para a turma anotar a hipótese ANTES de pedir qualquer exame. Depois compare com o que cada um pediu. O ponto da aula não é o diagnóstico, é a pergunta sobre a sildenafila.',
    },
    {
      id: 'aula-2',
      titulo: 'Anafilaxia: adrenalina antes de qualquer outra coisa',
      objetivo: 'Aplicar adrenalina IM em até 5 minutos e reconhecer por que o corticoide não resolve a fase aguda.',
      casoId: 'PS-ANA-002',
      notaDoPreceptor:
        'Metade da turma vai começar por corticoide e anti-histamínico. Deixe acontecer: a pressão cai na frente deles e o debriefing cobra o tempo até a adrenalina.',
    },
  ],
};

const ler = (chave, padrao) => {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch {
    return padrao;
  }
};

const gravar = (chave, valor) => {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* modo privado */ }
};

export function carregarCursos() {
  const guardados = ler(CHAVE_CURSOS, null);
  if (!guardados) { gravar(CHAVE_CURSOS, [cursoSemente]); return [cursoSemente]; }
  return guardados;
}

export function salvarCurso(curso) {
  const lista = carregarCursos();
  const i = lista.findIndex((c) => c.id === curso.id);
  if (i >= 0) lista[i] = curso; else lista.push(curso);
  gravar(CHAVE_CURSOS, lista);
  return lista;
}

export function removerCurso(id) {
  const lista = carregarCursos().filter((c) => c.id !== id);
  gravar(CHAVE_CURSOS, lista);
  return lista;
}

export const novoCodigoTurma = () => {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return `PP-${s}`;
};

export const carregarProgresso = () => ler(CHAVE_PROGRESSO, {});

export function registrarConclusao(cursoId, aulaId, resumo, { limite = 10 } = {}) {
  const p = carregarProgresso();
  const chave = `${cursoId}::${aulaId}`;
  const anteriores = p[chave]?.tentativas || [];
  p[chave] = {
    tentativas: [...anteriores, resumo].slice(-limite),
    melhor: Math.max(resumo.total, p[chave]?.melhor ?? 0),
    ultima: resumo,
  };
  gravar(CHAVE_PROGRESSO, p);
  return p;
}

// ------------------------------------------------------- avaliação em turma
// Como não há backend neste protótipo, o roster de uma prova é local ao
// navegador. Export/import é a ponte manual entre dispositivos de alunos.
export function exportarResultadosCurso(cursoId) {
  const progresso = carregarProgresso();
  const registros = Object.entries(progresso)
    .filter(([chave]) => chave.startsWith(`${cursoId}::`))
    .map(([chave, valor]) => ({ chave, ...valor }));
  return { versao: 1, cursoId, exportadoEm: new Date().toISOString(), registros };
}

const chaveTentativa = (t) => `${t.aluno || ''}::${t.em || ''}`;

export function importarResultadosCurso(pacote) {
  if (!pacote?.registros) return carregarProgresso();
  const progresso = carregarProgresso();
  for (const r of pacote.registros) {
    const existente = progresso[r.chave];
    const vistos = new Set((existente?.tentativas || []).map(chaveTentativa));
    const novas = (r.tentativas || []).filter((t) => !vistos.has(chaveTentativa(t)));
    progresso[r.chave] = {
      tentativas: [...(existente?.tentativas || []), ...novas].slice(-500),
      melhor: Math.max(existente?.melhor ?? 0, r.melhor ?? 0),
      ultima: r.ultima ?? existente?.ultima,
    };
  }
  gravar(CHAVE_PROGRESSO, progresso);
  return progresso;
}

export function agruparPorAluno(tentativas, notaMinima) {
  const mapa = new Map();
  for (const t of tentativas) {
    const nome = t.aluno || 'Sem nome';
    const atual = mapa.get(nome) || { aluno: nome, melhor: 0, tentativas: 0, ultima: null };
    atual.melhor = Math.max(atual.melhor, t.total);
    atual.tentativas += 1;
    if (!atual.ultima || (t.em && t.em > atual.ultima)) atual.ultima = t.em;
    mapa.set(nome, atual);
  }
  return [...mapa.values()].map((r) => ({ ...r, aprovado: notaMinima != null ? r.melhor >= notaMinima : null }));
}
