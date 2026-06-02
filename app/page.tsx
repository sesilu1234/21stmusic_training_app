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
  BookOpen,
  User,
  Lock,
  Unlock,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DEFAULT_GAME_TOTAL,
  defaultGameScores,
  GameScore,
  normalizeGameScores,
} from "@/lib/studentScores";

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

interface Nota {
  id: number;
  fecha: string;
  contenido: string;
}

interface AcademyRange {
  id: number;
  desde: string;
  hasta: string;
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
  gameScores: Record<string, GameScore>;
  privateFields: Record<string, boolean>;
}

const defaultHistorialTabla = [
  { fecha: "Hoy", armaduras: "24/24", diapason: "20/24", acordes: "18/24", intervalos: "21/24" },
  { fecha: "Ayer", armaduras: "22/24", diapason: "15/24", acordes: "24/24", intervalos: "19/24" },
];

const defaultProfileFromEmail = (email: string): StudentProfile => ({
  email,
  displayName: email.split("@")[0] || "Alumno",
  descripcion: "",
  photoUrl: "",
  instrumentos: "",
  academyRanges: [{ id: Date.now(), desde: "", hasta: "Actual" }],
  medalsCount: 0,
  medalsHistory: [],
  progressHistory: [],
  gameScores: defaultGameScores(),
  privateFields: {
    descripcion: false,
    instrumentos: false,
    academyRanges: false,
    progressHistory: false,
    medalsHistory: false,
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

const normalizeProfile = (
  profile: Partial<StudentProfile> | null | undefined,
  email: string,
): StudentProfile => {
  const fallback = defaultProfileFromEmail(email);
  const gameScores = normalizeGameScores(profile?.gameScores);
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
      ? profile.academyRanges
      : fallback.academyRanges,
    medalsCount: Math.max(profile?.medalsCount ?? 0, medalsHistory.length),
    medalsHistory,
    progressHistory: profile?.progressHistory || [],
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
      sum + (score?.attempts ? score.attempts * (score.total || DEFAULT_GAME_TOTAL) : score?.total || DEFAULT_GAME_TOTAL),
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

const juegos: Juego[] = [
  { id: 1, titulo: "Armaduras", desc: "Identifica tonalidades y alteraciones.", icon: Hash, bg: "bg-amber-500/20", accent: "text-amber-400", slug: "/play/armadura" },
  { id: 2, titulo: "Diapasón", desc: "Ubica notas en el mástil rápidamente.", icon: Target, bg: "bg-sky-500/20", accent: "text-sky-400", slug: "/play/diapason" },
  { id: 3, titulo: "Acordes", desc: "Reconoce la estructura de los acordes.", icon: Headphones, bg: "bg-emerald-500/20", accent: "text-emerald-400", slug: "/play/diapason_acordes" },
  { id: 4, titulo: "Modos E. Mayor", desc: "Identifica escalas y modos en el pentagrama.", icon: Music2, bg: "bg-indigo-500/20", accent: "text-indigo-400", slug: "/play/modos" },
  { id: 5, titulo: "Intervalos", desc: "Mide la distancia entre dos notas.", icon: Activity, bg: "bg-fuchsia-500/20", accent: "text-fuchsia-400", slug: "/play/intervalos" },
  { id: 6, titulo: "Trivial", desc: "Cultura general de guitarra y artistas.", icon: Music, bg: "bg-red-500/20", accent: "text-red-400", slug: "/play/trivia" },
  { id: 7, titulo: "Lectura Rítmica", desc: "Pulsa al ritmo exacto de la partitura.", icon: Activity, bg: "bg-orange-500/20", accent: "text-orange-400", slug: "/play/ritmo" },
  { id: 8, titulo: "Ej. Canto/ E. del oído", desc: "Crea, transporta y entrena tu oído con tus propias melodías.", icon: Music2, bg: "bg-teal-500/20", accent: "text-teal-400", slug: "/play/melodias" },
  { id: 9, titulo: "Ej. Rockschool", desc: "Practica escalas, arpegios e intervalos con ejercicios fijos.", icon: BookOpen, bg: "bg-lime-500/20", accent: "text-lime-400", slug: "/play/rockschool" },
];

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<HomeView>("juegos");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState<Nota[]>([]);
  const [nuevaNota, setNuevaNota] = useState("");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [progressInput, setProgressInput] = useState("");
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
    return Object.entries(raw).map(([storedEmail, storedProfile]) =>
      normalizeProfile(storedProfile as Partial<StudentProfile>, storedEmail),
    );
  }, [profile]);
  const gameNames = useMemo(() => Object.keys(defaultProfileFromEmail("x@x.com").gameScores), []);

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-white">
      <div className="fixed inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
        {isDarkMode ? <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]" /> : <div className="absolute inset-0 bg-slate-900/30" />}
      </div>
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="pt-3 px-3 md:pt-4 md:px-4">
          <nav className="max-w-5xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2 md:px-4 md:py-3 flex justify-between items-center gap-2 shadow-2xl">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
              <img src="/assets/logo21stCM_no_white_1.png" className="h-10 md:h-16 lg:h-24 w-auto flex-shrink-0" alt="logo" />
              <div className="flex flex-col min-w-0">
                <span className="text-white italic font-black tracking-tighter text-sm md:text-xl lg:text-5xl leading-tight" style={{ fontFamily: "'Chaney', sans-serif", fontWeight: "bold", fontStyle: "italic" }}>
                  21st Century Music
                </span>
                <span className="font-light tracking-widest text-[6px] md:text-[8px] uppercase text-amber-400">
                  ESCUELA DE MÚSICA MODERNA
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-amber-400">
                {!isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {([{ key: "juegos", label: "Juegos", Icon: Gamepad2 }, { key: "progreso", label: "Progreso", Icon: History }, { key: "notas", label: "Notas", Icon: StickyNote }, { key: "ranking", label: "Ranking", Icon: Trophy }] as const).map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setView(key)} className={`pb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase ${view === key ? "text-white border-b border-amber-400" : "text-slate-400 hover:text-white"}`}>
                  <Icon size={14} />
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
              <button onClick={() => setView("perfil")} className={`pb-0.5 flex items-center gap-2 text-[10px] font-bold uppercase ${view === "perfil" ? "text-amber-300 border-b border-amber-400" : "text-slate-400 hover:text-white"}`}>
                <div className="w-9 h-9 rounded-2xl bg-black/40 border border-amber-300/30 flex items-center justify-center">
                  <User size={20} />
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
            </div>
          </nav>
        </div>

        <main className="flex-1 px-3 md:px-6 py-6 md:py-10">
          {view === "juegos" && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {juegos.map((j) => (
                  <button key={j.id} onClick={() => router.push(j.slug)} className="flex items-center gap-4 p-4 md:p-8 rounded-2xl border bg-black/40 border-white/10 hover:bg-black/60 text-left shadow-xl">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${j.bg}`}><j.icon size={22} className={j.accent} /></div>
                    <div>
                      <h2 className="text-sm md:text-xl italic font-black text-white uppercase">{j.titulo}</h2>
                      <p className="text-[10px] md:text-xs text-slate-400">{j.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "progreso" && (
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl md:text-4xl italic font-black mb-6">Tu Progreso</h2>
              <div className="bg-black/20 rounded-3xl p-6 border border-white/5 overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="text-[10px] uppercase text-slate-500"><th>Fecha</th><th>Armaduras</th><th>Diapasón</th><th>Acordes</th><th>Intervalos</th></tr></thead>
                  <tbody>{defaultHistorialTabla.map((f, i) => <tr key={i}><td className="py-3">{f.fecha}</td><td>{f.armaduras}</td><td>{f.diapason}</td><td>{f.acordes}</td><td>{f.intervalos}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {view === "ranking" && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl md:text-4xl italic font-black mb-6">Ranking por juego</h2>
              <div className="grid lg:grid-cols-2 gap-4">
                {gameNames.map((game) => (
                  <div key={game} className="bg-black/40 rounded-2xl border border-amber-300/20 p-4">
                    <div className="font-bold text-amber-300 mb-3 flex items-center gap-2">
                      <Trophy size={16} />
                      Top 10 - {game}
                    </div>
                    <div className="space-y-2">
                      {[...allProfiles]
                        .sort((a, b) => getGameTotalCorrect(b, game) - getGameTotalCorrect(a, game))
                        .slice(0, 10)
                        .map((p, i) => (
                          <button
                            key={`${game}-${p.email}`}
                            onClick={() => setSelectedTopProfile(p)}
                            className="w-full text-left text-sm bg-white/5 rounded-xl px-3 py-2 hover:bg-white/10 grid grid-cols-[1fr_auto] gap-3"
                          >
                            <span className="min-w-0">
                              <span className="block truncate">{i + 1}. {p.displayName}</span>
                            </span>
                            <span className="text-right text-[11px] leading-tight">
                              <span className="block text-amber-300 font-bold">
                                Total: {getGameTotalCorrect(p, game)}
                              </span>
                              <span className="block text-slate-400">
                                {getGameAttempts(p, game)} partidas
                              </span>
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              {selectedTopProfile && (
                <div className="mt-5 bg-black/50 border border-amber-300/30 rounded-2xl p-4">
                  <div className="font-bold text-amber-200 flex items-center justify-between gap-3">
                    <span>{selectedTopProfile.displayName}</span>
                    <span>{getTotalCorrect(selectedTopProfile)}/{getTotalQuestions(selectedTopProfile)} total</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    {selectedTopProfile.privateFields?.descripcion ? "Descripcion privada" : selectedTopProfile.descripcion || "Sin descripcion"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {selectedTopProfile.privateFields?.instrumentos ? "Instrumentos privados" : selectedTopProfile.instrumentos || "Sin instrumentos"}
                  </div>
                  <div className="mt-3 grid md:grid-cols-2 gap-2">
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

          {view === "perfil" && profile && (
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
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">Foto (URL)</label>
                    <input
                      value={profile.photoUrl}
                      onChange={(e) => {
                        setPhotoLoadError(false);
                        setProfile({ ...profile, photoUrl: e.target.value.trim() });
                      }}
                      placeholder="https://... (enlace directo a imagen)"
                      className="w-full bg-slate-950/70 text-slate-100 rounded-xl p-3 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35"
                    />
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
                    {photoLoadError && (
                      <p className="text-[11px] text-rose-300">
                        Esa URL no carga imagen directa. Prueba una URL que termine en .jpg, .jpeg, .png o .webp.
                      </p>
                    )}
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
                        className="text-amber-300 hover:text-amber-200"
                      >
                        {profile.privateFields.instrumentos ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                    </div>
                    <input value={profile.instrumentos} onChange={(e) => setProfile({ ...profile, instrumentos: e.target.value })} placeholder="Guitarra, piano..." className="w-full bg-slate-950/70 text-slate-100 rounded-xl p-3 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-amber-200/80">Nombre visible</label>
                    <input value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} className="w-full bg-slate-950/70 text-slate-100 rounded-xl p-3 border border-amber-300/20 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
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
                        className="text-amber-300 hover:text-amber-200"
                      >
                        {profile.privateFields.descripcion ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                    </div>
                    <textarea value={profile.descripcion} onChange={(e) => setProfile({ ...profile, descripcion: e.target.value })} className="w-full bg-slate-950/70 text-slate-100 rounded-xl p-3 h-28 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" placeholder="Escribe aquí una pequeña descripción..." />
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/85 text-slate-100 border border-amber-300/25 rounded-3xl p-5 shadow-[0_16px_44px_rgba(2,6,23,0.5)] backdrop-blur-xl">
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
                    className="text-amber-300 hover:text-amber-200"
                  >
                    {profile.privateFields.academyRanges ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>
                <div className="space-y-2">
                  {profile.academyRanges.map((r) => (
                    <div key={r.id} className="grid grid-cols-2 gap-2">
                      <input value={r.desde} onChange={(e) => setProfile({ ...profile, academyRanges: profile.academyRanges.map((x) => (x.id === r.id ? { ...x, desde: e.target.value } : x)) })} placeholder="Enero 2024" className="bg-slate-950/70 text-slate-100 rounded-xl p-2 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
                      <input value={r.hasta} onChange={(e) => setProfile({ ...profile, academyRanges: profile.academyRanges.map((x) => (x.id === r.id ? { ...x, hasta: e.target.value } : x)) })} placeholder="Actual" className="bg-slate-950/70 text-slate-100 rounded-xl p-2 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" />
                    </div>
                  ))}
                </div>
                <button onClick={() => setProfile({ ...profile, academyRanges: [...profile.academyRanges, { id: Date.now(), desde: "", hasta: "Actual" }] })} className="mt-3 text-xs bg-amber-400 text-slate-900 rounded-lg px-3 py-2 font-bold">Añadir rango</button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-900/85 text-slate-100 border border-amber-300/25 rounded-3xl p-5 shadow-[0_16px_44px_rgba(2,6,23,0.5)] backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-amber-200">Historial de progreso</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setProfile({
                          ...profile,
                          privateFields: {
                            ...profile.privateFields,
                            progressHistory: !profile.privateFields.progressHistory,
                          },
                        })
                      }
                      className="text-amber-300 hover:text-amber-200"
                    >
                      {profile.privateFields.progressHistory ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <input value={progressInput} onChange={(e) => setProgressInput(e.target.value)} className="flex-1 bg-slate-950/70 text-slate-100 rounded-xl p-2 border border-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-300/35" placeholder="Ej: Mejoró en intervalos" />
                    <button onClick={() => {
                      if (!progressInput.trim()) return;
                      setProfile({ ...profile, progressHistory: [{ id: Date.now(), fecha: new Date().toLocaleDateString("es-ES"), texto: progressInput.trim() }, ...profile.progressHistory] });
                      setProgressInput("");
                    }} className="bg-amber-400 text-black rounded-xl px-3">+</button>
                  </div>
                  <div className="space-y-2">{profile.progressHistory.map((p) => <div key={p.id} className="text-sm bg-slate-950/55 rounded-xl p-3 border border-amber-300/15"><div className="text-[10px] text-amber-100/70">{p.fecha}</div>{p.texto}</div>)}</div>
                </div>

                <div className="bg-slate-900/85 text-slate-100 border border-amber-300/25 rounded-3xl p-5 shadow-[0_16px_44px_rgba(2,6,23,0.5)] backdrop-blur-xl">
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
                      className="text-amber-300 hover:text-amber-200"
                    >
                      {profile.privateFields.medalsHistory ? <Lock size={14} /> : <Unlock size={14} />}
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
              <div className="bg-slate-900/85 text-slate-100 border border-amber-300/25 rounded-3xl p-5 shadow-[0_16px_44px_rgba(2,6,23,0.5)] backdrop-blur-xl">
                <h3 className="font-bold mb-3 text-amber-200">Última puntuación por juego</h3>
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
