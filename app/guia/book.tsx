import type { ReactNode } from "react";
import { Callout, H2, Hi, LI, N, P, Practica, T, Tabla, UL } from "./prose";

/**
 * El libro: una lista plana y ordenada de páginas.
 *
 * Plana y no anidada a propósito. El índice pinta la sangría a partir de
 * `level`, y el "anterior / siguiente" solo tiene que mirar la página de al
 * lado — con un árbol habría que recorrerlo entero para saber qué va después
 * de la última subsección de una sección.
 */

export interface BookPage {
  slug: string;
  /** "1", "3.2"… o null en las páginas sin numerar (prólogo, introducción). */
  number: string | null;
  title: string;
  summary: string;
  /** 0 = sección, 1 = subsección. Solo lo usa la sangría del índice. */
  level: 0 | 1;
  body: ReactNode;
}

/** Portadilla de sección: orienta y deja paso a las subsecciones. */
const SectionIntro = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

export const BOOK: BookPage[] = [
  // =====================================================================
  {
    slug: "prologo",
    number: null,
    title: "Prólogo",
    summary: "Para quién es esto y cómo leerlo.",
    level: 0,
    body: (
      <>
        <P>
          Esta guía es la parte de la clase que siempre se queda a medias. En una
          hora se puede enseñar a alguien a tocar un acorde, pero no a entender
          por qué ese acorde suena donde suena. Eso necesita leerse despacio, y
          releerse.
        </P>
        <P>
          No hace falta saber nada para empezar. No hace falta leer partituras, ni
          tocar un instrumento, ni haber pisado un conservatorio. Se empieza por
          los nombres de las notas y se acaba entendiendo por qué cuatro acordes
          seguidos suenan a canción.
        </P>
        <P>
          Tampoco es un temario de examen. Está escrito para que sirva mientras
          tocas: casi todos los capítulos terminan con un enlace al modo de juego
          donde se practica eso mismo, porque la teoría que no se usa se olvida en
          una semana.
        </P>
        <Callout title="Una advertencia">
          <p>
            La teoría musical no explica por qué algo suena bien. Va por detrás:
            alguien tocó algo que gustó, y luego se le puso nombre. Cuando algo te
            suene bien y la teoría diga que no debería, tiene razón <Hi>tu oído</Hi>.
          </p>
        </Callout>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "introduccion",
    number: null,
    title: "Introducción",
    summary: "Las tres cosas de las que va toda la música.",
    level: 0,
    body: (
      <>
        <P>
          Toda la música se sostiene sobre tres cosas, y la guía va de ellas en
          este orden:
        </P>
        <UL>
          <LI>
            <T>La altura</T>: qué nota suena. Si es grave o aguda. De aquí salen
            las escalas, los intervalos y los acordes, que es la mayor parte del
            libro.
          </LI>
          <LI>
            <T>La duración</T>: cuánto dura cada sonido y cómo se agrupan los
            golpes. Es el ritmo, y tiene su capítulo al final.
          </LI>
          <LI>
            <T>El timbre</T>: por qué la misma nota suena distinta en una guitarra
            y en un piano. De esto la teoría no dice casi nada, y aquí tampoco.
          </LI>
        </UL>

        <H2>Cómo leerlo</H2>
        <P>
          En orden. Cada capítulo da por sabido el vocabulario del anterior, y
          saltarse los dos primeros para ir directo a los acordes es la forma más
          rápida de no entender nada: los acordes son intervalos apilados, y los
          intervalos se miden en semitonos.
        </P>
        <P>
          Las secciones numeradas se dividen en subsecciones cortas. Ninguna pasa
          de cinco minutos de lectura, así que se puede ir capítulo a capítulo
          entre clase y clase.
        </P>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "las-notas",
    number: "1",
    title: "Las notas",
    summary: "Siete nombres que dan la vuelta una y otra vez.",
    level: 0,
    body: (
      <SectionIntro>
        <P>
          Antes de medir distancias hay que saber entre qué se miden. Este
          capítulo es el vocabulario mínimo: cómo se llaman las notas, las dos
          formas de nombrarlas que te vas a encontrar, y la unidad con la que se
          mide todo lo demás.
        </P>
        <P>
          Es el capítulo más aburrido del libro y el que más se usa. Con los dos
          semitonos naturales bien aprendidos —los del final de la sección 1.3—
          la mitad de las dudas que vienen después no llegan a aparecer.
        </P>
      </SectionIntro>
    ),
  },
  {
    slug: "los-siete-nombres",
    number: "1.1",
    title: "Los siete nombres",
    summary: "Do, Re, Mi… y vuelta a empezar.",
    level: 1,
    body: (
      <>
        <P>
          Toda la música que vas a tocar está hecha con siete nombres:{" "}
          <N>Do Re Mi Fa Sol La Si</N>. Cuando se acaban, vuelven a empezar. No hay
          un octavo nombre escondido: se acaba en <N>Si</N> y detrás viene otra vez{" "}
          <N>Do</N>.
        </P>
        <P>
          Ese <N>Do</N> nuevo suena igual que el anterior pero más agudo. A la
          distancia entre uno y el siguiente con el mismo nombre se le llama{" "}
          <T>octava</T>.
        </P>
        <P>
          Eso explica una cosa que se nota a diario: un hombre y una mujer pueden
          cantar «la misma nota» y sonar distinto. Cantan <Hi>la misma nota en octavas diferentes</Hi>. Para el oído es la misma cosa más arriba o más abajo, y por
          eso les ponemos el mismo nombre.
        </P>

        <H2>Por qué siete y no otro número</H2>
        <P>
          Por costumbre, y muy antigua. Hay músicas que parten la octava en más
          trozos y otras en menos. Nosotros heredamos siete nombres y cinco notas
          de relleno, que son las que verás en la sección 2.1.
        </P>

        <Practica href="/play/diapason">
          Encuentra cualquier nota en el mástil
        </Practica>
      </>
    ),
  },
  {
    slug: "cifrado-americano",
    number: "1.2",
    title: "El cifrado americano",
    summary: "Las mismas notas, con letras.",
    level: 1,
    body: (
      <>
        <P>
          En cifrado anglosajón —el que verás en casi todas las partituras de
          guitarra, en los libros de acordes y en internet— las mismas siete notas
          se escriben con letras. Merece la pena aprendérselo ya, porque a partir
          del capítulo de acordes aparece por todas partes.
        </P>
        <Tabla
          rows={[
            ["Do", "C"],
            ["Re", "D"],
            ["Mi", "E"],
            ["Fa", "F"],
            ["Sol", "G"],
            ["La", "A"],
            ["Si", "B"],
          ]}
        />
        <Callout title="Truco">
          <p>
            La letra <N>A</N> no es <N>Do</N>, es <N>La</N>. Parece un despiste de
            los ingleses, pero tiene su lógica: el sistema se inventó contando
            desde <N>La</N>, que es la nota con la que se afinan las orquestas —el
            famoso <N>La</N> de 440 Hz—.
          </p>
        </Callout>
        <P>
          Hay una trampa más: en la notación alemana, que se ve en partituras
          antiguas, <N>B</N> significa <N>Si bemol</N> y al <N>Si</N> natural se le
          llama <N>H</N>. Si alguna vez ves una <N>H</N> suelta, ya sabes de qué va.
        </P>
      </>
    ),
  },
  {
    slug: "tonos-y-semitonos",
    number: "1.3",
    title: "Tonos y semitonos",
    summary: "La unidad de medida de todo lo que viene después.",
    level: 1,
    body: (
      <>
        <P>
          El <T>semitono</T> es la distancia más pequeña que hay entre dos notas en
          la música occidental. En la guitarra es un traste. En el piano, la tecla
          de al lado contando también las negras.
        </P>
        <P>
          Un <T>tono</T> son dos semitonos: dos trastes, o dos teclas contando las
          negras. Ya está. Con estas dos medidas se construye absolutamente todo lo
          que viene detrás.
        </P>

        <H2>Los dos sitios donde se estrecha</H2>
        <P>
          Si las siete notas estuvieran repartidas de forma regular, todo sería más
          fácil. Pero no lo están: entre casi todas hay un tono, salvo en dos
          sitios donde solo hay un semitono.
        </P>
        <Tabla
          rows={[
            ["Do → Re", "un tono"],
            ["Re → Mi", "un tono"],
            ["Mi → Fa", "SEMITONO"],
            ["Fa → Sol", "un tono"],
            ["Sol → La", "un tono"],
            ["La → Si", "un tono"],
            ["Si → Do", "SEMITONO"],
          ]}
        />
        <P>
          Los dos sitios donde solo hay medio paso son <N>Mi–Fa</N> y <N>Si–Do</N>.
          Si te aprendes esos dos y nada más de este capítulo, ya has ganado: son <Hi>el origen de casi todas las dudas que aparecen luego</Hi>.
        </P>
        <P>
          Sumando: cinco tonos y dos semitonos son doce semitonos por octava.
        </P>

        <Callout title="En la guitarra">
          <p>
            Cuerda al aire y traste 12 son la misma nota separada por una octava.
            Por eso el traste 12 lleva la marca doble: es el punto en el que el
            mástil <Hi>empieza a repetirse</Hi>.
          </p>
        </Callout>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "las-alteraciones",
    number: "2",
    title: "Las alteraciones",
    summary: "Las notas que viven entre las notas.",
    level: 0,
    body: (
      <SectionIntro>
        <P>
          Doce semitonos por octava y solo siete nombres: faltan cinco sonidos por
          bautizar. Este capítulo va de cómo se nombran esos cinco y de por qué el
          mismo sonido puede escribirse de dos maneras según de dónde vengas.
        </P>
      </SectionIntro>
    ),
  },
  {
    slug: "sostenidos-y-bemoles",
    number: "2.1",
    title: "Sostenidos y bemoles",
    summary: "Subir o bajar medio paso.",
    level: 1,
    body: (
      <>
        <P>
          Entre <N>Do</N> y <N>Re</N> hay un tono, así que cabe un sonido en medio.
          Ese sonido no tiene nombre propio: se nombra a partir de sus vecinos.
        </P>
        <UL>
          <LI>
            Un <T>sostenido</T> (<N>#</N>) sube la nota un semitono. <N>Do#</N> es
            un traste por encima de <N>Do</N>.
          </LI>
          <LI>
            Un <T>bemol</T> (<N>b</N>) baja la nota un semitono. <N>Reb</N> es un
            traste por debajo de <N>Re</N>.
          </LI>
          <LI>
            Un <T>becuadro</T> (<N>♮</N>) anula lo anterior y deja la nota natural.
          </LI>
        </UL>

        <H2>Los que no existen</H2>
        <P>
          Como entre <N>Mi</N> y <N>Fa</N> solo hay un semitono, no cabe nada en
          medio: no hay una tecla negra ahí. Lo mismo entre <N>Si</N> y <N>Do</N>.
          Por eso el piano tiene las negras agrupadas de dos en dos y de tres en
          tres, con un hueco justo en esos dos sitios.
        </P>
        <P>
          Mirar un piano es la forma más rápida de entender el capítulo anterior:
          los huecos donde falta una tecla negra son <Hi>exactamente</Hi> <N>Mi–Fa</N> y <N>Si–Do</N>.
        </P>

        <Practica href="/play/piano/notas">
          Localiza notas en el teclado
        </Practica>
      </>
    ),
  },
  {
    slug: "enarmonia",
    number: "2.2",
    title: "Enarmonía y las doce notas",
    summary: "Un sonido, dos nombres.",
    level: 1,
    body: (
      <>
        <P>
          <N>Do#</N> y <N>Reb</N> son <em>el mismo traste</em>, la misma tecla, el
          mismo sonido. Se llaman de dos maneras según de dónde vengas: si subes
          desde <N>Do</N> es <N>Do#</N>, si bajas desde <N>Re</N> es <N>Reb</N>. A
          eso se le llama <T>enarmonía</T>.
        </P>
        <P>
          No es una manía de los teóricos. En el pentagrama, <N>Do#</N> y{" "}
          <N>Reb</N> se escriben en alturas distintas —una en la línea del Do y
          otra en el espacio del Re—, y elegir bien es lo que hace que una
          partitura se lea de un vistazo en vez de tener que descifrarla.
        </P>

        <H2>Las doce</H2>
        <P>Con las alteraciones, la octava completa queda así:</P>
        <P>
          <N>Do · Do# · Re · Re# · Mi · Fa · Fa# · Sol · Sol# · La · La# · Si</N>
        </P>
        <P>
          Siete con nombre propio y cinco prestadas. Esas cinco son, ni más ni
          menos, las teclas negras del piano. A partir de aquí, cuando el libro
          diga «las doce notas», son estas.
        </P>

        <Practica href="/play/armadura">
          Reconoce armaduras y alteraciones
        </Practica>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "la-escala-mayor",
    number: "3",
    title: "La escala mayor",
    summary: "La fórmula de la que sale casi todo lo demás.",
    level: 0,
    body: (
      <SectionIntro>
        <P>
          De las doce notas se eligen siete y se descartan cinco. Cuáles elijas es
          lo que le da el carácter a la música, y la elección más importante de
          todas es la escala mayor.
        </P>
        <P>
          No es la más importante porque suene mejor, sino porque es la vara de
          medir: los intervalos, los acordes y las tonalidades de los capítulos
          siguientes se explican todos comparándolos con ella.
        </P>
      </SectionIntro>
    ),
  },
  {
    slug: "la-formula",
    number: "3.1",
    title: "La fórmula",
    summary: "T T S T T T S, y funciona empezando donde quieras.",
    level: 1,
    body: (
      <>
        <P>
          Una <T>escala</T> es una selección de notas ordenadas de grave a agudo. La
          escala mayor sigue siempre este patrón de tonos (T) y semitonos (S):
        </P>
        <P>
          <N>T · T · S · T · T · T · S</N>
        </P>
        <P>
          Si lo aplicas empezando en <N>Do</N> salen exactamente las siete notas
          naturales, sin ningún sostenido ni bemol. Por eso <N>Do mayor</N> es la
          primera que se enseña siempre:
        </P>
        <P>
          <N>Do Re Mi Fa Sol La Si Do</N>
        </P>

        <H2>Empezando en otro sitio</H2>
        <P>
          Lo bueno es que la fórmula funciona desde cualquier nota. Si arrancas en{" "}
          <N>Sol</N> y aplicas <N>T T S T T T S</N>, al llegar al sexto paso te ves
          obligado a tocar <N>Fa#</N> en vez de <N>Fa</N> para que los pasos
          cuadren.
        </P>
        <P>
          <Hi>Esa es toda la explicación</Hi> de por qué <N>Sol mayor</N> «lleva un sostenido». No es una regla que haya que memorizar: es lo único que puede
          pasar si respetas la fórmula.
        </P>

        <Practica href="/play/piano/escalas">
          Construye escalas en el teclado
        </Practica>
      </>
    ),
  },
  {
    slug: "los-grados",
    number: "3.2",
    title: "Los grados",
    summary: "Numerar las notas en vez de nombrarlas.",
    level: 1,
    body: (
      <>
        <P>
          A cada nota de la escala se le llama también por su número, o{" "}
          <T>grado</T>, escrito en romanos: <N>I</N> es la primera, <N>V</N> la
          quinta.
        </P>
        <P>
          La primera se llama <T>tónica</T> y es la que manda: es la nota en la que
          la música descansa. Si tarareas una canción y la cortas de golpe, la nota
          que te pide el cuerpo para terminar <Hi>es la tónica</Hi>.
        </P>

        <H2>Para qué sirve numerarlas</H2>
        <P>
          Para poder hablar de una canción sin atarla a una tonalidad. «Va del I al
          V» describe igual de bien la canción en <N>Do</N> que en <N>Mi</N>, y si
          mañana hay que bajarla porque el cantante no llega, la descripción sigue
          valiendo.
        </P>
        <P>
          Este vocabulario se usa sin parar en el capítulo 6, que es donde de verdad
          se le saca partido.
        </P>

        <Callout title="Mayúsculas y minúsculas">
          <p>
            Cuando los grados se usan para acordes —capítulo 6—, la caja importa:{" "}
            <N>V</N> en mayúscula es un acorde mayor y <N>vi</N> en minúscula es uno
            menor. Escribir <N>VI</N> donde va <N>vi</N> es cambiar el acorde.
          </p>
        </Callout>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "los-intervalos",
    number: "4",
    title: "Los intervalos",
    summary: "La distancia entre dos notas, con nombre y apellido.",
    level: 0,
    body: (
      <SectionIntro>
        <P>
          Un <T>intervalo</T> es la distancia entre dos notas. Es la herramienta con
          la que se describe todo lo demás: un acorde es un par de intervalos
          apilados, y una escala es una lista de intervalos desde la tónica.
        </P>
        <P>
          Cada intervalo tiene dos partes en su nombre: un número, que se cuenta
          sobre los nombres de nota, y un apellido, que se mide en semitonos.
        </P>
      </SectionIntro>
    ),
  },
  {
    slug: "como-se-cuentan",
    number: "4.1",
    title: "Cómo se cuentan",
    summary: "Contando nombres, y empezando por el uno.",
    level: 1,
    body: (
      <>
        <P>
          El número de un intervalo sale de contar cuántos nombres de nota hay de
          una a otra, <em>incluyendo las dos puntas</em>.
        </P>
        <P>
          De <N>Do</N> a <N>Mi</N>: Do, Re, Mi son tres nombres, así que es una{" "}
          <T>tercera</T>. De <N>Do</N> a <N>Sol</N>: Do, Re, Mi, Fa, Sol son cinco,
          así que es una <T>quinta</T>.
        </P>
        <P>
          Ojo con esto, que es donde falla todo el mundo al principio: <Hi>se cuenta desde uno, no desde cero</Hi>. De una nota a sí misma es una <T>primera</T>, no
          una «cero». Y por eso dos terceras seguidas no dan una sexta, sino una
          quinta: la nota del medio se cuenta dos veces.
        </P>

        <H2>Hacia arriba y hacia abajo</H2>
        <P>
          Un intervalo se mide siempre desde la nota grave hacia la aguda salvo que
          se diga lo contrario. <N>Do–Sol</N> subiendo es una quinta; <N>Sol–Do</N>{" "}
          subiendo es una cuarta. Son distancias distintas aunque las notas sean las
          mismas.
        </P>
      </>
    ),
  },
  {
    slug: "mayores-menores-justos",
    number: "4.2",
    title: "Mayores, menores y justos",
    summary: "El apellido, y la tabla que hay que tener a mano.",
    level: 1,
    body: (
      <>
        <P>
          El número solo no basta, porque hay terceras más grandes que otras. Por
          eso cada intervalo lleva además una calidad, que se mide comparándolo con
          la escala mayor de la nota de abajo:
        </P>
        <UL>
          <LI>
            Si la nota de arriba está en la escala mayor de la de abajo, el
            intervalo es <T>mayor</T> (2ª, 3ª, 6ª y 7ª) o <T>justo</T> (4ª, 5ª y
            8ª).
          </LI>
          <LI>
            Si la bajas un semitono, un mayor se vuelve <T>menor</T> y un justo se
            vuelve <T>disminuido</T>.
          </LI>
          <LI>
            Si la subes un semitono, cualquiera se vuelve <T>aumentado</T>.
          </LI>
        </UL>
        <P>Medidos en semitonos desde la nota de abajo:</P>
        <Tabla
          rows={[
            ["0", "unísono"],
            ["1", "2ª menor"],
            ["2", "2ª mayor"],
            ["3", "3ª menor"],
            ["4", "3ª mayor"],
            ["5", "4ª justa"],
            ["6", "tritono (4ª aum. / 5ª dism.)"],
            ["7", "5ª justa"],
            ["8", "6ª menor"],
            ["9", "6ª mayor"],
            ["10", "7ª menor"],
            ["11", "7ª mayor"],
            ["12", "octava"],
          ]}
        />
        <P>
          Las dos que hay que aprenderse hoy son la <T>3ª</T> y la <T>5ª</T>: con
          ellas se construyen todos los acordes del capítulo siguiente.
        </P>

        <Practica href="/play/oido">Reconoce intervalos al oído</Practica>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "los-acordes",
    number: "5",
    title: "Los acordes",
    summary: "Notas apiladas y el carácter que sale de ahí.",
    level: 0,
    body: (
      <SectionIntro>
        <P>
          Un <T>acorde</T> son varias notas sonando a la vez. Pero no valen tres
          notas cualesquiera: los acordes se construyen apilando terceras, y de esa
          regla tan simple sale todo el repertorio.
        </P>
      </SectionIntro>
    ),
  },
  {
    slug: "las-triadas",
    number: "5.1",
    title: "Las tríadas",
    summary: "Tres notas, cuatro sabores.",
    level: 1,
    body: (
      <>
        <P>
          La <T>tríada</T> es el acorde básico: tres notas apiladas de tercera en
          tercera, es decir, los grados <N>1</N>, <N>3</N> y <N>5</N> de una escala.
        </P>
        <P>
          Coge <N>Do</N>, sáltate <N>Re</N>, coge <N>Mi</N>, sáltate <N>Fa</N>, coge{" "}
          <N>Sol</N>. Eso es un <N>Do mayor</N>: <N>Do–Mi–Sol</N>.
        </P>

        <H2>Los cuatro tipos</H2>
        <P>
          Lo que cambia el carácter es el tamaño de esas dos terceras apiladas:
        </P>
        <Tabla
          rows={[
            ["Mayor", "3ª mayor + 5ª justa — abierto, alegre"],
            ["Menor", "3ª menor + 5ª justa — oscuro, triste"],
            ["Disminuido", "3ª menor + 5ª dism. — tenso, inestable"],
            ["Aumentado", "3ª mayor + 5ª aum. — raro, suspendido"],
          ]}
        />
        <P>
          La nota que decide entre mayor y menor es la <T>tercera</T>. Cambia solo
          esa y el acorde entero cambia de humor: la fundamental sigue igual y la
          quinta también. Es <Hi>el semitono más rentable de toda la música</Hi>.
        </P>

        <Practica href="/play/piano/acordes">
          Construye acordes en el teclado
        </Practica>
      </>
    ),
  },
  {
    slug: "las-cuatriadas",
    number: "5.2",
    title: "Las cuatríadas",
    summary: "Una tercera más, y el sonido se vuelve adulto.",
    level: 1,
    body: (
      <>
        <P>
          Si sigues apilando terceras aparece una cuarta nota, la séptima. El sonido
          se vuelve más rico y menos «de canción infantil»: <N>Cmaj7</N>,{" "}
          <N>Dm7</N>, <N>G7</N>.
        </P>
        <Tabla
          rows={[
            ["maj7", "mayor + 7ª mayor — dulce, flotante"],
            ["m7", "menor + 7ª menor — suave, melancólico"],
            ["7", "mayor + 7ª menor — el de dominante: pide resolver"],
            ["m7b5", "disminuido + 7ª menor — semidisminuido"],
            ["dim7", "disminuido + 7ª dism. — máxima tensión"],
          ]}
        />
        <P>
          El de en medio es el importante. El acorde de <T>séptima de dominante</T>{" "}
          —el <N>G7</N>— lleva dentro un tritono, y ese intervalo es tan inestable
          que el oído pide a gritos que se resuelva. Es el motor de casi todo el
          blues y de la cadencia que cierra media música occidental.
        </P>

        <Practica href="/play/oido/acordes">
          Reconoce tipos de acorde al oído
        </Practica>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "la-tonalidad",
    number: "6",
    title: "La tonalidad",
    summary: "Por qué unos acordes pegan con otros.",
    level: 0,
    body: (
      <SectionIntro>
        <P>
          Este es el capítulo al que iba todo lo anterior. Estar en una{" "}
          <T>tonalidad</T> significa que una nota manda sobre las demás y que la
          música tira hacia ella.
        </P>
        <P>
          De ahí sale la respuesta a la pregunta que se hace todo el mundo al
          empezar: por qué en una canción pegan unos acordes y no otros.
        </P>
      </SectionIntro>
    ),
  },
  {
    slug: "acordes-de-la-tonalidad",
    number: "6.1",
    title: "Los acordes de una tonalidad",
    summary: "Siete acordes que salen solos.",
    level: 1,
    body: (
      <>
        <P>
          Construye una tríada sobre cada grado de la escala mayor, usando solo
          notas de esa escala. Salen siete acordes, y no salen al azar: el patrón es
          siempre el mismo, da igual la tonalidad.
        </P>
        <Tabla
          rows={[
            ["I", "mayor"],
            ["ii", "menor"],
            ["iii", "menor"],
            ["IV", "mayor"],
            ["V", "mayor"],
            ["vi", "menor"],
            ["vii°", "disminuido"],
          ]}
        />
        <P>
          En <N>Do mayor</N> eso es <N>C · Dm · Em · F · G · Am · B°</N>. En{" "}
          <N>Sol mayor</N>, <N>G · Am · Bm · C · D · Em · F#°</N>. Mismo patrón,
          otro punto de partida.
        </P>
        <P>
          Ahí está la respuesta: los acordes que «pegan» en una canción son
          normalmente estos siete, porque <Hi>están hechos con las mismas siete notas</Hi>.
        </P>
      </>
    ),
  },
  {
    slug: "las-ruedas",
    number: "6.2",
    title: "Las ruedas de siempre",
    summary: "Tres progresiones que explican media discografía.",
    level: 1,
    body: (
      <>
        <P>
          De esos siete acordes, unas combinaciones se repiten muchísimo más que
          otras. Estas tres las vas a reconocer en cuanto sepas escucharlas:
        </P>
        <UL>
          <LI>
            <N>I – IV – V</N>: el blues, el rock and roll y medio cancionero
            popular.
          </LI>
          <LI>
            <N>I – V – vi – IV</N>: la rueda de pop que has oído mil veces.
          </LI>
          <LI>
            <N>ii – V – I</N>: la cadencia del jazz, la que más resuelve de todas.
          </LI>
        </UL>
        <P>
          Cuando saques canciones de oído no vas a reconocer «un Sol»: vas a reconocer <Hi>«el V»</Hi>. Ese es el salto que de verdad importa, y se entrena
          escuchando el grado contra la tónica una y otra vez.
        </P>

        <Practica href="/play/oido/progresiones">
          Saca progresiones de acordes al oído
        </Practica>
      </>
    ),
  },
  {
    slug: "la-armadura",
    number: "6.3",
    title: "La armadura",
    summary: "Las alteraciones que se escriben una sola vez.",
    level: 1,
    body: (
      <>
        <P>
          Los sostenidos o bemoles que aparecen al principio del pentagrama, justo
          después de la clave, son la <T>armadura</T>. Dicen en qué tonalidad estás
          y ahorran escribir la alteración en cada nota.
        </P>
        <P>
          Si la armadura lleva un <N>Fa#</N>, todos los <N>Fa</N> de la partitura son{" "}
          <N>Fa#</N> aunque no lleven el símbolo delante. Es un acuerdo para no
          llenar el papel de sostenidos.
        </P>

        <H2>La relativa menor</H2>
        <P>
          Una armadura vale para dos tonalidades: una mayor y su{" "}
          <T>relativa menor</T>, que empieza en el grado <N>vi</N>.
        </P>
        <P>
          <N>Do mayor</N> y <N>La menor</N> comparten armadura —ninguna alteración—
          y exactamente las mismas siete notas. Lo único que cambia es cuál manda: en
          una la música descansa en <N>Do</N> y en la otra en <N>La</N>. <Hi>Mismas notas, humor distinto</Hi>.
        </P>

        <Practica href="/play/armadura">Reconoce armaduras</Practica>
      </>
    ),
  },

  // =====================================================================
  {
    slug: "el-ritmo",
    number: "7",
    title: "El ritmo",
    summary: "Cuánto dura cada nota y cómo se agrupan los golpes.",
    level: 0,
    body: (
      <SectionIntro>
        <P>
          Hasta aquí, qué notas. Ahora, cuándo. El <T>pulso</T> es el latido
          constante de la música: eso que marcas con el pie sin pensarlo. La
          velocidad de ese pulso se mide en pulsaciones por minuto (bpm), y es lo
          que marca el metrónomo.
        </P>
        <P>
          Es el capítulo más corto y el que más se nota cuando falla. Una nota mal
          elegida suena rara; una nota a destiempo <Hi>tira abajo la canción entera</Hi>.
        </P>
      </SectionIntro>
    ),
  },
  {
    slug: "las-figuras",
    number: "7.1",
    title: "Las figuras",
    summary: "Cada una dura la mitad que la anterior.",
    level: 1,
    body: (
      <>
        <P>No hay más misterio que ese: cada figura vale la mitad de la anterior.</P>
        <Tabla
          rows={[
            ["Redonda", "4 pulsos"],
            ["Blanca", "2 pulsos"],
            ["Negra", "1 pulso"],
            ["Corchea", "medio pulso"],
            ["Semicorchea", "un cuarto de pulso"],
          ]}
        />
        <P>
          A cada figura le corresponde un <T>silencio</T> de la misma duración. El
          silencio <Hi>también se toca</Hi>: contarlo mal se nota igual que tocar una nota de
          más.
        </P>
        <P>
          Un <T>puntillo</T> detrás de una figura le añade la mitad de su valor. Una
          negra con puntillo dura pulso y medio, que es lo mismo que una negra atada
          a una corchea.
        </P>
      </>
    ),
  },
  {
    slug: "el-compas",
    number: "7.2",
    title: "El compás",
    summary: "Agrupar los pulsos, y que unos pesen más que otros.",
    level: 1,
    body: (
      <>
        <P>
          Los pulsos se agrupan en <T>compases</T>, separados por barras verticales.
          La cifra del principio dice cómo: el número de arriba, cuántos pulsos hay
          por compás; el de abajo, qué figura vale un pulso (<N>4</N> = negra,{" "}
          <N>8</N> = corchea).
        </P>
        <UL>
          <LI>
            <N>4/4</N>: cuatro negras por compás. El más común con diferencia.
          </LI>
          <LI>
            <N>3/4</N>: tres negras. El vals.
          </LI>
          <LI>
            <N>6/8</N>: seis corcheas agrupadas de tres en tres. Se siente en dos,
            pero con un balanceo distinto.
          </LI>
        </UL>

        <H2>Fuertes y débiles</H2>
        <P>
          Dentro del compás no todos los golpes pesan igual: el primero es el
          fuerte, y por eso se nota cuando una canción empieza ahí. Lo que suena
          entre pulsos es el <T>contratiempo</T>, y es <Hi>de donde sale el groove</Hi>.
        </P>
        <P>
          Cuando el acento se corre a propósito a un sitio donde no se espera, eso
          es <T>síncopa</T>. Casi todo lo que suena «con swing» en el pop y el funk
          es alguna forma de síncopa.
        </P>

        <Practica href="/play/ritmo">Lee y toca ritmos a tiempo</Practica>
      </>
    ),
  },
];

export const findPage = (slug: string) => BOOK.find((page) => page.slug === slug);

/** Índice de una página, para el anterior / siguiente. */
export const pageIndex = (slug: string) =>
  BOOK.findIndex((page) => page.slug === slug);

/** Las subsecciones de una sección numerada, para listarlas en su portadilla. */
export const childrenOf = (page: BookPage) =>
  page.number === null || page.level !== 0
    ? []
    : BOOK.filter(
        (candidate) =>
          candidate.level === 1 && candidate.number?.startsWith(`${page.number}.`),
      );
