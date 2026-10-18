
export type EmailResult = { sent: boolean; error?: string };

async function sendEmail(opts: {
  to: string;
  subject: string;
  title: string;
  subtitle: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  footer: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY non configurée" };
  }

  const from = process.env.RESEND_FROM || "MOTOM <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#141414;border-radius:16px;padding:32px;color:#ffffff">
            <h1 style="margin:0 0 8px;font-size:22px;color:#FFC20E">MOTOM</h1>
            <p style="margin:0 0 24px;font-size:14px;color:#C9C9C9">${opts.subtitle}</p>
            <p style="font-size:14px;line-height:1.6;margin:0 0 24px">${opts.body}</p>
            <a href="${opts.buttonUrl}" style="display:inline-block;background:#FFC20E;color:#141414;font-weight:bold;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px">
              ${opts.buttonText}
            </a>
            <p style="font-size:12px;color:#C9C9C9;margin-top:24px;line-height:1.5">${opts.footer}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "Erreur Resend" };
  }
}

export async function sendInvitationEmail(opts: {
  to: string;
  inviteUrl: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "Invitation — Back-office MOTOM",
    title: "MOTOM",
    subtitle: "Accès au back-office d'administration",
    body: "Vous avez été invité(e) à rejoindre l'espace d'administration MOTOM. Cliquez sur le bouton ci-dessous pour définir votre nom d'utilisateur et votre mot de passe.",
    buttonText: "Activer mon compte",
    buttonUrl: opts.inviteUrl,
    footer: "Ce lien est valable 7 jours. Si vous n'avez pas demandé cet accès, ignorez cet email.",
  });
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  resetUrl: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "Réinitialisation de mot de passe — Back-office MOTOM",
    title: "MOTOM",
    subtitle: "Réinitialisation de votre mot de passe",
    body: "Une demande de réinitialisation de mot de passe a été faite pour votre compte d'administration MOTOM. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
    buttonText: "Choisir un nouveau mot de passe",
    buttonUrl: opts.resetUrl,
    footer: "Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
  });
}