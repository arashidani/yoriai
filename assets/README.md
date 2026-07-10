# assets/

`import` して使う画像アセット（ロゴ・アイコン・イラスト等）を置く。

## 使い方

```tsx
import Image from 'next/image'
import logo from '@/assets/logo.svg'

<Image src={logo} alt="Yoriai" priority />
```

- バンドラ経由で読み込まれ、内容ハッシュによるキャッシュバスティングが自動で効く
- `next/image` に渡すと width/height が自動推論され、CLS を防げる
- ファイルの移動・削除漏れはビルドエラーで検知できる

## 使い分け

- **URL 文字列で参照したいファイル**（外部から固定 URL で取得、CSS `background`、`robots.txt` 等）→ `public/`
- **favicon / OGP** → `app/` のファイル規約（`app/icon.svg`, `app/opengraph-image.*` 等）
- **SVG を React コンポーネントとして import し、CSS で色を切り替えたい**場合は SVGR（`@svgr/webpack`）の設定が別途必要
