"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Member = { id: string; displayName: string; createdAt: number; imageUrl?: string };

export function MembersDirectory({ lang }: { lang: "en" | "zh" }) {
  const zh = lang === "zh";
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/community", { cache: "no-store" }).then(response => response.ok ? response.json() : Promise.reject()).then((data: { members?: Member[] }) => setMembers(data.members || [])).catch(() => setError(zh ? "暂时无法读取会员目录。" : "The member directory is temporarily unavailable."));
  }, [zh]);
  const visible = useMemo(() => members.filter(member => member.displayName.toLowerCase().includes(query.toLowerCase())), [members, query]);
  return <section className="members-main"><header className="members-hero"><p className="section-kicker">{zh ? "大爱社区会员" : "GLOBAL MEMBERS"}</p><h1>{zh ? "找到共同建设生态的伙伴。" : "Meet builders across the GreatLove ecosystem."}</h1><p>{zh ? "发现先锋会员与社区贡献者，并从社区、消息与实时聊天开始连接。" : "Discover pioneers and contributors, then connect through Community, messages, and Live Chat."}</p><Link className="primary-button" href={`/${lang}/community`}>{zh ? "进入社区" : "Open Community"} <span>→</span></Link></header><div className="members-toolbar"><label>{zh ? "搜索会员" : "Search members"}<input value={query} onChange={event => setQuery(event.target.value)} placeholder={zh ? "输入昵称" : "Enter a display name"}/></label><span>{visible.length} {zh ? "位会员" : "members"}</span></div>{error ? <p className="members-error">{error}</p> : <div className="members-grid">{visible.map(member => <article key={member.id}><div className="member-avatar">{member.imageUrl ? <img src={member.imageUrl} alt=""/> : member.displayName.slice(0, 1).toUpperCase()}</div><div><h2>{member.displayName}</h2><p>{zh ? "大爱社区会员" : "GreatLove community member"}</p></div></article>)}{members.length === 0 && !error ? <p>{zh ? "正在读取会员…" : "Loading members…"}</p> : null}</div>}</section>;
}
