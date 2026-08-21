import { acharCaso } from './dados/casos.js';
import { carregarProgresso } from './dados/cursos.js';

export default function Curso({ curso, aoAtender, aoEditar, aoVoltar }) {
  const progresso = carregarProgresso();
  const tentativas = curso.aulas.flatMap((a) => (progresso[`${curso.id}::${a.id}`]?.tentativas || [])
    .map((t) => ({ ...t, aula: a.titulo })));
  const media = tentativas.length
    ? Math.round(tentativas.reduce((s, t) => s + t.total, 0) / tentativas.length) : null;

  return (
    <div className="sala">
      <header className="sala__topo">
        <div>
          <button className="voltar" onClick={aoVoltar}>← Sala de aula</button>
          <span className="carimbo">{curso.instituicao}</span>
          <h1>{curso.titulo}</h1>
          <p className="sala__lede">{curso.descricao}</p>
          <p className="curso__meta tabular">
            {curso.autor} · {curso.publico} · turma <b>{curso.codigoTurma}</b>
          </p>
        </div>
        <button className="secundario" onClick={aoEditar}>Editar curso</button>
      </header>

      <section className="bloco">
        <h2 className="rotulo">Aulas · {curso.aulas.length}</h2>
        <ol className="aulas">
          {curso.aulas.map((a, i) => {
            const caso = acharCaso(a.casoId);
            const p = progresso[`${curso.id}::${a.id}`];
            return (
              <li key={a.id} className="aula">
                <span className="aula__n tabular">{String(i + 1).padStart(2, '0')}</span>
                <div className="aula__corpo">
                  <h3>{a.titulo}</h3>
                  <p className="aula__objetivo"><b>Objetivo.</b> {a.objetivo}</p>
                  {caso
                    ? <p className="aula__caso tabular">{caso.nivel} · {caso.persona.nome}, {caso.persona.idade} anos · ~{caso.duracaoMin} min</p>
                    : <p className="aula__caso tabular aula__caso--vazio">nenhum caso vinculado</p>}
                  {a.notaDoPreceptor && (
                    <p className="aula__nota"><span className="rotulo">Para o professor</span>{a.notaDoPreceptor}</p>
                  )}
                  {p && (
                    <p className="aula__resultado tabular">
                      melhor nota {p.melhor}/100 · {p.tentativas.length} {p.tentativas.length === 1 ? 'tentativa' : 'tentativas'}
                    </p>
                  )}
                </div>
                <button className="acao" disabled={!caso} onClick={() => aoAtender(a)}>
                  {p ? 'Refazer' : 'Abrir caso'}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="bloco">
        <h2 className="rotulo">Seus atendimentos neste curso</h2>
        {tentativas.length === 0
          ? <p className="vazio">Nenhum atendimento ainda. O relatório da turma aparece aqui conforme as aulas são feitas.</p>
          : (
            <>
              <p className="curso__media">Média das suas tentativas: <b className="tabular">{media}/100</b></p>
              <div className="tabela">
                <table>
                  <thead>
                    <tr><th>Aula</th><th>Nota</th><th>Anamnese</th><th>Investigação</th><th>Conduta</th><th>Soft</th><th>Custo</th><th>Tempo</th></tr>
                  </thead>
                  <tbody>
                    {tentativas.slice().reverse().map((t, i) => (
                      <tr key={i}>
                        <td>{t.aula}</td>
                        <td className="tabular"><b>{t.total}</b></td>
                        <td className="tabular">{t.anamnese}/25</td>
                        <td className="tabular">{t.investigacao}/25</td>
                        <td className="tabular">{t.conduta}/35</td>
                        <td className="tabular">{t.soft}/15</td>
                        <td className="tabular">R$ {t.custo}</td>
                        <td className="tabular">{t.min} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
      </section>
    </div>
  );
}
