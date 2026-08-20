// このファイルはサーバーサイドで動作させるため、process.env を使用している。
/** サーバー側の Dify 設定または MOCK_MODE が有効なときだけチャットを表示する。 */
export function isChatEnabled() {
  if (process.env.MOCK_MODE === 'true') return true
  return Boolean(process.env.DIFY_API_BASE_URL && process.env.DIFY_API_KEY)
}
