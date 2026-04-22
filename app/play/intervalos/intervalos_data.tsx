// intervalos_data.ts

export interface IntervaloPregunta {
  image: string;
  answer: string;
}

const tipos = [
  { folder: "1. b2", prefix: "b2", ans: "b2" },
  { folder: "2. 2", prefix: "2", ans: "2" },
  { folder: "3. b3", prefix: "b3", ans: "b3" },
  { folder: "4. 3", prefix: "3", ans: "3" },
  { folder: "5. 4", prefix: "4", ans: "4" },
  { folder: "6. #4", prefix: "#4", ans: "#4" },
  { folder: "7. b5", prefix: "b5", ans: "b5" },
  { folder: "8. 5", prefix: "5", ans: "5" },
  { folder: "9. #5", prefix: "#5", ans: "#5" },
  { folder: "10. b6", prefix: "b6", ans: "b6" },
  { folder: "11. 6", prefix: "6", ans: "6" },
  { folder: "12. b7", prefix: "b7", ans: "b7" },
  { folder: "13. 7", prefix: "7", ans: "7" }
];

const nombresArchivos = [
  "do a.pdf", "sol.pdf", "si.pdf", "re.pdf", 
  "mi.pdf", "la.pdf", "fa.pdf", "do.pdf"
];

export const intervalos_data: IntervaloPregunta[] = tipos.flatMap((tipo) =>
  nombresArchivos.map((nombre) => {
    // Aquí hacemos la magia: cambiamos la extensión de .pdf a .png automáticamente
    const nombreLimpio = nombre.replace(".pdf", ".png");
    
    return {
      image: `/assets/intervalos/${tipo.folder}/${tipo.prefix} ${nombreLimpio}`,
      answer: tipo.ans
    };
  })
);