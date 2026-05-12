import NextAuth from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

declare module 'next-auth' {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email
        const password = credentials?.password
        if (!email || !password) return null

        const user = await prisma.user.findUnique({
          where: { email: String(email).toLowerCase().trim() },
        })
        if (!user) return null

        const valid = await bcrypt.compare(String(password), user.passwordHash)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) (token as JWT & { id: string }).id = user.id
      return token
    },
    session({ session, token }) {
      const t = token as JWT & { id?: string }
      if (t.id) session.user.id = t.id
      return session
    },
  },
})
