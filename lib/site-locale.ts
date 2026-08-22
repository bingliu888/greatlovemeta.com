import { homeInterfaceTranslations } from "./home-interface-translations.generated";

export const siteLanguages = [["zh","中文"],["en","English"],["es","Español"],["ja","日本語"],["ko","한국어"],["fr","Français"],["de","Deutsch"],["ru","Русский"],["it","Italiano"],["pt","Português"],["ar","العربية"],["hi","हिन्दी"]] as const;
export type SiteLanguage = typeof siteLanguages[number][0];
const codes = new Set<string>(siteLanguages.map(([code]) => code));
export const isSiteLanguage = (value:string): value is SiteLanguage => codes.has(value);
export const safeSiteLanguage = (value:string): SiteLanguage => isSiteLanguage(value) ? value : "en";
export const languageHtmlTags:Record<SiteLanguage,string>={zh:"zh-CN",en:"en",es:"es",ja:"ja",ko:"ko",fr:"fr",de:"de",ru:"ru",it:"it",pt:"pt",ar:"ar",hi:"hi"};

export function translateInterface<T>(value:T, language:SiteLanguage):T {
  if (language === "en") return value;
  const dictionary=homeInterfaceTranslations[language];
  if (!dictionary) return value;
  if (typeof value === "string") return (dictionary[value] ?? value) as T;
  if (Array.isArray(value)) return value.map(item=>translateInterface(item,language)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,translateInterface(item,language)])) as T;
  return value;
}

export const interfaceText=(language:SiteLanguage,en:string,zh:string)=>language==="zh"?zh:language==="en"?en:(homeInterfaceTranslations[language]?.[en]??en);
export const shellCopyFor=(language:SiteLanguage)=>({
  primaryNav:interfaceText(language,"Primary navigation","主导航"),
  openMenu:interfaceText(language,"Open menu","打开菜单"),
  closeMenu:interfaceText(language,"Close menu","关闭菜单"),
  language:interfaceText(language,"Language","语言"),
  chooseLanguage:interfaceText(language,"Choose language","选择语言"),
  home:interfaceText(language,"GreatLoveMeta.com home","大爱元宇宙首页"),
  footerNav:interfaceText(language,"Footer navigation","页脚导航"),
  about:interfaceText(language,"About","关于我们"),
  subscriptions:interfaceText(language,"Subscriptions","订阅"),
  privacy:interfaceText(language,"Privacy","隐私政策"),
  terms:interfaceText(language,"Terms","使用条款"),
  project:interfaceText(language,"Project","项目"),
  footerTag:interfaceText(language,"Great Love · Intelligence · Sustainability","大爱 · 智慧 · 永续"),
  assistant:interfaceText(language,"Open AI assistant","打开智能助手"),
});

export const homeHeroTitles:Record<SiteLanguage,readonly string[]>={
  zh:["欢迎来到大爱元宇宙。"],en:["Welcome to RWA.","GreatLove Metaverse."],
  es:["Bienvenido a RWA.","Metaverso GreatLove."],ja:["RWAへようこそ。","GreatLoveメタバース。"],ko:["RWA에 오신 것을 환영합니다.","GreatLove 메타버스."],
  fr:["Bienvenue dans les RWA.","Métavers GreatLove."],de:["Willkommen bei RWA.","GreatLove Metaverse."],ru:["Добро пожаловать в RWA.","Метавселенная GreatLove."],
  it:["Benvenuti in RWA.","Metaverso GreatLove."],pt:["Bem-vindo ao RWA.","Metaverso GreatLove."],ar:["مرحبًا بكم في RWA.","عالم GreatLove الافتراضي."],hi:["RWA में आपका स्वागत है।","GreatLove मेटावर्स।"],
};
