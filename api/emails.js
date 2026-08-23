/**
 * Email templates.
 *
 * Outlook renders HTML with Word, which ignores <style> blocks, flexbox and
 * border-radius, and turns emoji into unreadable glyphs. Everything here is
 * therefore built from nested tables with inline styles and plain text labels,
 * which is what survives across Gmail, Outlook and Apple Mail alike.
 */

const NAVY = '#001e40';
const TEAL = '#1facb6';
const INK = '#1c1b1b';
const MUTED = '#6b7280';
const LINE = '#e3e6ec';
const PAGE = '#f4f6f8';

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif";

const escape = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * A label/value table. Values are already-escaped HTML so a row can hold a link.
 */
function detailRows(rows) {
  return rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${LINE};font-family:${FONT};">
            <div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTED};font-weight:700;padding-bottom:4px;">${escape(
              label,
            )}</div>
            <div style="font-size:15px;color:${INK};line-height:1.5;">${value}</div>
          </td>
        </tr>`,
    )
    .join('');
}

/** A button that still renders as a button in Outlook. */
function button(href, text) {
  if (!href) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 6px;">
      <tr>
        <td bgcolor="${NAVY}" style="border-radius:6px;">
          <a href="${escape(href)}" style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escape(
            text,
          )}</a>
        </td>
      </tr>
    </table>`;
}

/** A highlighted line, used for the visit date and the amount paid. */
function highlight(text) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;">
      <tr>
        <td bgcolor="${TEAL}" align="center" style="padding:16px 20px;border-radius:6px;font-family:${FONT};font-size:17px;font-weight:700;color:#ffffff;">${escape(
          text,
        )}</td>
      </tr>
    </table>`;
}

/**
 * Wraps content in the branded shell.
 */
function shell({ title, intro, body, contactEmail, contactPhone }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${PAGE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid ${LINE};border-radius:8px;overflow:hidden;">
          <tr>
            <td bgcolor="${NAVY}" style="padding:30px;font-family:${FONT};">
              <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#7df4ff;font-weight:700;">Pacific Duct Systems</div>
              <div style="font-size:24px;font-weight:700;color:#ffffff;padding-top:8px;line-height:1.3;">${escape(
                title,
              )}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;font-family:${FONT};font-size:15px;color:${INK};line-height:1.6;">
              ${intro ? `<p style="margin:0 0 20px;">${intro}</p>` : ''}
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 30px;border-top:1px solid ${LINE};font-family:${FONT};font-size:13px;color:${MUTED};line-height:1.6;">
              <strong style="color:${INK};">Pacific Duct Systems</strong><br>
              <a href="mailto:${escape(contactEmail)}" style="color:${MUTED};">${escape(
                contactEmail,
              )}</a>${
                contactPhone
                  ? ` &nbsp;|&nbsp; <a href="tel:${escape(
                      contactPhone.replace(/[^\d+]/g, ''),
                    )}" style="color:${MUTED};">${escape(contactPhone)}</a>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { escape, detailRows, button, highlight, shell };
