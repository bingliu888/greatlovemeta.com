type PresentUser = { identity: string };

// One successful presence snapshot must include the caller before an idle exit.
export function loneClassParticipantConfirmed(
  users: ReadonlyArray<PresentUser> | null,
  identity: string,
): boolean {
  return Boolean(identity && users?.length === 1 && users[0]?.identity === identity);
}
