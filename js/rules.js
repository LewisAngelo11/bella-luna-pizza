/** Reglamento y definiciones de eventos / anomalías */

export const RULES = [
  {
    id: "shadow",
    text: "Si un cliente no proyecta sombra, no le sirvas. Ni le hables.",
  },
  {
    id: "pineapple",
    text: "Nunca sirvas piña después de las 00:00. Aunque lo pidan amablemente.",
  },
  {
    id: "freezer",
    text: "El congelador permanece cerrado. Si oyes golpes desde dentro: ignóralos.",
  },
  {
    id: "table6",
    text: "No mires la Mesa 6 más de tres segundos seguidos.",
  },
  {
    id: "phone",
    text: "Si el teléfono suena dos veces, contesta. Si suena tres, cuelga al instante.",
  },
  {
    id: "redeyes",
    text: "Clientes con ojos rojos reciben pan de ajo. Nunca pizza.",
  },
  {
    id: "manager",
    text: "Si alguien dice «el gerente me mandó», miente. Recházalo.",
  },
  {
    id: "flicker",
    text: "Cuando parpadeen las luces, cierra los ojos hasta que se estabilicen.",
  },
  {
    id: "smile",
    text: "Si un cliente sonríe con demasiados dientes, no mires su boca. Sirve y aparta la vista.",
  },
  {
    id: "door",
    text: "Después de las 02:00, la puerta trasera debe permanecer cerrada con llave. Si se abre, ciérrala de inmediato.",
  },
  {
    id: "oven",
    text: "El horno no debe apagarse. Si se apaga solo, enciéndelo de inmediato.",
  },
  {
    id: "freezer_auto",
    text: "Si el congelador se abre solo, puede cerrarse solo… o no. Si no lo hace, ciérralo tú antes de cinco segundos.",
  },
];

/** Plantillas de clientes normales */
export const NORMAL_CUSTOMERS = [
  {
    desc: "Una mujer con abrigo mojado. Parece cansada del turno de hospital.",
    order: "Pide una margarita mediana y un vaso de agua.",
    traits: { shadow: true, redEyes: false, tooManyTeeth: false, claimsManager: false, wantsPineapple: false },
    correct: "serve_pizza",
  },
  {
    desc: "Un repartidor de otra cadena. Se limpia las botas en el felpudo.",
    order: "«Solo una porción de pepperoni, hermano. Rápido.»",
    traits: { shadow: true, redEyes: false, tooManyTeeth: false, claimsManager: false, wantsPineapple: false },
    correct: "serve_pizza",
  },
  {
    desc: "Un chico con auriculares. No te mira a los ojos, pero su sombra sí está ahí.",
    order: "Pide una cuatro quesos sin orégano.",
    traits: { shadow: true, redEyes: false, tooManyTeeth: false, claimsManager: false, wantsPineapple: false },
    correct: "serve_pizza",
  },
  {
    desc: "Una pareja anciana. Ella cuenta monedas. Él mira el horno con nostalgia.",
    order: "Dos calzones y «lo que quede de pan».",
    traits: { shadow: true, redEyes: false, tooManyTeeth: false, claimsManager: false, wantsPineapple: false },
    correct: "serve_pizza",
  },
];

