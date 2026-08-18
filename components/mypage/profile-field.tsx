type ProfileFieldProps = {
  label: string
  value: string | string[]
}

export function ProfileField({ label, value }: ProfileFieldProps) {
  const lines = Array.isArray(value) ? value : [value]

  return (
    <div className="flex items-start gap-6 py-3">
      <p className="w-21.5 shrink-0 text-label-small font-bold text-muted-foreground">{label}</p>

      <div className="flex-1">
        {lines.map((line) => (
          <p key={line} className="text-body-small-bold text-foreground">
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
