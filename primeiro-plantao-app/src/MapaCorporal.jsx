import { useState } from 'react';

// Prancha do paciente, no estilo de atlas clínico: contorno de tinta com
// lavagem de cor por cima — a linguagem do Netter, não a do atlas 3D de
// músculos. Quem examina beira-leito precisa ver PESSOA (pele, avental,
// palidez, suor), não écorché. A camada muscular é outro produto.
//
// A escala também é decisão de design: tudo que se examina aqui é cervical,
// torácico ou de membro superior. Corpo inteiro em 130 px deixaria cada alvo
// com 8 px; a prancha do tórax dá alvos de 45 px ou mais.

const TONS = {
  claro: { luz: '#F3D9C4', base: '#E7BE9F', sombra: '#C99C79', linha: '#8A5F42' },
  medio: { luz: '#E3BE99', base: '#CFA079', sombra: '#AC7E56', linha: '#6E482E' },
  escuro: { luz: '#A9765180', base: '#8E5D3D', sombra: '#6F462B', linha: '#472B18' },
};

const REGIOES = {
  pescoco: { nome: 'Pescoço e via aérea', formas: [{ cx: 120, cy: 72, rx: 24, ry: 20 }] },
  precordio: {
    nome: 'Precórdio', detalhe: 'aórtico · pulmonar · tricúspide · mitral',
    formas: [{ cx: 126, cy: 146, rx: 37, ry: 41 }],
  },
  torax: {
    nome: 'Campos pulmonares', detalhe: 'ápices e bases, bilateral',
    formas: [{ cx: 84, cy: 142, rx: 23, ry: 41 }, { cx: 170, cy: 142, rx: 23, ry: 41 }],
  },
  parede: {
    nome: 'Parede torácica', detalhe: 'rebordo costal e junções condrais',
    formas: [{ cx: 120, cy: 203, rx: 45, ry: 23 }],
  },
  braco: { nome: 'Antebraço', detalhe: 'pele e mucosas', formas: [{ cx: 46, cy: 208, rx: 21, ry: 33 }] },
  punho: { nome: 'Punho', detalhe: 'pulso radial e perfusão', formas: [{ cx: 192, cy: 241, rx: 23, ry: 23 }] },
};

// Focos de ausculta nas posições reais. O paciente está de frente para você:
// a direita dele fica à sua esquerda.
const FOCOS = [
  { l: 'A', x: 106, y: 121 }, { l: 'P', x: 135, y: 121 },
  { l: 'T', x: 131, y: 161 }, { l: 'M', x: 152, y: 171 },
];

const TRONCO = `M106 78 C96 82 82 88 70 98 C62 106 58 120 58 140 L62 196
  C64 220 68 238 72 254 L168 254 C172 238 176 220 178 196
  L182 140 C182 120 178 106 170 98 C158 88 144 82 134 78 Z`;
const BRACO_D = 'M62 116 L44 186 L48 244';
const BRACO_E = 'M178 116 L196 186 L192 244';

// Manchas de urticária: posições fixas, para não dançarem a cada quadro.
const URTICARIA = [
  [92, 128, 7], [108, 152, 5], [138, 134, 6], [156, 158, 7], [100, 186, 6],
  [146, 196, 5], [120, 168, 4], [70, 150, 5], [172, 140, 5], [52, 176, 4],
  [190, 190, 4], [124, 210, 6], [84, 210, 4], [160, 216, 5],
];
const SUOR = [[110, 22, 2.4], [130, 20, 2], [120, 30, 1.8], [104, 118, 2.2], [140, 126, 2], [122, 100, 2.4]];

const limite = (v, a, b) => Math.max(a, Math.min(b, v));

