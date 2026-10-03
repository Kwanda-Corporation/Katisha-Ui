const REF_KEY = 'vdk_ref';

// A promoter's link is `https://katisha.today/?ref=KT-XXXXXX`. The code has to
// survive the whole booking flow, which can span a reload (payment prompt
// redirect, "continue as guest"), so it is latched in localStorage on arrival
// and only replaced by a different code.
export function captureReferralCode(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('ref');
    const stored = localStorage.getItem(REF_KEY);
    if (fromUrl && fromUrl !== stored) {
      localStorage.setItem(REF_KEY, fromUrl);
      return fromUrl;
    }
    return stored || '';
  } catch {
    return '';
  }
}

export function getReferralCode(): string {
  try {
    return localStorage.getItem(REF_KEY) || '';
  } catch {
    return '';
  }
}

/** Clear after a completed booking so a later order isn't attributed wrongly. */
export function clearReferralCode(): void {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // ignore
  }
}