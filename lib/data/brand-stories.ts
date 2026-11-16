import type { Locale } from "../i18n/config";
import type { BrandSummary } from "./brands";

export interface BrandEditorial {
  origin?: string;
  text: Record<Locale, string>;
}

/**
 * Curated, independent editorial descriptions of well-known pet food brands.
 * Always neutral, factual, and paired on the page with our data-driven analysis.
 */
export const BRAND_STORIES: Record<string, BrandEditorial> = {
  acana: {
    origin: "Canada",
    text: {
      nl: "Acana is een Canadees merk (Champion Petfoods) dat bekendstaat om eiwitrijke honden- en kattenvoeding met een hoog aandeel genoemd vlees, gevogelte en vis. De meeste recepten zijn vrij van tarwe en maïs, al bevatten sommige lijnen wel peulvruchten of haver.",
      en: "Acana is a Canadian brand (Champion Petfoods) known for protein-rich dog and cat foods with a high share of named meat, poultry and fish. Most recipes avoid wheat and corn, though many use legumes or oats as their carbohydrate source.",
      de: "Acana ist eine kanadische Marke (Champion Petfoods), die für proteinreiches Hunde- und Katzenfutter mit hohem Anteil an deklariertem Fleisch, Geflügel und Fisch bekannt ist. Die meisten Rezepturen verzichten auf Weizen und Mais, enthalten aber oft Hülsenfrüchte oder Hafer.",
      fr: "Acana est une marque canadienne (Champion Petfoods) connue pour ses aliments riches en protéines avec une part importante de viande, volaille et poisson nommés. La plupart des recettes sont sans blé ni maïs, mais utilisent souvent des légumineuses ou de l’avoine.",
    },
  },
  orijen: {
    origin: "Canada",
    text: {
      nl: "Orijen (evenals Acana afkomstig van Champion Petfoods uit Canada) richt zich op het 'WholePrey'-principe: zeer vleesrijke, graanvrije recepten waarin vers en gedroogd spiervlees, orgaanvlees en kraakbeen de eerste plaatsen op de ingrediëntenlijst innemen.",
      en: "Orijen (made by Champion Petfoods in Canada) follows a 'WholePrey' philosophy: very meat-rich, grain-free recipes where fresh and dehydrated muscle meat, organs and cartilage make up the top ingredients.",
      de: "Orijen (ebenfalls von Champion Petfoods aus Kanada) verfolgt das „WholePrey“-Prinzip: sehr fleischreiche, getreidefreie Rezepturen, bei denen frisches und getrocknetes Muskelfleisch sowie Innereien ganz oben auf der Zutatenliste stehen.",
      fr: "Orijen (fabriqué au Canada par Champion Petfoods) suit le principe « WholePrey » : des recettes sans céréales très riches en viande où la viande fraîche et déshydratée ainsi que les abats occupent les premières places.",
    },
  },
  "royal-canin": {
    origin: "France",
    text: {
      nl: "Royal Canin is een van de grootste Europese fabrikanten van honden- en kattenvoer, met rasspecifieke lijnen, levensfase-voeding en dierenartsdieetvoer (Veterinary). De voedingswaarden zijn nauwkeurig afgestemd, maar op het etiket staan vaak algemene termen zoals 'gedehydreerde gevogelte-eiwitten' of 'plantaardige eiwitextracten'.",
      en: "Royal Canin is one of Europe's largest pet food manufacturers, offering breed-specific lines, life-stage formulas and veterinary prescription diets. While nutrient profiles are tightly controlled, labels frequently list broad terms such as 'dehydrated poultry protein' or 'vegetable protein isolate'.",
      de: "Royal Canin ist einer der größten europäischen Hersteller für Hunde- und Katzenfutter mit rassespezifischen Linien und Tierarztdiäten. Die Nährwerte sind präzise abgestimmt, auf dem Etikett finden sich jedoch oft Sammelbegriffe wie „Geflügelprotein“ oder „Pflanzenproteinisolat“.",
      fr: "Royal Canin est l’un des plus grands fabricants européens d’aliments pour chiens et chats, proposant des gammes par race, par âge et des régimes vétérinaires. Si les profils nutritionnels sont précis, les étiquettes mentionnent souvent des termes généraux comme « protéines de volaille déshydratées ».",
    },
  },
  "hill-s": {
    origin: "USA",
    text: {
      nl: "Hill's Pet Nutrition maakt onder andere Science Plan (dagelijks voer) en Prescription Diet (dierenartsvoer). Het merk leunt sterk op voedingsonderzoek en gecontroleerde mineralengehaltes; de standaardbrokken bevatten naast dierlijke bronnen vaak ook een flink aandeel maïs, tarwe of brouwersrijst.",
      en: "Hill's Pet Nutrition produces Science Plan (everyday food) and Prescription Diet (veterinary diets). The brand emphasizes clinical nutrition and controlled mineral levels, while its everyday kibble recipes often combine named meat meals with substantial amounts of corn, wheat or brewers' rice.",
      de: "Hill's Pet Nutrition stellt unter anderem Science Plan und Prescription Diet (Tierarztfutter) her. Die Marke setzt stark auf Ernährungsforschung und kontrollierte Mineralstoffgehalte; die Standard-Trockenfutter enthalten neben Fleischmehl oft auch viel Mais, Weizen oder Braureis.",
      fr: "Hill's Pet Nutrition produit notamment les gammes Science Plan et Prescription Diet (aliments vétérinaires). La marque met l’accent sur la recherche nutritionnelle, bien que ses croquettes classiques associent souvent des viandes nommées à une part importante de maïs, de blé ou de riz.",
    },
  },
  "edgard-en-cooper": {
    origin: "Belgium",
    text: {
      nl: "Edgard & Cooper is een Belgisch merk dat inzet op vers vlees of verse vis in plaats van sterk bewerkt vleesmeel, aangevuld met groenten, fruit en kruiden. De ingrediëntenlijsten zijn transparant uitgeschreven met duidelijke percentages.",
      en: "Edgard & Cooper is a Belgian pet food brand focusing on fresh meat and fish rather than heavily rendered meat meals, paired with vegetables, fruit and herbs. Their ingredient labels are transparently written with clear percentages.",
      de: "Edgard & Cooper ist eine belgische Marke, die auf frisches Fleisch und frischen Fisch statt stark verarbeitetem Fleischmehl setzt, ergänzt durch Gemüse, Obst und Kräuter. Die Zutatenlisten sind transparent mit klaren Prozentangaben deklariert.",
      fr: "Edgard & Cooper est une marque belge qui privilégie la viande et le poisson frais plutôt que les farines animales, accompagnés de légumes, fruits et herbes. Les listes d’ingrédients sont transparentes avec des pourcentages clairs.",
    },
  },
  carnilove: {
    origin: "Czech Republic",
    text: {
      nl: "Carnilove (van het Tsjechische VAFO) maakt graanvrije en aardappelvrije honden- en kattenvoeding met bijzondere dierlijke bronnen zoals rendier, eend, fazant, zalm en wild zwijn. Het vlees- en eiwitaandeel ligt doorgaans hoog.",
      en: "Carnilove (by Czech manufacturer VAFO) produces grain-free and potato-free dog and cat foods using distinctive animal proteins such as reindeer, duck, pheasant, salmon and wild boar, typically with a high meat and protein content.",
      de: "Carnilove (vom tschechischen Hersteller VAFO) produziert getreide- und kartoffelfreies Hunde- und Katzenfutter mit besonderen tierischen Proteinquellen wie Rentier, Ente, Fasan, Lachs und Wildschwein sowie einem hohen Fleischanteil.",
      fr: "Carnilove (du fabricant tchèque VAFO) propose des aliments sans céréales ni pomme de terre pour chiens et chats, à base de protéines animales variées comme le renne, le canard, le faisan, le saumon et le sanglier.",
    },
  },
  prins: {
    origin: "Netherlands",
    text: {
      nl: "Prins Petfoods is een Nederlands familiebedrijf uit Veenendaal dat zowel geperste brokken (ProCare), krokante brokken (ProCare Croque / VitalCare) als diepvries- en natvoer maakt, vrij van kunstmatige geur-, kleur- en smaakstoffen.",
      en: "Prins Petfoods is a Dutch family-owned company from Veenendaal producing cold-pressed kibble (ProCare), extruded kibble (ProCare Croque / VitalCare), wet food and frozen raw meals without artificial colours or flavours.",
      de: "Prins Petfoods ist ein niederländisches Familienunternehmen aus Veenendaal, das kaltgepresstes Trockenfutter (ProCare), krokettenförmiges Futter (VitalCare) sowie Nass- und Tiefkühlfutter ohne künstliche Farb- und Aromastoffe herstellt.",
      fr: "Prins Petfoods est une entreprise familiale néerlandaise qui fabrique des croquettes pressées à froid (ProCare), des croquettes extrudées (VitalCare) ainsi que des aliments humides et surgelés sans colorants ni arômes artificiels.",
    },
  },
  "farm-food": {
    origin: "Netherlands",
    text: {
      nl: "Farm Food is een Nederlands hondenvoermerk uit Nijverdal, vooral bekend om zijn koudgeperste brokken (Farm Food HE) en gestoomde / diepvries-versvleesmaaltijden op basis van rund en pens, zonder kunstmatige toevoegingen of gevogelte.",
      en: "Farm Food is a Dutch dog food brand best known for its cold-pressed pellets (Farm Food HE) and steamed or frozen fresh meat meals based on beef and tripe, made without artificial additives or poultry.",
      de: "Farm Food ist eine niederländische Hundefuttermarke, die vor allem für ihr kaltgepresstes Futter (Farm Food HE) sowie gedämpfte und tiefgekühlte Frischfleischmahlzeiten auf Rind- und Pansenbasis ohne Geflügel bekannt ist.",
      fr: "Farm Food est une marque néerlandaise d’aliments pour chiens connue pour ses granulés pressés à froid (Farm Food HE) et ses repas à base de bœuf et de tripes, sans additifs artificiels ni volaille.",
    },
  },
  applaws: {
    origin: "UK",
    text: {
      nl: "Applaws staat bekend om twee heel verschillende productlijnen: zeer vleesrijke, graanvrije droogvoeding (volledig voer) én pure blikjes/kuipjes met filet in bouillon die vaak aanvullend diervoeder zijn (bedoeld om te combineren met een volledig voer).",
      en: "Applaws is known for two distinct lines: meat-rich, grain-free dry kibble (complete food) and simple tins/pouches of meat or fish fillets in broth, many of which are complementary foods meant to be fed alongside a complete diet.",
      de: "Applaws ist für zwei unterschiedliche Produktlinien bekannt: fleischreiches, getreidefreies Trockenfutter (Alleinfutter) sowie naturbelassene Dosen und Beutel mit Filetstücken in Brühe, die häufig Ergänzungsfutter sind.",
      fr: "Applaws est connu pour deux gammes distinctes : des croquettes sans céréales très riches en viande (aliment complet) et des boîtes/sachets de filets au bouillon qui sont souvent des aliments complémentaires.",
    },
  },
  "almo-nature": {
    origin: "Italy",
    text: {
      nl: "Almo Nature is een Italiaans merk (eigendom van de non-profit Fondazione Capellino) met onder meer de HFC-lijn (ingrediënten die oorspronkelijk geschikt waren voor menselijke consumptie) en de Holistic-lijn. Let bij de blikjes goed op het verschil tussen volledig en aanvullend voer.",
      en: "Almo Nature is an Italian brand (owned by the non-profit Fondazione Capellino) offering the HFC line (ingredients originally fit for human consumption) and the Holistic range. With their tins and pouches, check whether a recipe is complete or complementary.",
      de: "Almo Nature ist eine italienische Marke (im Besitz der gemeinnützigen Fondazione Capellino) mit der HFC-Linie (Zutaten in Lebensmittelqualität) und der Holistic-Reihe. Bei den Dosen lohnt sich ein Blick darauf, ob es sich um Allein- oder Ergänzungsfutter handelt.",
      fr: "Almo Nature est une marque italienne (détenue par la fondation à but non lucratif Fondazione Capellino) proposant notamment la gamme HFC et la gamme Holistic. Pour les boîtes, vérifiez s’il s’agit d’un aliment complet ou complémentaire.",
    },
  },
  whiskas: {
    origin: "UK / Global",
    text: {
      nl: "Whiskas (onderdeel van Mars Petcare) is een van de bekendste supermarktmerken voor kattenvoer. De voeding is breed verkrijgbaar en betaalbaar, maar bevat in veel recepten niet-gespecificeerde dierlijke bijproducten, granen en soms toegevoegde suikers.",
      en: "Whiskas (part of Mars Petcare) is one of the best-known supermarket cat food brands. While widely available and affordable, many recipes rely on unspecified meat and animal derivatives, cereals and sometimes added sugars.",
      de: "Whiskas (Teil von Mars Petcare) ist eine der bekanntesten Supermarktmarken für Katzenfutter. Die Produkte sind günstig und überall erhältlich, enthalten jedoch oft nicht näher deklarierte tierische Nebenerzeugnisse, Getreide und teilweise Zucker.",
      fr: "Whiskas (groupe Mars Petcare) est l’une des marques de supermarché les plus connues pour chats. Abordables et faciles à trouver, ses recettes utilisent toutefois souvent des sous-produits animaux non précisés, des céréales et parfois des sucres ajoutés.",
    },
  },
  felix: {
    origin: "Global",
    text: {
      nl: "Felix (onderdeel van Nestlé Purina) maakt populaire maaltijdzakjes, blikvoer en snacks voor katten. De maaltijdzakjes zijn volledig en vochtrijk, maar het etiket vermeldt meestal algemene 'vlees en dierlijke bijproducten' en een klein beetje suiker voor de kleur en smaak.",
      en: "Felix (part of Nestlé Purina) makes popular wet pouches, tins and treats for cats. While the wet pouches are complete and moisture-rich, labels typically list generic 'meat and animal derivatives' along with added sugars.",
      de: "Felix (Teil von Nestlé Purina) stellt beliebte Portionsbeutel, Dosen und Snacks für Katzen her. Die Nassfutter sind zwar Alleinfuttermittel mit viel Feuchtigkeit, deklarieren aber meist allgemeine „Fleisch und tierische Nebenerzeugnisse“ sowie Zucker.",
      fr: "Felix (groupe Nestlé Purina) propose des sachets fraîcheur, boîtes et friandises très populaires pour chats. Les sachets sont complets et riches en eau, mais mentionnent généralement des « viandes et sous-produits animaux » génériques et des sucres.",
    },
  },
  gourmet: {
    origin: "Global",
    text: {
      nl: "Gourmet (van Nestlé Purina, met lijnen als Gold, Perle en Revelations) richt zich op kleine portieblikjes en zakjes voor fijnproevers. Net als bij andere supermarkt-natvoeders bestaat de samenstelling vaak uit algemene dierlijke bijproducten en toegevoegde suikers.",
      en: "Gourmet (by Nestlé Purina, including Gold, Perle and Revelations) focuses on small tins and pouches for picky cats. Like many supermarket wet foods, recipes often use unspecified animal derivatives and small amounts of sugar.",
      de: "Gourmet (von Nestlé Purina, mit Linien wie Gold, Perle und Revelations) bietet kleine Dosen und Beutel für wählerische Katzen an. Wie bei vielen Supermarkt-Nassfuttern bestehen die Rezepturen oft aus allgemeinen tierischen Nebenerzeugnissen und Zucker.",
      fr: "Gourmet (Nestlé Purina, gammes Gold, Perle, Revelations) propose de petites boîtes et sachets pour chats exigeants. Comme beaucoup de pâtées de supermarché, les recettes contiennent souvent des sous-produits animaux non précisés et des sucres.",
    },
  },
  sheba: {
    origin: "Global",
    text: {
      nl: "Sheba (Mars Petcare) maakt natvoer voor katten in kuipjes en maaltijdzakjes. Veel varianten zijn volledig diervoeder zonder kunstmatige kleurstoffen, al wordt op het etiket meestal gewerkt met algemene groepsnamen ('vlees en dierlijke bijproducten').",
      en: "Sheba (Mars Petcare) produces cat wet food in trays and pouches. Most varieties are complete meals without artificial colourants, though labels usually rely on category terms such as 'meat and animal derivatives'.",
      de: "Sheba (Mars Petcare) stellt Nassfutter für Katzen in Schälchen und Beuteln her. Die meisten Sorten sind Alleinfuttermittel ohne künstliche Farbstoffe, verwenden auf dem Etikett aber meist Sammelbegriffe wie „Fleisch und tierische Nebenerzeugnisse“.",
      fr: "Sheba (Mars Petcare) produit des aliments humides pour chats en barquettes et sachets. La plupart sont des aliments complets sans colorants artificiels, mais l’étiquette utilise généralement des termes génériques (« viandes et sous-produits animaux »).",
    },
  },
  "pro-plan": {
    origin: "Global",
    text: {
      nl: "Purina Pro Plan is de premium- en dierenartslijn van Nestlé Purina voor honden en katten. In vergelijking met supermarktmerken staat er vaker een genoemd eerste ingrediënt (zoals kip, zalm of lam) op de zak, gecombineerd met granen of rijst.",
      en: "Purina Pro Plan is Nestlé Purina's specialist and veterinary range for dogs and cats. Compared with supermarket lines, recipes more often open with a named animal source (such as chicken, salmon or lamb) paired with rice or grains.",
      de: "Purina Pro Plan ist die Fachhandels- und Tierarztlinie von Nestlé Purina für Hunde und Katzen. Im Vergleich zu Supermarktmarken steht häufiger eine klar benannte tierische Zutat (wie Huhn, Lachs oder Lamm) an erster Stelle.",
      fr: "Purina Pro Plan est la gamme spécialisée et vétérinaire de Nestlé Purina pour chiens et chats. Par rapport aux gammes de supermarché, les recettes commencent plus souvent par un ingrédient animal nommé (poulet, saumon ou agneau).",
    },
  },
  "purina-one": {
    origin: "Global",
    text: {
      nl: "Purina ONE is het middenklasse-assortiment van Nestlé Purina dat in supermarkten en dierenwinkels ligt. Het eerste ingrediënt is vaak bij naam genoemd (bijv. kip of zalm), gevolgd door tarwe, maïs en gedroogde gevogelte-eiwitten.",
      en: "Purina ONE is Nestlé Purina's mid-range line sold in supermarkets and pet shops. The first ingredient is usually named (e.g. chicken or salmon), followed by wheat, corn and dehydrated poultry proteins.",
      de: "Purina ONE ist die Mittelklasse-Linie von Nestlé Purina im Supermarkt und Fachhandel. Die erste Zutat ist meist namentlich genannt (z. B. Huhn oder Lachs), gefolgt von Weizen, Mais und getrocknetem Geflügelprotein.",
      fr: "Purina ONE est la gamme intermédiaire de Nestlé Purina vendue en supermarché et animalerie. Le premier ingrédient est généralement nommé (poulet ou saumon), suivi de blé, de maïs et de protéines de volaille déshydratées.",
    },
  },
  bozita: {
    origin: "Sweden",
    text: {
      nl: "Bozita is een Zweeds merk dat zowel natvoer (bekend van de Tetra Recart-pakjes en maaltijdzakjes met o.a. rendier en eland) als droogvoer voor honden en katten maakt, onder de strenge Zweedse dierenwelzijns- en voedselveiligheidsregels.",
      en: "Bozita is a Swedish pet food brand producing wet food (famous for its Tetra Recart cartons and pouches featuring Nordic ingredients like reindeer and elk) and dry kibble for dogs and cats under strict Swedish animal welfare standards.",
      de: "Bozita ist eine schwedische Marke, die Nassfutter (bekannt für die Tetra-Recart-Packungen und Beutel mit Rentier oder Elch) sowie Trockenfutter für Hunde und Katzen nach strengen schwedischen Tierschutzstandards herstellt.",
      fr: "Bozita est une marque suédoise qui fabrique des aliments humides (connus pour leurs briques Tetra Recart et sachets au renne ou à l’élan) et des croquettes pour chiens et chats selon les normes suédoises strictes.",
    },
  },
  brit: {
    origin: "Czech Republic",
    text: {
      nl: "Brit (VAFO, Tsjechië) maakt onder meer Brit Care (vaak graanvrij of hypoallergeen met één of twee dierlijke bronnen) en Brit Premium (betaalbaarder, met hoog vleesgehalte en een deel tarwe of rijst) voor honden en katten.",
      en: "Brit (by VAFO in the Czech Republic) produces Brit Care (often grain-free or hypoallergenic formulas with clearly named animal proteins) and Brit Premium (an accessible line combining high meat content with rice or wheat).",
      de: "Brit (VAFO, Tschechien) stellt unter anderem Brit Care (oft getreidefrei oder hypoallergen mit klar benannten Tierproteinen) und Brit Premium (preisgünstiger, mit hohem Fleischanteil und Reis oder Weizen) für Hunde und Katzen her.",
      fr: "Brit (VAFO, République tchèque) produit notamment les gammes Brit Care (souvent sans céréales ou hypoallergénique avec des protéines animales nommées) et Brit Premium pour chiens et chats.",
    },
  },
  carocroc: {
    origin: "Netherlands",
    text: {
      nl: "CaroCroc is een vertrouwd Nederlands brokkenmerk uit Veghel voor honden en katten. De recepten zijn overzichtelijk en zonder kunstmatige kleur-, geur- en smaakstoffen, met naast dierlijke eiwitten een basis van granen (maïs, tarwe of rijst).",
      en: "CaroCroc is an established Dutch kibble brand from Veghel for dogs and cats. Recipes are straightforward and free from artificial colours or flavours, combining animal proteins with traditional grains like corn, wheat or rice.",
      de: "CaroCroc ist eine traditionsreiche niederländische Trockenfuttermarke für Hunde und Katzen ohne künstliche Farb- und Aromastoffe, die tierische Proteine mit klassischen Getreidesorten wie Mais, Weizen oder Reis kombiniert.",
      fr: "CaroCroc est une marque néerlandaise de croquettes pour chiens et chats sans colorants ni arômes artificiels, associant protéines animales et céréales classiques (maïs, blé ou riz).",
    },
  },
  renske: {
    origin: "Netherlands",
    text: {
      nl: "Renske Natuurlijke Diervoeding is een Nederlands merk uit Cuijk dat bekend werd met zijn gestoomde versvleesmaaltijden in kuipjes en daarnaast geperste en krokante brokken met vers vlees of verse vis (zoals de Super Premium en Mighty Omega-lijnen) maakt.",
      en: "Renske Natural Petfood is a Dutch brand from Cuijk best known for its gently steamed fresh meat trays as well as cold-pressed and extruded kibble made with fresh meat or fish (including the Super Premium and Mighty Omega ranges).",
      de: "Renske ist eine niederländische Marke aus Cuijk, die für ihre schonend gedämpften Frischfleisch-Schälchen sowie kaltgepresstes und extrudiertes Trockenfutter mit frischem Fleisch oder Fisch bekannt ist.",
      fr: "Renske est une marque néerlandaise connue pour ses barquettes de viande fraîche cuite à la vapeur ainsi que ses croquettes pressées et extrudées à base de viande ou de poisson frais.",
    },
  },
  riverwood: {
    origin: "Netherlands",
    text: {
      nl: "Riverwood is een Nederlands merk dat zich richt op graanvrije en glutenvrije honden- en kattenvoeding. Elke variant combineert drie vrijloop-eiwitbronnen (zoals hert, lam en konijn of zalm, witvis en haring) met gele erwten en kruiden.",
      en: "Riverwood is a Dutch brand specializing in grain-free and gluten-free dog and cat food. Its kibble recipes typically combine three free-range animal protein sources (such as venison, lamb and rabbit) with yellow peas and botanicals.",
      de: "Riverwood ist eine niederländische Marke für getreide- und glutenfreies Hunde- und Katzenfutter. Die Rezepturen kombinieren meist drei tierische Proteinquellen aus Freilandhaltung mit gelben Erbsen und Kräutern.",
      fr: "Riverwood est une marque néerlandaise spécialisée dans l’alimentation sans céréales ni gluten pour chiens et chats, associant généralement trois sources de protéines animales à des pois jaunes et des herbes.",
    },
  },
  smolke: {
    origin: "Netherlands",
    text: {
      nl: "Smølke is een Nederlands merk dat complete honden- en kattenvoeding maakt met een eigen 'All-in-One' eiwitprofiel van kip, vis en lam, zonder kunstmatige geur-, kleur- en smaakstoffen en met zowel reguliere als graanvrije en Soft Paté-lijnen.",
      en: "Smølke is a Dutch pet food brand offering dog and cat recipes built around a signature blend of chicken, fish and lamb, free from artificial colours or flavours, available in regular, grain-free and Soft Paté lines.",
      de: "Smølke ist eine niederländische Marke für Hunde- und Katzenfutter mit einer Kombination aus Huhn, Fisch und Lamm ohne künstliche Farb- und Aromastoffe, erhältlich als klassisches, getreidefreies und Soft-Paté-Futter.",
      fr: "Smølke est une marque néerlandaise d’aliments pour chiens et chats élaborée autour d’un mélange de poulet, poisson et agneau, sans colorants ni arômes artificiels, déclinée en gammes classiques, sans céréales et pâtées.",
    },
  },
  yarrah: {
    origin: "Netherlands",
    text: {
      nl: "Yarrah (opgericht in 1992 in Nederland) is Europa's oudste merk voor 100% gecertificeerd biologisch honden- en kattenvoer. Het assortiment omvat biologische brokken, paté en chunks in blik/kuipje, én een volledig plantaardige hondenbrok.",
      en: "Founded in the Netherlands in 1992, Yarrah is Europe's pioneer in certified organic dog and cat food. Their range includes organic kibble, wet paté and chunks in tins/trays, as well as a vegetarian dog food recipe.",
      de: "Yarrah (1992 in den Niederlanden gegründet) ist Europas Pionier für zertifiziertes Bio-Hunde- und Katzenfutter. Das Sortiment umfasst Bio-Trockenfutter, Nassfutter sowie ein rein pflanzliches Hundefutter.",
      fr: "Fondée aux Pays-Bas en 1992, Yarrah est la marque pionnière en Europe de l’alimentation biologique certifiée pour chiens et chats, proposant croquettes bio, pâtées et une recette végétarienne pour chiens.",
    },
  },
  "lily-s-kitchen": {
    origin: "UK",
    text: {
      nl: "Lily's Kitchen is een Brits merk (inmiddels B Corp gecertificeerd) dat nat- en droogvoer voor honden en katten maakt met vers bereid vlees, orgaanvlees en groenten, zonder vleesmeel van onbekende herkomst of toegevoegde suikers.",
      en: "Lily's Kitchen is a British B Corp brand making wet and dry dog and cat food using freshly prepared meat, nutritious organs and vegetables, without unspecified meat meals or added sugars.",
      de: "Lily's Kitchen ist eine britische Marke (B-Corp-zertifiziert), die Nass- und Trockenfutter für Hunde und Katzen mit frisch zubereitetem Fleisch, Innereien und Gemüse ohne Zuckerzusatz herstellt.",
      fr: "Lily's Kitchen est une marque britannique (certifiée B Corp) qui prépare des aliments humides et secs pour chiens et chats avec de la viande fraîchement préparée, des abats et des légumes, sans sucres ajoutés.",
    },
  },
  amanova: {
    origin: "Spain",
    text: {
      nl: "Amanova is een Spaans premiummerk (Visán) dat zijn honden- en kattenbrokken in eigen keuken bereidt met uitsluitend vers vlees of verse vis (vaak één dierlijke eiwitbron voor gevoelige dieren) en zonder vleesmeel.",
      en: "Amanova is a Spanish brand (by Visán) that prepares its dog and cat foods in its own kitchen using fresh meat or fish—often as single-protein hypoallergenic recipes—without rendered meat meals.",
      de: "Amanova ist eine spanische Marke (Visán), die ihr Hunde- und Katzenfutter in eigener Küche mit frischem Fleisch oder Fisch – oft als Monoprotein-Rezeptur für sensible Tiere – herstellt.",
      fr: "Amanova est une marque espagnole (Visán) qui cuisine ses aliments pour chiens et chats avec de la viande ou du poisson frais, souvent en recettes monoprotéiques pour animaux sensibles.",
    },
  },
  "bf-petfood": {
    origin: "NL",
    text: {
      nl: "BF®Petfood (voorheen Biofood) is een Nederlands familiebedrijf uit Friesland dat sinds 1989 natuurlijke honden- en kattenvoeding en supplementen maakt, waaronder koudgeperste brokken, gestoomde vleesmaaltijden en EU-biologische voeding.",
      en: "BF®Petfood (formerly Biofood) is a Dutch family business from Friesland crafting natural dog and cat food and supplements since 1989, including cold-pressed kibble, steamed meat meals and EU-organic recipes.",
      de: "BF®Petfood (ehemals Biofood) ist ein niederländisches Familienunternehmen aus Friesland, das seit 1989 natürliches Hunde- und Katzenfutter sowie Nahrungsergänzungsmittel herstellt – von kaltgepresstem Trockenfutter bis zu EU-Bio-Menüs.",
      fr: "BF®Petfood (anciennement Biofood) est une entreprise familiale néerlandaise de Frise qui fabrique depuis 1989 des aliments naturels et compléments pour chiens et chats, dont des croquettes pressées à froid et des recettes bio.",
    },
  },
  "wellness-core": {
    origin: "USA",
    text: {
      nl: "Wellness CORE is de graanvrije, eiwitrijke lijn van Wellness Pet Company voor honden en katten, waarbij vers vlees of verse vis altijd het eerste ingrediënt vormt.",
      en: "Wellness CORE is Wellness Pet Company's grain-free, protein-focused line for dogs and cats, formulated with fresh meat or fish as the first ingredient.",
      de: "Wellness CORE ist die getreidefreie, proteinreiche Linie von Wellness Pet Company für Hunde und Katzen, bei der frisches Fleisch oder frischer Fisch stets an erster Stelle steht.",
      fr: "Wellness CORE est la gamme sans céréales et riche en protéines de Wellness Pet Company pour chiens et chats, avec de la viande ou du poisson frais en premier ingrédient.",
    },
  },
};

