type CookieValue = { name: string; value: string }

export function serializeCookies(cookies: CookieValue[]): string {
  return cookies.map(({ name, value }) => `${name}=${value}`).join('; ')
}

export function parseCookieHeader(cookieHeader: string): CookieValue[] {
  return cookieHeader.split(';').flatMap((part) => {
    const [name, ...rest] = part.trim().split('=')
    return name ? [{ name, value: rest.join('=') }] : []
  })
}
