// Dois casos publicados. O gabarito mora aqui só porque isto é protótipo
// local: no produto, estas chaves ficam em tabelas sem policy de leitura.

const evasivasPadrao = [
  'Num sei explicar direito, doutor.',
  '*aperta o peito* Eu só sei que tá ruim. Pergunta de outro jeito?',
  'Isso eu num sei responder, não.',
];

// ===========================================================================
export const casoDorToracica = {
  id: 'PS-DT-001',
  titulo: 'Dor torácica de manhã cedo',
  nivel: 'Nível 3 · Pronto-socorro',
  resumo: 'Mulher de 58 anos com aperto retroesternal há 2 horas. O caso tem uma armadilha que só aparece se você perguntar.',
  duracaoMin: 12,

  persona: {
    nome: 'Célia Ramos', idade: 58, sexo: 'Feminino', leito: 'PS · Leito 4',
    mrn: 'MR-2026-58721', queixa: 'Aperto no peito há 2 horas', entrada: '06:12',
    abertura: '*sentada na maca, a mão fechada em cima do peito* Doutor... esse aperto num passa. Começou hoje de manhã, quando eu tava varrendo a área.',
  },

  base: { fc: 108, pas: 158, pad: 94, spo2: 94, fr: 24, temp: 37.1, etco2: 34, dor: 9 },
  // Aparência do paciente na prancha: tom de pele e sinais visíveis.
  aparencia: { tom: 'medio', sexo: 'f', sinais: ['sudorese'] },
  ritmo: { supra: 0.26, rotulo: 'II' },
  // Sem tratamento, a taquicardia sobe devagar. A dor não cede sozinha.
  evolucao: (t) => ({ fc: Math.min(t * 0.3, 16), pas: Math.min(t * 0.2, 8) }),

  roteiro: [
    { chave: 'queixa', peso: 2, rotulo: 'Pergunta aberta',
      gatilhos: ['o que aconteceu', 'me conta', 'me contar', 'o que houve', 'esta sentindo', 'ta sentindo', 'me diga', 'me fala', 'o que trouxe'],
      fala: 'Eu tava varrendo a área, umas seis da manhã, e travou aqui no peito. *aperta o esterno* Num passa de jeito nenhum. Eu tô com medo de tá tendo um enfarte igual meu pai.' },
    { chave: 'inicio', peso: 3, rotulo: 'Início e duração',
      gatilhos: ['quando comecou', 'que horas', 'ha quanto tempo', 'quanto tempo', 'desde quando'],
      fala: 'Umas seis da manhã. Já faz quase duas horas, doutor.' },
    { chave: 'localizacao', peso: 3, rotulo: 'Localização',
      gatilhos: ['onde doi', 'onde e a dor', 'aponta', 'mostra onde', 'que lugar', 'localiza'],
      fala: '*fecha a mão em cima do esterno* Aqui no meio do peito. Não é um pontinho, é tudo isso aqui.' },
    { chave: 'carater', peso: 3, rotulo: 'Caráter da dor',
      gatilhos: ['como e a dor', 'tipo de dor', 'queimacao', 'aperto', 'pontada', 'facada', 'que tipo'],
      fala: 'É um aperto. Um peso. Parece que tem alguém sentado em cima do meu peito.' },
    { chave: 'irradiacao', peso: 4, rotulo: 'Irradiação',
      gatilhos: ['irradia', 'espalha', 'vai para', 'braco', 'ombro', 'mandibula', 'pescoco', 'costas'],
      fala: 'Sobe pro pescoço e desce pelo braço esquerdo, até o cotovelo. *esfrega o braço*' },
    { chave: 'intensidade', peso: 2, rotulo: 'Intensidade',
      gatilhos: ['zero a dez', '0 a 10', 'quanto doi', 'intensidade', 'nota para a dor'],
      fala: 'Nove. É a pior dor que eu já senti. Pior que parto.' },
    { chave: 'piora', peso: 2, rotulo: 'Fatores de piora e melhora',
      gatilhos: ['piora', 'melhora', 'esforco', 'andar', 'repouso', 'alivia'],
      fala: 'Se eu ando ou fico agitada piora. Sentar quieta ajuda um tiquinho, mas não passa.' },
    { chave: 'respiracao', peso: 3, rotulo: 'Relação com respiração e palpação',
      gatilhos: ['respirar', 'respiracao', 'inspirar', 'fundo', 'apertar', 'palpar', 'muda quando'],
      fala: 'Não muda quando eu respiro fundo, não. E se apertar por fora também não dói.' },
    { chave: 'associados', peso: 4, rotulo: 'Sintomas associados',
      gatilhos: ['enjoo', 'nausea', 'vomito', 'suor', 'suando', 'falta de ar', 'tontura', 'desmaio', 'mais alguma coisa', 'outros sintomas'],
      fala: 'Tô suando frio, enjoada, e falta o ar. Vomitar não vomitei.' },
    { chave: 'prodromo', peso: 4, rotulo: 'Episódios prévios',
      gatilhos: ['ja sentiu antes', 'antes', 'ja teve', 'outras vezes', 'primeira vez', 'ultimas semanas', 'episodio'],
      fala: 'Nas últimas três semanas deu umas fisgadas quando eu subia a ladeira, mas passava se eu parasse. Achei que era gastura.' },
    { chave: 'antecedentes', peso: 4, rotulo: 'Doenças prévias',
      gatilhos: ['alguma doenca', 'diabetes', 'pressao alta', 'hipertensao', 'colesterol', 'problema de saude', 'se trata'],
      fala: 'Tenho diabetes e pressão alta. O colesterol o médico falou que tava alto, mas eu num tomo nada. Faz uns dois anos que num vou no postinho.' },
    { chave: 'medicacoes', peso: 3, rotulo: 'Medicações em uso',
      gatilhos: ['remedio', 'medicacao', 'medicamento', 'toma alguma', 'comprimido', 'usa algum'],
      fala: 'Tomo o da pressão e o da diabetes. Num sei o nome, tá na receita que ficou em casa. Às vezes eu esqueço.' },
    { chave: 'alergia', peso: 4, rotulo: 'Alergias',
      gatilhos: ['alergia', 'alergica', 'alergico'],
      fala: 'Eu tenho alergia de sulfa. Fico toda empipocada.' },
    { chave: 'habitos', peso: 3, rotulo: 'Tabagismo e hábitos',
      gatilhos: ['fuma', 'cigarro', 'tabagismo', 'bebe', 'alcool', 'exercicio'],
      fala: 'Fumo, mas é pouco. Uns cinco por dia... faz uns trinta anos. Exercício eu não faço nenhum.' },
    { chave: 'familia', peso: 3, rotulo: 'História familiar',
      gatilhos: ['familia', 'pai', 'mae', 'parente', 'historia familiar'],
      fala: 'Meu pai morreu de enfarte com 61 anos. É por isso que eu tô com medo.' },
  ],
  segredos: [
    { chave: 'sildenafila', peso: 6, rotulo: 'Sildenafila nas últimas 24 h', critico: true,
      gatilhos: ['sildenafila', 'viagra', 'comprimido azul', 'erecao', 'sexual', 'tadalafila', 'cialis'],
      fala: '*fica sem graça* Doutor... ontem à noite eu tomei um comprimido azul que a vizinha me deu. Falaram que ajudava.' },
    { chave: 'medo', peso: 2, rotulo: 'Contexto social',
      gatilhos: ['medo', 'preocupa', 'preocupada', 'aflita', 'em casa', 'mora com'],
      fala: 'Eu num posso ficar internada. Quem vai cuidar da minha mãe? Ela tem 84 anos.' },
  ],
  evasivas: evasivasPadrao,

  manobras: [
    { id: 'cardio', nome: 'Auscultar coração', tipo: 'ausculta-cardiaca', regiao: 'precordio',
      som: { textura: 'normal' },
      achado: (v) => `Bulhas rítmicas em 2 tempos, ${v.fc} bpm. Sem sopros. B4 audível. Sem atrito pericárdico.` },
    { id: 'pulmao', nome: 'Auscultar pulmões', tipo: 'ausculta-pulmonar', regiao: 'torax',
      som: { textura: 'limpo' },
      achado: (v) => `Murmúrio vesicular presente e simétrico, FR ${v.fr} irpm. Sem estertores.` },
    { id: 'palpar', nome: 'Palpar o tórax', tipo: 'estatica', regiao: 'parede',
      achado: () => 'A palpação não reproduz a dor. Expansibilidade simétrica.' },
    { id: 'pulsos', nome: 'Checar pulsos', tipo: 'pulso', regiao: 'punho',
      achado: (v) => v.pas < 90
        ? `Pulsos finos e rápidos, PA ${v.pas}/${v.pad}. Enchimento capilar lentificado.`
        : `Pulsos simétricos e cheios nos quatro membros. PA ${v.pas}/${v.pad} igual nos dois braços.` },
  ],

  labs: {
    ecg: { indicado: true, peso: 10, metaMin: 10, flag: 'critico',
      resultado: 'Supradesnivelamento de ST de 3 mm em D2, D3 e aVF. Infra em D1 e aVL.' },
    glicemia: { indicado: true, peso: 3, flag: 'alto', resultado: '243 mg/dL' },
    troponina: { indicado: true, peso: 8, flag: 'critico', resultado: '1.842 ng/L (ref < 34)' },
    ckmb: { indicado: false, aceitavel: true, peso: 2, flag: 'alto', resultado: '18,4 ng/mL (ref < 5)' },
    eletrolitos: { indicado: true, peso: 4, flag: 'normal', resultado: 'Na 138 mmol/L · K 4,1 mmol/L' },
    creatinina: { indicado: true, peso: 4, flag: 'alto', resultado: 'Cr 1,3 mg/dL · Ur 48 mg/dL' },
    hemograma: { indicado: false, aceitavel: true, peso: 2, flag: 'normal', resultado: 'Hb 13,1 · Leuco 11.200 · Plaq 244.000' },
    rxtorax: { indicado: false, aceitavel: true, peso: 2, flag: 'normal', resultado: 'Área cardíaca no limite. Sem congestão, sem pneumotórax.' },
    gasometria: { indicado: false, aceitavel: true, peso: 1, flag: 'normal', resultado: 'pH 7,38 · pCO₂ 36 · HCO₃ 22 · Lactato 2,1' },
  },

  condutas: {
    aas: { classe: 'esperado', peso: 10, janela: 30, explicacao: 'Antiagregação imediata. Reduz mortalidade e custa dois reais.' },
    clopidogrel: { classe: 'esperado', peso: 5, janela: 60, explicacao: 'Dupla antiagregação antes da angioplastia primária.' },
    heparina: { classe: 'esperado', peso: 5, janela: 60, explicacao: 'Anticoagulação no IAM com supra.' },
    hemodinamica: { classe: 'esperado', peso: 15, janela: 90, explicacao: 'A conduta que define o caso. Porta-balão alvo: 90 minutos.' },
    morfina: { classe: 'aceitavel', peso: 2, janela: 90, explicacao: 'Analgesia se a dor persiste apesar do nitrato. Mascara sintoma e derruba a pressão.' },
    oxigenio: { classe: 'aceitavel', peso: 1, janela: 90, explicacao: 'Só se SpO₂ < 94%.' },
    nitrato: { classe: 'contraindicado', peso: 12, explicacao: 'Proibido até 24 h depois de um inibidor de fosfodiesterase-5. Ela tomou sildenafila ontem — e só conta se perguntarem.' },
    omeprazol: { classe: 'desnecessario', peso: 4, explicacao: 'Tratar dor torácica isquêmica como gastrite atrasa a reperfusão.' },
    dipirona: { classe: 'desnecessario', peso: 2, explicacao: 'Analgesia inespecífica não trata isquemia.' },
  },

  // Interação farmacológica do caso: amplia o efeito do fármaco.
  interacoes: {
    nitrato: { fator: 3.2, motivo: 'sildenafila nas últimas 24 h' },
  },

  gabarito: {
    diagnostico: 'IAM com supradesnivelamento de ST de parede inferior',
    diferenciais: ['Dissecção de aorta', 'Tromboembolismo pulmonar', 'Pericardite'],
    referencia: 'Diretriz de IAMCSST — SBC, 2021',
    aceita: /supra|iamcsst|iam|infarto|\bst\b|coronar/i,
    condutaChave: 'hemodinamica',
    rotuloTempo: 'Porta-balão',
  },
};

