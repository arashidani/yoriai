import Image from 'next/image'
import qaCover from '@/assets/qa-cover.svg'

/** なんでもQ&A一覧の上部カバー。装飾画像のため alt は空。 */
export function QaCover() {
  return (
    <div className="w-full overflow-hidden">
      <Image
        src={qaCover}
        alt=""
        className="h-auto w-full object-cover object-center"
        style={{ height: 'auto' }}
        loading="eager"
        preload
        sizes="100vw"
      />
    </div>
  )
}
