import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

/**
 * Providers that have credentials configured.
 * Email login is always available so storefront accounts work without OAuth apps.
 */
const providers: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  );
}

// Email sign-in / register — creates a JWT session keyed by email (orders match on email).
providers.push(
  Credentials({
    id: "email",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "you@example.com" },
      name: { label: "Name", type: "text", placeholder: "Your name" },
    },
    authorize: async (creds) => {
      const email = (creds?.email as string | undefined)?.trim().toLowerCase();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) return null;
      const nameRaw = (creds?.name as string | undefined)?.trim();
      const name = nameRaw || email.split("@")[0] || "Guest";
      return {
        id: email,
        email,
        name,
      };
    },
  }),
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: { strategy: "jwt" },
  pages: {
    // Route all Auth.js UI to our own pages so its built-in
    // (Preact-rendered) pages are never referenced by the bundler.
    signIn: "/account/signin",
    signOut: "/account/signin",
    error: "/account/signin",
    verifyRequest: "/account/signin",
    newUser: "/account",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token?.email) session.user.email = token.email as string;
        if (token?.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  trustHost: true,
});