// ===========================================================================
export const casoAnafilaxia = {
  id: 'PS-ANA-002',
  titulo: 'Reação depois da medicação',
  nivel: 'Nível 4 · Emergência',
  resumo: 'Homem de 24 anos que recebeu dipirona há 10 minutos. Aqui o relógio anda mais rápido que a sua dúvida.',
  duracaoMin: 8,

  persona: {
    nome: 'Rafael Nunes', idade: 24, sexo: 'Masculino', leito: 'PS · Sala amarela',
    mrn: 'MR-2026-11904', queixa: 'Placas no corpo e falta de ar após dipirona', entrada: '21:48',
    abertura: '*coçando o pescoço, respiração ruidosa* Doutor, eu tomei aquele remédio pra dor de cabeça e já começou a coçar tudo... e agora tá difícil de respirar.',
  },

  base: { fc: 118, pas: 104, pad: 62, spo2: 93, fr: 26, temp: 36.8, etco2: 30, dor: 3 },
  aparencia: { tom: 'claro', sexo: 'm', sinais: ['urticaria', 'edema_labial'] },
  ritmo: { supra: 0, rotulo: 'II' },
  // Anafilaxia sem adrenalina: piora rápido e não para sozinha.
  evolucao: (t) => ({
    pas: -Math.min(t * 4.2, 56), pad: -Math.min(t * 2.6, 34),
    fc: Math.min(t * 3, 46), spo2: -Math.min(t * 0.95, 13), fr: Math.min(t * 0.8, 12),
  }),

  roteiro: [
    { chave: 'queixa', peso: 2, rotulo: 'Pergunta aberta',
      gatilhos: ['o que aconteceu', 'me conta', 'me contar', 'o que houve', 'esta sentindo', 'ta sentindo', 'me fala'],
      fala: 'Tomei a dipirona na veia faz uns dez minutos, aí começou a coçar a mão, depois o corpo todo. Agora tá fechando a garganta.' },
    { chave: 'tempo', peso: 4, rotulo: 'Tempo desde a exposição',
      gatilhos: ['quando', 'que horas', 'ha quanto tempo', 'quanto tempo', 'faz quanto'],
      fala: 'Uns dez minutos. Foi rápido, doutor.' },
    { chave: 'gatilho', peso: 5, rotulo: 'Agente desencadeante',
      gatilhos: ['o que tomou', 'remedio', 'medicacao', 'medicamento', 'dipirona', 'tomou alguma', 'comeu', 'picada'],
      fala: 'Dipirona. A enfermeira aplicou pra minha enxaqueca. Nunca tinha tomado na veia antes.' },
    { chave: 'respiratorio', peso: 5, rotulo: 'Sintomas respiratórios',
      gatilhos: ['respirar', 'falta de ar', 'garganta', 'chiado', 'engolir', 'voz'],
      fala: '*voz abafada* Tá apertando a garganta. E tem um chiado quando eu puxo o ar.' },
    { chave: 'pele', peso: 3, rotulo: 'Pele e mucosas',
      gatilhos: ['pele', 'placas', 'cocando', 'coceira', 'vermelho', 'incha', 'labio', 'urticaria'],
      fala: 'Tá tudo empolado, e o lábio inchou. *mostra o antebraço cheio de placas*' },
    { chave: 'digestivo', peso: 2, rotulo: 'Sintomas digestivos',
      gatilhos: ['enjoo', 'nausea', 'vomito', 'barriga', 'diarreia', 'colica'],
      fala: 'Tô enjoado e com cólica. Vontade de vomitar.' },
    { chave: 'previo', peso: 4, rotulo: 'Reações prévias',
      gatilhos: ['ja aconteceu', 'ja teve', 'antes', 'outra vez', 'alergia', 'alergico'],
      fala: 'Uma vez com anti-inflamatório eu fiquei todo empolado, mas passou com um comprimido. Nunca foi assim.' },
    { chave: 'antecedentes', peso: 3, rotulo: 'Antecedentes',
      gatilhos: ['alguma doenca', 'asma', 'problema de saude', 'usa algum', 'doenca'],
      fala: 'Tenho asma desde criança. Uso a bombinha quando falta o ar.' },
  ],
  segredos: [
    { chave: 'betabloqueador', peso: 5, rotulo: 'Uso de betabloqueador', critico: true,
      gatilhos: ['propranolol', 'betabloqueador', 'remedio continuo', 'toma algum remedio todo dia', 'uso continuo', 'enxaqueca'],
      fala: 'Ah... eu tomo propranolol todo dia pra enxaqueca. Isso atrapalha?' },
  ],
  evasivas: ['*ofegante* Num consigo falar muito, doutor.', 'Sei não... tá difícil.'],

  manobras: [
    { id: 'pulmao', nome: 'Auscultar pulmões', tipo: 'ausculta-pulmonar', regiao: 'torax',
      som: { textura: 'sibilo' },
      achado: (v) => `Sibilos ${v.spo2 < 92 ? 'difusos' : 'discretos'} nos dois hemitórax, FR ${v.fr} irpm. Tempo expiratório ${v.spo2 < 92 ? 'bem ' : ''}prolongado.` },
    { id: 'viaaerea', nome: 'Olhar a via aérea', tipo: 'ausculta-pulmonar', regiao: 'pescoco',
      som: { textura: 'estridor' },
      achado: (v) => v.spo2 < 90
        ? 'Edema de lábio e úvula. Estridor evidente. Frases curtas, esforço visível.'
        : 'Edema de lábio e úvula em melhora. Estridor leve. Ainda fala frases curtas.' },
    { id: 'pele', nome: 'Examinar a pele', tipo: 'estatica', regiao: 'braco',
      achado: () => 'Urticária generalizada, placas confluentes em tronco e braços.' },
    { id: 'perfusao', nome: 'Checar perfusão', tipo: 'pulso', regiao: 'punho',
      achado: (v) => v.pas < 90
        ? 'Extremidades frias, enchimento capilar 3 s, pulso fino e rápido.'
        : 'Extremidades quentes, enchimento capilar normal, pulso cheio.' },
  ],

  labs: {
    glicemia: { indicado: false, aceitavel: true, peso: 1, flag: 'normal', resultado: '104 mg/dL' },
    triptase: { indicado: true, peso: 4, flag: 'alto', resultado: '38 µg/L (ref < 11) — colhida na fase aguda' },
    gasometria: { indicado: false, aceitavel: true, peso: 2, flag: 'alto', resultado: 'pH 7,31 · pCO₂ 48 · Lactato 3,4' },
    hemograma: { indicado: false, aceitavel: true, peso: 1, flag: 'normal', resultado: 'Hb 15,2 · Leuco 9.800' },
    ecg: { indicado: false, aceitavel: true, peso: 1, flag: 'normal', resultado: 'Taquicardia sinusal, 122 bpm. Sem alterações isquêmicas.' },
    rxtorax: { indicado: false, aceitavel: true, peso: 1, flag: 'normal', resultado: 'Hiperinsuflação leve. Sem infiltrado.' },
  },

  condutas: {
    adrenalina_im: { classe: 'esperado', peso: 20, janela: 5, explicacao: 'Adrenalina intramuscular na coxa é a primeira linha, e o relógio é de minutos. Nada vem antes disso.' },
    volume: { classe: 'esperado', peso: 8, janela: 15, explicacao: 'Expansão volêmica: a vasodilatação da anafilaxia esvazia o intravascular.' },
    oxigenio: { classe: 'esperado', peso: 5, janela: 15, explicacao: 'Hipoxemia com broncoespasmo pede oxigênio.' },
    salbutamol: { classe: 'aceitavel', peso: 3, janela: 30, explicacao: 'Ajuda o broncoespasmo depois da adrenalina, nunca no lugar dela.' },
    glucagon: { classe: 'aceitavel', peso: 4, janela: 30, explicacao: 'Resgate de quem usa betabloqueador: a adrenalina rende pouco porque o receptor beta está bloqueado.' },
    difenidramina: { classe: 'aceitavel', peso: 2, janela: 30, explicacao: 'Alivia urticária e prurido. Não trata choque.' },
    hidrocortisona: { classe: 'aceitavel', peso: 2, janela: 60, explicacao: 'Reduz a reação bifásica. Efeito só depois de horas.' },
    adrenalina_iv: { classe: 'contraindicado', peso: 12, explicacao: 'Bolus IV de 1 mg fora da parada causa crise hipertensiva e arritmia. A via é IM.' },
    dipirona: { classe: 'contraindicado', peso: 15, explicacao: 'É o agente que desencadeou a reação. Repetir a dose é reexposição.' },
    morfina: { classe: 'desnecessario', peso: 4, explicacao: 'Opioide libera histamina e deprime a respiração de quem já está em broncoespasmo.' },
  },

  interacoes: {
    adrenalina_im: { fator: 0.55, motivo: 'propranolol de uso contínuo bloqueia a resposta beta' },
  },

  gabarito: {
    diagnostico: 'Anafilaxia por dipirona, com broncoespasmo e hipotensão',
    diferenciais: ['Crise de asma', 'Angioedema por IECA', 'Reação vasovagal'],
    referencia: 'Diretriz de anafilaxia — ASBAI/WAO, 2020',
    aceita: /anafila|choque anafil|reacao alergica grave|alergia grave/i,
    condutaChave: 'adrenalina_im',
    rotuloTempo: 'Tempo até a adrenalina',
  },
};

export const casos = [casoDorToracica, casoAnafilaxia];
export const acharCaso = (id) => casos.find((c) => c.id === id);
