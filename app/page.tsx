"use client";

import {
  Music2,
  ArrowLeft,
  Sun,
  Moon,
  Award,
  Trophy,
  Hash,
  Target,
  Headphones,
  History,
  Gamepad2,
  StickyNote,
  Plus,
  Activity,
  Music,
  Layers,
  User,
  Lock,
  Unlock,
  LogOut,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  DEFAULT_GAME_TOTAL,
  defaultGameScores,
  GameAttempt,
  GameScore,
  normalizeGameScores,
} from "@/lib/studentScores";
import { useStoredThemeMode } from "@/lib/themeMode";

interface Juego {
  id: number;
  titulo: string;
  desc: string;
  icon: React.ElementType<{ size?: number; className?: string }>;
  bg: string;
  accent: string;
  slug: string;
}

type HomeView = "juegos" | "progreso" | "notas" | "ranking" | "perfil";

const homeTabs = [
  { key: "juegos", label: "Juegos", Icon: Gamepad2 },
  { key: "progreso", label: "Progreso", Icon: History },
  { key: "notas", label: "Notas", Icon: StickyNote },
  { key: "ranking", label: "Ranking", Icon: Trophy },
  { key: "perfil", label: "Perfil", Icon: User },
] as const;

const homeViewOrder = homeTabs.map((tab) => tab.key);

interface Nota {
  id: number;
  fecha: string;
  contenido: string;
}

interface AcademyRange {
  id: number;
  desde: string;
  hasta: string;
  instrumento: string;
}

interface ProgressEntry {
  id: number;
  fecha: string;
  texto: string;
}

interface StudentProfile {
  email: string;
  displayName: string;
  descripcion: string;
  photoUrl: string;
  instrumentos: string;
  academyRanges: AcademyRange[];
  medalsCount: number;
  medalsHistory: string[];
  progressHistory: ProgressEntry[];
  gameHistory: GameAttempt[];
  gameScores: Record<string, GameScore>;
  privateFields: Record<string, boolean>;
}

const defaultProfileFromEmail = (email: string): StudentProfile => ({
  email,
  displayName: email.split("@")[0] || "Alumno",
  descripcion: "",
  photoUrl: "",
  instrumentos: "",
  academyRanges: [{ id: Date.now(), desde: "", hasta: "Actual", instrumento: "" }],
  medalsCount: 0,
  medalsHistory: [],
  progressHistory: [],
  gameHistory: [],
  gameScores: defaultGameScores(),
  privateFields: {
    email: true,
    descripcion: false,
    instrumentos: false,
    academyRanges: false,
    progressHistory: false,
    medalsHistory: false,
    gameScores: false,
  },
});

const perfectMedalText = (gameName: string) => `100% en ${gameName}`;

const addMissingPerfectMedals = (
  scores: Record<string, GameScore>,
  medalsHistory: string[],
) => {
  const nextHistory = [...medalsHistory];
  Object.entries(scores).forEach(([game, score]) => {
    if (score.correct !== score.total) return;
    const medalText = perfectMedalText(game);
    if (!nextHistory.includes(medalText)) {
      nextHistory.unshift(medalText);
    }
  });
  return nextHistory;
};

const normalizeGameHistory = (
  history: unknown,
  scores: Record<string, GameScore>,
) => {
  if (Array.isArray(history) && history.length > 0) {
    return history
      .map((entry) => {
        const attempt = entry as Partial<GameAttempt>;
        const total = Math.max(1, Number(attempt.total) || DEFAULT_GAME_TOTAL);
        return {
          id: Number(attempt.id) || Date.now(),
          fecha: String(attempt.fecha || new Date().toLocaleDateString("es-ES")),
          game: String(attempt.game || ""),
          correct: Math.max(0, Math.min(total, Number(attempt.correct) || 0)),
          total,
        };
      })
      .filter((entry) => entry.game);
  }

  return Object.entries(scores).flatMap(([game, score]) => {
    if (!score.attempts) return [];
    const today = new Date().toLocaleDateString("es-ES");
    if (score.attempts === 1) {
      return [{ id: Date.now() + game.length, fecha: today, game, correct: score.correct, total: score.total }];
    }

    const previousAttempts = score.attempts - 1;
    const previousCorrect = Math.max(0, score.totalCorrect - score.correct);
    const basePreviousCorrect = Math.floor(previousCorrect / previousAttempts);
    const extraPreviousCorrect = previousCorrect % previousAttempts;
    return [
      { id: Date.now() + game.length, fecha: today, game, correct: score.correct, total: score.total },
      ...Array.from({ length: previousAttempts }, (_, index) => ({
        id: Date.now() + game.length + 1000 + index,
        fecha: today,
        game,
        correct: basePreviousCorrect + (index < extraPreviousCorrect ? 1 : 0),
        total: score.total,
      })),
    ];
  });
};

