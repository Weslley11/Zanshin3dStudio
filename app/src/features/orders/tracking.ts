/** Link público de acompanhamento, no endereço onde o app estiver publicado. */
export function trackingUrl(token: string) {
  return `${window.location.origin}/acompanhar/${token}`
}
