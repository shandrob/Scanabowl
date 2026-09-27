import type { Locale } from "../i18n/config";

/**
 * Texts of the "best food for ..." guides. Kept out of messages/*.json on purpose: those files are shipped
 * to every visitor's browser, while these texts are only needed on the guide pages (rendered on the server).
 *
 * Placeholders: {year} (year of the data), {count} (number of foods compared), {lang} (language in links).
 * Inline formatting: **bold** and [label](/{lang}/path).
 * Every factual claim must match the blog posts and the method page (same sources).
 */
export interface GuideText {
  /** page heading */
  h1: string;
  /** <title> */
  title: string;
  /** meta description */
  description: string;
  /** one line on the overview page */
  card: string;
  intro: string;
  /** "what to look for" */
  tips: string[];
}

type Texts = Record<string, GuideText>;

const nl: Texts = {
  "kitten-food": {
    h1: "Het beste kittenvoer",
    title: "Beste kittenvoer {year}: de top 10 op onafhankelijke score",
    description: "Welk kittenvoer scoort het best? De top 10 uit {count} kittenvoeders, automatisch gerangschikt op ingrediënten en voedingswaarden. Geen betaalde plekken.",
    card: "Voer voor groeiende katten tot ongeveer een jaar.",
    intro: "Een kitten groeit in een jaar uit tot een volwassen kat en heeft per kilo lichaamsgewicht veel meer energie en eiwit nodig dan een volwassen kat. Dit zijn de kittenvoeders met de hoogste Scanabowl-score.",
    tips: [
      "**Kies voer voor groei.** Op de verpakking staat “kitten”, “junior” of “alle levensfasen”. Voer voor volwassen katten is niet gemaakt voor groei: de FEDIAF-richtlijnen hebben aparte, hogere normen voor groeiende dieren.",
      "**Geef kleine porties, vaak.** Een kitten heeft een kleine maag maar een hoge energiebehoefte: in de eerste maanden ongeveer twee tot tweeënhalf keer zoveel per kilo als een volwassen kat (FEDIAF).",
      "**Laat je kitten wennen aan natvoer.** Katten drinken van nature weinig en natvoer levert veel vocht. Een kat die jong aan natvoer went, eet het later makkelijker.",
      "**Rond 12 maanden stap je over** op voer voor volwassen katten. Doe dat geleidelijk, in ongeveer een week.",
    ],
  },
  "wet-cat-food": {
    h1: "Het beste natvoer voor katten",
    title: "Beste natvoer voor katten {year}: top 10 op score",
    description: "Het natvoer voor volwassen katten met de hoogste onafhankelijke score: de top 10 uit {count} volledige natvoeders, gerangschikt op ingrediënten en voedingswaarden.",
    card: "Blikjes, kuipjes en zakjes voor volwassen katten.",
    intro: "Natvoer bestaat voor het grootste deel uit water, en dat past bij een dier dat van nature weinig drinkt. Dit zijn de volledige natvoeders voor volwassen katten met de hoogste score.",
    tips: [
      "**Controleer of het volledig voer is.** Veel zakjes en blikjes zijn *aanvullend* voer (een snack of topping) en niet geschikt als enige voeding. In deze lijst staan alleen volledige voeders.",
      "**Vocht helpt.** Katten die voer met veel vocht eten, krijgen in totaal meer water binnen en maken meer verdunde urine (Buckley et al., 2011). Dat is gunstig voor de urinewegen.",
      "**Vergelijk op droge stof.** Natvoer met 10% eiwit en 80% vocht bevat op droge stof 50% eiwit. Dat rekenen wij voor elk voer voor je uit.",
      "**Reken met calorieën.** Natvoer bevat per gram veel minder energie dan droogvoer. Met een [huisdierprofiel](/{lang}/my-pet) zie je per voer hoeveel gram per dag past.",
    ],
  },
  "dry-cat-food": {
    h1: "Het beste droogvoer voor katten",
    title: "Beste kattenbrokken {year}: top 10 op onafhankelijke score",
    description: "Welke kattenbrokken scoren het best? De top 10 uit {count} volledige droogvoeders voor volwassen katten, onafhankelijk gerangschikt op ingrediënten en voedingswaarden.",
    card: "Brokken voor volwassen katten.",
    intro: "Droogvoer is handig en lang houdbaar, maar bevat weinig vocht en veel energie per gram. Dit zijn de volledige droogvoeders voor volwassen katten met de hoogste score.",
    tips: [
      "**Vergeleken met ander droogvoer.** Brokken bevatten altijd weinig vocht en wat zetmeel. Daarom vergelijken we droogvoer alleen met ander droogvoer, niet met natvoer. Zorg wel dat je kat genoeg drinkt, of combineer met natvoer.",
      "**Veel dierlijk eiwit, weinig koolhydraten.** Katten zijn strikte vleeseters. Kijk of dierlijke ingrediënten bovenaan de lijst staan, en niet granen of plantaardige eiwitconcentraten.",
      "**Weeg de portie af.** Een handvol brokken is al snel te veel. Een keukenweegschaal en de portie uit je [huisdierprofiel](/{lang}/my-pet) helpen tegen overgewicht.",
      "**Zet altijd vers water neer**, het liefst op een paar plekken en niet vlak naast de voerbak.",
    ],
  },
  "senior-cat-food": {
    h1: "Het beste seniorvoer voor katten",
    title: "Beste seniorvoer voor katten {year}: top 10 op score",
    description: "Het seniorvoer voor oudere katten met de hoogste onafhankelijke score: de top 10 uit {count} voeders, gerangschikt op ingrediënten en voedingswaarden.",
    card: "Voer dat bedoeld is voor oudere katten.",
    intro: "“Senior” is geen wettelijk begrip: seniorvoer moet aan dezelfde normen voldoen als voer voor volwassen katten, en wat fabrikanten anders doen verschilt sterk. Dit zijn de seniorvoeders met de hoogste score.",
    tips: [
      "**Minder eiwit is niet automatisch beter.** Oudere katten verteren vet en eiwit soms minder goed en hebben vanaf ongeveer 12 jaar vaak juist weer méér energie nodig (Laflamme, 2005). Beperk eiwit niet op eigen houtje.",
      "**Houd het gewicht bij.** Weeg je kat regelmatig. Ongewild afvallen bij een oudere kat is een reden om naar de dierenarts te gaan.",
      "**Bij een aandoening beslist de dierenarts.** Bij nierziekte of andere problemen is een dieetvoer van de dierenarts vaak beter dan gewoon seniorvoer. Dieetvoer staat daarom niet in deze lijst.",
      "**Voer voor volwassen katten kan ook.** Een gezonde oudere kat hoeft niet per se seniorvoer te eten.",
    ],
  },
  "sterilised-cat-food": {
    h1: "Het beste voer voor gesteriliseerde katten",
    title: "Beste voer voor gesteriliseerde katten {year}: top 10",
    description: "Welk voer voor gesteriliseerde of gecastreerde katten scoort het best? De top 10 uit {count} voeders, onafhankelijk gerangschikt op ingrediënten en voedingswaarden.",
    card: "Voer met “sterilised” of “castrated” op de verpakking.",
    intro: "Na sterilisatie of castratie heeft een kat minder energie nodig, terwijl de trek vaak toeneemt. Dit zijn de voeders voor gesteriliseerde katten met de hoogste Scanabowl-score.",
    tips: [
      "**De portie is belangrijker dan het label.** De FEDIAF-richtlijnen rekenen voor een gesteriliseerde of binnenkat met ongeveer een kwart minder energie dan voor een actieve kat. Vink in je [huisdierprofiel](/{lang}/my-pet) aan dat je kat gesteriliseerd is, dan rekenen we daarmee.",
      "**“Sterilised” is geen wettelijk begrip.** Zulke voeders zijn meestal wat minder energierijk, maar elk volledig voer werkt als je de juiste hoeveelheid geeft.",
      "**Natvoer helpt.** Natvoer bevat per gram minder calorieën en veel vocht, dus je kat mag een grotere portie eten voor dezelfde energie.",
    ],
  },
  "grain-free-cat-food": {
    h1: "Het beste graanvrije kattenvoer",
    title: "Beste graanvrije kattenvoer {year}: top 10 op score",
    description: "Het graanvrije kattenvoer met de hoogste onafhankelijke score: de top 10 uit {count} graanvrije voeders voor volwassen katten.",
    card: "Voer zonder tarwe, maïs, rijst of andere granen.",
    intro: "Graanvrij is geen kwaliteitskeurmerk en we geven er geen punten voor. Maar het kan handig zijn als je kat een graan niet verdraagt. Dit zijn de graanvrije voeders met de hoogste score.",
    tips: [
      "**Graanvrij is niet hetzelfde als koolhydraatarm.** Granen worden vaak vervangen door aardappel, erwten of andere peulvruchten. Kijk daarom naar de hele ingrediëntenlijst.",
      "**Katten hebben weinig koolhydraten nodig.** Voer met veel dierlijk eiwit en weinig zetmeel scoort bij ons hoger, graanvrij of niet.",
      "**Vermijd je een bepaald graan?** Stel het in je [huisdierprofiel](/{lang}/my-pet) in als allergie. Dan verbergen we elk voer waar het in zit.",
    ],
  },
  "single-protein-cat-food": {
    h1: "Het beste kattenvoer met één eiwitbron",
    title: "Kattenvoer met één dierlijke eiwitbron {year}: top 10",
    description: "Kattenvoer met maar één dierlijke eiwitbron en zonder vage bijproducten, gerangschikt op onafhankelijke score: de top 10 uit {count} voeders.",
    card: "Eén diersoort als eiwitbron, zonder vage “dierlijke bijproducten”.",
    intro: "Bij een (vermoede) voedselallergie wil je precies weten welk dier er in de bak zit. In deze lijst staan alleen voeders met één benoemde dierlijke eiwitbron, zonder vage omschrijvingen zoals “vlees en dierlijke bijproducten”.",
    tips: [
      "**De meest voorkomende voedselallergenen bij katten** zijn rund, vis en kip (Mueller et al., 2016). Kies een eiwitbron die je kat nog niet eerder heeft gegeten.",
      "**Een allergie stel je vast met een eliminatiedieet:** minstens 8 weken één voer en verder niets, samen met je dierenarts. Na 8 weken is ongeveer 90% van de dieren met een voedselallergie klachtenvrij (Olivry et al., 2015).",
      "**Controleer altijd de verpakking.** Recepturen veranderen soms. Bij een ernstige allergie adviseert je dierenarts mogelijk een dieetvoer.",
    ],
  },
  "puppy-food": {
    h1: "Het beste puppyvoer",
    title: "Beste puppyvoer {year}: de top 10 op onafhankelijke score",
    description: "Welk puppyvoer scoort het best? De top 10 uit {count} voeders voor pups, automatisch gerangschikt op ingrediënten en voedingswaarden. Geen betaalde plekken.",
    card: "Voer voor groeiende honden van elk formaat.",
    intro: "Een pup heeft meer eiwit, energie en mineralen nodig dan een volwassen hond, maar ook weer niet te veel. Dit zijn de puppyvoeders met de hoogste Scanabowl-score. Heb je een pup van een groot ras? Kijk dan bij [puppyvoer voor grote rassen](/{lang}/best/large-breed-puppy-food).",
    tips: [
      "**Kies voer voor groei.** Op de verpakking staat “puppy”, “junior” of “alle levensfasen”. De FEDIAF-richtlijnen hebben voor groei hogere normen voor onder meer eiwit, vet en calcium.",
      "**Past het bij de grootte van je hond?** Kleine en grote rassen groeien heel anders. Veel merken hebben aparte varianten voor kleine, middelgrote en grote rassen.",
      "**Tot wanneer?** Kleine en middelgrote honden eten puppyvoer tot ongeveer 12 maanden, grote rassen tot 18 à 24 maanden.",
      "**Geef geen extra calcium** of andere supplementen bij een volledig puppyvoer, tenzij je dierenarts dat adviseert.",
    ],
  },
  "large-breed-puppy-food": {
    h1: "Het beste puppyvoer voor grote rassen",
    title: "Beste puppyvoer voor grote rassen {year}: top 10",
    description: "Puppyvoer voor grote rassen met de hoogste onafhankelijke score, zonder voeders boven het FEDIAF-maximum voor calcium: de top 10 uit {count} voeders.",
    card: "Voor pups die volwassen meer dan ongeveer 25 kilo wegen.",
    intro: "Pups van grote rassen groeien lang door en zijn gevoelig voor te veel calcium en te snelle groei. In deze lijst staan alleen puppyvoeders voor grote rassen waarvan het calciumgehalte binnen het FEDIAF-maximum blijft, voor zover het op het etiket staat.",
    tips: [
      "**Niet te veel calcium.** Bij pups van de Deense dog leidde langdurig te veel calcium tot afwijkingen in de groeischijven (Goedegebuure & Hazewinkel, 1986). FEDIAF noemt voor de latere groeifase een maximum van 1,8 gram per 100 gram droge stof. Voeders daarboven laten we hier weg.",
      "**Laat je pup niet te snel groeien.** Een slanke pup is beter dan een ronde. Weeg regelmatig en gebruik de portie uit je [huisdierprofiel](/{lang}/my-pet).",
      "**Geef nooit extra calcium of kalkpreparaten** bij een volledig puppyvoer.",
      "**Puppyvoer tot 18 à 24 maanden.** Grote rassen zijn later volgroeid; stap pas daarna over op voer voor volwassen honden.",
    ],
  },
  "dry-dog-food": {
    h1: "Het beste droogvoer voor honden",
    title: "Beste hondenbrokken {year}: top 10 op onafhankelijke score",
    description: "Welke hondenbrokken scoren het best? De top 10 uit {count} volledige droogvoeders voor volwassen honden, gerangschikt op ingrediënten en voedingswaarden.",
    card: "Brokken voor volwassen honden.",
    intro: "Droogvoer is de meest gekozen voeding voor honden, en de verschillen zijn groot: van recepturen vol vlees tot vooral granen en plantaardig eiwit. Dit zijn de droogvoeders voor volwassen honden met de hoogste score.",
    tips: [
      "**Kijk verder dan het eerste ingrediënt.** Ingrediënten staan op volgorde van gewicht. “Verse kip” bovenaan bestaat voor ongeveer 70% uit water, dus kijk ook naar de rest van de lijst. Wij schatten het dierlijke deel voor je op droge stof.",
      "**Vergelijk op droge stof en energie.** Wij rekenen elk voer om, zodat je eerlijk kunt vergelijken, ook met natvoer.",
      "**Weeg de portie af.** Droogvoer is energierijk. Een paar brokken te veel per dag zie je na een paar maanden terug op de weegschaal.",
    ],
  },
  "wet-dog-food": {
    h1: "Het beste natvoer voor honden",
    title: "Beste natvoer voor honden {year}: top 10 op score",
    description: "Het natvoer voor volwassen honden met de hoogste onafhankelijke score: de top 10 uit {count} volledige blikken, kuipjes en worsten.",
    card: "Blikken, kuipjes en worsten voor volwassen honden.",
    intro: "Natvoer is vaak rijk aan vlees en valt goed bij kieskeurige honden, maar door het vele water geef je er grotere porties van. Dit zijn de volledige natvoeders voor volwassen honden met de hoogste score.",
    tips: [
      "**Volledig of aanvullend?** Veel blikjes zijn aanvullend voer en niet geschikt als enige voeding. In deze lijst staan alleen volledige voeders.",
      "**Reken per dag, niet per blik.** Natvoer bevat per gram veel minder energie dan brokken. Met een [huisdierprofiel](/{lang}/my-pet) zie je hoeveel gram per dag nodig is, en in de [vergelijker](/{lang}/compare) wat dat per dag kost.",
      "**Combineren kan.** Een deel natvoer en een deel droogvoer is prima, zolang je de totale hoeveelheid aanpast.",
    ],
  },
  "small-breed-dog-food": {
    h1: "Het beste voer voor kleine honden",
    title: "Beste hondenvoer voor kleine rassen {year}: top 10",
    description: "Hondenvoer voor kleine rassen met de hoogste onafhankelijke score: de top 10 uit {count} voeders voor kleine en mini-honden.",
    card: "Voer voor kleine en mini-rassen.",
    intro: "Kleine honden hebben per kilo lichaamsgewicht meer energie nodig dan grote honden, en vaak kleinere brokken. Dit zijn de voeders voor kleine rassen met de hoogste Scanabowl-score.",
    tips: [
      "**Kleine porties, grote verschillen.** Een hond van 5 kilo eet ongeveer 100 gram brokken per dag. Tien gram te veel is dan al 10% extra. Weeg de portie af.",
      "**Stem de portie af op je hond.** Een actieve kleine hond heeft meer nodig dan een rustige schoothond. Het [huisdierprofiel](/{lang}/my-pet) rekent dat voor je uit.",
      "**Een “small breed”-voer is geen must.** Belangrijker zijn een goede receptuur en de juiste hoeveelheid. Kleinere brokken zijn vooral handig voor kleine bekjes.",
    ],
  },
  "large-breed-dog-food": {
    h1: "Het beste voer voor grote honden",
    title: "Beste hondenvoer voor grote rassen {year}: top 10",
    description: "Hondenvoer voor grote rassen met de hoogste onafhankelijke score: de top 10 uit {count} voeders voor volwassen honden van grote rassen.",
    card: "Voer voor volwassen honden van grote rassen.",
    intro: "Bij grote honden telt elke kilo extra voor de gewrichten. Dit zijn de voeders voor volwassen honden van grote rassen met de hoogste Scanabowl-score.",
    tips: [
      "**Een slanke hond leeft langer.** In een langlopend onderzoek bij labradors leefden honden die 25% minder voer kregen dan hun nestgenoten gemiddeld bijna twee jaar langer, en kregen ze later last van artrose (Kealy et al., 2002).",
      "**Het label is minder belangrijk dan de portie.** Voer voor grote rassen heeft vaak grotere brokken en iets minder energie per gram, maar de juiste hoeveelheid maakt het verschil.",
      "**Toegevoegde glucosamine en chondroïtine** leveren in onze score alleen een klein pluspunt op. Kies op de hele receptuur.",
    ],
  },
  "senior-dog-food": {
    h1: "Het beste seniorvoer voor honden",
    title: "Beste seniorvoer voor honden {year}: top 10 op score",
    description: "Het seniorvoer voor oudere honden met de hoogste onafhankelijke score: de top 10 uit {count} voeders, gerangschikt op ingrediënten en voedingswaarden.",
    card: "Voer dat bedoeld is voor oudere honden.",
    intro: "Er bestaat geen wettelijke definitie van seniorvoer: het ene bevat minder calorieën, het andere meer eiwit of minder fosfor. Dit zijn de seniorvoeders voor honden met de hoogste score.",
    tips: [
      "**Minder energie, niet minder eiwit.** Oudere honden verliezen makkelijk spiermassa. Een overzichtsartikel adviseert oudere honden voldoende eiwit te blijven geven (Laflamme, 2005). Verminder de portie, niet de kwaliteit.",
      "**Weeg regelmatig.** Een hond die minder beweegt, heeft minder calorieën nodig. Het [huisdierprofiel](/{lang}/my-pet) rekent met de leeftijd van je hond.",
      "**Bij een aandoening beslist de dierenarts.** Voor nier-, lever- of hartproblemen bestaan dieetvoeders die alleen op advies van de dierenarts horen. Die staan daarom niet in deze lijst.",
    ],
  },
  "grain-free-dog-food": {
    h1: "Het beste graanvrije hondenvoer",
    title: "Beste graanvrije hondenvoer {year}: top 10 op score",
    description: "Het graanvrije hondenvoer met de hoogste onafhankelijke score: de top 10 uit {count} graanvrije voeders voor volwassen honden.",
    card: "Voer zonder tarwe, maïs, rijst of andere granen.",
    intro: "Voor de meeste honden zijn granen geen probleem, en graanvrij is geen kwaliteitskeurmerk: we geven er geen punten voor. Verdraagt je hond een graan niet? Dan zijn dit de graanvrije voeders met de hoogste score.",
    tips: [
      "**Let op veel peulvruchten.** De Amerikaanse FDA onderzocht een mogelijk verband tussen graanvrij voer met veel erwten, linzen of aardappel en hartspierziekte (DCM) bij honden. Een oorzaak is niet bewezen, maar voer met een zeer hoog aandeel peulvruchten krijgt bij ons een kleine aftrek.",
      "**Graanvrij is niet koolhydraatvrij.** Granen worden meestal vervangen door aardappel, erwten of tapioca.",
      "**Een tarweallergie?** Stel die in je [huisdierprofiel](/{lang}/my-pet) in. Dan verbergen we elk voer met tarwe, ook als het niet “graanvrij” heet.",
    ],
  },
  "single-protein-dog-food": {
    h1: "Het beste hondenvoer met één eiwitbron",
    title: "Hondenvoer met één dierlijke eiwitbron {year}: top 10",
    description: "Hondenvoer met maar één dierlijke eiwitbron en zonder vage bijproducten, gerangschikt op onafhankelijke score: de top 10 uit {count} voeders.",
    card: "Eén diersoort als eiwitbron, zonder vage “dierlijke bijproducten”.",
    intro: "Bij een (vermoede) voedselallergie wil je precies weten welk dier er in de bak zit. In deze lijst staan alleen voeders met één benoemde dierlijke eiwitbron, zonder vage omschrijvingen zoals “vlees en dierlijke bijproducten”.",
    tips: [
      "**De meest voorkomende voedselallergenen bij honden** zijn rund, zuivel, kip en tarwe (Mueller et al., 2016). Kies een eiwitbron die je hond nog niet eerder heeft gegeten.",
      "**Een allergie stel je vast met een eliminatiedieet:** minstens 8 weken één voer en verder niets, samen met je dierenarts. Na 8 weken is ongeveer 90% van de dieren met een voedselallergie klachtenvrij (Olivry et al., 2015).",
      "**Let ook op de rest van de lijst.** Eén dierlijke eiwitbron zegt niets over granen of andere ingrediënten. Stel allergieën in je [huisdierprofiel](/{lang}/my-pet) in om ook die uit te filteren.",
    ],
  },
};

