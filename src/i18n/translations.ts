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

  // Advisor extras
  loadingFarmWeather: string;
  cropScanAttached: string;
  tapToReopenScan: string;
  tapToView: string;

  // Tabs
  tabDashboard: string;
  tabFarm: string;
  tabCalendar: string;
  tabAdvisor: string;
  tabProfile: string;

  // Dashboard extras
  gatheringFarmIntelligence: string;
  couldNotLoadDashboard: string;
  noDashboardData: string;
  reload: string;
  signInAgain: string;
  finishFarmSetup: string;
  completeFarmProfile: string;
  completeFarmDetails: string;
  completeLabel: string;
  noFarmFieldsYet: string;
  addYourFirstField: string;
  addCropsForPrices: string;
  openMarket: string;
  rising: string;
  falling: string;
  stable: string;
  soilOpenMeteoNote: string;
  today: string;
  askAiMore: string;
  addNewFarmField: string;
  fieldName: string;
  cropPlantedOnField: string;
  cropLabel: string;
  addCropsInSettingsFirst: string;
  areaEstimateOptional: string;
  leaveBlankWalkBoundary: string;
  walkBoundaryAfterSave: string;
  skipWalkForNow: string;
  alertLabel: string;

  // Calendar
  calendarTitle: string;
  planTrackActivities: string;
  seasonLabel: string;
  rainySeasonWindow: string;
  drySeasonWindow: string;
  seasonalAutoNote: string;
  itsTimeFor: string;
  plantingMonths: string;
  addPlantingTask: string;
  watchAlerts: string;
  noPlantingWindows: string;
  cropWatches: string;
  cropWatchesHint: string;
  addAnotherCrop: string;
  watch: string;
  todaysTasks: string;
  tasksFor: string;
  addTask: string;
  noTasksForDay: string;
  completed: string;
  markComplete: string;
  editTask: string;
  newTask: string;
  titleLabel: string;
  descriptionOptional: string;
  addDetailsPlaceholder: string;
  dateLabel: string;
  timeOfDay: string;
  durationMinutes: string;
  priority: string;
  update: string;
  deleteTask: string;
  deleteTaskConfirm: string;
  periodMorning: string;
  periodAfternoon: string;
  periodEvening: string;
  impactLow: string;
  impactMedium: string;
  impactHigh: string;
  taskAdded: string;
  plantingTaskAdded: string;
  watching: string;
  watchNotifyHint: string;
  deleted: string;
  taskRemoved: string;
  errorGeneric: string;
  couldNotCreateTask: string;
  couldNotUpdateTask: string;
  couldNotDeleteTask: string;
  couldNotSaveWatch: string;
  couldNotCreatePlanting: string;
  inspectMaizePlaceholder: string;
  groundnutPlaceholder: string;

  // Farm page
  loadingFarmData: string;
  noFieldsYet: string;
  details: string;
  walkBoundary: string;
  finances: string;
  measured: string;
  boundaryPending: string;
  addNote: string;
  noJournalEntries: string;
  fieldLabel: string;
  editField: string;
  addNewField: string;
  estimatedUntilMeasured: string;
  editJournalEntry: string;
  addJournalEntry: string;
  noteLabel: string;
  whatDidYouObserve: string;
  typeLabel: string;
  fieldAdded: string;
  walkBoundaryWhenAtFarm: string;
  couldNotAddField: string;

  // Field detail
  fieldFallback: string;
  insideFarm: string;
  fieldDetails: string;
  couldNotLoadField: string;
  overview: string;
  healthLabel: string;
  moistureLabel: string;
  boundaryMeasured: string;
  planted: string;
  expenses: string;
  income: string;
  net: string;
  openLedger: string;
  location: string;
  farmOutlineHint: string;
  zoomToFarm: string;
  actions: string;
  walkUpdateBoundary: string;
  scanCropHealth: string;
  fieldFinances: string;
  dayLabel: string;

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
    loadingFarmWeather: 'Loading farm weather...',
    cropScanAttached: 'Crop scan attached',
    tapToReopenScan: 'Tap to reopen the full scan result',
    tapToView: 'Tap to view',
    tabDashboard: 'Dashboard',
    tabFarm: 'My Farm',
    tabCalendar: 'Calendar',
    tabAdvisor: 'AI Advisor',
    tabProfile: 'Profile',
    gatheringFarmIntelligence: 'Gathering farm intelligence...',
    couldNotLoadDashboard: "Couldn't load dashboard",
    noDashboardData: 'No dashboard data',
    reload: 'Reload',
    signInAgain: 'Sign in again',
    finishFarmSetup: 'Finish setting up your farm to unlock local weather, soil conditions, disease alerts, and AI insights.',
    completeFarmProfile: 'Complete your farm profile',
    completeFarmDetails: 'Complete farm details',
    completeLabel: 'Complete',
    noFarmFieldsYet: 'No farm fields yet.',
    addYourFirstField: 'Add your first field',
    addCropsForPrices: 'Add crops to your profile to see price estimates.',
    openMarket: 'Open Market',
    rising: 'Rising',
    falling: 'Falling',
    stable: 'Stable',
    soilOpenMeteoNote: 'From Open-Meteo at your farm GPS (moisture/temperature proxies) — not a lab NPK/pH soil test.',
    today: 'Today',
    askAiMore: 'Ask AI more',
    addNewFarmField: 'Add new farm field',
    fieldName: 'Field name',
    cropPlantedOnField: 'Crop planted on this field',
    cropLabel: 'Crop',
    addCropsInSettingsFirst: 'Add crops in Settings first',
    areaEstimateOptional: 'Area estimate (m²) — optional',
    leaveBlankWalkBoundary: 'Leave blank and walk the boundary',
    walkBoundaryAfterSave: 'Walk boundary after save',
    skipWalkForNow: 'Skip walk for now',
    alertLabel: 'alert',
    calendarTitle: 'Calendar',
    planTrackActivities: 'Plan and track your farm activities',
    seasonLabel: 'Season',
    rainySeasonWindow: 'Rainy season window',
    drySeasonWindow: 'Dry season window',
    seasonalAutoNote: 'Auto suggestions from crop calendars for Nigeria — no AI guesswork.',
    itsTimeFor: "It's time for",
    plantingMonths: 'Planting months',
    addPlantingTask: 'Add planting task',
    watchAlerts: 'Watch alerts',
    noPlantingWindows: 'No planting windows open for your crops right now. Add watches below to get notified later.',
    cropWatches: 'Crop watches',
    cropWatchesHint: 'Pick crops you want alerts for when planting time starts in your zone.',
    addAnotherCrop: 'Add another crop',
    watch: 'Watch',
    todaysTasks: "Today's tasks",
    tasksFor: 'Tasks for',
    addTask: 'Add task',
    noTasksForDay: 'No tasks for this day.',
    completed: 'Completed',
    markComplete: 'Mark complete',
    editTask: 'Edit task',
    newTask: 'New task',
    titleLabel: 'Title',
    descriptionOptional: 'Description (optional)',
    addDetailsPlaceholder: 'Add details...',
    dateLabel: 'Date',
    timeOfDay: 'Time of day',
    durationMinutes: 'Duration (minutes)',
    priority: 'Priority',
    update: 'Update',
    deleteTask: 'Delete task',
    deleteTaskConfirm: 'Delete task?',
    periodMorning: 'morning',
    periodAfternoon: 'afternoon',
    periodEvening: 'evening',
    impactLow: 'low',
    impactMedium: 'medium',
    impactHigh: 'high',
    taskAdded: 'Task added',
    plantingTaskAdded: 'Planting task added to your calendar.',
    watching: 'Watching',
    watchNotifyHint: 'You will be notified when planting time arrives.',
    deleted: 'Deleted',
    taskRemoved: 'Task removed.',
    errorGeneric: 'Error',
    couldNotCreateTask: 'Could not create task.',
    couldNotUpdateTask: 'Could not update task.',
    couldNotDeleteTask: 'Could not delete task.',
    couldNotSaveWatch: 'Could not save crop watch.',
    couldNotCreatePlanting: 'Could not create planting task.',
    inspectMaizePlaceholder: 'e.g. Inspect maize field',
    groundnutPlaceholder: 'e.g. Groundnut',
    loadingFarmData: 'Loading farm data...',
    noFieldsYet: 'No fields yet. Add your first field to get started.',
    details: 'Details',
    walkBoundary: 'Walk boundary',
    finances: 'Finances',
    measured: 'Measured',
    boundaryPending: 'Boundary pending',
    addNote: 'Add note',
    noJournalEntries: 'No journal entries yet.',
    fieldLabel: 'Field',
    editField: 'Edit field',
    addNewField: 'Add new field',
    estimatedUntilMeasured: 'Estimated until you walk the boundary',
    editJournalEntry: 'Edit journal entry',
    addJournalEntry: 'Add journal entry',
    noteLabel: 'Note',
    whatDidYouObserve: 'What did you observe or do?',
    typeLabel: 'Type',
    fieldAdded: 'Field added',
    walkBoundaryWhenAtFarm: 'Walk the boundary when you are at the farm.',
    couldNotAddField: 'Could not add farm field.',
    fieldFallback: 'Field',
    insideFarm: 'Inside',
    fieldDetails: 'Field details',
    couldNotLoadField: 'Could not load this field.',
    overview: 'Overview',
    healthLabel: 'Health',
    moistureLabel: 'Moisture',
    boundaryMeasured: 'Boundary measured',
    planted: 'Planted',
    expenses: 'Expenses',
    income: 'Income',
    net: 'Net',
    openLedger: 'Open ledger',
    location: 'Location',
    farmOutlineHint: 'Farm outline from your registered size, with this field boundary inside it.',
    zoomToFarm: 'Zoom to farm',
    actions: 'Actions',
    walkUpdateBoundary: 'Walk / update boundary',
    scanCropHealth: 'Scan crop health',
    fieldFinances: 'Field finances',
    dayLabel: 'Day',
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
    loadingFarmWeather: 'Ana ɗaukar yanayin gona...',
    cropScanAttached: 'An haɗa binciken amfanin gona',
    tapToReopenScan: 'Taɓa don sake buɗe cikakken sakamakon bincike',
    tapToView: 'Taɓa don gani',
    tabDashboard: 'Allon bayani',
    tabFarm: 'Gona ta',
    tabCalendar: 'Kalanda',
    tabAdvisor: 'Mai shawara AI',
    tabProfile: 'Bayanan kai',
    gatheringFarmIntelligence: 'Ana tattara bayanan gona...',
    couldNotLoadDashboard: 'An kasa buɗe allon bayani',
    noDashboardData: 'Babu bayanan allon bayani',
    reload: 'Sake lodawa',
    signInAgain: 'Shiga sake',
    finishFarmSetup: 'Kammala saita gonarka don buɗe yanayi na gida, yanayin ƙasa, faɗakarwar cuta, da shawarwarin AI.',
    completeFarmProfile: 'Kammala bayanan gonarka',
    completeFarmDetails: 'Kammala cikakkun bayanan gona',
    completeLabel: 'Kammala',
    noFarmFieldsYet: 'Har yanzu babu filayen gona.',
    addYourFirstField: 'Ƙara filinka na farko',
    addCropsForPrices: 'Ƙara amfanin gona a bayananka don ganin ƙimar farashi.',
    openMarket: 'Buɗe Kasuwa',
    rising: 'Yana tashi',
    falling: 'Yana faɗuwa',
    stable: 'Ya tsaya',
    soilOpenMeteoNote: 'Daga Open-Meteo a GPS ɗin gonarka (alamomin danshi/zazzabi) — ba gwajin ƙasa na lab NPK/pH ba.',
    today: 'Yau',
    askAiMore: 'Tambayi AI ƙarin',
    addNewFarmField: 'Ƙara sabon filin gona',
    fieldName: 'Sunan filin',
    cropPlantedOnField: 'Amfanin da aka shuka a wannan filin',
    cropLabel: 'Amfanin gona',
    addCropsInSettingsFirst: 'Da farko ƙara amfanin gona a Saituna',
    areaEstimateOptional: 'Ƙiyasin yanki (m²) — na zaɓi',
    leaveBlankWalkBoundary: 'Bar shi fanko kuma yi tafiya a iyakar',
    walkBoundaryAfterSave: 'Yi tafiya a iyakar bayan ajiyewa',
    skipWalkForNow: 'Tsallake tafiya yanzu',
    alertLabel: 'faɗakarwa',
    calendarTitle: 'Kalanda',
    planTrackActivities: 'Tsara kuma bi ayyukan gonarka',
    seasonLabel: 'Lokaci',
    rainySeasonWindow: 'Lokacin damina',
    drySeasonWindow: 'Lokacin rani',
    seasonalAutoNote: 'Shawarwari kai-tsaye daga kalandan amfanin gona na Najeriya — ba zato na AI ba.',
    itsTimeFor: 'Lokaci ya yi na',
    plantingMonths: 'Watanni na shuka',
    addPlantingTask: 'Ƙara aikin shuka',
    watchAlerts: 'Faɗakarwar kulawa',
    noPlantingWindows: 'Babu lokacin shuka a buɗe don amfanin gonarka yanzu. Ƙara kulawa a ƙasa don samun sanarwa daga baya.',
    cropWatches: 'Kulawar amfanin gona',
    cropWatchesHint: 'Zaɓi amfanin da kake son faɗakarwa a lokacin da shuka ta fara a yankinka.',
    addAnotherCrop: 'Ƙara wani amfanin gona',
    watch: 'Kula',
    todaysTasks: 'Ayyukan yau',
    tasksFor: 'Ayyuka na',
    addTask: 'Ƙara aiki',
    noTasksForDay: 'Babu aiki a wannan rana.',
    completed: 'An gama',
    markComplete: 'Alama cewa an gama',
    editTask: 'Gyara aiki',
    newTask: 'Sabon aiki',
    titleLabel: 'Take',
    descriptionOptional: 'Bayani (na zaɓi)',
    addDetailsPlaceholder: 'Ƙara cikakkun bayanai...',
    dateLabel: 'Kwanan wata',
    timeOfDay: 'Lokacin rana',
    durationMinutes: 'Tsawon lokaci (mintuna)',
    priority: 'Muhimmanci',
    update: 'Sabunta',
    deleteTask: 'Share aiki',
    deleteTaskConfirm: 'A share aiki?',
    periodMorning: 'safiya',
    periodAfternoon: 'rana',
    periodEvening: 'yamma',
    impactLow: 'ƙasa',
    impactMedium: 'matsakaici',
    impactHigh: 'sama',
    taskAdded: 'An ƙara aiki',
    plantingTaskAdded: 'An ƙara aikin shuka a kalandarka.',
    watching: 'Ana kulawa',
    watchNotifyHint: 'Za a sanar da kai lokacin da lokacin shuka ya zo.',
    deleted: 'An share',
    taskRemoved: 'An cire aiki.',
    errorGeneric: 'Kuskure',
    couldNotCreateTask: 'An kasa ƙirƙirar aiki.',
    couldNotUpdateTask: 'An kasa sabunta aiki.',
    couldNotDeleteTask: 'An kasa share aiki.',
    couldNotSaveWatch: 'An kasa ajiye kulawar amfanin gona.',
    couldNotCreatePlanting: 'An kasa ƙirƙirar aikin shuka.',
    inspectMaizePlaceholder: 'misali: Duba filin masara',
    groundnutPlaceholder: 'misali: Gyada',
    loadingFarmData: 'Ana ɗaukar bayanan gona...',
    noFieldsYet: 'Har yanzu babu filaye. Ƙara filinka na farko don farawa.',
    details: 'Cikakkun bayanai',
    walkBoundary: 'Yi tafiya a iyakar',
    finances: 'Kudi',
    measured: 'An auna',
    boundaryPending: 'Iyakar tana jiran aiki',
    addNote: 'Ƙara rubutu',
    noJournalEntries: 'Har yanzu babu rubuce-rubucen littafi.',
    fieldLabel: 'Filin',
    editField: 'Gyara filin',
    addNewField: 'Ƙara sabon filin',
    estimatedUntilMeasured: 'Ƙiyasi har sai ka yi tafiya a iyakar',
    editJournalEntry: 'Gyara rubutun littafi',
    addJournalEntry: 'Ƙara rubutun littafi',
    noteLabel: 'Rubutu',
    whatDidYouObserve: 'Me ka gani ko ka yi?',
    typeLabel: 'Nau\'i',
    fieldAdded: 'An ƙara filin',
    walkBoundaryWhenAtFarm: 'Yi tafiya a iyakar lokacin da kake a gona.',
    couldNotAddField: 'An kasa ƙara filin gona.',
    fieldFallback: 'Filin',
    insideFarm: 'Ciki',
    fieldDetails: 'Cikakkun bayanan filin',
    couldNotLoadField: 'An kasa buɗe wannan filin.',
    overview: 'Taƙaitaccen bayani',
    healthLabel: 'Lafiya',
    moistureLabel: 'Danshi',
    boundaryMeasured: 'An auna iyakar',
    planted: 'An shuka',
    expenses: 'Kudaden fita',
    income: 'Kudaden shiga',
    net: 'Ragewa',
    openLedger: 'Buɗe littafin lissafi',
    location: 'Wuri',
    farmOutlineHint: 'Zane na gona daga girman da ka yi rajista, tare da iyakar wannan filin a ciki.',
    zoomToFarm: 'Kusantar da gona',
    actions: 'Ayyuka',
    walkUpdateBoundary: 'Yi tafiya / sabunta iyakar',
    scanCropHealth: 'Bincika lafiyar amfanin gona',
    fieldFinances: 'Kudaden filin',
    dayLabel: 'Rana',
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
    loadingFarmWeather: 'A n gbe oju ojo oko wọle...',
    cropScanAttached: 'A ti so ayẹwo irugbin mọ',
    tapToReopenScan: 'Tẹ lati tun ṣi abajade ayẹwo ni kikun',
    tapToView: 'Tẹ lati wo',
    tabDashboard: 'Dasibodu',
    tabFarm: 'Oko mi',
    tabCalendar: 'Kalẹnda',
    tabAdvisor: 'Olùgbàní AI',
    tabProfile: 'Profaili',
    gatheringFarmIntelligence: 'A n gba alaye oko jọ...',
    couldNotLoadDashboard: 'A ko le gbe dasibodu wọle',
    noDashboardData: 'Ko si data dasibodu',
    reload: 'Tun gbe wọle',
    signInAgain: 'Wọle lẹẹkan si',
    finishFarmSetup: 'Pari ṣiṣeto oko rẹ lati ṣii oju ojo agbegbe, ipo ilẹ, ìkìlọ àrùn, ati imọran AI.',
    completeFarmProfile: 'Pari profaili oko rẹ',
    completeFarmDetails: 'Pari alaye oko',
    completeLabel: 'Pari',
    noFarmFieldsYet: 'Ko si àwọn oko sibẹsibẹ.',
    addYourFirstField: 'Fi oko akọkọ rẹ kun',
    addCropsForPrices: 'Fi irugbin kun profaili rẹ lati ri iye owo.',
    openMarket: 'Ṣii Ọja',
    rising: 'N ga',
    falling: 'N dinku',
    stable: 'Duro',
    soilOpenMeteoNote: 'Lati Open-Meteo ni GPS oko rẹ (ami ọrinrin/iwọn otutu) — kii ṣe idanwo ilẹ lab NPK/pH.',
    today: 'Loni',
    askAiMore: 'Beere lọwọ AI sii',
    addNewFarmField: 'Fi oko tuntun kun',
    fieldName: 'Orukọ oko',
    cropPlantedOnField: 'Irugbin ti a gbin lori oko yii',
    cropLabel: 'Irugbin',
    addCropsInSettingsFirst: 'Fi irugbin kun ni Ètò ni akọkọ',
    areaEstimateOptional: 'Iye agbegbe (m²) — aṣayan',
    leaveBlankWalkBoundary: 'Fi silẹ ṣofo ki o rin aala',
    walkBoundaryAfterSave: 'Rin aala lẹhin fifipamọ',
    skipWalkForNow: 'Fo irin bayi',
    alertLabel: 'ìkìlọ',
    calendarTitle: 'Kalẹnda',
    planTrackActivities: 'Ṣeto ati tọpinpin iṣẹ oko rẹ',
    seasonLabel: 'Akoko',
    rainySeasonWindow: 'Akoko ojo',
    drySeasonWindow: 'Akoko ẹrùn',
    seasonalAutoNote: 'Imọran adaṣe lati kalẹnda irugbin fun Naijiria — ko si afojusi AI.',
    itsTimeFor: 'Akoko ti to fun',
    plantingMonths: 'Awọn oṣu gbingbin',
    addPlantingTask: 'Fi iṣẹ gbingbin kun',
    watchAlerts: 'Awọn ìkìlọ iṣọ',
    noPlantingWindows: 'Ko si akoko gbingbin ti o ṣii fun irugbin rẹ bayi. Fi iṣọ kun ni isalẹ lati gba iwifunni nigbamii.',
    cropWatches: 'Awọn iṣọ irugbin',
    cropWatchesHint: 'Yan irugbin ti o fẹ ìkìlọ fun nigbati akoko gbingbin ba bẹrẹ ni agbegbe rẹ.',
    addAnotherCrop: 'Fi irugbin miran kun',
    watch: 'Ṣọ',
    todaysTasks: 'Awọn iṣẹ loni',
    tasksFor: 'Awọn iṣẹ fun',
    addTask: 'Fi iṣẹ kun',
    noTasksForDay: 'Ko si iṣẹ fun ọjọ yii.',
    completed: 'Ti pari',
    markComplete: 'Samisi pe o ti pari',
    editTask: 'Ṣatunkọ iṣẹ',
    newTask: 'Iṣẹ tuntun',
    titleLabel: 'Akọle',
    descriptionOptional: 'Apejuwe (aṣayan)',
    addDetailsPlaceholder: 'Fi alaye kun...',
    dateLabel: 'Ọjọ',
    timeOfDay: 'Akoko ọjọ',
    durationMinutes: 'Iye akoko (iṣẹju)',
    priority: 'Pataki',
    update: 'Ṣe imudojuiwọn',
    deleteTask: 'Pa iṣẹ rẹ',
    deleteTaskConfirm: 'Pa iṣẹ rẹ?',
    periodMorning: 'owuro',
    periodAfternoon: 'ọsan',
    periodEvening: 'ale',
    impactLow: 'kekere',
    impactMedium: 'aarin',
    impactHigh: 'giga',
    taskAdded: 'A ti fi iṣẹ kun',
    plantingTaskAdded: 'A ti fi iṣẹ gbingbin kun kalẹnda rẹ.',
    watching: 'N ṣọ',
    watchNotifyHint: 'A o fi to ọ leti nigbati akoko gbingbin ba de.',
    deleted: 'Ti paarẹ',
    taskRemoved: 'A ti yọ iṣẹ kuro.',
    errorGeneric: 'Aṣiṣe',
    couldNotCreateTask: 'A ko le ṣẹda iṣẹ.',
    couldNotUpdateTask: 'A ko le ṣe imudojuiwọn iṣẹ.',
    couldNotDeleteTask: 'A ko le pa iṣẹ rẹ.',
    couldNotSaveWatch: 'A ko le fi iṣọ irugbin pamọ.',
    couldNotCreatePlanting: 'A ko le ṣẹda iṣẹ gbingbin.',
    inspectMaizePlaceholder: 'apagbẹ: Yẹwo oko agbado',
    groundnutPlaceholder: 'apagbẹ: Ẹpa',
    loadingFarmData: 'A n gbe data oko wọle...',
    noFieldsYet: 'Ko si oko sibẹsibẹ. Fi oko akọkọ rẹ kun lati bẹrẹ.',
    details: 'Alaye',
    walkBoundary: 'Rin aala',
    finances: 'Owo',
    measured: 'Ti wọn',
    boundaryPending: 'Aala n duro de',
    addNote: 'Fi akọsilẹ kun',
    noJournalEntries: 'Ko si akọsilẹ iwe iranti sibẹsibẹ.',
    fieldLabel: 'Oko',
    editField: 'Ṣatunkọ oko',
    addNewField: 'Fi oko tuntun kun',
    estimatedUntilMeasured: 'Iye ifoju titi ti o fi rin aala',
    editJournalEntry: 'Ṣatunkọ akọsilẹ iwe iranti',
    addJournalEntry: 'Fi akọsilẹ iwe iranti kun',
    noteLabel: 'Akọsilẹ',
    whatDidYouObserve: 'Kini o ṣakiyesi tabi ṣe?',
    typeLabel: 'Iru',
    fieldAdded: 'A ti fi oko kun',
    walkBoundaryWhenAtFarm: 'Rin aala nigbati o ba wa ni oko.',
    couldNotAddField: 'A ko le fi oko kun.',
    fieldFallback: 'Oko',
    insideFarm: 'Inu',
    fieldDetails: 'Alaye oko',
    couldNotLoadField: 'A ko le gbe oko yii wọle.',
    overview: 'Akopọ',
    healthLabel: 'Ilera',
    moistureLabel: 'Ọrinrin',
    boundaryMeasured: 'A ti wọn aala',
    planted: 'Ti gbin',
    expenses: 'Inawo',
    income: 'Owó wiwọle',
    net: 'Àpapọ',
    openLedger: 'Ṣii iwe iṣiro',
    location: 'Ibo',
    farmOutlineHint: 'Ààlà oko lati iwọn ti o forukọsilẹ, pẹlu aala oko yii ninu rẹ.',
    zoomToFarm: 'Sunmọ oko',
    actions: 'Awọn iṣẹ',
    walkUpdateBoundary: 'Rin / ṣe imudojuiwọn aala',
    scanCropHealth: 'Yẹwo ilera irugbin',
    fieldFinances: 'Owo oko',
    dayLabel: 'Ọjọ',
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
    loadingFarmWeather: 'We dey load farm weather...',
    cropScanAttached: 'Crop scan don attach',
    tapToReopenScan: 'Tap make you open the full scan result again',
    tapToView: 'Tap to see am',
    tabDashboard: 'Dashboard',
    tabFarm: 'My Farm',
    tabCalendar: 'Calendar',
    tabAdvisor: 'AI Advisor',
    tabProfile: 'Profile',
    gatheringFarmIntelligence: 'We dey gather farm info...',
    couldNotLoadDashboard: 'Dashboard no fit load',
    noDashboardData: 'No dashboard data',
    reload: 'Reload',
    signInAgain: 'Sign in again',
    finishFarmSetup: 'Finish set up your farm so you fit see local weather, soil condition, sickness alert, and AI advice.',
    completeFarmProfile: 'Complete your farm profile',
    completeFarmDetails: 'Complete farm details',
    completeLabel: 'Complete',
    noFarmFieldsYet: 'No farm fields yet.',
    addYourFirstField: 'Add your first field',
    addCropsForPrices: 'Add crops for your profile make you see price estimate.',
    openMarket: 'Open Market',
    rising: 'E dey rise',
    falling: 'E dey fall',
    stable: 'E steady',
    soilOpenMeteoNote: 'From Open-Meteo for your farm GPS (moisture/temperature proxy) — e no be lab NPK/pH soil test.',
    today: 'Today',
    askAiMore: 'Ask AI more',
    addNewFarmField: 'Add new farm field',
    fieldName: 'Field name',
    cropPlantedOnField: 'Crop wey dem plant for this field',
    cropLabel: 'Crop',
    addCropsInSettingsFirst: 'Add crops for Settings first',
    areaEstimateOptional: 'Area estimate (m²) — optional',
    leaveBlankWalkBoundary: 'Leave am blank and walk the boundary',
    walkBoundaryAfterSave: 'Walk boundary after you save',
    skipWalkForNow: 'Skip walk for now',
    alertLabel: 'alert',
    calendarTitle: 'Calendar',
    planTrackActivities: 'Plan and track your farm work',
    seasonLabel: 'Season',
    rainySeasonWindow: 'Rainy season time',
    drySeasonWindow: 'Dry season time',
    seasonalAutoNote: 'Auto suggestion from crop calendar for Nigeria — no AI guesswork.',
    itsTimeFor: 'Na time for',
    plantingMonths: 'Planting months',
    addPlantingTask: 'Add planting task',
    watchAlerts: 'Watch alerts',
    noPlantingWindows: 'No planting window open for your crops now. Add watches below make dem notify you later.',
    cropWatches: 'Crop watches',
    cropWatchesHint: 'Pick crops wey you wan get alert when planting time start for your zone.',
    addAnotherCrop: 'Add another crop',
    watch: 'Watch',
    todaysTasks: 'Today tasks',
    tasksFor: 'Tasks for',
    addTask: 'Add task',
    noTasksForDay: 'No tasks for this day.',
    completed: 'Completed',
    markComplete: 'Mark complete',
    editTask: 'Edit task',
    newTask: 'New task',
    titleLabel: 'Title',
    descriptionOptional: 'Description (optional)',
    addDetailsPlaceholder: 'Add details...',
    dateLabel: 'Date',
    timeOfDay: 'Time of day',
    durationMinutes: 'Duration (minutes)',
    priority: 'Priority',
    update: 'Update',
    deleteTask: 'Delete task',
    deleteTaskConfirm: 'Delete task?',
    periodMorning: 'morning',
    periodAfternoon: 'afternoon',
    periodEvening: 'evening',
    impactLow: 'low',
    impactMedium: 'medium',
    impactHigh: 'high',
    taskAdded: 'Task don add',
    plantingTaskAdded: 'Planting task don enter your calendar.',
    watching: 'Watching',
    watchNotifyHint: 'Dem go notify you when planting time reach.',
    deleted: 'Deleted',
    taskRemoved: 'Task don remove.',
    errorGeneric: 'Error',
    couldNotCreateTask: 'E no fit create task.',
    couldNotUpdateTask: 'E no fit update task.',
    couldNotDeleteTask: 'E no fit delete task.',
    couldNotSaveWatch: 'E no fit save crop watch.',
    couldNotCreatePlanting: 'E no fit create planting task.',
    inspectMaizePlaceholder: 'e.g. Inspect maize field',
    groundnutPlaceholder: 'e.g. Groundnut',
    loadingFarmData: 'We dey load farm data...',
    noFieldsYet: 'No fields yet. Add your first field make you start.',
    details: 'Details',
    walkBoundary: 'Walk boundary',
    finances: 'Money matter',
    measured: 'Measured',
    boundaryPending: 'Boundary still dey wait',
    addNote: 'Add note',
    noJournalEntries: 'No journal entry yet.',
    fieldLabel: 'Field',
    editField: 'Edit field',
    addNewField: 'Add new field',
    estimatedUntilMeasured: 'Estimated until you walk the boundary',
    editJournalEntry: 'Edit journal entry',
    addJournalEntry: 'Add journal entry',
    noteLabel: 'Note',
    whatDidYouObserve: 'Wetin you notice or do?',
    typeLabel: 'Type',
    fieldAdded: 'Field don add',
    walkBoundaryWhenAtFarm: 'Walk the boundary when you dey for the farm.',
    couldNotAddField: 'E no fit add farm field.',
    fieldFallback: 'Field',
    insideFarm: 'Inside',
    fieldDetails: 'Field details',
    couldNotLoadField: 'E no fit load this field.',
    overview: 'Overview',
    healthLabel: 'Health',
    moistureLabel: 'Moisture',
    boundaryMeasured: 'Boundary don measure',
    planted: 'Planted',
    expenses: 'Expenses',
    income: 'Income',
    net: 'Net',
    openLedger: 'Open ledger',
    location: 'Location',
    farmOutlineHint: 'Farm outline from the size wey you register, with this field boundary inside am.',
    zoomToFarm: 'Zoom to farm',
    actions: 'Actions',
    walkUpdateBoundary: 'Walk / update boundary',
    scanCropHealth: 'Scan crop health',
    fieldFinances: 'Field money',
    dayLabel: 'Day',
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
