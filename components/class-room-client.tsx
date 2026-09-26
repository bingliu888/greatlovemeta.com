/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  RealtimeKitProvider,
  useRealtimeKitClient,
  useRealtimeKitSelector,
} from "@cloudflare/realtimekit-react";
import type RTKClient from "@cloudflare/realtimekit";
import Hls from "hls.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClassPrivateChat, type ClassPrivateChatHandle } from "@/components/ClassPrivateChat";
import { ClassRoomResources } from "@/components/ClassRoomResources";
import { RoomPresenceTicker, type RoomPresenceEvent } from "@/components/RoomPresenceTicker";
import { roomPresenceChanges, shouldJoinGroupAudioLobby } from "@/lib/group-audio-lobby";
import { speakerControlAppearance, speakerPlaybackState } from "@/lib/meeting-speaker-state";
import { createRemoteMediaRecovery } from "@/lib/remote-media-recovery";
import { ClassPlaylistPlayer } from "@/components/ClassPlaylistPlayer";
import { ClassPlaylistManager } from "@/components/ClassPlaylistManager";
import {
  ClassAudioScreenShare,
  ClassScreenShareButton,
  ClassScreenShareStage,
  ClassVideoContentShare,
} from "@/components/class-screen-share";
import { MediaActivityGuard } from "@/components/MediaActivityGuard";
import { LoneParticipantGuard } from "@/components/LoneParticipantGuard";
import { loneClassParticipantConfirmed } from "@/lib/class-lone-participant-recheck";
import {
  formatConnectionDuration,
  mediaGridLayout,
  shouldAutoJoinClassRoom,
} from "@/lib/class-realtime-participant-state";
import {
  createLocalMediaHealthMonitor,
  publishedLocalTrackIsLive,
} from "@/lib/local-media-health";

type RealtimeMode = "group_call" | "webinar" | "livestream";
type Room = {
  code: string;
  title: string;
  streamingMode: "audio" | "video";
  realtimeMode: RealtimeMode;
  classType: "public" | "trial" | "private";
};
type MediaUser = {
  identity: string;
  displayName: string;
  isMember: number;
  micOn: number;
  cameraOn: number;
  isManager: boolean;
};
type OnlineMember = {userId:string;displayName:string;enteredAt:number};
type StageRequest = {
  identity: string;
  displayName: string;
  mediaKind: "audio" | "video";
  status: string;
};
type Media = {
  streamActive: boolean;
  providerMeetingId?: string | null;
  screenShareActive?: boolean;
  streamingMode: "audio" | "video";
  realtimeMode: RealtimeMode;
  manager: boolean;
  canPublish: boolean;
  hostOnline: boolean;
  participantLimit: number | null;
  publisherLimit: number | null;
  users: MediaUser[];
  requests: StageRequest[];
  speakers: Array<{ email: string }>;
};
type Role = "viewer" | "member" | "host";
type PlaylistState = { active: number; currentItemId: string | null };
type PlaylistResponse = {
  items: Array<{ id: string }>;
  state: PlaylistState | null;
};
type PlaylistWindow = Window;
const SHOW_ADVANCED_SHARE_BUTTONS = false;
type ResourcePanel = "recordings" | "files" | null;

function AudioFileIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h9l5 5v13H5zM14 3v5h5M10 15v3a2 2 0 1 1-2-2M10 15l5-1v3a2 2 0 1 1-2-2v-5l-5 1v5"/></svg>}
function PaperclipIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m8 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-9-9l8-8"/></svg>}

