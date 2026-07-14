import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Only enable providers that have credentials configured.
 * This lets the site boot cleanly even before you set up OAuth apps.
 */
const providers = [];

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

// Dev-only email-only credentials provider so the account flow can be
// tested without setting up any OAuth app.
if (isDev) {
  providers.push(
    Credentials({
      id: "dev-email",
      name: "Dev email (no password)",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
      },
      authorize: async (creds) => {
        const email = (creds?.email as string | undefined)?.trim().toLowerCase();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) return null;
        return {
          id: email,
          email,
          name: email.split("@")[0],
        };
      },
    }),
  );
}

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
    async session({ session, token }) {
      if (session.user && token?.email) {
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  trustHost: true,
});
