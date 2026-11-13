import type { RLang } from "./lang";

/** Hindi and Hinglish meanings, in deck order (same order as tarot.ts). Card names stay in English, as is customary. */
type Pair = [string, string];

const HI_MAJOR: Pair[] = [
  ["नई शुरुआत, सहजता, विश्वास की छलाँग", "लापरवाही, झिझक, अनजाने का डर"],
  ["कौशल, इच्छाशक्ति, उपयोग के लिए तैयार साधन", "बिखरा ध्यान, अप्रयुक्त क्षमता, चालाकी"],
  ["अंतर्ज्ञान, भीतरी ज्ञान, अनकही बातें", "अंतर्ज्ञान की अनदेखी, रहस्य, अलगाव"],
  ["पोषण, समृद्धि, रचनात्मकता", "निर्भरता, रचनात्मक रुकावट, अपनी देखभाल की उपेक्षा"],
  ["व्यवस्था, अधिकार, स्थिरता", "कठोरता, नियंत्रण, अनुशासन की कमी"],
  ["परंपरा, मार्गदर्शन, साझा मूल्य", "परंपरा को चुनौती, निजी विश्वास"],
  ["मिलन, मूल्यों पर आधारित चुनाव, सामंजस्य", "असंतुलन, मूल्यों में मतभेद, अनिर्णय"],
  ["दृढ़ संकल्प, दिशा, गति", "दिशा की कमी, बिखरा प्रयास, बाधाएँ"],
  ["साहस, धैर्य, कोमल नियंत्रण", "आत्म-संदेह, कम ऊर्जा, अनियंत्रित भावनाएँ"],
  ["आत्मचिंतन, एकांत, भीतरी मार्गदर्शन", "अकेलापन, पीछे हटना, आत्मचिंतन से बचना"],
  ["चक्र, निर्णायक मोड़, परिवर्तन", "बदलाव का विरोध, रुकावटें, पुराने चक्र तोड़ना"],
  ["निष्पक्षता, सत्य, कर्म और फल", "असंतुलन, जवाबदेही से बचना"],
  ["ठहराव, समर्पण, नया दृष्टिकोण", "अटके रहना, विरोध, अनिर्णय"],
  ["अंत, रूपांतरण, संक्रमण", "बदलाव का विरोध, ठहराव"],
  ["संतुलन, संयम, धैर्य", "अति, असंतुलन, जल्दबाज़ी"],
  ["आसक्ति, आदतें, भौतिक झुकाव", "मुक्ति, बंधन तोड़ना, शक्ति वापस पाना"],
  ["अचानक बदलाव, रहस्योद्घाटन, उथल-पुथल", "टली हुई विपत्ति, बदलाव का डर"],
  ["आशा, नवीनीकरण, शांत विश्वास", "निराशा, विश्वास में कमी"],
  ["अनिश्चितता, स्वप्न, अवचेतन मन", "स्पष्टता लौटना, डर का छूटना"],
  ["आनंद, सफलता, जीवन-शक्ति", "अस्थायी बादल, कम उत्साह"],
  ["आत्मचिंतन, जागृति, भीतर की पुकार", "आत्म-संदेह, पुकार की अनदेखी"],
  ["पूर्णता, समन्वय, उपलब्धि", "अधूरे काम, समापन की तलाश"],
];
const HG_MAJOR: Pair[] = [
  ["nayi shuruaat, sahajta, bharose ki chhalaang", "laparwahi, jhijhak, anjaane ka darr"],
  ["skill, ichhashakti, istemaal ke liye taiyaar resources", "bikhra dhyaan, bina use ki kaabiliyat, chaalaki"],
  ["intuition, andar ka gyaan, ankahi baatein", "intuition ko nazarandaaz karna, raaz, doori"],
  ["poshan, samriddhi, creativity", "nirbharta, creative rukaavat, apni care ki anadekhi"],
  ["structure, adhikaar, stability", "sakhti, control, discipline ki kami"],
  ["parampara, margdarshan, saajhe values", "parampara ko chunauti, apne vishwas"],
  ["milan, values par based chunaav, harmony", "imbalance, values mein matbhed, faisla na kar paana"],
  ["pakka irada, disha, raftaar", "disha ki kami, bikhri koshish, rukaavatein"],
  ["himmat, dhairya, naram control", "khud par shak, kam energy, bekaabu emotions"],
  ["aatm-chintan, akelapan, andar ka margdarshan", "alag-thalag hona, peeche hatna, aatm-chintan se bachna"],
  ["cycles, turning point, badlaav", "badlaav ka virodh, setbacks, purane cycle todna"],
  ["insaaf, sach, karm aur phal", "imbalance, jawaabdehi se bachna"],
  ["thehraav, samarpan, naya nazariya", "atke rehna, virodh, faisla na kar paana"],
  ["ant, transformation, badlaav ka daur", "badlaav ka virodh, thehraav"],
  ["balance, sanyam, dhairya", "zyaadti, imbalance, jaldbaazi"],
  ["aasakti, aadatein, material focus", "mukti, bandhan todna, apni power wapas paana"],
  ["achaanak badlaav, sach saamne aana, uthal-puthal", "tali hui musibat, badlaav ka darr"],
  ["umeed, nayaapan, shaant vishwas", "niraasha, vishwas ki kami"],
  ["uncertainty, sapne, avchetan mann", "clarity lautna, darr ka chhootna"],
  ["khushi, safalta, zindadili", "kuch der ke baadal, kam utsaah"],
  ["aatm-chintan, jaagriti, andar ki pukaar", "khud par shak, pukaar ko anasuna karna"],
  ["poornata, sab kuch judna, uplabdhi", "adhoore kaam, closure ki talaash"],
];

