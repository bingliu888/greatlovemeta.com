import { createId, getDatabase } from "./auth";

export const database = getDatabase;
export { createId };
export const nowSeconds = () => Math.floor(Date.now() / 1000);
