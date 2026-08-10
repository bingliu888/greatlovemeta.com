"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Room = { id:string; code:string; title:string; description:string; subject:string; classType:"public"|"trial"|"private"; streamingMode:"audio"|"video"; startsAt:number; hostName:string; streamActive:number; tuitionCents:number };

export function ClassDirectory({ lang, initialView = "public" }: { lang:"en"|"zh"; initialView?:string }) {
  const zh=lang==="zh";
  const [view,setView]=useState(initialView);
  const [rooms,setRooms]=useState<Room[]>([]);
  const [canCreate,setCanCreate]=useState(false);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{setLoading(true);fetch(`/api/classes?view=${encodeURIComponent(view)}`,{cache:"no-store"}).then(r=>r.json()).then(v=>{setRooms(v.classes||[]);setCanCreate(Boolean(v.canCreate));}).finally(()=>setLoading(false));},[view]);
  return <main className="class-directory-page">
    <section className="class-directory-hero"><p>{zh?"社区课堂":"COMMUNITY CLASSES"}</p><h1>{zh?"与社区一起学习。":"Learn with the community."}</h1><span>{zh?"进入公课、先试课再加入，或通过邀请参加私课。":"Enter a public class, try a course, or join a private class by invitation."}</span>{canCreate&&<Link className="class-create-link" href={`/${lang}/classes/create`}>{zh?"创建课程":"Create class"}</Link>}</section>
    <nav className="class-tabs" aria-label={zh?"课堂目录":"Class directory"}><button className={view==="public"?"active":""} onClick={()=>setView("public")}>{zh?"公课":"Public"}</button><button className={view==="trial"?"active":""} onClick={()=>setView("trial")}>{zh?"试课":"Trial"}</button><button className={view==="private"?"active":""} onClick={()=>setView("private")}>{zh?"私课":"Private"}</button>{canCreate&&<button className={view==="mine"?"active":""} onClick={()=>setView("mine")}>{zh?"我的课程":"My classes"}</button>}</nav>
    {loading?<div className="class-empty">{zh?"正在读取课程…":"Loading classes…"}</div>:rooms.length?<section className="class-card-list">{rooms.map(room=><article className="class-card" key={room.id}><div><p>{room.subject||(zh?"社区课堂":"COMMUNITY CLASS")}</p><h2>{room.title}</h2><span>{room.description||(zh?"老师尚未添加课程介绍。":"The teacher has not added a description.")}</span><small>{new Date(room.startsAt*1000).toLocaleString(zh?"zh-CN":"en-US")} · {room.hostName} · {room.streamingMode==="audio"?(zh?"音频":"Audio"):(zh?"音视频":"A/V")}</small></div><div><i className={room.streamActive?"live":""}>{room.streamActive?"LIVE":"READY"}</i>{room.classType==="trial"&&<b>$${(room.tuitionCents/100).toFixed(2)}</b>}<Link href={`/${lang}/classes/${room.code}`}>{zh?"进入":"Enter"} →</Link></div></article>)}</section>:<div className="class-empty"><h2>{zh?"这里暂时还没有课程":"No classes here yet"}</h2><p>{zh?"请选择其他课堂类型或稍后再来。":"Check another class type or return later."}</p>{canCreate&&<Link href={`/${lang}/classes/create`}>{zh?"创建课程":"Create class"}</Link>}</div>}
  </main>;
}