const HI_MINOR: Record<string, Pair[]> = {
  wands: [
    ["प्रेरणा, नया उद्यम, रचनात्मक चिंगारी", "देरी, प्रेरणा की कमी"], ["योजना, भविष्य की दृष्टि, निर्णय", "अनजाने का डर, कमज़ोर योजना"], ["विस्तार, दूरदर्शिता, प्रगति", "बाधाएँ, देरी से निराशा"],
    ["उत्सव, स्थिरता, घर-वापसी", "बदलाव का दौर, सहयोग की कमी"], ["प्रतिस्पर्धा, टकराव, अलग-अलग विचार", "टकराव से बचना, भीतरी तनाव"], ["पहचान, जीत, आत्मविश्वास", "आत्म-संदेह, देर से मिलने वाली पहचान"],
    ["अपनी बात पर डटे रहना, लगन", "थकान भरा बोझ, हार मान लेना"], ["तेज़ कार्रवाई, गति, समाचार", "देरी, झुंझलाहट, इंतज़ार"], ["दृढ़ता, लगन, आख़िरी पड़ाव", "थकावट, अत्यधिक बचाव"],
    ["बोझ, ज़िम्मेदारी, कड़ी मेहनत", "काम बाँटना, बोझ से मुक्ति"], ["उत्साह, खोज, कोई संदेश", "दिशा की कमी, टालमटोल"], ["ऊर्जा, जुनून, रोमांच", "जल्दबाज़ी, आवेग"],
    ["आत्मविश्वास, गर्मजोशी, संकल्प", "असुरक्षा, माँग भरा व्यवहार"], ["दृष्टि, नेतृत्व, साहस", "आवेग, बहुत ऊँची अपेक्षाएँ"],
  ],
  cups: [
    ["नई भावनाएँ, करुणा, खुलापन", "भावनात्मक रुकावट, दबी भावनाएँ"], ["साझेदारी, आपसी आकर्षण, एकता", "असंतुलन, टूटा संवाद"], ["मित्रता, उत्सव, समुदाय", "अति-भोग, अकेलापन"],
    ["चिंतन, उदासीनता, पुनर्मूल्यांकन", "नई जागरूकता, स्वीकार"], ["हानि, पछतावा, शोक", "स्वीकार, आगे बढ़ना"], ["पुरानी यादें, बचपन, मासूमियत", "अतीत में जीना, छोड़ देना"],
    ["विकल्प, कल्पना, ख़याली पुलाव", "स्पष्टता, केंद्रित चुनाव"], ["छोड़कर आगे बढ़ना, गहरे अर्थ की खोज", "बदलाव का डर, अटके रहना"], ["संतोष, तृप्ति, कृतज्ञता", "असंतोष, भौतिकवाद"],
    ["सामंजस्य, परिवार, भावनात्मक पूर्णता", "मेल न बैठना, तनाव भरे रिश्ते"], ["रचनात्मक अवसर, जिज्ञासा, भावनाओं का संदेश", "भावनात्मक अपरिपक्वता, रचनात्मक रुकावट"], ["रोमांस, आकर्षण, दिल की सुनना", "मनमौजीपन, अवास्तविक अपेक्षाएँ"],
    ["करुणा, शांति, भावनात्मक सुरक्षा", "असुरक्षा, सह-निर्भरता"], ["भावनात्मक संतुलन, कूटनीति, दयालुता", "भावनात्मक चालाकी, मनमौजीपन"],
  ],
  swords: [
    ["स्पष्टता, सफलता, सत्य", "भ्रम, ग़लतफ़हमी"], ["कठिन चुनाव, गतिरोध", "अनिर्णय, जानकारी का बोझ"], ["दिल टूटना, दुःख, कड़वा सच", "उबरना, क्षमा"],
    ["विश्राम, स्वास्थ्य-लाभ, चिंतन", "बेचैनी, थकान"], ["टकराव, क़ीमत चुकाकर जीत", "मेल-मिलाप, सुधार"], ["बदलाव, आगे बढ़ना, शांत राह", "अधूरा काम, विरोध"],
    ["रणनीति, विवेक, अकेले चलना", "सच स्वीकारना, तरीक़ा बदलना"], ["फँसे होने का एहसास, सीमित सोच", "मुक्ति, नया दृष्टिकोण"], ["चिंता, फ़िक्र, बेचैन रातें", "आशा, मदद माँगना"],
    ["अंत, सबसे निचला बिंदु, मुक्ति", "उबरना, पुनर्जीवन"], ["जिज्ञासा, नए विचार, सतर्कता", "बिखरे विचार, अफ़वाहें"], ["महत्वाकांक्षा, तेज़ कार्रवाई, स्पष्टवादिता", "जल्दबाज़ी, बेध्यान ऊर्जा"],
    ["स्पष्ट सीमाएँ, स्वतंत्रता, ईमानदारी", "रूखापन, कठोर निर्णय"], ["बौद्धिक अधिकार, सत्य, स्पष्टता", "शक्ति का दुरुपयोग, चालाकी"],
  ],
  pentacles: [
    ["आर्थिक या काम का नया अवसर, समृद्धि", "छूटा अवसर, कमज़ोर योजना"], ["प्राथमिकताओं का संतुलन, अनुकूलनशीलता", "ज़रूरत से ज़्यादा ज़िम्मेदारी, अव्यवस्था"], ["टीमवर्क, कौशल, सहयोग", "टीमवर्क की कमी, औसत काम"],
    ["बचत, सुरक्षा, नियंत्रण", "लालच, अत्यधिक रक्षा"], ["कठिनाई, असुरक्षा, अलग-थलग महसूस करना", "सुधार, सहायता का आना"], ["उदारता, लेना और देना", "क़र्ज़, शर्तों वाली मदद"],
    ["धैर्य, लंबी अवधि का निवेश", "अधीरता, कम लाभ"], ["कौशल निखारना, परिश्रम, कारीगरी", "पूर्णतावाद, ध्यान की कमी"], ["आत्मनिर्भरता, सुख-सुविधा, पुरस्कार", "काम में ज़रूरत से ज़्यादा डूबना, झटके"],
    ["विरासत, पारिवारिक संपत्ति, लंबी सुरक्षा", "आर्थिक दबाव, स्थिरता का नुक़सान"], ["सीखना, महत्वाकांक्षा, व्यावहारिक अवसर", "प्रगति की कमी, टालमटोल"], ["कड़ी मेहनत, दिनचर्या, भरोसेमंदी", "ऊब, ठहराव"],
    ["व्यावहारिकता, पोषण, सुरक्षा", "काम और घर में असंतुलन"], ["समृद्धि, सुरक्षा, नेतृत्व", "लालच, ज़िद"],
  ],
};
const HG_MINOR: Record<string, Pair[]> = {
  wands: [
    ["prerna, naya venture, creative chingaari", "deri, motivation ki kami"], ["planning, future ka vision, faisle", "anjaane ka darr, kamzor planning"], ["vistaar, door ki soch, pragati", "rukaavatein, deri se frustration"],
    ["jashn, stability, ghar wapsi", "badlaav ka daur, support ki kami"], ["competition, takraav, alag-alag raay", "takraav se bachna, andar ka tension"], ["pehchaan, jeet, confidence", "khud par shak, der se milne wali pehchaan"],
    ["apni baat par date rehna, lagan", "thakaane wala bojh, haar maan lena"], ["tez action, raftaar, khabar", "deri, jhunjhlahat, intezaar"], ["resilience, lagan, aakhri padaav", "thakaan, zyada defensive hona"],
    ["bojh, zimmedaari, kadi mehnat", "kaam baantna, bojh se mukti"], ["utsaah, khoj, koi message", "disha ki kami, taalmatol"], ["energy, junoon, adventure", "jaldbaazi, aaveg"],
    ["confidence, garmjoshi, irada", "insecurity, demanding vyavhaar"], ["vision, leadership, himmat", "aaveg, bahut oonchi ummeedein"],
  ],
  cups: [
    ["nayi bhavnayein, karuna, khulapan", "emotional rukaavat, dabi bhavnayein"], ["partnership, aapsi aakarshan, ekta", "imbalance, tooti baat-cheet"], ["dosti, jashn, community", "zyada bhog, akelapan"],
    ["chintan, udaasi, dobara sochna", "nayi samajh, sweekaar"], ["nuksaan, pachhtaava, dukh", "sweekaar, aage badhna"], ["purani yaadein, bachpan, masoomiyat", "ateet mein jeena, chhod dena"],
    ["options, kalpana, khayaali pulaav", "clarity, focused chunaav"], ["chhod kar aage badhna, gehre arth ki khoj", "badlaav ka darr, atke rehna"], ["santosh, tripti, shukrguzaari", "asantosh, materialism"],
    ["harmony, parivaar, emotional poornata", "mel na baithna, tanaav bhare rishte"], ["creative mauka, jigyaasa, bhavnaon ka message", "emotional immaturity, creative rukaavat"], ["romance, charm, dil ki sunna", "moodiness, unrealistic ummeedein"],
    ["karuna, shaanti, emotional suraksha", "insecurity, co-dependence"], ["emotional balance, diplomacy, dayaluta", "emotional chaalaki, moodiness"],
  ],
  swords: [
    ["clarity, breakthrough, sach", "confusion, galatfehmi"], ["mushkil chunaav, gatirodh", "faisla na kar paana, information ka bojh"], ["dil tootna, dukh, kadva sach", "ubarna, maafi"],
    ["aaraam, recovery, chintan", "bechaini, burnout"], ["takraav, keemat chuka kar jeet", "mel-milaap, galti sudhaarna"], ["badlaav, aage badhna, shaant raasta", "adhoora kaam, virodh"],
    ["strategy, samajhdaari, akele chalna", "sach maanna, tareeka badalna"], ["phanse hone ka ehsaas, seemit soch", "mukti, naya nazariya"], ["chinta, fikr, bechain raatein", "umeed, madad maangna"],
    ["ant, sabse neecha point, mukti", "ubarna, naya jeevan"], ["jigyaasa, naye ideas, saavdhaani", "bikhre vichaar, afwaahein"], ["ambition, tez action, seedhi baat", "jaldbaazi, be-dhyaan energy"],
    ["saaf boundaries, azaadi, imaandaari", "rukhaapan, sakht judgement"], ["intellectual authority, sach, clarity", "power ka galat istemaal, chaalaki"],
  ],
  pentacles: [
    ["paise ya kaam ka naya mauka, samriddhi", "chhoota mauka, kamzor planning"], ["priorities ka balance, adaptability", "zyada commitments, disorganisation"], ["teamwork, skill, sahyog", "teamwork ki kami, average kaam"],
    ["bachat, suraksha, control", "laalach, zyada bachaav"], ["mushkil, insecurity, alag-thalag mehsoos karna", "sudhaar, madad aana"], ["udaarta, lena aur dena", "karz, shartein judi madad"],
    ["dhairya, long-term investment", "be-sabri, kam return"], ["skill nikhaarna, mehnat, kaarigari", "perfectionism, focus ki kami"], ["aatmnirbharta, aaraam, inaam", "kaam mein zyada doobna, jhatke"],
    ["virasat, parivaar ki daulat, lambi suraksha", "paison ka dabaav, stability ka nuksaan"], ["seekhna, ambition, practical mauka", "pragati ki kami, taalmatol"], ["kadi mehnat, routine, bharosemandi", "boriyat, thehraav"],
    ["practical soch, poshan, suraksha", "kaam aur ghar mein imbalance"], ["samriddhi, suraksha, leadership", "laalach, zidd"],
  ],
};

