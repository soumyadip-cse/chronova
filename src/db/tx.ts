import { db } from './index';

export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
  return await db.transaction(callback);
}

export type TransactionClient = typeof db;
