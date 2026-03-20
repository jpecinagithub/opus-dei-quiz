const fs = require('fs');
const path = require('path');

const projectRoot = 'C:/Users/HP/Documents/GiithubREPOSITORIES/CODEX/opus-dei-quiz';
const srcRoot = path.join(projectRoot, 'src');
const inputs = [
  { type: 'ts', file: 'questions.ts', label: 'questions.ts' },
  { type: 'ts', file: 'questions_alvaro.ts', label: 'questions_alvaro.ts' },
  { type: 'ts', file: 'questions_javier.ts', label: 'questions_javier.ts' },
  { type: 'ts', file: 'questions_guadalupe.ts', label: 'questions_guadalupe.ts' },
  { type: 'ts', file: 'questions_monste.ts', label: 'questions_monste.ts' },
  { type: 'ts', file: 'questions_muzquiz.ts', label: 'questions_muzquiz.ts' },
  { type: 'ts', file: 'questions_dora.ts', label: 'questions_dora.ts' },
  { type: 'ts', file: 'questions_isidoro.ts', label: 'questions_isidoro.ts' },
];

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
    result.push({ file: fileName, id, text, options, correctIndex: correct, correctText, sourceType: 'ts' });
  }
  return result;
}

function parseQuestionsJson(filePath, fileName) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) return [];
  return data.map((item, idx) => {
    const id = item.id ?? null;
    const text = typeof item.text === 'string' ? item.text : '';
    const options = Array.isArray(item.options) ? item.options : [];
    const correct = Number.isInteger(item.correctAnswer) ? item.correctAnswer : -1;
    const correctText = correct >= 0 && correct < options.length ? options[correct] : '';
    return { file: fileName, id, text, options, correctIndex: correct, correctText, sourceType: 'json' };
  });
}

const sources = {
  S1: 'https://opusdei.org/es-es/article/cronologia-del-opus-dei-y-su-fundador/',
  S2: 'https://opusdei.org/fr-ci/article/histoire/',
  S3: 'https://opusdei.org/es/article/biografia-de-san-josemaria-2/',
  S4: 'https://escriva.org/es/camino/',
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
  S25: 'https://opusdei.org/en-uk/faq/opus-dei/',
  S26: 'https://opusdei.org/es/article/montserrat-grases/',
  S27: 'https://opusdei.org/es/article/biografia-de-montsegrases/',
  S28: 'https://odnmedia.s3.amazonaws.com/files/MontseGrases_unachicavaliente_biografia_juvenil20150602-115758.pdf',
  S29: 'https://opusdei.org/en/article/montse-grases-declared-venerable/',
  S30: 'https://opusdei.org/es/article/dora/',
  S31: 'https://opusdei.org/pt-br/article/biografia-9/',
  S32: 'https://es.wikipedia.org/wiki/Dora_del_Hoyo',
  S33: 'https://opusdei.org/pt-pt/article/biografia-jose-luis-muzquiz/',
  S34: 'https://es.wikipedia.org/wiki/Jos%C3%A9_Luis_M%C3%BAzquiz_de_Miguel',
  S35: 'https://opusdei.org/es/article/isidoro-zorzano/',
  S36: 'https://opusdei.org/es/article/cronologia-de-la-causa-de-canonizacion-de-isidoro/',
  S37: 'https://opusdei.org/en-us/article/free-e-book-on-engineer-isidoro-zorzano/',
  S38: 'https://es.wikipedia.org/wiki/Isidoro_Zorzano',
  S39: 'https://escriva.org/es/amigos-de-dios/296/',
  S40: 'https://escriva.org/es/amigos-de-dios/81/',
  S41: 'https://opusdei.org/es-co/article/torreciudad-un-santuario-mariano/',
  S42: 'https://opusdei.org/es-ec/article/26-de-junio-primera-festividad-de-san-josemaria/',
  S43: 'https://opusdei.org/es-es/article/la-primera-academia-residencia-1933-34/',
  S44: 'https://opusdei.org/es-es/article/la-obra-de-los-santos-rafael-miguel-y-gabriel/',
  S45: 'https://opusdei.org/es/article/cuadernos-breves-hacer-del-centro-un-hogar-libro-electronico/',
  S46: 'https://opusdei.org/es-es/article/universidad-central-en-la-calle-de-san-bernardo/',
  S47: 'https://opusdei.org/es/article/virgen-pilar-san-josemaria/',
  S48: 'https://opusdei.org/es-mx/article/un-recordatorio-de-81-anos/',
  S49: 'https://opusdei.org/es/article/bula-de-la-canonizacion-del-beato-josemaria/',
  S50: 'https://opusdei.org/es-pr/priestly-society-of-the-holy-cross/',
  S51: 'https://www.unav.edu/conoce-la-universidad/nuestra-historia'
};

