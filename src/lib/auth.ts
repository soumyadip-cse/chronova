import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { generateId } from '@/lib/utils';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user[0] || !user[0].passwordHash) {
          throw new Error('Invalid credentials');
        }

        const isValid = await compare(credentials.password, user[0].passwordHash);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user[0].id,
          email: user[0].email,
          role: user[0].role,
          timezone: user[0].timezone,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.me.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email!))
          .limit(1);

        if (!existingUser[0]) {
          const newUserId = generateId();
          await db.insert(users).values({
            id: newUserId,
            email: user.email!,
            role: 'professional',
            timezone: 'UTC',
            emailVerified: new Date(),
          });

          await db.insert(userProfiles).values({
            userId: newUserId,
            displayName: user.name,
            onboardingCompleted: false,
            notificationPrefs: {
              email: true,
              push: true,
              dailySummary: true,
              weeklyReflection: true,
              burnoutAlerts: true,
            },
            workingHours: { start: '09:00', end: '17:00' },
            peakEnergy: 'morning',
          });

          user.id = newUserId;
        } else {
          user.id = existingUser[0].id;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.timezone = (user as any).timezone;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).timezone = token.timezone;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module 'next-auth' {
  interface User {
    role?: string;
    timezone?: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      timezone: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    timezone: string;
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
  }
}
