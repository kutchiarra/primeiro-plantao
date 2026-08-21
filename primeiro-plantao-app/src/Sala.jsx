import { casos } from './dados/casos.js';
import { carregarProgresso } from './dados/cursos.js';

export default function Sala({ cursos, aoAbrirCurso, aoEditarCurso, aoNovoCurso, aoAtender }) {
  const progresso = carregarProgresso();
  const concluidas = (curso) =>
    curso.aulas.filter((a) => progresso[`${curso.id}::${a.id}`]).length;

  return (
    <div className="sala">
      <header className="sala__topo">
        <div>
          <span className="carimbo">Primeiro plantão</span>
          <h1>Sala de aula</h1>
          <p className="sala__lede">
            Um curso é uma sequência de plantões com objetivo declarado. Você monta, entrega o código para a turma
            e vê onde cada um tropeçou.
          </p>
        </div>
        <button className="acao" onClick={aoNovoCurso}>Criar curso</button>
      </header>

      <section className="bloco">
        <h2 className="rotulo">Seus cursos · {cursos.length}</h2>
        <div className="cursos">
          {cursos.map((c) => (
            <article key={c.id} className="curso-cartao">
              <div className="curso-cartao__topo">
                <span className="tag">{c.instituicao}</span>
                <span className="tabular codigo">{c.codigoTurma}</span>
              </div>
              <h3>{c.titulo}</h3>
              <p className="curso-cartao__sub">{c.subtitulo}</p>
              <p className="curso-cartao__desc">{c.descricao}</p>
              <dl className="curso-cartao__nums">
                <div><dt>Aulas</dt><dd className="tabular">{c.aulas.length}</dd></div>
                <div><dt>Concluídas</dt><dd className="tabular">{concluidas(c)}</dd></div>
                <div><dt>Público</dt><dd>{c.publico}</dd></div>
              </dl>
              <div className="curso-cartao__acoes">
                <button className="acao" onClick={() => aoAbrirCurso(c.id)}>Abrir curso</button>
                <button className="secundario" onClick={() => aoEditarCurso(c.id)}>Editar</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bloco">
        <h2 className="rotulo">Casos avulsos · {casos.length}</h2>
        <ul className="casos">
          {casos.map((c) => (
            <li key={c.id}>
              <div>
                <span className="tag">{c.nivel}</span>
                <h3>{c.titulo}</h3>
                <p>{c.resumo}</p>
                <p className="casos__meta tabular">
                  {c.persona.nome} · {c.persona.idade} anos · ~{c.duracaoMin} min
                </p>
              </div>
              <button className="acao" onClick={() => aoAtender(c.id)}>Atender agora</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
