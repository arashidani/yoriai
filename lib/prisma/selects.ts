/** Public tag projection. Admin-only description and assignment eligibility must not cross this boundary. */
export const publicTagSelect = {
  id: true,
  name: true,
  createdAt: true,
} as const

/** API レスポンス用の著者情報。email / supabaseId は含めない。 */
export const publicPostAuthorSelect = {
  id: true,
  name: true,
  username: true,
  displayNameColor: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
  lunchPreference: true,
} as const
