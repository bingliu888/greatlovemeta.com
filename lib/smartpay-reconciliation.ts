const SUBSCRIPTION_MAIN_IDS = new Set([
  "greatlovemeta_membership_monthly",
  "greatlovemeta_membership_annual"
]);

export type SmartPayReconciliationRecord = {
  wallet: string;
  payerId: string;
  refId: string;
  mainId: string;
  secondId: string;
  subscriptionRecorded?: boolean;
};

export function smartPayRecipientMatches(
  record: Pick<SmartPayReconciliationRecord, "payerId" | "refId">,
  payerId: string,
  productOwnerRefId: string
) {
  const payer = payerId.trim().toUpperCase();
  const owner = productOwnerRefId.trim().toUpperCase();
  return Boolean(payer && owner)
    && record.payerId.trim().toUpperCase() === payer
    && record.refId.trim().toUpperCase() === owner;
}

export function smartPayTransactionNeedsReconciliation(
  record: SmartPayReconciliationRecord,
  payerId: string,
  productOwnerRefId: string
) {
  return smartPayRecipientMatches(record, payerId, productOwnerRefId)
    && record.secondId === ""
    && SUBSCRIPTION_MAIN_IDS.has(record.mainId)
    && !record.subscriptionRecorded;
}
