export type GameMode = 'standard' | 'time-trial' | 'survival';
export type Topic = 'josemaria' | 'alvaro' | 'javier' | 'guadalupe';

export interface Question {
  id?: number | string;
  text: string;
  options: string[];
  correctAnswer: number; // index
  category?: 'life' | 'opus-dei' | 'expansion' | 'books';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export interface ScoreRecord {
  id?: string;
  uid: string;
  displayName: string;
  score: number;
  mode: GameMode;
  topic: Topic;
  time?: number; // ms
  timestamp: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
