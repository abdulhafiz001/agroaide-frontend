export type SupportedLanguage = 'en' | 'ha' | 'yo' | 'pcm';

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ha', label: 'Hausa', nativeLabel: 'Hausa' },
  { code: 'yo', label: 'Yoruba', nativeLabel: 'Yorùbá' },
  { code: 'pcm', label: 'Pidgin', nativeLabel: 'Naija Pidgin' },
];

type TranslationKeys = {
  // Greetings
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;

  // Dashboard
  priorityTask: string;
  myFarms: string;
  marketPrices: string;
  soilConditions: string;
  forecast: string;
  aiInsights: string;
  viewAll: string;
  noTasksToday: string;
  allCaughtUp: string;
  addFarm: string;
  diseaseAlerts: string;
  outbreakNearby: string;
  viewOutbreakMap: string;

  // Farm
  myFarm: string;
  farmFields: string;
  fieldJournal: string;
  addField: string;
  scan: string;

  // Crop Scanner
  cropScanner: string;
  scanningFor: string;
  generalFarm: string;
  analyzeCrop: string;
  scanAgain: string;
  changeImage: string;
  tapToCapture: string;
  analyzingCrops: string;
  scanAnother: string;
  diseaseDetected: string;
  whatToDo: string;
  takeActionNow: string;
  recommendedProducts: string;
  preventionTips: string;
  longTermAdvice: string;
  personalizedForYou: string;

  // Advisor
  aiAdvisor: string;
  tryAsking: string;
  scanMyCrops: string;
  askPlaceholder: string;
  holdToRecord: string;
  recording: string;
  transcribing: string;

  // Market
  market: string;
  marketHighlights: string;

  // Settings
  settings: string;
  language: string;
  selectLanguage: string;

  // General
  back: string;
  cancel: string;
  save: string;
  retry: string;
  loading: string;
  useMyLocation: string;
  gettingLocation: string;
};

