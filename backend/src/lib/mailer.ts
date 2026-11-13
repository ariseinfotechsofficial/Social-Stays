import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

let transport: Transporter | undefined;

function transporter() {
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transport;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type EmailContent = {
  subject: string;
  heading: string;
  intro: string;
  /** Label/value rows shown in a table */
  rows?: [string, string][];
  cta?: { label: string; href: string };
  footer?: string;
};

/** Plain, brand-coloured email that reads well in Gmail on a phone */
function render(c: EmailContent, brand: string) {
  const rows = (c.rows ?? [])
    .map(([k, v]) => `<tr><td style="padding:8px 0;color:#6b6152;font-size:14px;width:42%;vertical-align:top">${esc(k)}</td><td style="padding:8px 0;color:#2A241B;font-size:14px;font-weight:600">${esc(v)}</td></tr>`)
    .join("");
  const cta = c.cta
    ? `<p style="margin:28px 0 0"><a href="${esc(c.cta.href)}" style="display:inline-block;background:#8A6B24;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:600;font-size:15px">${esc(c.cta.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#F6F0E5;font-family:Manrope,Segoe UI,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;padding:32px">
<tr><td>
<p style="margin:0 0 20px;color:#75591B;font-size:13px;letter-spacing:.14em;text-transform:uppercase;font-weight:700">${esc(brand)}</p>
<h1 style="margin:0;color:#2A241B;font-family:Georgia,serif;font-weight:500;font-size:28px;line-height:1.2">${esc(c.heading)}</h1>
<p style="margin:16px 0 0;color:#4a4235;font-size:15px;line-height:1.6">${esc(c.intro)}</p>
${rows ? `<table role="presentation" width="100%" style="margin-top:24px;border-top:1px solid #EDE3D1">${rows}</table>` : ""}
${cta}
${c.footer ? `<p style="margin:28px 0 0;color:#6b6152;font-size:13px;line-height:1.6">${esc(c.footer)}</p>` : ""}
</td></tr></table></td></tr></table></body></html>`;
  const text = [c.heading, "", c.intro, "", ...(c.rows ?? []).map(([k, v]) => `${k}: ${v}`), ...(c.cta ? ["", `${c.cta.label}: ${c.cta.href}`] : []), ...(c.footer ? ["", c.footer] : [])].join("\n");
  return { html, text };
}

/** Sends an email, or logs it when SMTP isn't configured. Never throws: a failed email must not fail a booking. */
export async function sendEmail(to: string, content: EmailContent, brand = "Social Stays") {
  if (!to) return false;
  const { html, text } = render(content, brand);
  if (!env.smtpEnabled) {
    console.info(`[mail] (SMTP not set up) to=${to} subject="${content.subject}"\n${text}`);
    return false;
  }
  try {
    await transporter().sendMail({ from: env.MAIL_FROM, to, subject: content.subject, html, text });
    return true;
  } catch (err) {
    console.warn("[mail] could not send:", (err as Error).message);
    return false;
  }
}
