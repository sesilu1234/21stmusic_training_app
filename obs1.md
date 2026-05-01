- intentandolo hacerlo a tierra justo : 0.6min - 0.15max , con un [0, 0.20] va bien creo , a 120 bpm

inside 2.6213333333333333
page.tsx:39 inside 4.610666666666667
page.tsx:39 inside 6.6
page.tsx:39 inside 8.592

outside 2.56
page.tsx:51 outside 4.592
page.tsx:51 outside 6.610666666666667
page.tsx:51 outside 8.6

inside 2.6213333333333333
page.tsx:39 inside 4.632
page.tsx:39 inside 6.632
page.tsx:39 inside 8.592

en 120bpm , entre semis hay 0.25 seg y entre negras 0.5 seg
en 90bpm , entre semis hay 0.33 seg y entre negras 0.66 seg
en 60bpm , entre semis hay 0.5 seg y entre negras 1 seg

---

---

---

---

lo hago assi :

se puede dar desde el [0 hasta el 0.15]

si le he dado ese ya se pone en verde, y lo elimino de posibles intervalo
si doy en un sitio donde no hay intervalo se pone a rojo
y si me paso un intervalo sin haberle dado, se pone a rojo

---

---

pulsar la barra antes da error : condition para que no haga nada hasta que cargue font, o canvas
que no clickee cuano llegas al final
al pulsar barra de nuevo : se genera una nueva score random ( no lo esta haciendo), y se dejan de pintar los taps y cross o checks rojos y verdes

ocurre si tapeas al final despues de la ultima nota

MusicDisplay.tsx:395 Uncaught TypeError: Cannot read properties of undefined (reading 'time')
at SimpleMovingScore.useImperativeHandle [as handleStart] (MusicDisplay.tsx:395:36)
at RitmoGame.useCallback[handleTap] (page.tsx:41:23)
at RitmoGame.useEffect.handleKeyDown (page.tsx:60:9)

aademas, al reiniciar con pulsar barra reitinalize todo, tambien la currentNoteIndex
ademas, al reinicar con pulsar barra ya no puedes tapear, ya no hace nada

al pulsar reset , basicamente lo mismo, ya esta roto

mejorar tiempos : printear cuanddo pulso

poner que cuano acabe de muestre el marcador

poner que si golpeas cuando no hay ninguna nota, tambien pongaa una X o algo mosstrando mal
