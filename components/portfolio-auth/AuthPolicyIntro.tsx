"use client";

import { useEffect, useState } from "react";

const policyCopy: Record<string, string> = {
  en: "Email code is the default. You can switch to password; in password mode, a new email creates an account immediately without another email check.",
  zh: "默认使用邮箱验证码。您也可以切换为密码；在密码模式下，新邮箱会立即创建账户，无需再次验证邮箱。",
  ja: "既定ではメールコードを使用します。パスワードに切り替えることもでき、パスワード方式では新しいメールアドレスですぐにアカウントを作成でき、追加のメール確認は不要です。",
  ko: "기본 방식은 이메일 코드입니다. 비밀번호로 전환할 수도 있으며, 비밀번호 방식에서는 새 이메일로 추가 이메일 확인 없이 즉시 계정이 생성됩니다.",
  es: "El código por correo es el método predeterminado. Puedes cambiar a contraseña; en ese modo, un correo nuevo crea la cuenta de inmediato sin otra verificación.",
  fr: "Le code reçu par e-mail est utilisé par défaut. Vous pouvez choisir un mot de passe ; avec ce mode, une nouvelle adresse crée immédiatement le compte sans autre vérification.",
  de: "Standardmäßig wird ein E-Mail-Code verwendet. Sie können zum Passwort wechseln; dabei erstellt eine neue E-Mail-Adresse das Konto sofort ohne weitere E-Mail-Prüfung.",
  ru: "По умолчанию используется код из письма. Можно перейти на пароль; в этом режиме новый адрес сразу создаёт аккаунт без дополнительной проверки почты.",
  it: "Il codice e-mail è il metodo predefinito. Puoi passare alla password; in questa modalità una nuova e-mail crea subito l’account senza un’altra verifica.",
  pt: "O código por e-mail é o método padrão. Você pode mudar para senha; nesse modo, um novo e-mail cria a conta imediatamente sem outra verificação.",
  ar: "رمز البريد الإلكتروني هو الخيار الافتراضي. يمكنك التبديل إلى كلمة المرور؛ وفي هذا الوضع ينشئ البريد الجديد حسابًا فورًا من دون تحقق إضافي.",
  hi: "ईमेल कोड डिफ़ॉल्ट तरीका है। आप पासवर्ड पर जा सकते हैं; पासवर्ड मोड में नया ईमेल बिना अतिरिक्त ईमेल जाँच के तुरंत खाता बनाता है।",
  id: "Kode email adalah cara bawaan. Anda dapat beralih ke kata sandi; dalam mode ini, email baru langsung membuat akun tanpa pemeriksaan email tambahan.",
  bn: "ইমেল কোড হলো ডিফল্ট পদ্ধতি। আপনি পাসওয়ার্ডে যেতে পারেন; পাসওয়ার্ড মোডে নতুন ইমেল অতিরিক্ত যাচাই ছাড়াই সঙ্গে সঙ্গে অ্যাকাউন্ট তৈরি করে।",
  ur: "ای میل کوڈ پہلے سے طے شدہ طریقہ ہے۔ آپ پاس ورڈ پر جا سکتے ہیں؛ پاس ورڈ موڈ میں نیا ای میل مزید تصدیق کے بغیر فوراً اکاؤنٹ بناتا ہے۔",
  pa: "ਈਮੇਲ ਕੋਡ ਮੂਲ ਤਰੀਕਾ ਹੈ। ਤੁਸੀਂ ਪਾਸਵਰਡ ਚੁਣ ਸਕਦੇ ਹੋ; ਪਾਸਵਰਡ ਮੋਡ ਵਿੱਚ ਨਵੀਂ ਈਮੇਲ ਬਿਨਾਂ ਹੋਰ ਜਾਂਚ ਦੇ ਤੁਰੰਤ ਖਾਤਾ ਬਣਾਉਂਦੀ ਹੈ।",
  ta: "மின்னஞ்சல் குறியீடு இயல்புநிலை முறை. கடவுச்சொல்லுக்கு மாறலாம்; கடவுச்சொல் முறையில் புதிய மின்னஞ்சல் கூடுதல் சரிபார்ப்பின்றி உடனே கணக்கை உருவாக்கும்.",
  te: "ఇమెయిల్ కోడ్ డిఫాల్ట్ విధానం. మీరు పాస్‌వర్డ్‌కు మారవచ్చు; పాస్‌వర్డ్ విధానంలో కొత్త ఇమెయిల్ అదనపు తనిఖీ లేకుండా వెంటనే ఖాతాను సృష్టిస్తుంది.",
  ne: "इमेल कोड पूर्वनिर्धारित तरिका हो। तपाईं पासवर्डमा जान सक्नुहुन्छ; पासवर्ड मोडमा नयाँ इमेलले थप जाँचबिना तुरुन्त खाता बनाउँछ।",
  si: "විද්‍යුත් තැපැල් කේතය පෙරනිමි ක්‍රමයයි. මුරපදයට මාරු විය හැක; මුරපද ක්‍රමයේ නව විද්‍යුත් තැපෑලක් අමතර තහවුරු කිරීමකින් තොරව වහාම ගිණුම සාදයි.",
  tr: "E-posta kodu varsayılan yöntemdir. Parolaya geçebilirsiniz; parola modunda yeni bir e-posta ek doğrulama olmadan hesabı hemen oluşturur.",
};

function normalizeLocale(value: string | undefined) {
  const normalized = value?.trim().toLowerCase().split("-")[0] || "en";
  return policyCopy[normalized] ? normalized : "en";
}

export function AuthPolicyIntro({ locale: localeProp, className }: { locale?: string; className?: string }) {
  const [locale, setLocale] = useState(() => normalizeLocale(localeProp));

  useEffect(() => {
    if (localeProp) {
      setLocale(normalizeLocale(localeProp));
      return;
    }
    const root = document.documentElement;
    const sync = () => setLocale(normalizeLocale(root.lang));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, [localeProp]);

  return <p className={className}>{policyCopy[locale]}</p>;
}

export const authPolicyLocales = Object.freeze(Object.keys(policyCopy));
