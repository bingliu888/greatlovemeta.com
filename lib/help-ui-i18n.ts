import type { SiteLanguage } from "./site-locale";

const copy: Record<string, {label:string;unavailable:string;retry:string}> = {
  zh:{label:"帮助",unavailable:"帮助室暂不可用",retry:"请稍后重试。"},
  "zh-tw":{label:"幫助",unavailable:"幫助室暫時無法使用",retry:"請稍後再試。"},
  en:{label:"Help",unavailable:"Help room unavailable",retry:"Please try again shortly."},
  es:{label:"Ayuda",unavailable:"Sala de ayuda no disponible",retry:"Vuelve a intentarlo más tarde."},
  fr:{label:"Aide",unavailable:"Salle d’aide indisponible",retry:"Réessayez dans un instant."},
  de:{label:"Hilfe",unavailable:"Hilferaum nicht verfügbar",retry:"Bitte versuchen Sie es später erneut."},
  ja:{label:"ヘルプ",unavailable:"ヘルプルームを利用できません",retry:"しばらくしてからもう一度お試しください。"},
  ko:{label:"도움말",unavailable:"도움말 방을 사용할 수 없습니다",retry:"잠시 후 다시 시도해 주세요."},
  it:{label:"Aiuto",unavailable:"Sala di assistenza non disponibile",retry:"Riprova tra poco."},
  ar:{label:"المساعدة",unavailable:"غرفة المساعدة غير متاحة",retry:"يرجى المحاولة بعد قليل."},
  pt:{label:"Ajuda",unavailable:"Sala de ajuda indisponível",retry:"Tente novamente em instantes."},
  ru:{label:"Помощь",unavailable:"Комната помощи недоступна",retry:"Повторите попытку позже."},
  hi:{label:"सहायता",unavailable:"सहायता कक्ष उपलब्ध नहीं है",retry:"कृपया थोड़ी देर बाद फिर कोशिश करें।"},
  id:{label:"Bantuan",unavailable:"Ruang bantuan tidak tersedia",retry:"Coba lagi sebentar lagi."},
  bn:{label:"সহায়তা",unavailable:"সহায়তা কক্ষ উপলব্ধ নয়",retry:"কিছুক্ষণ পরে আবার চেষ্টা করুন।"},
  ur:{label:"مدد",unavailable:"مدد کا کمرہ دستیاب نہیں",retry:"براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔"},
  pa:{label:"ਮਦਦ",unavailable:"ਮਦਦ ਕਮਰਾ ਉਪਲਬਧ ਨਹੀਂ ਹੈ",retry:"ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।"},
  ta:{label:"உதவி",unavailable:"உதவி அறை கிடைக்கவில்லை",retry:"சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."},
  te:{label:"సహాయం",unavailable:"సహాయ గది అందుబాటులో లేదు",retry:"దయచేసి కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి."},
  ne:{label:"सहायता",unavailable:"सहायता कक्ष उपलब्ध छैन",retry:"कृपया केही बेरपछि फेरि प्रयास गर्नुहोस्।"},
  si:{label:"උදව්",unavailable:"උදව් කාමරය ලබා ගත නොහැක",retry:"කරුණාකර ටික වේලාවකින් නැවත උත්සාහ කරන්න."},
  tr:{label:"Yardım",unavailable:"Yardım odası kullanılamıyor",retry:"Lütfen biraz sonra tekrar deneyin."},
};

export const helpUiFor = (locale:SiteLanguage) => copy[locale] ?? copy.en;
