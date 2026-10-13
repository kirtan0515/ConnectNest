import type {
  CustomMessageTriggerEvent,
  CustomMessageTriggerHandler,
} from "aws-lambda";

/**
 * Cognito Custom Message trigger — replaces the default plain-text verification
 * / password-reset emails with branded ConnectNest HTML delivered through
 * Amazon SES (sender configured on the user pool via UserPoolEmail.withSES).
 *
 * The handler is a pure function of the event: no AWS calls, no I/O, no table
 * access, no secrets. It only mutates and returns event.response.
 */

// ConnectNest brand tokens.
const BG = "#0d2a2c"; // pine-teal page background
const PANEL = "#12383a"; // card panel
const CORAL = "#ff9f68"; // coral accent (code box border)
const DARK_ON_CORAL = "#0d2a2c"; // dark text on coral
const MUTED = "#c3d9d4"; // muted body / footer text
// Web-safe font stack only — NO webfonts / @import in email HTML.
const FONT = "Arial, Helvetica, sans-serif";
const LOGO_URL = "https://d30cmcivj0015i.cloudfront.net/connectnest-logo.png";

interface EmailParts {
  heading: string;
  intro: string;
  code: string;
  footerNote: string;
}

/**
 * Returns the full inline-styled HTML email. All CSS is inline — no <style>
 * block and no webfonts — for maximum email-client compatibility.
 */
function renderEmail({ heading, intro, code, footerNote }: EmailParts): string {
  return [
    `<div style="margin:0;padding:0;background-color:${BG};">`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG};margin:0;padding:0;">`,
    `<tr><td align="center" style="padding:32px 16px;">`,
    `<table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:480px;background-color:${PANEL};border-radius:16px;">`,
    `<tr><td align="center" style="padding:32px 32px 8px 32px;">`,
    `<img src="${LOGO_URL}" width="160" alt="ConnectNest" style="display:block;border:0;outline:none;text-decoration:none;max-width:160px;height:auto;" />`,
    `</td></tr>`,
    `<tr><td style="padding:16px 32px 0 32px;">`,
    `<h1 style="margin:0;font-family:${FONT};font-size:24px;line-height:1.3;color:#ffffff;text-align:center;">${heading}</h1>`,
    `</td></tr>`,
    `<tr><td style="padding:12px 32px 0 32px;">`,
    `<p style="margin:0;font-family:${FONT};font-size:15px;line-height:1.5;color:${MUTED};text-align:center;">${intro}</p>`,
    `</td></tr>`,
    `<tr><td align="center" style="padding:24px 32px 0 32px;">`,
    `<div style="display:inline-block;padding:16px 28px;border:2px solid ${CORAL};border-radius:12px;background-color:${BG};font-family:${FONT};font-size:32px;font-weight:bold;letter-spacing:8px;color:#ffffff;">${code}</div>`,
    `</td></tr>`,
    `<tr><td style="padding:28px 32px 32px 32px;">`,
    `<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};text-align:center;">${footerNote}</p>`,
    `<p style="margin:12px 0 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};text-align:center;">&mdash; ConnectNest</p>`,
    `</td></tr>`,
    `</table>`,
    `</td></tr>`,
    `</table>`,
    `</div>`,
  ].join("");
}

const FOOTER_NOTE =
  "If you didn't request this, you can safely ignore this email.";
// Dark text on coral is reserved for coral-filled surfaces; referenced here to
// document the brand token even though the code box uses a coral border.
void DARK_ON_CORAL;

export const handler: CustomMessageTriggerHandler = async (
  event: CustomMessageTriggerEvent
) => {
  // The literal {####} placeholder Cognito substitutes with the real code.
  const code = event.request.codeParameter;

  switch (event.triggerSource) {
    case "CustomMessage_SignUp":
    case "CustomMessage_ResendCode": {
      event.response.emailSubject = "Verify your ConnectNest account";
      event.response.emailMessage = renderEmail({
        heading: "Verify your account",
        intro:
          "Welcome to ConnectNest. Use the code below to verify your account and get started.",
        code,
        footerNote: FOOTER_NOTE,
      });
      break;
    }
    case "CustomMessage_ForgotPassword": {
      event.response.emailSubject = "Reset your ConnectNest password";
      event.response.emailMessage = renderEmail({
        heading: "Reset your password",
        intro:
          "We received a request to reset your ConnectNest password. Use the code below to continue.",
        code,
        footerNote: FOOTER_NOTE,
      });
      break;
    }
    default:
      // Any other trigger source (AdminCreateUser, Authentication, attribute
      // verification/update, etc.) is left untouched.
      return event;
  }

  return event;
};
