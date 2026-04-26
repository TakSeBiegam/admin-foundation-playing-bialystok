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
  mutation SignIn($identifier: String!, $password: String!) {
    signIn(input: { identifier: $identifier, password: $password }) {
      user {
        id
        email
        username
        role
      }
    }
  }
`;

type LatestUserIdentity = {
  id: string;
  role: string;
};

async function fetchLatestUserIdentity(params: {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (params.userId) {
    headers["X-User-Id"] = params.userId;
  }
  if (params.email) {
    headers["X-User-Email"] = params.email;
  }
  if (params.name) {
    headers["X-User-Name"] = params.name;
  }

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: `query { me { id role } }` }),
    cache: "no-store",
  });

  const json = await res.json();
  if (json.errors || !json.data?.me?.id || !json.data?.me?.role) {
    return null;
  }

  return json.data.me as LatestUserIdentity;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email lub nazwa użytkownika", type: "text" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: SIGN_IN_MUTATION,
              variables: {
                identifier: credentials.identifier,
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

      if (token.id || token.email || token.name) {
        try {
          const latestIdentity = await fetchLatestUserIdentity({
            userId: token.id ? String(token.id) : null,
            email: typeof token.email === "string" ? token.email : null,
            name: typeof token.name === "string" ? token.name : null,
          });
          if (latestIdentity) {
            token.id = latestIdentity.id;
            token.role = latestIdentity.role;
          }
        } catch {
          // ignore - keep existing token role
        }
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
