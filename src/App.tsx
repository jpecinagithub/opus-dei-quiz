import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Play, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  History,
  User as UserIcon,
  Home as HomeIcon,
  RefreshCw,
  Award,
  Moon,
  Sun
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, onSnapshot, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from './firebase';
import { QUESTIONS_POOL } from './questions';
import { ALVARO_QUESTIONS_POOL } from './questions_alvaro';
import { JAVIER_QUESTIONS_POOL } from './questions_javier';
import { GUADALUPE_QUESTIONS_POOL } from './questions_guadalupe';
import { MONSTE_QUESTIONS_POOL } from './questions_monste';
import { MUZQUIZ_QUESTIONS_POOL } from './questions_muzquiz';
import { DORA_QUESTIONS_POOL } from './questions_dora';
import { ISIDORO_QUESTIONS_POOL } from './questions_isidoro';
import { GameMode, Question, ScoreRecord, UserProfile, Topic, OperationType } from './types';
import { saveScore, saveUserProfile, handleFirestoreError } from './services';
import { ErrorBoundary } from './components/ErrorBoundary';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Mail, Lock, User as UserIconOutline } from 'lucide-react';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, normalizeLanguage } from './i18n/languages';
import { localizeQuestions } from './i18n/questions';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

type ThemeMode = 'light' | 'dark';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  icon: Icon,
  required = false 
}: { 
  type?: string; 
  placeholder: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  icon?: any;
  required?: boolean;
}) => (
  <div className="relative">
    {Icon && (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
        <Icon size={18} />
      </div>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={cn(
        "w-full bg-stone-100 border border-stone-300 rounded-xl py-3 px-4 text-stone-800 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-400 transition-all dark:bg-stone-800 dark:border-stone-600 dark:text-stone-200 dark:placeholder:text-stone-400",
        Icon && "pl-11"
      )}
    />
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled = false,
  type = 'button',
  icon: Icon
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: any;
}) => {
  const variants = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm',
    secondary: 'bg-stone-700 text-white hover:bg-stone-800 shadow-sm',
    outline: 'border-2 border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700',
    ghost: 'text-stone-500 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-700',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className
      )}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

const Card = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className={cn('bg-stone-50 p-6 rounded-2xl shadow-sm border border-stone-200 dark:bg-stone-800 dark:border-stone-600', className)}
  >
    {children}
  </motion.div>
);

const LanguageSwitcher = ({ className }: { className?: string }) => {
  const { i18n } = useTranslation();
  const current = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(current);
  const next = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(next)}
      className={cn(
        'inline-flex items-center justify-center w-10 h-10 rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700',
        className
      )}
      aria-label="Toggle language"
      title={LANGUAGE_LABELS[current]}
    >
      <div className="relative">
        <Globe size={18} />
        <span className="absolute -bottom-2 -right-3 text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
          {current.toUpperCase()}
        </span>
      </div>
    </button>
  );
};

const ThemeToggle = ({ theme, onToggle, className }: { theme: ThemeMode; onToggle: () => void; className?: string }) => (
  <button
    type="button"
    onClick={onToggle}
    className={cn(
      'inline-flex items-center justify-center w-10 h-10 rounded-lg border border-stone-300 text-stone-500 hover:bg-stone-100 transition-colors dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700',
      className
    )}
    aria-label="Toggle theme"
  >
    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
  </button>
);

// --- Main App ---

