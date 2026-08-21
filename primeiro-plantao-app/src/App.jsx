import { useState } from 'react';
import Sala from './Sala.jsx';
import Curso from './Curso.jsx';
import EditorCurso from './EditorCurso.jsx';
import Atendimento from './Atendimento.jsx';
import Debrief from './Debrief.jsx';
import Prova from './Prova.jsx';
import IdentificacaoAluno from './IdentificacaoAluno.jsx';
import { acharCaso } from './dados/casos.js';
import { carregarCursos, registrarConclusao } from './dados/cursos.js';

export default function App() {
  const [cursos, setCursos] = useState(carregarCursos);
  const [tela, setTela] = useState({ nome: 'sala' });

  const curso = (id) => cursos.find((c) => c.id === id);

  function encerrar(resultado) {
    const ctx = resultado.contexto;
    let notaMinima = null;
    if (ctx?.cursoId) {
      const c = curso(ctx.cursoId);
      const aula = c?.aulas.find((a) => a.id === ctx.aulaId);
      notaMinima = aula?.avaliacao?.ativa ? aula.avaliacao.notaMinima : null;
      registrarConclusao(ctx.cursoId, ctx.aulaId, {
        total: resultado.total, anamnese: resultado.anamnese, investigacao: resultado.investigacao,
        conduta: resultado.conduta, soft: resultado.soft, custo: resultado.custo, min: resultado.min,
        em: new Date().toISOString(),
        aluno: ctx.aluno || null,
      }, { limite: notaMinima !== null ? 500 : 10 });
    }
    setTela({ nome: 'debrief', resultado: { ...resultado, notaMinima, aluno: ctx?.aluno ?? null } });
  }

  switch (tela.nome) {
    case 'curso': {
      const c = curso(tela.cursoId);
      if (!c) return <Sala cursos={cursos} aoAbrirCurso={(id) => setTela({ nome: 'curso', cursoId: id })}
        aoEditarCurso={(id) => setTela({ nome: 'editor', cursoId: id })}
        aoNovoCurso={() => setTela({ nome: 'editor' })}
        aoAtender={(casoId) => setTela({ nome: 'atendimento', casoId })}
        aoGerarProva={(casoId) => setTela({ nome: 'prova', casoId, voltarPara: { nome: 'sala' } })} />;
      return (
        <Curso
          curso={c}
          aoVoltar={() => setTela({ nome: 'sala' })}
          aoEditar={() => setTela({ nome: 'editor', cursoId: c.id })}
          aoAtender={(aula) => {
            const contexto = { cursoId: c.id, aulaId: aula.id, tituloAula: aula.titulo, tituloCurso: c.titulo };
            if (aula.avaliacao?.ativa) setTela({ nome: 'identificacao', casoId: aula.casoId, contexto });
            else setTela({ nome: 'atendimento', casoId: aula.casoId, contexto });
          }}
          aoGerarProva={(casoId) => setTela({ nome: 'prova', casoId, voltarPara: { nome: 'curso', cursoId: c.id } })}
        />
      );
    }

    case 'identificacao': {
      const c = curso(tela.contexto.cursoId);
      const aula = c?.aulas.find((a) => a.id === tela.contexto.aulaId);
      if (!aula) return <Sala cursos={cursos} aoAbrirCurso={(id) => setTela({ nome: 'curso', cursoId: id })}
        aoEditarCurso={(id) => setTela({ nome: 'editor', cursoId: id })}
        aoNovoCurso={() => setTela({ nome: 'editor' })}
        aoAtender={(casoId) => setTela({ nome: 'atendimento', casoId })}
        aoGerarProva={(casoId) => setTela({ nome: 'prova', casoId, voltarPara: { nome: 'sala' } })} />;
      return (
        <IdentificacaoAluno
          aula={aula}
          aoConfirmar={(aluno) => setTela({ nome: 'atendimento', casoId: tela.casoId, contexto: { ...tela.contexto, aluno } })}
          aoCancelar={() => setTela({ nome: 'curso', cursoId: c.id })}
        />
      );
    }

    case 'prova':
      return (
        <Prova
          caso={acharCaso(tela.casoId)}
          aoVoltar={() => setTela(tela.voltarPara || { nome: 'sala' })}
        />
      );

    case 'editor':
      return (
        <EditorCurso
          curso={tela.cursoId ? curso(tela.cursoId) : null}
          aoSalvar={(salvo) => { setCursos(carregarCursos()); setTela({ nome: 'curso', cursoId: salvo.id }); }}
          aoCancelar={() => setTela(tela.cursoId ? { nome: 'curso', cursoId: tela.cursoId } : { nome: 'sala' })}
          aoRemover={() => { setCursos(carregarCursos()); setTela({ nome: 'sala' }); }}
        />
      );

    case 'atendimento':
      return (
        <Atendimento
          key={tela.casoId + (tela.contexto?.aulaId || '')}
          caso={acharCaso(tela.casoId)}
          contexto={tela.contexto}
          aoEncerrar={encerrar}
          aoSair={() => setTela(tela.contexto ? { nome: 'curso', cursoId: tela.contexto.cursoId } : { nome: 'sala' })}
        />
      );

    case 'debrief': {
      const r = tela.resultado;
      return (
        <Debrief
          r={r}
          caso={acharCaso(r.casoId)}
          aoVoltar={() => setTela(r.contexto ? { nome: 'curso', cursoId: r.contexto.cursoId } : { nome: 'sala' })}
          aoRefazer={() => setTela({ nome: 'atendimento', casoId: r.casoId, contexto: r.contexto })}
        />
      );
    }

    default:
      return (
        <Sala
          cursos={cursos}
          aoAbrirCurso={(id) => setTela({ nome: 'curso', cursoId: id })}
          aoEditarCurso={(id) => setTela({ nome: 'editor', cursoId: id })}
          aoNovoCurso={() => setTela({ nome: 'editor' })}
          aoAtender={(casoId) => setTela({ nome: 'atendimento', casoId })}
          aoGerarProva={(casoId) => setTela({ nome: 'prova', casoId, voltarPara: { nome: 'sala' } })}
        />
      );
  }
}
