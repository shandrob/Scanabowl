import type { IngredientInfo, IngredientKind, IngredientTag } from "./types";
import { normalize } from "./text";

/**
 * Ingredient knowledge base.
 *
 * All patterns run on *normalised* text (lower-case, accents stripped) and cover
 * Dutch, English, German and French label wording, because the database is mostly
 * Dutch but brands may submit foods in another language.
 *
 * Protein fractions are typical crude-protein values of the ingredient as it is
 * weighed into the recipe (NRC 2006 / Feedipedia composition tables, rounded).
 * They are used to estimate what share of a food's protein comes from animals -
 * a *relative* measure, so approximate values are sufficient.
 */

const W = "(?<![a-z])"; // word start

/** Species / source detection. Order matters only for classification (first wins). */
export const SPECIES: Array<{ id: string; re: RegExp; clarity: number; family: "animal" | "plant" }> = [
  // eggs & dairy first so "kippenei" is an egg, not a chicken
  { id: "egg", re: new RegExp(`${W}(kippenei\\w*|eieren|eiproducten|eipoeder|eierschal\\w*|egg|eggs|eier|oeufs?|ei)(?![a-z])`), clarity: 1, family: "animal" },
  { id: "dairy", re: new RegExp(`${W}(melk(?!zuur)\\w*|zuivel\\w*|kaas|wei(?:poeder|eiwit\\w*)?|lactose|milk|whey|cheese|dairy|yogh?urt|kefir|molke|milch|kase|lait|fromage|lactoserum|caseine?|casein|boter|butter)(?![a-z])`), clarity: 1, family: "animal" },
  { id: "chicken", re: new RegExp(`${W}(kip|kippen|kuiken|kuikens|hoen|hoenders|chicken|huhn|huhner|hahnchen|poulet|poule)\\w*|${W}[a-z-]*(?:uitloop|scharrel)kip\\w*`), clarity: 1, family: "animal" },
  { id: "turkey", re: new RegExp(`${W}(kalkoen|turkey|pute|puten|truthahn|dinde)\\w*`), clarity: 1, family: "animal" },
  { id: "duck", re: new RegExp(`${W}(eend|eenden|eendje|eendenvlees|duck|ente|enten|canard)\\w*`), clarity: 1, family: "animal" },
  { id: "goose", re: new RegExp(`${W}(gans|goose|oie)(?![a-z])|${W}ganzen\w*`), clarity: 1, family: "animal" },
  { id: "poultry", re: new RegExp(`${W}(gevogelte|pluimvee|poultry|geflugel|volaille)\\w*`), clarity: 0.5, family: "animal" },
  { id: "beef", re: new RegExp(`${W}(rund|runder|rundvlees|rundvet|beef|rind|rinder|boeuf|vache|kalf|kalfs\\w*|veal|kalb|veau)\\w*|${W}(koe|koeien)(?![a-z])`), clarity: 1, family: "animal" },
  { id: "lamb", re: new RegExp(`${W}(lam(?![a-z])|lameiwit|lams\\w*|lammeren|lamb|lamm|agneau|schaap\\w*|schapen\\w*|mutton|hammel|mouton)`), clarity: 1, family: "animal" },
  { id: "pork", re: new RegExp(`${W}(varken\\w*|pork|schwein\\w*|porc|spek|bacon|ham(?![a-z]))`), clarity: 1, family: "animal" },
  { id: "horse", re: new RegExp(`${W}(paard\\w*|horse|pferd\\w*|cheval)`), clarity: 1, family: "animal" },
  { id: "rabbit", re: new RegExp(`${W}(konijn\\w*|rabbit|kaninchen|lapin)`), clarity: 1, family: "animal" },
  { id: "game", re: new RegExp(`${W}(wild(?![a-z])|wildvlees|hert\\w*|ree(?![a-z])|venison|wildbret|gibier|everzwijn|wild boar|cerf|kangoeroe\\w*|kangaroo|struis\\w*|ostrich|rendier|reindeer|geit(?![a-z])|goat|bison|buffel\\w*)`), clarity: 1, family: "animal" },
  { id: "fish", re: new RegExp(`${W}(vis(?![a-z])|vissen|visolie|vis\\w*(?:producten|bijproducten|meel|vet|bouillon|graat)|blauwbaars|blauwe wijting|snoek\\w*|baars(?![a-z])|karper|meerval|steur|schelvis|rog(?![a-z])|haai|sprot\\w*|spiering|zeebrasem|zeewolf|tarbot|zeeduivel|zalm\\w*|tonijn\\w*|haring\\w*|makreel\\w*|kabeljauw\\w*|schol(?![a-z])|pladijs|forel\\w*|sardien\\w*|sardine\\w*|ansjovis|anchov\\w*|witvis|wijting|koolvis|heek|zeebaars|dorade|pangasius|tilapia|fish|salmon|tuna|herring|mackerel|cod(?![a-z])|trout|pollock|whitefish|fisch\\w*|lachs|thunfisch|hering|forelle|poisson\\w*|saumon|thon(?![a-z])|hareng|maquereau|morue|krill|garnaal\\w*|garnalen|shrimp|prawn|krab|crab|mossel\\w*|groenlipmossel\\w*|mussel\\w*|oester|oyster|inktvis|squid|zeevruchten|seafood|schaaldier\\w*)`), clarity: 1, family: "animal" },
  { id: "insect", re: new RegExp(`${W}(insect\\w*|larv\\w*|soldier fly|soldaatvlieg\\w*|meelworm\\w*|mealworm\\w*|cricket\\w*|krekel\\w*)`), clarity: 1, family: "animal" },

  { id: "wheat", re: new RegExp(`${W}(tarwe\\w*|wheat|weizen\\w*|ble(?![a-z])|spelt\\w*|dinkel|epeautre|kamut|triticale|couscous|griesmeel|semolina)`), clarity: 1, family: "plant" },
  { id: "corn", re: new RegExp(`${W}(mais\\w*|corn|maize|polenta)`), clarity: 1, family: "plant" },
  { id: "rice", re: new RegExp(`${W}(rijst\\w*|rice|reis(?![a-z])|riz(?![a-z]))`), clarity: 1, family: "plant" },
  { id: "barley", re: new RegExp(`${W}(gerst\\w*|barley|orge(?![a-z]))`), clarity: 1, family: "plant" },
  { id: "oats", re: new RegExp(`${W}(haver\\w*|oats?(?![a-z])|hafer|avoine)`), clarity: 1, family: "plant" },
  { id: "rye", re: new RegExp(`${W}(rogge\\w*|rye|roggen|seigle)`), clarity: 1, family: "plant" },
  { id: "sorghum", re: new RegExp(`${W}(sorghum|gierst\\w*|millet|hirse)`), clarity: 1, family: "plant" },
  { id: "soy", re: new RegExp(`${W}(soja\\w*|soy\\w*|sojabo\\w*)`), clarity: 1, family: "plant" },
  { id: "legume", re: new RegExp(`${W}(erwt\\w*|peas?(?![a-z])|pois(?![a-z])|erbse\\w*|lins(?![a-z])|linzen|lentil\\w*|lentille\\w*|linse\\w*|kikkererwt\\w*|chickpea\\w*|pois chiche\\w*|kichererbse\\w*|boon(?![a-z])|bonen|beans?(?![a-z])|haricot\\w*|bohne\\w*|lupine\\w*|lupin\\w*|veldbo\\w*)`), clarity: 1, family: "plant" },
  { id: "potato", re: new RegExp(`${W}(aardappel\\w*|potato\\w*|kartoffel\\w*|pommes? de terre|patat\\w*|batat\\w*|zoete aardappel\\w*|sweet potato\\w*)`), clarity: 1, family: "plant" },
  { id: "yeast", re: new RegExp(`${W}(gist\\w*|yeast\\w*|hefe|levure\\w*)`), clarity: 1, family: "plant" },
];