const en: Texts = {
  "kitten-food": {
    h1: "The best kitten food",
    title: "Best kitten food {year}: the top 10 by independent score",
    description: "Which kitten food scores best? The top 10 of {count} kitten foods, ranked automatically on ingredients and nutrients. No paid placements.",
    card: "Food for growing cats up to about one year.",
    intro: "A kitten grows into an adult cat within a year and needs far more energy and protein per kilo of body weight than an adult cat. These are the kitten foods with the highest Scanabowl score.",
    tips: [
      "**Choose a food made for growth.** The pack says “kitten”, “junior” or “all life stages”. Adult cat food is not made for growth: the FEDIAF guidelines have separate, higher standards for growing animals.",
      "**Feed small meals, often.** A kitten has a small stomach but a high energy need: in the first months about two to two and a half times as much per kilo as an adult cat (FEDIAF).",
      "**Get your kitten used to wet food.** Cats naturally drink little, and wet food provides a lot of water. A cat that gets used to wet food young eats it more readily later.",
      "**Switch to adult food at around 12 months.** Do it gradually, over about a week.",
    ],
  },
  "wet-cat-food": {
    h1: "The best wet cat food",
    title: "Best wet cat food {year}: top 10 by score",
    description: "The wet food for adult cats with the highest independent score: the top 10 of {count} complete wet foods, ranked on ingredients and nutrients.",
    card: "Cans, trays and pouches for adult cats.",
    intro: "Wet food is mostly water, which suits an animal that naturally drinks little. These are the complete wet foods for adult cats with the highest score.",
    tips: [
      "**Check that it is a complete food.** Many pouches and cans are *complementary* food (a snack or topper) and not suitable as the only diet. This list only contains complete foods.",
      "**Moisture matters.** Cats eating high-moisture food take in more water overall and produce more dilute urine (Buckley et al., 2011), which is good for the urinary tract.",
      "**Compare on dry matter.** A wet food with 10% protein and 80% moisture contains 50% protein on a dry-matter basis. We calculate that for every food.",
      "**Count calories.** Wet food has far less energy per gram than dry food. With a [pet profile](/{lang}/my-pet) you see how many grams a day of each food fit.",
    ],
  },
  "dry-cat-food": {
    h1: "The best dry cat food",
    title: "Best dry cat food {year}: top 10 by independent score",
    description: "Which cat kibble scores best? The top 10 of {count} complete dry foods for adult cats, ranked independently on ingredients and nutrients.",
    card: "Kibble for adult cats.",
    intro: "Dry food is convenient and keeps well, but contains little water and a lot of energy per gram. These are the complete dry foods for adult cats with the highest score.",
    tips: [
      "**Compared with other dry food.** Kibble always contains little water and some starch, so we compare dry food only with other dry food, not with wet food. Do make sure your cat drinks enough, or combine with wet food.",
      "**Plenty of animal protein, few carbohydrates.** Cats are obligate carnivores. Check that animal ingredients lead the list, not cereals or plant protein concentrates.",
      "**Weigh the portion.** A handful of kibble is easily too much. A kitchen scale and the portion from your [pet profile](/{lang}/my-pet) help prevent weight gain.",
      "**Always provide fresh water**, ideally in a few places and not right next to the food bowl.",
    ],
  },
  "senior-cat-food": {
    h1: "The best senior cat food",
    title: "Best senior cat food {year}: top 10 by score",
    description: "The senior food for older cats with the highest independent score: the top 10 of {count} foods, ranked on ingredients and nutrients.",
    card: "Food intended for older cats.",
    intro: "“Senior” is not a legal term: senior food must meet the same standards as adult cat food, and what manufacturers do differently varies a lot. These are the senior foods with the highest score.",
    tips: [
      "**Less protein is not automatically better.** Older cats sometimes digest fat and protein less well, and from about 12 years often need *more* energy again (Laflamme, 2005). Don't restrict protein on your own.",
      "**Keep track of weight.** Weigh your cat regularly. Unintended weight loss in an older cat is a reason to see the vet.",
      "**With a medical condition, the vet decides.** For kidney disease or other problems a veterinary diet is often better than ordinary senior food. That is why veterinary diets are not in this list.",
      "**Adult food is fine too.** A healthy older cat does not have to eat senior food.",
    ],
  },
  "sterilised-cat-food": {
    h1: "The best food for neutered cats",
    title: "Best food for neutered cats {year}: top 10",
    description: "Which food for spayed or neutered cats scores best? The top 10 of {count} foods, ranked independently on ingredients and nutrients.",
    card: "Food labelled “sterilised” or “neutered”.",
    intro: "After spaying or neutering, a cat needs less energy while its appetite often increases. These are the foods for neutered cats with the highest Scanabowl score.",
    tips: [
      "**The portion matters more than the label.** The FEDIAF guidelines assume about a quarter less energy for a neutered or indoor cat than for an active cat. Tick “neutered” in your [pet profile](/{lang}/my-pet) and we take it into account.",
      "**“Sterilised” is not a legal term.** Such foods are usually a little less energy-dense, but any complete food works if you feed the right amount.",
      "**Wet food helps.** Wet food has fewer calories per gram and lots of water, so your cat can eat a larger portion for the same energy.",
    ],
  },
  "grain-free-cat-food": {
    h1: "The best grain-free cat food",
    title: "Best grain-free cat food {year}: top 10 by score",
    description: "The grain-free cat food with the highest independent score: the top 10 of {count} grain-free foods for adult cats.",
    card: "Food without wheat, maize, rice or other cereals.",
    intro: "Grain-free is not a quality mark and we give no points for it. But it can be useful if your cat does not tolerate a cereal. These are the grain-free foods with the highest score.",
    tips: [
      "**Grain-free is not the same as low-carb.** Cereals are often replaced by potato, peas or other legumes. Look at the whole ingredient list.",
      "**Cats need few carbohydrates.** Food with plenty of animal protein and little starch scores higher with us, grain-free or not.",
      "**Avoiding a particular cereal?** Set it as an allergy in your [pet profile](/{lang}/my-pet) and we hide every food that contains it.",
    ],
  },
  "single-protein-cat-food": {
    h1: "The best single-protein cat food",
    title: "Cat food with a single animal protein {year}: top 10",
    description: "Cat food with just one animal protein source and no vague by-products, ranked by independent score: the top 10 of {count} foods.",
    card: "One animal species as protein source, no vague “animal derivatives”.",
    intro: "With a (suspected) food allergy you want to know exactly which animal is in the bowl. This list only contains foods with one named animal protein source and no vague terms such as “meat and animal derivatives”.",
    tips: [
      "**The most common food allergens in cats** are beef, fish and chicken (Mueller et al., 2016). Choose a protein your cat has not eaten before.",
      "**An allergy is diagnosed with an elimination diet:** at least 8 weeks of one food and nothing else, together with your vet. After 8 weeks about 90% of animals with a food allergy are free of symptoms (Olivry et al., 2015).",
      "**Always check the pack.** Recipes sometimes change. With a severe allergy your vet may recommend a veterinary diet.",
    ],
  },
  "puppy-food": {
    h1: "The best puppy food",
    title: "Best puppy food {year}: the top 10 by independent score",
    description: "Which puppy food scores best? The top 10 of {count} foods for puppies, ranked automatically on ingredients and nutrients. No paid placements.",
    card: "Food for growing dogs of every size.",
    intro: "A puppy needs more protein, energy and minerals than an adult dog, but not too much either. These are the puppy foods with the highest Scanabowl score. Got a large-breed puppy? See [puppy food for large breeds](/{lang}/best/large-breed-puppy-food).",
    tips: [
      "**Choose a food made for growth.** The pack says “puppy”, “junior” or “all life stages”. The FEDIAF guidelines have higher standards for growth, including for protein, fat and calcium.",
      "**Does it suit your dog's size?** Small and large breeds grow very differently. Many brands have separate versions for small, medium and large breeds.",
      "**Until when?** Small and medium dogs eat puppy food until about 12 months, large breeds until 18 to 24 months.",
      "**Don't add calcium** or other supplements to a complete puppy food unless your vet advises it.",
    ],
  },
  "large-breed-puppy-food": {
    h1: "The best large-breed puppy food",
    title: "Best large-breed puppy food {year}: top 10",
    description: "Large-breed puppy food with the highest independent score, without foods above the FEDIAF calcium maximum: the top 10 of {count} foods.",
    card: "For puppies that will weigh more than about 25 kilos as adults.",
    intro: "Large-breed puppies keep growing for a long time and are sensitive to too much calcium and too-fast growth. This list only contains large-breed puppy foods whose calcium stays within the FEDIAF maximum, as far as the label states it.",
    tips: [
      "**Not too much calcium.** In Great Dane puppies, long-term excess calcium led to abnormalities in the growth plates (Goedegebuure & Hazewinkel, 1986). FEDIAF sets a maximum of 1.8 grams per 100 grams of dry matter for later growth. We leave out foods above it.",
      "**Don't let your puppy grow too fast.** A lean puppy is better than a round one. Weigh regularly and use the portion from your [pet profile](/{lang}/my-pet).",
      "**Never add calcium or bone-meal supplements** to a complete puppy food.",
      "**Puppy food until 18 to 24 months.** Large breeds mature later; only then switch to adult food.",
    ],
  },
  "dry-dog-food": {
    h1: "The best dry dog food",
    title: "Best dry dog food {year}: top 10 by independent score",
    description: "Which dog kibble scores best? The top 10 of {count} complete dry foods for adult dogs, ranked on ingredients and nutrients.",
    card: "Kibble for adult dogs.",
    intro: "Dry food is the most popular choice for dogs, and the differences are large: from recipes full of meat to mostly cereals and plant protein. These are the dry foods for adult dogs with the highest score.",
    tips: [
      "**Look beyond the first ingredient.** Ingredients are listed by weight. “Fresh chicken” at the top is about 70% water, so look at the rest of the list too. We estimate the animal share on a dry-matter basis for you.",
      "**Compare on dry matter and energy.** We convert every food, so you can compare fairly, even with wet food.",
      "**Weigh the portion.** Dry food is energy-dense. A few extra kibbles a day show up on the scale after a few months.",
    ],
  },
  "wet-dog-food": {
    h1: "The best wet dog food",
    title: "Best wet dog food {year}: top 10 by score",
    description: "The wet food for adult dogs with the highest independent score: the top 10 of {count} complete cans, trays and rolls.",
    card: "Cans, trays and rolls for adult dogs.",
    intro: "Wet food is often rich in meat and popular with fussy dogs, but because of all the water you feed larger portions. These are the complete wet foods for adult dogs with the highest score.",
    tips: [
      "**Complete or complementary?** Many cans are complementary food and not suitable as the only diet. This list only contains complete foods.",
      "**Count per day, not per can.** Wet food has far less energy per gram than kibble. With a [pet profile](/{lang}/my-pet) you see how many grams a day are needed, and in the [comparison tool](/{lang}/compare) what that costs per day.",
      "**Mixing is fine.** Part wet and part dry food works, as long as you adjust the total amount.",
    ],
  },
  "small-breed-dog-food": {
    h1: "The best food for small dogs",
    title: "Best small-breed dog food {year}: top 10",
    description: "Small-breed dog food with the highest independent score: the top 10 of {count} foods for small and toy dogs.",
    card: "Food for small and toy breeds.",
    intro: "Small dogs need more energy per kilo of body weight than large dogs, and often smaller kibble. These are the small-breed foods with the highest Scanabowl score.",
    tips: [
      "**Small portions, big differences.** A 5-kilo dog eats about 100 grams of kibble a day. Ten grams too many is already 10% extra. Weigh the portion.",
      "**Match the portion to your dog.** An active small dog needs more than a calm lap dog. The [pet profile](/{lang}/my-pet) works it out for you.",
      "**A “small breed” food is not a must.** A good recipe and the right amount matter more. Smaller kibble is mainly handy for small mouths.",
    ],
  },
  "large-breed-dog-food": {
    h1: "The best food for large dogs",
    title: "Best large-breed dog food {year}: top 10",
    description: "Large-breed dog food with the highest independent score: the top 10 of {count} foods for adult dogs of large breeds.",
    card: "Food for adult dogs of large breeds.",
    intro: "In large dogs every extra kilo counts for the joints. These are the foods for adult large-breed dogs with the highest Scanabowl score.",
    tips: [
      "**A lean dog lives longer.** In a lifelong study of Labradors, dogs fed 25% less than their littermates lived almost two years longer on average and developed osteoarthritis later (Kealy et al., 2002).",
      "**The portion matters more than the label.** Large-breed food often has bigger kibble and slightly less energy per gram, but the right amount makes the difference.",
      "**Added glucosamine and chondroitin** only earn a small bonus in our score. Choose on the whole recipe.",
    ],
  },
  "senior-dog-food": {
    h1: "The best senior dog food",
    title: "Best senior dog food {year}: top 10 by score",
    description: "The senior food for older dogs with the highest independent score: the top 10 of {count} foods, ranked on ingredients and nutrients.",
    card: "Food intended for older dogs.",
    intro: "There is no legal definition of senior food: one has fewer calories, another more protein or less phosphorus. These are the senior dog foods with the highest score.",
    tips: [
      "**Less energy, not less protein.** Older dogs easily lose muscle. A review recommends that older dogs keep getting enough protein (Laflamme, 2005). Reduce the portion, not the quality.",
      "**Weigh regularly.** A dog that moves less needs fewer calories. The [pet profile](/{lang}/my-pet) takes your dog's age into account.",
      "**With a medical condition, the vet decides.** For kidney, liver or heart problems there are veterinary diets that should only be fed on a vet's advice. That is why they are not in this list.",
    ],
  },
  "grain-free-dog-food": {
    h1: "The best grain-free dog food",
    title: "Best grain-free dog food {year}: top 10 by score",
    description: "The grain-free dog food with the highest independent score: the top 10 of {count} grain-free foods for adult dogs.",
    card: "Food without wheat, maize, rice or other cereals.",
    intro: "For most dogs cereals are not a problem, and grain-free is not a quality mark: we give no points for it. Does your dog not tolerate a cereal? Then these are the grain-free foods with the highest score.",
    tips: [
      "**Watch out for lots of legumes.** The US FDA investigated a possible link between grain-free food rich in peas, lentils or potato and heart muscle disease (DCM) in dogs. No cause has been proven, but food with a very high legume share gets a small deduction from us.",
      "**Grain-free is not carb-free.** Cereals are usually replaced by potato, peas or tapioca.",
      "**A wheat allergy?** Set it in your [pet profile](/{lang}/my-pet) and we hide every food with wheat, even if it is not called “grain-free”.",
    ],
  },
  "single-protein-dog-food": {
    h1: "The best single-protein dog food",
    title: "Dog food with a single animal protein {year}: top 10",
    description: "Dog food with just one animal protein source and no vague by-products, ranked by independent score: the top 10 of {count} foods.",
    card: "One animal species as protein source, no vague “animal derivatives”.",
    intro: "With a (suspected) food allergy you want to know exactly which animal is in the bowl. This list only contains foods with one named animal protein source and no vague terms such as “meat and animal derivatives”.",
    tips: [
      "**The most common food allergens in dogs** are beef, dairy, chicken and wheat (Mueller et al., 2016). Choose a protein your dog has not eaten before.",
      "**An allergy is diagnosed with an elimination diet:** at least 8 weeks of one food and nothing else, together with your vet. After 8 weeks about 90% of animals with a food allergy are free of symptoms (Olivry et al., 2015).",
      "**Check the rest of the list too.** One animal protein says nothing about cereals or other ingredients. Set allergies in your [pet profile](/{lang}/my-pet) to filter those out as well.",
    ],
  },
};

