import "server-only";
import type { Locale } from "../i18n/config";
import { detailToIndex } from "./index-entry";
import { allProducts } from "./products";
import type { IndexEntry, ProductDetail } from "./types";

export const ALLERGEN_SLUGS = [
  "chicken",
  "beef",
  "wheat",
  "fish",
  "dairy",
  "corn",
  "soy",
  "egg",
  "lamb",
  "pork",
] as const;

export type AllergenSlug = (typeof ALLERGEN_SLUGS)[number];

export function isAllergenSlug(s: string): s is AllergenSlug {
  return (ALLERGEN_SLUGS as readonly string[]).includes(s);
}

export interface AllergenSummary {
  slug: AllergenSlug;
  safeDogs: IndexEntry[];
  safeCats: IndexEntry[];
  totalSafe: number;
  definiteCount: number;
  vagueCount: number;
}

let cache: Map<AllergenSlug, AllergenSummary> | null = null;

async function buildMap(): Promise<Map<AllergenSlug, AllergenSummary>> {
  if (cache) return cache;
  const { dog, cat } = await allProducts();
  const map = new Map<AllergenSlug, AllergenSummary>();

  for (const slug of ALLERGEN_SLUGS) {
    let definiteCount = 0;
    let vagueCount = 0;

    const filterSafe = (list: ProductDetail[]) => {
      const safe: ProductDetail[] = [];
      for (const p of list) {
        if (p.category !== "complete" || p.score === null) continue;
        if (p.allergens.definite.includes(slug)) {
          definiteCount++;
          continue;
        }
        if (p.allergens.possible.includes(slug)) {
          vagueCount++;
          continue;
        }
        safe.push(p);
      }
      return safe
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || Number(!!b.image) - Number(!!a.image) || a.name.localeCompare(b.name))
        .map(detailToIndex);
    };

    const safeDogs = filterSafe(dog);
    const safeCats = filterSafe(cat);
    map.set(slug, {
      slug,
      safeDogs,
      safeCats,
      totalSafe: safeDogs.length + safeCats.length,
      definiteCount,
      vagueCount,
    });
  }

  cache = map;
  return map;
}

export async function getAllergenSummary(slug: string): Promise<AllergenSummary | null> {
  if (!isAllergenSlug(slug)) return null;
  const map = await buildMap();
  return map.get(slug) ?? null;
}

