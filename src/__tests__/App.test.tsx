import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

let mockAuthUser: any = null;

vi.mock('../firebase', () => {
  return {
    auth: {},
    db: {},
    googleProvider: {},
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn((_q: unknown, cb: (snapshot: { docs: any[] }) => void) => {
      cb({ docs: [] });
      return () => {};
    }),
    onAuthStateChanged: vi.fn((_auth: unknown, cb: (user: any) => void) => {
      cb(mockAuthUser);
      return () => {};
    }),
  };
});

vi.mock('../services', () => ({
  saveScore: vi.fn(),
  saveUserProfile: vi.fn(),
  handleFirestoreError: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    mockAuthUser = null;
  });

  it('muestra la pantalla de login cuando no hay sesión', async () => {
    render(<App />);
    expect(await screen.findByText(/Huellas de San Josemaría/i)).toBeInTheDocument();
  });

  it('muestra la home cuando hay sesión activa', async () => {
    mockAuthUser = {
      uid: 'user-1',
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.png',
      email: 'test@example.com',
    };
    render(<App />);
    expect(await screen.findByText(/Selecciona el tema/i)).toBeInTheDocument();
  });
});
