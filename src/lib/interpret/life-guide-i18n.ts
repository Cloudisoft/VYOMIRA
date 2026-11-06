import type { Planet } from "@/lib/astro/constants";

/**
 * Life Guide wording in English, Hindi (Devanagari) and Hinglish (Hindi in Roman script).
 * Written by hand — not machine-translated — so it reads naturally in each language.
 */
export type Lang = "en" | "hi" | "hinglish";
export type AreaKey = "career" | "business" | "love" | "family" | "money" | "fortune" | "health" | "learning";
export type Rating = "strong" | "active" | "challenging" | "quiet";

type PerPlanet = Record<Planet, string>;
type PerArea<T> = Record<AreaKey, T>;

export interface Dict {
  planet: PerPlanet;
  title: PerPlanet; // chapter title per planet
  gist: PerPlanet; // what the planet's period brings
  house: Record<number, string>; // short life-area label per house
  area: PerArea<string>;
  rating: Record<Rating, string>;
  /** prediction sentence per area per rating (present or future tense neutral) */
  predict: PerArea<Record<Rating, string>>;
  tip: PerArea<Record<"strong" | "active" | "challenging", string>>;
  habits: Record<Planet, string[]>;
  day: PerPlanet;
  colour: PerPlanet;
  giving: PerPlanet;
  stone: PerPlanet;
  months: string[];
  t: {
    headline: (name: string, mood: string, title: string, from: number, to: number) => string;
    headlineSub: (planet: string, gist: string, until: string) => string;
    mood: Record<"supportive" | "mixed" | "demanding", string>;
    chapterSummary: (planet: string, gist: string, house: string, rules: string) => string;
    rulesJoin: (list: string) => string;
    and: string;
    jupGood: (house: string) => string;
    jupOther: (n: string, house: string) => string;
    sadeSati: (phase: string) => string;
    phase: Record<"rising" | "peak" | "setting", string>;
    satGood: string;
    satHard: (n: string, what: string) => string;
    satHome: string;
    satResilience: string;
    satOther: (n: string, house: string) => string;
    rahuGood: string;
    subBegins: (planet: string) => string;
    subText: (when: string, gist: string, house: string) => string;
    newChapter: (planet: string) => string;
    newChapterText: (year: number, title: string) => string;
    enters: (planet: string, sign: string) => string;
    jupEnterGood: (house: string) => string;
    jupEnterOther: (house: string) => string;
    satEnter12: string;
    satEnter1: string;
    satEnter2: string;
    satEnterGood: string;
    satEnterOther: (house: string) => string;
    rahuEnter: (house: string) => string;
    periodOf: (md: string, ad: string) => string;
    jupiterWindow: (house: string) => string;
    remedyMain: (planet: string, year: number) => string;
    remedySub: (planet: string, until: string) => string;
    remedySadeSati: string;
    caveat: string;
    gemCaution: string;
  };
  signs: string[];
}

const P: Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const rec = (vals: string[]): PerPlanet => Object.fromEntries(P.map((p, i) => [p, vals[i]])) as PerPlanet;

