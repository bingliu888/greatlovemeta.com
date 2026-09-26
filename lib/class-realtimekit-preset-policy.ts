export type ClassParticipantRole = "viewer" | "member" | "host";

export type MediaProduction = {
  can_produce?: "ALLOWED" | "NOT_ALLOWED" | "CAN_REQUEST";
};

export type ProviderPermissions = Record<string, unknown> & {
  accept_stage_requests?: boolean;
  accept_waiting_requests?: boolean;
  can_accept_production_requests?: boolean;
  can_change_participant_permissions?: boolean;
  can_livestream?: boolean;
  can_record?: boolean;
  can_spotlight?: boolean;
  disable_participant_audio?: boolean;
  disable_participant_screensharing?: boolean;
  disable_participant_video?: boolean;
  hidden_participant?: boolean;
  kick_participant?: boolean;
  pin_participant?: boolean;
  show_participant_list?: boolean;
  media?: {
    audio?: MediaProduction;
    screenshare?: MediaProduction;
    video?: MediaProduction;
  };
};

export function groupCallPresetName(
  meetingMode: "audio" | "video",
  role: ClassParticipantRole,
) {
  const capabilities =
    role === "viewer" ? "listen" : meetingMode === "video" ? "avs" : "as";
  return `greatlovemeta_gold_group_${meetingMode}_${role}_${capabilities}`;
}

export function securedGroupCallPermissions(
  current: ProviderPermissions | undefined,
  role: ClassParticipantRole,
  meetingMode: "audio" | "video",
): ProviderPermissions {
  const publish = role !== "viewer";
  return {
    ...(current || {}),
    accept_stage_requests: false,
    accept_waiting_requests: false,
    can_accept_production_requests: false,
    can_change_participant_permissions: false,
    can_livestream: false,
    can_record: false,
    can_spotlight: false,
    disable_participant_audio: false,
    disable_participant_screensharing: false,
    disable_participant_video: false,
    hidden_participant: false,
    kick_participant: false,
    pin_participant: false,
    show_participant_list: true,
    media: {
      ...(current?.media || {}),
      audio: {
        ...(current?.media?.audio || {}),
        can_produce: publish ? "ALLOWED" : "NOT_ALLOWED",
      },
      video: {
        ...(current?.media?.video || {}),
        can_produce:
          publish && meetingMode === "video" ? "ALLOWED" : "NOT_ALLOWED",
      },
      screenshare: {
        ...(current?.media?.screenshare || {}),
        can_produce: publish ? "ALLOWED" : "NOT_ALLOWED",
      },
    },
  };
}

export function groupCallPermissionsMatch(
  permissions: ProviderPermissions | undefined,
  role: ClassParticipantRole,
  meetingMode: "audio" | "video",
) {
  if (!permissions) return false;
  const expected = securedGroupCallPermissions(permissions, role, meetingMode);
  return permissions.accept_stage_requests === expected.accept_stage_requests &&
    permissions.accept_waiting_requests === expected.accept_waiting_requests &&
    permissions.can_accept_production_requests === expected.can_accept_production_requests &&
    permissions.can_change_participant_permissions === expected.can_change_participant_permissions &&
    permissions.can_livestream === expected.can_livestream &&
    permissions.can_record === expected.can_record &&
    permissions.can_spotlight === expected.can_spotlight &&
    permissions.disable_participant_audio === expected.disable_participant_audio &&
    permissions.disable_participant_screensharing === expected.disable_participant_screensharing &&
    permissions.disable_participant_video === expected.disable_participant_video &&
    permissions.hidden_participant === expected.hidden_participant &&
    permissions.kick_participant === expected.kick_participant &&
    permissions.pin_participant === expected.pin_participant &&
    permissions.show_participant_list === expected.show_participant_list &&
    permissions.media?.audio?.can_produce === expected.media?.audio?.can_produce &&
    permissions.media?.video?.can_produce === expected.media?.video?.can_produce &&
    permissions.media?.screenshare?.can_produce === expected.media?.screenshare?.can_produce;
}