export default function MapaCorporal({ manobras, feitas, ativa, aoExaminar, v, aparencia }) {
  const [sobre, setSobre] = useState(null);
  const ap = aparencia || { tom: 'medio', sexo: 'f', sinais: [] };
  const tom = TONS[ap.tom] || TONS.medio;
  const sinais = ap.sinais || [];

  const palidez = limite((105 - (v?.pas ?? 120)) / 45, 0, 1) * 0.55;
  const cianose = limite((93 - (v?.spo2 ?? 98)) / 12, 0, 1);
  const suor = limite(Math.max(((v?.dor ?? 0) - 5) / 5, (105 - (v?.pas ?? 120)) / 45,
    sinais.includes('sudorese') ? 0.4 : 0), 0, 1) * 0.9;
  const urticaria = sinais.includes('urticaria') ? 0.9 : 0;
  const edemaLabial = sinais.includes('edema_labial');

  const comRegiao = manobras.filter((m) => REGIOES[m.regiao]);
  const semRegiao = manobras.filter((m) => !REGIOES[m.regiao]);
  const destacada = sobre ? manobras.find((m) => m.regiao === sobre) : null;
  const focosAtivos = sobre === 'precordio' || manobras.some((m) => m.regiao === 'precordio' && ativa === m.id);

  return (
    <div className="mapa">
      <svg viewBox="0 0 240 300" className="mapa__svg" role="group" aria-label="Prancha do paciente para exame físico">
        <defs>
          <linearGradient id="pp-pele" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={tom.sombra} />
            <stop offset="0.3" stopColor={tom.base} />
            <stop offset="0.52" stopColor={tom.luz} />
            <stop offset="0.78" stopColor={tom.base} />
            <stop offset="1" stopColor={tom.sombra} />
          </linearGradient>
          <linearGradient id="pp-avental" x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#DCE5EC" />
            <stop offset="0.55" stopColor="#C6D3DE" />
            <stop offset="1" stopColor="#AFC0CE" />
          </linearGradient>
          <filter id="pp-suave" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <filter id="pp-brilho" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.1" />
          </filter>
          <clipPath id="pp-corpo">
            <path d={TRONCO} />
            <ellipse cx="120" cy="34" rx="25" ry="30" />
          </clipPath>
        </defs>

        {/* lavagem de pele */}
        <g className="mapa__pele" style={{ '--linha-pele': tom.linha }}>
          <path d={BRACO_D} className="membro-lavagem" />
          <path d={BRACO_E} className="membro-lavagem" />
          <path d="M107 58 L107 82 L133 82 L133 58 Z" className="pescoco" />
          <path className="tronco" d={TRONCO} />
          <ellipse className="cabeca" cx="120" cy="34" rx="25" ry="30" />
        </g>

        {/* volume: sombras próprias */}
        <g clipPath="url(#pp-corpo)" opacity="0.5">
          <path d="M58 120 C66 150 66 200 72 254 L58 254 L52 150 Z" fill={tom.sombra} filter="url(#pp-suave)" />
          <path d="M182 120 C174 150 174 200 168 254 L188 254 L192 150 Z" fill={tom.sombra} filter="url(#pp-suave)" />
          <path d="M92 108 C104 130 136 130 148 108 C150 132 138 146 120 146 C102 146 90 132 92 108 Z"
            fill={tom.sombra} opacity="0.45" filter="url(#pp-suave)" />
          <path d="M96 60 C104 74 136 74 144 60 L144 84 L96 84 Z" fill={tom.sombra} opacity="0.5" filter="url(#pp-suave)" />
        </g>

        {/* traço anatômico */}
        <g className="mapa__anatomia" clipPath="url(#pp-corpo)">
          <path d="M76 98 Q100 108 118 102" />
          <path d="M164 98 Q140 108 122 102" />
          <path d="M120 104 L120 176" />
          <path d="M86 122 Q120 134 154 122" />
          <path d="M84 142 Q120 156 156 142" />
          <path d="M84 162 Q120 178 156 162" />
          <path d="M80 182 Q120 202 160 182" />
          <path d="M120 186 L120 236" className="mapa__alba" />
          <path d="M104 206 Q120 210 136 206 M104 224 Q120 228 136 224" className="mapa__alba" />
          <path d="M108 62 L114 82 M132 62 L126 82" className="mapa__ecm" />
          <path d="M94 104 L94 198" className="mapa__eixo" />
          <path d="M146 104 L146 198" className="mapa__eixo" />
        </g>

        {/* rosto */}
        <g className="mapa__rosto">
          {ap.sexo === 'f'
            ? <path d="M95 30 C95 8 145 8 145 32 C145 20 138 14 120 14 C104 14 96 19 95 30 Z" className="cabelo" />
            : <path d="M96 26 C98 10 142 10 144 28 C140 18 128 15 120 15 C110 15 100 18 96 26 Z" className="cabelo" />}
          <path d="M108 30 L114 30 M126 30 L132 30" className="olhos" />
          <path d="M107 24 Q111 22 115 24 M125 24 Q129 22 133 24" className="sobrancelhas" />
          <path d={edemaLabial ? 'M111 46 Q120 54 129 46 Q120 51 111 46 Z' : 'M112 46 Q120 50 128 46'}
            className={'boca' + (edemaLabial ? ' boca--edema' : '')}
            style={cianose > 0.25 ? { stroke: '#5C6E9E', fill: edemaLabial ? '#7C6A8E' : 'none' } : undefined} />
        </g>

        {/* avental hospitalar, aberto no precórdio */}
        <g clipPath="url(#pp-corpo)">
          <path d="M70 96 C82 90 96 84 106 80 L120 104 L134 80 C144 84 158 90 170 96
                   L178 130 L182 254 L168 254 L160 150 L152 254 L88 254 L80 150 L72 254 L58 254 L62 130 Z"
            className="mapa__avental" />
          <path d="M96 120 L88 254 M144 120 L152 254" className="mapa__dobra" />
        </g>

        {/* sinais clínicos */}
        {palidez > 0.02 && (
          <g clipPath="url(#pp-corpo)" opacity={palidez}>
            <rect x="0" y="0" width="240" height="300" fill="#E9F0F4" />
          </g>
        )}
        {urticaria > 0 && (
          <g clipPath="url(#pp-corpo)" opacity={urticaria} filter="url(#pp-suave)">
            {URTICARIA.map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill="#C2453C" opacity="0.4" />
            ))}
          </g>
        )}
        {suor > 0.1 && (
          <g opacity={suor} filter="url(#pp-brilho)">
            {SUOR.map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 1.3} fill="#FFFFFF" opacity="0.85" />)}
          </g>
        )}
        {cianose > 0.2 && (
          <g opacity={cianose * 0.7}>
            <ellipse cx="48" cy="246" rx="7" ry="6" fill="#5C6E9E" filter="url(#pp-suave)" />
            <ellipse cx="192" cy="246" rx="7" ry="6" fill="#5C6E9E" filter="url(#pp-suave)" />
          </g>
        )}

        <g className={'mapa__focos' + (focosAtivos ? ' mapa__focos--destaque' : '')}>
          {FOCOS.map((f) => (
            <g key={f.l}>
              <circle cx={f.x} cy={f.y} r="2.2" />
              <text x={f.x + 5} y={f.y + 3}>{f.l}</text>
            </g>
          ))}
        </g>

        {comRegiao.map((m) => {
          const reg = REGIOES[m.regiao];
          const feita = feitas.includes(m.id);
          const p0 = reg.formas[0];
          return (
            <g key={m.id}
              className={'mapa__ponto' + (feita ? ' mapa__ponto--feita' : '') + (ativa === m.id ? ' mapa__ponto--ativa' : '')}
              tabIndex={0} role="button"
              aria-label={`${m.nome} — ${reg.nome}${feita ? ', já examinado' : ''}`}
              onClick={() => aoExaminar(m)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoExaminar(m); } }}
              onMouseEnter={() => setSobre(m.regiao)}
              onMouseLeave={() => setSobre((s) => (s === m.regiao ? null : s))}
              onFocus={() => setSobre(m.regiao)}
              onBlur={() => setSobre((s) => (s === m.regiao ? null : s))}
            >
              {reg.formas.map((f, i) => (
                <ellipse key={i} cx={f.cx} cy={f.cy} rx={f.rx} ry={f.ry} className="mapa__area" />
              ))}
              {feita && (
                <path className="mapa__tique"
                  d={`M${p0.cx + p0.rx - 9} ${p0.cy - p0.ry + 4} l3.5 3.5 l7 -8`} />
              )}
            </g>
          );
        })}
      </svg>

      <div className="mapa__lado">
        <p className="mapa__dica">
          {destacada ? (
            <>
              <b>{destacada.nome}</b>
              <span>{REGIOES[destacada.regiao].nome}
                {REGIOES[destacada.regiao].detalhe ? ' · ' + REGIOES[destacada.regiao].detalhe : ''}</span>
              <em>{feitas.includes(destacada.id) ? 'reavaliar · 20 s' : '1 min do plantão'}</em>
            </>
          ) : (
            <>Clique numa região para examinar. Ausculta e pulso podem ser repetidos — som, traçado e aparência seguem os sinais vitais ao vivo.</>
          )}
        </p>
        {(palidez > 0.15 || suor > 0.3 || cianose > 0.25 || urticaria > 0) && (
          <ul className="mapa__inspecao">
            {palidez > 0.15 && <li>pálida</li>}
            {suor > 0.3 && <li>sudoreica</li>}
            {cianose > 0.25 && <li>cianose de extremidades</li>}
            {urticaria > 0 && <li>urticária generalizada</li>}
            {edemaLabial && <li>edema de lábio</li>}
          </ul>
        )}
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