function addSource(list, code) {
  if (!list.includes(code)) list.push(code);
}

const fileSources = {
  'questions_monste.ts': ['S26', 'S27', 'S28', 'S29'],
  'questions_muzquiz.ts': ['S33', 'S34'],
  'questions_dora.ts': ['S30', 'S31', 'S32'],
  'questions_isidoro.ts': ['S35', 'S36', 'S37', 'S38'],
};

const questionSources = {
  'questions.ts': {
    6: ['S39'],
    7: ['S7'],
    8: ['S2'],
    10: ['S2'],
    12: ['S46'],
    13: ['S51'],
    14: ['S10'],
    21: ['S20'],
    23: ['S3'],
    24: ['S4'],
    31: ['S3'],
    33: ['S9'],
    35: ['S2'],
    36: ['S3'],
    37: ['S14'],
    40: ['S42'],
    43: ['S41'],
    44: ['S41'],
    45: ['S13'],
    47: ['S41'],
    48: ['S49'],
    49: ['S9'],
    51: ['S45'],
    52: ['S40'],
    54: ['S12'],
    55: ['S43'],
    58: ['S14'],
    61: ['S3'],
    62: ['S14'],
    64: ['S3'],
    65: ['S47'],
    66: ['S12'],
    68: ['S50'],
    71: ['S25'],
    72: ['S13'],
    74: ['S44'],
    75: ['S44'],
    76: ['S44'],
    78: ['S10'],
    81: ['S3'],
    82: ['S11'],
    84: ['S48'],
    85: ['S15'],
    87: ['S3'],
    88: ['S11'],
    90: ['S25'],
    91: ['S11'],
    93: ['S3'],
    94: ['S10'],
    96: ['S20'],
    97: ['S7'],
    99: ['S3'],
    100: ['S4'],
  },
  'questions_alvaro.ts': {
    2005: ['S20'],
    2029: ['S20'],
    2031: ['S20'],
    2032: ['S20'],
    2033: ['S20'],
    2035: ['S20'],
    2038: ['S20'],
    2040: ['S20'],
    2041: ['S20'],
    2043: ['S20'],
    2046: ['S20'],
    2048: ['S20'],
    2049: ['S20'],
    2050: ['S20'],
  },
  'questions_guadalupe.ts': {
    1007: ['S16'],
    1013: ['S16'],
    1014: ['S16'],
    1015: ['S16'],
    1016: ['S16'],
    1029: ['S16'],
    1035: ['S16'],
    1037: ['S16'],
    1038: ['S16'],
    1042: ['S16'],
    1043: ['S16'],
    1044: ['S16'],
    1046: ['S16'],
    1048: ['S16'],
    1049: ['S16'],
    1057: ['S16'],
  },
  'questions_javier.ts': {
    3045: ['S18'],
    3046: ['S18'],
  },
};

