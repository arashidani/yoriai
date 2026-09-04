import Image from 'next/image'
import inu from '@/assets/mascots/mascot_xx.svg'
import { ToolChip } from '@/components/design-system/ui/tool-chip'

/** 404表示の本文。ナビゲーションを持つシェルの中に置いて使う。 */
export function NotFoundContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 text-center">
        <p className="text-heading-1 text-muted-foreground">404 Not Found</p>

        <p className="text-body-small font-medium text-muted-foreground">
          URLが変更されたか、ページが削除された可能性があります。
          <br />
          お手数ですが、左のナビゲーションから目的のページをお探しください。
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <ToolChip text="ここどこだワン..." side="bottom" />
        <Image
          src={inu}
          width={181}
          height={196}
          alt="困っているよりあいぬ"
          className="-scale-x-100"
        />
      </div>
    </div>
  )
}