/** Anomalías — cada una viola / pone a prueba una regla */
export const ANOMALIES = [
  {
    id: "no_shadow",
    desc: "Un hombre alto con traje impecable. La luz del neón no le dibuja sombra en el suelo.",
    order: "«Una napolitana. Y no hagas preguntas.»",
    traits: { shadow: false, redEyes: false, tooManyTeeth: false, claimsManager: false, wantsPineapple: false },
    correct: "refuse",
    wrongDeath: "El hombre sin sombra abre la boca demasiado. Dentro no hay lengua: solo el horno.",
    ruleBroken: "shadow",
  },
  {
    id: "pineapple_after",
    desc: "Una chica con gorra de béisbol. Sonrisa amable. Reloj de pared: pasada la medianoche.",
    order: "«Hawaiana grande, por favor. Con mucha piña.»",
    traits: { shadow: true, redEyes: false, tooManyTeeth: false, claimsManager: false, wantsPineapple: true },
    correct: "refuse",
    wrongDeath: "La piña no era fruta. Algo en la caja se mueve. Tus manos ya no responden.",
    ruleBroken: "pineapple",
    requiresAfterMidnight: true,
  },
  {
    id: "red_eyes",
    desc: "Un cliente con capucha. Cuando alza la vista, sus iris brillan rojo como brasas.",
    order: "Señala el menú de pizzas. No habla.",
    traits: { shadow: true, redEyes: true, tooManyTeeth: false, claimsManager: false, wantsPineapple: false },
    correct: "serve_garlic",
    wrongDeath: "Los ojos rojos se abren más. El olor a queso quemado no viene del horno.",
    ruleBroken: "redeyes",
  },
  {
    id: "fake_manager",
    desc: "Alguien con delantal manchado. Te mira demasiado fijo.",
    order: "«El gerente me mandó. Dame las llaves del almacén.»",
    traits: { shadow: true, redEyes: false, tooManyTeeth: false, claimsManager: true, wantsPineapple: false },
    correct: "refuse",
    wrongDeath: "No hay gerente. Nunca lo hubo. Él sí lo sabía.",
    ruleBroken: "manager",
  },
  {
    id: "too_many_teeth",
    desc: "Una señora educada. Cuando sonríe, cuentas… y dejas de querer contar.",
    order: "«Una marinara, cariño. Y sonríe un poco, estás pálido.»",
    traits: { shadow: true, redEyes: false, tooManyTeeth: true, claimsManager: false, wantsPineapple: false },
    correct: "serve_lookaway",
    wrongDeath: "Miraste la boca. Ahora ella mira la tuya desde dentro.",
    ruleBroken: "smile",
  },
  {
    id: "wrong_pineapple_early",
    desc: "Un turista con mapa arrugado. Todavía no es medianoche.",
    order: "«Pizza con piña, ¿sí? Como en las películas.»",
    traits: { shadow: true, redEyes: false, tooManyTeeth: false, claimsManager: false, wantsPineapple: true },
    correct: "serve_pizza",
    wrongDeath: "Antes de medianoche la piña era segura. Tú la rechazaste. Algo más hambriento aceptó el hueco.",
    ruleBroken: null,
    requiresBeforeMidnight: true,
  },
];

export const ACTIONS = {
  serve_pizza: { label: "Servir pizza", icon: "🍕" },
  serve_garlic: { label: "Dar pan de ajo", icon: "🧄" },
  serve_lookaway: { label: "Servir sin mirar la boca", icon: "👀" },
  refuse: { label: "Rechazar / No servir", icon: "⛔" },
  ignore: { label: "Ignorar y volver al mostrador", icon: "↩" },
};

export const DEATHS = {
  freezer_opened: {
    title: "Congelado",
    message: "Abriste el congelador. Los golpes cesaron. Algo te abrazó desde la escarcha.",
    detail: "Regla rota: el congelador permanece cerrado.",
  },
  table6: {
    title: "Mesa 6",
    message: "Miraste demasiado. La silla vacía ya no está vacía. Nunca lo estuvo.",
    detail: "Regla rota: no mires la Mesa 6 más de tres segundos.",
  },
  phone_wrong: {
    title: "Línea equivocada",
    message: "Del otro lado de la línea solo hay masticar. Y tu nombre, mal pronunciado.",
    detail: "Regla del teléfono incumplida.",
  },
  flicker_eyes: {
    title: "Luces",
    message: "Mantener los ojos abiertos durante el parpadeo fue un error. Viste quién apaga los interruptores.",
    detail: "Regla rota: cierra los ojos cuando parpadeen las luces.",
  },
  door_unlocked: {
    title: "Puerta trasera",
    message: "A las 02:00 algo empujó desde fuera. La cerradura no estaba echada.",
    detail: "Regla rota: puerta trasera cerrada después de las 02:00.",
  },
  oven_cold: {
    title: "Horno frío",
    message: "Las brasas murieron. En la oscuridad del horno algo más encontró calor… en ti.",
    detail: "Regla rota: el horno no debe apagarse.",
  },
  freezer_ajar: {
    title: "Abierto",
    message: "El congelador quedó entreabierto demasiado tiempo. La escarcha aprendió tu nombre.",
    detail: "Regla rota: si el congelador se abre solo, ciérralo a tiempo.",
  },
  fear: {
    title: "Ruptura",
    message: "Tu cordura se agotó. El mostrador sigue ahí. Tú, no.",
    detail: "Demasiados errores. El turno te consumió.",
  },
  customer: {
    title: "Mal servicio",
    message: "",
    detail: "",
  },
  win: {
    title: "06:00",
    message: "El sol no entra por las ventanas, pero el reloj marca las seis. El turno terminó. Por hoy.",
    detail: "El dueño dejó el sobresueldo bajo la caja. No preguntes de dónde salió.",
  },
};
