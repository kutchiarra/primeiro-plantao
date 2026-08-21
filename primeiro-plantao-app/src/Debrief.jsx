import { acharFarmaco } from './dados/catalogo.js';

const PILARES = [
  { chave: 'anamnese', nome: 'Anamnese', max: 25, fonte: 'temas que o paciente chegou a contar' },
  { chave: 'investigacao', nome: 'Investigação', max: 25, fonte: 'acertos menos desperdício, por custo' },
  { chave: 'conduta', nome: 'Conduta', max: 35, fonte: 'o que foi feito, e em quanto tempo' },
  { chave: 'soft', nome: 'Soft skills', max: 15, fonte: 'apresentação, linguagem, explicação' },
];

const SEVERIDADE = { critico: 'Crítico', importante: 'Importante', refinamento: 'Refinamento' };

export default function Debrief({ r, caso, aoVoltar, aoRefazer }) {
  const real = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
  const chave = acharFarmaco(caso.gabarito.condutaChave);

  return (
    <div className="debrief">
      <header className="debrief__topo">
        <div>
          <span className="carimbo">Folha de debriefing</span>
          {r.contexto?.tituloAula && <span className="papeleta__aula">{r.contexto.tituloCurso} · {r.contexto.tituloAula}</span>}
          <h1>{caso.persona.nome} · {caso.gabarito.diagnostico}</h1>
          <p className="debrief__ref">{caso.gabarito.referencia}</p>
        </div>
        <div className="debrief__nota">
          <span className="rotulo">Total</span>
          <strong className="tabular">{r.total}</strong>
          <span className="un">de 100</span>
        </div>
      </header>

      <section className="pilares">
        {PILARES.map((p) => (
          <div key={p.chave} className="pilar">
            <div className="pilar__cabeca">
              <b>{p.nome}</b><span className="tabular">{r[p.chave]}<i>/{p.max}</i></span>
            </div>
            <div className="pilar__regua"><i style={{ width: `${(r[p.chave] / p.max) * 100}%` }} /></div>
            <p>{p.fonte}</p>
          </div>
        ))}
      </section>

      <section className="numeros">
        <div><span className="rotulo">Tempo até encerrar</span><b className="tabular">{r.min} min</b></div>
        <div><span className="rotulo">Custo do atendimento</span><b className="tabular">{real(r.custo)}</b></div>
        <div><span className="rotulo">Manobras de exame</span><b className="tabular">{r.manobras} de 4</b></div>
        <div>
          <span className="rotulo">{caso.gabarito.rotuloTempo}</span>
          <b className="tabular">{r.minutoChave !== null ? `${r.minutoChave} min` : 'não feito'}</b>
        </div>
      </section>

      <p className="debrief__hipotese">
        <span className="rotulo">Sua hipótese</span>
        <b className={r.acertouDx ? 'acertou' : 'errou'}>{r.hipotese || '—'}</b>
        {chave && <em>Conduta que define o caso: {chave.nome}.</em>}
      </p>

      <section className="achados">
        <h2 className="rotulo">O que apareceu no seu atendimento · {r.achados.length} pontos</h2>
        {r.achados.length === 0 && <p className="vazio">Nada a corrigir. Isso é raro.</p>}
        <ol>
          {r.achados.map((a, i) => (
            <li key={i} className={'achado achado--' + a.severidade}>
              <div className="achado__tags">
                <span className="sev">{SEVERIDADE[a.severidade]}</span>
                <span className="pil">{a.pilar}</span>
              </div>
              <b>{a.titulo}</b>
              <p>{a.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="debrief__rodape">
        <p>
          Anamnese, investigação e conduta saem de contas contra o gabarito: a mesma sessão dá a mesma nota, sempre.
          Soft skills aqui é heurística local; no produto é o modelo julgando com rubrica fechada.
        </p>
        <div className="debrief__acoes">
          <button className="secundario" onClick={aoRefazer}>Atender de novo</button>
          <button onClick={aoVoltar}>{r.contexto ? 'Voltar ao curso' : 'Voltar à sala'}</button>
        </div>
      </footer>
    </div>
  );
}
