// Catálogo global: existe independentemente do caso.
// O exame tem preço e tempo de resultado; o fármaco tem farmacocinética.
// O que cada um SIGNIFICA neste paciente fica no caso, nunca aqui.

export const exames = [
  { id: 'ecg', nome: 'ECG de 12 derivações', grupo: 'Beira-leito', custo: 45, tat: 5 },
  { id: 'glicemia', nome: 'Glicemia capilar', grupo: 'Beira-leito', custo: 5, tat: 2 },
  { id: 'troponina', nome: 'Troponina I ultrassensível', grupo: 'Marcadores', custo: 78, tat: 40 },
  { id: 'ckmb', nome: 'CK-MB massa', grupo: 'Marcadores', custo: 42, tat: 40 },
  { id: 'ddimero', nome: 'D-dímero', grupo: 'Marcadores', custo: 95, tat: 45 },
  { id: 'eletrolitos', nome: 'Sódio e potássio', grupo: 'Bioquímica', custo: 30, tat: 30 },
  { id: 'creatinina', nome: 'Creatinina e ureia', grupo: 'Bioquímica', custo: 28, tat: 30 },
  { id: 'hemograma', nome: 'Hemograma completo', grupo: 'Hematologia', custo: 25, tat: 30 },
  { id: 'triptase', nome: 'Triptase sérica', grupo: 'Bioquímica', custo: 210, tat: 60 },
  { id: 'gasometria', nome: 'Gasometria arterial', grupo: 'Bioquímica', custo: 90, tat: 20, invasivo: 3 },
  { id: 'rxtorax', nome: 'Raio-X de tórax', grupo: 'Imagem', custo: 60, tat: 25 },
  { id: 'angiotc', nome: 'Angio-TC de tórax', grupo: 'Imagem', custo: 780, tat: 60, invasivo: 3 },
  { id: 'rmcranio', nome: 'RM de crânio', grupo: 'Imagem', custo: 1400, tat: 90 },
];

