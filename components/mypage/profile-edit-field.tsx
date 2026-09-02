import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

type ProfileEditFieldProps = {
  label: string
  htmlFor?: string
  children: ReactNode
}

export function ProfileEditField({ label, htmlFor, children }: ProfileEditFieldProps) {
  return (
    <div className="flex items-start gap-6 py-3">
      <Label
        htmlFor={htmlFor}
        className="w-21.5 shrink-0 text-label-small! font-bold! text-muted-foreground"
      >
        {label}
      </Label>

      {children}
    </div>
  )
}
