/**
 * Client-side attribution capture and GA4 event helpers.
 *
 * Reads UTM parameters, referrer, and landing page from the current browser
 * context.  Intended to be called once on page load (for the landing page)
 * and again at submission time (for the current referrer/URL).
 */

export interface AttributionData {
  referrer: string;
  landing_page: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

const UTM_KEYS: (keyof AttributionData)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

/**
 * Capture the current attribution snapshot from the browser.
 * Safe to call server-side — returns empty strings.
 */
export function captureAttribution(): AttributionData {
  if (typeof window === "undefined") {
    return {
      referrer: "",
      landing_page: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_term: "",
      utm_content: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const result: AttributionData = {
    referrer: document.referrer || "",
    landing_page: window.location.href,
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
  };

  for (const key of UTM_KEYS) {
    const val = params.get(key);
    if (val) result[key] = val;
  }

  return result;
}

/**
 * Fire a GA4 generate_lead event via GTM's dataLayer.
 *
 * GTM (GTM-TRQQB37) loads GA4 in production; in staging / local dev the
 * dataLayer push is a harmless no-op because GTM never loads.
 */
export function fireGenerateLeadEvent(attribution: AttributionData, source: string): void {
  if (typeof window === "undefined") return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dl = (window as any).dataLayer as Array<Record<string, unknown>> | undefined;
  if (!dl) return;

  dl.push({
    event: "generate_lead",
    lead_source: source,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_term: attribution.utm_term,
    utm_content: attribution.utm_content,
    referrer: attribution.referrer,
    landing_page: attribution.landing_page,
  });
}
