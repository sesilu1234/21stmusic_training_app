"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

// Ejemplo de la estructura de datos (puedes ampliar hasta 100)
const preguntasTrivial = [
  {
    pregunta: "¿Qué guitarrista es conocido por su icónica Fender Stratocaster negra llamada 'Blackie'?",
    opciones: ["Jimi Hendrix", "Eric Clapton", "Jeff Beck", "Ritchie Blackmore"],
    respuesta: "Eric Clapton"
  },
  {
    pregunta: "¿En qué banda militaron juntos Michael Schenker y su hermano Rudolf?",
    opciones: ["UFO", "MSG", "Scorpions", "Europe"],
    respuesta: "Scorpions"
  },
  {
    pregunta: "¿Cuál fue la primera guitarra de cuerpo sólido comercializada masivamente por Leo Fender?",
    opciones: ["Stratocaster", "Telecaster", "Broadcaster", "Jazzmaster"],
    respuesta: "Broadcaster"
  },
  {
    pregunta: "¿Qué álbum de 'The Beatles' incluye el famoso solo de Eric Clapton en 'While My Guitar Gently Weeps'?",
    opciones: ["Abbey Road", "Revolver", "The White Album", "Let It Be"],
    respuesta: "The White Album"
  },
  {
    pregunta: "¿Qué modelo de Gibson es inseparable de la imagen de Jimmy Page?",
    opciones: ["SG", "Les Paul Standard", "Flying V", "Explorer"],
    respuesta: "Les Paul Standard"
  },
  {
    pregunta: "¿Quién compuso y grabó el legendario solo de 'Sultans of Swing'?",
    opciones: ["Mark Knopfler", "David Gilmour", "Jeff Beck", "Gary Moore"],
    respuesta: "Mark Knopfler"
  },
  {
    pregunta: "¿Qué guitarrista de Blues es famoso por tocar una Stratocaster castigada llamada 'Number One'?",
    opciones: ["Rory Gallagher", "Stevie Ray Vaughan", "Buddy Guy", "Kenny Wayne Shepherd"],
    respuesta: "Stevie Ray Vaughan"
  },
  {
    pregunta: "Ritchie Blackmore dejó Deep Purple para fundar su propia banda llamada...",
    opciones: ["Whitesnake", "Rainbow", "Black Sabbath", "Dio"],
    respuesta: "Rainbow"
  },
  {
    pregunta: "¿Cuál es el intervalo característico de la escala 'Blues' que la diferencia de la pentatónica menor?",
    opciones: ["Segunda mayor", "Cuarta aumentada", "Sexta mayor", "Séptima mayor"],
    respuesta: "Cuarta aumentada"
  },
  {
    pregunta: "¿En qué año se fabricó la primera Fender Stratocaster?",
    opciones: ["1950", "1952", "1954", "1958"],
    respuesta: "1954"
  },
  {
    pregunta: "¿Quiénes compusieron la mítica canción 'Hotel California' de The Eagles?",
    opciones: ["Don Felder, Don Henley y Glenn Frey", "Joe Walsh y Don Henley", "Don Henley y Randy Meisner", "Glenn Frey y Bernie Leadon"],
    respuesta: "Don Felder, Don Henley y Glenn Frey"
  },
  {
    pregunta: "¿Qué guitarrista de los Beatles utilizó una Fender Stratocaster apodada 'Rocky' pintada con colores psicodélicos?",
    opciones: ["John Lennon", "George Harrison", "Paul McCartney", "Pete Best"],
    respuesta: "George Harrison"
  },
  {
    pregunta: "¿Cómo se llama la famosa guitarra Fender Stratocaster destrozada de Jimi Hendrix que subastaron por millones?",
    opciones: ["Black Beauty", "Monterey Strat", "Woodstock White", "Saville Strat"],
    respuesta: "Monterey Strat"
  },
  {
    pregunta: "¿Qué modelo de guitarra Gibson utiliza casi exclusivamente Marcus King?",
    opciones: ["Les Paul Goldtop", "ES-345 TD", "SG Standard", "Explorer"],
    respuesta: "ES-345 TD"
  },
  {
    pregunta: "¿Qué guitarrista de ZZ Top es conocido por su 'Pearly Gates', una Les Paul de 1959?",
    opciones: ["Dusty Hill", "Frank Beard", "Billy Gibbons", "Joe Bonamassa"],
    respuesta: "Billy Gibbons"
  },
  {
    pregunta: "¿En qué banda tocó Eric Clapton antes de formar Cream?",
    opciones: ["The Yardbirds", "The Who", "The Kinks", "Led Zeppelin"],
    respuesta: "The Yardbirds"
  },
  {
    pregunta: "¿Cuál es el nombre del álbum debut de Jimi Hendrix Experience lanzado en 1967?",
    opciones: ["Axis: Bold as Love", "Electric Ladyland", "Are You Experienced", "Band of Gypsys"],
    respuesta: "Are You Experienced"
  },
  {
    pregunta: "¿Qué guitarrista de The Eagles toca el famoso solo de slide en 'Victim of Love'?",
    opciones: ["Joe Walsh", "Don Felder", "Glenn Frey", "Bernie Leadon"],
    respuesta: "Don Felder"
  },
  {
    pregunta: "¿Qué técnica de mano derecha es característica del sonido de ZZ Top y Billy Gibbons?",
    opciones: ["Sweep Picking", "Pinch Harmonics (Armónicos de púa)", "Tapping", "Fingerstyle puro"],
    respuesta: "Pinch Harmonics (Armónicos de púa)"
  },
  {
    pregunta: "¿Qué amplificadores utilizaba mayoritariamente Jimi Hendrix en directo?",
    opciones: ["Fender Twin Reverb", "Marshall Super Lead (Plexi)", "Vox AC30", "Orange Rockerverb"],
    respuesta: "Marshall Super Lead (Plexi)"
  },
  {
    pregunta: "¿A qué guitarrista dedicó Eric Clapton la trágica canción 'Tears in Heaven'?",
    opciones: ["A su padre", "A su hijo Conor", "A Jimi Hendrix", "A Duane Allman"],
    respuesta: "A su hijo Conor"
  },
  {
    pregunta: "¿Qué canción de los Beatles contiene uno de los primeros ejemplos de 'feedback' o acople de guitarra grabado?",
    opciones: ["I Feel Fine", "Help!", "A Hard Day's Night", "Ticket to Ride"],
    respuesta: "I Feel Fine"
  },
  {
    pregunta: "¿Marcus King es considerado un prodigio de qué mezcla de géneros?",
    opciones: ["Punk y Metal", "Jazz y Country", "Southern Rock, Blues y Soul", "Indie y Folk"],
    respuesta: "Southern Rock, Blues y Soul"
  },
  {
    pregunta: "¿Cómo se llama el guitarrista rítmico y fundador de The Eagles que falleció en 2016?",
    opciones: ["Randy Meisner", "Timothy B. Schmit", "Glenn Frey", "Joe Walsh"],
    respuesta: "Glenn Frey"
  },
  {
    pregunta: "¿Qué pedal de efecto es fundamental para el sonido de Hendrix en 'Voodoo Child (Slight Return)'?",
    opciones: ["Fuzz Face", "Wah-Wah", "Univibe", "Octavia"],
    respuesta: "Wah-Wah"
  },
  {
    pregunta: "¿En qué ciudad se formó la banda ZZ Top?",
    opciones: ["Austin, Texas", "Houston, Texas", "Dallas, Texas", "Memphis, Tennessee"],
    respuesta: "Houston, Texas"
  },
  {
    pregunta: "¿Qué guitarrista de The Beatles tocó el solo de guitarra en 'Taxman'?",
    opciones: ["George Harrison", "John Lennon", "Paul McCartney", "Eric Clapton"],
    respuesta: "Paul McCartney"
  },
  {
    pregunta: "¿Qué marca de guitarras acústicas es la preferida históricamente por The Eagles para sus directos?",
    opciones: ["Takamine", "Gibson", "Martin", "Taylor"],
    respuesta: "Takamine"
  },
  {
    pregunta: "¿Cuál era el apodo de Eric Clapton durante su estancia en los Yardbirds?",
    opciones: ["God", "Slowhand", "The King", "The Raven"],
    respuesta: "Slowhand"
  },
  {
    pregunta: "¿Qué guitarrista de los Rolling Stones es famoso por usar una afinación abierta de Sol (Open G) y solo 5 cuerdas?",
    opciones: ["Mick Taylor", "Brian Jones", "Keith Richards", "Ronnie Wood"],
    respuesta: "Keith Richards"
  },
  {
    pregunta: "¿Cómo apodó B.B. King a todas sus guitarras Gibson ES-355?",
    opciones: ["Mary Lou", "Lucille", "Bernice", "Blackie"],
    respuesta: "Lucille"
  },
  {
    pregunta: "¿Qué guitarrista de 'Europe' grabó el legendario solo de 'The Final Countdown'?",
    opciones: ["John Norum", "Kee Marcello", "Yngwie Malmsteen", "Vinnie Moore"],
    respuesta: "John Norum"
  },
  {
    pregunta: "¿Cuál es el modelo 'Signature' más famoso de Paul Reed Smith (PRS), diseñado para un guitarrista mexicano?",
    opciones: ["PRS Santana", "PRS Dragon", "PRS Custom 24", "PRS Tremonti"],
    respuesta: "PRS Santana"
  },
  {
    pregunta: "¿Qué guitarrista de blues-rock grabó el álbum 'Irish Tour '74' con una Stratocaster extremadamente desgastada?",
    opciones: ["Gary Moore", "Rory Gallagher", "Jeff Beck", "Joe Bonamassa"],
    respuesta: "Rory Gallagher"
  },
  {
    pregunta: "¿Quién sustituyó a Ritchie Blackmore en Deep Purple para grabar el álbum 'Come Taste the Band'?",
    opciones: ["Joe Satriani", "Steve Morse", "Tommy Bolin", "David Gilmour"],
    respuesta: "Tommy Bolin"
  },
  {
    pregunta: "¿En qué canción de Jimi Hendrix se escucha por primera vez el efecto Octavia (que dobla la nota una octava arriba)?",
    opciones: ["Purple Haze", "Little Wing", "Fire", "Voodoo Child"],
    respuesta: "Purple Haze"
  },
  {
    pregunta: "¿Qué marca de guitarras fundó el luthier Grover Jackson, famosa por sus modelos 'Rhoads' y 'Soloist'?",
    opciones: ["Ibanez", "Jackson", "Charvel", "ESP"],
    respuesta: "Jackson"
  },
  {
    pregunta: "¿Qué guitarrista de Whitesnake y Thin Lizzy es conocido por su técnica de 'vibrato' agresivo y el álbum 'Still Got the Blues'?",
    opciones: ["John Sykes", "Gary Moore", "Adrian Vandenberg", "Doug Aldrich"],
    respuesta: "Gary Moore"
  },
  {
    pregunta: "¿Qué modelo de Fender utilizaba Jeff Beck en su etapa con The Yardbirds (famosa por tener el cuerpo recortado)?",
    opciones: ["Stratocaster", "Telecaster", "Esquire", "Mustang"],
    respuesta: "Esquire"
  },
  {
    pregunta: "¿Cuál era la principal diferencia de la Gibson Les Paul 'Goldtop' de 1952 respecto a las posteriores?",
    opciones: ["No tenía pastillas", "El puente era un cordal trapezoidal", "Era de cuerpo hueco", "Tenía 3 pastillas"],
    respuesta: "El puente era un cordal trapezoidal"
  },
  {
    pregunta: "¿Qué guitarrista de Scorpions grabó los solos del álbum 'Lovedrive' antes de dejar la banda definitivamente?",
    opciones: ["Matthias Jabs", "Michael Schenker", "Uli Jon Roth", "Rudolf Schenker"],
    respuesta: "Michael Schenker"
  },
  {
    pregunta: "¿Qué legendario bluesman se dice que vendió su alma al diablo en un cruce de caminos (Cruce 61 y 49)?",
    opciones: ["Robert Johnson", "Muddy Waters", "Howlin' Wolf", "Son House"],
    respuesta: "Robert Johnson"
  },
  {
    pregunta: "¿Qué modelo de guitarra acústica Taylor es famoso por ser utilizado por Taylor Swift y muchos artistas de country modernos?",
    opciones: ["Taylor 814ce", "Taylor GS Mini", "Taylor Baby", "Taylor 214ce"],
    respuesta: "Taylor 814ce"
  },
  {
    pregunta: "¿Quién fue el guitarrista de 'The Who' famoso por destrozar sus guitarras y hacer el movimiento del 'molinillo'?",
    opciones: ["Roger Daltrey", "John Entwistle", "Pete Townshend", "Keith Moon"],
    respuesta: "Pete Townshend"
  },
  {
    pregunta: "¿Qué pastillas inventó Seth Lover para Gibson en 1955 para eliminar el ruido de fondo?",
    opciones: ["Single Coil", "P-90", "Humbucker (PAF)", "Lipstick"],
    respuesta: "Humbucker (PAF)"
  },
  {
    pregunta: "¿Qué guitarrista de 'The Beatles' tocaba el bajo originalmente antes de pasar a la guitarra rítmica?",
    opciones: ["John Lennon", "George Harrison", "Paul McCartney", "Ninguno de ellos"],
    respuesta: "Ninguno de ellos"
  },
  {
    pregunta: "¿Cómo se llama la técnica de tocar la guitarra con un tubo de metal o cristal en el dedo, típica del Blues?",
    opciones: ["Tapping", "Bending", "Slide (o Bottleneck)", "Palm Mute"],
    respuesta: "Slide (o Bottleneck)"
  },
  {
    pregunta: "¿Qué marca de guitarras compró CBS en 1965, iniciando una era de producción masiva muy criticada?",
    opciones: ["Gibson", "Fender", "Gretsch", "Guild"],
    respuesta: "Fender"
  },
  {
    pregunta: "¿Qué guitarrista grabó el solo de 'While My Guitar Gently Weeps' pero no apareció en los créditos originales?",
    opciones: ["Jeff Beck", "Eric Clapton", "Jimmy Page", "Keith Richards"],
    respuesta: "Eric Clapton"
  },
  {
    pregunta: "¿Qué guitarrista sustituyó a Mick Taylor en 'The Rolling Stones' en 1975?",
    opciones: ["Ronnie Wood", "Brian Jones", "Keith Richards", "Jeff Beck"],
    respuesta: "Ronnie Wood"
  }
  // ... añadir el resto hasta 100
];

