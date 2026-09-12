import { SPEAKING } from './data';

// Speaking should work like Writing: memorize a safe skeleton and only adapt the
// content inside [brackets] to the exam topic. We mutate the existing task data
// so the current Guided / Semi-guided UI can present the template immediately.
const templates: Record<string, { description: string; lines: string[] }> = {
  'Teil 1': {
    description: 'Usa esta plantilla fija y cambia solo lo que está entre [corchetes]. No inventes una estructura nueva en el examen.',
    lines: [
      'Ich heiße [NOMBRE] und komme aus [PAÍS].',
      'Seit [TIEMPO] wohne ich in [CIUDAD].',
      'Zurzeit [TRABAJO / ESTUDIO].',
      'Ich spreche [IDIOMAS].',
      'In meiner Freizeit [HOBBIES / ACTIVIDADES].',
      'Und du? / Wie ist es bei dir?'
    ]
  },
  'Teil 2': {
    description: 'Plantilla universal para casi cualquier tema de Teil 2: resumen → opinión → razón → experiencia → cierre/pregunta. Cambia solo [TEMA], [OPINIÓN], [RAZÓN] y [EXPERIENCIA].',
    lines: [
      'In dem Text geht es um [TEMA].',
      'Die Person meint, dass [POSICIÓN DEL TEXTO].',
      'Ich persönlich finde, dass [TU OPINIÓN], weil [RAZÓN SIMPLE].',
      'Ein Vorteil / Nachteil ist, dass [IDEA].',
      'Aus meiner Erfahrung kann ich sagen, dass [EXPERIENCIA PROPIA].',
      'Deshalb denke ich, dass [CONCLUSIÓN SIMPLE].',
      'Was meinst du dazu? / Wie siehst du das?'
    ]
  },
  'Teil 3': {
    description: 'Plantilla universal para planificar juntos: abrir → proponer → reaccionar → resolver detalles → cerrar acuerdo. Cambia solo lo que está entre [corchetes].',
    lines: [
      'Okay, wir müssen [ACTIVIDAD / EVENTO] planen.',
      'Ich schlage vor, dass wir [PROPUESTA].',
      'Wie wäre es mit [ALTERNATIVA]?',
      'Das passt mir gut. / Leider passt mir das nicht, weil [RAZÓN].',
      'Dann könnten wir [NUEVA PROPUESTA / DETALLE].',
      'Was brauchen wir noch? / Wer kümmert sich um [DETALLE]?',
      'Also machen wir es so: [ACUERDO FINAL].'
    ]
  }
};

for (const task of SPEAKING as any[]) {
  const title = String(task[0] || '');
  const key = title.startsWith('Teil 1') ? 'Teil 1' : title.startsWith('Teil 2') ? 'Teil 2' : title.startsWith('Teil 3') ? 'Teil 3' : '';
  const template = templates[key];
  if (!template) continue;
  task[1] = template.description;
  task[2] = template.lines;
}