const translations: Record<SupportedLanguage, TranslationKeys> = {
  en: {
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    priorityTask: 'Priority task',
    myFarms: 'My farms',
    marketPrices: 'Market prices',
    soilConditions: 'Soil & conditions',
    forecast: '7-day forecast',
    aiInsights: 'AI insights',
    viewAll: 'View all',
    noTasksToday: 'No tasks for today',
    allCaughtUp: 'All caught up for today!',
    addFarm: 'Add farm',
    diseaseAlerts: 'Disease alerts',
    outbreakNearby: 'Outbreak nearby',
    viewOutbreakMap: 'View outbreak map',
    myFarm: 'My Farm',
    farmFields: 'Farm fields',
    fieldJournal: 'Field journal',
    addField: 'Add field',
    scan: 'Scan',
    cropScanner: 'Crop Scanner',
    scanningFor: 'Scanning for',
    generalFarm: 'General Farm',
    analyzeCrop: 'Analyze Crop',
    scanAgain: 'Scan Again',
    changeImage: 'Change Image',
    tapToCapture: 'Tap to capture or select a photo',
    analyzingCrops: 'Analyzing your crops...',
    scanAnother: 'Scan Another Image',
    diseaseDetected: 'Disease Detected',
    whatToDo: 'What To Do',
    takeActionNow: 'TAKE ACTION NOW',
    recommendedProducts: 'RECOMMENDED PRODUCTS',
    preventionTips: 'PREVENTION TIPS',
    longTermAdvice: 'LONG-TERM ADVICE',
    personalizedForYou: 'PERSONALIZED FOR YOUR FARM',
    aiAdvisor: 'AI Advisor',
    tryAsking: 'Try asking:',
    scanMyCrops: 'Scan my crops',
    askPlaceholder: 'Ask about crops, weather, or pests...',
    holdToRecord: 'Hold to record',
    recording: 'Recording...',
    transcribing: 'Transcribing...',
    market: 'Market',
    marketHighlights: 'Market highlights',
    settings: 'Settings',
    language: 'Language',
    selectLanguage: 'Select language',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    retry: 'Retry',
    loading: 'Loading...',
    useMyLocation: 'Use my location',
    gettingLocation: 'Getting location...',
  },

  ha: {
    goodMorning: 'Barka da safiya',
    goodAfternoon: 'Barka da rana',
    goodEvening: 'Barka da yamma',
    priorityTask: 'Aikin da ke da muhimmanci',
    myFarms: 'Gonakin na',
    marketPrices: 'Farashin kasuwa',
    soilConditions: 'Yanayin ƙasa',
    forecast: 'Hasashen yanayi kwana 7',
    aiInsights: 'Shawarwarin AI',
    viewAll: 'Duba duka',
    noTasksToday: 'Babu aiki a yau',
    allCaughtUp: 'An gama duk aiki a yau!',
    addFarm: 'Ƙara gona',
    diseaseAlerts: 'Faɗakarwar cuta',
    outbreakNearby: 'Cutar tana kusa',
    viewOutbreakMap: 'Duba taswirar cutar',
    myFarm: 'Gona ta',
    farmFields: 'Filayen gona',
    fieldJournal: 'Littafin filin',
    addField: 'Ƙara filin',
    scan: 'Bincika',
    cropScanner: 'Mai binciken amfanin gona',
    scanningFor: 'Ana binciken',
    generalFarm: 'Gona gaba ɗaya',
    analyzeCrop: 'Bincika amfanin gona',
    scanAgain: 'Bincika sake',
    changeImage: 'Canza hoto',
    tapToCapture: 'Taɓa don ɗaukar hoto',
    analyzingCrops: 'Ana binciken amfanin gona...',
    scanAnother: 'Bincika wani hoto',
    diseaseDetected: 'An gano cuta',
    whatToDo: 'Abin da za a yi',
    takeActionNow: 'YI AIKI YANZU',
    recommendedProducts: 'KAYAYYAKI DA AKE BAYARWA',
    preventionTips: 'YADDA ZA A KARE',
    longTermAdvice: 'SHAWARA MAI TSAWO',
    personalizedForYou: 'MUSAMMAN DOMIN GONA KA',
    aiAdvisor: 'Mai ba da shawara',
    tryAsking: 'Yi tambaya:',
    scanMyCrops: 'Bincika amfanin gona na',
    askPlaceholder: 'Tambayi game da amfanin gona, yanayi...',
    holdToRecord: 'Riƙe don yin rikodin',
    recording: 'Ana yin rikodi...',
    transcribing: 'Ana rubuta...',
    market: 'Kasuwa',
    marketHighlights: 'Manyan labarun kasuwa',
    settings: 'Saituna',
    language: 'Harshe',
    selectLanguage: 'Zaɓi harshe',
    back: 'Koma',
    cancel: 'Soke',
    save: 'Ajiye',
    retry: 'Sake gwadawa',
    loading: 'Ana ɗaukawa...',
    useMyLocation: 'Yi amfani da wurin da nake',
    gettingLocation: 'Ana neman wuri...',
  },

  yo: {
    goodMorning: 'E kaaro',
    goodAfternoon: 'E kaasan',
    goodEvening: 'E kule',
    priorityTask: 'Iṣẹ pataki',
    myFarms: 'Oko mi',
    marketPrices: 'Iye ọja',
    soilConditions: 'Ipo ilẹ',
    forecast: 'Asọtẹlẹ ọjọ 7',
    aiInsights: 'Imọran AI',
    viewAll: 'Wo gbogbo',
    noTasksToday: 'Ko si iṣẹ loni',
    allCaughtUp: 'Gbogbo iṣẹ ti pari loni!',
    addFarm: 'Fi oko kun',
    diseaseAlerts: 'Ìkìlọ àrùn',
    outbreakNearby: 'Àrùn wa nitosi',
    viewOutbreakMap: 'Wo maapu àrùn',
    myFarm: 'Oko mi',
    farmFields: 'Àwọn oko',
    fieldJournal: 'Iwe iranti oko',
    addField: 'Fi oko kun',
    scan: 'Ṣayẹwo',
    cropScanner: 'Oluyẹwo irugbin',
    scanningFor: 'A n yẹwo fun',
    generalFarm: 'Oko gbogbo',
    analyzeCrop: 'Ṣe ayẹwo irugbin',
    scanAgain: 'Yẹwo lẹẹkan si',
    changeImage: 'Yi aworan pada',
    tapToCapture: 'Tẹ lati ya aworan',
    analyzingCrops: 'A n ṣayẹwo irugbin rẹ...',
    scanAnother: 'Yẹwo aworan miran',
    diseaseDetected: 'A ri àrùn',
    whatToDo: 'Ohun ti o yẹ ki o ṣe',
    takeActionNow: 'ṢE NKAN BAYI',
    recommendedProducts: 'AWỌN OJA TI A ṢE IGBANIYANJU',
    preventionTips: 'BI O ṢE LE DẸKUN',
    longTermAdvice: 'IMỌRAN IGBA PIPẸ',
    personalizedForYou: 'FUN OKO RE NI PATAKI',
    aiAdvisor: 'Olùgbàní AI',
    tryAsking: 'Gbiyanju lati beere:',
    scanMyCrops: 'Yẹwo irugbin mi',
    askPlaceholder: 'Beere nipa irugbin, ojo, tabi kokoro...',
    holdToRecord: 'Mu lati gba ohun',
    recording: 'A n gba ohun...',
    transcribing: 'A n kọ ọrọ...',
    market: 'Ọja',
    marketHighlights: 'Awọn iroyin ọja',
    settings: 'Ètò',
    language: 'Èdè',
    selectLanguage: 'Yan èdè',
    back: 'Pada',
    cancel: 'Fagilee',
    save: 'Fi pamọ',
    retry: 'Tun gbiyanju',
    loading: 'A n gbe wọle...',
    useMyLocation: 'Lo ipo mi',
    gettingLocation: 'A n wa ipo...',
  },

  pcm: {
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    priorityTask: 'Important task',
    myFarms: 'My farms',
    marketPrices: 'Market price',
    soilConditions: 'Soil condition',
    forecast: '7-day weather',
    aiInsights: 'AI advice',
    viewAll: 'See all',
    noTasksToday: 'No work for today',
    allCaughtUp: 'You don finish everything for today!',
    addFarm: 'Add farm',
    diseaseAlerts: 'Sickness alert',
    outbreakNearby: 'Sickness dey near you',
    viewOutbreakMap: 'See sickness map',
    myFarm: 'My Farm',
    farmFields: 'Farm fields',
    fieldJournal: 'Field diary',
    addField: 'Add field',
    scan: 'Check',
    cropScanner: 'Crop Checker',
    scanningFor: 'Checking for',
    generalFarm: 'Whole Farm',
    analyzeCrop: 'Check Crop',
    scanAgain: 'Check Again',
    changeImage: 'Change Picture',
    tapToCapture: 'Tap to snap or pick photo',
    analyzingCrops: 'We dey check your crops...',
    scanAnother: 'Check Another Picture',
    diseaseDetected: 'Sickness Found',
    whatToDo: 'Wetin to do',
    takeActionNow: 'DO AM NOW',
    recommendedProducts: 'PRODUCTS WEY GO HELP',
    preventionTips: 'HOW TO PREVENT AM',
    longTermAdvice: 'LONG TIME ADVICE',
    personalizedForYou: 'ESPECIALLY FOR YOUR FARM',
    aiAdvisor: 'AI Helper',
    tryAsking: 'Try ask:',
    scanMyCrops: 'Check my crops',
    askPlaceholder: 'Ask about crops, weather, or wahala...',
    holdToRecord: 'Hold to talk',
    recording: 'Recording...',
    transcribing: 'Writing am down...',
    market: 'Market',
    marketHighlights: 'Market gist',
    settings: 'Settings',
    language: 'Language',
    selectLanguage: 'Pick language',
    back: 'Go back',
    cancel: 'Cancel',
    save: 'Save',
    retry: 'Try again',
    loading: 'Loading...',
    useMyLocation: 'Use my location',
    gettingLocation: 'Finding where you dey...',
  },
};

export default translations;
