"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteLanguage } from "../lib/site-locale";

const labels: Record<SiteLanguage, readonly [string, string]> = {
  zh:["管理员面板","加密货币付款"], en:["Admin dashboard","Crypto payments"],
  es:["Panel de administración","Pagos con criptomonedas"], ja:["管理者ダッシュボード","暗号資産決済"],
  ko:["관리자 대시보드","암호화폐 결제"], fr:["Tableau de bord administrateur","Paiements en cryptomonnaie"],
  de:["Admin-Dashboard","Kryptozahlungen"], ru:["Панель администратора","Криптоплатежи"],
  it:["Pannello amministratore","Pagamenti in criptovaluta"], pt:["Painel do administrador","Pagamentos em criptomoeda"],
  ar:["لوحة تحكم المسؤول","مدفوعات العملات المشفرة"], hi:["एडमिन डैशबोर्ड","क्रिप्टो भुगतान"]
};
export function AdminMenuLink({lang,onNavigate}:{lang:SiteLanguage;onNavigate?:()=>void}){const[visible,setVisible]=useState(false);useEffect(()=>{fetch("/api/account-context",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>setVisible(Boolean(v?.isPermanentAdmin))).catch(()=>setVisible(false))},[]);if(!visible)return null;return <><Link onClick={onNavigate} href={`/${lang}/admin`}><b>{labels[lang][0]}</b><small>→</small></Link><Link onClick={onNavigate} href={`/${lang}/admin/crypto-payments`}><b>{labels[lang][1]}</b><small>→</small></Link></>}
