import { describe, it, expect } from 'vitest';
import { QUESTIONS_POOL } from '../questions';
import { ALVARO_QUESTIONS_POOL } from '../questions_alvaro';
import { JAVIER_QUESTIONS_POOL } from '../questions_javier';
import { GUADALUPE_QUESTIONS_POOL } from '../questions_guadalupe';
import { MONSTE_QUESTIONS_POOL } from '../questions_monste';

const pools = [
  { name: 'josemaria', data: QUESTIONS_POOL, min: 100 },
  { name: 'alvaro', data: ALVARO_QUESTIONS_POOL, min: 50 },
  { name: 'javier', data: JAVIER_QUESTIONS_POOL, min: 50 },
  { name: 'guadalupe', data: GUADALUPE_QUESTIONS_POOL, min: 50 },
  { name: 'monste', data: MONSTE_QUESTIONS_POOL, min: 50 },
];

describe('Question pools', () => {
  it('tienen el tamaño esperado', () => {
    for (const pool of pools) {
      expect(pool.data.length).toBeGreaterThanOrEqual(pool.min);
    }
  });

  it('todas las preguntas tienen 4 opciones y un índice válido', () => {
    for (const pool of pools) {
      for (const q of pool.data) {
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options.length).toBe(4);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswer).toBeLessThan(q.options.length);
      }
    }
  });
});