const CEREAL_IDS = new Set(["wheat", "corn", "rice", "barley", "oats", "rye", "sorghum"]);

export function speciesIn(text: string): string[] {
  const t = normalize(text);
  return SPECIES.filter((s) => s.re.test(t)).map((s) => s.id);
}

// ---------------------------------------------------------------------------
// Form detection (what has been done to the ingredient)
// ---------------------------------------------------------------------------
const FAT_RE = /(?<!ont)(vet|vetten|olie|oil|fat|fats|fett|graisse|huile)(?![a-z])/;
const MEAL_RE = /(meel|meal|gedroogd|gedehydreerd|dehydrat|dried|getrocknet|deshydrat|poeder|powder)/;
const HYDRO_RE = /(gehydrolyseerd|hydrolys|hydroliz|extract|digest|eiwit|protein|eiweiss|proteine)/;
const BROTH_RE = /(bouillon|broth|brodo|fond(?![a-z])|jus(?![a-z]))/;

const GENERIC_ANIMAL_RE = new RegExp(
  [
    "vlees en dierlijke (?:bij)?producten",
    "dierlijke (?:bij)?producten",
    "vlees en dierlijke derivaten",
    "dierlijke derivaten",
    "vlees en (?:dierlijke )?derivaten",
    "meat and animal derivatives",
    "animal (?:by-?products|derivatives)",
    "tierische nebenerzeugnisse",
    "fleisch und tierische",
    "viandes? et sous-produits",
    "sous-produits animaux",
    "slachtafval",
    "orgaanvlees",
    "vlees(?![a-z])",
    "meat(?![a-z])",
    "fleisch(?![a-z])",
    "viande(?![a-z])",
  ].join("|"),
);
const STARTS_GENERIC_RE = /^(?:gedroogd(?:e)? |gedehydreerd(?:e)? )?(vlees en (?:dierlijke )?(?:bij|neven)?(?:producten|derivaten)|dierlijke (?:bij|neven)?producten|dierlijke derivaten|meat and animal derivatives|animal (?:by-?products|derivatives)|tierische nebenerzeugnisse|viandes? et sous-produits)/;
const ORGAN_RE = /(?<![a-z])(lever|hart|nieren?|longen?|milt|pens|maag|bloed|liver|heart|kidneys?|lungs?|stomach|blood|leber|herz|niere|foie|coeur)(?![a-z])/;
const ANIMAL_PROTEIN_GENERIC_RE = /(dierlijke? (?:gehydrolyseerde )?eiwit\w*|gehydrolyseerde dierlijke|animal protein|tierisches? eiwei|proteines? animales?|gelatine|gelatin|collageen|collagen)/;
const ANIMAL_FAT_GENERIC_RE = /(dierlijke? vet\w*|animal fats?|tierische fette?|graisses? animales?)/;

