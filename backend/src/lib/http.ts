import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Not found") => new HttpError(404, what);
export const badRequest = (message: string, details?: unknown) => new HttpError(400, message, details);
export const forbidden = (message = "You don't have access to this") => new HttpError(403, message);

/** Parses a request body (or query) with a zod schema, throwing a 422 with field errors on failure. */
export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(422, "Please check the highlighted fields", z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, [v.message]]));
    res.status(422).json({ error: "Please check the highlighted fields", details });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: `Invalid value for ${err.path}` });
    return;
  }
  if (typeof err === "object" && err && "code" in err && (err as { code: number }).code === 11000) {
    const keys = Object.keys((err as { keyValue?: object }).keyValue ?? {});
    res.status(409).json({ error: `That ${keys.join(", ") || "value"} is already in use` });
    return;
  }
  if (typeof err === "object" && err && "type" in err && (err as { type: string }).type === "entity.too.large") {
    res.status(413).json({ error: "Request is too large" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side" });
}

/** Page/limit/sort from a query string, with sane bounds. */
export function pagination(query: Request["query"], defaults: { limit?: number; sort?: string } = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(query.limit) || defaults.limit || 25));
  const sort = typeof query.sort === "string" && /^-?[\w.]+$/.test(query.sort) ? query.sort : (defaults.sort ?? "-createdAt");
  return { page, limit, skip: (page - 1) * limit, sort };
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
