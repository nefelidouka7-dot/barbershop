import { z } from "zod";

const optionalName = z
  .string()
  .trim()
  .refine((v) => v.length === 0 || v.length >= 2, {
    message: "Name is too short",
  });

const optionalEmail = z
  .string()
  .email("Valid email required")
  .optional()
  .or(z.literal(""));

/** Public customer booking — phone required */
export const bookingDetailsSchema = z.object({
  customer_name: optionalName,
  customer_phone: z.string().trim().min(8, "Valid phone required"),
  customer_email: optionalEmail,
});

/** Admin / walk-in — phone optional */
export const adminBookingDetailsSchema = z.object({
  customer_name: optionalName,
  customer_phone: z
    .string()
    .trim()
    .refine((v) => v.length === 0 || v.length >= 8, {
      message: "Valid phone required",
    }),
  customer_email: optionalEmail,
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  duration_minutes: z.coerce.number().int().min(5).max(240),
  price: z.coerce.number().min(0),
  active: z.boolean().default(true),
});

export const workingHoursSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export const timeOffSchema = z.object({
  start_datetime: z.string().min(1),
  end_datetime: z.string().min(1),
  reason: z.string().optional(),
});
