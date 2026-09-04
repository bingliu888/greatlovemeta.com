import { homeInterfaceTranslations } from "./home-interface-translations.generated";

export const siteLanguages = [
  ["zh", "中文（简体）"], ["zh-tw", "中文（繁體）"], ["en", "English"], ["es", "Español"],
  ["fr", "Français"], ["de", "Deutsch"], ["ja", "日本語"], ["ko", "한국어"],
  ["it", "Italiano"], ["ar", "العربية"], ["pt", "Português"], ["ru", "Русский"],
  ["hi", "हिन्दी"], ["id", "Bahasa Indonesia"], ["bn", "বাংলা"], ["ur", "اردو"],
  ["pa", "ਪੰਜਾਬੀ"], ["ta", "தமிழ்"], ["te", "తెలుగు"], ["ne", "नेपाली"],
  ["si", "සිංහල"], ["tr", "Türkçe"],
] as const;
export type SiteLanguage = typeof siteLanguages[number][0];
const codes = new Set<string>(siteLanguages.map(([code]) => code));
export const isSiteLanguage = (value:string): value is SiteLanguage => codes.has(value);
export const safeSiteLanguage = (value:string): SiteLanguage => isSiteLanguage(value) ? value : "en";
export function siteLanguageRecord<T>(values:Partial<Record<SiteLanguage,T>>&Pick<Record<SiteLanguage,T>,"en"|"zh">):Record<SiteLanguage,T>{return Object.fromEntries(siteLanguages.map(([language])=>[language,values[language]??(language==="zh-tw"?values.zh:values.en)]))as Record<SiteLanguage,T>}
export const languageHtmlTags:Record<SiteLanguage,string>={zh:"zh-CN","zh-tw":"zh-TW",en:"en",es:"es",fr:"fr",de:"de",ja:"ja",ko:"ko",it:"it",ar:"ar",pt:"pt",ru:"ru",hi:"hi",id:"id",bn:"bn",ur:"ur",pa:"pa",ta:"ta",te:"te",ne:"ne",si:"si",tr:"tr"};
export const isChineseLanguage=(language:SiteLanguage)=>language==="zh"||language==="zh-tw";
export const bilingualContentLanguage=(language:SiteLanguage):"zh"|"en"=>isChineseLanguage(language)?"zh":"en";

export function translateInterface<T>(value:T, language:SiteLanguage):T {
  if (language === "en") return value;
  const dictionary=homeInterfaceTranslations[language];
  if (!dictionary) return value;
  if (typeof value === "string") return (dictionary[value] ?? value) as T;
  if (Array.isArray(value)) return value.map(item=>translateInterface(item,language)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,translateInterface(item,language)])) as T;
  return value;
}

export const interfaceText=(language:SiteLanguage,en:string,zh:string)=>{
  if(language==="zh")return zh;
  if(language==="en")return en;
  const source=language==="zh-tw"?zh:en;
  return homeInterfaceTranslations[language]?.[source]??homeInterfaceTranslations[language]?.[en]??source;
};
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
  account:interfaceText(language,"My account","我的账户"),
  accountMenu:interfaceText(language,"Account menu","账户菜单"),
  signIn:interfaceText(language,"Sign in or register","登录或注册"),
  dashboard:interfaceText(language,"Dashboard","用户面板"),
  myCourses:interfaceText(language,"My Courses","我的课程"),
  messages:interfaceText(language,"Messages","消息中心"),
  settings:interfaceText(language,"Account | Set password","账户 | 设置密码"),
  memberCommunity:interfaceText(language,"Member community","会员社区"),
  projects:interfaceText(language,"Ecosystem projects","共建项目"),
  membership:interfaceText(language,"Membership","会员方案"),
  signOut:interfaceText(language,"Sign out","退出登录"),
  unread:interfaceText(language,"unread","未读"),
});

export const homeHeroTitles=siteLanguageRecord<readonly string[]>({
  zh:["欢迎来到大爱元宇宙。"],en:["Welcome to RWA.","GreatLove Metaverse."],
  es:["Bienvenido a RWA.","Metaverso GreatLove."],ja:["RWAへようこそ。","GreatLoveメタバース。"],ko:["RWA에 오신 것을 환영합니다.","GreatLove 메타버스."],
  fr:["Bienvenue dans les RWA.","Métavers GreatLove."],de:["Willkommen bei RWA.","GreatLove Metaverse."],ru:["Добро пожаловать в RWA.","Метавселенная GreatLove."],
  it:["Benvenuti in RWA.","Metaverso GreatLove."],pt:["Bem-vindo ao RWA.","Metaverso GreatLove."],ar:["مرحبًا بكم في RWA.","عالم GreatLove الافتراضي."],hi:["RWA में आपका स्वागत है।","GreatLove मेटावर्स।"],
});