// pd.efeito = deslocamento no PICO, para a dose de fator 1.
// A curva sobe de inicio até pico e decai até duracao. Tudo em minutos.
export const farmacos = [
  { id: 'aas', nome: 'AAS', classe: 'Antiagregante', via: 'VO mastigado', custo: 2,
    doses: [{ id: '300', rotulo: '300 mg', fator: 1 }],
    pd: { inicio: 10, pico: 25, duracao: 240, efeito: { dor: -1 } },
    nota: 'Não mexe em pressão nem em frequência. O ganho é na mortalidade, não no monitor.' },

  { id: 'clopidogrel', nome: 'Clopidogrel', classe: 'Antiagregante', via: 'VO', custo: 12,
    doses: [{ id: '300', rotulo: '300 mg', fator: 1 }, { id: '600', rotulo: '600 mg', fator: 1.4 }],
    pd: { inicio: 30, pico: 120, duracao: 480, efeito: {} },
    nota: 'Dose de ataque antes da angioplastia.' },

  { id: 'heparina', nome: 'Enoxaparina', classe: 'Anticoagulante', via: 'SC', custo: 38,
    doses: [{ id: '1mgkg', rotulo: '1 mg/kg', fator: 1 }],
    pd: { inicio: 20, pico: 180, duracao: 720, efeito: {} },
    nota: 'Sem efeito hemodinâmico visível. O risco aparece no sangramento.' },

  { id: 'morfina', nome: 'Morfina', classe: 'Opioide', via: 'IV lenta', custo: 8,
    doses: [{ id: '2', rotulo: '2 mg', fator: 1 }, { id: '4', rotulo: '4 mg', fator: 2 }, { id: '6', rotulo: '6 mg', fator: 3 }],
    pd: { inicio: 1, pico: 8, duracao: 90, efeito: { dor: -3.5, fr: -3, pas: -9, pad: -5, spo2: -1, etco2: 4 } },
    nota: 'Analgesia com preço: deprime a respiração e derruba a pressão. Dobre a dose e veja a FR.' },

  { id: 'nitrato', nome: 'Nitroglicerina', classe: 'Vasodilatador', via: 'Sublingual', custo: 4,
    doses: [{ id: '5', rotulo: '5 mg', fator: 1 }, { id: '10', rotulo: '10 mg', fator: 2 }],
    pd: { inicio: 1, pico: 4, duracao: 30, efeito: { pas: -19, pad: -10, fc: 8, dor: -2 } },
    nota: 'Vasodilata e alivia a dor isquêmica. Proibido com inibidor de fosfodiesterase-5 nas últimas 24 h.' },

  { id: 'oxigenio', nome: 'Oxigênio', classe: 'Suporte', via: 'Cateter nasal', custo: 6,
    doses: [{ id: '2', rotulo: '2 L/min', fator: 1 }, { id: '5', rotulo: '5 L/min', fator: 1.8 }],
    pd: { inicio: 1, pico: 4, duracao: 180, efeito: { spo2: 3 } },
    nota: 'Só corrige quem está hipoxêmico. Em normoxemia, oxigênio não é remédio.' },

  { id: 'adrenalina_im', nome: 'Adrenalina IM', classe: 'Vasopressor', via: 'IM vasto lateral', custo: 9,
    doses: [{ id: '03', rotulo: '0,3 mg', fator: 1 }, { id: '05', rotulo: '0,5 mg', fator: 1.6 }],
    pd: { inicio: 1, pico: 6, duracao: 22, efeito: { pas: 46, pad: 26, fc: 22, spo2: 7, fr: -2 } },
    nota: 'Primeira linha na anafilaxia. Coxa, IM, sem esperar exame nenhum.' },

  { id: 'adrenalina_iv', nome: 'Adrenalina IV em bolus', classe: 'Vasopressor', via: 'IV push', custo: 9,
    doses: [{ id: '1', rotulo: '1 mg', fator: 1 }],
    pd: { inicio: 0.5, pico: 2, duracao: 12, efeito: { pas: 92, pad: 44, fc: 68, spo2: 4 } },
    nota: 'Bolus IV fora da parada é como se trata arritmia grave e hemorragia cerebral, não anafilaxia.' },

  { id: 'glucagon', nome: 'Glucagon', classe: 'Vasoativo', via: 'IV', custo: 120,
    doses: [{ id: '1', rotulo: '1 mg', fator: 1 }, { id: '2', rotulo: '2 mg', fator: 1.7 }],
    pd: { inicio: 1, pico: 6, duracao: 25, efeito: { pas: 30, pad: 16, fc: 14 } },
    nota: 'A saída para quem usa betabloqueador e não responde à adrenalina: age por outra via, sem depender do receptor beta.' },

  { id: 'volume', nome: 'Ringer lactato', classe: 'Volume', via: 'IV 500 mL', custo: 18,
    doses: [{ id: '500', rotulo: '500 mL', fator: 1 }, { id: '1000', rotulo: '1000 mL', fator: 1.8 }],
    pd: { inicio: 2, pico: 12, duracao: 120, efeito: { pas: 16, pad: 9, fc: -8 } },
    nota: 'Repõe o intravascular. Sozinho não segura anafilaxia.' },

  { id: 'difenidramina', nome: 'Difenidramina', classe: 'Anti-histamínico', via: 'IV', custo: 11,
    doses: [{ id: '50', rotulo: '50 mg', fator: 1 }],
    pd: { inicio: 5, pico: 20, duracao: 240, efeito: { fc: 4 } },
    nota: 'Trata urticária e prurido. Não trata choque nem broncoespasmo.' },

  { id: 'hidrocortisona', nome: 'Hidrocortisona', classe: 'Corticoide', via: 'IV', custo: 14,
    doses: [{ id: '200', rotulo: '200 mg', fator: 1 }],
    pd: { inicio: 30, pico: 120, duracao: 480, efeito: {} },
    nota: 'Previne a fase tardia. Não faz nada nos primeiros minutos.' },

  { id: 'salbutamol', nome: 'Salbutamol', classe: 'Broncodilatador', via: 'Inalatório', custo: 7,
    doses: [{ id: '10', rotulo: '10 gotas', fator: 1 }],
    pd: { inicio: 2, pico: 10, duracao: 90, efeito: { spo2: 4, fc: 12, fr: -3 } },
    nota: 'Abre o brônquio e acelera o coração. Coadjuvante, nunca a primeira linha da anafilaxia.' },

  { id: 'dipirona', nome: 'Dipirona', classe: 'Analgésico', via: 'IV', custo: 6,
    doses: [{ id: '1g', rotulo: '1 g', fator: 1 }],
    pd: { inicio: 10, pico: 25, duracao: 180, efeito: { dor: -1.5, temp: -0.6, pas: -6 } },
    nota: 'Analgésico comum no Brasil e causa frequente de reação alérgica grave.' },

  { id: 'omeprazol', nome: 'Omeprazol', classe: 'IBP', via: 'IV', custo: 22,
    doses: [{ id: '40', rotulo: '40 mg', fator: 1 }],
    pd: { inicio: 20, pico: 60, duracao: 480, efeito: {} },
    nota: 'Trata a mucosa gástrica. Dor torácica tratada como gastrite é o erro clássico do primeiro plantão.' },

  { id: 'hemodinamica', nome: 'Acionar hemodinâmica', classe: 'Procedimento', via: 'Angioplastia primária', custo: 0,
    doses: [{ id: 'unica', rotulo: 'acionar agora', fator: 1 }],
    pd: { inicio: 25, pico: 45, duracao: 600, efeito: { dor: -6, fc: -12, pas: -6 } },
    nota: 'A artéria reabre e a dor cede. O relógio da porta-balão é de 90 minutos.' },
];

export const acharExame = (id) => exames.find((e) => e.id === id);
export const acharFarmaco = (id) => farmacos.find((f) => f.id === id);
