import Image from 'next/image'
import type { ComponentProps } from 'react'

import pencil from '@/assets/pencil.png'

export function PencilIcon(props: Omit<ComponentProps<typeof Image>, 'src' | 'alt'>) {
  return <Image src={pencil} alt="" {...props} />
}
