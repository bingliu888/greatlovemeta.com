export function smartPayRecordTimestamp(recordTimestamp: number, verificationTimestamp: number) {
  if (!Number.isSafeInteger(recordTimestamp) || recordTimestamp <= 0) return verificationTimestamp;
  return Math.min(recordTimestamp, verificationTimestamp);
}
