'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'

export type WeeklyPostDatum = {
  label: string
  questions: number
  hirobaPosts: number
  answers: number
  hirobaAnswers: number
}

const CHART_SERIES = [
  {
    dataKey: 'questions',
    label: 'Q&A投稿',
    fillClass: 'fill-chart-1',
    legendClass: 'bg-chart-1',
    fill: 'var(--color-chart-1)',
  },
  {
    dataKey: 'hirobaPosts',
    label: 'ひろば投稿',
    fillClass: 'fill-chart-2',
    legendClass: 'bg-chart-2',
    fill: 'var(--color-chart-2)',
  },
  {
    dataKey: 'answers',
    label: 'Q&A回答',
    fillClass: 'fill-chart-3',
    legendClass: 'bg-chart-3',
    fill: 'var(--color-chart-3)',
  },
  {
    dataKey: 'hirobaAnswers',
    label: 'ひろば回答',
    fillClass: 'fill-chart-4',
    legendClass: 'bg-chart-4',
    fill: 'var(--color-chart-4)',
  },
] as const

type WeeklyPostsChartProps = {
  data: WeeklyPostDatum[]
}

export function WeeklyPostsChart({ data }: WeeklyPostsChartProps) {
  return (
    <div className="space-y-2">
      <div className="h-54 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, className: 'fill-muted-foreground' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: '0.5rem',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-card-foreground)',
                fontSize: '0.75rem',
              }}
            />
            {CHART_SERIES.map((series, index) => (
              <Bar
                key={series.dataKey}
                dataKey={series.dataKey}
                name={series.label}
                stackId="posts"
                className={series.fillClass}
                fill={series.fill}
                activeBar={{ fill: series.fill, opacity: 0.85 }}
                radius={index === CHART_SERIES.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-foreground">
        {CHART_SERIES.map((series) => (
          <li key={series.dataKey} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', series.legendClass)} aria-hidden />
            {series.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
