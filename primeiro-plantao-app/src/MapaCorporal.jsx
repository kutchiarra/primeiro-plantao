import { useState } from 'react';

// Mapa corporal: o gesto de encostar no paciente. Desenho de traço, como uma
// figura carimbada na papeleta — não um boneco 3D. Cada ponto é uma manobra
// do caso; o que não tem região vira botão embaixo.
const PONTOS = {
  pescoco:   { x: 100, y: 72,  r: 13, rotulo: 'Pescoço' },
  precordio: { x: 88,  y: 118, r: 15, rotulo: 'Precórdio' },
  torax:     { x: 119, y: 112, r: 15, rotulo: 'Campos pulmonares' },
  parede:    { x: 100, y: 148, r: 14, rotulo: 'Parede torácica' },
  braco:     { x: 55,  y: 152, r: 12, rotulo: 'Braço' },
  punho:     { x: 47,  y: 196, r: 11, rotulo: 'Punho' },
};

export default function MapaCorporal({ manobras, feitas, ativa, aoExaminar }) {
  const [sobre, setSobre] = useState(null);

  const comRegiao = manobras.filter((m) => PONTOS[m.regiao]);
  const semRegiao = manobras.filter((m) => !PONTOS[m.regiao]);
  const destacada = sobre ? manobras.find((m) => m.regiao === sobre) : null;

  return (
    <div className="mapa">
      <svg viewBox="0 0 200 300" className="mapa__svg" role="group" aria-label="Mapa corporal para exame físico">
        <g className="mapa__figura">
          <ellipse cx="100" cy="42" rx="21" ry="25" />
          <path d="M92 66 L92 78 M108 66 L108 78" />
          <path d="M74 80 C74 74 126 74 126 80 L132 152 C132 176 68 176 68 152 Z" />
          <path d="M74 82 L52 96 L44 168 L50 210" />
          <path d="M126 82 L148 96 L156 168 L150 210" />
          <path d="M76 172 L74 232 L70 288 M124 172 L126 232 L130 288" />
          <path d="M84 96 C92 106 108 106 116 96" className="mapa__detalhe" />
        </g>

        {comRegiao.map((m) => {
          const p = PONTOS[m.regiao];
          const feita = feitas.includes(m.id);
          return (
            <g key={m.id}
              className={'mapa__ponto' + (feita ? ' mapa__ponto--feita' : '') + (ativa === m.id ? ' mapa__ponto--ativa' : '')}
              tabIndex={0} role="button" aria-label={`${m.nome}${feita ? ', já examinado' : ''}`}
              onClick={() => aoExaminar(m)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoExaminar(m); } }}
              onMouseEnter={() => setSobre(m.regiao)}
              onMouseLeave={() => setSobre((s) => (s === m.regiao ? null : s))}
              onFocus={() => setSobre(m.regiao)}
              onBlur={() => setSobre((s) => (s === m.regiao ? null : s))}
            >
              <circle cx={p.x} cy={p.y} r={p.r} className="mapa__area" />
              <circle cx={p.x} cy={p.y} r="2.4" className="mapa__miolo" />
              {feita && <path d={`M${p.x + p.r - 5} ${p.y - p.r + 2} l3 3 l6 -7`} className="mapa__tique" />}
            </g>
          );
        })}
      </svg>

      <div className="mapa__lado">
        <p className="mapa__dica">
          {destacada
            ? <><b>{destacada.nome}</b><em>{feitas.includes(destacada.id) ? 'reavaliar · 20 s' : '1 min do plantão'}</em></>
            : <>Clique numa região para examinar. Ausculta e pulso podem ser repetidos a qualquer momento.</>}
        </p>
        {semRegiao.length > 0 && (
          <div className="mapa__extras">
            {semRegiao.map((m) => (
              <button key={m.id} type="button" onClick={() => aoExaminar(m)}
                className={ativa === m.id ? 'ativa' : ''}>{m.nome}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
