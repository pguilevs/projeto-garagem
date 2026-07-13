import mongoose from "mongoose";

type MongoCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongo = globalThis as typeof globalThis & {
  __mongoCache?: MongoCache;
};

const cache = globalWithMongo.__mongoCache ?? {
  conn: null,
  promise: null,
};

globalWithMongo.__mongoCache = cache;

export async function connectMongo() {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Variavel de ambiente MONGODB_URI nao configurada.");
  }

  cache.promise ??= mongoose
    .connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    })
    .catch((error) => {
      cache.promise = null;
      throw new Error(`Falha ao conectar ao MongoDB Atlas: ${error.message}`);
    });

  cache.conn = await cache.promise;
  return cache.conn;
}

