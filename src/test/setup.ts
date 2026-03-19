import '@testing-library/jest-dom/vitest';
import i18n from '../i18n';

// Ensure deterministic language in tests.
localStorage.setItem('i18nextLng', 'es');
i18n.changeLanguage('es');
