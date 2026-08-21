import { useState } from 'react';
import { casos } from './dados/casos.js';
import { novoCodigoTurma, salvarCurso, removerCurso } from './dados/cursos.js';

const aulaVazia = () => ({
  id: 'aula-' + Math.random().toString(36).slice(2, 8),
  titulo: '', objetivo: '', casoId: casos[0].id, notaDoPreceptor: '',
});

const cursoVazio = () => ({
  id: 'curso-' + Math.random().toString(36).slice(2, 8),
  titulo: '', subtitulo: '', instituicao: '', autor: '', publico: '', descricao: '',
  codigoTurma: novoCodigoTurma(),
  criadoEm: new Date().toISOString().slice(0, 10),
  aulas: [aulaVazia()],
});

export default function EditorCurso({ curso, aoSalvar, aoCancelar, aoRemover }) {
  const [c, setC] = useState(curso ? JSON.parse(JSON.stringify(curso)) : cursoVazio());
  const novo = !curso;

  const campo = (k) => ({
    value: c[k],
    onChange: (e) => setC({ ...c, [k]: e.target.value }),
  });
  const campoAula = (i, k) => ({
    value: c.aulas[i][k],
    onChange: (e) => {
      const aulas = [...c.aulas];
      aulas[i] = { ...aulas[i], [k]: e.target.value };
      setC({ ...c, aulas });
    },
  });

  function salvar(e) {
    e.preventDefault();
    const limpo = { ...c, aulas: c.aulas.filter((a) => a.titulo.trim()) };
    if (!limpo.aulas.length) return;
    salvarCurso(limpo);
    aoSalvar(limpo);
  }

  return (
    <div className="sala">
      <header className="sala__topo">
        <div>
          <button className="voltar" onClick={aoCancelar}>← Cancelar</button>
          <span className="carimbo">{novo ? 'Novo curso' : 'Editando'}</span>
          <h1>{novo ? 'Monte o seu curso' : c.titulo || 'Sem título'}</h1>
          <p className="sala__lede">
            Cada aula é um plantão com objetivo declarado. O código da turma é o que você entrega para os alunos.
          </p>
        </div>
        <span className="codigo tabular grande">{c.codigoTurma}</span>
      </header>

      <form className="editor" onSubmit={salvar}>
        <section className="bloco">
          <h2 className="rotulo">Identificação</h2>
          <div className="editor__grade">
            <label>Título do curso<input {...campo('titulo')} required placeholder="Emergências clínicas I" /></label>
            <label>Subtítulo<input {...campo('subtitulo')} placeholder="As três primeiras horas de plantão" /></label>
            <label>Instituição<input {...campo('instituicao')} placeholder="Liga, faculdade, hospital" /></label>
            <label>Responsável<input {...campo('autor')} placeholder="Quem assina o curso" /></label>
            <label>Público<input {...campo('publico')} placeholder="Internato, R1, equipe de enfermagem" /></label>
          </div>
          <label className="largo">Descrição
            <textarea {...campo('descricao')} rows={2} placeholder="O que a turma vai levar deste curso" />
          </label>
        </section>

        <section className="bloco">
          <h2 className="rotulo">Aulas · {c.aulas.length}</h2>
          <ol className="editor__aulas">
            {c.aulas.map((a, i) => (
              <li key={a.id}>
                <div className="editor__aula-topo">
                  <span className="aula__n tabular">{String(i + 1).padStart(2, '0')}</span>
                  <button type="button" className="remover"
                    onClick={() => setC({ ...c, aulas: c.aulas.filter((x) => x.id !== a.id) })}>Remover aula</button>
                </div>
                <label>Título da aula<input {...campoAula(i, 'titulo')} placeholder="Dor torácica: a pergunta que muda a conduta" /></label>
                <label>Objetivo de aprendizagem<input {...campoAula(i, 'objetivo')} placeholder="O que o aluno precisa saber fazer ao final" /></label>
                <label>Caso
                  <select {...campoAula(i, 'casoId')}>
                    {casos.map((caso) => <option key={caso.id} value={caso.id}>{caso.titulo} — {caso.nivel}</option>)}
                  </select>
                </label>
                <label>Nota para o professor
                  <textarea {...campoAula(i, 'notaDoPreceptor')} rows={2}
                    placeholder="Como conduzir a discussão depois do debriefing" />
                </label>
              </li>
            ))}
          </ol>
          <button type="button" className="secundario" onClick={() => setC({ ...c, aulas: [...c.aulas, aulaVazia()] })}>
            Adicionar aula
          </button>
        </section>

        <div className="editor__rodape">
          {!novo && (
            <button type="button" className="perigo" onClick={() => { removerCurso(c.id); aoRemover(); }}>
              Apagar curso
            </button>
          )}
          <button type="submit" className="acao">Salvar curso</button>
        </div>
      </form>
    </div>
  );
}
