import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In — Chronova',
  description: 'Sign in to your Chronova account.',
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <LoginForm googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)} />
    </main>
  );
}
