"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Room = { id:string; code:string; title:string; description:string; subject:string; classType:"public"|"trial"|"private"; streamingMode:"audio"|"video"; startsAt:number; hostName:string; streamActive:number; tuitionCents:number };

export function ClassDirectory({ lang, initialView = "public" }: { lang: import("../lib/site-locale").SiteLanguage; initialView?:string }) {
  const zh=lang==="zh";
  const [view,setView]=useState(initialView);
  const [rooms,setRooms]=useState<Room[]>([]);
  const [joinedRooms,setJoinedRooms]=useState<Room[]>([]);
  const [joinedView,setJoinedView]=useState<"public"|"trial"|"private">("public");
  const [canCreate,setCanCreate]=useState(false);
  const [quota,setQuota]=useState<{used:number;max:number|null}>({used:0,max:5});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const timer=window.setTimeout(()=>{setLoading(true);const managed=fetch(`/api/classes?view=${encodeURIComponent(view)}`,{cache:"no-store"}).then(r=>r.json());const joined=view==="mine"?fetch(`/api/classes?view=joined_${joinedView}`,{cache:"no-store"}).then(r=>r.json()):Promise.resolve({classes:[]});Promise.all([managed,joined]).then(([v,j])=>{if(view==="mine"&&!v.signedIn){window.location.assign(`/${lang}/auth/login?returnTo=${encodeURIComponent(`/${lang}/classes?view=mine`)}`);return;}setRooms(v.classes||[]);setJoinedRooms(j.classes||[]);setCanCreate(Boolean(v.canCreate));setQuota({used:Number(v.used||0),max:v.max===null?null:Number(v.max||5)});}).finally(()=>setLoading(false));},0);return()=>window.clearTimeout(timer)},[view,joinedView,lang]);
  const cards=(items:Room[])=>items.length?<section className="class-card-list">{items.map(room=><article className="class-card" key={room.id}><div><p>{room.subject||(zh?"社区课程":"COMMUNITY COURSE")}</p><h2>{room.title}</h2><span>{room.description||(zh?"教师尚未添加课程介绍。":"The Teacher has not added a description.")}</span><small>{new Date(room.startsAt*1000).toLocaleString(zh?"zh-CN":"en-US",{timeZone:"America/Los_Angeles"})} · {room.hostName} · {room.streamingMode==="audio"?(zh?"音频":"Audio"):(zh?"音视频":"A/V")}</small></div><div><i className={room.streamActive?"live":""}>{room.streamActive?"LIVE":"READY"}</i>{room.classType==="trial"&&<b>$${(room.tuitionCents/100).toFixed(2)}</b>}<Link href={`/${lang}/classes/${room.code}`}>{zh?"进入":"Enter"} →</Link></div></article>)}</section>:<div className="class-empty compact"><h2>{zh?"这里暂时还没有课程":"No courses here yet"}</h2><p>{zh?"请选择其他课程类型或稍后再来。":"Check another course type or return later."}</p></div>;
  return <main className="class-directory-page">
    <section className="class-directory-hero"><p>{view==="mine"?(zh?"我的课程":"MY COURSES"):(zh?"社区课程":"COMMUNITY COURSES")}</p><h1>{view==="mine"?(zh?"创建、管理与加入的课程":"Courses you create, manage, and join"):(zh?"与社区一起学习":"Learn with the community")}</h1><span>{view==="mine"?(quota.max===null?(zh?"平台管理员可无限创建课程。":"Platform administrators can create unlimited classes."):(zh?`教师课程额度：${quota.used} / ${quota.max}`:`Teacher course quota: ${quota.used} / ${quota.max}`)):(zh?"进入公开课程、通过推荐加入课程，或通过邀请参加专属课堂。":"Enter an open course, join a referred course, or enter a private course by invitation.")}</span>{canCreate&&<Link className="class-create-link" href={`/${lang}/classes/create`}>{zh?"创建课程":"Create course"}</Link>}</section>
    <nav className="class-tabs" aria-label={zh?"课程目录":"Course directory"}><button className={view==="public"?"active":""} onClick={()=>setView("public")}>{zh?"公开课程":"Open course"}</button><button className={view==="trial"?"active":""} onClick={()=>setView("trial")}>{zh?"推荐课程":"Referred course"}</button><button className={view==="private"?"active":""} onClick={()=>setView("private")}>{zh?"专属课堂":"Private course"}</button><button className={view==="mine"?"active":""} onClick={()=>setView("mine")}>{zh?"我的课程":"My courses"}</button></nav>
    {loading?<div className="class-empty">{zh?"正在读取课程…":"Loading courses…"}</div>:view==="mine"?<><section className="my-class-section"><h2>{zh?"我创建或管理的课程":"Courses I create or manage"}</h2><p>{zh?"教师与联合教师可以在这里管理课程。":"Teachers and Co-teachers can manage courses here."}</p>{cards(rooms)}</section><section className="my-class-section"><h2>{zh?"我加入的课程":"Courses I joined"}</h2><nav className="class-tabs joined-tabs"><button className={joinedView==="public"?"active":""} onClick={()=>setJoinedView("public")}>{zh?"公开课程":"Open course"}</button><button className={joinedView==="trial"?"active":""} onClick={()=>setJoinedView("trial")}>{zh?"推荐课程":"Referred course"}</button><button className={joinedView==="private"?"active":""} onClick={()=>setJoinedView("private")}>{zh?"专属课堂":"Private course"}</button></nav>{cards(joinedRooms)}</section></>:cards(rooms)}
  </main>;
}
