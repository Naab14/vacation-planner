'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Fel e-post eller lösenord.' };
    }
    throw error; // NEXT_REDIRECT on success must propagate
  }
}
