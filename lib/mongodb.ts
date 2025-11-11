import mongoose, { Mongoose } from "mongoose";

/**
 * Small, typed cache used to avoid opening multiple MongoDB connections
 * during Next.js development where modules are hot-reloaded.
 */
type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

/**
 * Read the MongoDB connection string from env. Intentionally fail fast if it's missing
 * so misconfigurations are caught early in any environment (dev, preview, prod).
 */
const MONGODB_URI: string | undefined = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error(
    "Missing environment variable: MONGODB_URI. Please set it in your .env file."
  );
}

/**
 * Reuse the same cache across hot reloads in development.
 * In production, the module is evaluated once per serverless instance / process,
 * so this behaves like a simple module-level singleton.
 */
const cached: MongooseCache =
  globalThis.__mongooseCache ??
  (globalThis.__mongooseCache = { conn: null, promise: null });

/**
 * Establish (or reuse) a singleton Mongoose connection.
 * - Returns an existing connection if available.
 * - Otherwise, creates a single in-flight promise to connect once.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // bufferCommands=false ensures models fail fast if used before connection is ready
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
      // You can set dbName here if your URI doesn't include it:
      // dbName: process.env.MONGODB_DB,
      // Add more options as needed (e.g., serverSelectionTimeoutMS)
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Optional helper to close the connection in test environments.
 * Not typically used in serverless/edge production.
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

export default connectToDatabase;


