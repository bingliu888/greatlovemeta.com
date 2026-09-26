import { getClassRuntimeBindings as getBindings } from "@/lib/class-runtime";
import {groupCallPermissionsMatch,groupCallPresetName,securedGroupCallPermissions,type ClassParticipantRole,type ProviderPermissions} from "./class-realtimekit-preset-policy";
export type {ClassParticipantRole} from "./class-realtimekit-preset-policy";
export type ClassRealtimeMode="group_call"|"webinar"|"livestream";
type Envelope<T>={success?:boolean;result?:T;data?:T;errors?:Array<{message?:string}>};
type ProviderPreset={id?:string;name?:string;config?:Record<string,unknown>&{max_screenshare_count?:number};permissions?:ProviderPermissions;ui?:Record<string,unknown>};
type ProviderMeeting={id:string;title:string};
export class RealtimeProviderRequestError extends Error {constructor(message:string,public status:number|null){super(message);}}
const screenShareReadyPresets=new Set<string>();
const groupCallReadyPresets=new Map<string,Promise<string>>();

async function config(){
  const env=getBindings() as ReturnType<typeof getBindings>&Record<string,string|undefined>;
  const value={token:env.CLOUDFLARE_REALTIME_API_TOKEN||"",accountId:env.CLOUDFLARE_ACCOUNT_ID||"",appId:env.REALTIMEKIT_APP_ID||"",guest:env.REALTIMEKIT_GUEST_PRESET||"",member:env.REALTIMEKIT_MEMBER_PRESET||"",host:env.REALTIMEKIT_HOST_PRESET||"",viewer:env.REALTIMEKIT_VIEWER_PRESET||env.REALTIMEKIT_GUEST_PRESET||"",webinarHost:env.REALTIMEKIT_WEBINAR_HOST_PRESET||"webinar_presenter",webinarSpeaker:env.REALTIMEKIT_WEBINAR_SPEAKER_PRESET||"webinar_presenter",webinarViewer:env.REALTIMEKIT_WEBINAR_VIEWER_PRESET||"webinar_viewer",livestreamHost:env.REALTIMEKIT_LIVESTREAM_HOST_PRESET||"livestream_host",livestreamSpeaker:env.REALTIMEKIT_LIVESTREAM_SPEAKER_PRESET||"livestream_host",livestreamViewer:env.REALTIMEKIT_LIVESTREAM_VIEWER_PRESET||"livestream_viewer"};
  if(!value.token||!value.accountId||!value.appId||value.appId.includes("REQUIRED")||!value.member||!value.host||!value.viewer)throw new Error("REALTIME_NOT_CONFIGURED");
  return value;
}
async function call<T>(path:string,init:RequestInit){const value=await config();let response:Response;try{response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(value.accountId)}/realtime/kit/${encodeURIComponent(value.appId)}${path}`,{...init,headers:{authorization:`Bearer ${value.token}`,"content-type":"application/json",...(init.headers||{})}})}catch(error){throw new RealtimeProviderRequestError(error instanceof Error?error.message:"REALTIME_NETWORK",null)}const payload=await response.json().catch(()=>null)as Envelope<T>|null;const data=payload?.data??payload?.result;if(!response.ok||!payload?.success||!data)throw new RealtimeProviderRequestError(payload?.errors?.[0]?.message||`REALTIME_${response.status}`,response.status);return data;}
async function presetByName(name:string){const presets=await call<ProviderPreset[]>(`/presets?search=${encodeURIComponent(name)}&per_page=100`,{method:"GET"});return presets.find(item=>item.name===name)||null;}
async function ensureGroupCallPreset(meetingMode:"audio"|"video",role:ClassParticipantRole){
  const name=groupCallPresetName(meetingMode,role),existing=groupCallReadyPresets.get(name);if(existing)return existing;
  const task=(async()=>{const value=await config();let preset=await presetByName(name);if(!preset?.id){const sourceSummary=await presetByName(value.host);if(!sourceSummary?.id)throw new Error(`REALTIME_PRESET_NOT_FOUND:${value.host}`);const source=await call<ProviderPreset>(`/presets/${encodeURIComponent(sourceSummary.id)}`,{method:"GET"});if(!source.config||!source.permissions||!source.ui)throw new Error(`REALTIME_PRESET_SOURCE_INCOMPLETE:${value.host}`);try{preset=await call<ProviderPreset>("/presets",{method:"POST",body:JSON.stringify({name,config:{...source.config,...(role!=="viewer"?{max_screenshare_count:1}: {})},permissions:securedGroupCallPermissions(source.permissions,role,meetingMode),ui:source.ui})});}catch(error){preset=await presetByName(name);if(!preset?.id)throw error;}}
    if(!preset?.id)throw new Error(`REALTIME_PRESET_NOT_FOUND:${name}`);const details=await call<ProviderPreset>(`/presets/${encodeURIComponent(preset.id)}`,{method:"GET"}),permissions=securedGroupCallPermissions(details.permissions,role,meetingMode),publish=role!=="viewer";await call<ProviderPreset>(`/presets/${encodeURIComponent(preset.id)}`,{method:"PATCH",body:JSON.stringify({...(publish&&Number(details.config?.max_screenshare_count||0)!==1?{config:{...(details.config||{}),max_screenshare_count:1}}:{}),permissions})});const verified=await call<ProviderPreset>(`/presets/${encodeURIComponent(preset.id)}`,{method:"GET"});if(!groupCallPermissionsMatch(verified.permissions,role,meetingMode)||(publish&&Number(verified.config?.max_screenshare_count||0)!==1))throw new Error(`REALTIME_PRESET_POLICY_UNVERIFIED:${name}`);return name;})();
  groupCallReadyPresets.set(name,task);try{return await task}catch(error){groupCallReadyPresets.delete(name);throw error;}
}
async function ensureHostScreenSharePreset(name:string){if(screenShareReadyPresets.has(name))return;const presets=await call<ProviderPreset[]>("/presets?per_page=100",{method:"GET"}),preset=presets.find(item=>item.name===name);if(!preset?.id)throw new Error(`REALTIME_PRESET_NOT_FOUND:${name}`);const permissionReady=preset.permissions?.media?.screenshare?.can_produce==="ALLOWED",countReady=Number(preset.config?.max_screenshare_count||0)>=1;if(!permissionReady||!countReady)await call<ProviderPreset>(`/presets/${encodeURIComponent(preset.id)}`,{method:"PATCH",body:JSON.stringify({...(!countReady?{config:{max_screenshare_count:1}}:{}),...(!permissionReady?{permissions:{media:{screenshare:{can_produce:"ALLOWED"}}}}:{})})});screenShareReadyPresets.add(name);}
export function classProviderCreateTitle(title:string,correlationId:string){const prefix=`[GLM2:${correlationId.toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,48)}]`;return `${prefix} ${String(title||"").replace(/\s+/g," ").trim().slice(0,119-prefix.length)}`.trim().slice(0,120);}
export function classProviderCreateFailureIsDefinite(error:unknown){return error instanceof RealtimeProviderRequestError&&error.status!==null&&error.status>=400&&error.status<500&&error.status!==408&&error.status!==409;}
export async function findClassProviderRoomsByExactTitle(title:string){const result=await call<ProviderMeeting[]|{meetings?:ProviderMeeting[];results?:ProviderMeeting[]}>(`/meetings?search=${encodeURIComponent(title)}&page_no=1&per_page=100`,{method:"GET"});const rows=Array.isArray(result)?result:result.meetings||result.results||[];return rows.filter(row=>row.title===title);}
export async function createClassProviderRoom(title:string,correlationId?:string){return call<{id:string}>("/meetings",{method:"POST",body:JSON.stringify({title:correlationId?classProviderCreateTitle(title,correlationId):title.slice(0,120),record_on_start:false,transcribe_on_end:false,summarize_on_end:false})});}
async function teardownAction(path:string,method:"POST"|"PATCH",body:string,accepted:number[]){
  const value=await config();
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(value.accountId)}/realtime/kit/${encodeURIComponent(value.appId)}${path}`,{
    method,headers:{authorization:`Bearer ${value.token}`,"content-type":"application/json"},body,
  });
  if(response.ok||accepted.includes(response.status))return;
  throw new Error(`REALTIME_TEARDOWN_${response.status}`);
}
export async function teardownClassProviderRoom(meetingId:string){
  const id=encodeURIComponent(meetingId);
  await teardownAction(`/meetings/${id}/active-livestream/stop`,"POST","{}",[400,404,409]);
  await teardownAction(`/meetings/${id}/active-session/kick-all`,"POST","{}",[400,404,409]);
  await teardownAction(`/meetings/${id}`,"PATCH",JSON.stringify({status:"INACTIVE"}),[404]);
}
export async function createClassParticipant(meetingId:string,identity:string,name:string,role:ClassParticipantRole,mode:ClassRealtimeMode,meetingMode:"audio"|"video"="video"){const value=await config();const preset=mode==="group_call"?await ensureGroupCallPreset(meetingMode,role):mode==="webinar"?(role==="viewer"?value.webinarViewer:role==="host"?value.webinarHost:value.webinarSpeaker):(role==="viewer"?value.livestreamViewer:role==="host"?value.livestreamHost:value.livestreamSpeaker);if(role==="host"&&mode!=="group_call")await ensureHostScreenSharePreset(preset);return call<{id:string;token:string}>(`/meetings/${encodeURIComponent(meetingId)}/participants`,{method:"POST",body:JSON.stringify({name:name.slice(0,80)||"Guest",preset_name:preset,custom_participant_id:`${identity}:${crypto.randomUUID()}`})});}
