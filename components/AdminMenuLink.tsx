"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { interfaceText, type SiteLanguage } from "../lib/site-locale";
export function AdminMenuLink({lang,onNavigate}:{lang:SiteLanguage;onNavigate?:()=>void}){const[visible,setVisible]=useState(false);useEffect(()=>{fetch("/api/account-context",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>setVisible(Boolean(v?.isPermanentAdmin))).catch(()=>setVisible(false))},[]);return visible?<Link onClick={onNavigate} href={`/${lang}/admin`}><b>{interfaceText(lang,"Admin dashboard","管理员面板")}</b><small>→</small></Link>:null}
