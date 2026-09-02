const LIST_LINE = /^\s*(?:[-*+]\s|\d+\.\s)/
const BLOCKQUOTE_LINE = /^\s*>/

function isMarkerLine(line: string): boolean {
  return LIST_LINE.test(line) || BLOCKQUOTE_LINE.test(line)
}

/**
 * remark の緩いリスト解釈で、マーカー行の直後1改行が同じ項目に吸収されるのを防ぐ。
 * ブロック境界には空行を入れて表示を安定させる。
 */
export function normalizeMarkdownBodySource(markdown: string): string {
  const lines = markdown.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const previousLine = lines[i - 1]

    if (
      i > 0 &&
      previousLine !== undefined &&
      isMarkerLine(previousLine) &&
      !isMarkerLine(line) &&
      line.trim() !== ''
    ) {
      if (result.at(-1) !== '') {
        result.push('')
      }
    }

    result.push(line)
  }

  return result.join('\n')
}
