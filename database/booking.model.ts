import mongoose, { Schema, Types, Model } from "mongoose";
import { Event } from "./event.model";

export interface BookingDocument extends mongoose.Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailValidator = {
  validator: (v: unknown) =>
    typeof v === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  message: "Invalid email format",
};

const bookingSchema = new Schema<BookingDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: emailValidator,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * Pre-save:
 * - Verify referenced event exists to maintain referential integrity.
 * - Email format is validated by schema validator above.
 */
bookingSchema.pre("save", async function (next) {
  try {
    if (this.isNew || this.isModified("eventId")) {
      const exists = await Event.exists({ _id: this.eventId }).lean();
      if (!exists) {
        throw new Error("Referenced event does not exist");
      }
    }
    next();
  } catch (err) {
    next(err as Error);
  }
});

export const Booking: Model<BookingDocument> =
  (mongoose.models.Booking as Model<BookingDocument>) ||
  mongoose.model<BookingDocument>("Booking", bookingSchema);

export default Booking;