function build(major: Pair[], minor: Record<string, Pair[]>) {
  const m: Record<string, Pair> = {};
  major.forEach((p, i) => { m[`major-${i}`] = p; });
  for (const s of Object.keys(minor)) minor[s].forEach((p, i) => { m[`${s}-${i + 1}`] = p; });
  return m;
}
export const CARD_MEANING: Record<Exclude<RLang, "en">, Record<string, Pair>> = { hi: build(HI_MAJOR, HI_MINOR), hinglish: build(HG_MAJOR, HG_MINOR) };

export const SUIT_THEME: Record<RLang, Record<string, string>> = {
  en: { wands: "energy, ambition and creative drive", cups: "emotions, relationships and intuition", swords: "thoughts, decisions and conflict", pentacles: "work, money, health and the material world" },
  hi: { wands: "ऊर्जा, महत्वाकांक्षा और रचनात्मक प्रेरणा", cups: "भावनाएँ, रिश्ते और अंतर्ज्ञान", swords: "विचार, निर्णय और टकराव", pentacles: "काम, धन, स्वास्थ्य और भौतिक जगत" },
  hinglish: { wands: "energy, ambition aur creative drive", cups: "bhavnayein, rishte aur intuition", swords: "vichaar, faisle aur takraav", pentacles: "kaam, paisa, health aur bhautik duniya" },
};
export const SUIT_NAME: Record<RLang, Record<string, string>> = {
  en: { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" },
  hi: { wands: "वैंड्स (दंड)", cups: "कप्स (प्याले)", swords: "स्वॉर्ड्स (तलवारें)", pentacles: "पेंटाकल्स (सिक्के)" },
  hinglish: { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" },
};

export const SPREAD_NAME: Record<RLang, Record<string, string>> = {
  en: { single: "Single Card", three: "Past · Present · Future", five: "Five-Card Guidance", celtic: "Celtic Cross" },
  hi: { single: "एक कार्ड", three: "अतीत · वर्तमान · भविष्य", five: "पाँच कार्ड मार्गदर्शन", celtic: "केल्टिक क्रॉस" },
  hinglish: { single: "Ek Card", three: "Ateet · Vartmaan · Bhavishya", five: "Paanch Card Guidance", celtic: "Celtic Cross" },
};

/** Position id → [label, meaning]. */
export const POSITION: Record<RLang, Record<string, [string, string]>> = {
  en: {},
  hi: { focus: ["आपका कार्ड", "आपके प्रश्न के केंद्र की ऊर्जा"], past: ["अतीत", "जिसने इस स्थिति को आकार दिया"], present: ["वर्तमान", "अभी चीज़ें कहाँ हैं"], future: ["भविष्य", "कुछ न बदले तो चीज़ें किस दिशा में जा रही हैं"], situation: ["स्थिति", "मामले का मूल"], challenge: ["चुनौती", "जो रास्ते में है"], hidden: ["छिपा प्रभाव", "जो सतह के नीचे काम कर रहा है"], guidance: ["मार्गदर्शन", "कैसे आगे बढ़ें, इसकी सलाह"], direction: ["दिशा", "यह राह कहाँ ले जा रही है"], foundation: ["नींव", "मामले की जड़"], conscious: ["सचेत लक्ष्य", "आप किस ओर बढ़ रहे हैं"], near: ["निकट भविष्य", "जो आ रहा है"], self: ["आप स्वयं", "आपका दृष्टिकोण और स्थिति"], environment: ["परिवेश", "आपके आसपास के लोग और प्रभाव"], hopes: ["आशाएँ और डर", "जिसकी आपको आशा या डर है"], outcome: ["संभावित परिणाम", "वर्तमान राह पर चीज़ें कहाँ पहुँचती हैं"] },
  hinglish: { focus: ["Aapka card", "aapke sawaal ke centre ki energy"], past: ["Ateet", "jisne is situation ko shape diya"], present: ["Vartmaan", "abhi cheezein kahan hain"], future: ["Bhavishya", "kuch na badle to cheezein kis disha mein ja rahi hain"], situation: ["Situation", "maamle ki jadd"], challenge: ["Chunauti", "jo raaste mein hai"], hidden: ["Chhupa asar", "jo surface ke neeche kaam kar raha hai"], guidance: ["Margdarshan", "kaise aage badhein, iski salaah"], direction: ["Disha", "yeh raasta kahan le ja raha hai"], foundation: ["Neenv", "maamle ki jadd"], conscious: ["Conscious goal", "aap kis taraf badh rahe hain"], near: ["Najdeeki bhavishya", "jo aa raha hai"], self: ["Aap khud", "aapka nazariya aur sthiti"], environment: ["Aas-paas", "aapke aas-paas ke log aur asar"], hopes: ["Umeedein aur darr", "jiski aapko umeed ya darr hai"], outcome: ["Sambhavit result", "abhi ke raaste par cheezein kahan pahunchti hain"] },
};

export const TOPIC_LABEL: Record<RLang, Record<string, string>> = {
  en: { general: "General guidance", career: "Career", love: "Love & relationships", finance: "Money & finance", growth: "Personal growth" },
  hi: { general: "सामान्य मार्गदर्शन", career: "करियर", love: "प्रेम और रिश्ते", finance: "धन और वित्त", growth: "व्यक्तिगत विकास" },
  hinglish: { general: "General guidance", career: "Career", love: "Pyaar aur rishte", finance: "Paisa aur finance", growth: "Personal growth" },
};