const de: Texts = {
  "kitten-food": {
    h1: "Das beste Kittenfutter",
    title: "Bestes Kittenfutter {year}: die Top 10 nach unabhängiger Bewertung",
    description: "Welches Kittenfutter schneidet am besten ab? Die Top 10 aus {count} Kittenfuttern, automatisch nach Zutaten und Nährwerten gereiht. Keine bezahlten Plätze.",
    card: "Futter für wachsende Katzen bis etwa ein Jahr.",
    intro: "Ein Kitten wächst innerhalb eines Jahres zur erwachsenen Katze heran und braucht pro Kilo Körpergewicht viel mehr Energie und Eiweiß als eine erwachsene Katze. Das sind die Kittenfutter mit der höchsten Scanabowl-Bewertung.",
    tips: [
      "**Wählen Sie Futter für das Wachstum.** Auf der Packung steht „Kitten“, „Junior“ oder „alle Lebensphasen“. Futter für erwachsene Katzen ist nicht für das Wachstum gemacht: Die FEDIAF-Richtlinien haben eigene, höhere Werte für wachsende Tiere.",
      "**Kleine Portionen, oft.** Ein Kitten hat einen kleinen Magen, aber einen hohen Energiebedarf: in den ersten Monaten etwa zwei- bis zweieinhalbmal so viel pro Kilo wie eine erwachsene Katze (FEDIAF).",
      "**Gewöhnen Sie Ihr Kitten an Nassfutter.** Katzen trinken von Natur aus wenig, und Nassfutter liefert viel Flüssigkeit. Wer jung Nassfutter kennenlernt, frisst es später leichter.",
      "**Mit etwa 12 Monaten wechseln** Sie auf Futter für erwachsene Katzen, schrittweise über etwa eine Woche.",
    ],
  },
  "wet-cat-food": {
    h1: "Das beste Nassfutter für Katzen",
    title: "Bestes Katzen-Nassfutter {year}: Top 10 nach Bewertung",
    description: "Das Nassfutter für erwachsene Katzen mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} Alleinfuttern, gereiht nach Zutaten und Nährwerten.",
    card: "Dosen, Schälchen und Beutel für erwachsene Katzen.",
    intro: "Nassfutter besteht größtenteils aus Wasser, und das passt zu einem Tier, das von Natur aus wenig trinkt. Das sind die Nass-Alleinfutter für erwachsene Katzen mit der höchsten Bewertung.",
    tips: [
      "**Prüfen Sie, ob es ein Alleinfutter ist.** Viele Beutel und Dosen sind *Ergänzungsfutter* (Snack oder Topping) und nicht als einzige Nahrung geeignet. In dieser Liste stehen nur Alleinfutter.",
      "**Feuchtigkeit zählt.** Katzen, die feuchtes Futter fressen, nehmen insgesamt mehr Wasser auf und bilden verdünnteren Urin (Buckley et al., 2011). Das ist gut für die Harnwege.",
      "**Vergleichen Sie auf Trockenmasse.** Nassfutter mit 10 % Eiweiß und 80 % Feuchtigkeit enthält in der Trockenmasse 50 % Eiweiß. Das rechnen wir für jedes Futter aus.",
      "**Rechnen Sie mit Kalorien.** Nassfutter hat pro Gramm viel weniger Energie als Trockenfutter. Mit einem [Tierprofil](/{lang}/my-pet) sehen Sie für jedes Futter die passende Tagesmenge.",
    ],
  },
  "dry-cat-food": {
    h1: "Das beste Trockenfutter für Katzen",
    title: "Bestes Katzen-Trockenfutter {year}: Top 10 nach unabhängiger Bewertung",
    description: "Welches Katzen-Trockenfutter schneidet am besten ab? Die Top 10 aus {count} Alleinfuttern für erwachsene Katzen, unabhängig nach Zutaten und Nährwerten gereiht.",
    card: "Trockenfutter für erwachsene Katzen.",
    intro: "Trockenfutter ist praktisch und lange haltbar, enthält aber wenig Wasser und viel Energie pro Gramm. Das sind die Trocken-Alleinfutter für erwachsene Katzen mit der höchsten Bewertung.",
    tips: [
      "**Verglichen mit anderem Trockenfutter.** Trockenfutter enthält immer wenig Wasser und etwas Stärke. Deshalb vergleichen wir es nur mit anderem Trockenfutter, nicht mit Nassfutter. Achten Sie darauf, dass Ihre Katze genug trinkt, oder kombinieren Sie es mit Nassfutter.",
      "**Viel tierisches Eiweiß, wenig Kohlenhydrate.** Katzen sind strikte Fleischfresser. Achten Sie darauf, dass tierische Zutaten oben stehen und nicht Getreide oder pflanzliche Eiweißkonzentrate.",
      "**Wiegen Sie die Portion ab.** Eine Handvoll ist schnell zu viel. Eine Küchenwaage und die Portion aus Ihrem [Tierprofil](/{lang}/my-pet) helfen gegen Übergewicht.",
      "**Stellen Sie immer frisches Wasser bereit**, am besten an mehreren Stellen und nicht direkt neben dem Futternapf.",
    ],
  },
  "senior-cat-food": {
    h1: "Das beste Seniorfutter für Katzen",
    title: "Bestes Seniorfutter für Katzen {year}: Top 10 nach Bewertung",
    description: "Das Seniorfutter für ältere Katzen mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} Futtern, gereiht nach Zutaten und Nährwerten.",
    card: "Futter für ältere Katzen.",
    intro: "„Senior“ ist kein rechtlicher Begriff: Seniorfutter muss dieselben Werte erfüllen wie Futter für erwachsene Katzen, und was Hersteller anders machen, ist sehr unterschiedlich. Das sind die Seniorfutter mit der höchsten Bewertung.",
    tips: [
      "**Weniger Eiweiß ist nicht automatisch besser.** Ältere Katzen verdauen Fett und Eiweiß manchmal schlechter und brauchen ab etwa 12 Jahren oft wieder *mehr* Energie (Laflamme, 2005). Schränken Sie Eiweiß nicht auf eigene Faust ein.",
      "**Behalten Sie das Gewicht im Blick.** Wiegen Sie Ihre Katze regelmäßig. Ungewollter Gewichtsverlust bei einer älteren Katze ist ein Grund für den Tierarzt.",
      "**Bei einer Erkrankung entscheidet der Tierarzt.** Bei Nierenerkrankung oder anderen Problemen ist eine Tierarzt-Diät oft besser als normales Seniorfutter. Diätfutter steht deshalb nicht in dieser Liste.",
      "**Futter für Erwachsene geht auch.** Eine gesunde ältere Katze muss nicht unbedingt Seniorfutter fressen.",
    ],
  },
  "sterilised-cat-food": {
    h1: "Das beste Futter für kastrierte Katzen",
    title: "Bestes Futter für kastrierte Katzen {year}: Top 10",
    description: "Welches Futter für kastrierte Katzen schneidet am besten ab? Die Top 10 aus {count} Futtern, unabhängig nach Zutaten und Nährwerten gereiht.",
    card: "Futter mit „sterilised“ oder „kastriert“ auf der Packung.",
    intro: "Nach der Kastration braucht eine Katze weniger Energie, während der Appetit oft zunimmt. Das sind die Futter für kastrierte Katzen mit der höchsten Scanabowl-Bewertung.",
    tips: [
      "**Die Portion ist wichtiger als das Etikett.** Die FEDIAF-Richtlinien rechnen für eine kastrierte oder Wohnungskatze mit etwa einem Viertel weniger Energie als für eine aktive Katze. Kreuzen Sie im [Tierprofil](/{lang}/my-pet) „kastriert“ an, dann rechnen wir damit.",
      "**„Sterilised“ ist kein rechtlicher Begriff.** Solche Futter sind meist etwas weniger energiereich, aber jedes Alleinfutter funktioniert in der richtigen Menge.",
      "**Nassfutter hilft.** Nassfutter hat pro Gramm weniger Kalorien und viel Wasser, Ihre Katze darf also eine größere Portion für dieselbe Energie fressen.",
    ],
  },
  "grain-free-cat-food": {
    h1: "Das beste getreidefreie Katzenfutter",
    title: "Bestes getreidefreies Katzenfutter {year}: Top 10 nach Bewertung",
    description: "Das getreidefreie Katzenfutter mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} getreidefreien Futtern für erwachsene Katzen.",
    card: "Futter ohne Weizen, Mais, Reis oder anderes Getreide.",
    intro: "Getreidefrei ist kein Qualitätssiegel, und wir vergeben dafür keine Punkte. Es kann aber sinnvoll sein, wenn Ihre Katze ein Getreide nicht verträgt. Das sind die getreidefreien Futter mit der höchsten Bewertung.",
    tips: [
      "**Getreidefrei heißt nicht kohlenhydratarm.** Getreide wird oft durch Kartoffel, Erbsen oder andere Hülsenfrüchte ersetzt. Schauen Sie auf die ganze Zutatenliste.",
      "**Katzen brauchen wenig Kohlenhydrate.** Futter mit viel tierischem Eiweiß und wenig Stärke schneidet bei uns besser ab, ob getreidefrei oder nicht.",
      "**Meiden Sie ein bestimmtes Getreide?** Tragen Sie es im [Tierprofil](/{lang}/my-pet) als Allergie ein. Dann blenden wir jedes Futter aus, das es enthält.",
    ],
  },
  "single-protein-cat-food": {
    h1: "Das beste Katzenfutter mit einer Eiweißquelle",
    title: "Katzenfutter mit einer tierischen Eiweißquelle {year}: Top 10",
    description: "Katzenfutter mit nur einer tierischen Eiweißquelle und ohne vage Nebenerzeugnisse, nach unabhängiger Bewertung gereiht: die Top 10 aus {count} Futtern.",
    card: "Eine Tierart als Eiweißquelle, ohne vage „tierische Nebenerzeugnisse“.",
    intro: "Bei einer (vermuteten) Futterallergie möchten Sie genau wissen, welches Tier im Napf ist. In dieser Liste stehen nur Futter mit einer benannten tierischen Eiweißquelle, ohne vage Angaben wie „Fleisch und tierische Nebenerzeugnisse“.",
    tips: [
      "**Die häufigsten Futterallergene bei Katzen** sind Rind, Fisch und Huhn (Mueller et al., 2016). Wählen Sie eine Eiweißquelle, die Ihre Katze noch nicht gefressen hat.",
      "**Eine Allergie stellt man mit einer Ausschlussdiät fest:** mindestens 8 Wochen ein Futter und sonst nichts, zusammen mit Ihrem Tierarzt. Nach 8 Wochen sind etwa 90 % der Tiere mit Futterallergie beschwerdefrei (Olivry et al., 2015).",
      "**Prüfen Sie immer die Packung.** Rezepturen ändern sich manchmal. Bei einer schweren Allergie empfiehlt Ihr Tierarzt eventuell ein Diätfutter.",
    ],
  },
  "puppy-food": {
    h1: "Das beste Welpenfutter",
    title: "Bestes Welpenfutter {year}: die Top 10 nach unabhängiger Bewertung",
    description: "Welches Welpenfutter schneidet am besten ab? Die Top 10 aus {count} Futtern für Welpen, automatisch nach Zutaten und Nährwerten gereiht. Keine bezahlten Plätze.",
    card: "Futter für wachsende Hunde jeder Größe.",
    intro: "Ein Welpe braucht mehr Eiweiß, Energie und Mineralstoffe als ein erwachsener Hund, aber auch nicht zu viel. Das sind die Welpenfutter mit der höchsten Scanabowl-Bewertung. Haben Sie einen Welpen einer großen Rasse? Dann sehen Sie sich [Welpenfutter für große Rassen](/{lang}/best/large-breed-puppy-food) an.",
    tips: [
      "**Wählen Sie Futter für das Wachstum.** Auf der Packung steht „Puppy“, „Junior“ oder „alle Lebensphasen“. Die FEDIAF-Richtlinien haben für das Wachstum höhere Werte, unter anderem für Eiweiß, Fett und Kalzium.",
      "**Passt es zur Größe Ihres Hundes?** Kleine und große Rassen wachsen sehr unterschiedlich. Viele Marken haben eigene Varianten für kleine, mittlere und große Rassen.",
      "**Bis wann?** Kleine und mittlere Hunde fressen Welpenfutter bis etwa 12 Monate, große Rassen bis 18 bis 24 Monate.",
      "**Geben Sie kein zusätzliches Kalzium** oder andere Ergänzungen zu einem Welpen-Alleinfutter, außer Ihr Tierarzt rät dazu.",
    ],
  },
  "large-breed-puppy-food": {
    h1: "Das beste Welpenfutter für große Rassen",
    title: "Bestes Welpenfutter für große Rassen {year}: Top 10",
    description: "Welpenfutter für große Rassen mit der höchsten unabhängigen Bewertung, ohne Futter über dem FEDIAF-Kalziummaximum: die Top 10 aus {count} Futtern.",
    card: "Für Welpen, die ausgewachsen mehr als etwa 25 Kilo wiegen.",
    intro: "Welpen großer Rassen wachsen lange und reagieren empfindlich auf zu viel Kalzium und zu schnelles Wachstum. In dieser Liste stehen nur Welpenfutter für große Rassen, deren Kalziumgehalt innerhalb des FEDIAF-Maximums bleibt, soweit er auf dem Etikett steht.",
    tips: [
      "**Nicht zu viel Kalzium.** Bei Welpen der Deutschen Dogge führte dauerhaft zu viel Kalzium zu Veränderungen in den Wachstumsfugen (Goedegebuure & Hazewinkel, 1986). FEDIAF nennt für die spätere Wachstumsphase ein Maximum von 1,8 Gramm pro 100 Gramm Trockenmasse. Futter darüber lassen wir hier weg.",
      "**Lassen Sie Ihren Welpen nicht zu schnell wachsen.** Ein schlanker Welpe ist besser als ein runder. Wiegen Sie regelmäßig und nutzen Sie die Portion aus Ihrem [Tierprofil](/{lang}/my-pet).",
      "**Geben Sie nie zusätzliches Kalzium oder Kalkpräparate** zu einem Welpen-Alleinfutter.",
      "**Welpenfutter bis 18 bis 24 Monate.** Große Rassen sind später ausgewachsen; erst dann auf Futter für Erwachsene umstellen.",
    ],
  },
  "dry-dog-food": {
    h1: "Das beste Trockenfutter für Hunde",
    title: "Bestes Hunde-Trockenfutter {year}: Top 10 nach unabhängiger Bewertung",
    description: "Welches Hunde-Trockenfutter schneidet am besten ab? Die Top 10 aus {count} Alleinfuttern für erwachsene Hunde, gereiht nach Zutaten und Nährwerten.",
    card: "Trockenfutter für erwachsene Hunde.",
    intro: "Trockenfutter ist die beliebteste Hundenahrung, und die Unterschiede sind groß: von Rezepturen voller Fleisch bis zu vor allem Getreide und pflanzlichem Eiweiß. Das sind die Trockenfutter für erwachsene Hunde mit der höchsten Bewertung.",
    tips: [
      "**Schauen Sie über die erste Zutat hinaus.** Zutaten stehen nach Gewicht sortiert. „Frisches Huhn“ ganz oben besteht zu etwa 70 % aus Wasser, schauen Sie also auch auf den Rest der Liste. Wir schätzen den tierischen Anteil für Sie auf Trockenmasse.",
      "**Vergleichen Sie auf Trockenmasse und Energie.** Wir rechnen jedes Futter um, damit Sie fair vergleichen können, auch mit Nassfutter.",
      "**Wiegen Sie die Portion ab.** Trockenfutter ist energiereich. Ein paar Brocken zu viel am Tag sieht man nach einigen Monaten auf der Waage.",
    ],
  },
  "wet-dog-food": {
    h1: "Das beste Nassfutter für Hunde",
    title: "Bestes Hunde-Nassfutter {year}: Top 10 nach Bewertung",
    description: "Das Nassfutter für erwachsene Hunde mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} Dosen, Schalen und Würsten als Alleinfutter.",
    card: "Dosen, Schalen und Würste für erwachsene Hunde.",
    intro: "Nassfutter ist oft fleischreich und kommt bei wählerischen Hunden gut an, aber wegen des vielen Wassers füttern Sie größere Portionen. Das sind die Nass-Alleinfutter für erwachsene Hunde mit der höchsten Bewertung.",
    tips: [
      "**Allein- oder Ergänzungsfutter?** Viele Dosen sind Ergänzungsfutter und nicht als einzige Nahrung geeignet. In dieser Liste stehen nur Alleinfutter.",
      "**Rechnen Sie pro Tag, nicht pro Dose.** Nassfutter hat pro Gramm viel weniger Energie als Trockenfutter. Mit einem [Tierprofil](/{lang}/my-pet) sehen Sie die nötige Tagesmenge und im [Vergleich](/{lang}/compare), was das pro Tag kostet.",
      "**Kombinieren geht.** Teils Nass-, teils Trockenfutter ist in Ordnung, solange Sie die Gesamtmenge anpassen.",
    ],
  },
  "small-breed-dog-food": {
    h1: "Das beste Futter für kleine Hunde",
    title: "Bestes Hundefutter für kleine Rassen {year}: Top 10",
    description: "Hundefutter für kleine Rassen mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} Futtern für kleine Hunde und Zwergrassen.",
    card: "Futter für kleine Rassen und Zwergrassen.",
    intro: "Kleine Hunde brauchen pro Kilo Körpergewicht mehr Energie als große, und oft kleinere Brocken. Das sind die Futter für kleine Rassen mit der höchsten Scanabowl-Bewertung.",
    tips: [
      "**Kleine Portionen, große Unterschiede.** Ein 5-Kilo-Hund frisst etwa 100 Gramm Trockenfutter am Tag. Zehn Gramm zu viel sind schon 10 % extra. Wiegen Sie die Portion ab.",
      "**Passen Sie die Portion an Ihren Hund an.** Ein aktiver kleiner Hund braucht mehr als ein ruhiger Schoßhund. Das [Tierprofil](/{lang}/my-pet) rechnet es für Sie aus.",
      "**Ein „Small Breed“-Futter ist kein Muss.** Wichtiger sind eine gute Rezeptur und die richtige Menge. Kleinere Brocken sind vor allem für kleine Mäuler praktisch.",
    ],
  },
  "large-breed-dog-food": {
    h1: "Das beste Futter für große Hunde",
    title: "Bestes Hundefutter für große Rassen {year}: Top 10",
    description: "Hundefutter für große Rassen mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} Futtern für erwachsene Hunde großer Rassen.",
    card: "Futter für erwachsene Hunde großer Rassen.",
    intro: "Bei großen Hunden zählt jedes zusätzliche Kilo für die Gelenke. Das sind die Futter für erwachsene Hunde großer Rassen mit der höchsten Scanabowl-Bewertung.",
    tips: [
      "**Ein schlanker Hund lebt länger.** In einer lebenslangen Studie an Labradoren lebten Hunde, die 25 % weniger Futter bekamen als ihre Wurfgeschwister, im Mittel fast zwei Jahre länger und bekamen später Arthrose (Kealy et al., 2002).",
      "**Die Portion ist wichtiger als das Etikett.** Futter für große Rassen hat oft größere Brocken und etwas weniger Energie pro Gramm, aber die richtige Menge macht den Unterschied.",
      "**Zugesetztes Glucosamin und Chondroitin** bringen in unserer Bewertung nur einen kleinen Pluspunkt. Wählen Sie nach der ganzen Rezeptur.",
    ],
  },
  "senior-dog-food": {
    h1: "Das beste Seniorfutter für Hunde",
    title: "Bestes Seniorfutter für Hunde {year}: Top 10 nach Bewertung",
    description: "Das Seniorfutter für ältere Hunde mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} Futtern, gereiht nach Zutaten und Nährwerten.",
    card: "Futter für ältere Hunde.",
    intro: "Es gibt keine rechtliche Definition von Seniorfutter: Das eine hat weniger Kalorien, das andere mehr Eiweiß oder weniger Phosphor. Das sind die Seniorfutter für Hunde mit der höchsten Bewertung.",
    tips: [
      "**Weniger Energie, nicht weniger Eiweiß.** Ältere Hunde verlieren leicht Muskelmasse. Ein Übersichtsartikel empfiehlt, älteren Hunden weiterhin genug Eiweiß zu geben (Laflamme, 2005). Verringern Sie die Portion, nicht die Qualität.",
      "**Wiegen Sie regelmäßig.** Ein Hund, der sich weniger bewegt, braucht weniger Kalorien. Das [Tierprofil](/{lang}/my-pet) berücksichtigt das Alter Ihres Hundes.",
      "**Bei einer Erkrankung entscheidet der Tierarzt.** Für Nieren-, Leber- oder Herzprobleme gibt es Diätfutter, die nur auf tierärztlichen Rat gefüttert werden sollten. Sie stehen deshalb nicht in dieser Liste.",
    ],
  },
  "grain-free-dog-food": {
    h1: "Das beste getreidefreie Hundefutter",
    title: "Bestes getreidefreies Hundefutter {year}: Top 10 nach Bewertung",
    description: "Das getreidefreie Hundefutter mit der höchsten unabhängigen Bewertung: die Top 10 aus {count} getreidefreien Futtern für erwachsene Hunde.",
    card: "Futter ohne Weizen, Mais, Reis oder anderes Getreide.",
    intro: "Für die meisten Hunde ist Getreide kein Problem, und getreidefrei ist kein Qualitätssiegel: Wir vergeben dafür keine Punkte. Verträgt Ihr Hund ein Getreide nicht? Dann sind das die getreidefreien Futter mit der höchsten Bewertung.",
    tips: [
      "**Achten Sie auf viele Hülsenfrüchte.** Die US-Behörde FDA untersuchte einen möglichen Zusammenhang zwischen getreidefreiem Futter mit viel Erbsen, Linsen oder Kartoffel und einer Herzmuskelerkrankung (DCM) bei Hunden. Eine Ursache ist nicht bewiesen, aber Futter mit sehr hohem Hülsenfruchtanteil bekommt bei uns einen kleinen Abzug.",
      "**Getreidefrei ist nicht kohlenhydratfrei.** Getreide wird meist durch Kartoffel, Erbsen oder Tapioka ersetzt.",
      "**Eine Weizenallergie?** Tragen Sie sie im [Tierprofil](/{lang}/my-pet) ein. Dann blenden wir jedes Futter mit Weizen aus, auch wenn es nicht „getreidefrei“ heißt.",
    ],
  },
  "single-protein-dog-food": {
    h1: "Das beste Hundefutter mit einer Eiweißquelle",
    title: "Hundefutter mit einer tierischen Eiweißquelle {year}: Top 10",
    description: "Hundefutter mit nur einer tierischen Eiweißquelle und ohne vage Nebenerzeugnisse, nach unabhängiger Bewertung gereiht: die Top 10 aus {count} Futtern.",
    card: "Eine Tierart als Eiweißquelle, ohne vage „tierische Nebenerzeugnisse“.",
    intro: "Bei einer (vermuteten) Futterallergie möchten Sie genau wissen, welches Tier im Napf ist. In dieser Liste stehen nur Futter mit einer benannten tierischen Eiweißquelle, ohne vage Angaben wie „Fleisch und tierische Nebenerzeugnisse“.",
    tips: [
      "**Die häufigsten Futterallergene bei Hunden** sind Rind, Milchprodukte, Huhn und Weizen (Mueller et al., 2016). Wählen Sie eine Eiweißquelle, die Ihr Hund noch nicht gefressen hat.",
      "**Eine Allergie stellt man mit einer Ausschlussdiät fest:** mindestens 8 Wochen ein Futter und sonst nichts, zusammen mit Ihrem Tierarzt. Nach 8 Wochen sind etwa 90 % der Tiere mit Futterallergie beschwerdefrei (Olivry et al., 2015).",
      "**Achten Sie auch auf den Rest der Liste.** Eine tierische Eiweißquelle sagt nichts über Getreide oder andere Zutaten. Tragen Sie Allergien im [Tierprofil](/{lang}/my-pet) ein, um auch diese auszufiltern.",
    ],
  },
};