const normalizeProfile = (
  profile: Partial<StudentProfile> | null | undefined,
  email: string,
): StudentProfile => {
  const fallback = defaultProfileFromEmail(email);
  const gameScores = normalizeGameScores(profile?.gameScores);
  const gameHistory = normalizeGameHistory(
    (profile as Partial<StudentProfile> & { gameHistory?: unknown })?.gameHistory,
    gameScores,
  );
  const medalsHistory = addMissingPerfectMedals(
    gameScores,
    profile?.medalsHistory || [],
  );
  return {
    ...fallback,
    ...profile,
    email: profile?.email || email,
    displayName: profile?.displayName || fallback.displayName,
    descripcion: profile?.descripcion || "",
    photoUrl: profile?.photoUrl || "",
    instrumentos: profile?.instrumentos || "",
    academyRanges: profile?.academyRanges?.length
      ? profile.academyRanges.map((range) => ({
          id: range.id,
          desde: range.desde || "",
          hasta: range.hasta || "Actual",
          instrumento: range.instrumento || "",
        }))
      : fallback.academyRanges,
    medalsCount: Math.max(profile?.medalsCount ?? 0, medalsHistory.length),
    medalsHistory,
    progressHistory: profile?.progressHistory || [],
    gameHistory,
    gameScores,
    privateFields: {
      ...fallback.privateFields,
      ...(profile?.privateFields || {}),
    },
  };
};

const getTotalCorrect = (profile: StudentProfile) =>
  Object.values(profile.gameScores || {}).reduce(
    (sum, score) => sum + (score?.totalCorrect || score?.correct || 0),
    0,
  );

const getTotalQuestions = (profile: StudentProfile) =>
  Object.values(profile.gameScores || {}).reduce(
    (sum, score) =>
      sum + (score?.attempts ? score.attempts * (score.total || DEFAULT_GAME_TOTAL) : 0),
    0,
  );

const formatScore = (score?: GameScore) =>
  `${score?.correct || 0}/${score?.total || DEFAULT_GAME_TOTAL}`;

const getGameCorrect = (profile: StudentProfile, game: string) =>
  profile.gameScores?.[game]?.correct || 0;

const getGameTotal = (profile: StudentProfile, game: string) =>
  profile.gameScores?.[game]?.total || DEFAULT_GAME_TOTAL;

const getGameTotalCorrect = (profile: StudentProfile, game: string) =>
  profile.gameScores?.[game]?.totalCorrect || 0;

const getGameAttempts = (profile: StudentProfile, game: string) =>
  profile.gameScores?.[game]?.attempts || 0;

const hasRealProfileActivity = (profile: StudentProfile) =>
  Boolean(
    profile.photoUrl ||
      profile.descripcion ||
      profile.instrumentos ||
      profile.medalsHistory.length ||
      profile.gameHistory.length ||
      profile.academyRanges.some((range) => range.desde || (range.hasta && range.hasta !== "Actual")) ||
      Object.values(profile.gameScores || {}).some((score) => score.attempts > 0 || score.totalCorrect > 0),
  );

const lockButtonClass =
  "w-9 h-9 rounded-xl border flex items-center justify-center transition-colors";
const lockButtonState = (isLocked: boolean) =>
  `${lockButtonClass} ${
    isLocked
      ? "border-amber-300 bg-amber-400 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,0.35)]"
      : "border-amber-300/30 bg-slate-950/60 text-amber-300 hover:text-amber-100 hover:border-amber-200"
  }`;

const canViewPrivateField = (
  viewerEmail: string,
  viewedProfile: StudentProfile,
  field: string,
) => viewerEmail === viewedProfile.email || !viewedProfile.privateFields?.[field];