const en: Dict = {
  planet: rec(P),
  title: rec(["Stepping into your own light", "Home, heart and feelings", "Action, courage and drive", "Learning, skills and communication", "Growth, wisdom and opportunity", "Love, comfort and creativity", "Hard work that builds lasting results", "Big ambitions and new territory", "Letting go and looking inward"]),
  gist: rec(["confidence, recognition and taking charge", "emotions, family, comfort and connecting with people", "energy, ambition, property and getting things done", "study, business, writing, networking and quick thinking", "learning, good guidance, family growth and expanding horizons", "relationships, beauty, art, comfort and enjoying life", "discipline, responsibility, patience and steady progress", "ambition, technology, foreign connections and unconventional paths", "detachment, intuition, research and spiritual growth"]),
  house: { 1: "you and your health", 2: "money and family", 3: "courage and skills", 4: "home and peace of mind", 5: "creativity, romance and children", 6: "daily work and health habits", 7: "partnership and marriage", 8: "big life changes", 9: "luck and higher learning", 10: "career and reputation", 11: "income and friendships", 12: "travel, rest and spirituality" },
  area: { career: "Career & job", business: "Business & partnerships", love: "Love & marriage", family: "Family & home", money: "Money & wealth", fortune: "Luck & fortune", health: "Health & energy", learning: "Education & learning" },
  rating: { strong: "Strong", active: "Active", challenging: "Needs care", quiet: "Quiet" },
  predict: {
    career: { strong: "A strong phase for career — traditionally a time for promotion, recognition or a better job.", active: "Career is busy and changing — new responsibilities or a shift in role are likely.", challenging: "Career needs patience — pressure at work, slower growth or a role that tests you.", quiet: "A steady, low-key phase for career — keep building skills." },
    business: { strong: "Good timing for business — new deals, partnerships and expansion tend to work out.", active: "Business is active — opportunities come with effort; read every agreement carefully.", challenging: "Be careful in business — avoid big investments, risky partners or signing in a hurry.", quiet: "Business stays steady — a good time to plan rather than launch." },
    love: { strong: "A strong phase for love — relationships deepen, and traditionally this is a time for marriage or commitment.", active: "Relationships are in focus — meeting someone new or important conversations with a partner.", challenging: "Relationships need patience — misunderstandings or distance are possible; talk openly.", quiet: "Love life is calm — fewer big events, more everyday comfort." },
    family: { strong: "Happy times at home — family events, celebrations or buying/improving a home are favoured.", active: "Family life is busy — moves, renovations or new responsibilities at home.", challenging: "Some strain at home — a family member may need extra support; stay patient.", quiet: "Home life is settled and peaceful." },
    money: { strong: "A good phase for money — income can rise and savings grow.", active: "Money moves a lot — both income and expenses increase; budget carefully.", challenging: "Watch your finances — unexpected expenses are possible; avoid lending or speculation.", quiet: "Finances are stable — steady saving works best." },
    fortune: { strong: "Luck is on your side — help from mentors, blessings and lucky breaks come more easily.", active: "Travel, learning or spiritual interests open doors.", challenging: "Luck feels slower — results come through effort rather than chance.", quiet: "An ordinary phase for luck — rely on steady effort." },
    health: { strong: "Good energy — a great time to build healthy routines that last.", active: "Energy goes up and down — keep sleep and food regular.", challenging: "Look after yourself — stress or tiredness can build up; rest and check-ups help.", quiet: "Health and energy stay steady." },
    learning: { strong: "Excellent for studies and exams — learning comes easily and new courses pay off.", active: "A busy learning phase — new subjects, courses or skills.", challenging: "Studies need extra discipline — distractions are likely; keep a fixed routine.", quiet: "A calm phase for learning — revise and consolidate." },
  },
  tip: {
    career: { strong: "Ask for the role, apply for the promotion, make yourself visible.", active: "Say yes to responsibility, but write down what's expected.", challenging: "Don't quit in frustration — build skills and keep proof of your work." },
    business: { strong: "Launch, expand or sign the partnership you've been planning.", active: "Test ideas small before scaling up.", challenging: "Protect cash; postpone big investments and read the fine print." },
    love: { strong: "Say what you feel; if you're planning marriage, this is good timing.", active: "Spend real time together; listen before reacting.", challenging: "Give each other space; avoid decisions made in anger." },
    family: { strong: "Plan family events or home improvements now.", active: "Share household responsibilities clearly.", challenging: "Be patient with family; small acts of care go a long way." },
    money: { strong: "Save and invest sensibly; start a side income.", active: "Track spending monthly and build an emergency fund.", challenging: "Avoid loans, lending and speculation; protect what you have." },
    fortune: { strong: "Seek mentors, travel and take the opportunity in front of you.", active: "Learn something new or plan a meaningful trip.", challenging: "Keep faith and keep working; shortcuts won't help now." },
    health: { strong: "Start the fitness or sleep habit you've been postponing.", active: "Keep fixed meal and sleep times.", challenging: "Rest well and get regular check-ups; don't push through exhaustion." },
    learning: { strong: "Enrol in that course or take the exam now.", active: "Make a weekly study plan and stick to it.", challenging: "Study in short focused blocks and remove distractions." },
  },
  habits: {
    Sun: ["Wake early and get morning sunlight", "Take ownership — lead one thing well", "Respect and reconnect with father figures or mentors"],
    Moon: ["Protect your sleep and keep a calm evening routine", "Spend time near water or in nature", "Call your mother or someone who nurtures you"],
    Mars: ["Exercise regularly — channel the energy physically", "Pause before reacting when angry", "Finish one practical project you've been delaying"],
    Mercury: ["Learn a new skill or take a short course", "Write things down and double-check contracts", "Keep your word on small commitments"],
    Jupiter: ["Find a mentor — or become one", "Read or study something meaningful each week", "Be generous with knowledge and time"],
    Venus: ["Make time for art, music or beauty", "Appreciate your partner out loud", "Keep spending on comfort within budget"],
    Saturn: ["Build a fixed daily routine and keep it", "Be patient — slow progress is still progress", "Serve others: help elders, workers or the less fortunate"],
    Rahu: ["Limit screen time and avoid shortcuts", "Ground big ambitions in a written plan", "Stay away from intoxicants and get-rich-quick schemes"],
    Ketu: ["Meditate or sit quietly for a few minutes daily", "Declutter — let go of what you don't need", "Follow your intuition, but verify the facts"],
  },
  day: rec(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Saturday", "Tuesday"]),
  colour: rec(["Saffron, gold", "White, silver", "Red, coral", "Green", "Yellow", "White, pastel pink", "Dark blue, black", "Smoky grey", "Grey, earthy tones"]),
  giving: rec(["Wheat or jaggery to those in need", "Rice, milk or white clothes", "Red lentils (masoor) or help with physical work", "Green moong dal, books or stationery for students", "Turmeric, chana dal or support for a teacher", "Sweets, perfume or clothes to women in need", "Mustard oil, black sesame or food for workers", "Help at an animal shelter or donate blankets", "Feed stray dogs or support a spiritual cause"]),
  stone: rec(["Ruby", "Pearl", "Red coral", "Emerald", "Yellow sapphire", "Diamond or white sapphire", "Blue sapphire", "Hessonite (gomed)", "Cat's eye"]),
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  signs: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  t: {
    headline: (n, m, ti, a, b) => `${n}, you're in ${m} chapter: "${ti}" (${a}–${b}).`,
    headlineSub: (p, g, u) => ` Right now ${p} adds a flavour of ${g} until ${u}.`,
    mood: { supportive: "a generally supportive", mixed: "a mixed, growth-oriented", demanding: "a demanding but character-building" },
    chapterSummary: (p, g, h, r) => `${p}'s years bring ${g}. In your chart ${p} sits in the area of ${h}${r}.`,
    rulesJoin: (l) => `, and it also shapes ${l}`,
    and: "and",
    jupGood: (h) => `Jupiter, the planet of growth, is in a helpful position for you — it supports ${h}.`,
    jupOther: (n, h) => `Jupiter is in your ${n} sign from the Moon — growth comes through ${h}, but it asks for effort rather than luck.`,
    sadeSati: (ph) => `Saturn is passing over your Moon sign (Sade Sati, ${ph} phase). It feels heavier and slower, but rewards patience, discipline and honesty.`,
    phase: { rising: "rising", peak: "peak", setting: "setting" },
    satGood: "Saturn is in a strong position for you — steady work now brings solid, lasting results.",
    satHard: (n, w) => `Saturn is in your ${n} sign from the Moon, a phase that tests ${w} — keep routines simple and don't overcommit.`,
    satHome: "peace at home",
    satResilience: "your resilience",
    satOther: (n, h) => `Saturn is in your ${n} sign from the Moon, slowly shaping ${h}.`,
    rahuGood: "Rahu is well placed for ambition — bold, new moves can work if you plan them.",
    subBegins: (p) => `${p} sub-period begins`,
    subText: (w, g, h) => `From ${w} the focus shifts toward ${g}, especially around ${h}.`,
    newChapter: (p) => `A new life chapter: ${p}`,
    newChapterText: (y, ti) => `Around ${y} your next major chapter begins — "${ti}".`,
    enters: (p, s) => `${p} enters ${s}`,
    jupEnterGood: (h) => `Jupiter moves into a lucky position for you — a good window for ${h}.`,
    jupEnterOther: (h) => `Jupiter shifts focus to ${h}; growth there comes through effort.`,
    satEnter12: "Saturn begins Sade Sati for your Moon sign — a slower, more serious 7½-year phase that rewards discipline.",
    satEnter1: "Saturn moves over your Moon sign — the most intense part of Sade Sati. Keep routines simple and lean on people you trust.",
    satEnter2: "Saturn enters the final phase of Sade Sati — pressure starts to ease; focus on money discipline.",
    satEnterGood: "Saturn moves into a strong spot for you — patient work starts paying off.",
    satEnterOther: (h) => `Saturn moves on to ${h}, asking for responsibility there.`,
    rahuEnter: (h) => `Rahu shifts your ambition and restlessness toward ${h}.`,
    periodOf: (md, ad) => `${md}–${ad} period`,
    jupiterWindow: (h) => `Jupiter blesses your ${h}`,
    remedyMain: (p, y) => `${p} runs your current life chapter (until ${y}).`,
    remedySub: (p, u) => `${p} colours the current sub-period (until ${u}).`,
    remedySadeSati: "Saturn's Sade Sati is active for your Moon sign.",
    caveat: "Your birth time is approximate, so dates here can shift by months. The themes still apply.",
    gemCaution: "Gemstones are powerful in tradition — please don't wear one without a careful, personal consultation.",
  },
};

const hi: Dict = {
  planet: rec(["सूर्य", "चंद्र", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "राहु", "केतु"]),
  title: rec(["अपनी पहचान बनाने का समय", "घर, मन और भावनाएँ", "साहस, ऊर्जा और कर्म", "सीख, कौशल और संवाद", "विकास, ज्ञान और अवसर", "प्रेम, सुख और रचनात्मकता", "मेहनत जो स्थायी फल देती है", "बड़ी महत्वाकांक्षाएँ और नए रास्ते", "त्याग और आत्मचिंतन"]),
  gist: rec(["आत्मविश्वास, मान-सम्मान और नेतृत्व", "भावनाएँ, परिवार, सुख और लोगों से जुड़ाव", "ऊर्जा, महत्वाकांक्षा, संपत्ति और काम पूरे करना", "पढ़ाई, व्यापार, लेखन, नेटवर्किंग और तेज़ बुद्धि", "ज्ञान, अच्छा मार्गदर्शन, परिवार की वृद्धि और नए अवसर", "रिश्ते, सौंदर्य, कला, सुख-सुविधा और जीवन का आनंद", "अनुशासन, ज़िम्मेदारी, धैर्य और धीमी लेकिन पक्की प्रगति", "महत्वाकांक्षा, तकनीक, विदेश से जुड़ाव और अलग रास्ते", "वैराग्य, अंतर्ज्ञान, शोध और आध्यात्मिक विकास"]),
  house: { 1: "आप और आपका स्वास्थ्य", 2: "धन और परिवार", 3: "साहस और कौशल", 4: "घर और मन की शांति", 5: "रचनात्मकता, प्रेम और संतान", 6: "रोज़ का काम और सेहत की आदतें", 7: "साझेदारी और विवाह", 8: "जीवन के बड़े बदलाव", 9: "भाग्य और उच्च शिक्षा", 10: "करियर और प्रतिष्ठा", 11: "आय और मित्र", 12: "यात्रा, विश्राम और अध्यात्म" },
  area: { career: "करियर और नौकरी", business: "व्यापार और साझेदारी", love: "प्रेम और विवाह", family: "परिवार और घर", money: "धन और संपत्ति", fortune: "भाग्य", health: "स्वास्थ्य और ऊर्जा", learning: "शिक्षा और ज्ञान" },
  rating: { strong: "बहुत अच्छा", active: "सक्रिय", challenging: "सावधानी", quiet: "शांत" },
  predict: {
    career: { strong: "करियर के लिए मज़बूत समय — परंपरा के अनुसार यह पदोन्नति, सम्मान या बेहतर नौकरी का समय है।", active: "करियर में हलचल और बदलाव — नई ज़िम्मेदारियाँ या भूमिका में बदलाव की संभावना है।", challenging: "करियर में धैर्य रखें — काम का दबाव, धीमी प्रगति या कठिन परीक्षा जैसा समय।", quiet: "करियर का समय स्थिर और शांत है — कौशल बढ़ाते रहें।" },
    business: { strong: "व्यापार के लिए अच्छा समय — नए सौदे, साझेदारी और विस्तार सफल होने की संभावना।", active: "व्यापार में सक्रियता — मेहनत से अवसर मिलेंगे; हर अनुबंध ध्यान से पढ़ें।", challenging: "व्यापार में सावधानी — बड़ा निवेश, जोखिम भरे साझेदार या जल्दबाज़ी में हस्ताक्षर से बचें।", quiet: "व्यापार स्थिर रहेगा — शुरुआत से ज़्यादा योजना बनाने का समय।" },
    love: { strong: "प्रेम के लिए मज़बूत समय — रिश्ते गहरे होते हैं; परंपरा के अनुसार यह विवाह या प्रतिबद्धता का समय है।", active: "रिश्ते चर्चा में रहेंगे — किसी नए व्यक्ति से मुलाक़ात या साथी से अहम बातचीत।", challenging: "रिश्तों में धैर्य रखें — गलतफ़हमी या दूरी संभव है; खुलकर बात करें।", quiet: "प्रेम जीवन शांत रहेगा — बड़े बदलाव कम, रोज़ का सुकून ज़्यादा।" },
    family: { strong: "घर में खुशियाँ — पारिवारिक उत्सव, शुभ कार्य या घर ख़रीदने/सुधारने के लिए अच्छा समय।", active: "पारिवारिक जीवन व्यस्त — घर बदलना, मरम्मत या नई ज़िम्मेदारियाँ।", challenging: "घर में कुछ तनाव — परिवार के किसी सदस्य को आपके सहयोग की ज़रूरत होगी; धैर्य रखें।", quiet: "घर का माहौल स्थिर और शांत रहेगा।" },
    money: { strong: "धन के लिए अच्छा समय — आय बढ़ सकती है और बचत में वृद्धि होगी।", active: "पैसों का आना-जाना बढ़ेगा — आय भी और ख़र्च भी; बजट बनाकर चलें।", challenging: "धन के मामले में सावधानी — अचानक ख़र्च संभव है; उधार देने और सट्टे से बचें।", quiet: "आर्थिक स्थिति स्थिर — नियमित बचत सबसे अच्छी रहेगी।" },
    fortune: { strong: "भाग्य आपके साथ है — गुरुजनों का सहयोग, आशीर्वाद और अच्छे मौके आसानी से मिलेंगे।", active: "यात्रा, शिक्षा या अध्यात्म से नए द्वार खुलेंगे।", challenging: "भाग्य धीमा लगेगा — फल संयोग से नहीं, मेहनत से मिलेगा।", quiet: "भाग्य सामान्य रहेगा — लगातार प्रयास पर भरोसा रखें।" },
    health: { strong: "ऊर्जा अच्छी रहेगी — सेहतमंद आदतें शुरू करने का बढ़िया समय।", active: "ऊर्जा ऊपर-नीचे होगी — नींद और भोजन नियमित रखें।", challenging: "अपना ध्यान रखें — तनाव या थकान बढ़ सकती है; आराम और नियमित जाँच मदद करेंगे।", quiet: "स्वास्थ्य और ऊर्जा स्थिर रहेगी।" },
    learning: { strong: "पढ़ाई और परीक्षा के लिए उत्तम समय — सीखना आसान होगा और नए कोर्स लाभ देंगे।", active: "सीखने का व्यस्त दौर — नए विषय, कोर्स या कौशल।", challenging: "पढ़ाई में अनुशासन ज़रूरी — ध्यान भटक सकता है; तय दिनचर्या रखें।", quiet: "शांत समय — दोहराने और मज़बूत करने के लिए अच्छा।" },
  },
  tip: {
    career: { strong: "नई भूमिका माँगें, पदोन्नति के लिए आवेदन करें, अपने काम को सामने लाएँ।", active: "ज़िम्मेदारी लें, पर अपेक्षाएँ लिखकर तय करें।", challenging: "निराश होकर नौकरी न छोड़ें — कौशल बढ़ाएँ और अपने काम का रिकॉर्ड रखें।" },
    business: { strong: "जिस साझेदारी या विस्तार की योजना थी, उसे अभी शुरू करें।", active: "बड़ा करने से पहले छोटे स्तर पर आज़माएँ।", challenging: "नकदी सुरक्षित रखें; बड़ा निवेश टालें और शर्तें ध्यान से पढ़ें।" },
    love: { strong: "अपनी भावनाएँ कहें; विवाह की योजना हो तो यह अच्छा समय है।", active: "साथ में समय बिताएँ; प्रतिक्रिया से पहले सुनें।", challenging: "एक-दूसरे को समय दें; ग़ुस्से में फ़ैसले न लें।" },
    family: { strong: "पारिवारिक कार्यक्रम या घर के काम अभी योजना में लें।", active: "घर की ज़िम्मेदारियाँ साफ़-साफ़ बाँटें।", challenging: "परिवार के साथ धैर्य रखें; छोटी-छोटी देखभाल बहुत काम आती है।" },
    money: { strong: "समझदारी से बचत और निवेश करें; अतिरिक्त आय शुरू करें।", active: "हर महीने ख़र्च का हिसाब रखें और आपात निधि बनाएँ।", challenging: "क़र्ज़, उधार और सट्टे से बचें; जो है उसे सुरक्षित रखें।" },
    fortune: { strong: "गुरु या मार्गदर्शक खोजें, यात्रा करें और सामने आए अवसर को अपनाएँ।", active: "कुछ नया सीखें या कोई सार्थक यात्रा की योजना बनाएँ।", challenging: "विश्वास और मेहनत बनाए रखें; अभी शॉर्टकट काम नहीं आएँगे।" },
    health: { strong: "जो व्यायाम या नींद की आदत टाल रहे थे, उसे अभी शुरू करें।", active: "खाने और सोने का समय तय रखें।", challenging: "पूरा आराम करें और नियमित जाँच कराएँ; थकान में ज़बरदस्ती न करें।" },
    learning: { strong: "वह कोर्स या परीक्षा अभी दें।", active: "साप्ताहिक पढ़ाई की योजना बनाएँ और उस पर टिके रहें।", challenging: "छोटे-छोटे ध्यान केंद्रित सत्रों में पढ़ें और ध्यान भटकाने वाली चीज़ें हटाएँ।" },
  },
  habits: {
    Sun: ["सुबह जल्दी उठें और सूर्य की रोशनी लें", "ज़िम्मेदारी लें — किसी एक काम का अच्छा नेतृत्व करें", "पिता या मार्गदर्शकों का सम्मान करें और उनसे जुड़ें"],
    Moon: ["अच्छी नींद लें और शाम का समय शांत रखें", "पानी के पास या प्रकृति में समय बिताएँ", "माँ या किसी अपने को फ़ोन करें"],
    Mars: ["नियमित व्यायाम करें — ऊर्जा को सही दिशा दें", "ग़ुस्से में प्रतिक्रिया से पहले रुकें", "टलता आ रहा कोई व्यावहारिक काम पूरा करें"],
    Mercury: ["कोई नया कौशल या छोटा कोर्स सीखें", "बातें लिखकर रखें और अनुबंध दोबारा जाँचें", "छोटे वादे भी निभाएँ"],
    Jupiter: ["कोई गुरु खोजें — या किसी के गुरु बनें", "हर सप्ताह कुछ सार्थक पढ़ें", "ज्ञान और समय उदारता से बाँटें"],
    Venus: ["कला, संगीत या सुंदरता के लिए समय निकालें", "अपने साथी की खुलकर सराहना करें", "सुख-सुविधा पर ख़र्च बजट में रखें"],
    Saturn: ["रोज़ की तय दिनचर्या बनाएँ और निभाएँ", "धैर्य रखें — धीमी प्रगति भी प्रगति है", "सेवा करें: बुज़ुर्गों, श्रमिकों या ज़रूरतमंदों की मदद करें"],
    Rahu: ["स्क्रीन का समय कम करें और शॉर्टकट से बचें", "बड़ी महत्वाकांक्षाओं की लिखित योजना बनाएँ", "नशे और जल्दी अमीर बनने की योजनाओं से दूर रहें"],
    Ketu: ["रोज़ कुछ मिनट ध्यान करें या शांत बैठें", "अनावश्यक चीज़ें हटाएँ — जो ज़रूरी नहीं उसे छोड़ें", "अंतर्ज्ञान पर चलें, पर तथ्य भी जाँचें"],
  },
  day: rec(["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "शनिवार", "मंगलवार"]),
  colour: rec(["केसरिया, सुनहरा", "सफ़ेद, चाँदी", "लाल, मूँगा", "हरा", "पीला", "सफ़ेद, हल्का गुलाबी", "गहरा नीला, काला", "धुएँ जैसा स्लेटी", "स्लेटी, मिट्टी के रंग"]),
  giving: rec(["ज़रूरतमंदों को गेहूँ या गुड़", "चावल, दूध या सफ़ेद वस्त्र", "मसूर दाल या शारीरिक काम में मदद", "हरी मूँग दाल, विद्यार्थियों को किताबें या स्टेशनरी", "हल्दी, चना दाल या किसी शिक्षक की सहायता", "ज़रूरतमंद महिलाओं को मिठाई, इत्र या वस्त्र", "सरसों का तेल, काले तिल या श्रमिकों को भोजन", "पशु आश्रय में सेवा या कंबल दान", "आवारा कुत्तों को भोजन या किसी आध्यात्मिक कार्य में सहयोग"]),
  stone: rec(["माणिक्य", "मोती", "मूँगा", "पन्ना", "पुखराज", "हीरा या सफ़ेद पुखराज", "नीलम", "गोमेद", "लहसुनिया"]),
  months: ["जन", "फ़र", "मार्च", "अप्रै", "मई", "जून", "जुला", "अग", "सितं", "अक्टू", "नवं", "दिसं"],
  signs: ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"],
  t: {
    headline: (n, m, ti, a, b) => `${n}, आप ${m} अध्याय में हैं: "${ti}" (${a}–${b})।`,
    headlineSub: (p, g, u) => ` अभी ${u} तक ${p} इसमें ${g} का रंग जोड़ रहा है।`,
    mood: { supportive: "एक सहयोगी", mixed: "एक मिला-जुला, विकास वाला", demanding: "एक कठिन लेकिन व्यक्तित्व निखारने वाले" },
    chapterSummary: (p, g, h, r) => `${p} के वर्ष ${g} लाते हैं। आपकी कुंडली में ${p} ${h} के क्षेत्र में है${r}।`,
    rulesJoin: (l) => ` और ${l} को भी प्रभावित करता है`,
    and: "और",
    jupGood: (h) => `विकास के ग्रह गुरु आपके लिए शुभ स्थिति में हैं — ${h} को सहयोग मिल रहा है।`,
    jupOther: (n, h) => `गुरु आपकी चंद्र राशि से ${n} राशि में हैं — ${h} के ज़रिए विकास होगा, पर भाग्य से ज़्यादा मेहनत चाहिए।`,
    sadeSati: (ph) => `शनि आपकी चंद्र राशि पर से गुज़र रहे हैं (साढ़ेसाती, ${ph} चरण)। समय भारी और धीमा लगता है, पर धैर्य, अनुशासन और ईमानदारी का फल देता है।`,
    phase: { rising: "पहला", peak: "मध्य", setting: "अंतिम" },
    satGood: "शनि आपके लिए मज़बूत स्थिति में हैं — अभी की गई मेहनत ठोस और स्थायी फल देगी।",
    satHard: (n, w) => `शनि आपकी चंद्र राशि से ${n} राशि में हैं — यह ${w} की परीक्षा का समय है; दिनचर्या सरल रखें और ज़रूरत से ज़्यादा वादे न करें।`,
    satHome: "घर की शांति",
    satResilience: "आपकी सहनशक्ति",
    satOther: (n, h) => `शनि आपकी चंद्र राशि से ${n} राशि में हैं और धीरे-धीरे ${h} को आकार दे रहे हैं।`,
    rahuGood: "राहु महत्वाकांक्षा के लिए शुभ स्थिति में है — योजना के साथ उठाए गए नए क़दम सफल हो सकते हैं।",
    subBegins: (p) => `${p} की अंतर्दशा शुरू`,
    subText: (w, g, h) => `${w} से ध्यान ${g} की ओर जाएगा, ख़ासकर ${h} में।`,
    newChapter: (p) => `जीवन का नया अध्याय: ${p}`,
    newChapterText: (y, ti) => `लगभग ${y} में आपका अगला बड़ा अध्याय शुरू होगा — "${ti}"।`,
    enters: (p, s) => `${p} का ${s} में प्रवेश`,
    jupEnterGood: (h) => `गुरु आपके लिए भाग्यशाली स्थिति में आ रहे हैं — ${h} के लिए अच्छा समय।`,
    jupEnterOther: (h) => `गुरु का ध्यान ${h} पर होगा; वहाँ विकास मेहनत से आएगा।`,
    satEnter12: "आपकी चंद्र राशि के लिए साढ़ेसाती शुरू — लगभग साढ़े सात साल का गंभीर दौर, जो अनुशासन का फल देता है।",
    satEnter1: "शनि आपकी चंद्र राशि पर — साढ़ेसाती का सबसे गहन चरण। दिनचर्या सरल रखें और भरोसेमंद लोगों का साथ लें।",
    satEnter2: "साढ़ेसाती का अंतिम चरण — दबाव कम होने लगेगा; धन के मामलों में अनुशासन रखें।",
    satEnterGood: "शनि आपके लिए मज़बूत स्थान पर आ रहे हैं — धैर्य से की गई मेहनत रंग लाने लगेगी।",
    satEnterOther: (h) => `शनि अब ${h} की ओर बढ़ रहे हैं, जहाँ ज़िम्मेदारी माँगेंगे।`,
    rahuEnter: (h) => `राहु आपकी महत्वाकांक्षा और बेचैनी को ${h} की ओर मोड़ेगा।`,
    periodOf: (md, ad) => `${md}–${ad} दशा`,
    jupiterWindow: (h) => `गुरु का आशीर्वाद: ${h}`,
    remedyMain: (p, y) => `${p} आपके वर्तमान जीवन-अध्याय (महादशा) को चला रहे हैं (${y} तक)।`,
    remedySub: (p, u) => `${p} वर्तमान अंतर्दशा का रंग तय कर रहे हैं (${u} तक)।`,
    remedySadeSati: "आपकी चंद्र राशि पर शनि की साढ़ेसाती चल रही है।",
    caveat: "आपका जन्म समय अनुमानित है, इसलिए यहाँ दी गई तिथियाँ कुछ महीने आगे-पीछे हो सकती हैं। विषय फिर भी लागू होते हैं।",
    gemCaution: "परंपरा में रत्न बहुत प्रभावशाली माने जाते हैं — व्यक्तिगत सलाह के बिना कोई रत्न न पहनें।",
  },
};

const hinglish: Dict = {
  planet: rec(["Surya", "Chandra", "Mangal", "Budh", "Guru", "Shukra", "Shani", "Rahu", "Ketu"]),
  title: rec(["Apni pehchaan banane ka samay", "Ghar, mann aur bhavnayein", "Saahas, energy aur karm", "Seekh, skills aur communication", "Growth, gyaan aur naye mauke", "Prem, sukh aur creativity", "Mehnat jo pakka phal deti hai", "Badi ambitions aur naye raaste", "Chhodna aur andar jhaankna"]),
  gist: rec(["confidence, maan-samman aur leadership", "bhavnayein, parivaar, sukh aur logon se judna", "energy, ambition, property aur kaam poora karna", "padhai, business, writing, networking aur tez dimaag", "gyaan, achha guidance, parivaar ki growth aur naye mauke", "rishte, sundarta, art, comfort aur zindagi ka mazaa", "discipline, zimmedari, dhairya aur dheemi par pakki progress", "ambition, technology, videsh se connection aur alag raaste", "vairagya, intuition, research aur spiritual growth"]),
  house: { 1: "aap aur aapki health", 2: "paisa aur parivaar", 3: "saahas aur skills", 4: "ghar aur mann ki shaanti", 5: "creativity, pyaar aur bachche", 6: "roz ka kaam aur health habits", 7: "partnership aur shaadi", 8: "zindagi ke bade badlaav", 9: "bhagya aur higher studies", 10: "career aur reputation", 11: "income aur dost", 12: "travel, aaram aur adhyatm" },
  area: { career: "Career & naukri", business: "Business & partnership", love: "Pyaar & shaadi", family: "Parivaar & ghar", money: "Paisa & dhan", fortune: "Bhagya / luck", health: "Health & energy", learning: "Padhai & gyaan" },
  rating: { strong: "Bahut achha", active: "Active", challenging: "Dhyan rakhein", quiet: "Shaant" },
  predict: {
    career: { strong: "Career ke liye strong time — parampara ke hisaab se promotion, samman ya better job ka samay.", active: "Career mein hulchul aur badlaav — nayi zimmedariyan ya role change hone ke chances hain.", challenging: "Career mein dhairya rakhein — kaam ka pressure, slow growth ya mushkil test jaisa time.", quiet: "Career ka time stable aur shaant hai — skills badhaate rahein." },
    business: { strong: "Business ke liye achha time — naye deals, partnership aur expansion safal hone ke chances.", active: "Business active rahega — mehnat se mauke milenge; har agreement dhyan se padhein.", challenging: "Business mein savdhaani — bada investment, risky partner ya jaldi mein sign karne se bachein.", quiet: "Business stable rahega — launch se zyada planning ka samay." },
    love: { strong: "Pyaar ke liye strong time — rishte gehre hote hain; parampara ke hisaab se shaadi ya commitment ka samay.", active: "Rishte focus mein rahenge — kisi naye insaan se milna ya partner se important baat-cheet.", challenging: "Rishton mein dhairya rakhein — galatfehmi ya doori ho sakti hai; khulkar baat karein.", quiet: "Love life shaant rahegi — bade events kam, roz ka sukoon zyada." },
    family: { strong: "Ghar mein khushiyan — family function, shubh kaam ya ghar khareedne/sudhaarne ke liye achha time.", active: "Family life busy — ghar shift karna, renovation ya nayi zimmedariyan.", challenging: "Ghar mein thoda tension — kisi family member ko aapke support ki zaroorat hogi; dhairya rakhein.", quiet: "Ghar ka maahaul stable aur shaant rahega." },
    money: { strong: "Paise ke liye achha time — income badh sakti hai aur savings grow hongi.", active: "Paison ka aana-jaana badhega — income bhi aur kharche bhi; budget banakar chalein.", challenging: "Paison mein savdhaani — achanak kharche ho sakte hain; udhaar dene aur satte se bachein.", quiet: "Finance stable — regular saving sabse achhi rahegi." },
    fortune: { strong: "Bhagya aapke saath hai — guru/mentor ka support, aashirwaad aur achhe mauke aasani se milenge.", active: "Travel, padhai ya adhyatm se naye darwaze khulenge.", challenging: "Luck slow lagega — result chance se nahi, mehnat se milega.", quiet: "Bhagya normal rahega — lagatar mehnat par bharosa rakhein." },
    health: { strong: "Energy achhi rahegi — healthy habits shuru karne ka badhiya time.", active: "Energy upar-neeche hogi — neend aur khaana regular rakhein.", challenging: "Apna khayal rakhein — stress ya thakaan badh sakti hai; aaram aur regular check-up madad karenge.", quiet: "Health aur energy stable rahegi." },
    learning: { strong: "Padhai aur exams ke liye best time — seekhna aasan hoga aur naye courses faayda denge.", active: "Seekhne ka busy phase — naye subjects, courses ya skills.", challenging: "Padhai mein discipline zaroori — dhyan bhatak sakta hai; fixed routine rakhein.", quiet: "Shaant time — revise aur strong karne ke liye achha." },
  },
  tip: {
    career: { strong: "Naya role maangiye, promotion ke liye apply kijiye, apna kaam sabke saamne laaiye.", active: "Zimmedari lijiye, par expectations likhkar tay kijiye.", challenging: "Gusse mein job mat chhodiye — skills badhaiye aur apne kaam ka record rakhiye." },
    business: { strong: "Jis partnership ya expansion ka plan tha, use abhi shuru kijiye.", active: "Bada karne se pehle chhote level par test kijiye.", challenging: "Cash safe rakhiye; bada investment taaliye aur terms dhyan se padhiye." },
    love: { strong: "Apni feelings boliye; shaadi ka plan ho to yeh achha time hai.", active: "Saath mein time bitaiye; react karne se pehle suniye.", challenging: "Ek-doosre ko space dijiye; gusse mein decision mat lijiye." },
    family: { strong: "Family function ya ghar ke kaam abhi plan kijiye.", active: "Ghar ki zimmedariyan saaf-saaf baantiye.", challenging: "Family ke saath dhairya rakhiye; chhoti-chhoti care bahut kaam aati hai." },
    money: { strong: "Samajhdaari se saving aur investment kijiye; side income shuru kijiye.", active: "Har mahine kharche ka hisaab rakhiye aur emergency fund banaiye.", challenging: "Loan, udhaar aur satte se bachiye; jo hai use safe rakhiye." },
    fortune: { strong: "Mentor dhundhiye, travel kijiye aur saamne aaye mauke ko pakadiye.", active: "Kuch naya seekhiye ya koi meaningful trip plan kijiye.", challenging: "Vishwas aur mehnat banaye rakhiye; abhi shortcut kaam nahi aayenge." },
    health: { strong: "Jo exercise ya sleep habit taal rahe the, use abhi shuru kijiye.", active: "Khaane aur sone ka time fix rakhiye.", challenging: "Poora aaram kijiye aur regular check-up karaiye; thakaan mein zabardasti mat kijiye." },
    learning: { strong: "Woh course ya exam abhi dijiye.", active: "Weekly study plan banaiye aur us par tike rahiye.", challenging: "Chhote focused sessions mein padhiye aur distractions hataiye." },
  },
  habits: {
    Sun: ["Subah jaldi uthiye aur suraj ki roshni lijiye", "Zimmedari lijiye — ek kaam ko achhe se lead kijiye", "Pita ya mentors ka samman kijiye aur unse judiye"],
    Moon: ["Achhi neend lijiye aur shaam shaant rakhiye", "Paani ke paas ya nature mein time bitaiye", "Maa ya kisi apne ko phone kijiye"],
    Mars: ["Regular exercise kijiye — energy ko sahi disha dijiye", "Gusse mein react karne se pehle rukiye", "Talta aa raha koi practical kaam poora kijiye"],
    Mercury: ["Koi naya skill ya chhota course seekhiye", "Baatein likhkar rakhiye aur agreements double-check kijiye", "Chhote promises bhi nibhaiye"],
    Jupiter: ["Koi guru/mentor dhundhiye — ya kisi ke mentor baniye", "Har hafte kuch meaningful padhiye", "Gyaan aur time khule dil se baantiye"],
    Venus: ["Art, music ya sundarta ke liye time nikaaliye", "Apne partner ki khulkar taareef kijiye", "Comfort par kharcha budget mein rakhiye"],
    Saturn: ["Roz ki fixed routine banaiye aur nibhaiye", "Dhairya rakhiye — dheemi progress bhi progress hai", "Seva kijiye: buzurgon, workers ya zarooratmandon ki madad"],
    Rahu: ["Screen time kam kijiye aur shortcuts se bachiye", "Badi ambitions ka likhit plan banaiye", "Nashe aur jaldi ameer banne ki schemes se door rahiye"],
    Ketu: ["Roz kuch minute meditation ya shaant baithiye", "Faaltu cheezein hataiye — jo zaroori nahi use chhodiye", "Intuition par chaliye, par facts bhi check kijiye"],
  },
  day: rec(["Raviwar (Sunday)", "Somwar (Monday)", "Mangalwar (Tuesday)", "Budhwar (Wednesday)", "Guruwar (Thursday)", "Shukrawar (Friday)", "Shaniwar (Saturday)", "Shaniwar (Saturday)", "Mangalwar (Tuesday)"]),
  colour: rec(["Kesariya, sunehra", "Safed, chaandi", "Laal, moonga", "Hara", "Peela", "Safed, halka gulabi", "Gehra neela, kaala", "Dhuyen jaisa grey", "Grey, mitti ke rang"]),
  giving: rec(["Zarooratmandon ko gehun ya gud", "Chawal, doodh ya safed kapde", "Masoor dal ya physical kaam mein madad", "Hari moong dal, students ko books ya stationery", "Haldi, chana dal ya kisi teacher ki madad", "Zarooratmand mahilaon ko mithai, itr ya kapde", "Sarson ka tel, kaale til ya workers ko khaana", "Animal shelter mein seva ya kambal daan", "Stray dogs ko khaana ya kisi spiritual kaam mein sahyog"]),
  stone: rec(["Manik (Ruby)", "Moti (Pearl)", "Moonga (Red coral)", "Panna (Emerald)", "Pukhraj (Yellow sapphire)", "Heera ya safed pukhraj", "Neelam (Blue sapphire)", "Gomed (Hessonite)", "Lehsunia (Cat's eye)"]),
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  signs: ["Mesh", "Vrishabh", "Mithun", "Kark", "Singh", "Kanya", "Tula", "Vrishchik", "Dhanu", "Makar", "Kumbh", "Meen"],
  t: {
    headline: (n, m, ti, a, b) => `${n}, aap ${m} chapter mein hain: "${ti}" (${a}–${b}).`,
    headlineSub: (p, g, u) => ` Abhi ${u} tak ${p} isme ${g} ka rang jod raha hai.`,
    mood: { supportive: "ek supportive", mixed: "ek mila-jula, growth wale", demanding: "ek mushkil par character banane wale" },
    chapterSummary: (p, g, h, r) => `${p} ke saal ${g} laate hain. Aapki kundli mein ${p} ${h} ke area mein hai${r}.`,
    rulesJoin: (l) => `, aur ${l} ko bhi affect karta hai`,
    and: "aur",
    jupGood: (h) => `Growth ke grah Guru aapke liye shubh position mein hain — ${h} ko support mil raha hai.`,
    jupOther: (n, h) => `Guru aapki Chandra rashi se ${n} rashi mein hain — ${h} ke through growth hogi, par luck se zyada mehnat chahiye.`,
    sadeSati: (ph) => `Shani aapki Chandra rashi par se guzar rahe hain (Sade Sati, ${ph} phase). Time bhaari aur slow lagta hai, par dhairya, discipline aur imaandaari ka phal deta hai.`,
    phase: { rising: "pehla", peak: "beech ka", setting: "aakhri" },
    satGood: "Shani aapke liye strong position mein hain — abhi ki mehnat pakka aur lambe samay ka phal degi.",
    satHard: (n, w) => `Shani aapki Chandra rashi se ${n} rashi mein hain — yeh ${w} ki pariksha ka samay hai; routine simple rakhein aur zyada commitments na karein.`,
    satHome: "ghar ki shaanti",
    satResilience: "aapki sehan-shakti",
    satOther: (n, h) => `Shani aapki Chandra rashi se ${n} rashi mein hain aur dheere-dheere ${h} ko shape de rahe hain.`,
    rahuGood: "Rahu ambition ke liye achhi position mein hai — plan ke saath uthaye gaye naye kadam safal ho sakte hain.",
    subBegins: (p) => `${p} antardasha shuru`,
    subText: (w, g, h) => `${w} se focus ${g} ki taraf jayega, khaaskar ${h} mein.`,
    newChapter: (p) => `Zindagi ka naya chapter: ${p}`,
    newChapterText: (y, ti) => `Lagbhag ${y} mein aapka agla bada chapter shuru hoga — "${ti}".`,
    enters: (p, s) => `${p} ka ${s} mein pravesh`,
    jupEnterGood: (h) => `Guru aapke liye lucky position mein aa rahe hain — ${h} ke liye achha time.`,
    jupEnterOther: (h) => `Guru ka focus ${h} par hoga; wahan growth mehnat se aayegi.`,
    satEnter12: "Aapki Chandra rashi ke liye Sade Sati shuru — lagbhag saadhe saat saal ka serious phase, jo discipline ka phal deta hai.",
    satEnter1: "Shani aapki Chandra rashi par — Sade Sati ka sabse intense phase. Routine simple rakhein aur bharosemand logon ka saath lein.",
    satEnter2: "Sade Sati ka aakhri phase — pressure kam hone lagega; paison mein discipline rakhein.",
    satEnterGood: "Shani aapke liye strong jagah aa rahe hain — dhairya wali mehnat rang laane lagegi.",
    satEnterOther: (h) => `Shani ab ${h} ki taraf badh rahe hain, wahan zimmedari maangenge.`,
    rahuEnter: (h) => `Rahu aapki ambition aur bechaini ko ${h} ki taraf modega.`,
    periodOf: (md, ad) => `${md}–${ad} dasha`,
    jupiterWindow: (h) => `Guru ka aashirwaad: ${h}`,
    remedyMain: (p, y) => `${p} aapka current life chapter (mahadasha) chala rahe hain (${y} tak).`,
    remedySub: (p, u) => `${p} current antardasha ka rang tay kar rahe hain (${u} tak).`,
    remedySadeSati: "Aapki Chandra rashi par Shani ki Sade Sati chal rahi hai.",
    caveat: "Aapka birth time approximate hai, isliye yahan ki dates kuch mahine aage-peeche ho sakti hain. Themes phir bhi laagu hote hain.",
    gemCaution: "Parampara mein ratna bahut powerful maane jaate hain — personal salaah ke bina koi ratna na pehnein.",
  },
};

export const DICT: Record<Lang, Dict> = { en, hi, hinglish };
export const ordinal = (lang: Lang, n: number) => (lang === "hi" ? `${n}वीं` : lang === "hinglish" ? `${n}vi` : `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`);
export const monthYear = (lang: Lang, iso: string) => { const d = new Date(iso); return `${DICT[lang].months[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
export const toLang = (v: unknown): Lang => (v === "hi" || v === "hinglish" ? v : "en");