function ClassRoomMembers({members,lang,onClose}:{members:OnlineMember[];lang:"en"|"zh";onClose:()=>void}){
  return <aside className="class-members-drawer" role="dialog" aria-modal="true" aria-label={lang==="zh"?"会议用户":"Room members"}>
    <header><h2>{lang==="zh"?`会议用户 · 在线 ${members.length}`:`Room members · ${members.length} online`}</h2><button type="button" onClick={onClose} aria-label={lang==="zh"?"关闭用户列表":"Close members"}>×</button></header>
    <div>{members.map(member=><article key={member.userId}>{member.displayName}</article>)}</div>
  </aside>;
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="9"
        y="3"
        width="6"
        height="11"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="6"
        width="13"
        height="12"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 10 5-3v10l-5-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SpeakerIcon({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 10v4h4l5 4V6L8 10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {off ? (
        <path
          d="m17 10 4 4m0-4-4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16 9a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function AudioTrack({
  id,
  track,
  enabled,
  onBlocked,
  onPlaybackChange,
}: {
  id: string;
  track: MediaStreamTrack;
  enabled: boolean;
  onBlocked: () => void;
  onPlaybackChange: (id: string, playing: boolean) => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    const playing = () => onPlaybackChange(id, true),
      stopped = () => onPlaybackChange(id, false);
    audio.addEventListener("playing", playing);
    audio.addEventListener("pause", stopped);
    audio.addEventListener("ended", stopped);
    audio.addEventListener("emptied", stopped);
    audio.srcObject = new MediaStream([track]);
    if (enabled)
      void audio.play().catch(() => {
        stopped();
        onBlocked();
      });
    else {
      audio.pause();
      stopped();
    }
    return () => {
      audio.pause();
      audio.srcObject = null;
      stopped();
      audio.removeEventListener("playing", playing);
      audio.removeEventListener("pause", stopped);
      audio.removeEventListener("ended", stopped);
      audio.removeEventListener("emptied", stopped);
    };
  }, [enabled, id, onBlocked, onPlaybackChange, track]);
  return <audio ref={ref} autoPlay={enabled} />;
}
function ParticipantsAudio({
  client,
  enabled,
  manualReady,
  onBlocked,
  onPlaybackChange,
}: {
  client: RTKClient;
  enabled: boolean;
  manualReady: boolean;
  onBlocked: () => void;
  onPlaybackChange: (id: string, playing: boolean) => void;
}) {
  const [revision, setRevision] = useState(0);
  const subscribed=useRef(new Set<string>());
  useEffect(()=>{
    if(!manualReady)return;
    const recovery=createRemoteMediaRecovery({
      peers:()=>client.participants.joined.toArray()
        .filter(peer=>peer.id!==client.self.id)
        .map(peer=>({id:peer.id,enabled:peer.audioEnabled,
          track:(client.participants.audioSubscribed.get(peer.id)||peer).audioTrack})),
      subscribed:subscribed.current,
      subscribe:ids=>client.participants.subscribe(ids,["audio"]),
      unsubscribe:ids=>client.participants.unsubscribe(ids,["audio"]),
    });
    const reconcile=()=>{void recovery.reconcile();};
    const maps=[client.participants.joined,client.participants.audioSubscribed];
    maps.forEach(map=>{map.on("participantJoined",reconcile);map.on("audioUpdate",reconcile);});
    document.addEventListener("visibilitychange",reconcile);
    const timer=window.setInterval(reconcile,3_000);reconcile();
    return()=>{recovery.stop();window.clearInterval(timer);document.removeEventListener("visibilitychange",reconcile);
      maps.forEach(map=>{map.off("participantJoined",reconcile);map.off("audioUpdate",reconcile);});};
  },[client,manualReady]);
  useEffect(() => {
    const timer = window.setInterval(
      () => setRevision((value) => value + 1),
      750,
    );
    return () => window.clearInterval(timer);
  }, [client]);
  void revision;
  const peers = new Map<string, { id: string; track: MediaStreamTrack }>();
  [
    client.participants.joined,
    client.participants.active,
    client.participants.audioSubscribed,
  ].forEach((map) =>
    map.toArray().forEach((peer) => {
      if (
        peer.audioTrack &&
        (peer.audioEnabled || peer.audioTrack.readyState === "live")
      )
        peers.set(peer.id, {
          id: peer.id,
          track: peer.audioTrack as MediaStreamTrack,
        });
    }),
  );
  return (
    <>
      {[...peers.values()].map((peer) => (
        <AudioTrack
          key={peer.id}
          id={`participant:${peer.id}`}
          track={peer.track}
          enabled={enabled}
          onBlocked={onBlocked}
          onPlaybackChange={onPlaybackChange}
        />
      ))}
    </>
  );
}
function LivestreamPlayer({
  client,
  enabled,
  onBlocked,
  onPlaybackChange,
}: {
  client: RTKClient;
  enabled: boolean;
  onBlocked: () => void;
  onPlaybackChange: (id: string, playing: boolean) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null),
    [url, setUrl] = useState(""),
    [state, setState] = useState("");
  useEffect(() => {
    const live = client.livestream,
      update = (next: string) => {
        setState(next);
        setUrl(live.playbackUrl || "");
      };
    update(live.state);
    live.on("livestreamUpdate", update);
    const timer = window.setInterval(() => update(live.state), 2000);
    return () => {
      live.off("livestreamUpdate", update);
      window.clearInterval(timer);
    };
  }, [client]);
  useEffect(() => {
    const video = ref.current;
    if (!video || !url || state !== "LIVESTREAMING") return;
    const playing = () => onPlaybackChange("livestream", true),
      stopped = () => onPlaybackChange("livestream", false);
    video.addEventListener("playing", playing);
    video.addEventListener("pause", stopped);
    video.addEventListener("ended", stopped);
    video.addEventListener("emptied", stopped);
    const source = `${url}?dvrEnabled=true`;
    video.muted = !enabled;
    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: false });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(
        Hls.Events.MANIFEST_PARSED,
        () =>
          void video.play().catch(() => {
            stopped();
            onBlocked();
          }),
      );
    } else {
      video.src = source;
      void video.play().catch(() => {
        stopped();
        onBlocked();
      });
    }
    return () => {
      video.pause();
      stopped();
      video.removeEventListener("playing", playing);
      video.removeEventListener("pause", stopped);
      video.removeEventListener("ended", stopped);
      video.removeEventListener("emptied", stopped);
      if (hls) hls.destroy();
      else video.removeAttribute("src");
    };
  }, [enabled, onBlocked, onPlaybackChange, state, url]);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.muted = !enabled;
    if (enabled)
      void video.play().catch(() => {
        onPlaybackChange("livestream", false);
        onBlocked();
      });
    else onPlaybackChange("livestream", false);
  }, [enabled, onBlocked, onPlaybackChange]);
  return (
    <div className="class-livestream-player" data-state={state}>
      <video ref={ref} autoPlay playsInline muted={!enabled} />
      {state !== "LIVESTREAMING" && (
        <strong>
          {state === "STARTING"
            ? "Starting livestream…"
            : "Waiting for livestream…"}
        </strong>
      )}
    </div>
  );
}
type RemoteVideoParticipant = {
  name?: string;
  videoTrack?: MediaStreamTrack;
  videoEnabled?: boolean;
  on?: (
    event: "videoUpdate",
    listener: (payload: {
      videoEnabled: boolean;
      videoTrack?: MediaStreamTrack;
    }) => void,
  ) => void;
  off?: (
    event: "videoUpdate",
    listener: (payload: {
      videoEnabled: boolean;
      videoTrack?: MediaStreamTrack;
    }) => void,
  ) => void;
  registerVideoElement?: (element: HTMLVideoElement) => void;
  deregisterVideoElement?: (element?: HTMLVideoElement) => void;
};
function RemoteVideo({
  client,
  peerId,
  name,
  onOpen,
  selected,
}: {
  client: RTKClient;
  peerId: string;
  name: string;
  onOpen: () => void;
  selected: boolean;
}) {
  const readPeer = useCallback(
    () =>
      (client.participants.videoSubscribed.get(peerId) ||
        client.participants.active.get(peerId) ||
        client.participants.joined.get(peerId) ||
        client.participants.all.get(peerId)) as
        | RemoteVideoParticipant
        | undefined,
    [client, peerId],
  );
  const [peer, setPeer] = useState<RemoteVideoParticipant | undefined>(() =>
      readPeer(),
    ),
    [remote, setRemote] = useState<{
      enabled: boolean;
      track?: MediaStreamTrack;
    }>({ enabled: false });
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    let alive = true;
    const reconcile = () => {
      const current = readPeer();
      if (alive)
        setPeer((previous) => (previous === current ? previous : current));
    };
    reconcile();
    const timer = window.setInterval(reconcile, 500);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [client, peerId, readPeer]);
  useEffect(() => {
    if (!peer) {
      setRemote({ enabled: false });
      return;
    }
    const update = (payload?: {
      videoEnabled: boolean;
      videoTrack?: MediaStreamTrack;
    }) =>
      setRemote({
        enabled: payload?.videoEnabled ?? Boolean(peer.videoEnabled),
        track: payload?.videoTrack || peer.videoTrack,
      });
    update();
    peer.on?.("videoUpdate", update);
    const timer = window.setInterval(() => update(), 500);
    return () => {
      window.clearInterval(timer);
      peer.off?.("videoUpdate", update);
    };
  }, [peer]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (remote.track?.readyState === "live") {
      element.srcObject = new MediaStream([remote.track]);
      void element.play().catch(() => undefined);
      return () => {
        element.srcObject = null;
      };
    }
    if (peer?.registerVideoElement) {
      peer.registerVideoElement(element);
      return () => peer.deregisterVideoElement?.(element);
    }
    element.srcObject = null;
  }, [peer, remote.enabled, remote.track]);
  if (!remote.enabled && (!remote.track || remote.track.readyState !== "live"))
    return <video ref={ref} autoPlay playsInline hidden />;
  return (
    <button
      className={`class-video-tile${selected ? " selected" : ""}`}
      onClick={onOpen}
    >
      <video ref={ref} autoPlay playsInline />
      <span>{peer?.name || name}</span>
    </button>
  );
}
function VideoGrid({
  client,
  localName,
  mediaUsers,
  manualReady,
}: {
  client: RTKClient;
  localName: string;
  mediaUsers: MediaUser[];
  manualReady: boolean;
}) {
  const local = useRealtimeKitSelector((current) => ({
    enabled: current.self.videoEnabled,
    track: current.self.videoTrack,
  })) as { enabled: boolean; track?: MediaStreamTrack };
  const [revision, setRevision] = useState(0),
    [discovered, setDiscovered] = useState<string[]>([]);
  const ref = useRef<HTMLVideoElement>(null),
    [full, setFull] = useState<string | null>(null),
    [page,setPage] = useState(0),
    [facing, setFacing] = useState<"user" | "environment">("user");
  const subscribedVideos=useRef(new Set<string>()),desiredVideos=useRef(new Set<string>());
  useEffect(() => {
    const timer = window.setInterval(
      () => setRevision((value) => value + 1),
      750,
    );
    return () => window.clearInterval(timer);
  }, [client]);
  useEffect(() => {
    let cancelled=false;
    let running=false;
    let timer:number|undefined;
    const delays=[0,1_500,4_000];
    const discover=async(attempt:number)=>{
      if(cancelled||running)return;
      if(document.hidden){timer=window.setTimeout(()=>void discover(attempt),30_000);return;}
      running=true;
      let succeeded=false;
      try {
        const peers=await client.participants.getAllJoinedPeers("",100,0);
        if(cancelled)return;
        const ids=peers.map(peer=>peer.id).filter(id=>Boolean(id)&&id!==client.self.id).sort();
        setDiscovered(current=>current.length===ids.length&&current.every((id,index)=>id===ids[index])?current:ids);
        setRevision(value=>value+1);
        succeeded=true;
      } catch { /* Retry only during the bounded startup window. */ }
      finally {running=false;}
      if(!cancelled&&!succeeded&&attempt+1<delays.length)
        timer=window.setTimeout(()=>void discover(attempt+1),delays[attempt+1]);
    };
    timer=window.setTimeout(()=>void discover(0),0);
    const onVisible=()=>{if(!document.hidden)setRevision(value=>value+1);};
    document.addEventListener("visibilitychange",onVisible);
    return()=>{cancelled=true;if(timer!==undefined)window.clearTimeout(timer);document.removeEventListener("visibilitychange",onVisible);};
  }, [client]);
  void revision;
  const peerMap = new Map<string, { id: string; name?: string; videoEnabled?: boolean; videoTrack?: MediaStreamTrack }>();
  [
    client.participants.joined,
    client.participants.active,
    client.participants.videoSubscribed,
    client.participants.audioSubscribed,
  ].forEach((map) =>
    map
      .toArray()
      .forEach((peer) =>
        peerMap.set(peer.id, {
          id: peer.id,
          name: peer.name,
          videoEnabled: peer.videoEnabled,
          videoTrack: peer.videoTrack as MediaStreamTrack | undefined,
        }),
      ),
  );
  discovered.forEach((id) => {
    if (!peerMap.has(id))
      peerMap.set(id, {
        id,
        name:
          mediaUsers.find((user) => user.identity === id)?.displayName ||
          "Participant",
      });
  });
  const peers = [...peerMap.values()].filter((peer) =>
    Boolean(peer.videoEnabled || peer.videoTrack?.readyState === "live"),
  );
  const totalPages=Math.max(1,Math.ceil(peers.length/9));
  const visiblePeers=peers.slice(Math.min(page,totalPages-1)*9,(Math.min(page,totalPages-1)+1)*9);
  const desiredKey=visiblePeers.map(peer=>peer.id).join("|");
  useEffect(()=>{desiredVideos.current=new Set(desiredKey?desiredKey.split("|"):[]);},[desiredKey]);
  useEffect(()=>{
    if(!manualReady)return;
    const recovery=createRemoteMediaRecovery({
      peers:()=>[...desiredVideos.current].map(id=>({id,enabled:true,
        track:(client.participants.videoSubscribed.get(id)||client.participants.joined.get(id))?.videoTrack})),
      subscribed:subscribedVideos.current,
      subscribe:ids=>client.participants.subscribe(ids,["video"]),
      unsubscribe:ids=>client.participants.unsubscribe(ids,["video"]),
      pruneAbsent:false,
    });
    const reconcile=async()=>{
      const extra=[...subscribedVideos.current].filter(id=>!desiredVideos.current.has(id));
      if(extra.length){await client.participants.unsubscribe(extra,["video"]).catch(()=>undefined);
        extra.forEach(id=>subscribedVideos.current.delete(id));}
      await recovery.reconcile();
    };
    const refresh=()=>{void reconcile();};
    const maps=[client.participants.joined,client.participants.videoSubscribed];
    maps.forEach(map=>{map.on("participantJoined",refresh);map.on("videoUpdate",refresh);});
    document.addEventListener("visibilitychange",refresh);
    const timer=window.setInterval(refresh,3_000);refresh();
    return()=>{recovery.stop();window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh);
      maps.forEach(map=>{map.off("participantJoined",refresh);map.off("videoUpdate",refresh);});};
  },[client,manualReady]);
  useEffect(()=>{if(manualReady){const extra=[...subscribedVideos.current].filter(id=>!desiredVideos.current.has(id));
    void client.participants.unsubscribe(extra,["video"]).then(()=>{extra.forEach(id=>subscribedVideos.current.delete(id));}).catch(()=>undefined);}
  },[client,desiredKey,manualReady]);
  const tileCount = (local.enabled && local.track ? 1 : 0) + visiblePeers.length;
  useEffect(() => {
    const element = ref.current,
      track = local.track;
    if (!element || !track) return;
    element.srcObject = new MediaStream([track]);
    void element.play().catch(() => undefined);
    return () => {
      element.srcObject = null;
    };
  }, [local.track]);
  async function flip() {
    if (!local.enabled || !local.track) return;
    const next = facing === "user" ? "environment" : "user",
      previous = local.track;
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: next } },
      });
      const track = stream.getVideoTracks()[0];
      if (!track) throw new Error("CAMERA_TRACK_MISSING");
      await client.self.disableVideo();
      await client.self.enableVideo(track);
      previous.stop();
      setFacing(next);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      if (previous.readyState === "live" && !client.self.videoEnabled)
        await client.self.enableVideo(previous).catch(() => undefined);
    }
  }
  return (
    <div
      className={`class-video-grid${full ? " fullscreen" : ""}`}
      data-count={tileCount}
      data-layout={mediaGridLayout(tileCount)}
    >
      {local.enabled && local.track && (
        <button
          className={`class-video-tile${full === "local" ? " selected" : ""}`}
          onClick={() => setFull("local")}
        >
          <video ref={ref} autoPlay muted playsInline />
          <span>{localName}</span>
        </button>
      )}
      {visiblePeers.map((peer) => (
        <RemoteVideo
          key={peer.id}
          client={client}
          peerId={peer.id}
          name={peer.name || "Participant"}
          selected={full === peer.id}
          onOpen={() => setFull(peer.id)}
        />
      ))}
      {totalPages>1&&<div className="class-video-pages"><button type="button" disabled={page<=0} onClick={()=>setPage(value=>Math.max(0,value-1))}>←</button><span>{Math.min(page,totalPages-1)+1}/{totalPages}</span><button type="button" disabled={page>=totalPages-1} onClick={()=>setPage(value=>Math.min(totalPages-1,value+1))}>→</button></div>}
      {full && (
        <div className="class-video-full-actions">
          {full === "local" && (
            <button onClick={() => void flip()} aria-label="Flip camera">
              ⇄
            </button>
          )}
          <button
            onClick={() => setFull(null)}
            aria-label="Back to video tiles"
          >
            ▦
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectedRoom({
  client,
  room,
  identity,
  manager,
  displayName,
  role,
  mic,
  camera,
  micLive,
  cameraLive,
  lang,
  onMedia,
  onLeave,
  onlineCount,
  presenceEvents,
  roomTabId,
  onlineMembers,
  speakerEnabled,
  onSpeakerEnabled,
  resourcePanel,
  onResourcePanelChange,
}: {
  client: RTKClient;
  room: Room;
  identity: string;
  manager: boolean;
  displayName: string;
  role: Role;
  mic: boolean;
  camera: boolean;
  micLive: boolean;
  cameraLive: boolean;
  lang: "en" | "zh";
  onMedia: (mic: boolean, camera: boolean) => Promise<void>;
  onLeave: () => void;
  onlineCount: number;
  presenceEvents: RoomPresenceEvent[];
  roomTabId: string;
  onlineMembers: OnlineMember[];
  speakerEnabled: boolean;
  onSpeakerEnabled: (enabled: boolean) => void;
  resourcePanel: ResourcePanel;
  onResourcePanelChange: (panel: ResourcePanel) => void;
}) {
  const [media, setMedia] = useState<Media | null>(null),
    [error, setError] = useState(""),
    [blocked, setBlocked] = useState(false),
    [speakerEmail, setSpeakerEmail] = useState(""),
    [connectedSeconds, setConnectedSeconds] = useState(0),
    [confirmLeave, setConfirmLeave] = useState(false),
    [usersOpen,setUsersOpen] = useState(false),
    [changingMedia, setChangingMedia] = useState(false),
    [pendingMedia, setPendingMedia] = useState<{
      mic: boolean;
      camera: boolean;
    } | null>(null),
    [playbackConfirmed, setPlaybackConfirmed] = useState(false);
  const [manualReady,setManualReady]=useState(false);
  const chatRef = useRef<ClassPrivateChatHandle>(null),
    cameraBeforeScreenShare = useRef(false),
    changingMediaRef = useRef(false),
    playingSources = useRef(new Set<string>());
  const listening = speakerEnabled;
  const setListening = onSpeakerEnabled;
  const speakerState = speakerPlaybackState({
    enabled: listening,
    blocked,
    confirmed: playbackConfirmed,
    audioOnly: room.streamingMode === "audio",
    interactionMode: room.realtimeMode,
    joined: true,
    hasOtherParticipant: onlineCount > 1,
  });
  const speakerAppearance = speakerControlAppearance(speakerState);
  const onPlaybackChange = useCallback((id: string, playing: boolean) => {
    if (playing) playingSources.current.add(id);
    else playingSources.current.delete(id);
    setPlaybackConfirmed(playingSources.current.size > 0);
  }, []);
  const onPlaybackBlocked = useCallback(() => {
    setBlocked(true);
  }, []);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(
      () => setConnectedSeconds(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (room.realtimeMode === "livestream" && role === "viewer") return;
    let active=true;
    void client.participants.setViewMode("MANUAL")
      .then(()=>{if(active)setManualReady(true);})
      .catch(()=>{if(active){setManualReady(false);
        void client.participants.setViewMode("ACTIVE_GRID").catch(()=>undefined);}});
    return()=>{active=false;};
  }, [client, role, room.realtimeMode]);
  const load = useCallback(async () => {
    const m = await fetch(
      `/api/classes/${room.code}/media?identity=${encodeURIComponent(identity)}`,
      { cache: "no-store" },
    );
    if (m.ok) setMedia(await m.json());
    await fetch(`/api/classes/${room.code}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "heartbeat", identity, mic, camera }),
    });
  }, [camera, identity, mic, room.code]);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [load]);
  useEffect(() => {
    if (media?.canPublish)
      setError((current) =>
        current === "Hand raised. Waiting for the host to approve."
          ? ""
          : current,
      );
  }, [media?.canPublish]);
  useEffect(() => {
    if (
      room.realtimeMode === "livestream" &&
      manager &&
      client.livestream.state !== "LIVESTREAMING" &&
      client.livestream.state !== "STARTING"
    )
      void client.livestream
        .start()
        .catch(() => setError("Unable to start livestream delivery."));
  }, [client, manager, room.realtimeMode]);
  async function change(nextMic: boolean, nextCamera: boolean) {
    if (changingMediaRef.current) return;
    changingMediaRef.current = true;
    setChangingMedia(true);
    setPendingMedia({ mic: nextMic, camera: nextCamera });
    setError("");
    try {
      if (
        !manager &&
        role === "viewer" &&
        room.realtimeMode === "webinar" &&
        !media?.canPublish &&
        (nextMic || nextCamera)
      ) {
        const kind = nextCamera ? "video" : "audio";
        const response = await fetch(`/api/classes/${room.code}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "request-stage",
            identity,
            mediaKind: kind,
          }),
        });
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) throw new Error(result.error || (lang === "zh" ? "举手请求未发送，请重新进入课程后再试。" : "The hand-raise request was not sent. Rejoin the course and try again."));
        setError("Hand raised. Waiting for the host to approve.");
        await load();
        return;
      }
      if (
        (nextMic || nextCamera) &&
        (window as PlaylistWindow).__smartClassStopPlaylist
      )
        await (window as PlaylistWindow).__smartClassStopPlaylist?.();
      await onMedia(nextMic, nextCamera);
      if (nextMic || nextCamera) setListening(true);
      await load();
    } catch (issue) {
      setError(
        issue instanceof Error ? issue.message : "Unable to change media",
      );
    } finally {
      changingMediaRef.current = false;
      setChangingMedia(false);
      setPendingMedia(null);
    }
  }
  async function review(request: StageRequest, approve: boolean) {
    await fetch(`/api/classes/${room.code}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "review-stage",
        identity: request.identity,
        mediaKind: request.mediaKind,
        approve,
      }),
    });
    await load();
  }
  async function addSpeaker() {
    if (!speakerEmail.trim()) return;
    const response = await fetch(`/api/classes/${room.code}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "add-speaker", email: speakerEmail }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) setError(data.error || "Unable to add speaker");
    else {
      setSpeakerEmail("");
      await load();
    }
  }
  return (
    <>
      <header className="class-room-controls">
        <span className="sr-only">{room.title}</span>
        <nav>
          {(room.realtimeMode !== "livestream" || manager) && <button
            className={
              (pendingMedia?.mic ?? mic)
                ? !pendingMedia && micLive
                  ? "on"
                  : "pending"
                : ""
            }
            disabled={changingMedia}
            aria-busy={Boolean(pendingMedia?.mic)}
            aria-pressed={!pendingMedia && micLive}
            onClick={() => void change(!mic, camera)}
            aria-label={lang === "zh" ? "麦克风" : "Microphone"}
          >
            <MicIcon />
          </button>}
          {(room.realtimeMode !== "livestream" || manager) && room.streamingMode === "video" && (
            <button
              className={
                (pendingMedia?.camera ?? camera)
                  ? !pendingMedia && cameraLive
                    ? "on"
                    : "pending"
                  : ""
              }
              disabled={changingMedia}
              aria-busy={Boolean(pendingMedia?.camera)}
              aria-pressed={!pendingMedia && cameraLive}
              onClick={() => void change(mic, !camera)}
              aria-label={lang === "zh" ? "摄像头" : "Camera"}
            >
              <CameraIcon />
            </button>
          )}
          {SHOW_ADVANCED_SHARE_BUTTONS && room.streamingMode === "audio" &&
          room.realtimeMode !== "livestream" ? (
            <ClassAudioScreenShare
              code={room.code}
              displayName={displayName}
              manager={manager}
              lang={lang}
              listening={listening}
              onError={setError}
              apiBase="/api/classes"
            />
          ) : SHOW_ADVANCED_SHARE_BUTTONS ? (
            <ClassScreenShareButton
              client={client}
              manager={manager && room.streamingMode === "video"}
              lang={lang}
              onError={setError}
              onSharingChange={(sharing) => {
                if (sharing) {
                  cameraBeforeScreenShare.current = camera;
                  if (camera) void change(mic, false);
                } else if (cameraBeforeScreenShare.current) {
                  cameraBeforeScreenShare.current = false;
                  void change(mic, true);
                }
              }}
            />
          ) : null}{" "}
          {SHOW_ADVANCED_SHARE_BUTTONS && room.streamingMode === "video" && (
            <ClassVideoContentShare
              client={client}
              code={room.code}
              identity={identity}
              mic={mic}
              camera={camera}
              manager={manager}
              lang={lang}
              onError={setError}
              onMedia={change}
              apiBase="/api/classes"
            />
          )}
          <button
            className={speakerAppearance.green ? "on" : speakerAppearance.orange ? "pending" : ""}
            onClick={() => {
              setListening(!listening);
              setBlocked(false);
            }}
            aria-label={lang === "zh" ? "扬声器" : "Device speaker"}
            aria-pressed={speakerAppearance.pressed}
          >
            <SpeakerIcon off={!listening} />
            {listening && playbackConfirmed ? <span>{formatConnectionDuration(connectedSeconds)}</span> : null}
            {listening && !playbackConfirmed && onlineCount <= 1 ? <span className="sr-only">{lang === "zh" ? "等待加入" : "Waiting for members"}</span> : null}
          </button>
          <button type="button" onClick={()=>{setUsersOpen(false);onResourcePanelChange(resourcePanel==="recordings"?null:"recordings");}} aria-label={lang==="zh"?"课程录音":"Course recordings"}><AudioFileIcon/></button>
          <button type="button" onClick={()=>{setUsersOpen(false);onResourcePanelChange(resourcePanel==="files"?null:"files");}} aria-label={lang==="zh"?"课程附件":"Course attachments"}><PaperclipIcon/></button>
          <button type="button" onClick={()=>{onResourcePanelChange(null);setUsersOpen(true);}} aria-label={lang==="zh"?`用户，在线 ${onlineMembers.length}`:`Members, ${onlineMembers.length} online`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 15c3 0 5 2 5 5" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg>
          </button>
          <button className="leave" onClick={() => setConfirmLeave(true)} aria-label={lang === "zh" ? "挂断并离开" : "Hang up and leave"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 11.3a15.4 15.4 0 0 1 19.6 0c.7.6.8 1.7.2 2.4l-1.8 2.2a1.7 1.7 0 0 1-2.1.4l-2.9-1.5a1.7 1.7 0 0 1-.9-1.5v-1.8a14 14 0 0 0-4.6 0v1.8a1.7 1.7 0 0 1-.9 1.5l-2.9 1.5a1.7 1.7 0 0 1-2.1-.4L2 13.7c-.6-.7-.5-1.8.2-2.4Z" fill="currentColor" stroke="none" /></svg>
          </button>
        </nav>
      </header>
      {usersOpen&&<ClassRoomMembers members={onlineMembers} lang={lang} onClose={()=>setUsersOpen(false)}/>}
      {confirmLeave && (
        <div className="media-idle-backdrop" role="presentation">
          <section className="media-idle-dialog" role="dialog" aria-modal="true">
            <h2>{lang === "zh" ? "离开课程？" : "Leave the course room?"}</h2>
            <div className="media-idle-actions">
              <button type="button" onClick={() => setConfirmLeave(false)}>{lang === "zh" ? "继续" : "Continue"}</button>
              <button type="button" className="danger" onClick={onLeave}>{lang === "zh" ? "离开" : "Leave"}</button>
            </div>
          </section>
        </div>
      )}
      {error && (
        <p className="class-room-error" role="alert">
          {error}
        </p>
      )}
      {room.streamingMode === "audio" && room.realtimeMode === "group_call" && <RoomPresenceTicker scope={room.code} events={presenceEvents} fallback={lang === "zh" ? "等待成员进入会议室" : "Waiting for members to enter the room"}/>}
      {blocked && (
        <button
          className="class-audio-unlock"
          onClick={() => {
            setListening(true);
            setBlocked(false);
          }}
        >
          {lang === "zh" ? "开始收听" : "Start listening"}
        </button>
      )}
      {room.streamingMode === "video" && onlineCount > 1 && (
        <ClassScreenShareStage
          client={client}
          lang={lang}
          listening={listening}
        />
      )}
      {room.realtimeMode === "livestream" && role === "viewer" ? (
        <LivestreamPlayer
          client={client}
          enabled={listening}
          onBlocked={onPlaybackBlocked}
          onPlaybackChange={onPlaybackChange}
        />
      ) : (
        <>
          <ParticipantsAudio
            client={client}
            enabled={listening}
            manualReady={manualReady}
            onBlocked={onPlaybackBlocked}
            onPlaybackChange={onPlaybackChange}
          />
          {room.streamingMode === "video" && onlineCount > 1 && (
            <VideoGrid
              client={client}
              localName={displayName}
              mediaUsers={media?.users || []}
              manualReady={manualReady}
            />
          )}
        </>
      )}
      {manager &&
        room.realtimeMode === "webinar" &&
        Boolean(media?.requests.length) && (
          <section className="class-stage-panel">
            <h3>Raised hands</h3>
            {media!.requests.map((request) => (
              <article key={`${request.identity}-${request.mediaKind}`}>
                <span>
                  {request.displayName} · {request.mediaKind}
                </span>
                <button onClick={() => void review(request, true)}>
                  Approve
                </button>
                <button onClick={() => void review(request, false)}>
                  Deny
                </button>
              </article>
            ))}
          </section>
        )}
      {manager && room.realtimeMode === "livestream" && (
        <section className="class-stage-panel">
          <h3>Livestream speakers</h3>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void addSpeaker();
            }}
          >
            <input
              type="email"
              value={speakerEmail}
              onChange={(event) => setSpeakerEmail(event.target.value)}
              placeholder={
                lang === "zh" ? "已注册会员邮箱" : "Registered member email"
              }
            />
            <button>Add speaker</button>
          </form>
          {media?.speakers.map((item) => (
            <span key={item.email}>{item.email}</span>
          ))}
        </section>
      )}
      <div className="class-streaming-users" role="group" aria-label={lang === "zh" ? "正在推流的会员" : "Members streaming"}>
        {(media?.users || []).filter(user => user.micOn || user.cameraOn).map(user => (
          <button key={user.identity} type="button" onClick={() => chatRef.current?.mention(user.displayName)}>
            {user.displayName.trim()}
          </button>
        ))}
      </div>
      <section className="class-chat">
        <header><h2>{lang === "zh" ? "私密支持聊天" : "Private support chat"}</h2><small>{lang === "zh" ? "仅发送者与主持团队可见" : "Visible to sender and host team only"}</small></header>
        <ClassPrivateChat ref={chatRef} code={room.code} tabId={roomTabId} locale={lang} supportAgent={manager} reportError={setError}/>
      </section>
      <p className="class-chat-retention">{lang === "zh" ? "聊天消息仅保留 7 天，请提前保存需要的内容。" : "Chat messages are retained for seven days only. Save anything you need beforehand."}</p>
    </>
  );
}