/**
 * Build a warm, transparent editorial summary for ANY brand on Scanabowl, combining a curated brand story
 * (when available) with live facts from our database.
 */
export function getBrandStory(b: BrandSummary, lang: Locale): { curated: string | null; origin: string | null; dataSummary: string } {
  const entry = BRAND_STORIES[b.slug];
  const curated = entry?.text[lang] ?? null;
  const origin = entry?.origin ?? null;

  const hasDog = (b.dog?.count ?? 0) > 0;
  const hasCat = (b.cat?.count ?? 0) > 0;
  const gfPct = b.count > 0 ? Math.round((b.grainFreeCount / b.count) * 100) : 0;
  const anPct = b.avgAnimalProtein;

  if (lang === "nl") {
    const target = hasDog && hasCat ? "zowel honden als katten" : hasDog ? "honden" : "katten";
    const parts = [
      `In de Scanabowl-database staan **${b.count} producten** van ${b.name} voor ${target} (${b.scored} met een volledige score).`,
    ];
    if (b.avg !== null && b.best !== null) {
      parts.push(`Gemiddeld scoort het beoordeelde assortiment **${b.avg}/100**, met een hoogste score van **${b.best}/100**${b.lowest !== null && b.lowest !== b.best ? ` en een laagste score van **${b.lowest}/100**` : ""}.`);
    }
    if (anPct !== null) {
      parts.push(`Gemiddeld komt circa **${anPct}%** van het eiwit in de beoordeelde recepten uit dierlijke ingrediënten${gfPct > 0 ? `, en **${gfPct}%** van het assortiment is graanvrij` : ""}.`);
    }
    return { curated, origin, dataSummary: parts.join(" ") };
  }

  if (lang === "de") {
    const target = hasDog && hasCat ? "Hunde und Katzen" : hasDog ? "Hunde" : "Katzen";
    const parts = [
      `In der Scanabowl-Datenbank befinden sich **${b.count} Produkte** von ${b.name} für ${target} (${b.scored} davon mit vollständiger Bewertung).`,
    ];
    if (b.avg !== null && b.best !== null) {
      parts.push(`Im Durchschnitt erreicht das bewertete Sortiment **${b.avg}/100** Punkte, mit einem Höchstwert von **${b.best}/100**${b.lowest !== null && b.lowest !== b.best ? ` und einem Tiefstwert von **${b.lowest}/100**` : ""}.`);
    }
    if (anPct !== null) {
      parts.push(`Durchschnittlich stammen etwa **${anPct}%** des Proteins aus tierischen Zutaten${gfPct > 0 ? `, und **${gfPct}%** der Produkte sind getreidefrei` : ""}.`);
    }
    return { curated, origin, dataSummary: parts.join(" ") };
  }

  if (lang === "fr") {
    const target = hasDog && hasCat ? "chiens et chats" : hasDog ? "chiens" : "chats";
    const parts = [
      `La base de données Scanabowl compte **${b.count} produits** ${b.name} pour ${target} (dont ${b.scored} notés).`,
    ];
    if (b.avg !== null && b.best !== null) {
      parts.push(`La gamme notée obtient une moyenne de **${b.avg}/100**, avec une note maximale de **${b.best}/100**${b.lowest !== null && b.lowest !== b.best ? ` et une note minimale de **${b.lowest}/100**` : ""}.`);
    }
    if (anPct !== null) {
      parts.push(`En moyenne, environ **${anPct}%** des protéines proviennent d’ingrédients animaux${gfPct > 0 ? `, et **${gfPct}%** des recettes sont sans céréales` : ""}.`);
    }
    return { curated, origin, dataSummary: parts.join(" ") };
  }

  // English default
  const target = hasDog && hasCat ? "both dogs and cats" : hasDog ? "dogs" : "cats";
  const parts = [
    `The Scanabowl database includes **${b.count} products** from ${b.name} for ${target} (${b.scored} with a full nutritional score).`,
  ];
  if (b.avg !== null && b.best !== null) {
    parts.push(`Across rated recipes, ${b.name} averages **${b.avg}/100**, ranging from **${b.lowest ?? b.best}/100** up to **${b.best}/100**.`);
  }
  if (anPct !== null) {
    parts.push(`On average, an estimated **${anPct}%** of the protein in rated recipes comes from animal sources${gfPct > 0 ? `, and **${gfPct}%** of the range is grain-free` : ""}.`);
  }
  return { curated, origin, dataSummary: parts.join(" ") };
}
