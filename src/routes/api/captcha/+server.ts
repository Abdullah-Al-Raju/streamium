import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { CaptchaService } from "$lib/server/services/captcha";
import { z } from "zod";

const validateSchema = z.object({
  id: z.string().length(32),
  answer: z.string().min(1).max(10),
});

// Generate a new captcha
export async function GET({ getClientAddress }: RequestEvent) {
  const { id, text } = CaptchaService.generateCaptcha();

  // Return captcha ID and text for client-side rendering
  // The text is only used for rendering the canvas image client-side
  // Validation still happens server-side
  return json({ id, text });
}

// Validate captcha (used during form submission)
export async function POST({ request }: RequestEvent) {
  try {
    const body = await request.json();
    const validation = validateSchema.safeParse(body);

    if (!validation.success) {
      return json({ valid: false, error: "Invalid request" }, { status: 400 });
    }

    const { id, answer } = validation.data;
    const isValid = CaptchaService.validateCaptcha(id, answer);

    return json({ valid: isValid });
  } catch {
    return json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