const fr: Texts = {
  "kitten-food": {
    h1: "La meilleure nourriture pour chaton",
    title: "Meilleure nourriture pour chaton {year} : le top 10 selon un score indépendant",
    description: "Quelle nourriture pour chaton obtient le meilleur score ? Le top 10 parmi {count} aliments pour chatons, classés automatiquement selon les ingrédients et les valeurs nutritionnelles. Aucune place payante.",
    card: "Nourriture pour chats en croissance jusqu'à environ un an.",
    intro: "Un chaton devient un chat adulte en un an et a besoin, par kilo de poids, de beaucoup plus d'énergie et de protéines qu'un chat adulte. Voici les aliments pour chatons ayant le meilleur score Scanabowl.",
    tips: [
      "**Choisissez un aliment pour la croissance.** L'emballage indique « kitten », « junior » ou « tous âges ». La nourriture pour chats adultes n'est pas faite pour la croissance : les recommandations FEDIAF prévoient des normes distinctes et plus élevées pour les animaux en croissance.",
      "**Donnez de petites portions, souvent.** Un chaton a un petit estomac mais un grand besoin d'énergie : les premiers mois, environ deux à deux fois et demie plus par kilo qu'un chat adulte (FEDIAF).",
      "**Habituez votre chaton à la nourriture humide.** Les chats boivent naturellement peu et la nourriture humide apporte beaucoup d'eau. Un chat habitué jeune la mange plus facilement plus tard.",
      "**Vers 12 mois, passez** à une nourriture pour chats adultes, progressivement, sur environ une semaine.",
    ],
  },
  "wet-cat-food": {
    h1: "La meilleure pâtée pour chat",
    title: "Meilleure pâtée pour chat {year} : top 10 selon le score",
    description: "La nourriture humide pour chats adultes au meilleur score indépendant : le top 10 parmi {count} aliments humides complets, classés selon les ingrédients et les valeurs nutritionnelles.",
    card: "Boîtes, barquettes et sachets pour chats adultes.",
    intro: "La nourriture humide est composée en grande partie d'eau, ce qui convient à un animal qui boit naturellement peu. Voici les aliments humides complets pour chats adultes ayant le meilleur score.",
    tips: [
      "**Vérifiez qu'il s'agit d'un aliment complet.** Beaucoup de sachets et de boîtes sont des aliments *complémentaires* (friandise ou topping) et ne conviennent pas comme seule alimentation. Cette liste ne contient que des aliments complets.",
      "**L'humidité compte.** Les chats qui mangent une nourriture riche en eau en absorbent davantage au total et produisent une urine plus diluée (Buckley et al., 2011), ce qui est bon pour les voies urinaires.",
      "**Comparez sur la matière sèche.** Une pâtée à 10 % de protéines et 80 % d'humidité contient 50 % de protéines sur matière sèche. Nous faisons ce calcul pour chaque aliment.",
      "**Comptez les calories.** La nourriture humide contient beaucoup moins d'énergie par gramme que les croquettes. Avec un [profil d'animal](/{lang}/my-pet), vous voyez combien de grammes par jour conviennent pour chaque aliment.",
    ],
  },
  "dry-cat-food": {
    h1: "Les meilleures croquettes pour chat",
    title: "Meilleures croquettes pour chat {year} : top 10 selon un score indépendant",
    description: "Quelles croquettes pour chat obtiennent le meilleur score ? Le top 10 parmi {count} aliments secs complets pour chats adultes, classés de façon indépendante.",
    card: "Croquettes pour chats adultes.",
    intro: "Les croquettes sont pratiques et se conservent longtemps, mais contiennent peu d'eau et beaucoup d'énergie par gramme. Voici les aliments secs complets pour chats adultes ayant le meilleur score.",
    tips: [
      "**Comparées à d'autres croquettes.** Les croquettes contiennent toujours peu d'eau et un peu d'amidon : nous les comparons donc uniquement à d'autres croquettes, pas à la pâtée. Veillez à ce que votre chat boive assez, ou combinez avec de la pâtée.",
      "**Beaucoup de protéines animales, peu de glucides.** Les chats sont des carnivores stricts. Vérifiez que les ingrédients animaux sont en tête de liste, pas les céréales ou les concentrés de protéines végétales.",
      "**Pesez la portion.** Une poignée de croquettes, c'est vite trop. Une balance de cuisine et la portion de votre [profil d'animal](/{lang}/my-pet) aident à éviter le surpoids.",
      "**Laissez toujours de l'eau fraîche**, idéalement à plusieurs endroits et pas juste à côté de la gamelle.",
    ],
  },
  "senior-cat-food": {
    h1: "La meilleure nourriture pour chat senior",
    title: "Meilleure nourriture pour chat senior {year} : top 10 selon le score",
    description: "La nourriture senior pour chats âgés au meilleur score indépendant : le top 10 parmi {count} aliments, classés selon les ingrédients et les valeurs nutritionnelles.",
    card: "Nourriture destinée aux chats âgés.",
    intro: "« Senior » n'est pas une notion légale : un aliment senior doit respecter les mêmes normes qu'un aliment pour chats adultes, et ce que les fabricants changent varie beaucoup. Voici les aliments senior ayant le meilleur score.",
    tips: [
      "**Moins de protéines n'est pas automatiquement mieux.** Les chats âgés digèrent parfois moins bien les graisses et les protéines et, vers 12 ans, ont souvent de nouveau besoin de *plus* d'énergie (Laflamme, 2005). Ne réduisez pas les protéines de vous-même.",
      "**Surveillez le poids.** Pesez votre chat régulièrement. Une perte de poids involontaire chez un chat âgé justifie une visite chez le vétérinaire.",
      "**En cas de maladie, le vétérinaire décide.** Pour une maladie rénale ou d'autres problèmes, un aliment diététique vétérinaire est souvent préférable à un aliment senior ordinaire. C'est pourquoi les aliments diététiques ne figurent pas dans cette liste.",
      "**Un aliment adulte convient aussi.** Un chat âgé en bonne santé ne doit pas forcément manger un aliment senior.",
    ],
  },
  "sterilised-cat-food": {
    h1: "La meilleure nourriture pour chat stérilisé",
    title: "Meilleure nourriture pour chat stérilisé {year} : top 10",
    description: "Quelle nourriture pour chats stérilisés ou castrés obtient le meilleur score ? Le top 10 parmi {count} aliments, classés de façon indépendante.",
    card: "Nourriture portant la mention « sterilised » ou « stérilisé ».",
    intro: "Après la stérilisation ou la castration, un chat a besoin de moins d'énergie alors que son appétit augmente souvent. Voici les aliments pour chats stérilisés ayant le meilleur score Scanabowl.",
    tips: [
      "**La portion compte plus que l'étiquette.** Les recommandations FEDIAF prévoient environ un quart d'énergie en moins pour un chat stérilisé ou d'intérieur que pour un chat actif. Cochez « stérilisé » dans votre [profil d'animal](/{lang}/my-pet) et nous en tenons compte.",
      "**« Sterilised » n'est pas une notion légale.** Ces aliments sont en général un peu moins énergétiques, mais tout aliment complet convient si vous donnez la bonne quantité.",
      "**La nourriture humide aide.** Elle contient moins de calories par gramme et beaucoup d'eau : votre chat peut manger une plus grande portion pour la même énergie.",
    ],
  },
  "grain-free-cat-food": {
    h1: "La meilleure nourriture sans céréales pour chat",
    title: "Meilleure nourriture sans céréales pour chat {year} : top 10",
    description: "La nourriture sans céréales pour chat au meilleur score indépendant : le top 10 parmi {count} aliments sans céréales pour chats adultes.",
    card: "Nourriture sans blé, maïs, riz ni autres céréales.",
    intro: "Sans céréales n'est pas un label de qualité et nous ne donnons pas de points pour cela. Mais cela peut être utile si votre chat ne tolère pas une céréale. Voici les aliments sans céréales ayant le meilleur score.",
    tips: [
      "**Sans céréales ne veut pas dire pauvre en glucides.** Les céréales sont souvent remplacées par de la pomme de terre, des pois ou d'autres légumineuses. Regardez toute la liste d'ingrédients.",
      "**Les chats ont besoin de peu de glucides.** Un aliment riche en protéines animales et pauvre en amidon obtient un meilleur score chez nous, avec ou sans céréales.",
      "**Vous évitez une céréale précise ?** Indiquez-la comme allergie dans votre [profil d'animal](/{lang}/my-pet) : nous masquons alors tout aliment qui en contient.",
    ],
  },
  "single-protein-cat-food": {
    h1: "La meilleure nourriture pour chat à une seule protéine",
    title: "Nourriture pour chat à une seule protéine animale {year} : top 10",
    description: "Nourriture pour chat avec une seule source de protéines animales et sans sous-produits vagues, classée selon un score indépendant : le top 10 parmi {count} aliments.",
    card: "Une seule espèce animale comme source de protéines, sans « sous-produits animaux » vagues.",
    intro: "En cas d'allergie alimentaire (suspectée), vous voulez savoir exactement quel animal se trouve dans la gamelle. Cette liste ne contient que des aliments avec une seule source de protéines animales nommée, sans termes vagues comme « viandes et sous-produits animaux ».",
    tips: [
      "**Les allergènes alimentaires les plus fréquents chez le chat** sont le bœuf, le poisson et le poulet (Mueller et al., 2016). Choisissez une protéine que votre chat n'a jamais mangée.",
      "**Une allergie se diagnostique par un régime d'éviction :** au moins 8 semaines d'un seul aliment et rien d'autre, avec votre vétérinaire. Après 8 semaines, environ 90 % des animaux allergiques n'ont plus de symptômes (Olivry et al., 2015).",
      "**Vérifiez toujours l'emballage.** Les recettes changent parfois. En cas d'allergie sévère, votre vétérinaire peut conseiller un aliment diététique.",
    ],
  },
  "puppy-food": {
    h1: "La meilleure nourriture pour chiot",
    title: "Meilleure nourriture pour chiot {year} : le top 10 selon un score indépendant",
    description: "Quelle nourriture pour chiot obtient le meilleur score ? Le top 10 parmi {count} aliments pour chiots, classés automatiquement selon les ingrédients et les valeurs nutritionnelles. Aucune place payante.",
    card: "Nourriture pour chiens en croissance de toutes tailles.",
    intro: "Un chiot a besoin de plus de protéines, d'énergie et de minéraux qu'un chien adulte, mais pas trop non plus. Voici les aliments pour chiots ayant le meilleur score Scanabowl. Vous avez un chiot de grande race ? Consultez [la nourriture pour chiots de grandes races](/{lang}/best/large-breed-puppy-food).",
    tips: [
      "**Choisissez un aliment pour la croissance.** L'emballage indique « puppy », « junior » ou « tous âges ». Les recommandations FEDIAF prévoient des normes plus élevées pour la croissance, notamment pour les protéines, les graisses et le calcium.",
      "**Est-il adapté à la taille de votre chien ?** Les petites et les grandes races grandissent très différemment. Beaucoup de marques ont des versions pour petites, moyennes et grandes races.",
      "**Jusqu'à quand ?** Les petits et moyens chiens mangent de la nourriture pour chiot jusqu'à environ 12 mois, les grandes races jusqu'à 18 à 24 mois.",
      "**N'ajoutez pas de calcium** ni d'autres compléments à un aliment complet pour chiot, sauf avis de votre vétérinaire.",
    ],
  },
  "large-breed-puppy-food": {
    h1: "La meilleure nourriture pour chiot de grande race",
    title: "Meilleure nourriture pour chiot de grande race {year} : top 10",
    description: "Nourriture pour chiots de grandes races au meilleur score indépendant, sans aliments au-dessus du maximum de calcium FEDIAF : le top 10 parmi {count} aliments.",
    card: "Pour les chiots qui pèseront plus d'environ 25 kilos adultes.",
    intro: "Les chiots de grandes races grandissent longtemps et sont sensibles à un excès de calcium et à une croissance trop rapide. Cette liste ne contient que des aliments pour chiots de grandes races dont le calcium reste sous le maximum FEDIAF, dans la mesure où l'étiquette l'indique.",
    tips: [
      "**Pas trop de calcium.** Chez des chiots dogues allemands, un excès prolongé de calcium a entraîné des anomalies des cartilages de croissance (Goedegebuure & Hazewinkel, 1986). La FEDIAF fixe pour la fin de croissance un maximum de 1,8 gramme pour 100 grammes de matière sèche. Nous écartons les aliments au-dessus.",
      "**Ne laissez pas votre chiot grandir trop vite.** Un chiot mince vaut mieux qu'un chiot rond. Pesez-le régulièrement et utilisez la portion de votre [profil d'animal](/{lang}/my-pet).",
      "**N'ajoutez jamais de calcium ni de préparations calciques** à un aliment complet pour chiot.",
      "**Nourriture pour chiot jusqu'à 18 à 24 mois.** Les grandes races terminent leur croissance plus tard ; ne passez à un aliment adulte qu'ensuite.",
    ],
  },
  "dry-dog-food": {
    h1: "Les meilleures croquettes pour chien",
    title: "Meilleures croquettes pour chien {year} : top 10 selon un score indépendant",
    description: "Quelles croquettes pour chien obtiennent le meilleur score ? Le top 10 parmi {count} aliments secs complets pour chiens adultes, classés selon les ingrédients et les valeurs nutritionnelles.",
    card: "Croquettes pour chiens adultes.",
    intro: "Les croquettes sont l'alimentation la plus choisie pour les chiens, et les différences sont grandes : de recettes riches en viande à des recettes surtout à base de céréales et de protéines végétales. Voici les croquettes pour chiens adultes ayant le meilleur score.",
    tips: [
      "**Regardez au-delà du premier ingrédient.** Les ingrédients sont listés par poids. Le « poulet frais » en tête est composé d'environ 70 % d'eau : regardez donc aussi le reste de la liste. Nous estimons pour vous la part animale sur matière sèche.",
      "**Comparez sur matière sèche et énergie.** Nous convertissons chaque aliment pour une comparaison équitable, même avec la nourriture humide.",
      "**Pesez la portion.** Les croquettes sont très énergétiques. Quelques croquettes de trop par jour se voient sur la balance après quelques mois.",
    ],
  },
  "wet-dog-food": {
    h1: "La meilleure pâtée pour chien",
    title: "Meilleure pâtée pour chien {year} : top 10 selon le score",
    description: "La nourriture humide pour chiens adultes au meilleur score indépendant : le top 10 parmi {count} boîtes, barquettes et saucisses complètes.",
    card: "Boîtes, barquettes et saucisses pour chiens adultes.",
    intro: "La nourriture humide est souvent riche en viande et plaît aux chiens difficiles, mais à cause de l'eau vous donnez des portions plus grandes. Voici les aliments humides complets pour chiens adultes ayant le meilleur score.",
    tips: [
      "**Complet ou complémentaire ?** Beaucoup de boîtes sont des aliments complémentaires et ne conviennent pas comme seule alimentation. Cette liste ne contient que des aliments complets.",
      "**Comptez par jour, pas par boîte.** La nourriture humide contient beaucoup moins d'énergie par gramme que les croquettes. Avec un [profil d'animal](/{lang}/my-pet), vous voyez combien de grammes par jour sont nécessaires, et dans le [comparateur](/{lang}/compare) ce que cela coûte par jour.",
      "**Vous pouvez combiner.** Une partie humide et une partie sèche, c'est très bien, tant que vous ajustez la quantité totale.",
    ],
  },
  "small-breed-dog-food": {
    h1: "La meilleure nourriture pour petit chien",
    title: "Meilleure nourriture pour chien de petite race {year} : top 10",
    description: "Nourriture pour chiens de petites races au meilleur score indépendant : le top 10 parmi {count} aliments pour petits chiens et races miniatures.",
    card: "Nourriture pour petites races et races miniatures.",
    intro: "Les petits chiens ont besoin de plus d'énergie par kilo de poids que les grands, et souvent de plus petites croquettes. Voici les aliments pour petites races ayant le meilleur score Scanabowl.",
    tips: [
      "**Petites portions, grandes différences.** Un chien de 5 kilos mange environ 100 grammes de croquettes par jour. Dix grammes de trop, c'est déjà 10 % en plus. Pesez la portion.",
      "**Adaptez la portion à votre chien.** Un petit chien actif a besoin de plus qu'un chien de salon calme. Le [profil d'animal](/{lang}/my-pet) fait le calcul pour vous.",
      "**Une nourriture « small breed » n'est pas indispensable.** Une bonne recette et la bonne quantité comptent davantage. Les petites croquettes sont surtout pratiques pour les petites gueules.",
    ],
  },
  "large-breed-dog-food": {
    h1: "La meilleure nourriture pour grand chien",
    title: "Meilleure nourriture pour chien de grande race {year} : top 10",
    description: "Nourriture pour chiens de grandes races au meilleur score indépendant : le top 10 parmi {count} aliments pour chiens adultes de grandes races.",
    card: "Nourriture pour chiens adultes de grandes races.",
    intro: "Chez les grands chiens, chaque kilo en trop compte pour les articulations. Voici les aliments pour chiens adultes de grandes races ayant le meilleur score Scanabowl.",
    tips: [
      "**Un chien mince vit plus longtemps.** Dans une étude sur toute la vie de labradors, les chiens nourris avec 25 % de moins que leurs frères et sœurs ont vécu en moyenne près de deux ans de plus et ont développé l'arthrose plus tard (Kealy et al., 2002).",
      "**La portion compte plus que l'étiquette.** La nourriture pour grandes races a souvent de plus grosses croquettes et un peu moins d'énergie par gramme, mais c'est la bonne quantité qui fait la différence.",
      "**La glucosamine et la chondroïtine ajoutées** ne rapportent qu'un petit bonus dans notre score. Choisissez sur l'ensemble de la recette.",
    ],
  },
  "senior-dog-food": {
    h1: "La meilleure nourriture pour chien senior",
    title: "Meilleure nourriture pour chien senior {year} : top 10 selon le score",
    description: "La nourriture senior pour chiens âgés au meilleur score indépendant : le top 10 parmi {count} aliments, classés selon les ingrédients et les valeurs nutritionnelles.",
    card: "Nourriture destinée aux chiens âgés.",
    intro: "Il n'existe pas de définition légale de la nourriture senior : l'une contient moins de calories, l'autre plus de protéines ou moins de phosphore. Voici les aliments senior pour chiens ayant le meilleur score.",
    tips: [
      "**Moins d'énergie, pas moins de protéines.** Les chiens âgés perdent facilement de la masse musculaire. Une synthèse recommande de continuer à donner assez de protéines aux chiens âgés (Laflamme, 2005). Réduisez la portion, pas la qualité.",
      "**Pesez régulièrement.** Un chien qui bouge moins a besoin de moins de calories. Le [profil d'animal](/{lang}/my-pet) tient compte de l'âge de votre chien.",
      "**En cas de maladie, le vétérinaire décide.** Pour les problèmes rénaux, hépatiques ou cardiaques, il existe des aliments diététiques à donner uniquement sur avis vétérinaire. Ils ne figurent donc pas dans cette liste.",
    ],
  },
  "grain-free-dog-food": {
    h1: "La meilleure nourriture sans céréales pour chien",
    title: "Meilleure nourriture sans céréales pour chien {year} : top 10",
    description: "La nourriture sans céréales pour chien au meilleur score indépendant : le top 10 parmi {count} aliments sans céréales pour chiens adultes.",
    card: "Nourriture sans blé, maïs, riz ni autres céréales.",
    intro: "Pour la plupart des chiens, les céréales ne posent pas de problème, et sans céréales n'est pas un label de qualité : nous ne donnons pas de points pour cela. Votre chien ne tolère pas une céréale ? Voici les aliments sans céréales ayant le meilleur score.",
    tips: [
      "**Attention aux légumineuses en grande quantité.** La FDA américaine a étudié un lien possible entre des aliments sans céréales riches en pois, lentilles ou pomme de terre et une maladie du muscle cardiaque (DCM) chez le chien. Aucune cause n'a été prouvée, mais un aliment très riche en légumineuses reçoit chez nous une petite déduction.",
      "**Sans céréales ne veut pas dire sans glucides.** Les céréales sont généralement remplacées par de la pomme de terre, des pois ou du tapioca.",
      "**Une allergie au blé ?** Indiquez-la dans votre [profil d'animal](/{lang}/my-pet) : nous masquons alors tout aliment contenant du blé, même s'il ne s'appelle pas « sans céréales ».",
    ],
  },
  "single-protein-dog-food": {
    h1: "La meilleure nourriture pour chien à une seule protéine",
    title: "Nourriture pour chien à une seule protéine animale {year} : top 10",
    description: "Nourriture pour chien avec une seule source de protéines animales et sans sous-produits vagues, classée selon un score indépendant : le top 10 parmi {count} aliments.",
    card: "Une seule espèce animale comme source de protéines, sans « sous-produits animaux » vagues.",
    intro: "En cas d'allergie alimentaire (suspectée), vous voulez savoir exactement quel animal se trouve dans la gamelle. Cette liste ne contient que des aliments avec une seule source de protéines animales nommée, sans termes vagues comme « viandes et sous-produits animaux ».",
    tips: [
      "**Les allergènes alimentaires les plus fréquents chez le chien** sont le bœuf, les produits laitiers, le poulet et le blé (Mueller et al., 2016). Choisissez une protéine que votre chien n'a jamais mangée.",
      "**Une allergie se diagnostique par un régime d'éviction :** au moins 8 semaines d'un seul aliment et rien d'autre, avec votre vétérinaire. Après 8 semaines, environ 90 % des animaux allergiques n'ont plus de symptômes (Olivry et al., 2015).",
      "**Regardez aussi le reste de la liste.** Une seule protéine animale ne dit rien des céréales ou des autres ingrédients. Indiquez les allergies dans votre [profil d'animal](/{lang}/my-pet) pour les filtrer aussi.",
    ],
  },
};

export const GUIDE_TEXT: Record<Locale, Texts> = { nl, en, de, fr };

export function guideText(lang: Locale, slug: string, vars: { year: number | string; count: number | string }): GuideText | null {
  const g = GUIDE_TEXT[lang][slug];
  if (!g) return null;
  const fill = (s: string) => s.replaceAll("{year}", String(vars.year)).replaceAll("{count}", String(vars.count)).replaceAll("{lang}", lang);
  return { h1: fill(g.h1), title: fill(g.title), description: fill(g.description), card: fill(g.card), intro: fill(g.intro), tips: g.tips.map(fill) };
}