const juegos: Juego[] = [
  { id: 1, titulo: "Armaduras", desc: "Identifica tonalidades y alteraciones.", icon: Hash, bg: "bg-amber-500/20", accent: "text-amber-400", slug: "/play/armadura" },
  { id: 2, titulo: "Diapasón", desc: "Ubica notas en el mástil rápidamente.", icon: Target, bg: "bg-sky-500/20", accent: "text-sky-400", slug: "/play/diapason" },
  { id: 3, titulo: "Acordes", desc: "Reconoce la estructura de los acordes.", icon: Headphones, bg: "bg-emerald-500/20", accent: "text-emerald-400", slug: "/play/diapason_acordes" },
  { id: 4, titulo: "Modos E. Mayor", desc: "Identifica escalas y modos en el pentagrama.", icon: Music2, bg: "bg-indigo-500/20", accent: "text-indigo-400", slug: "/play/modos" },
  { id: 5, titulo: "Intervalos", desc: "Mide la distancia entre dos notas.", icon: Activity, bg: "bg-fuchsia-500/20", accent: "text-fuchsia-400", slug: "/play/intervalos" },
  { id: 6, titulo: "Trivial", desc: "Cultura general de guitarra y artistas.", icon: Music, bg: "bg-red-500/20", accent: "text-red-400", slug: "/play/trivia" },
  { id: 7, titulo: "Lectura Rítmica", desc: "Pulsa al ritmo exacto de la partitura.", icon: Activity, bg: "bg-orange-500/20", accent: "text-orange-400", slug: "/play/ritmo" },
  { id: 8, titulo: "Ej. Canto/ E. del oído", desc: "Entra para elegir Constructor de melodías o Ej. Rockschool.", icon: Music2, bg: "bg-teal-500/20", accent: "text-teal-400", slug: "/play/melodias" },
  { id: 9, titulo: "Oído: Intervalos", desc: "Escucha dos notas e identifica el intervalo de oído.", icon: Headphones, bg: "bg-violet-500/20", accent: "text-violet-400", slug: "/play/oido-intervalos" },
];

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<HomeView>("juegos");
  const swipeLockedRef = useRef(false);
  const [isDarkMode, setIsDarkMode] = useStoredThemeMode();
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [sharedProfiles, setSharedProfiles] = useState<Record<string, Partial<StudentProfile>>>({});
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [selectedTopProfile, setSelectedTopProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    const load = async () => {
      const r = await fetch("/api/auth/session");
      const session = await r.json();
      const userEmail = session?.user?.email || "";
      setEmail(userEmail);
      if (!userEmail) return;
      const notesKey = `notes:${userEmail}`;
      const profileKey = `profile:${userEmail}`;
      const savedNotes = localStorage.getItem(notesKey);
      const savedProfile = localStorage.getItem(profileKey);
      setNotas(savedNotes ? JSON.parse(savedNotes) : []);
      const loadedProfile = normalizeProfile(
        savedProfile ? JSON.parse(savedProfile) : null,
        userEmail,
      );
      setProfile(loadedProfile);
      fetch("/api/profiles")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.profiles) setSharedProfiles(data.profiles);
        })
        .catch(() => {});
      const all = JSON.parse(localStorage.getItem("student_profiles_index") || "{}");
      all[userEmail] = loadedProfile;
      localStorage.setItem("student_profiles_index", JSON.stringify(all));
    };

    load();
  }, []);

  useEffect(() => {
    if (!email) return;
    localStorage.setItem(`notes:${email}`, JSON.stringify(notas));
  }, [notas, email]);

  useEffect(() => {
    if (!email || !profile) return;
    localStorage.setItem(`profile:${email}`, JSON.stringify(profile));
    const all = JSON.parse(localStorage.getItem("student_profiles_index") || "{}");
    all[email] = profile;
    localStorage.setItem("student_profiles_index", JSON.stringify(all));
    setSharedProfiles((currentProfiles) => ({ ...currentProfiles, [email]: profile }));
    fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    }).catch(() => {});
  }, [profile, email]);

  const agregarNota = () => {
    if (!nuevaNota.trim()) return;
    setNotas([{ id: Date.now(), fecha: new Date().toLocaleDateString("es-ES"), contenido: nuevaNota.trim() }, ...notas]);
    setNuevaNota("");
  };

  const displayName = useMemo(() => profile?.displayName || (email ? email.split("@")[0] : "Alumno"), [profile, email]);
  const medalsCount = profile?.medalsCount || 0;
  const allProfiles: StudentProfile[] = useMemo(() => {
    if (typeof window === "undefined") return [];
    const raw = JSON.parse(localStorage.getItem("student_profiles_index") || "{}");
    const sharedEmails = new Set(Object.keys(sharedProfiles));
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith("profile:")) continue;
      const storedEmail = key.slice("profile:".length);
      const storedProfile = localStorage.getItem(key);
      if (!storedEmail || !storedProfile) continue;
      try {
        raw[storedEmail] = JSON.parse(storedProfile);
      } catch {
        // Keep any valid profiles already present in the index.
      }
    }
    if (email && profile) {
      raw[email] = profile;
    }
    Object.entries(sharedProfiles).forEach(([storedEmail, storedProfile]) => {
      raw[storedEmail] = storedProfile;
    });
    return Object.entries(raw)
      .map(([storedEmail, storedProfile]) =>
        normalizeProfile(storedProfile as Partial<StudentProfile>, storedEmail),
      )
      .filter((storedProfile) => storedProfile.email === email || sharedEmails.has(storedProfile.email) || hasRealProfileActivity(storedProfile));
  }, [profile, email, sharedProfiles]);
  const gameNames = useMemo(() => Object.keys(defaultProfileFromEmail("x@x.com").gameScores), []);
  const getRankingRows = (game: string) => {
    const rankedProfiles = [...allProfiles]
      .sort((a, b) => getGameTotalCorrect(b, game) - getGameTotalCorrect(a, game))
      .slice(0, 10);

    return Array.from({ length: 10 }, (_, index) => rankedProfiles[index] || null);
  };
  const rankingProfile =
    selectedTopProfile?.email === email && profile ? profile : selectedTopProfile;
  const openRankingProfile = (rankingUser: StudentProfile) => {
    if (rankingUser.email === email) {
      setSelectedTopProfile(null);
      setView("perfil");
      return;
    }
    setSelectedTopProfile(rankingUser);
    setView("perfil");
  };
  const goToAdjacentView = (direction: 1 | -1) => {
    setSelectedTopProfile(null);
    setView((currentView) => {
      const currentIndex = homeViewOrder.indexOf(currentView);
      const nextIndex = Math.min(
        homeViewOrder.length - 1,
        Math.max(0, currentIndex + direction),
      );
      return homeViewOrder[nextIndex];
    });
  };

  useEffect(() => {
    const handleTrackpadSwipe = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (Math.abs(event.deltaX) < 35 || Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.25) return;
      event.preventDefault();
      event.stopPropagation();
      if (swipeLockedRef.current) return;
      swipeLockedRef.current = true;
      goToAdjacentView(event.deltaX > 0 ? 1 : -1);
      window.setTimeout(() => {
        swipeLockedRef.current = false;
      }, 450);
    };

    window.addEventListener("wheel", handleTrackpadSwipe, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", handleTrackpadSwipe, { capture: true });
  }, []);

  const activeTabClass = isDarkMode
    ? "bg-amber-300 text-slate-950 shadow-[0_0_18px_rgba(252,211,77,0.35)]"
    : "bg-slate-950 text-amber-200 shadow-[0_0_18px_rgba(15,23,42,0.18)]";
  const inactiveTabClass = isDarkMode
    ? "text-slate-400 hover:text-white hover:bg-white/10"
    : "text-slate-800 hover:text-slate-950 hover:bg-white/55";
  const navTabClass = (key: HomeView) =>
    `rounded-full px-2.5 py-2 flex items-center gap-1 text-[10px] font-black uppercase transition-colors ${
      view === key ? activeTabClass : inactiveTabClass
    }`;

  const goToView = (nextView: HomeView) => {
    setSelectedTopProfile(null);
    setView(nextView);
  };

  return (
    <div className="min-h-screen relative overflow-hidden overscroll-x-none font-sans text-white">
      <div className="fixed inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
        {isDarkMode ? <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" /> : <div className="absolute inset-0 bg-slate-900/30" />}
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="pt-3 px-3 md:pt-4 md:px-4">
          <nav className="max-w-6xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 md:px-4 md:py-3 flex justify-between items-center gap-2 shadow-2xl">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <img src="/assets/logo21stCM_no_white_1.png" className="h-9 md:h-12 lg:h-16 w-auto flex-shrink-0" alt="logo" />
              <div className="flex flex-col min-w-0">
                <span className="text-white italic font-black tracking-tighter text-sm md:text-lg lg:text-3xl leading-tight whitespace-nowrap" style={{ fontFamily: "'Chaney', sans-serif", fontWeight: "bold", fontStyle: "italic" }}>
                  21st Century Music
                </span>
                <span className="font-bold tracking-widest text-[7px] md:text-[8px] uppercase text-amber-400 whitespace-nowrap">
                  ESCUELA DE MÚSICA MODERNA
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-amber-400">
                {!isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {homeTabs.filter((tab) => tab.key !== "perfil").map(({ key, label, Icon }) => (
                <button key={key} onClick={() => goToView(key)} className={navTabClass(key)}>
                  <Icon size={14} />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
              {email ? (
                <button onClick={() => goToView("perfil")} className={`rounded-2xl px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase transition-colors ${view === "perfil" ? activeTabClass : inactiveTabClass}`}>
                  <div className="w-9 h-9 rounded-2xl bg-black/40 border border-amber-300/30 flex items-center justify-center overflow-hidden">
                    {profile?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} />
                    )}
                  </div>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span>{displayName}</span>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {Array.from({ length: 8 }, (_, i) => (
                        <Award key={i} size={13} className={i < medalsCount ? "text-amber-400 fill-amber-400" : "text-slate-400"} />
                      ))}
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  
                  className="rounded-2xl px-2 py-1 flex items-center gap-2 text-[10px] font-black uppercase opacity-40 text-slate-400"
           
                >
                  <div className="w-9 h-9 rounded-2xl bg-black/40 border border-slate-600/30 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <span className="hidden md:inline">Perfil</span>
                </button>
              )}
              {email ? (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className={`rounded-full p-2 transition-colors ${inactiveTabClass}`}
                  title="Cerrar sesión"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              ) : (
                <Link
                  href="/"
                  className={`rounded-full p-2 transition-colors ${inactiveTabClass} flex items-center justify-center`}
                  title="Iniciar sesión"
                  aria-label="Iniciar sesión"
                >
                  <LogOut size={16} className="rotate-180" />
                </Link>
              )}
            </div>
          </nav>
        </div>

        <main className="flex-1 px-3 md:px-6 py-5 md:py-8">
          {view === "juegos" && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                {juegos.map((j) => (
                  <button key={j.id} onClick={() => router.push(j.slug)} className="flex items-center gap-4 p-5 md:p-9 rounded-2xl border bg-black/40 border-white/10 hover:bg-black/60 text-left shadow-xl">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center ${j.bg}`}><j.icon size={26} className={j.accent} /></div>
                    <div>
                      <h2 className="text-base md:text-2xl italic font-black text-white uppercase">{j.titulo}</h2>
                      <p className="text-[11px] md:text-sm text-slate-400">{j.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "progreso" && (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-4xl italic font-black mb-6">Tu Progreso</h2>
              <div className="bg-black/30 rounded-3xl p-5 border border-white/10">
                <div className="grid md:grid-cols-3 gap-3 mb-5">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Partidas</div>
                    <div className="text-2xl font-black text-white">{profile?.gameHistory.length || 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Puntos</div>
                    <div className="text-2xl font-black text-amber-300">{profile ? getTotalCorrect(profile) : 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Medallas</div>
                    <div className="text-2xl font-black text-amber-300">{profile?.medalsCount || 0}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {profile?.gameHistory.length ? (
                    profile.gameHistory.map((attempt) => (
                      <div key={attempt.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl bg-slate-950/45 border border-amber-300/15 p-3">
                        <div>
                          <div className="text-sm font-bold text-white">{attempt.game}</div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{attempt.fecha}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-amber-300">{attempt.correct}/{attempt.total}</div>
                          <div className="text-[10px] text-slate-400">+{attempt.correct} puntos</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-slate-400">
                      Todavía no hay partidas registradas en este perfil.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {view === "ranking" && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-4xl italic font-black mb-6">Ranking por juego</h2>
              <div className="grid lg:grid-cols-2 gap-4">
                {gameNames.map((game) => (
                  <div key={game} className="bg-black/40 rounded-2xl border border-amber-300/20 p-4 overflow-hidden">
                    <div className="font-bold text-amber-300 mb-3 flex items-center gap-2">
                      <Trophy size={16} />
                      Top 10 - {game}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.16em] text-slate-500">
                            <th className="py-2 pr-2 w-10">Pos.</th>
                            <th className="py-2 px-2">Alumno</th>
                            <th className="py-2 px-2 text-right">Total</th>
                            <th className="py-2 pl-2 text-right">Partidas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getRankingRows(game).map((p, i) => (
                            <tr key={`${game}-${i}-${p?.email || "empty"}`} className="border-b border-white/5 last:border-b-0">
                              <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                              <td className="py-2 px-2">
                                {p ? (
                                  <button
                                    type="button"
                                    onClick={() => openRankingProfile(p)}
                                    className="max-w-40 truncate text-left text-white hover:text-amber-200"
                                  >
                                    {p.displayName}
                                  </button>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right font-bold text-amber-300">
                                {p ? getGameTotalCorrect(p, game) : "-"}
                              </td>
                              <td className="py-2 pl-2 text-right text-slate-400">
                                {p ? getGameAttempts(p, game) : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              {rankingProfile && (
                <div className="mt-5 bg-slate-950/70 border border-amber-300/30 rounded-3xl p-5 shadow-[0_18px_54px_rgba(0,0,0,0.35)]">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-amber-300/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {rankingProfile.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={rankingProfile.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-xl text-amber-200 truncate">{rankingProfile.displayName}</div>
                        <div className="text-xs text-slate-400">
                          {getTotalCorrect(rankingProfile)}/{getTotalQuestions(rankingProfile)} total · {rankingProfile.gameHistory.length} partidas
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTopProfile(null)}
                      className="text-xs uppercase tracking-[0.16em] text-slate-400 hover:text-white"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">Email asociado</div>
                      <div className="text-sm text-slate-200">
                        {canViewPrivateField(email, rankingProfile, "email")
                          ? rankingProfile.email
                          : "Campo privado"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">Descripción</div>
                      <div className="text-sm text-slate-200">
                        {canViewPrivateField(email, rankingProfile, "descripcion")
                          ? rankingProfile.descripcion || "Sin descripcion"
                          : "Campo privado"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 md:col-span-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">Instrumentos</div>
                      <div className="text-sm text-slate-200">
                        {canViewPrivateField(email, rankingProfile, "instrumentos")
                          ? rankingProfile.instrumentos || "Sin instrumentos"
                          : "Campo privado"}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Tiempo en la academia</div>
                      {canViewPrivateField(email, rankingProfile, "academyRanges") ? (
                        <div className="space-y-1">
                          {rankingProfile.academyRanges.map((range) => (
                            <div key={range.id} className="text-sm text-slate-200">
                              {range.desde || "Sin fecha"} - {range.hasta || "Actual"}
                              {range.instrumento ? (
                                <span className="block text-xs text-amber-200/80">{range.instrumento}</span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">Campo privado</div>
                      )}
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Medallas</div>
                      {canViewPrivateField(email, rankingProfile, "medalsHistory") ? (
                        <div className="max-h-28 overflow-y-auto space-y-1">
                          {rankingProfile.medalsHistory.length ? (
                            rankingProfile.medalsHistory.map((medal, index) => (
                              <div key={`${medal}-${index}`} className="text-sm text-slate-200 flex items-center gap-2">
                                <Award size={14} className="text-amber-400" />
                                {medal}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-400">Sin medallas</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-400">Campo privado</div>
                      )}
                    </div>
                  </div>

                  {canViewPrivateField(email, rankingProfile, "gameScores") ? (
                    <div className="grid md:grid-cols-2 gap-2">
                      {gameNames.map((game) => (
                        <div key={game} className="bg-white/5 rounded-lg px-2 py-1 text-xs flex justify-between">
                          <span className="text-slate-300">{game}</span>
                          <span className="text-right">
                            <span className="block text-amber-300 font-bold">
                              {formatScore(rankingProfile.gameScores?.[game])}
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              Total {getGameTotalCorrect(rankingProfile, game)} · {getGameAttempts(rankingProfile, game)} partidas
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-slate-400">
                      Puntuaciones privadas
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {view === "notas" && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-4xl italic font-black mb-6">Mis Notas</h2>
              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl mb-5 flex gap-3">
                <textarea value={nuevaNota} onChange={(e) => setNuevaNota(e.target.value)} placeholder="Escribe una nota de estudio..." className="flex-1 bg-transparent text-white text-sm outline-none resize-none h-12" />
                <button onClick={agregarNota} className="bg-amber-400 text-black rounded-xl px-4 font-bold"><Plus size={20} /></button>
              </div>
              <div className="space-y-3">
                {notas.map((n) => <div key={n.id} className="bg-black/30 border border-white/5 p-4 rounded-2xl"><div className="text-[8px] uppercase text-amber-400 mb-1">{n.fecha}</div><p className="text-sm text-slate-300">{n.contenido}</p></div>)}
              </div>
            </div>
          )}

          {view === "perfil" && !email && (
            <div className="max-w-md mx-auto text-center space-y-5 mt-10">
              <div className="w-20 h-20 mx-auto rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                <User size={36} className="text-slate-400" />
              </div>
              <h2 className="text-2xl italic font-black text-slate-300">Perfil no disponible</h2>
              <p className="text-sm text-slate-400">Inicia sesión para acceder a tu perfil, historial de partidas y medallas.</p>
              <Link href="/login" className="inline-block bg-amber-400 text-slate-900 font-black rounded-2xl px-6 py-3 text-sm uppercase tracking-widest hover:bg-amber-300 transition-colors">
                Iniciar sesión
              </Link>
            </div>
          )}

          {view === "perfil" && profile && selectedTopProfile && selectedTopProfile.email !== email && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl md:text-4xl italic font-black text-amber-200">
                  Perfil de {selectedTopProfile.displayName}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopProfile(null);
                    setView("ranking");
                  }}
                  className="rounded-xl border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300 hover:text-white"
                >
                  Volver al ranking
                </button>
              </div>

              <div className="bg-slate-950/70 border border-amber-300/30 rounded-3xl p-5 shadow-[0_18px_54px_rgba(0,0,0,0.35)]">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-amber-300/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {selectedTopProfile.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedTopProfile.photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <User size={32} className="text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-2xl text-amber-200 truncate">{selectedTopProfile.displayName}</div>
                    <div className="text-xs text-slate-400">
                      {getTotalCorrect(selectedTopProfile)}/{getTotalQuestions(selectedTopProfile)} total · {selectedTopProfile.gameHistory.length} partidas
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">Email asociado</div>
                    <div className="text-sm text-slate-200">
                      {canViewPrivateField(email, selectedTopProfile, "email")
                        ? selectedTopProfile.email
                        : "Campo privado"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">Descripción</div>
                    <div className="text-sm text-slate-200">
                      {canViewPrivateField(email, selectedTopProfile, "descripcion")
                        ? selectedTopProfile.descripcion || "Sin descripcion"
                        : "Campo privado"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 md:col-span-2">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1">Instrumentos</div>
                    <div className="text-sm text-slate-200">
                      {canViewPrivateField(email, selectedTopProfile, "instrumentos")
                        ? selectedTopProfile.instrumentos || "Sin instrumentos"
                        : "Campo privado"}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Tiempo en la academia</div>
                    {canViewPrivateField(email, selectedTopProfile, "academyRanges") ? (
                      <div className="space-y-1">
                        {selectedTopProfile.academyRanges.map((range) => (
                          <div key={range.id} className="text-sm text-slate-200">
                            {range.desde || "Sin fecha"} - {range.hasta || "Actual"}
                            {range.instrumento ? (
                              <span className="block text-xs text-amber-200/80">{range.instrumento}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Campo privado</div>
                    )}
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">Medallas</div>
                    {canViewPrivateField(email, selectedTopProfile, "medalsHistory") ? (
                      <div className="max-h-28 overflow-y-auto space-y-1">
                        {selectedTopProfile.medalsHistory.length ? (
                          selectedTopProfile.medalsHistory.map((medal, index) => (
                            <div key={`${medal}-${index}`} className="text-sm text-slate-200 flex items-center gap-2">
                              <Award size={14} className="text-amber-400" />
                              {medal}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-400">Sin medallas</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">Campo privado</div>
                    )}
                  </div>
                </div>

                {canViewPrivateField(email, selectedTopProfile, "gameScores") ? (
                  <div className="grid md:grid-cols-2 gap-2">
                    {gameNames.map((game) => (
                      <div key={game} className="bg-white/5 rounded-lg px-2 py-1 text-xs flex justify-between">
                        <span className="text-slate-300">{game}</span>
                        <span className="text-right">
                          <span className="block text-amber-300 font-bold">
                            {formatScore(selectedTopProfile.gameScores?.[game])}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Total {getGameTotalCorrect(selectedTopProfile, game)} · {getGameAttempts(selectedTopProfile, game)} partidas
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-slate-400">
                    Puntuaciones privadas
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "perfil" && profile && (!selectedTopProfile || selectedTopProfile.email === email) && (
            <div className="max-w-4xl mx-auto space-y-5">
              <h2 className="text-2xl md:text-4xl italic font-black text-amber-200">Tu Perfil</h2>
              <div className="bg-slate-900/85 text-slate-100 border border-amber-300/25 rounded-3xl p-6 space-y-6 shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl">
                <div className="grid md:grid-cols-[240px_1fr] gap-5">
                  <div className="space-y-3">
                    <div className="w-full h-52 bg-slate-800 rounded-2xl border border-amber-300/20 overflow-hidden flex items-center justify-center">
                      {profile.photoUrl && !photoLoadError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.photoUrl}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                          onError={() => setPhotoLoadError(true)}
                        />
                      ) : (
                        <User size={54} className="text-slate-500" />
                      )}
                    </div>
                    <label className="w-full cursor-pointer bg-amber-400 text-slate-900 rounded-xl p-2 text-center font-bold text-sm mb-2">
                      Subir foto desde ordenador
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setPhotoLoadError(false);
                            setProfile({ ...profile, photoUrl: String(reader.result || "") });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <div className="h-px bg-amber-300/20 my-2" />
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">Instrumentos</label>
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            privateFields: {
                              ...profile.privateFields,
                              instrumentos: !profile.privateFields.instrumentos,
                            },
                          })
                        }
                        className={lockButtonState(profile.privateFields.instrumentos)}
                      >
                        {profile.privateFields.instrumentos ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                    <input value={profile.instrumentos} onChange={(e) => setProfile({ ...profile, instrumentos: e.target.value })} placeholder="Guitarra, piano..." className="w-full bg-slate-950/70 text-slate-100 rounded-xl p-3 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">Nombre visible</label>
                    <input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} className="w-full bg-slate-950/70 text-slate-100 rounded-xl p-3 border border-amber-300/20 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">Email asociado</label>
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            privateFields: {
                              ...profile.privateFields,
                              email: !profile.privateFields.email,
                            },
                          })
                        }
                        className={lockButtonState(profile.privateFields.email)}
                      >
                        {profile.privateFields.email ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                    <div className="w-full bg-slate-950/45 text-slate-300 rounded-xl p-3 border border-amber-300/10 text-sm">
                      {profile.email}
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">Descripción</label>
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            privateFields: {
                              ...profile.privateFields,
                              descripcion: !profile.privateFields.descripcion,
                            },
                          })
                        }
                        className={lockButtonState(profile.privateFields.descripcion)}
                      >
                        {profile.privateFields.descripcion ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                    <textarea value={profile.descripcion} onChange={(e) => setProfile({ ...profile, descripcion: e.target.value })} className="w-full bg-slate-950/70 text-slate-100 rounded-xl p-3 h-28 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" placeholder="Escribe aquí una pequeña descripción..." />
                  </div>
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-slate-950/45 border border-amber-300/20 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-amber-200">Tiempo en la academia</h3>
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            privateFields: {
                              ...profile.privateFields,
                              academyRanges: !profile.privateFields.academyRanges,
                            },
                          })
                        }
                        className={lockButtonState(profile.privateFields.academyRanges)}
                      >
                        {profile.privateFields.academyRanges ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {profile.academyRanges.map((r) => (
                        <div key={r.id} className="grid md:grid-cols-3 gap-2">
                          <input value={r.desde} onChange={(e) => setProfile({ ...profile, academyRanges: profile.academyRanges.map((x) => (x.id === r.id ? { ...x, desde: e.target.value } : x)) })} placeholder="Enero 2024" className="bg-slate-950/70 text-slate-100 rounded-xl p-2 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
                          <input value={r.hasta} onChange={(e) => setProfile({ ...profile, academyRanges: profile.academyRanges.map((x) => (x.id === r.id ? { ...x, hasta: e.target.value } : x)) })} placeholder="Actual" className="bg-slate-950/70 text-slate-100 rounded-xl p-2 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
                          <input value={r.instrumento} onChange={(e) => setProfile({ ...profile, academyRanges: profile.academyRanges.map((x) => (x.id === r.id ? { ...x, instrumento: e.target.value } : x)) })} placeholder="Instrumento" className="bg-slate-950/70 text-slate-100 rounded-xl p-2 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35 md:col-span-1 col-span-2" />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setProfile({ ...profile, academyRanges: [...profile.academyRanges, { id: Date.now(), desde: "", hasta: "Actual", instrumento: "" }] })} className="mt-3 text-xs bg-amber-400 text-slate-900 rounded-lg px-3 py-2 font-bold">Añadir rango</button>
                  </div>

                  <div className="rounded-3xl bg-slate-950/45 border border-amber-300/20 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-amber-200">Medallas de honor</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          privateFields: {
                            ...profile.privateFields,
                            medalsHistory: !profile.privateFields.medalsHistory,
                          },
                        })
                      }
                      className={lockButtonState(profile.privateFields.medalsHistory)}
                    >
                      {profile.privateFields.medalsHistory ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  </div>
                  <div className="text-sm mb-2">Total: <span className="text-amber-400 font-black">{profile.medalsCount}</span></div>
                  <details className="group rounded-2xl border border-amber-300/15 bg-slate-950/40">
                    <summary className="cursor-pointer list-none px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200 flex items-center justify-between">
                      <span>Ver medallas</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span>
                    </summary>
                    <div className="border-t border-amber-300/10 p-3">
                      <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                        {profile.medalsHistory.length ? (
                          profile.medalsHistory.map((m, i) => <div key={`${m}-${i}`} className="text-sm bg-slate-950/55 rounded-xl p-3 border border-amber-300/15 flex items-center gap-2"><Award size={14} className="text-amber-400" />{m}</div>)
                        ) : (
                          <div className="text-sm text-slate-400">Todavía no hay medallas guardadas.</div>
                        )}
                      </div>
                    </div>
                  </details>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/85 text-slate-100 border border-amber-300/25 rounded-3xl p-5 shadow-[0_16px_44px_rgba(2,6,23,0.5)] backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-amber-200">Última puntuación por juego</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setProfile({
                        ...profile,
                        privateFields: {
                          ...profile.privateFields,
                          gameScores: !profile.privateFields.gameScores,
                        },
                      })
                    }
                    className={lockButtonState(profile.privateFields.gameScores)}
                  >
                    {profile.privateFields.gameScores ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {gameNames.map((g) => (
                    <div key={g} className="flex items-center justify-between gap-2 bg-slate-950/55 rounded-xl p-3 border border-amber-300/15">
                      <span className="text-xs text-slate-300">{g}</span>
                      <span className="text-right">
                        <span className="block text-sm font-black text-amber-300">
                          {formatScore(profile.gameScores?.[g])}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          Total {getGameTotalCorrect(profile, g)} · {getGameAttempts(profile, g)} partidas
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
        <footer className="py-6 text-center text-slate-600 text-[8px] tracking-widest uppercase">© 2026 21st Century Music</footer>
      </div>
    </div>
  );
}
