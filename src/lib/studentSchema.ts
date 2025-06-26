import { z } from "zod/v4";

export const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  major: z.string().min(1),
  quote: z.string().max(300).optional(),
  email: z.string().max(16).email(),
});
