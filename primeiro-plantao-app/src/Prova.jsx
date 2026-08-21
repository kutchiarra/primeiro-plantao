import { useMemo, useState } from 'react';
import { gerarProva } from './prova.js';

export default function Prova({ caso, aoVoltar }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prova = useMemo(() => gerarProva(caso), [caso.id]);
  const [gabarito, setGabarito] = useState(false);

  return (
    <div className="sala prova">
      <header className="sala__topo">
        <div>
          <button className="voltar" onClick={aoVoltar}>← Voltar</button>
          <span className="carimbo">Avaliação</span>
          <h1>{prova.casoTitulo}</h1>
        </div>
        <div className="prova__acoes">
          <button type="button" className="secundario" onClick={() => setGabarito((x) => !x)}>
            {gabarito ? 'Ocultar gabarito' : 'Mostrar gabarito'}
          </button>
          <button type="button" className="acao" onClick={() => window.print()}>Imprimir</button>
        </div>
      </header>
      <ol className="prova__questoes">
        {prova.questoes.map((q, i) => (
          <li key={q.id}>
            <p className="prova__enunciado"><b>{i + 1}.</b> {q.enunciado}</p>
            {q.tipo === 'multipla' ? (
              <ul className="prova__alternativas">
                {q.alternativas.map((alt, j) => (
                  <li key={alt.id} className={gabarito && alt.correta ? 'prova__alt--correta' : ''}>
                    {String.fromCharCode(65 + j)}) {alt.texto}
                  </li>
                ))}
              </ul>
            ) : <div className="prova__linha-resposta" />}
            {gabarito && (
              <p className="prova__explicacao">
                {q.tipo === 'dissertativa' && <><b>Resposta esperada:</b> {q.respostaEsperada}. </>}
                {q.explicacao}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
