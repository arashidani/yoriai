import Image from 'next/image'
import qaCover from '@/assets/qa-cover.svg'

/** なんでもQ&A一覧の上部カバー。装飾画像のため alt は空。 */
export function QaCover() {
  return (
    <div className="sticky top-1.5 z-0 w-full overflow-hidden">
      <Image
        src={qaCover}
        alt=""
        className="h-40 w-full object-cover object-center"
        loading="eager"
        preload
        sizes="100vw"
      />
    </div>
  )
}
