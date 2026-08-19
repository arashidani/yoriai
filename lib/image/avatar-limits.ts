/** サーバーレス環境（Vercel等）のリクエストボディ上限（~4.5MB）に合わせる */
export const AVATAR_MAX_MB = 4.5
export const AVATAR_MAX_BYTES = AVATAR_MAX_MB * 1024 * 1024
export const AVATAR_TOO_LARGE_MESSAGE = `ファイルサイズが大きすぎます（${AVATAR_MAX_MB}MB以下にしてください）`

/** 保存時・クライアント圧縮時の一辺（px） */
export const AVATAR_SIZE = 512
