// Fire-and-forget email alert through Web3Forms (https://web3forms.com).
// Web3Forms only accepts calls from the visitor's browser on the free plan, so this runs
// client-side after the site's own API has accepted the submission. The access key is public by design.
// No-op when NEXT_PUBLIC_WEB3FORMS_KEY is not set (also the case under node --test).
// Never throws and never delays or fails the visitor's submission.

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

/**
 * @param {string} subject email subject (single line)
 * @param {Record<string, unknown>} fields label → value; empty values are skipped
 */
export function sendWeb3Alert(subject, fields) {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
  if (!accessKey || typeof globalThis.fetch !== "function") return;
  try {
    const body = { access_key: accessKey, subject: String(subject).replace(/[\r\n]+/g, " ").slice(0, 200) };
    for (const [label, value] of Object.entries(fields ?? {})) {
      const text = Array.isArray(value) ? value.join(", ") : String(value ?? "").trim();
      if (text !== "") body[label] = text.slice(0, 1000);
    }
    globalThis
      .fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      })
      .catch(() => {});
  } catch {
    // ignore: the alert is best-effort
  }
}
