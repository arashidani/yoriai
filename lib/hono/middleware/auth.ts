import { createServerClient } from '@supabase/ssr';
import { createMiddleware } from 'hono/factory';
import type { User } from '@/app/generated/prisma/client';
import { MOCK_USERS } from '@/lib/mocks/fixtures';
import { prisma } from '@/lib/prisma/client';

type Variables = {
  user: User | (typeof MOCK_USERS)[number];
};

export const authMiddleware = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  if (process.env.MOCK_MODE === 'true') {
    c.set('user', MOCK_USERS[0]);
    return next();
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookie = c.req.header('cookie') ?? '';
          return cookie.split(';').flatMap((c) => {
            const [name, ...rest] = c.trim().split('=');
            if (!name) return [];
            return [{ name: name.trim(), value: rest.join('=') }];
          });
        },
        setAll() {},
      },
    },
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);

  const user = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });
  if (!user) return c.json({ error: 'User not found' }, 401);

  c.set('user', user);
  return next();
});
