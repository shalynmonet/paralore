import { z } from "zod";
const fields = {
  name: z.string().trim().min(1).max(60),
  residents: z.number().int().min(1).max(20),
  baselineEarnedIncome: z.number().min(0).max(1_000_000),
  baselineCosts: z.number().min(0).max(1_000_000),
  baselineHours: z.number().min(0).max(100),
  context: z.string().trim().max(300).default(""),
};
const validHours = (profile: { baselineEarnedIncome: number; baselineHours: number }) => profile.baselineHours > 0 || profile.baselineEarnedIncome === 0;
const hoursMessage = { message: "Enter paid hours for earned income, or set earned income to zero.", path: ["baselineHours"] };
export const HouseholdInputSchema = z.object(fields).refine(validHours, hoursMessage);
export const HouseholdProfileSchema = z.object({ id: z.string().min(1).max(100), ...fields }).refine(validHours, hoursMessage);
export type HouseholdInput = z.infer<typeof HouseholdInputSchema>;
export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;
