import { useQuery } from '@tanstack/react-query'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Providers } from '@/app/providers'

function QueryValue({ initialValue }: { initialValue: string }) {
  const { data } = useQuery({
    queryKey: ['same-query'],
    queryFn: async () => initialValue,
    initialData: initialValue,
    staleTime: Number.POSITIVE_INFINITY,
  })

  return createElement('span', null, data)
}

function renderWithInitialValue(initialValue: string) {
  return renderToString(createElement(Providers, null, createElement(QueryValue, { initialValue })))
}

describe('Providers', () => {
  it('SSRリクエストごとにQueryClientのキャッシュを分離する', () => {
    expect(renderWithInitialValue('first request')).toContain('first request')
    expect(renderWithInitialValue('second request')).toContain('second request')
  })
})