export default function TrivialGuitarra() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [quizList, setQuizList] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<(null | "correct" | "wrong")[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    // Mezclamos 24 preguntas de las 100 disponibles cada vez que se juega
    const shuffled = [...preguntasTrivial].sort(() => Math.random() - 0.5).slice(0, 24);
    setQuizList(shuffled);
    setResults(Array(shuffled.length).fill(null));
    setUserAnswers(Array(shuffled.length).fill(null));
    setIsMounted(true);
  }, []);

  const progresoMaximo = useMemo(() => {
    const firstEmpty = userAnswers.indexOf(null);
    return firstEmpty === -1 ? quizList.length : firstEmpty;
  }, [userAnswers, quizList]);

  if (!isMounted || quizList.length === 0) return null;

  const currentQuestion = quizList[step];

  const handleAnswer = (opcionSeleccionada: string) => {
    if (userAnswers[step] !== null || gameOver) return;
    setIsReviewing(false);

    const isCorrect = opcionSeleccionada === currentQuestion.respuesta;
    
    const newResults = [...results];
    newResults[step] = isCorrect ? "correct" : "wrong";
    setResults(newResults);

    const newAnswers = [...userAnswers];
    newAnswers[step] = opcionSeleccionada;
    setUserAnswers(newAnswers);

    if (step < quizList.length - 1) {
      setTimeout(() => setStep(step + 1), 600);
    } else {
      setTimeout(() => setGameOver(true), 1200);
    }
  };

  const goBack = () => {
    setIsReviewing(true);
    setStep(prev => Math.max(0, prev - 1));
  };

  const goNext = () => {
    const nextStep = step + 1;
    if (nextStep <= progresoMaximo && nextStep < quizList.length) {
      setStep(nextStep);
      setIsReviewing(nextStep < progresoMaximo);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-900 bg-cover bg-center overflow-x-hidden"
         style={{ backgroundImage: "url('/assets/background.jpeg')" }}>
      
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="absolute top-8 left-12 z-20">
        <button onClick={() => router.push("/play")} className="text-white/50 hover:text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-6 py-2.5 rounded-full border border-white/10 transition-all hover:bg-black/60">
          ← Menú Principal
        </button>
      </div>

      {/* LOGOS LATERALES */}
      <div className="absolute top-24 left-0 right-0 flex justify-between px-32 pointer-events-none z-0">
        <img src="/assets/logo21stCM_no_white_1.png" className="h-28 w-auto drop-shadow-2xl opacity-90" alt="logo" />
        <img src="/assets/logo21stCM_no_white_1.png" className="h-28 w-auto drop-shadow-2xl opacity-90" alt="logo" />
      </div>

      <div className="min-h-screen bg-black/10 flex flex-col items-center justify-center p-6 z-10">
        
        {/* TÍTULO ESTILO ACORDE */}
        <div className="mb-6 text-center mt-20">
          <h2 className="text-white text-3xl font-black italic tracking-tighter leading-tight" 
              style={{ fontFamily: 'Chaney, sans-serif' }}>
            ¿<span className="uppercase">Q</span>uánto sabes de 
            <span className="text-black mx-2 drop-shadow-[0_1.2px_1.2px_rgba(255,255,255,0.8)] uppercase">
              GUITARRA
            </span> 
            ?
          </h2>
        </div>

        {/* PREGUNTA CONTAINER */}
        <div className="relative flex flex-col items-center w-full max-w-2xl mb-8">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl w-full min-h-[12rem] flex flex-col items-center justify-center border-4 border-white relative overflow-hidden">
            <div className="absolute top-4 right-8 text-black/5 font-black italic text-xl">#{step + 1}</div>
            <p className="text-black text-xl font-bold text-center leading-snug">
              {currentQuestion.pregunta}
            </p>
          </div>

          {/* SOLUCIÓN EN REVISIÓN */}
          <div className={`absolute -bottom-10 left-0 right-0 z-30 transition-all duration-500 transform ${isReviewing ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
            <div className="mx-auto w-64 h-14 rounded-2xl border-2 border-amber-400/50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
              <span className="text-[8px] text-amber-400 uppercase font-black tracking-widest">Respuesta Correcta</span>
              <span className="text-sm font-semibold text-white font-sans">{currentQuestion.respuesta}</span>
            </div>
          </div>
        </div>

        {/* OPCIONES DE RESPUESTA */}
        <div className={`bg-black/40 p-8 rounded-[3rem] border border-white/10 w-full max-w-4xl backdrop-blur-md transition-all ${userAnswers[step] !== null ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.opciones.map(opcion => (
              <button 
                key={opcion} 
                onClick={() => handleAnswer(opcion)}
                className="py-5 px-6 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-amber-500 hover:text-black transition-all active:scale-95 text-left"
              >
                <span className="text-sm font-semibold font-sans">{opcion}</span>
              </button>
            ))}
          </div>
        </div>

        {/* NAVEGACIÓN Y PROGRESO */}
        <div className="w-full max-w-4xl mt-16 flex items-center justify-center gap-4 px-4">
          <button onClick={goBack} className={`shrink-0 px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-full uppercase tracking-widest ${step === 0 ? 'opacity-0' : 'opacity-100'}`}>
            ← Anterior
          </button>

          <div className="flex flex-wrap justify-center gap-1.5 p-3 bg-black/20 rounded-2xl border border-white/5">
            {results.map((res, i) => (
              <div 
                key={i} 
                onClick={() => { if(userAnswers[i] !== null) { setIsReviewing(true); setStep(i); } }}
                className={`w-6 h-6 rounded-md border flex items-center justify-center text-[8px] font-black cursor-pointer transition-all ${
                  res === "correct" ? "bg-green-500 text-white border-green-400" : 
                  res === "wrong" ? "bg-red-500 text-white border-red-400" : 
                  i === step ? "border-amber-400 bg-white/20 text-white scale-110" : "border-white/5 text-white/10"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <button onClick={goNext} className={`shrink-0 px-8 py-3 bg-amber-500 text-black text-[10px] font-black rounded-full uppercase tracking-widest ${isReviewing ? 'opacity-100' : 'opacity-0'}`}>
            Siguiente →
          </button>
        </div>

        <footer className="py-12 text-center text-slate-600 text-[8px] tracking-[0.8em] uppercase">
          © 2026 21st Century Music
        </footer>
      </div>

      {/* MODAL RESULTADOS */}
      {gameOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="text-center p-12 bg-white/5 rounded-[4rem] border border-white/10 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter" style={{ fontFamily: 'Chaney, sans-serif' }}>¡Hecho!</h2>
            <div className="text-5xl font-black text-amber-400 my-8 italic" style={{ fontFamily: 'Chaney, sans-serif' }}>
              {results.filter(r => r === "correct").length}<span className="text-white/20 text-2xl mx-2">/</span>24
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-amber-500 text-black font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all">Reiniciar</button>
          </div>
        </div>
      )}
    </div>
  );
}