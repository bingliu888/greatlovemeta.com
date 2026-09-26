export type SpeakerPlaybackState = "off" | "blocked" | "waiting" | "connecting" | "on";

export function speakerPlaybackState({
  enabled,
  blocked,
  confirmed,
  audioOnly,
  interactionMode,
  joined,
  hasOtherParticipant,
}: {
  enabled: boolean;
  blocked: boolean;
  confirmed: boolean;
  audioOnly: boolean;
  interactionMode: "group_call" | "webinar" | "livestream";
  joined: boolean;
  hasOtherParticipant: boolean;
}): SpeakerPlaybackState {
  if (!enabled) return "off";
  if (blocked) return "blocked";
  if (confirmed) return "on";
  if (audioOnly && interactionMode === "group_call" && joined && !hasOtherParticipant)
    return "waiting";
  return "connecting";
}

export function speakerControlAppearance(state: SpeakerPlaybackState) {
  return {
    green: state === "on",
    orange: state === "waiting" || state === "connecting",
    pressed: state === "on" || state === "waiting" || state === "connecting",
  };
}
