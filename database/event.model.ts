import mongoose, { Schema, Types, Model } from "mongoose";

/**
 * Event domain model (document shape).
 * Strings are trimmed and validated; timestamps enabled.
 */
export interface EventDocument extends mongoose.Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string; // normalized YYYY-MM-DD
  time: string; // normalized HH:mm (24h)
  mode: string; // online | offline | hybrid (free-form but required)
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Simple, safe slugify for URLs:
 * - lowercase
 * - replace non-alphanumeric with hyphens
 * - collapse repeated hyphens
 * - trim leading/trailing hyphens
 */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalize date to YYYY-MM-DD. Accepts typical date strings.
 * Throws on invalid dates to fail fast.
 */
function normalizeDateToISODateOnly(input: string): string {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date value");
  }
  // yyyy-mm-dd
  return parsed.toISOString().split("T")[0]!;
}

/**
 * Normalize time to HH:mm (24h). Accepts "HH:mm", "H:mm", "hh:mm am/pm".
 */
function normalizeTimeTo24h(input: string): string {
  const trimmed = input.trim();
  // Try 24h first
  const match24 = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (match24) {
    const hh = match24[1].padStart(2, "0");
    const mm = match24[2].padStart(2, "0");
    return `${hh}:${mm}`;
  }
  // Try 12h like "9:05 pm" or "09:05PM"
  const match12 = /^(\d{1,2}):([0-5]\d)\s*(am|pm)$/i.exec(trimmed);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const meridiem = match12[3].toLowerCase();
    if (hours === 12) hours = 0;
    if (meridiem === "pm") hours += 12;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  throw new Error("Invalid time format; expected HH:mm (24h) or hh:mm am/pm");
}

/**
 * Common non-empty string validator after trimming.
 */
const requiredNonEmpty = {
  type: String,
  required: true as const,
  trim: true,
  validate: {
    validator: (v: unknown) => typeof v === "string" && v.trim().length > 0,
    message: "Field must be a non-empty string",
  },
};

const eventSchema = new Schema<EventDocument>(
  {
    title: requiredNonEmpty,
    slug: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    description: requiredNonEmpty,
    overview: requiredNonEmpty,
    image: requiredNonEmpty,
    venue: requiredNonEmpty,
    location: requiredNonEmpty,
    date: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    mode: requiredNonEmpty,
    audience: requiredNonEmpty,
    agenda: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: unknown) =>
          Array.isArray(arr) && arr.length > 0 && arr.every((s) => typeof s === "string" && s.trim().length > 0),
        message: "Agenda must be a non-empty array of non-empty strings",
      },
    },
    organizer: requiredNonEmpty,
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: unknown) =>
          Array.isArray(arr) && arr.length > 0 && arr.every((s) => typeof s === "string" && s.trim().length > 0),
        message: "Tags must be a non-empty array of non-empty strings",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index for slug to guarantee URL uniqueness
eventSchema.index({ slug: 1 }, { unique: true, name: "unique_slug" });

/**
 * Pre-save:
 * - Generate slug from title only if title changed.
 * - Normalize date to YYYY-MM-DD.
 * - Normalize time to HH:mm (24h).
 */
eventSchema.pre("save", function (next) {
  try {
    if (this.isModified("title")) {
      this.slug = slugify(this.title);
    }
    if (this.isModified("date")) {
      this.date = normalizeDateToISODateOnly(this.date);
    }
    if (this.isModified("time")) {
      this.time = normalizeTimeTo24h(this.time);
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Avoid model recompilation in dev (HMR)
export const Event: Model<EventDocument> =
  (mongoose.models.Event as Model<EventDocument>) ||
  mongoose.model<EventDocument>("Event", eventSchema);

export default Event;


