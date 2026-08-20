import Image from 'next/image'
import type { ComponentProps } from 'react'

import closeButton from '@/assets/close_button.svg'

export function CloseIcon(props: Omit<ComponentProps<typeof Image>, 'src' | 'alt'>) {
  return <Image src={closeButton} alt="" width={36} height={36} {...props} />
}
