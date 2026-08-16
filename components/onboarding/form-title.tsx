type FormTitleProps = {
  title: string
  description: string
}

export function FormTitle({ title, description }: FormTitleProps) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-heading-1">{title}</h2>
      <p className="text-secondary-foreground">{description}</p>
    </div>
  )
}
