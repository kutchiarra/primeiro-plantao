import { useRef, useState } from 'react';
import { acharCaso } from './dados/casos.js';
import { carregarProgresso, agruparPorAluno, exportarResultadosCurso, importarResultadosCurso } from './dados/cursos.js';

export default function Curso({ curso, aoAtender, aoGerarProva, aoEditar, aoVoltar }) {
  const [progresso, setProgresso] = useState(carregarProgresso);
  const arquivoRef = useRef(null);
  const tentativas = curso.aulas.flatMap((a) => (progresso[`${curso.id}::${a.id}`]?.tentativas || [])
    .map((t) => ({ ...t, aula: a.titulo })));
  const media = tentativas.length
    ? Math.round(tentativas.reduce((s, t) => s + t.total, 0) / tentativas.length) : null;
  const aulasProva = curso.aulas.filter((a) => a.avaliacao?.ativa);

  function baixar(conteudo, tipo, nomeArquivo) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportarJson() {
    baixar(JSON.stringify(exportarResultadosCurso(curso.id), null, 2), 'application/json',
      `prova-${curso.codigoTurma}-${new Date().toISOString().slice(0, 10)}.json`);
  }

  function exportarCsv() {
    const linhas = [['aula', 'aluno', 'total', 'anamnese', 'investigacao', 'conduta', 'soft', 'custo', 'min', 'em']];
    for (const a of curso.aulas) {
      const t = progresso[`${curso.id}::${a.id}`]?.tentativas || [];
      for (const item of t) {
        linhas.push([a.titulo, item.aluno || '', item.total, item.anamnese, item.investigacao,
          item.conduta, item.soft, item.custo, item.min, item.em]);
      }
    }
    const csv = linhas.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    baixar(csv, 'text/csv', `prova-${curso.codigoTurma}.csv`);
  }

  function importar(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        importarResultadosCurso(JSON.parse(leitor.result));
        setProgresso(carregarProgresso());
      } catch {
        alert('Arquivo inválido.');
      }
    };
    leitor.readAsText(arquivo);
    e.target.value = '';
  }

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
                <div className="aula__acoes">
                  <button className="acao" disabled={!caso} onClick={() => aoAtender(a)}>
                    {p ? 'Refazer' : 'Abrir caso'}
                  </button>
                  {caso && <button className="secundario" onClick={() => aoGerarProva(caso.id)}>Gerar prova</button>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {aulasProva.length > 0 && (
        <section className="bloco">
          <h2 className="rotulo">Roster de provas</h2>
          <p className="nota-roster">
            Cada aluno faz a prova no próprio aparelho — os resultados abaixo existem só neste navegador.
            Peça exportação a cada aluno e importe aqui para juntar a turma inteira.
          </p>
          <div className="prova__import-export">
            <button type="button" className="secundario" onClick={exportarJson}>Exportar JSON</button>
            <button type="button" className="secundario" onClick={exportarCsv}>Exportar CSV</button>
            <button type="button" className="secundario" onClick={() => arquivoRef.current.click()}>Importar JSON</button>
            <input ref={arquivoRef} type="file" accept="application/json" onChange={importar} hidden />
          </div>
          {aulasProva.map((a) => {
            const t = progresso[`${curso.id}::${a.id}`]?.tentativas || [];
            const porAluno = agruparPorAluno(t, a.avaliacao.notaMinima);
            return (
              <div key={a.id} className="prova-roster">
                <h3>{a.titulo} · nota mínima {a.avaliacao.notaMinima}/100</h3>
                {porAluno.length === 0 ? <p className="vazio">Ninguém fez esta prova ainda.</p> : (
                  <div className="tabela">
                    <table>
                      <thead>
                        <tr><th>Aluno</th><th>Melhor nota</th><th>Situação</th><th>Tentativas</th><th>Última</th></tr>
                      </thead>
                      <tbody>
                        {porAluno.map((r) => (
                          <tr key={r.aluno}>
                            <td>{r.aluno}</td>
                            <td className="tabular">{r.melhor}</td>
                            <td className={r.aprovado ? 'acertou' : 'errou'}>{r.aprovado ? 'Aprovado' : 'Reprovado'}</td>
                            <td className="tabular">{r.tentativas}</td>
                            <td className="tabular">{r.ultima ? new Date(r.ultima).toLocaleString('pt-BR') : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

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
