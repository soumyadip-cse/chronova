import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Sign Up — Chronova',
  description: 'Create your Chronova account.',
};

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <SignupForm googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)} />
    </main>
  );
}
