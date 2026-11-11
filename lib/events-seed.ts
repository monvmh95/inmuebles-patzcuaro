/**
 * Eventos iniciales. Solo datos confirmados en fuentes públicas; lo que no está confirmado se deja fuera.
 * Se cargan una vez (ON CONFLICT DO NOTHING): si los editas o rechazas en /admin, no se vuelven a pisar.
 */
export type SeedEvent = {
  series: string; year: number; title: string; title_en: string; summary: string; summary_en: string;
  description: string; description_en: string; category: string; city: string; venue: string;
  starts_on: string; ends_on: string; time_text?: string; date_note?: string; date_note_en?: string;
  organizer?: string; source_name: string; source_url: string;
};

export const SEED_EVENTS: SeedEvent[] = [
  {
    series: "feratum-film-fest", year: 2026, category: "cultura", city: "Pátzcuaro",
    title: "FERATUM Film Fest 2026", title_en: "FERATUM Film Fest 2026",
    summary: "Festival de cine fantástico y de terror, 15ª edición, con clases magistrales, exposición y encuentros de la industria.",
    summary_en: "Fantasy and horror film festival, 15th edition, with masterclasses, an exhibition and industry meetings.",
    description:
      "FERATUM Film Fest celebra su edición 15 en Pátzcuaro del 12 al 15 de noviembre de 2026. El programa incluye clases magistrales sobre efectos visuales y sobre maquillaje y efectos para personajes (viernes 13 y sábado 14 de noviembre en la terraza del Teatro Emperador Caltzontzin), la exposición “XV años de imaginar lo fantástico” en el Centro Cultural Ex Convento Jesuita y mesas de la industria en el Centro Cultural Jacaranda, como el FERATUM Pitch Hub, que requiere acreditación y registro previo.\n\nLa programación completa y los requisitos de acceso están en el sitio oficial del festival.",
    description_en:
      "FERATUM Film Fest holds its 15th edition in Pátzcuaro from November 12 to 15, 2026. The program includes masterclasses on visual effects and on makeup and character effects (Friday 13 and Saturday 14 November on the terrace of the Teatro Emperador Caltzontzin), the exhibition “XV años de imaginar lo fantástico” at the Ex Convento Jesuita cultural center, and industry panels at the Centro Cultural Jacaranda, including the FERATUM Pitch Hub, which requires accreditation and prior registration.\n\nThe full schedule and access requirements are on the festival's official website.",
    venue: "Teatro Emperador Caltzontzin, Ex Convento Jesuita y Centro Cultural Jacaranda",
    starts_on: "2026-11-12", ends_on: "2026-11-15",
    source_name: "Mi Morelia / FERATUM", source_url: "https://mimorelia.com/cultura/que-habra-feratum-2026-talleres-monstruos-efectos-especiales-y-cine-terror-patzcuaro-n5596833",
  },
  {
    series: "festival-cafe-chocolate-vino", year: 2026, category: "gastronomia", city: "Pátzcuaro",
    title: "Festival del Café, Chocolate y Vino 2026", title_en: "Coffee, Chocolate and Wine Festival 2026",
    summary: "7ª edición con más de 120 expositores y más de 30 vinícolas en la Plaza Don Vasco de Quiroga.",
    summary_en: "7th edition with over 120 exhibitors and more than 30 wineries at Plaza Don Vasco de Quiroga.",
    description:
      "El Festival del Café, Chocolate y Vino llega a su séptima edición el 14 y 15 de noviembre de 2026 en la Plaza Don Vasco de Quiroga, en Pátzcuaro. Reúne a más de 120 expositores, entre ellos más de 30 vinícolas, con degustaciones de café, vino, chocolate, pan de masa madre, helado, miel y queso.\n\nUno de los momentos destacados es la cena temática “Entre vinos y leyendas”, en el lago de Pátzcuaro, en el muelle de San Pedrito, con alimentos servidos a bordo de lanchas turísticas. La Secretaría de Turismo de Michoacán calcula alrededor de 30 mil asistentes.\n\nCostos y programa: consúltalos en el sitio oficial del festival, porque no están publicados en las notas de prensa.",
    description_en:
      "The Coffee, Chocolate and Wine Festival reaches its seventh edition on November 14 and 15, 2026 at Plaza Don Vasco de Quiroga in Pátzcuaro. It brings together more than 120 exhibitors, including over 30 wineries, with tastings of coffee, wine, chocolate, sourdough bread, ice cream, honey and cheese.\n\nA highlight is the themed dinner “Entre vinos y leyendas” on Lake Pátzcuaro at the San Pedrito pier, with food served aboard tourist boats. Michoacán's Tourism Secretariat expects around 30,000 attendees.\n\nPrices and schedule: check the festival's official website, as they are not listed in press coverage.",
    venue: "Plaza Don Vasco de Quiroga (y muelle de San Pedrito para la cena)",
    starts_on: "2026-11-14", ends_on: "2026-11-15",
    organizer: "Secretaría de Turismo de Michoacán (según la prensa)",
    source_name: "La Voz de Michoacán", source_url: "https://www.lavozdemichoacan.com.mx/a-donde-vamos/patzcuaro-festival-cafe-chocolate-vino-plaza-don-vasco-2026/",
  },
  {
    series: "feria-patzcuaro", year: 2026, category: "feria", city: "Pátzcuaro",
    title: "Feria Pátzcuaro 2026 (Virgen de la Salud)", title_en: "Pátzcuaro Fair 2026 (Our Lady of Health)",
    summary: "Feria patronal en honor a Nuestra Señora de la Salud: misas, procesiones y bailes. El 8 de diciembre es el día principal.",
    summary_en: "Patron saint fair for Our Lady of Health: masses, processions and dances. December 8 is the main day.",
    description:
      "La Feria Pátzcuaro es la feria patronal en honor a Nuestra Señora de la Salud. Según el directorio de ferias consultado, se realiza durante la primera semana de diciembre y el 8 de diciembre es el día de la conmemoración, con misas, procesiones y eventos especiales. Hay bailes de feria con boletos a la venta; para el 8 de diciembre se anuncian La Arrolladora, Alacranes Musical y Los Cadetes de Linares.\n\nLas fechas exactas de inicio y cierre no estaban publicadas al momento de revisar esta página, por eso aquí se muestra el 8 de diciembre. Confírmalas con el patronato de la feria antes de planear tu viaje. Es una de las fechas con más visitantes, así que conviene reservar hospedaje con anticipación.",
    description_en:
      "The Pátzcuaro Fair is the patron saint fair in honor of Our Lady of Health. According to the fair directory consulted, it takes place during the first week of December, and December 8 is the commemoration day, with masses, processions and special events. Fair dances have tickets on sale; for December 8 the lineup announced is La Arrolladora, Alacranes Musical and Los Cadetes de Linares.\n\nThe exact start and end dates had not been published when this page was last checked, so December 8 is shown here. Confirm them with the fair committee before planning your trip. It is one of the busiest dates, so book lodging early.",
    venue: "Pátzcuaro",
    starts_on: "2026-12-08", ends_on: "2026-12-08",
    date_note: "La feria dura la primera semana de diciembre; el día principal es el 8.",
    date_note_en: "The fair runs the first week of December; the main day is the 8th.",
    source_name: "Ferias en México", source_url: "https://www.feriasenmexico.com.mx/feria-patzcuaro/",
  },
  {
    series: "noche-de-muertos", year: 2026, category: "tradicion", city: "Pátzcuaro",
    title: "Noche de Muertos en Pátzcuaro y el lago", title_en: "Day of the Dead in Pátzcuaro and the lake region",
    summary: "Semana de actividades del 23 de octubre al 2 de noviembre: talleres, altares y cosecha de cempasúchil. Se repite cada año.",
    summary_en: "A week of activities from October 23 to November 2: workshops, altars and marigold harvesting. It happens every year.",
    description:
      "La Noche de Muertos es la celebración más conocida de la región del lago de Pátzcuaro. En 2026, la Secretaría de Turismo de Michoacán anunció una semana de actividades del 23 de octubre al 2 de noviembre, con talleres artesanales y de cocina tradicional, elaboración de altares y cosecha de flor de cempasúchil. La velación se vive en las comunidades de la ribera, como Janitzio y Tzintzuntzan.\n\nEsta página queda abierta todo el año: cuando se publique el programa de la siguiente edición, se actualiza aquí. Si piensas venir, reserva hospedaje con meses de anticipación, porque es la temporada más demandada del año.",
    description_en:
      "Day of the Dead (Noche de Muertos) is the best-known celebration in the Lake Pátzcuaro region. In 2026, Michoacán's Tourism Secretariat announced a week of activities from October 23 to November 2, with craft and traditional cooking workshops, altar-making and marigold harvesting. The all-night vigils take place in lakeside communities such as Janitzio and Tzintzuntzan.\n\nThis page stays open all year: when the next edition's program is published, it will be updated here. If you plan to come, book lodging months ahead, as it is the busiest season of the year.",
    venue: "Pátzcuaro y comunidades del lago (Janitzio, Tzintzuntzan)",
    starts_on: "2026-10-23", ends_on: "2026-11-02",
    source_name: "Crónica", source_url: "https://www.cronica.com.mx/estados/2026/10/13/michoacan-invita-a-turistas-a-disfrutar-sus-festivales-y-tradiciones-durante-el-cierre-de-ano/",
  },
  {
    series: "mariposa-monarca", year: 2026, category: "naturaleza", city: "Oriente de Michoacán",
    title: "Temporada de la mariposa monarca", title_en: "Monarch butterfly season",
    summary: "De noviembre a marzo se puede ver la migración de la mariposa monarca en los bosques del oriente de Michoacán.",
    summary_en: "From November to March you can see the monarch butterfly migration in the forests of eastern Michoacán.",
    description:
      "De noviembre a marzo llega la migración de la mariposa monarca a los bosques del oriente de Michoacán, según la Secretaría de Turismo del estado. Los santuarios no están en Pátzcuaro; se visitan en una excursión de un día o con una noche de camino hacia esa zona.\n\nLas fechas de apertura y las reglas de acceso de cada santuario las define cada uno. Confírmalas con la fuente oficial antes de salir.",
    description_en:
      "From November to March the monarch butterfly migration arrives in the forests of eastern Michoacán, according to the state Tourism Secretariat. The sanctuaries are not in Pátzcuaro; they are visited on a day trip or with an overnight stay on the way there.\n\nOpening dates and access rules are set by each sanctuary. Confirm them with the official source before you travel.",
    venue: "Bosques del oriente de Michoacán",
    starts_on: "2026-11-01", ends_on: "2027-03-31",
    date_note: "Temporada de noviembre a marzo.", date_note_en: "Season runs from November to March.",
    source_name: "Crónica", source_url: "https://www.cronica.com.mx/estados/2026/10/13/michoacan-invita-a-turistas-a-disfrutar-sus-festivales-y-tradiciones-durante-el-cierre-de-ano/",
  },
];
