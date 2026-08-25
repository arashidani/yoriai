import { after } from 'next/server'

export const scheduleAfterResponse = (task: () => void | Promise<void>) => {
  after(task)
}
