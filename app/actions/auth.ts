'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error: string } | { success: string } | null;

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Preencha email e senha.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nome = String(formData.get('nome') ?? '').trim();

  if (!email || !password || !nome) {
    return { error: 'Preencha nome, email e senha.' };
  }

  if (password.length < 8) {
    return { error: 'A senha precisa ter ao menos 8 caracteres.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nome } },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: 'Conta criada! Verifique seu email para confirmar o cadastro.' };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

function translateAuthError(message: string): string {
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Email ou senha incorretos.';
  }
  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Confirme seu email antes de entrar.';
  }
  if (message.toLowerCase().includes('user already registered')) {
    return 'Este email já está cadastrado.';
  }
  return message;
}
