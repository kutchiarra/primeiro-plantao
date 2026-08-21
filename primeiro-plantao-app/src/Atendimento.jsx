import { useEffect, useRef, useState } from 'react';
import FitaECG from './FitaECG.jsx';
import Tendencia from './Tendencia.jsx';
import PainelAusculta from './PainelAusculta.jsx';
import MapaCorporal from './MapaCorporal.jsx';
import ECG12 from './ECG12.jsx';
import { exames, farmacos, acharExame, acharFarmaco } from './dados/catalogo.js';
import { responder, lerPostura, estado, gravidade, pontuar, labDoCaso, ACELERACAO } from './motor.js';
import { criarAudioContexto } from './ausculta.js';

const rel = (seg) => {
  const m = Math.floor(seg / 60), s = Math.floor(seg % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
const real = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
const sinal = (n) => (n > 0 ? '+' : '−') + Math.abs(n).toFixed(n >= 10 || n <= -10 ? 0 : 1);

const ATALHOS = {
  'PS-DT-001': ['Me conta o que aconteceu?', 'A dor vai para algum lugar?', 'A senhora tem alguma alergia?'],
  'PS-ANA-002': ['Me conta o que aconteceu?', 'O que você tomou?', 'Já teve reação assim antes?'],
};

export default function Atendimento({ caso, contexto, aoEncerrar, aoSair }) {
  const [tSim, setTSim] = useState(0);
  const [mensagens, setMensagens] = useState([{ de: 'paciente', texto: caso.persona.abertura, minuto: 0 }]);
  const [revelados, setRevelados] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [administracoes, setAdministracoes] = useState([]);
  const [manobras, setManobras] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [aba, setAba] = useState('condutas');
  const [doseAberta, setDoseAberta] = useState(null);
  const [rascunho, setRascunho] = useState('');
  const [encerrando, setEncerrando] = useState(false);
  const [hipotese, setHipotese] = useState('');
  const [plano, setPlano] = useState('');
  const [painelAberto, setPainelAberto] = useState(null);
  const audioCtxRef = useRef(null);

  const fim = useRef(null);
  const gravidadeAnterior = useRef('estavel');
  const tMin = tSim / 60;
  const min = Math.floor(tMin);

  const { v, ativos } = estado(caso, tMin, administracoes);
  const nivel = gravidade(v);
  const custo = pedidos.reduce((s, p) => s + (acharExame(p.id)?.custo || 0), 0)
    + administracoes.reduce((s, a) => s + (acharFarmaco(a.id)?.custo || 0), 0);

  useEffect(() => {
    if (encerrando) return;
    const t = setInterval(() => setTSim((x) => x + ACELERACAO / 2), 500);
    return () => clearInterval(t);
  }, [encerrando]);

  useEffect(() => {
    setHistorico((h) => [...h, { t: tMin, fc: v.fc, pas: v.pas, spo2: v.spo2 }].slice(-500));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(tSim / 15)]);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  useEffect(() => () => audioCtxRef.current?.close(), []);

  useEffect(() => {
    if (nivel === gravidadeAnterior.current) return;
    const antes = gravidadeAnterior.current;
    gravidadeAnterior.current = nivel;
    if (nivel === 'critico') {
      registrar('alarme', `Alarme: PA ${v.pas}/${v.pad}, FC ${v.fc}, SpO₂ ${v.spo2}%. ${caso.persona.nome.split(' ')[0]} fica pálido e sonolento.`);
      registrar('paciente', caso.id === 'PS-ANA-002' ? '*mal consegue falar* Doutor... num dá...' : '*voz arrastada* Doutor... tá tudo rodando...');
    } else if (nivel === 'estavel' && antes === 'critico') {
      registrar('alarme', `Estabilizou: PA ${v.pas}/${v.pad}, FC ${v.fc}, SpO₂ ${v.spo2}%.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivel]);

  function registrar(de, texto) {
    setMensagens((m) => [...m, { de, texto, minuto: Math.floor(tSim / 60) }]);
  }

  function perguntar(texto) {
    const limpo = texto.trim();
    if (!limpo || encerrando) return;
    registrar('medico', limpo);
    setRascunho('');
    setTSim((x) => x + 25);
    setTimeout(() => {
      const r = responder(caso, limpo, revelados);
      registrar('paciente', r.fala);
      if (r.revelou) setRevelados((x) => (x.includes(r.revelou) ? x : [...x, r.revelou]));
    }, 520);
  }

  function obterAudioContexto() {
    if (!audioCtxRef.current) audioCtxRef.current = criarAudioContexto();
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }

  function examinar(m) {
    const jaFeita = manobras.includes(m.id);
    const repetivel = m.tipo !== 'estatica';
    if (jaFeita && !repetivel) return;
    setTSim((x) => x + (jaFeita ? 20 : 60));
    registrar('exame', `${jaFeita ? 'Reavaliação — ' : ''}${m.nome} — ${m.achado(v)}`);
    if (!jaFeita) setManobras((x) => [...x, m.id]);
    if (repetivel) {
      obterAudioContexto();
      setPainelAberto(m);
    }
  }

  function pedir(ex) {
    if (pedidos.some((p) => p.id === ex.id)) return;
    setPedidos((p) => [...p, { id: ex.id, minuto: min, prontoEm: min + ex.tat, visto: false }]);
    setTSim((x) => x + 30);
  }

  function injetar(f, dose) {
    setAdministracoes((a) => [...a, { id: f.id, doseId: dose.id, fator: dose.fator, rotuloDose: dose.rotulo, minuto: min }]);
    setDoseAberta(null);
    setTSim((x) => x + 45);
    registrar('conduta', `${f.nome} ${dose.rotulo} — ${f.via}`);
  }

  function encerrar() {
    const r = pontuar(caso, {
      revelados, pedidos, administracoes,
      postura: lerPostura(mensagens.filter((m) => m.de === 'medico').map((m) => m.texto)),
      hipotese, minFinal: min,
    });
    aoEncerrar({ ...r, custo, min, manobras: manobras.length, hipotese, plano, casoId: caso.id, contexto });
  }

  const prontos = pedidos.filter((p) => min >= p.prontoEm && !p.visto);
  const marcas = administracoes.map((a) => ({ t: a.minuto, rotulo: acharFarmaco(a.id)?.nome.split(' ')[0] || '' }));

  return (
    <div className={'plantao plantao--' + nivel}>
      <header className="papeleta">
        <div>
          <span className="carimbo">{caso.nivel}</span>
          {contexto?.tituloAula && <span className="papeleta__aula">{contexto.tituloAula}</span>}
          <h1>{caso.persona.nome}</h1>
          <p className="papeleta__linha">
            {caso.persona.idade} anos · {caso.persona.sexo} · {caso.persona.leito} · entrada {caso.persona.entrada} · {caso.persona.mrn}
          </p>
          <p className="papeleta__queixa">{caso.persona.queixa}</p>
        </div>
        <dl className="papeleta__campos">
          <div><dt>Tempo de plantão</dt><dd className="tabular grande">{rel(tSim)}</dd><dd className="nota">acelerado ×{ACELERACAO}</dd></div>
          <div><dt>Gasto até aqui</dt><dd className="tabular grande">{real(custo)}</dd><dd className="nota">{pedidos.length} exames · {administracoes.length} doses</dd></div>
          <div><dt>Estado</dt><dd className={'tabular grande estado estado--' + nivel}>{nivel}</dd><dd className="nota">PAM {v.pam} mmHg</dd></div>
        </dl>
        <button className="sair" onClick={aoSair}>Sair sem encerrar</button>
      </header>

      <main className="mesa">
        <section className="coluna coluna--conversa">
          <h2 className="rotulo">Conversa</h2>
          <div className="conversa">
            {mensagens.map((m, i) => (
              <article key={i} className={`fala fala--${m.de}`}>
                <span className="fala__hora tabular">{String(m.minuto).padStart(2, '0')}′</span>
                <p>{m.texto}</p>
              </article>
            ))}
            <div ref={fim} />
          </div>

          {mensagens.filter((m) => m.de === 'medico').length < 2 && (
            <div className="atalhos">
              {(ATALHOS[caso.id] || []).map((s) => (
                <button key={s} type="button" className="atalho" onClick={() => perguntar(s)}>{s}</button>
              ))}
            </div>
          )}

          <form className="pergunta" onSubmit={(e) => { e.preventDefault(); perguntar(rascunho); }}>
            <input value={rascunho} onChange={(e) => setRascunho(e.target.value)}
              placeholder={`Pergunte alguma coisa a ${caso.persona.nome.split(' ')[0]}`}
              aria-label="Pergunta para o paciente" />
            <button type="submit">Perguntar</button>
          </form>

          <div className="manobras">
            <h3 className="rotulo">Exame físico</h3>
            <MapaCorporal
              manobras={caso.manobras}
              feitas={manobras}
              ativa={painelAberto?.id}
              aoExaminar={examinar}
            />
            {painelAberto && (
              <PainelAusculta manobra={painelAberto} v={v} audioCtx={audioCtxRef.current}
                aoFechar={() => setPainelAberto(null)} />
            )}
          </div>
        </section>

        <section className="coluna coluna--instrumento">
          <div className="instrumento">
            <FitaECG fc={v.fc} supra={caso.ritmo.supra} rotulo={caso.ritmo.rotulo} />
            <dl className="vitais">
              <div><dt>FC</dt><dd className="tabular">{v.fc}</dd><dd className="un">bpm</dd></div>
              <div className={v.pas < 90 ? 'critico' : ''}><dt>PA</dt><dd className="tabular">{v.pas}/{v.pad}</dd><dd className="un">mmHg</dd></div>
              <div className={v.pam < 65 ? 'critico' : ''}><dt>PAM</dt><dd className="tabular">{v.pam}</dd><dd className="un">mmHg</dd></div>
              <div className={v.spo2 < 92 ? 'critico' : ''}><dt>SpO₂</dt><dd className="tabular">{v.spo2}</dd><dd className="un">%</dd></div>
              <div className={v.fr > 28 || v.fr < 10 ? 'critico' : ''}><dt>FR</dt><dd className="tabular">{v.fr}</dd><dd className="un">irpm</dd></div>
              <div><dt>EtCO₂</dt><dd className="tabular">{v.etco2}</dd><dd className="un">mmHg</dd></div>
              <div><dt>Temp</dt><dd className="tabular">{v.temp.toFixed(1)}</dd><dd className="un">°C</dd></div>
              <div><dt>Dor</dt><dd className="tabular">{v.dor}</dd><dd className="un">0–10</dd></div>
            </dl>
            <Tendencia historico={historico} marcas={marcas} />
          </div>

          <div className="emacao">
            <h3 className="rotulo">Em ação · {ativos.filter((a) => a.frac > 0).length} de {administracoes.length}</h3>
            {administracoes.length === 0 && <p className="vazio">Nada administrado. Os números que você vê são só a doença.</p>}
            {ativos.map((a, i) => (
              <article key={i} className={'droga' + (a.frac <= 0 ? ' droga--fim' : '')}>
                <header>
                  <b>{a.nome} {a.rotuloDose}</b>
                  <span className="tabular">{a.minuto}′ · {a.fase}</span>
                </header>
                <div className="droga__barra"><i style={{ width: `${Math.max(0, a.frac * 100)}%` }} /></div>
                <p className="droga__efeito tabular">
                  {Object.entries(a.contrib).filter(([, n]) => Math.abs(n) >= 0.1)
                    .map(([k, n]) => `${k.toUpperCase()} ${sinal(n)}`).join('   ') || 'sem efeito hemodinâmico'}
                </p>
                {a.motivo && a.amp !== 1 && (
                  <p className={'droga__inter' + (a.amp > 1 ? ' droga__inter--forte' : '')}>
                    efeito {a.amp > 1 ? 'amplificado' : 'reduzido'} ×{a.amp} — {a.motivo}
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="pedidos">
            <div className="abas" role="tablist">
              <button role="tab" aria-selected={aba === 'condutas'} onClick={() => setAba('condutas')}>Prescrição</button>
              <button role="tab" aria-selected={aba === 'exames'} onClick={() => setAba('exames')}>Exames</button>
              <button role="tab" aria-selected={aba === 'resultados'} onClick={() => setAba('resultados')}>
                Resultados{prontos.length > 0 && <em className="badge">{prontos.length}</em>}
              </button>
            </div>

            {aba === 'condutas' && (
              <ul className="catalogo">
                {farmacos.map((f) => {
                  const dado = administracoes.filter((a) => a.id === f.id);
                  const aberto = doseAberta === f.id;
                  return (
                    <li key={f.id} className={aberto ? 'aberto' : ''}>
                      <button type="button" onClick={() => setDoseAberta(aberto ? null : f.id)}>
                        <span className="catalogo__nome">{f.nome}</span>
                        <span className="catalogo__meta tabular">{f.classe} · {real(f.custo)}</span>
                        {dado.length > 0 && (
                          <span className="catalogo__estado">{dado.length}× · última {dado[dado.length - 1].minuto}′</span>
                        )}
                      </button>
                      {aberto && (
                        <div className="doses">
                          <p className="doses__nota">{f.nota}</p>
                          <div className="doses__grade">
                            {f.doses.map((d) => (
                              <button key={d.id} type="button" onClick={() => injetar(f, d)}>
                                {d.rotulo}<em>{f.via}</em>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {aba === 'exames' && (
              <ul className="catalogo">
                {exames.map((e) => {
                  const p = pedidos.find((x) => x.id === e.id);
                  return (
                    <li key={e.id}>
                      <button type="button" onClick={() => pedir(e)} disabled={!!p}>
                        <span className="catalogo__nome">{e.nome}</span>
                        <span className="catalogo__meta tabular">{real(e.custo)} · {e.tat} min</span>
                        {p && <span className="catalogo__estado">{min >= p.prontoEm ? 'pronto' : `sai em ${p.prontoEm - min} min`}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {aba === 'resultados' && (
              <div className="resultados">
                {pedidos.length === 0 && <p className="vazio">Nada pedido ainda. O relógio corre igual.</p>}
                {pedidos.map((p) => {
                  const e = acharExame(p.id), g = labDoCaso(caso, p.id);
                  const pronto = min >= p.prontoEm;
                  return (
                    <article key={p.id} className={'laudo' + (pronto ? '' : ' laudo--espera')}>
                      <header>
                        <span className="tabular">{String(p.minuto).padStart(2, '0')}′</span>
                        <b>{e.nome}</b>
                        <span className={'flag flag--' + (pronto ? g.flag : 'espera')}>
                          {pronto ? g.flag : `${p.prontoEm - min} min`}
                        </span>
                      </header>
                      {pronto
                        ? (p.visto
                          ? (
                            <>
                              <p className="laudo__texto">{g.resultado}</p>
                              {p.id === 'ecg' && (
                                <ECG12 fc={v.fc} supra={caso.ritmo.supra}
                                  paciente={caso.persona.nome} minuto={p.minuto} />
                              )}
                            </>
                          )
                          : <button className="laudo__abrir" onClick={() => setPedidos((ps) => ps.map((x) => x.id === p.id ? { ...x, visto: true } : x))}>Abrir resultado</button>)
                        : <div className="laudo__barra"><i style={{ width: `${Math.min(100, ((min - p.minuto) / e.tat) * 100)}%` }} /></div>}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="rodape">
        <p>{nivel === 'critico' ? 'O paciente está instável.' : nivel === 'atencao' ? 'Sinais no limite. Fique de olho.' : 'Quando decidir, encerre e assine a hipótese.'}</p>
        <button className="encerrar" onClick={() => { setPainelAberto(null); setEncerrando(true); }}>Encerrar o caso</button>
      </footer>

      {encerrando && (
        <div className="folha" role="dialog" aria-modal="true">
          <form className="folha__caixa" onSubmit={(e) => { e.preventDefault(); encerrar(); }}>
            <span className="carimbo">Fechamento</span>
            <h2>Antes do gabarito, assine o que você acha.</h2>
            <label>Hipótese principal
              <input value={hipotese} onChange={(e) => setHipotese(e.target.value)} required
                placeholder="Escreva com suas palavras" />
            </label>
            <label>Conduta imediata
              <textarea value={plano} onChange={(e) => setPlano(e.target.value)} rows={3} required
                placeholder="O que você faz agora, nesta ordem" />
            </label>
            <div className="folha__acoes">
              <button type="button" className="secundario" onClick={() => setEncerrando(false)}>Voltar ao leito</button>
              <button type="submit">Ver o debriefing</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
