"use client";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
type Locale = "en" | "zh" | "ja";

type ChatMessage = { id: string; senderName: string; recipientName: string | null; body: string; createdAt: number; canDelete: boolean; canReply: boolean; privateReply: boolean };

export type ClassPrivateChatHandle = { mention: (name: string) => void };

export const ClassPrivateChat = forwardRef<ClassPrivateChatHandle, { code: string; tabId: string; locale: Locale; supportAgent: boolean; reportError: (message: string) => void }>(function ClassPrivateChat({ code, tabId, locale, supportAgent: initialSupportAgent, reportError }, ref) {
  const zh = locale === "zh";
  const ja = locale === "ja";
  const [messages, setMessages] = useState<ChatMessage[]>([]); const [draft, setDraft] = useState(""); const [deletingId,setDeletingId]=useState<string|null>(null);
  const [replyTarget,setReplyTarget]=useState<{id:string;name:string}|null>(null);
  const [supportAgent,setSupportAgent]=useState(initialSupportAgent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef=useRef<HTMLDivElement>(null);
  const keepBottomRef=useRef(true);
  const draftKey=`class-room-chat-draft:${code}:${tabId}`;
  useEffect(()=>{setDraft(sessionStorage.getItem(draftKey)||"");},[draftKey]);
  useLayoutEffect(()=>{
    const list=listRef.current;
    if(list&&keepBottomRef.current)list.scrollTop=list.scrollHeight;
  },[messages]);
  const mention = useCallback((name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    setDraft((current) => `${current}${current && !/\s$/.test(current) ? " " : ""}@${cleanName} `.slice(0, 2000));
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
  }, []);
  useImperativeHandle(ref, () => ({ mention }), [mention]);
  const etagRef=useRef("");const loadingRef=useRef(false);const mountedRef=useRef(true);
  const loadMessages = useCallback(async () => {if(loadingRef.current||!navigator.onLine)return;loadingRef.current=true;try{const headers:Record<string,string>={"cache-control":"no-cache","x-room-tab-id":tabId};if(etagRef.current)headers["if-none-match"]=etagRef.current;const response = await fetch(`/api/classes/${code}/chat`, { cache: "no-store", credentials: "same-origin", headers });if(response.status===304)return;if (response.ok) { const data = await response.json() as { messages: ChatMessage[]; supportAgent: boolean };if(!mountedRef.current)return;etagRef.current=response.headers.get("etag")||"";setMessages(data.messages);setSupportAgent(data.supportAgent);if(!data.supportAgent)setReplyTarget(null); } else if (response.status === 403) {const data=await response.json().catch(()=>({})) as {error?:string};if(data.error==="Private meeting access required")reportError(zh ? "您没有该专属会议的访问权限。" : "You do not have access to this private meeting.");else if(data.error==="Meeting password required")reportError(zh ? "请重新输入会议密码。" : "Re-enter the meeting password.");}}finally{loadingRef.current=false;}}, [code,reportError,tabId,zh]);
  useEffect(() => {mountedRef.current=true;let timer=0;let stopped=false;const poll=async()=>{try{await loadMessages();}catch{/* Retry after a transient network failure. */}finally{if(!stopped)timer=window.setTimeout(poll,document.hidden?60_000:15_000+Math.floor(Math.random()*2_000));}};void poll();const visible=()=>{if(!document.hidden)void loadMessages().catch(()=>undefined);};document.addEventListener("visibilitychange",visible);return()=>{stopped=true;mountedRef.current=false;window.clearTimeout(timer);document.removeEventListener("visibilitychange",visible);};}, [loadMessages]);
  async function sendMessage(event: React.FormEvent) { event.preventDefault(); const body = draft.trim(); if (!body || supportAgent&&!replyTarget) return; try { const response = await fetch(`/api/classes/${code}/chat`, { method: "POST", headers: { "content-type": "application/json", "x-room-tab-id":tabId }, body: JSON.stringify({ body, ...(supportAgent?{replyToMessageId:replyTarget?.id}:{}) }) }); if (response.ok) { keepBottomRef.current=true;setDraft("");sessionStorage.removeItem(draftKey);setReplyTarget(null); await loadMessages(); } else reportError(response.status === 401 ? (zh ? "请先登录再发送聊天消息。" : "Sign in before sending chat messages.") : (zh ? "暂时无法发送消息。" : "Could not send this message.")); } catch { reportError(zh ? "网络连接中断，请重试发送。" : "The network connection was interrupted. Try sending again."); } }
  async function deleteMessage(message:ChatMessage){
    if(!message.canDelete||deletingId)return;
    if(!window.confirm(zh?"确定永久删除这条消息吗？":"Permanently delete this message?"))return;
    setDeletingId(message.id);
    try{
      const response=await fetch(`/api/classes/${code}/chat`,{method:"DELETE",headers:{"content-type":"application/json","x-room-tab-id":tabId},body:JSON.stringify({messageId:message.id})});
      if(response.ok){setMessages(current=>current.filter(item=>item.id!==message.id));etagRef.current="";await loadMessages();}
      else reportError(zh?"消息未找到或您无权删除。":"Message not found or you cannot delete it.");
    }catch{reportError(zh?"网络连接中断，消息未删除，请重试。":"The network connection was interrupted. The message was not deleted; try again.");}
    finally{setDeletingId(null);}
  }
  return <><div ref={listRef} className="chat-list" onScroll={event=>{const list=event.currentTarget;keepBottomRef.current=list.scrollHeight-list.scrollTop-list.clientHeight<80;}}>{messages.length ? messages.map(message => <article key={message.id}><div><strong>{message.senderName}{message.privateReply ? <small className="chat-private-reply">{supportAgent&&message.recipientName?` → ${message.recipientName}`:zh?" · 私密回复":ja?" · 非公開の返信":" · Private reply"}</small>:null}</strong><span className="chat-message-actions"><time>{new Date(message.createdAt * 1000).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</time>{message.canReply?<button type="button" className="chat-reply-button" aria-label={`${zh?"私密回复":ja?"非公開で返信":"Reply privately to"} ${message.senderName}`} title={`${zh?"私密回复":ja?"非公開で返信":"Reply privately to"} ${message.senderName}`} onClick={()=>{setReplyTarget({id:message.id,name:message.senderName});textareaRef.current?.focus();}}>{zh?"回复":ja?"返信":"Reply"}</button>:null}{message.canDelete?<button type="button" className="chat-delete-button" disabled={deletingId===message.id} aria-label={zh?"删除消息":"Delete message"} title={zh?"删除消息":"Delete message"} onClick={()=>void deleteMessage(message)}><span aria-hidden="true">🗑</span></button>:null}</span></div><p>{message.body}</p></article>) : <div className="chat-empty"><span>✦</span><p>{supportAgent?(zh?"等待会员的私密消息。":ja?"メンバーからの非公開メッセージを待っています。":"Waiting for private member messages."):(zh?"您发送的消息和主持团队的私密回复会显示在这里。":ja?"送信したメッセージと主催チームからの非公開返信がここに表示されます。":"Your messages and private replies from the host team appear here.")}</p></div>}</div><form className="chat-composer" onSubmit={sendMessage}>{supportAgent?<div className="chat-reply-target">{replyTarget?<><span>{zh?"私密回复":ja?"非公開で返信":"Private reply to"} {replyTarget.name}</span><button type="button" onClick={()=>setReplyTarget(null)} aria-label={zh?"取消回复":ja?"返信をキャンセル":"Cancel reply"}>×</button></>:<span>{zh?"请先选择会员消息并点击“回复”。":ja?"メンバーのメッセージで「返信」を選んでください。":"Select Reply on a member message first."}</span>}</div>:null}<label><span className="sr-only">{zh ? "聊天消息" : ja ? "チャットメッセージ" : "Chat message"}</span><textarea ref={textareaRef} value={draft} onChange={event => {setDraft(event.target.value);sessionStorage.setItem(draftKey,event.target.value);}} rows={3} maxLength={2000} placeholder={zh ? "写一条私密消息…" : ja ? "非公開メッセージを書く…" : "Write a private message…"}/></label><div><button className="send-button" disabled={!draft.trim()||supportAgent&&!replyTarget} aria-label={zh ? "发送消息" : ja ? "メッセージを送信" : "Send message"}>↑</button></div></form></>;
});
