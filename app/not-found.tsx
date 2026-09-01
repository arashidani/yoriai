import Image from 'next/image'
import Link from 'next/link'
import mascotXxImage from '@/assets/mascots/mascot_xx.svg'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background-subtle px-6 py-16">
      <section className="w-full max-w-3xl rounded-3xl border border-border-3 bg-surface p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 md:gap-8">
          <Image
            src={mascotXxImage}
            alt="困っているヨリアイのマスコット"
            className="h-auto w-28 md:w-32"
            priority
          />

          <p className="text-heading-1 leading-none font-bold text-primary">
            404 NOT FOUND
          </p>

          <div className="space-y-3">
            <h1 className="text-heading-1 font-bold text-foreground">
              ご指定のページが見つからないワン...
            </h1>
            <p className="text-paragraph text-foreground-alt">
              URLが変更されたか、ページが削除された可能性があるワン。
              <br className="hidden sm:block" />
              お手数だけどトップページから探してほしいワン。
            </p>
          </div>

          <Link href="/" className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'px-6')}>
            トップページへ戻る
          </Link>
        </div>
      </section>
    </main>
  )
}
