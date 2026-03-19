const fs = require('fs');
const path = require('path');

const root = 'C:/Users/HP/Documents/GiithubREPOSITORIES/CODEX/opus-dei-quiz/src';
const files = ['questions.ts','questions_alvaro.ts','questions_javier.ts','questions_guadalupe.ts'];

function parseQuestions(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const pattern = /\{\s*(?:id:\s*(\d+)\s*,\s*)?text:\s*(".*?"|'.*?')\s*,\s*options:\s*\[(.*?)\]\s*,\s*correctAnswer:\s*(\d+)/gs;
  const optPattern = /["'](.*?)["']/g;
  const result = [];
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const id = m[1] ? Number(m[1]) : null;
    const textRaw = m[2].trim();
    const text = textRaw.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    const optionsRaw = m[3];
    const options = [];
    let om;
    while ((om = optPattern.exec(optionsRaw)) !== null) {
      options.push(om[1]);
    }
    const correct = Number(m[4]);
    const correctText = correct >= 0 && correct < options.length ? options[correct] : '';
    result.push({ file: fileName, id, text, options, correctIndex: correct, correctText });
  }
  return result;
}

const sources = {
  S1: 'https://opusdei.org/es-es/article/cronologia-del-opus-dei-y-su-fundador/',
  S2: 'https://opusdei.org/fr-ci/article/histoire/',
  S3: 'https://opusdei.org/es/saint-josemaria/',
  S4: 'https://escriva.org/en/the-way/',
  S5: 'https://escriva.org/es/book-subject/camino/508/',
  S6: 'https://escriva.org/es/camino/999/',
  S7: 'https://escriva.org/en/surco/',
  S8: 'https://escriva.org/en/surco/1000/',
  S9: 'https://escriva.org/en/the-forge/',
  S10: 'https://escriva.org/en/amigos-de-dios/',
  S11: 'https://escriva.org/en/es-cristo-que-pasa/',
  S12: 'https://escriva.org/en/santo-rosario/',
  S13: 'https://escriva.org/en/via-crucis/',
  S14: 'https://escriva.org/en/conversaciones/',
  S15: 'https://escriva.org/pt-pt/la-abadesa-de-las-huelgas/',
  S16: 'https://opusdei.org/es-es/article/biografia-de-guadalupe/',
  S17: 'https://opusdei.org/en/article/biografia-de-mons-javier-echevarria/',
  S18: 'https://opusdei.org/en/article/bishop-javier-echevarria-has-passed-away/',
  S19: 'https://opusdei.org/en-us/article/prayer-for-bishop-alvaro-del-portillos-intercession/',
  S20: 'https://opusdei.org/en/article/brief-biography-of-bishop-alvaro-del-portillo-1914-1994/',
  S21: 'https://opusdei.org/pt-br/article/d-alvaro-del-portillo-fiel-sucessor-de-s-josemaria/',
  S22: 'https://opusdei.org/es/article/cavabianca-colegio-romano-de-la-santa-cruz-opus-dei/',
  S23: 'https://opusdei.org/es-es/article/opus-dei-en-la-paz/',
  S24: 'https://opusdei.org/es-es/article/villa-tevere-sede-central-opus-dei/',
  S25: 'https://opusdei.org/en-uk/faq/opus-dei/'
};

function addSource(list, code) {
  if (!list.includes(code)) list.push(code);
}

function getVerification(text) {
  const src = [];
  let status = 'REVISAR';
  let notes = '';

  if (/¿En qué año comenzó el Opus Dei en |¿Qué país comenzó en |labor estable en/.test(text)) {
    addSource(src, 'S2');
    status = 'VERIFICADA';
  }

  if (/fundación del Opus Dei|se fundó el Opus Dei|14 de febrero de 1930|14 de febrero de 1943|Academia DYA|\bDYA\b|Colegio Romano de la Santa Cruz|Colegio Romano de Santa María|Estudio General|Consideraciones Espirituales|Santo Rosario"|aprobación definitiva|Prelatura Personal|llegó a Roma|Roma/.test(text)) {
    addSource(src, 'S1');
    if (status === 'REVISAR') status = 'VERIFICADA';
  }

  if (/San Josemaría/.test(text) && /(nació|falleció|canonizado|beatificado|ordenación|padre|madre|hermano|hermana|Barbastro|Roma)/.test(text)) {
    addSource(src, 'S3');
    if (status === 'REVISAR') status = 'VERIFICADA';
  }

  if (/Villa Tevere/.test(text)) { addSource(src, 'S24'); status = 'VERIFICADA'; }
  if (/Santa Maria della Paz|Santa María de la Paz|restos/.test(text)) { addSource(src, 'S23'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Colegio Romano de la Santa Cruz|Colegio Romano de Santa María/.test(text)) { addSource(src, 'S22'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/mensaje central del Opus Dei|santificación del trabajo/.test(text)) { addSource(src, 'S25'); if (status === 'REVISAR') status = 'VERIFICADA'; }

  if (/Camino/.test(text)) { addSource(src, 'S4'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/primer punto/.test(text) && /Camino/.test(text)) { addSource(src, 'S5'); status = 'VERIFICADA'; }
  if (/último punto/.test(text) && /Camino/.test(text)) { addSource(src, 'S6'); status = 'VERIFICADA'; }
  if (/999 puntos/.test(text)) { addSource(src, 'S8'); status = 'VERIFICADA'; }
  if (/Surco/.test(text)) { addSource(src, 'S7'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Forja/.test(text)) { addSource(src, 'S9'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Amigos de Dios/.test(text)) { addSource(src, 'S10'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Es Cristo que pasa/.test(text)) { addSource(src, 'S11'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Santo Rosario/.test(text)) { addSource(src, 'S12'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Vía Crucis/.test(text)) { addSource(src, 'S13'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Conversaciones/.test(text)) { addSource(src, 'S14'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Abadesa de las Huelgas/.test(text)) { addSource(src, 'S15'); if (status === 'REVISAR') status = 'VERIFICADA'; }

  if (/Guadalupe/.test(text)) { addSource(src, 'S16'); if (status === 'REVISAR') status = 'VERIFICADA'; }

  if (/Javier Echevarría/.test(text)) { addSource(src, 'S17'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/falleció Javier Echevarría|hospital|Our Lady of Guadalupe|Virgen de Guadalupe/.test(text)) { addSource(src, 'S18'); if (status === 'REVISAR') status = 'VERIFICADA'; }

  if (/Álvaro del Portillo/.test(text)) { addSource(src, 'S19'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Saxum/.test(text)) { addSource(src, 'S21'); if (status === 'REVISAR') status = 'VERIFICADA'; }

  if (/¿Cómo se llamaba/.test(text)) {
    // factual, do not auto-flag
  } else if (/actitud|rasgo|rasgos|representa|cómo era|qué valor|defendía|liderazgo|qué buscaba|qué importancia|qué sentimiento|qué cualidad|cómo se describe/.test(text)) {
    status = 'REVISAR';
    if (!notes) notes = 'Enunciado cualitativo o valorativo; requiere fuente específica.';
  }

  return { sources: src, status, notes };
}

let all = [];
for (const f of files) {
  const filePath = path.join(root, f);
  all = all.concat(parseQuestions(filePath, f));
}

const reportPath = 'C:/Users/HP/Documents/GiithubREPOSITORIES/CODEX/opus-dei-quiz/reports/informe_preguntas.md';
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const lines = [];
lines.push('# Informe de verificacion de preguntas');
lines.push('');
const now = new Date();
lines.push(`Generado: ${now.toISOString().slice(0,16).replace('T',' ')}`);
lines.push('');
lines.push('## Fuentes');
for (const key of Object.keys(sources)) {
  lines.push(`[${key}] ${sources[key]}`);
}

const grouped = all.reduce((acc, q) => {
  acc[q.file] = acc[q.file] || [];
  acc[q.file].push(q);
  return acc;
}, {});

for (const file of Object.keys(grouped)) {
  lines.push('');
  lines.push(`## ${file}`);
  for (const q of grouped[file]) {
    const ver = getVerification(q.text);
    const sourcesList = ver.sources.length ? ver.sources.join(', ') : 'SIN FUENTE';
    lines.push('');
    lines.push(`Pregunta: ${q.text}`);
    if (q.id !== null) lines.push(`ID: ${q.id}`);
    lines.push(`Respuesta correcta: ${q.correctText}`);
    if (ver.status === 'REVISAR') {
      lines.push('Estado: <span style="background:#fff3cd; padding:0 4px; border-radius:4px;">REVISAR</span>');
    } else {
      lines.push(`Estado: ${ver.status}`);
    }
    lines.push(`Fuentes: ${sourcesList}`);
    if (ver.notes) lines.push(`Notas: ${ver.notes}`);
  }
}

fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
console.log('Reporte generado: ' + reportPath);