export default function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'game' | 'leaderboard'>('home');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [topic, setTopic] = useState<Topic>('josemaria');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [usersByUid, setUsersByUid] = useState<Record<string, UserProfile>>({});
  
  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = normalizeLanguage(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const fallbackName = t('common.defaultUser');
        const profile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || fallbackName,
          photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || fallbackName)}&background=random`,
          email: firebaseUser.email || '',
        };
        setUser(profile);
        saveUserProfile(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collection(db, 'scores');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newScores = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          topic: data.topic || 'josemaria'
        } as ScoreRecord;
      });
      setScores(newScores);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scores');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next: Record<string, UserProfile> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data?.uid) {
          next[data.uid] = {
            uid: data.uid,
            displayName: data.displayName || t('common.defaultUser'),
            photoURL: data.photoURL || '',
            email: data.email || '',
          };
        }
      });
      setUsersByUid(next);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubscribe();
  }, [t]);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthError(t('auth.errors.google'));
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email login error:', error);
      setAuthError(t('auth.errors.invalidCredentials'));
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) {
      setAuthError(t('auth.errors.missingName'));
      return;
    }
    try {
      setAuthError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Force profile update in state
      const profile = {
        uid: userCredential.user.uid,
        displayName: displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
        email: email,
      };
      setUser(profile);
      await saveUserProfile(profile);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError(t('auth.errors.emailInUse'));
      } else {
        setAuthError(t('auth.errors.registerGeneric'));
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-emerald-500"
        >
          <RefreshCw size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-800 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-end gap-2">
            <LanguageSwitcher />
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
          </div>
          <div className="space-y-4">
            <div className="inline-flex mb-4">
              <img
                src="/images/san josemaria.jpg"
                alt={t('topics.josemaria.title')}
                className="w-28 h-28 rounded-3xl object-cover border border-stone-200 shadow-sm"
              />
            </div>
            <h1 className="text-4xl font-bold text-stone-800 dark:text-stone-200 tracking-tight">{t('auth.title')}</h1>
            <p className="text-stone-600 dark:text-stone-300 text-lg">
              {t('auth.subtitle')}
            </p>
          </div>
          
          <Card className="space-y-6 text-left">
            <div className="flex border-b border-stone-200 mb-6">
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={cn(
                  "flex-1 py-3 font-bold text-sm transition-all border-b-2",
                  authMode === 'login' ? "border-emerald-400 text-emerald-500" : "border-transparent text-stone-500 dark:text-stone-400"
                )}
              >
                {t('auth.loginTab')}
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={cn(
                  "flex-1 py-3 font-bold text-sm transition-all border-b-2",
                  authMode === 'register' ? "border-emerald-400 text-emerald-500" : "border-transparent text-stone-500 dark:text-stone-400"
                )}
              >
                {t('auth.registerTab')}
              </button>
            </div>

            <form onSubmit={authMode === 'login' ? handleEmailLogin : handleEmailRegister} className="space-y-4">
              {authMode === 'register' && (
                <Input 
                  placeholder={t('auth.usernamePlaceholder')}
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  icon={UserIconOutline}
                  required
                />
              )}
              <Input 
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                icon={Mail}
                required
              />
              <Input 
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                icon={Lock}
                required
              />

              {authError && (
                <p className="text-rose-600 text-sm font-medium bg-rose-50 p-3 rounded-lg border border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/40">
                  {authError}
                </p>
              )}

              <Button type="submit" className="w-full py-4 text-lg">
                {authMode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200 dark:border-stone-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-stone-50 dark:bg-stone-800 px-2 text-stone-500 font-bold">{t('auth.or')}</span>
              </div>
            </div>

            <Button onClick={handleGoogleLogin} variant="outline" className="w-full py-3" icon={Globe}>
              {t('auth.googleButton')}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 font-sans">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-stone-50/80 dark:bg-stone-800/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-600 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <Globe size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">{t('common.brand')}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeToggle
                theme={theme}
                onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />
              <button 
                onClick={() => setView('leaderboard')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  view === 'leaderboard'
                    ? "bg-stone-200 text-emerald-500 dark:bg-stone-800 dark:text-emerald-300"
                    : "text-stone-500 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                )}
              >
                <Trophy size={24} />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-stone-200 dark:border-stone-700">
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-stone-300 dark:border-stone-600" />
                <button onClick={handleLogout} className="text-stone-400 hover:text-rose-500 transition-colors dark:hover:text-rose-300">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto p-6">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <HomeView 
                allScores={scores}
                onStart={(mode, selectedTopic) => {
                  setGameMode(mode);
                  setTopic(selectedTopic);
                  setView('game');
                }} 
              />
            )}
            {view === 'game' && (
              <GameView 
                user={user}
                mode={gameMode} 
                topic={topic}
                allScores={scores}
                onFinish={() => setView('leaderboard')} 
                onCancel={() => setView('home')}
              />
            )}
            {view === 'leaderboard' && (
              <LeaderboardView scores={scores} usersByUid={usersByUid} onPlayAgain={() => setView('home')} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

// --- Views ---

function HomeView({ onStart, allScores }: { onStart: (mode: GameMode, topic: Topic) => void; allScores: ScoreRecord[] }) {
  const { t } = useTranslation();
  const [selectedTopic, setSelectedTopic] = useState<Topic>('josemaria');

  const bestTimeTrial = allScores
    .filter(s => s.mode === 'time-trial' && s.score > 0 && s.topic === selectedTopic)
    .reduce((min, s) => (s.time && s.time < min ? s.time : min), Infinity);

  const topics = [
    {
      id: 'josemaria' as Topic,
      title: t('topics.josemaria.title'),
      desc: t('topics.josemaria.desc'),
      image: '/images/san josemaria.jpg',
      color: 'bg-emerald-100/70 text-emerald-500',
    },
    {
      id: 'alvaro' as Topic,
      title: t('topics.alvaro.title'),
      desc: t('topics.alvaro.desc'),
      image: '/images/alvarodelportillo.jpg',
      color: 'bg-blue-100/70 text-blue-600',
    },
    {
      id: 'javier' as Topic,
      title: t('topics.javier.title'),
      desc: t('topics.javier.desc'),
      image: '/images/javierechevarria.jpg',
      color: 'bg-amber-100/70 text-amber-600',
    },
    {
      id: 'guadalupe' as Topic,
      title: t('topics.guadalupe.title'),
      desc: t('topics.guadalupe.desc'),
      image: '/images/guadalupeortiz.jpg',
      color: 'bg-rose-100/70 text-rose-600',
    },
    {
      id: 'monste' as Topic,
      title: t('topics.monste.title'),
      desc: t('topics.monste.desc'),
      image: '/images/monste.jpg',
      color: 'bg-purple-100/70 text-purple-600',
    },
    {
      id: 'muzquiz' as Topic,
      title: t('topics.muzquiz.title'),
      desc: t('topics.muzquiz.desc'),
      image: '/images/jose-luis-muzquiz.jpg',
      color: 'bg-cyan-100/70 text-cyan-600',
    },
    {
      id: 'dora' as Topic,
      title: t('topics.dora.title'),
      desc: t('topics.dora.desc'),
      image: '/images/dora.jpg',
      color: 'bg-orange-100/70 text-orange-600',
    },
    {
      id: 'isidoro' as Topic,
      title: t('topics.isidoro.title'),
      desc: t('topics.isidoro.desc'),
      image: '/images/isidoro.jpg',
      color: 'bg-teal-100/70 text-teal-600',
    }
  ];

  const modes = [
    {
      id: 'standard' as GameMode,
      title: t('modes.standard.title'),
      desc: t('modes.standard.desc'),
      iconSrc: '/icons/mode-standard.svg',
      color: 'bg-stone-100 text-stone-600',
    },
    {
      id: 'time-trial' as GameMode,
      title: t('modes.timeTrial.title'),
      desc: t('modes.timeTrial.desc'),
      iconSrc: '/icons/mode-time.svg',
      color: 'bg-amber-50 text-amber-600',
      extra: bestTimeTrial !== Infinity
        ? t('modes.timeTrial.record', { time: (bestTimeTrial / 1000).toFixed(2) })
        : t('modes.timeTrial.noRecord')
    },
    {
      id: 'survival' as GameMode,
      title: t('modes.survival.title'),
      desc: t('modes.survival.desc'),
      iconSrc: '/icons/mode-survival.svg',
      color: 'bg-rose-50 text-rose-600',
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 py-8"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('home.step1Title')}</h2>
          <p className="text-stone-500 text-lg">{t('home.step1Desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={cn(
                "flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
                selectedTopic === t.id 
                  ? "border-emerald-400 bg-emerald-100/60 ring-4 ring-emerald-400/15 dark:bg-emerald-900/20" 
                  : "border-stone-200 bg-stone-50 hover:border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-500"
              )}
            >
              <div className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2", selectedTopic === t.id ? "border-emerald-300" : "border-stone-100 dark:border-stone-800")}>
                <img src={t.image} alt={t.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{t.title}</h4>
                <p className="text-stone-600 dark:text-stone-400 text-sm">{t.desc}</p>
              </div>
              {selectedTopic === t.id && (
                <div className="ml-auto text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('home.step2Title')}</h2>
          <p className="text-stone-500 text-lg">{t('home.step2Desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group cursor-pointer"
              onClick={() => onStart(mode.id, selectedTopic)}
            >
              <Card className="h-full flex flex-col items-start gap-6 p-8 border-2 border-transparent hover:border-emerald-400 transition-all">
                <div className={cn('p-2 rounded-2xl', mode.color)}>
                  <img src={mode.iconSrc} alt={mode.title} className="w-14 h-14" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{mode.title}</h3>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{mode.desc}</p>
                  {mode.extra && (
                    <p className="text-amber-600 font-bold text-sm bg-amber-100/70 dark:bg-amber-900/30 px-3 py-1 rounded-full inline-block">
                      {mode.extra}
                    </p>
                  )}
                </div>
                <div className="mt-auto pt-4 flex items-center text-emerald-500 font-bold gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('common.playNow')} <ChevronRight size={20} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function GameView({ user, mode, topic, allScores, onFinish, onCancel }: { user: UserProfile; mode: GameMode; topic: Topic; allScores: ScoreRecord[]; onFinish: () => void; onCancel: () => void }) {
  const { t, i18n } = useTranslation();
  const [baseQuestions, setBaseQuestions] = useState<Question[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [bonusAwarded, setBonusAwarded] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const timerRef = useRef<any>(null);

  const bestTimeTrial = allScores
    .filter(s => s.mode === 'time-trial' && s.topic === topic)
    .reduce((min, s) => (s.time && s.time < min ? s.time : min), Infinity);

  useEffect(() => {
    // Select questions
    let pool = QUESTIONS_POOL;
    if (topic === 'alvaro') pool = ALVARO_QUESTIONS_POOL;
    if (topic === 'javier') pool = JAVIER_QUESTIONS_POOL;
    if (topic === 'guadalupe') pool = GUADALUPE_QUESTIONS_POOL;
    if (topic === 'monste') pool = MONSTE_QUESTIONS_POOL;
    if (topic === 'muzquiz') pool = MUZQUIZ_QUESTIONS_POOL;
    if (topic === 'dora') pool = DORA_QUESTIONS_POOL;
    if (topic === 'isidoro') pool = ISIDORO_QUESTIONS_POOL;
    
    let selected: Question[] = [];
    if (mode === 'survival') {
      selected = [...pool].sort(() => Math.random() - 0.5);
    } else {
      selected = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    }
    setBaseQuestions(selected);
    setQuestions(selected);

    if (mode === 'time-trial') {
      timerRef.current = setInterval(() => {
        setTimer(Date.now() - startTime);
      }, 100);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, topic, startTime]);

  useEffect(() => {
    let active = true;
    if (baseQuestions.length === 0) return;

    const run = async () => {
      const normalizedLang = normalizeLanguage(i18n.language);
      if (normalizedLang === 'es') {
        setIsTranslating(false);
        setQuestions(baseQuestions);
        return;
      }
      setIsTranslating(true);
      const localized = await localizeQuestions(topic, normalizedLang, baseQuestions);
      if (!active) return;
      setQuestions(localized);
      setIsTranslating(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [baseQuestions, i18n.language, topic]);

  const handleAnswer = (index: number) => {
    if (showResult) return;

    const isCorrect = index === questions[currentIndex].correctAnswer;
    setShowResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      if (mode === 'standard') setPoints(p => p + 10);
      if (mode === 'survival') setPoints(p => p + 2);
    }

    setTimeout(() => {
      setShowResult(null);
      
      const isLast = currentIndex === questions.length - 1;
      const failedSurvival = mode === 'survival' && !isCorrect;

      if (isLast || failedSurvival || (mode !== 'survival' && currentIndex === 9)) {
        finishGame(isCorrect, isCorrect ? correctCount + 1 : correctCount);
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1000);
  };

  const finishGame = async (lastWasCorrect: boolean, finalCorrectCount: number) => {
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    const timeTaken = Date.now() - startTime;
    let finalPoints = 0;
    if (mode === 'standard') finalPoints = finalCorrectCount * 10;
    if (mode === 'survival') finalPoints = finalCorrectCount * 2;

    let isNewRecord = false;
    if (mode === 'time-trial' && finalCorrectCount === 10) {
      if (timeTaken < bestTimeTrial) {
        finalPoints = 50;
        isNewRecord = true;
        setBonusAwarded(true);
      } else {
        finalPoints = 0;
      }
    }
    
    setCorrectCount(finalCorrectCount);
    setPoints(finalPoints);

    await saveScore({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      score: finalPoints,
      mode,
      topic,
      time: mode === 'time-trial' ? timeTaken : undefined,
    });
  };

  if (questions.length === 0) return null;

  if (isTranslating) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-stone-50 border border-stone-200 dark:bg-stone-800 dark:border-stone-600 rounded-2xl px-6 py-4 text-stone-600 dark:text-stone-300 font-semibold shadow-sm">
          {t('game.translating')}
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto py-12 text-center space-y-8"
      >
        <div className="space-y-4">
          <div className="inline-flex p-6 bg-amber-100 text-amber-600 rounded-full">
            <Award size={64} />
          </div>
          <h2 className="text-4xl font-bold">{t('game.finishedTitle')}</h2>
          <p className="text-stone-500 dark:text-stone-400 text-lg">{t('game.finishedSubtitle')}</p>
          <div className="text-6xl font-black text-emerald-500">{t('game.pointsEarned', { points })}</div>
          {mode === 'time-trial' && (
            <div className="space-y-2">
              <p className="text-stone-600 dark:text-stone-300 font-medium">{t('game.timeResult', { time: (timer / 1000).toFixed(2) })}</p>
              {bonusAwarded ? (
                <p className="text-emerald-500 font-bold bg-emerald-100/70 p-2 rounded-lg">{t('game.newRecordBonus')}</p>
              ) : (
                <p className="text-stone-400 dark:text-stone-500 text-sm">
                  {bestTimeTrial === Infinity
                    ? t('game.bestTime', { time: t('common.na') })
                    : t('game.bestTime', { time: (bestTimeTrial / 1000).toFixed(2) })}
                </p>
              )}
            </div>
          )}
          {mode !== 'time-trial' && (
            <p className="text-stone-500 dark:text-stone-400">{t('game.correctCount', { count: correctCount })}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onFinish} className="w-full">{t('common.viewLeaderboard')}</Button>
          <Button variant="outline" onClick={onCancel} className="w-full">{t('common.backHome')}</Button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / (mode === 'survival' ? questions.length : 10)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto py-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest">
            {mode === 'survival' ? t('game.survivalLabel') : t('game.questionOf', { current: currentIndex + 1, total: 10 })}
          </p>
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-stone-500 dark:text-stone-300">
              {mode === 'time-trial'
                ? t('game.timeLabel', { time: (timer / 1000).toFixed(1) })
                : t('game.pointsLabel', { points })}
            </h3>
            {mode === 'time-trial' && bestTimeTrial !== Infinity && (
              <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                {t('game.recordToBeat', { time: (bestTimeTrial / 1000).toFixed(2) })}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" onClick={onCancel} icon={XCircle}>{t('common.exit')}</Button>
      </div>

      <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-emerald-400" 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>

      <Card className="p-10 space-y-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-stone-800 dark:text-stone-100">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={!!showResult}
                  className={cn(
                    "p-6 text-left rounded-2xl border-2 transition-all font-medium text-lg",
                    showResult === null && "border-stone-200 hover:border-emerald-400 hover:bg-emerald-100/50 dark:border-stone-700 dark:hover:bg-emerald-900/20",
                    showResult === 'correct' && i === currentQuestion.correctAnswer && "border-emerald-400 bg-emerald-100/60 text-emerald-500",
                    showResult === 'wrong' && i === currentQuestion.correctAnswer && "border-emerald-400 bg-emerald-100/60 text-emerald-500",
                    showResult === 'wrong' && i !== currentQuestion.correctAnswer && "border-stone-100 opacity-50 dark:border-stone-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && i === currentQuestion.correctAnswer && <CheckCircle2 className="text-emerald-500" />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none",
              showResult === 'correct' ? "bg-emerald-400/10" : "bg-rose-400/10"
            )}
          >
            {showResult === 'correct' ? (
              <CheckCircle2 size={120} className="text-emerald-400" />
            ) : (
              <XCircle size={120} className="text-rose-500" />
            )}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

function LeaderboardView({ scores, usersByUid, onPlayAgain }: { scores: ScoreRecord[]; usersByUid: Record<string, UserProfile>; onPlayAgain: () => void }) {
  const { t } = useTranslation();
  const aggregatedScores = React.useMemo(() => {
    const rows = new Map<string, { key: string; displayName: string; score: number; lastTimestamp: number }>();
    const emailByUid = new Map<string, string>();
    Object.values(usersByUid).forEach(user => {
      if (user.uid && user.email) {
        emailByUid.set(user.uid, user.email);
      }
    });
    for (const score of scores) {
      const key = (score.email && score.email.trim().length > 0)
        ? score.email
        : (score.uid && emailByUid.get(score.uid)) || score.uid || score.displayName;
      if (!key) continue;
      const profileName = score.uid ? usersByUid[score.uid]?.displayName : '';
      const displayName = score.displayName || profileName || t('common.defaultUser');
      const timestamp = typeof score.timestamp === 'string'
        ? Date.parse(score.timestamp)
        : typeof score.timestamp?.toMillis === 'function'
          ? score.timestamp.toMillis()
          : 0;

      const existing = rows.get(key);
      if (!existing) {
        rows.set(key, { key, displayName, score: score.score, lastTimestamp: timestamp });
        continue;
      }
      existing.score += score.score;
      if (timestamp > existing.lastTimestamp) {
        existing.displayName = displayName;
        existing.lastTimestamp = timestamp;
      }
    }
    return Array.from(rows.values())
      .sort((a, b) => b.score - a.score || b.lastTimestamp - a.lastTimestamp);
  }, [scores, t, usersByUid]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 py-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t('leaderboard.title')}</h2>
          <p className="text-stone-500">{t('leaderboard.subtitle')}</p>
        </div>
        <Button onClick={onPlayAgain} icon={Play}>{t('common.playAgain')}</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800 border-b border-stone-100 dark:border-stone-700">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t('leaderboard.headers.position')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t('leaderboard.headers.user')}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t('leaderboard.headers.points')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {aggregatedScores.map((score, i) => (
                <tr key={score.key} className="hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
                  <td className="px-6 py-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      i === 0 ? "bg-amber-100 text-amber-700" : 
                      i === 1 ? "bg-stone-200 text-stone-700" :
                      i === 2 ? "bg-orange-100 text-orange-700" : "text-stone-400"
                    )}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-stone-800 dark:text-stone-100">{score.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-emerald-500 text-lg">{score.score}</span>
                  </td>
                </tr>
              ))}
              {aggregatedScores.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-stone-400">
                    {t('leaderboard.noScores')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