export function getAllergenEditorial(slug: AllergenSlug, lang: Locale, allergenName: string): {
  whyAvoid: string;
  vagueWarning: string;
} {
  const nameLower = allergenName.toLowerCase();
  const specificNotes: Record<AllergenSlug, Record<Locale, string>> = {
    chicken: {
      nl: "Kip is een van de meest gebruikte eiwitbronnen in honden- en kattenvoer – ook in voeders die op de voorkant ‘Met lam’ of ‘Met zalm’ heten (vaak via gevogeltevet of kippenmeel). In het overzichtsonderzoek van Mueller et al. (2016) behoort kip bij zowel honden (15%) als katten (15%) tot de drie meest voorkomende voedselallergenen.",
      en: "Chicken is one of the most widely used protein sources in dog and cat food – even in recipes labelled ‘With lamb’ or ‘With salmon’ on the front (often via poultry fat or chicken meal). In Mueller et al. (2016), chicken ranks among the top three food allergens in both dogs (15%) and cats (15%).",
      de: "Huhn ist eine der am häufigsten verwendeten Eiweißquellen in Hunde- und Katzenfutter – selbst in Sorten, auf denen vorne „Mit Lamm“ oder „Mit Lachs“ steht (oft über Geflügelfett oder Hühnermehl). Laut Mueller et al. (2016) gehört Huhn bei Hunden (15 %) wie auch Katzen (15 %) zu den drei häufigsten Futterallergenen.",
      fr: "Le poulet est l’une des sources de protéines les plus courantes dans l’alimentation pour chiens et chats – même dans des recettes affichant « À l’agneau » ou « Au saumon » en façade (souvent via la graisse de volaille). Selon Mueller et al. (2016), le poulet figure parmi les trois allergènes majeurs chez le chien (15 %) et le chat (15 %).",
    },
    beef: {
      nl: "Rund staat op nummer 1 van de meest gemelde voedselallergenen bij zowel honden (34%) als katten (18%) in de diergeneeskundige literatuur (Mueller et al., 2016), mede doordat rund decennialang het hoofdingrediënt in talloze blik- en droogvoeders is geweest.",
      en: "Beef is the #1 most frequently reported food allergen in both dogs (34%) and cats (18%) in veterinary literature (Mueller et al., 2016), largely because beef has long been a staple ingredient across wet and dry pet foods.",
      de: "Rind steht auf Platz 1 der am häufigsten gemeldeten Futterallergene bei Hunden (34 %) und Katzen (18 %) in der tierärztlichen Fachliteratur (Mueller et al., 2016), da Rind seit Jahrzehnten in vielen Nass- und Trockenfuttern eingesetzt wird.",
      fr: "Le bœuf est l’allergène alimentaire le plus fréquemment rapporté chez le chien (34 %) comme chez le chat (18 %) dans la littérature vétérinaire (Mueller et al., 2016), car il est présent depuis longtemps dans de nombreuses recettes.",
    },
    wheat: {
      nl: "Tarwe (en tarwegluten) is het meest voorkomende plantaardige voedselallergeen bij honden (ongeveer 13% van de vastgestelde voedselallergieën volgens Mueller et al., 2016). Bij Ierse setters en Border terriërs komen daarnaast specifieke glutenovergevoeligheden voor.",
      en: "Wheat (and wheat gluten) is the most common plant-based food allergen in dogs (accounting for roughly 13% of confirmed food allergies according to Mueller et al., 2016). Certain breeds such as Irish Setters and Border Terriers also show specific gluten sensitivities.",
      de: "Weizen (und Weizenkleber) ist das häufigste pflanzliche Futterallergen bei Hunden (rund 13 % der bestätigten Futterallergien laut Mueller et al., 2016). Bestimmte Rassen wie Irish Setter und Border Terrier zeigen zudem spezielle Glutenempfindlichkeiten.",
      fr: "Le blé (et le gluten de blé) est l’allergène végétal le plus fréquent chez le chien (environ 13 % des allergies alimentaires confirmées selon Mueller et al., 2016). Certaines races présentent également des sensibilités particulières au gluten.",
    },
    fish: {
      nl: "Bij katten staat vis op de tweede plaats van de meest voorkomende voedselallergenen (ongeveer 17% van de gevallen volgens Mueller et al., 2016). Let op dat ook visolie of zalmolie in droogvoer sporen van viseiwit kan bevatten.",
      en: "In cats, fish is the second most common food allergen (around 17% of cases according to Mueller et al., 2016). Note that fish oil or salmon oil added to kibble can also carry trace amounts of fish protein.",
      de: "Bei Katzen steht Fisch an zweiter Stelle der häufigsten Futterallergene (rund 17 % der Fälle laut Mueller et al., 2016). Beachten Sie, dass auch Fischöl oder Lachsöl in Trockenfutter Spuren von Fischeiweiß enthalten kann.",
      fr: "Chez le chat, le poisson est le deuxième allergène alimentaire le plus fréquent (environ 17 % des cas selon Mueller et al., 2016). Notez que l’huile de poisson ou de saumon peut aussi contenir des traces de protéines de poisson.",
    },
    dairy: {
      nl: "Zuivel veroorzaakt bij honden en katten twee soorten reacties: een echte eiwitallergie voor koemelkeiwit (bij circa 17% van de allergische honden, Mueller et al., 2016) of lactose-intolerantie doordat volwassen dieren minder lactase aanmaken.",
      en: "Dairy can trigger two distinct reactions in dogs and cats: a true immune allergy to cow's milk protein (seen in ~17% of allergic dogs, Mueller et al., 2016) or lactose intolerance because adult pets produce less lactase enzyme.",
      de: "Milchprodukte können bei Hunden und Katzen zwei Reaktionen auslösen: eine echte Allergie gegen Kuhmilcheiweiß (bei ca. 17 % der allergischen Hunde, Mueller et al., 2016) oder eine Laktoseintoleranz bei ausgewachsenen Tieren.",
      fr: "Les produits laitiers peuvent provoquer deux réactions chez le chien et le chat : une véritable allergie aux protéines du lait (environ 17 % des chiens allergiques, Mueller et al., 2016) ou une intolérance au lactose.",
    },
    corn: {
      nl: "Maïs en maïsglutenmeel worden veel in droge brokken verwerkt als koolhydraatbron en plantaardig eiwitconcentraat. Hoewel een maïsallergie minder vaak voorkomt dan rund of kip (circa 4% bij honden en katten), kiezen veel eigenaren voor een maïsvrij recept.",
      en: "Corn and corn gluten meal are widely used in dry kibble as a starch source and plant protein concentrate. While corn allergy is less common than beef or chicken (~4% in dogs and cats), many owners prefer corn-free recipes.",
      de: "Mais und Maiskleberfutter werden in Trockenfutter häufig als Stärkequelle und pflanzliches Eiweißkonzentrat eingesetzt. Obwohl eine Maisallergie seltener ist als Rind oder Huhn (~4 %), bevorzugen viele Halter maisfreie Rezepturen.",
      fr: "Le maïs et le gluten de maïs sont souvent utilisés dans les croquettes comme source d’amidon et concentré de protéines végétales. Même si l’allergie au maïs est plus rare (~4 %), beaucoup de propriétaires recherchent une recette sans maïs.",
    },
    soy: {
      nl: "Soja en soja-eiwitconcentraat worden soms gebruikt om het ruwe-eiwitgehalte van brokken goedkoop te verhogen. Bij ongeveer 6% van de honden met een voedselallergie speelt soja een rol (Mueller et al., 2016).",
      en: "Soy and soy protein concentrate are sometimes used to boost crude protein levels in kibble inexpensively. Soy is implicated in roughly 6% of dogs with confirmed food allergies (Mueller et al., 2016).",
      de: "Soja und Sojaproteinkonzentrat werden mitunter genutzt, um den Rohproteingehalt günstig zu erhöhen. Bei etwa 6 % der Hunde mit Futterallergie spielt Soja eine Rolle (Mueller et al., 2016).",
      fr: "Le soja et les concentrés de protéines de soja servent parfois à augmenter le taux de protéines à moindre coût. Le soja est impliqué chez environ 6 % des chiens souffrant d’allergie alimentaire (Mueller et al., 2016).",
    },
    egg: {
      nl: "Ei heeft een zeer hoge biologische waarde en wordt vaak aan voer toegevoegd, maar bij circa 4% van de allergische honden en katten reageert het immuunsysteem op kippenei-eiwit (Mueller et al., 2016).",
      en: "Egg has an exceptionally high biological value and is a common nutritious ingredient, but around 4% of allergic dogs and cats react to hen's egg protein (Mueller et al., 2016).",
      de: "Ei hat eine sehr hohe biologische Wertigkeit, doch bei rund 4 % der allergischen Hunde und Katzen reagiert das Immunsystem auf Hühnereieiweiß (Mueller et al., 2016).",
      fr: "L’œuf possède une très haute valeur biologique, mais environ 4 % des chiens et chats allergiques réagissent aux protéines d’œuf (Mueller et al., 2016).",
    },
    lamb: {
      nl: "Lam werd vroeger standaard geadviseerd bij voedselallergieën, maar doordat lam inmiddels in heel veel reguliere voeders zit, is ongeveer 14,5% van de allergische honden ook gevoelig voor lam (Mueller et al., 2016).",
      en: "Lamb was historically the go-to novel protein for elimination diets, but because it is now widespread in everyday foods, roughly 14.5% of allergic dogs react to lamb as well (Mueller et al., 2016).",
      de: "Lamm galt früher als Standard-Eiweiß für Ausschlussdiäten; da es heute in vielen Alltagsfuttern steckt, reagieren inzwischen rund 14,5 % der allergischen Hunde auch auf Lamm (Mueller et al., 2016).",
      fr: "L’agneau était autrefois la protéine de référence pour les régimes d’éviction, mais comme il est devenu très courant, environ 14,5 % des chiens allergiques y réagissent aujourd’hui (Mueller et al., 2016).",
    },
    pork: {
      nl: "Varken (en reuzel of gehydrolyseerd varkenseiwit) komt in veel nat- en droogvoeders voor. Als je dier gevoelig is voor varken, is het extra belangrijk om voer met vage ‘vlees en dierlijke bijproducten’ te vermijden.",
      en: "Pork (including lard and pork digest) appears in many wet and dry foods. If your pet reacts to pork, avoiding vague ‘meat and animal derivatives’ declarations is essential.",
      de: "Schwein (auch Schmalz oder Schweineproteinhydrolysat) kommt in vielen Nass- und Trockenfuttern vor. Bei einer Unverträglichkeit sollten vage „Fleisch und tierische Nebenerzeugnisse“ unbedingt gemieden werden.",
      fr: "Le porc (y compris le saindoux ou les hydrolysats de porc) est présent dans de nombreux aliments. En cas d’intolérance, il est essentiel d’écarter les mentions vagues « viandes et sous-produits animaux ».",
    },
  };

  const vagueByLang: Record<Locale, string> = {
    nl: `In dit overzicht heeft Scanabowl niet alleen elk voer verwijderd waarin ${nameLower} expliciet wordt genoemd, maar óók elk voer met vage verzameltermen zoals “vlees en dierlijke bijproducten”, “gevogelte” of “granen” waarin ${nameLower} onzichtbaar verwerkt kan zijn.`,
    en: `On this page, Scanabowl excludes not only every food that explicitly lists ${nameLower}, but also every food using vague group terms such as “meat and animal derivatives”, “poultry” or “cereals” that could hide ${nameLower}.`,
    de: `Auf dieser Seite schließt Scanabowl nicht nur jedes Futter aus, das ${allergenName} ausdrücklich nennt, sondern auch jedes Futter mit vagen Sammelbegriffen wie „Fleisch und tierische Nebenerzeugnisse“, „Geflügel“ oder „Getreide“, hinter denen sich ${allergenName} verbergen kann.`,
    fr: `Sur cette page, Scanabowl exclut non seulement tous les aliments mentionnant explicitement « ${nameLower} », mais aussi tous ceux utilisant des termes génériques vagues (« viandes et sous-produits animaux », « volaille », « céréales ») pouvant en cacher.`,
  };

  return {
    whyAvoid: specificNotes[slug][lang],
    vagueWarning: vagueByLang[lang],
  };
}
