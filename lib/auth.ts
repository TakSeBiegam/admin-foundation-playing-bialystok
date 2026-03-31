import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function normalizeBackendUrl(rawUrl: string) {
  return rawUrl.endsWith("/query")
    ? rawUrl
    : `${rawUrl.replace(/\/$/, "")}/query`;
}

const BACKEND_URL = normalizeBackendUrl(
  process.env.BACKEND_URL ?? "http://localhost:8080/query",
);

const SIGN_IN_MUTATION = `
  mutation SignIn($email: String!, $password: String!) {
    signIn(input: { email: $email, password: $password }) {
      user {
        id
        email
        username
        role
      }
    }
  }
`;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: SIGN_IN_MUTATION,
              variables: {
                email: credentials.email,
                password: credentials.password,
              },
            }),
          });

          const json = await res.json();
          if (json.errors || !json.data?.signIn?.user) return null;

          const user = json.data.signIn.user;
          return {
            id: user.id,
            email: user.email ?? "",
            name: user.username ?? user.email ?? "",
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "EDITOR";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