// ---------------------------------------------------------------------------
// Additives & other non-nutritive lines
// ---------------------------------------------------------------------------
const ADDITIVE_RULES: Array<{ re: RegExp; kind: IngredientKind; tags?: IngredientTag[] }> = [
  { re: /(?<![a-z])(kleurstoffen?|colou?rants?|farbstoffe?|e1\d\d(?![0-9])|ijzeroxide\w*|iron oxides?|titaandioxide|titanium dioxide|tartrazine|allura|azo-?kleurstof\w*)/, kind: "colourant" },
  { re: /(?<![a-z])(bha(?![a-z])|bht(?![a-z])|ethoxyquin\w*|propylgallaat|propyl gallate|e32\d(?![0-9])|e2[0-9]{2}(?![0-9])|kaliumsorbaat|sorbaat|sorbic|natriumnitriet|nitriet|benzo[ae]t|sulfiet|conserveermiddel\w*|preservatives?|konservierungsstoff\w*|conservateurs?)/, kind: "preservative" },
  { re: /(?<![a-z])(suiker(?!biet)\w*|sucrose|glucose\w*|fructose|dextrose|karamel\w*|caramel\w*|siroop|stroop|honing|honey|sugars?(?![a-z])|zucker|sucre(?![a-z])|sirup)/, kind: "sugar" },
  { re: /(?<![a-z])(carrageen\w*|guar\w*|xanthaan|xanthan|johannesbroodpit\w*|locust bean|agar(?![a-z])|gellan|verdikkings\w*)/, kind: "binder" },
  { re: /(?<![a-z])(mineralen|minerals?|mineralstoff\w*|mineraux|sporenelementen|trace elements|zout(?![a-z])|salt(?![a-z])|natriumchloride|kaliumchloride|calcium\w*|dicalcium\w*|monocalcium\w*|fosfaat|fosfor\w*|kalk(?![a-z])|kreide|magnesium\w*|zink\w*|zinc|ijzer\w*|koper\w*|jodium|iodine|selenium|seleen|mangaan\w*|kalium\w*|natrium\w*|sodium|potassium)/, kind: "mineral" },
  { re: /(?<![a-z])(taurine?|taurin)/, kind: "vitamin", tags: ["taurine"] },
  { re: /(?<![a-z])(vitamin\w*|vit\.|ascorb\w*|niacin\w*|foliumzuur|folic|biotine?|cholin\w*|betacaroteen|caroteen|carotene|l-carnitine|carnitine|inositol)/, kind: "vitamin" },
  { re: /(?<![a-z])(glucosamine|chondroitin\w*|chondroit\w*|kraakbeen|cartilage|groenlipmossel\w*|green.?lipped)/, kind: "other", tags: ["joint"] },
  { re: /(?<![a-z])(tocoferol\w*|tocopherol\w*|natuurlijke antioxidanten|natural antioxidants|rozemarijnextract|rosemary extract)/, kind: "other", tags: ["natural_antioxidant"] },
  { re: /(?<![a-z])(probiotic\w*|lactobacillus|enterococcus|bacillus|bifidobacter\w*|lactic acid bacteria|melkzuurbacterien)/, kind: "other", tags: ["probiotic"] },
];

