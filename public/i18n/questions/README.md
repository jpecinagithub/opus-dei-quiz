# Traducciones de preguntas

Cada archivo debe contener un array JSON con objetos del siguiente formato:

```
[
  {
    "id": "josemaria-1",
    "text": "Question text",
    "options": ["A", "B", "C", "D"]
  }
]
```

Rutas esperadas:
- `public/i18n/questions/en/<topic>.json`
- `public/i18n/questions/fr/<topic>.json`
- `public/i18n/questions/de/<topic>.json`
- `public/i18n/questions/it/<topic>.json`
- `public/i18n/questions/pt/<topic>.json`

`topic` puede ser: `josemaria`, `alvaro`, `javier`, `guadalupe`.

Si no existe traducción para una pregunta, la app mostrará el texto en español.
