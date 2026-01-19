import { z } from "zod/v4";

export const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  major: z.string().min(1),
  second_major: z.string().optional(),
  quote: z.string().optional(),
  achievements: z.string().optional(),
  email: z.string().max(16).email(),
});
