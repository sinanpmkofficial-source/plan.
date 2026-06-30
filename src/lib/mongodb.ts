import { MongoClient } from 'mongodb';

let memo: Promise<MongoClient> | null = null;

function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return Promise.reject(new Error('Please add your Mongo URI to .env.local'));
  }
  if (memo) return memo;

  if (process.env.NODE_ENV === 'development') {
    // Preserve the client across HMR module reloads in development.
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = new MongoClient(uri).connect();
    }
    memo = globalWithMongo._mongoClientPromise;
  } else {
    memo = new MongoClient(uri).connect();
  }
  return memo;
}

/**
 * Lazy thenable: importing this module never throws or opens a connection.
 * The client is created on first `await` (i.e. when a DB route actually runs a
 * query), so `next build` page-data collection succeeds even when MONGODB_URI
 * is unset at build time. A missing URI only rejects at request time.
 */
const clientPromise: PromiseLike<MongoClient> = {
  then(onfulfilled, onrejected) {
    return getClient().then(onfulfilled, onrejected);
  },
};

export default clientPromise;
