import mongoose from "mongoose";
import { env } from "./config/env.js";

mongoose.set("strictQuery", true);

export async function connectDb() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000, maxPoolSize: 10 });
  console.info(`[db] connected to ${mongoose.connection.name}`);
}

export const disconnectDb = () => mongoose.disconnect();
