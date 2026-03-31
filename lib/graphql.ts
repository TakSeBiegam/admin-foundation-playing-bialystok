const GRAPHQL_PROXY_URL = "/api/graphql";

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(GRAPHQL_PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok || json.errors) {
    const message = json.errors.map((e: { message: string }) => e.message).join(", ");
    throw new Error(message);
  }

  return json.data as T;
}
