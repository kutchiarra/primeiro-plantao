import { useState } from 'react';
import Sala from './Sala.jsx';
import Curso from './Curso.jsx';
import EditorCurso from './EditorCurso.jsx';
import Atendimento from './Atendimento.jsx';
import Debrief from './Debrief.jsx';
import { acharCaso } from './dados/casos.js';
import { carregarCursos, registrarConclusao } from './dados/cursos.js';

export default function App() {
  const [cursos, setCursos] = useState(carregarCursos);
  const [tela, setTela] = useState({ nome: 'sala' });

  const curso = (id) => cursos.find((c) => c.id === id);

  function encerrar(resultado) {
    const ctx = resultado.contexto;
    if (ctx?.cursoId) {
      registrarConclusao(ctx.cursoId, ctx.aulaId, {
        total: resultado.total, anamnese: resultado.anamnese, investigacao: resultado.investigacao,
        conduta: resultado.conduta, soft: resultado.soft, custo: resultado.custo, min: resultado.min,
        em: new Date().toISOString(),
      });
    }
    setTela({ nome: 'debrief', resultado });
  }

  switch (tela.nome) {
    case 'curso': {
      const c = curso(tela.cursoId);
      if (!c) return <Sala cursos={cursos} aoAbrirCurso={(id) => setTela({ nome: 'curso', cursoId: id })}
        aoEditarCurso={(id) => setTela({ nome: 'editor', cursoId: id })}
        aoNovoCurso={() => setTela({ nome: 'editor' })}
        aoAtender={(casoId) => setTela({ nome: 'atendimento', casoId })} />;
      return (
        <Curso
          curso={c}
          aoVoltar={() => setTela({ nome: 'sala' })}
          aoEditar={() => setTela({ nome: 'editor', cursoId: c.id })}
          aoAtender={(aula) => setTela({
            nome: 'atendimento', casoId: aula.casoId,
            contexto: { cursoId: c.id, aulaId: aula.id, tituloAula: aula.titulo, tituloCurso: c.titulo },
          })}
        />
      );
    }

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
        />
      );
  }
}
