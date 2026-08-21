import { useState } from 'react';

// Reaproveita a classe .folha do modal de encerramento em Atendimento.jsx —
// mesmo padrão visual, zero CSS novo.
export default function IdentificacaoAluno({ aula, aoConfirmar, aoCancelar }) {
  const [nome, setNome] = useState('');
  return (
    <div className="folha" role="dialog" aria-modal="true">
      <form className="folha__caixa" onSubmit={(e) => {
        e.preventDefault();
        const limpo = nome.trim();
        if (!limpo) return;
        aoConfirmar(limpo);
      }}>
        <span className="carimbo">Avaliação</span>
        <h2>{aula.titulo}</h2>
        <p>Esta aula é uma prova. Nota mínima para aprovação: {aula.avaliacao?.notaMinima ?? 70}/100.</p>
        <label>Nome completo
          <input value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus
            placeholder="Como você quer aparecer no relatório da turma" />
        </label>
        <div className="folha__acoes">
          <button type="button" className="secundario" onClick={aoCancelar}>Cancelar</button>
          <button type="submit">Começar a prova</button>
        </div>
      </form>
    </div>
  );
}