// ---------------------------------------------------------------------------
// Plant-based rules
// ---------------------------------------------------------------------------
const CEREAL_PROTEIN_RE = /(gluten|tarweeiwit|rijsteiwit|maiseiwit|graaneiwit|cereal proteins?|corn gluten|wheat gluten|getreideeiwei)/;
const LEGUME_PROTEIN_RE = /(erwteneiwit\w*|erwtenproteine|pea protein|sojaeiwit|soja-?eiwit\w*|soy protein|sojaproteine|aardappeleiwit|aardappelproteine|potato protein|lupine-?eiwit|plantaardige eiwit\w*|plantaardig eiwit\w*|vegetable protein\w*|pflanzliche eiwei\w*|proteines? vegetales?|plant protein\w*)/;
const VAGUE_PLANT_RE = /(^|[^a-z])(granen|graan(?![a-z])|cereals?(?![a-z])|getreide|cereales|plantaardige (?:bij)?producten|plantaardige bijproducten|vegetable by-?products?|pflanzliche nebenerzeugnisse|sous-produits vegetaux)/;
const OIL_RE = /(olie|oil|huile|(?<=[a-z]{3})(?<!o)ol(?![a-z]))/;
const FIBRE_RE = /(cellulose|houtvezel\w*|bietenpulp|beet pulp|betterave|pulp(?![a-z])|psyllium|vezels?|fibre|fiber|faser|zemelen|bran(?![a-z])|inulin\w*|cichorei\w*|chicory|chicoree|fos(?![a-z])|fructo|oligosacchar\w*|mos(?![a-z])|manno|pectine|arabinogalact\w*|lignocellulose)/;
const PREBIOTIC_RE = /(inulin\w*|cichorei\w*|chicory|chicoree|fos(?![a-z])|fructo|oligosacchar\w*|mos(?![a-z])|manno)/;
const TUBER_RE = /(zetmeel|starch|starke|amidon|tapioca|cassave|cassava|maniok|quinoa|boekweit|buckwheat|amarant\w*|topinamboer)/;
const BOTANICAL_RE = /(kruiden|herbs?(?![a-z])|kraeuter|kruidenmix|rozemarijn|rosemary|yucca|brandnetel|kamille|heermoes|mariadistel|sint-?janskruid|weegbree|pepermunt|munt(?![a-z])|peterselie|parsley|dille|salie|tijm|kurkuma|turmeric|curcuma|gember|ginger|ginseng|aloe|paardenbloem|dandelion|tagetes|kurkuma|extract)/;
const VEG_FRUIT_RE = /(wortel\w*|peen(?![a-z])|carrot\w*|pompoen\w*|pumpkin|kurbis|courgette\w*|spinazie|spinach|broccoli|tomaat|tomaten\w*|tomato\w*|biet(?![a-z])|bieten|rode biet|appel\w*|apple|cranberr\w*|veenbes\w*|bosbes\w*|blueberr\w*|banaan|banana|kokos\w*|coconut|zeewier|seaweed|kelp|alg(?:en)?(?![a-z])|spirulina|chlorella|komkommer|selderij|celery|pastinaak|groente\w*|vegetable\w*|gemuse|legumes verts|fruit\w*|mango|papaya|granaatappel|sinaasappel|citrus|peer(?![a-z])|pear|aardbei\w*|kool(?![a-z])|kale|boerenkool|lijnzaad|flax\w*|chia|hennepzaad|hemp|sesam\w*|zaden|seeds?(?![a-z])|kelp|noten|nuts?(?![a-z]))/;

