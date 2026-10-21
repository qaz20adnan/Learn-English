'use server';

import { redirect } from 'next/navigation';
import { loginSchema, registerSchema } from '@/lib/validation';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { endSession, startSession } from '@/lib/auth/session';
import {
  countUsers,
  createUser,
  ensureSettings,
  findUserWithSecret,
  logAudit,
} from '@/lib/db/queries';

export type AuthErrorKey = 'invalidInput' | 'invalidCredentials' | 'emailTaken';

export interface AuthState {
  errorKey?: AuthErrorKey;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { errorKey: 'invalidInput' };
  }

  const record = await findUserWithSecret(parsed.data.email);
  if (!record) {
    return { errorKey: 'invalidCredentials' };
  }

  const valid = await verifyPassword(parsed.data.password, record.passwordHash);
  if (!valid) {
    return { errorKey: 'invalidCredentials' };
  }

  await startSession(record.user.id);
  await logAudit({ actorId: record.user.id, action: 'login', entity: 'user', entityId: record.user.id });
  redirect('/dashboard');
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { errorKey: 'invalidInput' };
  }

  if (await findUserWithSecret(parsed.data.email)) {
    return { errorKey: 'emailTaken' };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  // Bootstrap rule: the very first account becomes the academy administrator.
  const isFirstUser = (await countUsers()) === 0;
  const user = await createUser({
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash,
    role: isFirstUser ? 'ADMIN' : 'STUDENT',
  });
  await ensureSettings(user.id);
  await startSession(user.id);
  await logAudit({
    actorId: user.id,
    action: 'register',
    entity: 'user',
    entityId: user.id,
    detail: isFirstUser ? 'first-user-admin' : null,
  });
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect('/login');
}
