"use server";

export type ContactFormState =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function submitContactAction(
  _prev: ContactFormState | null,
  formData: FormData,
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { ok: false, error: "Please enter your name." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!message || message.length < 10) {
    return {
      ok: false,
      error: "Please write a message of at least 10 characters.",
    };
  }

  // Hook up to email adapter / CRM when ready.
  console.info("[contact]", { name, email, message: message.slice(0, 120) });

  return {
    ok: true,
    message: "Thank you — your message has been received. We'll be in touch shortly.",
  };
}
