export default function HirobaDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-start gap-8">{children}</div>
      </div>
    </div>
  )
}