// ---------------------------------------------------------------------------
// The classifier
// ---------------------------------------------------------------------------
function dmFraction(kind: IngredientKind, protein: number): number {
  switch (kind) {
    case "meat":
    case "fish":
    case "generic_animal":
    case "insect":
    case "egg":
      return protein >= 0.4 ? 0.92 : 0.27; // meal / dried vs fresh (about 73 % water)
    case "dairy":
      return protein >= 0.1 ? 0.95 : 0.12;
    case "animal_extract":
      return 0.9;
    case "broth":
      return 0.03;
    case "animal_fat":
    case "fish_oil":
    case "plant_oil":
    case "mineral":
    case "vitamin":
    case "preservative":
    case "colourant":
      return 1;
    case "veg_fruit":
      return 0.15;
    default:
      return 0.88;
  }
}

function info(
  kind: IngredientKind,
  protein: number,
  clarity: number,
  tags: IngredientTag[] = [],
  species?: string,
): IngredientInfo {
  return { kind, protein, clarity, dm: dmFraction(kind, protein), tags, species };
}

function animalForm(t: string, u: string, speciesId: string, clarity: number): IngredientInfo {
  const isFish = speciesId === "fish";
  const dried = MEAL_RE.test(u); // "kip 17% (gedehydreerd)" - the form may sit in the brackets
  if (BROTH_RE.test(t)) return info("broth", 0.02, clarity, [], speciesId);
  if (FAT_RE.test(t) && !/(vetarm|magerr?)/.test(t)) {
    if (isFish) return info("fish_oil", 0, clarity, ["omega3"], speciesId);
    return info("animal_fat", 0, clarity, [], speciesId);
  }
  if (speciesId === "egg") return info("egg", dried ? 0.47 : 0.12, 1, [], "egg");
  if (speciesId === "dairy") return info("dairy", /(wei|whey|molke|lactoserum)/.test(t) && dried ? 0.12 : 0.04, 1, [], "dairy");
  if (speciesId === "insect") return info("insect", dried ? 0.55 : 0.18, 1, [], "insect");
  if (HYDRO_RE.test(t) && !/\bmeel\b/.test(t)) {
    // hydrolysed / extract / "protein" of a named source: concentrated, but not whole meat
    return info("animal_extract", /hydroly|hydroliz|digest/.test(t) ? 0.55 : 0.68, clarity, [], speciesId);
  }
  if (isFish) return info("fish", dried ? 0.65 : 0.17, clarity, [], speciesId);
  return info("meat", dried ? 0.62 : 0.18, clarity, [], speciesId);
}