export function ClassRoomClient({
  room,
  displayName,
  manager,
  lang = "en",
}: {
  room: Room;
  displayName: string;
  manager: boolean;
  lang?: "en" | "zh";
}) {
  const [client, initClient] = useRealtimeKitClient({ resetOnLeave: true }),
    [joined, setJoined] = useState(false),
    [roomTabId] = useState(() => crypto.randomUUID()),
    [onlineCount, setOnlineCount] = useState(0),
    [presenceConfirmed,setPresenceConfirmed] = useState(false),
    [presenceRevision,setPresenceRevision] = useState(0),
    [onlineMembers,setOnlineMembers] = useState<OnlineMember[]>([]),
    [waitingUsersOpen,setWaitingUsersOpen] = useState(false),
    [speakerEnabled,setSpeakerEnabled] = useState(true),
    [resourcePanel,setResourcePanel] = useState<ResourcePanel>(null),
    [resourceBusy,setResourceBusy] = useState(false),
    [presenceEvents, setPresenceEvents] = useState<RoomPresenceEvent[]>([]),
    [roomAdmissionError, setRoomAdmissionError] = useState(""),
    [waitingIntent, setWaitingIntent] = useState<{mic:boolean;camera:boolean}|null>(null),
    [localPublisherStarted, setLocalPublisherStarted] = useState(false),
    [role, setRole] = useState<Role>("viewer"),
    [mic, setMic] = useState(false),
    [camera, setCamera] = useState(false),
    [identity] = useState(() => crypto.randomUUID()),
    [entryPassword] = useState(() => { try { return String(JSON.parse(sessionStorage.getItem(`class-entry-${room.code}`) || "{}").password || ""); } catch { return ""; } }),
    [error, setError] = useState(""),
    [connecting, setConnecting] = useState(false),
    [playlistEnabled, setPlaylistEnabled] = useState(false),
    [hostOnline, setHostOnline] = useState(manager),
    [humanStreamActive, setHumanStreamActive] = useState(false),
    [humanStreamSeen, setHumanStreamSeen] = useState(false),
    [hasAudience, setHasAudience] = useState(true),
    [localTrackHealth, setLocalTrackHealth] = useState({
      audio: false,
      video: false,
    }),
    joining = useRef(false),
    mediaOperationBusy = useRef(false),
    mediaIntent = useRef({ mic: false, camera: false }),
    previousOnlineMembers = useRef(new Map<string,string>()),
    presenceSequence = useRef(0),
    lastWaitingJoinAttempt = useRef(0),
    leavingRoom = useRef(false),
    presenceInFlight = useRef<Promise<void>|null>(null);
  useEffect(() => {
    let active=true;
    const endpoint=`/api/classes/${room.code}/room-presence`;
    const poll=()=>{
      if(presenceInFlight.current||leavingRoom.current)return;
      const task=(async()=>{try {
        const claim=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"heartbeat",tabId:roomTabId}),cache:"no-store"});
        if(!active)return;
        if(!claim.ok){
          setPresenceConfirmed(false);
          const failure=await claim.json().catch(()=>({})) as {errorCode?:string};
          setRoomAdmissionError(failure.errorCode==="ALREADY_IN_ROOM"?(lang==="zh"?"此账号已在另一设备进入该课程。":"This account is already in the room on another device."):(lang==="zh"?"无法确认在线状态，请重试。":"Could not verify room presence. Try again."));
          return;
        }
        const status=await fetch(endpoint,{cache:"no-store"});
        if(active&&status.ok){
          setPresenceConfirmed(true);
          setRoomAdmissionError("");
          const snapshot=await status.json() as {onlineCount:number;members:OnlineMember[]};
          setOnlineCount(Number(snapshot.onlineCount||0));
          setPresenceRevision(value=>value+1);
          setOnlineMembers(snapshot.members||[]);
          const next=new Map((snapshot.members||[]).map(member=>[member.userId,member.displayName]));
          const changes=roomPresenceChanges(previousOnlineMembers.current,next,presenceSequence.current,lang==="zh");
          previousOnlineMembers.current=next;
          if(changes.length){presenceSequence.current=changes.at(-1)!.sequence;setPresenceEvents(current=>[...current,...changes].slice(-20));}
        } else if(active) {
          setPresenceConfirmed(false);
          setRoomAdmissionError(lang==="zh"?"无法确认在线人数，请重试。":"Could not verify room members. Try again.");
        }
      } catch {if(active){setPresenceConfirmed(false);setRoomAdmissionError(lang==="zh"?"在线状态连接中断。":"Room presence connection was interrupted.");}}})();
      presenceInFlight.current=task;
      void task.finally(()=>{if(presenceInFlight.current===task)presenceInFlight.current=null;});
    };
    poll();
    const timer=window.setInterval(poll,3_000);
    const visible=()=>{if(document.visibilityState==="visible")poll();};
    document.addEventListener("visibilitychange",visible);
    return()=>{active=false;window.clearInterval(timer);document.removeEventListener("visibilitychange",visible);
      const body=new Blob([JSON.stringify({action:"leave",tabId:roomTabId})],{type:"application/json"});
      if(!navigator.sendBeacon(endpoint,body))void fetch(endpoint,{method:"POST",body,keepalive:true});
    };
  },[lang,room.code,roomTabId]);
  useEffect(() => {
    mediaIntent.current = { mic, camera };
  }, [camera, mic]);
  const disconnect = useCallback(
    async (report = true) => {
      const audioTrack = client?.self.audioTrack,
        videoTrack = client?.self.videoTrack,
        wasPublishing = Boolean(
          client?.self.audioEnabled || client?.self.videoEnabled,
        );
      try {
        await (window as PlaylistWindow).__smartClassStopPlaylist?.();
        await client?.self.disableScreenShare();
        await client?.self.disableAudio();
        await client?.self.disableVideo();
        audioTrack?.stop();
        videoTrack?.stop();
        if (
          room.realtimeMode === "livestream" &&
          wasPublishing &&
          client?.livestream.state === "LIVESTREAMING"
        )
          await client.livestream.stop();
        await client?.leave();
      } catch {
        audioTrack?.stop();
        videoTrack?.stop();
      }
      if (report)
        await fetch(`/api/classes/${room.code}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "leave", identity }),
          keepalive: true,
        }).catch(() => undefined);
      setMic(false);
      setCamera(false);
      mediaIntent.current = { mic: false, camera: false };
      setLocalTrackHealth({ audio: false, video: false });
      setJoined(false);
    },
    [client, identity, room.code, room.realtimeMode],
  );
  const connect = useCallback(
    async ({
      start = false,
      publish = false,
      nextMic = false,
      nextCamera = false,
      preparedAudioTrack,
      preparedVideoTrack,
    }: {
      start?: boolean;
      publish?: boolean;
      nextMic?: boolean;
      nextCamera?: boolean;
      preparedAudioTrack?: MediaStreamTrack;
      preparedVideoTrack?: MediaStreamTrack;
    } = {}) => {
      if (joining.current) return;
      if (roomAdmissionError) return;
      joining.current = true;
      setConnecting(true);
      setError("");
      try {
        if (client && joined) await disconnect(false);
        const response = await fetch(`/api/classes/${room.code}/join`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              identity,
              password: entryPassword,
              start,
              publish,
              tabId: roomTabId,
            }),
          }),
          data = (await response.json().catch(() => ({}))) as {
            authToken?: string;
            role?: Role;
            error?: string;
          };
        if (!response.ok || !data.authToken) {
          if (data.error !== "STREAM_NOT_ACTIVE" && data.error !== "Waiting for another member" && data.error !== "Provider room is starting" && data.error !== "Provider room is closing")
            setError(data.error || "Unable to connect");
          return;
        }
        const next = await initClient({
          authToken: data.authToken,
          defaults: { audio: false, video: false },
        });
        await next?.join();
        await next?.self.disableAudio();
        await next?.self.disableVideo();
        const approval = await fetch(`/api/classes/${room.code}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "media",
            identity,
            mic: nextMic,
            camera: nextCamera,
            authorizeOnly: true,
          }),
        });
        if (!approval.ok)
          throw new Error(
            ((await approval.json().catch(() => ({}))) as { error?: string })
              .error || "Media permission denied",
          );
        if (nextMic) await next?.self.enableAudio(preparedAudioTrack);
        if (nextCamera) await next?.self.enableVideo(preparedVideoTrack);
        await fetch(`/api/classes/${room.code}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "media",
            identity,
            mic: nextMic,
            camera: nextCamera,
          }),
        });
        setRole(data.role || "viewer");
        setMic(nextMic);
        setCamera(nextCamera);
        mediaIntent.current = { mic: nextMic, camera: nextCamera };
        setLocalTrackHealth({
          audio: publishedLocalTrackIsLive(next?.self, "audio"),
          video: publishedLocalTrackIsLive(next?.self, "video"),
        });
        setJoined(true);
      } catch (issue) {
        preparedAudioTrack?.stop();
        preparedVideoTrack?.stop();
        setError(
          issue instanceof Error
            ? issue.message
            : "Live media connection failed.",
        );
      } finally {
        joining.current = false;
        setConnecting(false);
      }
    },
    [client, disconnect, entryPassword, identity, initClient, joined, room.code, roomTabId, roomAdmissionError],
  );
  const changeMedia = useCallback(
    async (nextMic: boolean, nextCamera: boolean) => {
      if (mediaOperationBusy.current) return;
      mediaOperationBusy.current = true;
      try {
        if (nextMic || nextCamera) setLocalPublisherStarted(true);
        const addingSecondDevice = Boolean(
          client &&
            joined &&
            ((nextMic && !mic && camera) ||
              (nextCamera && !camera && mic)),
        );
        if ((role === "viewer" && (nextMic || nextCamera)) || addingSecondDevice) {
          // Rebuilding both approved tracks when the second device is added
          // avoids Safari retaining a stale one-device publisher preset.
          const permission = await navigator.mediaDevices.getUserMedia({
            audio: nextMic,
            video: nextCamera ? { facingMode: "user" } : false,
          });
          await connect({
            publish: true,
            nextMic,
            nextCamera,
            preparedAudioTrack: permission.getAudioTracks()[0],
            preparedVideoTrack: permission.getVideoTracks()[0],
          });
          return;
        }
        const approval = await fetch(`/api/classes/${room.code}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "media",
            identity,
            mic: nextMic,
            camera: nextCamera,
            authorizeOnly: true,
          }),
        });
        if (!approval.ok)
          throw new Error(
            ((await approval.json().catch(() => ({}))) as { error?: string })
              .error || "Unable to change media",
          );
        const audioTrack = client?.self.audioTrack,
          videoTrack = client?.self.videoTrack;
        let permission: MediaStream | undefined;
        if ((nextMic && !mic) || (nextCamera && !camera))
          permission = await navigator.mediaDevices.getUserMedia({
            audio: nextMic && !mic,
            video: nextCamera && !camera ? { facingMode: "user" } : false,
          });
        if (nextMic && !mic)
          await client?.self.enableAudio(permission?.getAudioTracks()[0]);
        else if (!nextMic && mic) {
          await client?.self.disableAudio();
          audioTrack?.stop();
        }
        if (nextCamera && !camera)
          await client?.self.enableVideo(permission?.getVideoTracks()[0]);
        else if (!nextCamera && camera) {
          await client?.self.disableVideo();
          videoTrack?.stop();
        }
        const response = await fetch(`/api/classes/${room.code}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "media",
            identity,
            mic: nextMic,
            camera: nextCamera,
          }),
        });
        if (!response.ok) throw new Error("Unable to synchronize media state");
        setMic(nextMic);
        setCamera(nextCamera);
        mediaIntent.current = { mic: nextMic, camera: nextCamera };
        setLocalTrackHealth({
          audio: publishedLocalTrackIsLive(client?.self, "audio"),
          video: publishedLocalTrackIsLive(client?.self, "video"),
        });
      } finally {
        mediaOperationBusy.current = false;
      }
    },
    [camera, client, connect, identity, joined, mic, role, room.code],
  );
  useEffect(() => {
    if (!waitingIntent || roomAdmissionError || !presenceConfirmed || resourceBusy) return;
    const now=Date.now();
    if(!shouldJoinGroupAudioLobby({ready:true,onlineCount,joined,busy:connecting||joining.current,now,lastAttemptAt:lastWaitingJoinAttempt.current}))return;
    lastWaitingJoinAttempt.current=now;
    const intent=waitingIntent;
    void changeMedia(intent.mic,intent.camera).catch(issue=>setError(issue instanceof Error?issue.message:"Unable to start media"));
  },[changeMedia,connecting,joined,onlineCount,presenceRevision,presenceConfirmed,resourceBusy,roomAdmissionError,waitingIntent]);
  useEffect(()=>{if(joined&&waitingIntent)setWaitingIntent(null);},[joined,waitingIntent]);
  useEffect(() => {
    if(!joined||onlineCount>1)return;
    const timer=window.setTimeout(async()=>{
      const status=await fetch(`/api/classes/${room.code}/room-presence`,{cache:"no-store"}).catch(()=>null);
      if(!status?.ok)return;
      const count=Number(((await status.json()) as {onlineCount:number}).onlineCount||0);
      if(count>1)return;
      const intent=mediaIntent.current;
      await disconnect(true);
      if(intent.mic||intent.camera)setWaitingIntent(intent);
    },9_000);
    return()=>window.clearTimeout(timer);
  },[disconnect,joined,onlineCount,room.code,room.realtimeMode]);
  useEffect(() => {
    if(!joined||presenceConfirmed)return;
    let active=true;
    let timer:number|undefined;
    const check=()=>{
      if(!active)return;
      const hasRemote=Boolean(client?.participants.joined.toArray()
        .some(peer=>peer.id!==client.self.id));
      if(hasRemote){timer=window.setTimeout(check,3_000);return;}
      const intent=mediaIntent.current;
      void disconnect(true).then(()=>{
        if(active&&(intent.mic||intent.camera))setWaitingIntent(intent);
      });
    };
    timer=window.setTimeout(check,18_000);
    return()=>{active=false;if(timer!==undefined)window.clearTimeout(timer);};
  },[client,disconnect,joined,presenceConfirmed]);
  useEffect(() => {
    if (!joined || !client) {
      setLocalTrackHealth({ audio: false, video: false });
      return;
    }
    const monitor = createLocalMediaHealthMonitor({
      snapshot: () => ({
        audio: {
          expected: !mediaOperationBusy.current && mediaIntent.current.mic,
          live: publishedLocalTrackIsLive(client.self, "audio"),
        },
        video: {
          expected: !mediaOperationBusy.current && mediaIntent.current.camera,
          live: publishedLocalTrackIsLive(client.self, "video"),
        },
      }),
      onHealth: (health) =>
        setLocalTrackHealth((current) =>
          current.audio === health.audio.live &&
          current.video === health.video.live
            ? current
            : { audio: health.audio.live, video: health.video.live },
        ),
      onStale: async (kinds) => {
        if (mediaOperationBusy.current) return;
        const next = { ...mediaIntent.current };
        for (const kind of kinds) {
          if (kind === "audio") {
            await client.self.disableAudio().catch(() => undefined);
            client.self.audioTrack?.stop();
            next.mic = false;
          } else {
            await client.self.disableVideo().catch(() => undefined);
            client.self.videoTrack?.stop();
            next.camera = false;
          }
        }
        mediaIntent.current = next;
        setMic(next.mic);
        setCamera(next.camera);
        setLocalTrackHealth({
          audio: publishedLocalTrackIsLive(client.self, "audio"),
          video: publishedLocalTrackIsLive(client.self, "video"),
        });
        await fetch(`/api/classes/${room.code}/media`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "media",
            identity,
            mic: next.mic,
            camera: next.camera,
          }),
        }).catch(() => undefined);
        setError(
          lang === "zh"
            ? "麦克风或摄像头实时轨道已中断；按钮已同步为关闭，请再次点击恢复。"
            : "A microphone or camera track stopped. Its control is now off; tap it again to restore.",
        );
      },
    });
    const reconcile = () => {
      void monitor.reconcile();
    };
    client.self.on("audioUpdate", reconcile);
    client.self.on("videoUpdate", reconcile);
    document.addEventListener("visibilitychange", reconcile);
    const timer = window.setInterval(reconcile, 2_000),
      first = window.setTimeout(reconcile, 0);
    return () => {
      monitor.stop();
      window.clearTimeout(first);
      window.clearInterval(timer);
      client.self.off("audioUpdate", reconcile);
      client.self.off("videoUpdate", reconcile);
      document.removeEventListener("visibilitychange", reconcile);
    };
  }, [client, identity, joined, lang, room.code]);
  const reportLeave = useCallback(() => {
    void fetch(`/api/classes/${room.code}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "leave", identity }),
      keepalive: true,
    }).catch(() => undefined);
  }, [identity, room.code]);
  const leave = useCallback(async () => {
    leavingRoom.current=true;
    await presenceInFlight.current?.catch(()=>undefined);
    await disconnect(true);
    await fetch(`/api/classes/${room.code}/room-presence`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({action:"leave",tabId:roomTabId}),keepalive:true,
    }).catch(()=>undefined);
    window.location.assign(`/${lang}/classes/${room.code}`);
  }, [disconnect, lang, room.code,roomTabId]);
  const confirmStillAlone = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/classes/${room.code}/media?identity=${encodeURIComponent(identity)}`,
        { cache: "no-store" },
      );
      if (!response.ok) return false;
      const state = (await response.json()) as Media;
      return loneClassParticipantConfirmed(state.users, identity);
    } catch {
      return false;
    }
  }, [identity, room.code]);
  useEffect(() => {
    let alive = true;
    const check = async () => {
      const [mediaResponse, playlistResponse] = await Promise.all([
        fetch(`/api/classes/${room.code}/media`, { cache: "no-store" }),
        fetch(`/api/classes/${room.code}/playlist`, { cache: "no-store" }),
      ]);
      if (!alive) return;
      const mediaState = mediaResponse.ok
          ? ((await mediaResponse.json()) as Media)
          : null,
        playlist = playlistResponse.ok
          ? ((await playlistResponse.json()) as PlaylistResponse)
          : null,
        active = Boolean(playlist?.state?.active && playlist.items.length);
      setPlaylistEnabled(active);
      if (mediaState) {
        setHostOnline(Boolean(mediaState.hostOnline) || manager);
        setHasAudience(onlineCount>1);
        const nextHumanStreamActive = Boolean(
          mediaState.users?.some((user) =>
            Boolean(user.micOn || user.cameraOn),
          ),
        );
        setHumanStreamActive(nextHumanStreamActive);
        if (nextHumanStreamActive) setHumanStreamSeen(true);
      }
      if (mediaState && shouldAutoJoinClassRoom(mediaState) && onlineCount>1 && !roomAdmissionError && !joined && !joining.current)
        void connect();
      if (
        mediaState &&
        !mediaState.streamActive &&
        joined
      )
        void disconnect(true);
    };
    void check();
    const poll = window.setInterval(() => void check(), 3000),
      visible = () => {
        if (document.visibilityState === "visible") void check();
      };
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive = false;
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [connect, disconnect, identity, joined, manager, onlineCount, room.code, roomAdmissionError]);
  useEffect(() => {
    if (!joined || manager || hostOnline) return;
    const timer = window.setTimeout(() => {
      setError(
        lang === "zh"
          ? "主持人离线已满 5 分钟，已自动离开课程。"
          : "The host has been offline for 5 minutes. You have left the course room.",
      );
      void disconnect(true);
      window.setTimeout(
        () => window.location.assign(`/${lang}/classes/${room.code}`),
        900,
      );
    }, 300000);
    return () => window.clearTimeout(timer);
  }, [disconnect, hostOnline, joined, lang, manager, room.code]);
  useEffect(() => {
    const cleanup = () => {
      const body = new Blob([JSON.stringify({ action: "leave", identity })], {
        type: "application/json",
      });
      if (!navigator.sendBeacon(`/api/classes/${room.code}/media`, body))
        reportLeave();
      void disconnect(false);
    };
    window.addEventListener("pagehide", cleanup);
    return () => window.removeEventListener("pagehide", cleanup);
  }, [disconnect, identity, reportLeave, room.code]);
  const managerPanel = manager ? (
    <ClassPlaylistManager
      code={room.code}
      locale={lang}
      realtimeMode={room.realtimeMode}
    />
  ) : null;
  const waitingPlaylist = (
    <ClassPlaylistPlayer
      code={room.code}
      locale={lang}
      apiBase="/api/classes"
      enabled={playlistEnabled && !humanStreamActive && !humanStreamSeen}
    />
  );
  if (!joined || !client)
    return (
      <>
        {managerPanel}
        {waitingPlaylist}
        <header className="class-room-controls">
          <span className="sr-only">{room.title}</span>
          <nav>
            {(manager || room.realtimeMode === "group_call") && <button className={waitingIntent?.mic ? "pending" : ""} disabled={Boolean(roomAdmissionError)||!presenceConfirmed} onClick={() => setWaitingIntent(current => {const next={mic:!current?.mic,camera:Boolean(current?.camera)};return next.mic||next.camera?next:null;})} aria-label={lang === "zh" ? "麦克风" : "Microphone"}><MicIcon /></button>}
            {(manager || room.realtimeMode === "group_call") && room.streamingMode === "video" && <button className={waitingIntent?.camera ? "pending" : ""} disabled={Boolean(roomAdmissionError)||!presenceConfirmed} onClick={() => setWaitingIntent(current => {const next={mic:Boolean(current?.mic),camera:!current?.camera};return next.mic||next.camera?next:null;})} aria-label={lang === "zh" ? "摄像头" : "Camera"}><CameraIcon /></button>}
            <button type="button" className={speakerEnabled ? "pending" : ""} aria-pressed={speakerEnabled} aria-label={speakerEnabled ? (lang === "zh" ? "等待加入，点击关闭扬声器" : "Waiting for members; turn speaker off") : (lang === "zh" ? "扬声器已关闭，点击开启" : "Speaker off; turn on")} onClick={()=>setSpeakerEnabled(value=>!value)}><SpeakerIcon off={!speakerEnabled}/><span>{speakerEnabled ? (lang === "zh" ? "等待加入" : "Waiting for members") : (lang === "zh" ? "已关闭" : "Off")}</span></button>
            <button type="button" onClick={()=>{setWaitingUsersOpen(false);setResourcePanel(value=>value==="recordings"?null:"recordings");}} aria-label={lang==="zh"?"课程录音":"Course recordings"}><AudioFileIcon/></button>
            <button type="button" onClick={()=>{setWaitingUsersOpen(false);setResourcePanel(value=>value==="files"?null:"files");}} aria-label={lang==="zh"?"课程附件":"Course attachments"}><PaperclipIcon/></button>
            <button type="button" onClick={()=>{setResourcePanel(null);setWaitingUsersOpen(true);}} aria-label={lang === "zh" ? `用户，在线 ${onlineCount}` : `Members, ${onlineCount} online`}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 15c3 0 5 2 5 5" fill="none" stroke="currentColor" strokeWidth="1.8"/></svg></button>
            <button className="leave" onClick={() => void leave()} aria-label={lang === "zh" ? "挂断并离开" : "Hang up and leave"}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 11.3a15.4 15.4 0 0 1 19.6 0c.7.6.8 1.7.2 2.4l-1.8 2.2a1.7 1.7 0 0 1-2.1.4l-2.9-1.5a1.7 1.7 0 0 1-.9-1.5v-1.8a14 14 0 0 0-4.6 0v1.8a1.7 1.7 0 0 1-.9 1.5l-2.9 1.5a1.7 1.7 0 0 1-2.1-.4L2 13.7c-.6-.7-.5-1.8.2-2.4Z" fill="currentColor" stroke="none" /></svg>
            </button>
          </nav>
        </header>
        {waitingUsersOpen&&<ClassRoomMembers members={onlineMembers} lang={lang} onClose={()=>setWaitingUsersOpen(false)}/>}
        <section className="class-waiting">
          <span className="stream-spinner" />
          <h2>
            {connecting
              ? lang === "zh" ? "正在连接…" : "Connecting…"
              : manager
                ? lang === "zh" ? "等待课程直播开始" : "Waiting to start the live course room"
                : lang === "zh" ? "等待课程直播开始" : "Waiting for the live course room"}
          </h2>
          <p>
            {manager
              ? lang === "zh" ? "其他成员进入后，所选的麦克风或摄像头将开始直播。" : "Your selected microphone or camera starts when another member enters."
              : lang === "zh" ? "直播开始后将自动加入收听，无需开放设备权限。" : "You join automatically as a viewer when streaming starts. No device permission is requested."}
          </p>
          {roomAdmissionError && <p role="alert">{roomAdmissionError}</p>}
          {error && <p role="alert">{error}</p>}
        </section>
        {room.streamingMode === "audio" && room.realtimeMode === "group_call" && <RoomPresenceTicker scope={room.code} events={presenceEvents} fallback={lang === "zh" ? "等待成员进入会议室" : "Waiting for members to enter the room"}/>}
        {presenceConfirmed && !roomAdmissionError && <section className="class-chat"><header><h2>{lang === "zh" ? "私密支持聊天" : "Private support chat"}</h2><small>{lang === "zh" ? "仅发送者与主持团队可见" : "Visible to sender and host team only"}</small></header><ClassPrivateChat code={room.code} tabId={roomTabId} locale={lang} supportAgent={manager} reportError={setError}/></section>}
        <ClassRoomResources code={room.code} lang={lang} manager={manager} roomTabId={roomTabId} selfStreaming={false} panel={resourcePanel} onClose={()=>setResourcePanel(null)} onLocalNoteBusyChange={setResourceBusy}/>
      </>
    );
  return (
    <>
      {managerPanel}
      {waitingPlaylist}
      <MediaActivityGuard
        active={joined && localPublisherStarted}
        mode={room.streamingMode}
        room={client}
        locale={lang}
        confirmStillAlone={confirmStillAlone}
        onExpire={() => void leave()}
      />
      <LoneParticipantGuard
        active={joined && room.realtimeMode !== "livestream" && !hasAudience}
        locale={lang}
        confirmStillAlone={confirmStillAlone}
        onExpire={() => void leave()}
      />
      <RealtimeKitProvider value={client}>
        <ConnectedRoom
          client={client}
          room={room}
          identity={identity}
          manager={manager}
          displayName={displayName}
          role={role}
          mic={mic}
          camera={camera}
          micLive={localTrackHealth.audio}
          cameraLive={localTrackHealth.video}
          lang={lang}
          onMedia={changeMedia}
          onLeave={() => void leave()}
          onlineCount={onlineCount}
          presenceEvents={presenceEvents}
          roomTabId={roomTabId}
          onlineMembers={onlineMembers}
          speakerEnabled={speakerEnabled}
          onSpeakerEnabled={setSpeakerEnabled}
          resourcePanel={resourcePanel}
          onResourcePanelChange={setResourcePanel}
        />
      </RealtimeKitProvider>
      <ClassRoomResources code={room.code} lang={lang} manager={manager} roomTabId={roomTabId} selfStreaming={mic||camera} panel={resourcePanel} onClose={()=>setResourcePanel(null)} onLocalNoteBusyChange={setResourceBusy}/>
    </>
  );
}
