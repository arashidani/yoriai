import Image from 'next/image'
import infoIcon from '@/assets/info-icon.svg'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type FormLabelProps = {
  label?: string
  isRequired?: boolean
  isInfoIcon?: boolean
  id?: string
}

export function FormLabel({ label, isRequired, isInfoIcon, id }: FormLabelProps) {
  return (
    <div className="flex gap-2 items-center">
      <Label htmlFor={id}>
        <p className="text-sm font-bold text-foreground">{label}</p>
      </Label>

      {isInfoIcon && (
        <Tooltip>
          <TooltipTrigger
            render={<button type="button" />}
            className="flex items-center justify-center"
          >
            <Image src={infoIcon} alt="" width={14} height={14} className="my-1" />
          </TooltipTrigger>
          <TooltipContent
            className="bg-sky-500 px-3 py-2 text-white"
            arrowClassName="bg-sky-500 fill-sky-500"
          >
            IBJ歴表示に使用します
          </TooltipContent>
        </Tooltip>
      )}

      {isRequired && (
        <span className="block py-0.5 px-2 bg-destructive rounded-full text-destructive-foreground text-caption-bold">
          必須
        </span>
      )}
    </div>
  )
}