export function classifyIngredient(rawName: string, sub = ""): IngredientInfo {
  const t = normalize(rawName);
  const u = normalize(`${rawName} ${sub}`);
  if (!t) return info("other", 0.03, 0);

  // 1. Oils first: "algenolie", "zalmolie", "zonnebloemolie", "kippenvet"
  const speciesInName = SPECIES.filter((s) => s.re.test(t));
  if (/(algen|algae|schizochytrium)/.test(t) && OIL_RE.test(t)) return info("fish_oil", 0, 1, ["omega3"], "algae");

  // 2. Additives that must not be confused with foods (e.g. "vitamine E" vs "rijst")
  for (const rule of ADDITIVE_RULES) {
    if (rule.re.test(t)) {
      // "calcium" in a sentence about a food ("calciumrijke ...") is still a mineral line - fine
      return info(rule.kind, 0, 1, rule.tags ?? []);
    }
  }

  // 3. Plant protein concentrates
  if (LEGUME_PROTEIN_RE.test(t)) return info("legume_protein", 0.78, 0.5, [], "plant_protein");
  if (CEREAL_PROTEIN_RE.test(t)) {
    const isNamed = speciesInName.some((s) => CEREAL_IDS.has(s.id));
    return info("cereal_protein", 0.72, isNamed ? 1 : 0.5, [], speciesInName.find((s) => CEREAL_IDS.has(s.id))?.id ?? "gluten");
  }

  // 4. Plant oils that contain a grain/legume name ("maisolie", "sojaolie")
  if (OIL_RE.test(t) && speciesInName.every((s) => s.family === "plant" || s.id === "fish")) {
    if (speciesInName.some((s) => s.id === "fish")) return info("fish_oil", 0, 1, ["omega3"], "fish");
    return info("plant_oil", 0, 1, []);
  }

  // 5a. "Meat and animal derivatives (consisting of chicken 3%)": the *label category* is what counts
  if (STARTS_GENERIC_RE.test(t)) return info("generic_animal", MEAL_RE.test(u) ? 0.6 : 0.14, 0);

  // 5b. Animal ingredients with a named source
  const animal = speciesInName.find((s) => s.family === "animal");
  if (animal) {
    // "granen (tarwe, mais)" style tokens are not animal; a lone species word wins
    return animalForm(t, u, animal.id, animal.clarity);
  }

  // 6. Unspecified animal ingredients
  if (ANIMAL_FAT_GENERIC_RE.test(t)) return info("animal_fat", 0, 0);
  if (ANIMAL_PROTEIN_GENERIC_RE.test(t)) return info("animal_extract", /hydroly/.test(t) ? 0.6 : 0.7, 0);
  if (ORGAN_RE.test(t)) return info("generic_animal", 0.16, 0.25);
  if (GENERIC_ANIMAL_RE.test(t)) {
    // wet foods list fresh by-products; dry foods list them dehydrated
    return info("generic_animal", MEAL_RE.test(u) ? 0.6 : 0.14, 0);
  }

  // 7. Plants
  if (VAGUE_PLANT_RE.test(t)) {
    if (/(bijproduct|by-?product|nebenerzeug|sous-produit)/.test(t)) return info("cereal", 0.08, 0, ["vague_plant"]);
    return info("cereal", 0.11, 0, ["vague_plant"]);
  }
  const plant = speciesInName[0];
  if (plant) {
    if (CEREAL_IDS.has(plant.id)) return info("cereal", plant.id === "rice" || plant.id === "corn" ? 0.08 : 0.12, 1, [], plant.id);
    if (plant.id === "soy" || plant.id === "legume") return info("legume", 0.22, 1, [], plant.id);
    if (plant.id === "potato") return info("tuber", 0.02, 1, [], "potato");
    if (plant.id === "yeast") return info("yeast", 0.4, 1, [], "yeast");
  }
  if (TUBER_RE.test(t)) return info("tuber", 0.03, 1);
  if (OIL_RE.test(t)) return info("plant_oil", 0, 1);
  if (FIBRE_RE.test(t)) return info("fibre", 0.05, 1, PREBIOTIC_RE.test(t) ? ["prebiotic"] : []);
  if (VEG_FRUIT_RE.test(t)) return info("veg_fruit", 0.02, 1);
  if (BOTANICAL_RE.test(t)) return info("botanical", 0.05, 1);

  // 8. The token itself was unrecognised: look at the words inside its brackets
  if (sub && u !== t) {
    const viaSub = classifyIngredient(sub, "");
    if (viaSub.kind !== "other") return { ...viaSub, clarity: Math.min(viaSub.clarity, 0.5) };
  }
  return info("other", 0.03, 0);
}

export const ANIMAL_KINDS = new Set<IngredientKind>([
  "meat",
  "fish",
  "egg",
  "dairy",
  "generic_animal",
  "animal_extract",
  "insect",
]);
/** kinds that contribute animal *protein* (fats, oils and broths do not) */
export function isAnimalProtein(kind: IngredientKind): boolean {
  return ANIMAL_KINDS.has(kind);
}
export const PLANT_PROTEIN_KINDS = new Set<IngredientKind>(["cereal_protein", "legume_protein"]);
export const CEREAL_KINDS = new Set<IngredientKind>(["cereal", "cereal_protein"]);

export function isCerealSpecies(id: string | undefined): boolean {
  return !!id && CEREAL_IDS.has(id);
}
