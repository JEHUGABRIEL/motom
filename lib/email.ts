
export type EmailResult = { sent: boolean; error?: string };

async function sendEmail(opts: {
  to: string;
  subject: string;
  title: string;
  subtitle: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
  /** Secret à recopier (mot de passe temporaire, code de vérification). */
  code?: string;
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
            ${
              opts.code
                ? `<p style="margin:0 0 24px;padding:16px;border:1px solid #FFC20E33;border-radius:10px;background:#00000033;font-family:Consolas,Menlo,monospace;font-size:22px;letter-spacing:0.14em;text-align:center;color:#FFC20E">${opts.code}</p>`
                : ""
            }
            ${
              opts.buttonUrl && opts.buttonText
                ? `<a href="${opts.buttonUrl}" style="display:inline-block;background:#FFC20E;color:#141414;font-weight:bold;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:14px">${opts.buttonText}</a>`
                : ""
            }
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

export async function sendTemporaryPasswordEmail(opts: {
  to: string;
  tempPassword: string;
  expiresAt: Date;
  loginUrl: string;
}): Promise<EmailResult> {
  const expires = opts.expiresAt.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  return sendEmail({
    to: opts.to,
    subject: "Mot de passe temporaire — Back-office MOTOM",
    title: "MOTOM",
    subtitle: "Réinitialisation de votre accès",
    body: "Le super administrateur a réinitialisé votre mot de passe. Utilisez le mot de passe temporaire ci-dessous pour vous connecter : il vous sera demandé de le remplacer immédiatement, puis de valider un code reçu par email.",
    code: opts.tempPassword,
    buttonText: "Ouvrir le back-office",
    buttonUrl: opts.loginUrl,
    footer: `Ce mot de passe temporaire est valable jusqu'au ${expires} et ne fonctionne qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande, prévenez le super administrateur.`,
  });
}

export async function sendLoginOtpEmail(opts: {
  to: string;
  code: string;
  minutes: number;
}): Promise<EmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "Code de vérification — Back-office MOTOM",
    title: "MOTOM",
    subtitle: "Vérification de votre nouvelle connexion",
    body: "Votre mot de passe vient d'être modifié. Saisissez ce code dans le back-office pour terminer la connexion :",
    code: opts.code,
    footer: `Ce code est valable ${opts.minutes} minutes et ne peut être utilisé qu'une fois. Si vous n'êtes pas à l'origine de ce changement, contactez immédiatement le super administrateur.`,
  });
}
