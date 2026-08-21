"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

type Session = { loaded:boolean; signedIn:boolean; isPermanentAdmin?:boolean };

export function MobileHeaderAccount({ lang, onNavigate }: { lang:"en"|"zh"; onNavigate?:()=>void }) {
  const clerk=useClerk(); const zh=lang==="zh";
  const [session,setSession]=useState<Session>({loaded:false,signedIn:false});
  useEffect(()=>{fetch("/api/auth/session",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(v=>setSession({loaded:true,signedIn:Boolean(v?.signedIn),isPermanentAdmin:Boolean(v?.isPermanentAdmin)})).catch(()=>setSession({loaded:true,signedIn:false}));},[]);
  if(!session.loaded)return <span className="mobile-account-loading" aria-hidden="true"/>;
  if(!session.signedIn)return <nav className="mobile-account-nav"><Link href={`/${lang}/auth/login`} onClick={onNavigate}>{zh?"登录或注册":"Sign in or register"}<small>→</small></Link></nav>;
  const links:[[string,string],...[string,string][]]=[
    [zh?"用户面板":"Dashboard",`/${lang}/dashboard`],
    [zh?"我的课程":"My classes",`/${lang}/classes?view=mine`],
    [zh?"个人资料":"Profile",`/${lang}/account`],
    [zh?"消息":"Messages",`/${lang}/messages`],
    [zh?"会员社区":"Community",`/${lang}/community`],
    [zh?"会员方案":"Membership",`/${lang}/pricing`],
    [zh?"项目":"Project",`/${lang}/project`],
  ];
  return <nav className="mobile-account-nav" aria-label={zh?"账户菜单":"Account menu"}>{session.isPermanentAdmin?<Link href={`/${lang}/admin`} onClick={onNavigate}>{zh?"管理员面板":"Admin dashboard"}<small>→</small></Link>:null}{links.map(([label,href])=><Link key={href} href={href} onClick={onNavigate}>{label}<small>→</small></Link>)}<button type="button" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});await clerk.signOut();window.location.assign(`/${lang}`);}}>{zh?"退出登录":"Sign out"}<small>↗</small></button></nav>;
}

