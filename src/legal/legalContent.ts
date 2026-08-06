import type { SupportedLanguage } from '@/i18n/translations';

export const TERMS_VERSION = '2026-08-06';
export const PRIVACY_VERSION = '2026-08-06';
export const LEGAL_CONTACT_PLACEHOLDER = '[CONTACT EMAIL TO BE CONFIRMED BEFORE RELEASE]';

type LegalCopy = {
  privacyTitle: string;
  termsTitle: string;
  prototype: string;
  privacySections: { title: string; body: string }[];
  termsSections: { title: string; body: string }[];
};

export const LEGAL_CONTENT: Record<SupportedLanguage, LegalCopy> = {
  en: {
    privacyTitle: 'Privacy notice',
    termsTitle: 'Terms of use',
    prototype: 'Academic research prototype — not a substitute for professional agricultural advice.',
    privacySections: [
      { title: 'What we collect', body: 'Account, farm, location, crop, scan, journal, finance, notification, and app-use data you provide or create.' },
      { title: 'Why we use it', body: 'To operate AgroAide, personalize guidance, study prototype usability, protect the service, and improve research results.' },
      { title: 'Storage and sharing', body: 'Data may be processed by the research team and service providers used for hosting, maps, weather, notifications, transcription, and AI analysis. We do not sell personal data.' },
      { title: 'Your choices', body: 'Research consent is optional. You can export your data, clear histories, or request account deletion from Settings.' },
      { title: 'Contact', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
    termsSections: [
      { title: 'Prototype use', body: 'AgroAide is an academic research prototype. Features may change, fail, or provide incomplete results.' },
      { title: 'Farm decisions', body: 'Check AI, weather, disease, finance, and treatment information with qualified local professionals before acting.' },
      { title: 'Your responsibilities', body: 'Provide lawful information, protect your account, and do not misuse the service or upload content you lack permission to use.' },
      { title: 'Research participation', body: 'Optional research consent is separate from accepting these terms and the privacy notice. You may use the prototype without consenting to research.' },
      { title: 'Contact', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
  },
  ha: {
    privacyTitle: 'Sanarwar sirri',
    termsTitle: 'Ka’idojin amfani',
    prototype: 'Samfurin binciken jami’a ne — ba madadin shawarar ƙwararren noma ba.',
    privacySections: [
      { title: 'Abin da muke tattarawa', body: 'Bayanan asusu, gona, wuri, amfanin gona, hoton bincike, kundin aiki, kuɗi, sanarwa da yadda ake amfani da manhaja.' },
      { title: 'Dalilin amfani', body: 'Don gudanar da AgroAide, daidaita shawara, nazarin sauƙin amfani, kare sabis da inganta bincike.' },
      { title: 'Adanawa da rabawa', body: 'Ƙungiyar bincike da masu samar da hosting, taswira, yanayi, sanarwa, rubuta murya da nazarin AI na iya sarrafa bayanai. Ba ma sayar da bayanan mutum.' },
      { title: 'Zaɓinka', body: 'Yarda da bincike zaɓi ne. Za ka iya fitar da bayanai, goge tarihi ko neman goge asusu a Settings.' },
      { title: 'Tuntuɓa', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
    termsSections: [
      { title: 'Amfani da samfurin', body: 'AgroAide samfurin binciken jami’a ne. Ayyuka na iya canzawa, kasa aiki ko bayar da sakamako marar cikawa.' },
      { title: 'Shawarar gona', body: 'Tabbatar da bayanin AI, yanayi, cuta, kuɗi da magani wurin ƙwararren yankinku kafin aiki.' },
      { title: 'Nauyinka', body: 'Ba da bayanai na halal, kare asusu kuma kada a yi amfani da sabis ba daidai ba.' },
      { title: 'Shiga bincike', body: 'Yarda da bincike zaɓi ne dabam da yarda da waɗannan ka’idoji da sanarwar sirri.' },
      { title: 'Tuntuɓa', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
  },
  yo: {
    privacyTitle: 'Ìfitónilétí àṣírí',
    termsTitle: 'Àwọn òfin lílò',
    prototype: 'Àpẹẹrẹ ìwádìí ilé-ẹ̀kọ́ gíga — kì í ṣe ìròyìn amọ̀ṣẹ́ iṣẹ́ àgbẹ̀.',
    privacySections: [
      { title: 'Ohun tí a ń kó', body: 'Àkọọ́lẹ̀, oko, ibi, irúgbìn, àyẹ̀wò, ìwé iṣẹ́, owó, ìfitónilétí àti bí o ṣe ń lo ètò náà.' },
      { title: 'Ìdí tí a fi ń lò ó', body: 'Láti ṣiṣẹ́ AgroAide, ṣe ìmọ̀ràn tó bá ọ mu, kẹ́kọ̀ọ́ lílò àpẹẹrẹ, dáàbò bo iṣẹ́ àti mú ìwádìí dára.' },
      { title: 'Ìpamọ́ àti pínpín', body: 'Ẹgbẹ́ ìwádìí àti àwọn olùpèsè hosting, máàpù, ojú-ọjọ́, ìfitónilétí, ìkọ̀wé-ohùn àti AI lè ṣiṣẹ́ lórí data. A kì í ta data ẹni.' },
      { title: 'Àṣàyàn rẹ', body: 'Ìfọwọ́sí ìwádìí jẹ́ àṣàyàn. O lè gba data rẹ, pa ìtàn rẹ tàbí béèrè pípa àkọọ́lẹ̀ nínú Settings.' },
      { title: 'Kàn sí wa', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
    termsSections: [
      { title: 'Lílò àpẹẹrẹ', body: 'AgroAide jẹ́ àpẹẹrẹ ìwádìí. Àwọn iṣẹ́ lè yípadà, má ṣiṣẹ́ tàbí fúnni ní èsì tí kò pé.' },
      { title: 'Ìpinnu oko', body: 'Jẹ́ kí amọ̀ṣẹ́ agbègbè rẹ ṣàyẹ̀wò ìmọ̀ràn AI, ojú-ọjọ́, àrùn, owó àti ìtọ́jú kí o tó ṣe nǹkan.' },
      { title: 'Ojúsẹ rẹ', body: 'Fún wa ní data tó bófin mu, dáàbò bo àkọọ́lẹ̀ rẹ, má sì lo iṣẹ́ náà lọ́nà búburú.' },
      { title: 'Kíkópa nínú ìwádìí', body: 'Ìfọwọ́sí ìwádìí jẹ́ àṣàyàn tó yàtọ̀ sí gbígba àwọn òfin àti ìfitónilétí àṣírí.' },
      { title: 'Kàn sí wa', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
  },
  pcm: {
    privacyTitle: 'Privacy notice',
    termsTitle: 'Rules for use',
    prototype: 'Na school research prototype — e no replace advice from agriculture professional.',
    privacySections: [
      { title: 'Wetin we collect', body: 'Account, farm, location, crop, scan, journal, money, notification and app-use information wey you give or create.' },
      { title: 'Why we use am', body: 'To run AgroAide, arrange advice for you, study how prototype easy to use, protect service and improve research.' },
      { title: 'How we keep and share am', body: 'Research team and providers for hosting, map, weather, notification, voice writing and AI fit process data. We no dey sell personal data.' },
      { title: 'Your choice', body: 'Research consent na optional. You fit export data, clear history or ask make dem delete account for Settings.' },
      { title: 'Contact', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
    termsSections: [
      { title: 'Prototype use', body: 'AgroAide na school research prototype. Features fit change, fail or bring result wey no complete.' },
      { title: 'Farm decisions', body: 'Confirm AI, weather, disease, money and treatment information with local professional before you act.' },
      { title: 'Your responsibility', body: 'Give lawful information, protect your account and no misuse the service.' },
      { title: 'Research participation', body: 'Research consent na separate optional choice from accepting these rules and privacy notice.' },
      { title: 'Contact', body: LEGAL_CONTACT_PLACEHOLDER },
    ],
  },
};