function getVerification(text, fileName, id) {
  const src = [];
  let status = 'REVISAR';
  let notes = '';

  if (fileName && fileSources[fileName]) {
    for (const code of fileSources[fileName]) addSource(src, code);
    status = 'VERIFICADA';
  }

  if (fileName && id != null && questionSources[fileName] && questionSources[fileName][id]) {
    for (const code of questionSources[fileName][id]) addSource(src, code);
    status = 'VERIFICADA';
  }

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

  if (/Montse|Montserrat Grases/.test(text)) { addSource(src, 'S26'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/venerable|decreto de virtudes heroicas|virtudes heroicas|declarad[ao] venerable/.test(text) && /Montse|Montserrat/.test(text)) {
    addSource(src, 'S29');
    if (status === 'REVISAR') status = 'VERIFICADA';
  }
  if (/José Luis Múzquiz|Múzquiz/.test(text)) { addSource(src, 'S33'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Dora del Hoyo/.test(text)) { addSource(src, 'S30'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/Isidoro Zorzano/.test(text)) { addSource(src, 'S35'); if (status === 'REVISAR') status = 'VERIFICADA'; }
  if (/proceso informativo|testigos|decreto|canonizaci[oó]n|beatificaci[oó]n/.test(text) && /Isidoro/.test(text)) {
    addSource(src, 'S36');
    if (status === 'REVISAR') status = 'VERIFICADA';
  }

  if (/¿Cómo se llamaba/.test(text)) {
    // factual, do not auto-flag
  } else if (/actitud|rasgo|rasgos|representa|cómo era|qué valor|defendía|liderazgo|qué buscaba|qué importancia|qué sentimiento|qué cualidad|cómo se describe/.test(text)) {
    status = 'REVISAR';
    if (!notes) notes = 'Enunciado cualitativo o valorativo; requiere fuente específica.';
  }

  return { sources: src, status, notes };
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getQualityFlags(q) {
  const notes = [];
  const text = q.text || '';
  const options = q.options || [];

  if (text.includes('?') && !text.includes('¿')) {
    notes.push('Falta el signo de apertura "¿".');
  }
  if (!text.includes('?')) {
    notes.push('Falta el signo de cierre "?".');
  }

  const typoPatterns = [
    /\b(tinha|quando|soinhaba|trasladou|trabalh|conhec|anios|espainola|alemian|diplomata|ens(e|i)h|virtu des|festivel|directeur|suffer)\b/i,
  ];
  if (typoPatterns.some((re) => re.test(text))) {
    notes.push('Redacción con posibles errores ortográficos o mezcla de idioma.');
  }
  if (options.some((opt) => typoPatterns.some((re) => re.test(String(opt))))) {
    notes.push('Opciones con posibles errores ortográficos o mezcla de idioma.');
  }

  const metaAnswers = options.filter((opt) =>
    /todas las anteriores|ninguno de los anteriores|ninguna de las anteriores/i.test(String(opt))
  );
  if (metaAnswers.length) {
    notes.push('Respuesta de tipo meta (Todas/Ninguno), suele generar ambigüedad.');
  }

  if (q.correctIndex < 0 || q.correctIndex >= options.length) {
    notes.push('Índice de respuesta correcta fuera de rango.');
  }

  return notes;
}

let all = [];
for (const input of inputs) {
  const filePath =
    input.type === 'ts'
      ? path.join(srcRoot, input.file)
      : path.join(projectRoot, input.file);
  if (!fs.existsSync(filePath)) continue;
  if (input.type === 'ts') {
    all = all.concat(parseQuestions(filePath, input.label));
  } else {
    all = all.concat(parseQuestionsJson(filePath, input.label));
  }
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

// Detección de duplicados (por texto normalizado)
const dupMap = new Map();
for (const q of all) {
  const key = normalizeText(q.text || '');
  if (!key) continue;
  const list = dupMap.get(key) || [];
  list.push(q);
  dupMap.set(key, list);
}

const duplicateGroups = Array.from(dupMap.entries())
  .filter(([, list]) => list.length > 1)
  .map(([key, list]) => {
    const signatures = new Set(
      list.map((q) => JSON.stringify({ options: q.options, correctText: q.correctText }))
    );
    return { key, list, inconsistent: signatures.size > 1 };
  });

const grouped = all.reduce((acc, q) => {
  acc[q.file] = acc[q.file] || [];
  acc[q.file].push(q);
  return acc;
}, {});

for (const file of Object.keys(grouped)) {
  lines.push('');
  lines.push(`## ${file}`);
  for (const q of grouped[file]) {
    const ver = getVerification(q.text, q.file, q.id);
    const sourcesList = ver.sources.length ? ver.sources.join(', ') : 'SIN FUENTE';
    const qualityNotes = getQualityFlags(q);
    const dupKey = normalizeText(q.text || '');
    const dupGroup = duplicateGroups.find((g) => g.key === dupKey);
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
    if (dupGroup) {
      lines.push(`Duplicada: Sí (${dupGroup.inconsistent ? 'INCONSISTENTE' : 'consistente'})`);
    }
    if (ver.notes) lines.push(`Notas: ${ver.notes}`);
    if (qualityNotes.length) lines.push(`Observaciones: ${qualityNotes.join(' ')}`);
  }
}

// Resumen de calidad
lines.push('');
lines.push('## Resumen de calidad');
const total = all.length;
const withSources = all.filter((q) => getVerification(q.text, q.file, q.id).sources.length > 0).length;
const withoutSources = total - withSources;
lines.push(`Total de preguntas: ${total}`);
lines.push(`Con fuentes: ${withSources}`);
lines.push(`Sin fuentes: ${withoutSources}`);
lines.push(`Duplicados detectados: ${duplicateGroups.length}`);

if (duplicateGroups.length) {
  lines.push('');
  lines.push('### Duplicados');
  for (const group of duplicateGroups) {
    const title = group.list[0]?.text || '(sin texto)';
    lines.push('');
    lines.push(`- ${title} (${group.inconsistent ? 'INCONSISTENTE' : 'consistente'})`);
    for (const q of group.list) {
      const ref = `${q.file}${q.id != null ? ` (ID ${q.id})` : ''}`;
      lines.push(`  - ${ref}`);
    }
  }
}

fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
console.log('Reporte generado: ' + reportPath);
