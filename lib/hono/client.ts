import { hc } from 'hono/client';
import type { AppType } from './app';

export const client = hc<AppType>('/');
