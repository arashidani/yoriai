import { cache } from 'react';
import { MOCK_USERS } from '@/lib/mocks/fixtures';
import { prisma } from '@/lib/prisma/client';
import { createClient } from '@/lib/supabase/server';

export const getCurrentUser = cache(async () => {
  if (process.env.MOCK_MODE === 'true') {
    return MOCK_USERS[0];
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  return prisma.user.findUnique({ where: { supabaseId: authUser.id } });
});
