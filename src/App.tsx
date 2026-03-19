import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Play, 
  Timer, 
  Heart, 
  LogOut, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Globe, 
  History,
  User as UserIcon,
  Home as HomeIcon,
  RefreshCw,
  Award
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, query, orderBy, limit, onSnapshot, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from './firebase';
import { QUESTIONS_POOL } from './questions';
import { ALVARO_QUESTIONS_POOL } from './questions_alvaro';
import { JAVIER_QUESTIONS_POOL } from './questions_javier';
import { GUADALUPE_QUESTIONS_POOL } from './questions_guadalupe';
import { GameMode, Question, ScoreRecord, UserProfile, Topic, OperationType } from './types';
import { saveScore, saveUserProfile, handleFirestoreError } from './services';
import { ErrorBoundary } from './components/ErrorBoundary';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Mail, Lock, User as UserIconOutline } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

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
        "w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all",
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
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    secondary: 'bg-stone-800 text-white hover:bg-stone-900 shadow-sm',
    outline: 'border-2 border-stone-200 text-stone-700 hover:bg-stone-50',
    ghost: 'text-stone-600 hover:bg-stone-100',
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
    className={cn('bg-white p-6 rounded-2xl shadow-sm border border-stone-100', className)}
  >
    {children}
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'home' | 'game' | 'leaderboard'>('home');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [topic, setTopic] = useState<Topic>('josemaria');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  
  // Auth states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Usuario',
          photoURL: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'U')}&background=random`,
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
    const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(50));
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

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthError('Error al iniciar sesión con Google.');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email login error:', error);
      setAuthError('Credenciales incorrectas o usuario no encontrado.');
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) {
      setAuthError('Por favor, introduce un nombre de usuario.');
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
        setAuthError('Este correo electrónico ya está en uso.');
      } else {
        setAuthError('Error al crear la cuenta. Inténtalo de nuevo.');
      }
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-emerald-600"
        >
          <RefreshCw size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex p-4 bg-emerald-100 text-emerald-700 rounded-3xl mb-4">
              <Globe size={48} />
            </div>
            <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Huellas de San Josemaría</h1>
            <p className="text-stone-600 text-lg">
              Explora la vida, obra y legado del fundador del Opus Dei.
            </p>
          </div>
          
          <Card className="space-y-6 text-left">
            <div className="flex border-b border-stone-100 mb-6">
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={cn(
                  "flex-1 py-3 font-bold text-sm transition-all border-b-2",
                  authMode === 'login' ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-400"
                )}
              >
                INICIAR SESIÓN
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={cn(
                  "flex-1 py-3 font-bold text-sm transition-all border-b-2",
                  authMode === 'register' ? "border-emerald-500 text-emerald-600" : "border-transparent text-stone-400"
                )}
              >
                REGISTRARSE
              </button>
            </div>

            <form onSubmit={authMode === 'login' ? handleEmailLogin : handleEmailRegister} className="space-y-4">
              {authMode === 'register' && (
                <Input 
                  placeholder="Nombre de usuario" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  icon={UserIconOutline}
                  required
                />
              )}
              <Input 
                type="email"
                placeholder="Correo electrónico" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                icon={Mail}
                required
              />
              <Input 
                type="password"
                placeholder="Contraseña" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                icon={Lock}
                required
              />

              {authError && (
                <p className="text-rose-600 text-sm font-medium bg-rose-50 p-3 rounded-lg border border-rose-100">
                  {authError}
                </p>
              )}

              <Button type="submit" className="w-full py-4 text-lg">
                {authMode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-100"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-400 font-bold">O también</span>
              </div>
            </div>

            <Button onClick={handleGoogleLogin} variant="outline" className="w-full py-3" icon={Globe}>
              Continuar con Google
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <Globe size={20} />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">Huellas</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('leaderboard')}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  view === 'leaderboard' ? "bg-stone-100 text-emerald-600" : "text-stone-500 hover:bg-stone-50"
                )}
              >
                <Trophy size={24} />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-stone-100">
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-stone-200" />
                <button onClick={handleLogout} className="text-stone-400 hover:text-rose-600 transition-colors">
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
              <LeaderboardView scores={scores} onPlayAgain={() => setView('home')} />
            )}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}

// --- Views ---

function HomeView({ onStart, allScores }: { onStart: (mode: GameMode, topic: Topic) => void; allScores: ScoreRecord[] }) {
  const [selectedTopic, setSelectedTopic] = useState<Topic>('josemaria');

  const bestTimeTrial = allScores
    .filter(s => s.mode === 'time-trial' && s.score > 0 && s.topic === selectedTopic)
    .reduce((min, s) => (s.time && s.time < min ? s.time : min), Infinity);

  const topics = [
    {
      id: 'josemaria' as Topic,
      title: 'San Josemaría',
      desc: 'Fundador del Opus Dei',
      image: '/images/san josemaria.jpg',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'alvaro' as Topic,
      title: 'Álvaro del Portillo',
      desc: 'Primer sucesor',
      image: '/images/alvarodelportillo.jpg',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      id: 'javier' as Topic,
      title: 'Javier Echevarría',
      desc: 'Segundo sucesor',
      image: '/images/javierechevarria.jpg',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'guadalupe' as Topic,
      title: 'Guadalupe Ortiz',
      desc: 'Científica y laica',
      image: '/images/guadalupeortiz.jpg',
      color: 'bg-rose-50 text-rose-600',
    }
  ];

  const modes = [
    {
      id: 'standard' as GameMode,
      title: 'Modo Estándar',
      desc: '10 puntos por acierto. 10 preguntas aleatorias.',
      icon: BookOpen,
      color: 'bg-stone-50 text-stone-600',
    },
    {
      id: 'time-trial' as GameMode,
      title: 'Contrarreloj',
      desc: 'Bono de 50 puntos si bates el récord actual.',
      icon: Timer,
      color: 'bg-amber-50 text-amber-600',
      extra: bestTimeTrial !== Infinity ? `Récord: ${(bestTimeTrial / 1000).toFixed(2)}s` : 'Sin récord aún'
    },
    {
      id: 'survival' as GameMode,
      title: 'Supervivencia',
      desc: '2 puntos por acierto. Hasta que falles.',
      icon: Heart,
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
          <h2 className="text-3xl font-bold tracking-tight">1. Selecciona el tema</h2>
          <p className="text-stone-500 text-lg">¿Sobre quién quieres poner a prueba tus conocimientos?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.id)}
              className={cn(
                "flex items-center gap-4 p-6 rounded-2xl border-2 transition-all text-left",
                selectedTopic === t.id 
                  ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10" 
                  : "border-stone-100 bg-white hover:border-stone-200"
              )}
            >
              <div className={cn("w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2", selectedTopic === t.id ? "border-emerald-200" : "border-stone-100")}>
                <img src={t.image} alt={t.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{t.title}</h4>
                <p className="text-stone-500 text-sm">{t.desc}</p>
              </div>
              {selectedTopic === t.id && (
                <div className="ml-auto text-emerald-600">
                  <CheckCircle2 size={24} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">2. Selecciona un modo de juego</h2>
          <p className="text-stone-500 text-lg">Elige cómo quieres jugar hoy.</p>
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
              <Card className="h-full flex flex-col items-start gap-6 p-8 border-2 border-transparent hover:border-emerald-500 transition-all">
                <div className={cn('p-4 rounded-2xl', mode.color)}>
                  <mode.icon size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{mode.title}</h3>
                  <p className="text-stone-500 leading-relaxed">{mode.desc}</p>
                  {mode.extra && (
                    <p className="text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-full inline-block">
                      {mode.extra}
                    </p>
                  )}
                </div>
                <div className="mt-auto pt-4 flex items-center text-emerald-600 font-bold gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Jugar ahora <ChevronRight size={20} />
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [bonusAwarded, setBonusAwarded] = useState(false);
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
    
    let selected: Question[] = [];
    if (mode === 'survival') {
      selected = [...pool].sort(() => Math.random() - 0.5);
    } else {
      selected = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    }
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
    let finalPoints = points;
    if (lastWasCorrect) {
      if (mode === 'standard') finalPoints += 10;
      if (mode === 'survival') finalPoints += 2;
    }

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
    
    setPoints(finalPoints);

    await saveScore({
      uid: user.uid,
      displayName: user.displayName,
      score: finalPoints,
      mode,
      topic,
      time: mode === 'time-trial' ? timeTaken : undefined,
    });
  };

  if (questions.length === 0) return null;

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
          <h2 className="text-4xl font-bold">¡Partida finalizada!</h2>
          <p className="text-stone-500 text-lg">Has obtenido:</p>
          <div className="text-6xl font-black text-emerald-600">{points} Puntos</div>
          {mode === 'time-trial' && (
            <div className="space-y-2">
              <p className="text-stone-600 font-medium">Tiempo: {(timer / 1000).toFixed(2)}s</p>
              {bonusAwarded ? (
                <p className="text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg">¡NUEVO RÉCORD! +50 Puntos de bono</p>
              ) : (
                <p className="text-stone-400 text-sm">Mejor tiempo actual: {bestTimeTrial === Infinity ? 'N/A' : `${(bestTimeTrial / 1000).toFixed(2)}s`}</p>
              )}
            </div>
          )}
          {mode !== 'time-trial' && (
            <p className="text-stone-500">Aciertos: {correctCount}</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onFinish} className="w-full">Ver Clasificación</Button>
          <Button variant="outline" onClick={onCancel} className="w-full">Volver al Inicio</Button>
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
          <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest">
            {mode === 'survival' ? 'Supervivencia' : `Pregunta ${currentIndex + 1} de 10`}
          </p>
          <div className="flex flex-col">
            <h3 className="text-xl font-bold text-stone-500">
              {mode === 'time-trial' ? `Tiempo: ${(timer / 1000).toFixed(1)}s` : `Puntos: ${points}`}
            </h3>
            {mode === 'time-trial' && bestTimeTrial !== Infinity && (
              <span className="text-xs text-stone-400 font-medium">Récord a batir: {(bestTimeTrial / 1000).toFixed(2)}s</span>
            )}
          </div>
        </div>
        <Button variant="ghost" onClick={onCancel} icon={XCircle}>Salir</Button>
      </div>

      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-emerald-500" 
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
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-stone-900">
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
                    showResult === null && "border-stone-100 hover:border-emerald-500 hover:bg-emerald-50",
                    showResult === 'correct' && i === currentQuestion.correctAnswer && "border-emerald-500 bg-emerald-50 text-emerald-700",
                    showResult === 'wrong' && i === currentQuestion.correctAnswer && "border-emerald-500 bg-emerald-50 text-emerald-700",
                    showResult === 'wrong' && i !== currentQuestion.correctAnswer && "border-stone-100 opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && i === currentQuestion.correctAnswer && <CheckCircle2 className="text-emerald-600" />}
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
              showResult === 'correct' ? "bg-emerald-500/10" : "bg-rose-500/10"
            )}
          >
            {showResult === 'correct' ? (
              <CheckCircle2 size={120} className="text-emerald-500" />
            ) : (
              <XCircle size={120} className="text-rose-500" />
            )}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

function LeaderboardView({ scores, onPlayAgain }: { scores: ScoreRecord[]; onPlayAgain: () => void }) {
  const [modeFilter, setModeFilter] = useState<GameMode | 'all'>('all');
  const [topicFilter, setTopicFilter] = useState<Topic | 'all'>('all');

  const filteredScores = scores.filter(s => {
    const matchMode = modeFilter === 'all' || s.mode === modeFilter;
    const matchTopic = topicFilter === 'all' || s.topic === topicFilter;
    return matchMode && matchTopic;
  });

  const modeLabels = {
    'standard': 'Estándar',
    'time-trial': 'Contrarreloj',
    'survival': 'Supervivencia'
  };

  const topicLabels = {
    'josemaria': 'San Josemaría',
    'alvaro': 'Álvaro',
    'javier': 'Javier',
    'guadalupe': 'Guadalupe'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8 py-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Clasificación General</h2>
          <p className="text-stone-500">Los mejores exploradores de la Obra.</p>
        </div>
        <Button onClick={onPlayAgain} icon={Play}>Jugar de nuevo</Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Modo de juego</span>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'standard', 'time-trial', 'survival'] as const).map(m => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  modeFilter === m ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                )}
              >
                {m === 'all' ? 'Todos' : modeLabels[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Tema</span>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'josemaria', 'alvaro', 'javier'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTopicFilter(t)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                  topicFilter === t ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                )}
              >
                {t === 'all' ? 'Todos' : topicLabels[t as Topic]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Posición</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Tema</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Modo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Puntos</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">Tiempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredScores.map((score, i) => (
                <tr key={score.id} className="hover:bg-stone-50 transition-colors">
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
                      <span className="font-bold text-stone-900">{score.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      {topicLabels[score.topic]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-stone-500">{modeLabels[score.mode]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-emerald-600 text-lg">{score.score}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-stone-400">
                      {score.time ? `${(score.time / 1000).toFixed(2)}s` : '-'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredScores.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400">
                    No hay puntuaciones registradas para esta combinación todavía.
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
