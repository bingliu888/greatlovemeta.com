// SmartMeeting's room-arrival ticker and deferred publisher-entry contract.
// Site-local D1 queries remain in class-room-member-presence.ts.

export function roomPresenceChanges(
  previous: ReadonlyMap<string, string>,
  next: ReadonlyMap<string, string>,
  firstSequence: number,
  chinese: boolean,
) {
  let sequence = firstSequence;
  const events: { sequence: number; text: string }[] = [];
  for (const [id, name] of next) if (!previous.has(id))
    events.push({ sequence: ++sequence,
      text: chinese ? `${name} 进入了会议室` : `${name} entered the meeting room` });
  for (const [id, name] of previous) if (!next.has(id))
    events.push({ sequence: ++sequence,
      text: chinese ? `${name} 离开了会议室` : `${name} left the meeting room` });
  return events;
}

export function shouldJoinGroupAudioLobby(input: {
  ready: boolean;
  onlineCount: number;
  joined: boolean;
  busy: boolean;
  now: number;
  lastAttemptAt: number;
}) {
  return input.ready && input.onlineCount >= 2 && !input.joined && !input.busy &&
    input.now - input.lastAttemptAt >= 10_000;
}
