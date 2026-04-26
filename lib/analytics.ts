import { createSign } from "node:crypto";

export type AnalyticsSummary = {
  configured: boolean;
  source: "ga4";
  propertyId?: string;
  totals?: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    averageSessionDurationSeconds: number;
    bounceRate: number;
  };
  topPages?: Array<{
    path: string;
    views: number;
  }>;
  error?: string;
};

type GoogleMetricValue = { value: string };
type GoogleDimensionValue = { value: string };
type GoogleReportRow = {
  dimensionValues?: GoogleDimensionValue[];
  metricValues?: GoogleMetricValue[];
};
type GoogleReportResponse = {
  rows?: GoogleReportRow[];
};
type GoogleApiErrorResponse = {
  error?: {
    message?: string;
  } | string;
};

export type AdvancedAnalyticsOptions = {
  startDate?: string; // 'YYYY-MM-DD' or relative '7daysAgo'
  endDate?: string; // 'YYYY-MM-DD' or 'today'
  topPagesLimit?: number;
  countriesLimit?: number;
  devicesLimit?: number;
  referrersLimit?: number;
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

function normalizePropertyId(value: string) {
  return value.trim().replace(/^properties\//i, "");
}

function normalizePrivateKey(value: string) {
  return value.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function createServiceAccountAssertion(clientEmail: string, privateKey: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: GOOGLE_ANALYTICS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();

  const signature = signer.sign(privateKey).toString("base64url");
  return `${header}.${payload}.${signature}`;
}

async function fetchGoogleAccessToken(clientEmail: string, privateKey: string) {
  const assertion = createServiceAccountAssertion(clientEmail, privateKey);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "Nie udalo sie pobrac tokenu Google Analytics.",
    );
  }

  return payload.access_token;
}

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
) {
  const normalizedPropertyId = normalizePropertyId(propertyId);
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${normalizedPropertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const responseText = await response.text();

    try {
      const payload = JSON.parse(responseText) as GoogleApiErrorResponse;
      const message =
        typeof payload.error === "string"
          ? payload.error
          : payload.error?.message;

      throw new Error(message || responseText);
    } catch {
      throw new Error(responseText);
    }
  }

  return (await response.json()) as GoogleReportResponse;
}

// Simple in-memory cache for analytics responses (per process).
const analyticsCache = new Map<string, { expires: number; value: AdvancedAnalytics }>();
const ANALYTICS_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

function getCache(key: string) {
  const entry = analyticsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    analyticsCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key: string, value: AdvancedAnalytics) {
  analyticsCache.set(key, { expires: Date.now() + ANALYTICS_CACHE_TTL, value });
}

function toNumber(value?: string) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePercentMetric(value: number) {
  return value <= 1 ? value * 100 : value;
}

function normalizeSourceLabel(value?: string) {
  const trimmed = value?.trim();

  if (
    !trimmed ||
    trimmed === "(direct)" ||
    trimmed === "(not set)" ||
    trimmed.toLowerCase() === "direct" ||
    trimmed.toLowerCase() === "unknown"
  ) {
    return "Bezposrednio";
  }

  return trimmed;
}

export async function getAnalyticsSummary(opts?: {
  startDate?: string;
  endDate?: string;
  topPagesLimit?: number;
}): Promise<AnalyticsSummary> {
  const propertyId = normalizePropertyId(
    (process.env.GOOGLE_ANALYTICS_PROPERTY_ID ?? "").trim(),
  );
  const clientEmail = (process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL ?? "").trim();
  const privateKeyRaw = (process.env.GOOGLE_ANALYTICS_PRIVATE_KEY ?? "").trim();

  if (!propertyId || !clientEmail || !privateKeyRaw) {
    return {
      configured: false,
      source: "ga4",
    };
  }

  try {
    const accessToken = await fetchGoogleAccessToken(
      clientEmail,
      normalizePrivateKey(privateKeyRaw),
    );

    const startDate = opts?.startDate ?? "7daysAgo";
    const endDate = opts?.endDate ?? "today";
    const topPagesLimit = Math.max(1, Math.min(50, opts?.topPagesLimit ?? 6));

    const [overview, topPages] = await Promise.all([
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      }),
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        limit: topPagesLimit,
        orderBys: [
          {
            metric: { metricName: "screenPageViews" },
            desc: true,
          },
        ],
      }),
    ]);

    const metricValues = overview.rows?.[0]?.metricValues ?? [];

    return {
      configured: true,
      source: "ga4",
      propertyId,
      totals: {
        activeUsers: toNumber(metricValues[0]?.value),
        sessions: toNumber(metricValues[1]?.value),
        pageViews: toNumber(metricValues[2]?.value),
        averageSessionDurationSeconds: toNumber(metricValues[3]?.value),
        bounceRate: normalizePercentMetric(toNumber(metricValues[4]?.value)),
      },
      topPages: (topPages.rows ?? [])
        .map((row) => ({
          path: row.dimensionValues?.[0]?.value || "/",
          views: toNumber(row.metricValues?.[0]?.value),
        }))
        .filter((item) => item.views > 0),
    };
  } catch (error) {
    return {
      configured: true,
      source: "ga4",
      propertyId,
      error:
        error instanceof Error
          ? error.message
          : "Nie udalo sie pobrac statystyk strony.",
    };
  }
}

export type AdvancedAnalytics = {
  configured: boolean;
  source: "ga4";
  propertyId?: string;
  lastUpdated?: string;
  metrics?: {
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    returningUsersRate: number;
    sessions: number;
    screenPageViews: number;
    averageSessionDuration: number;
    bounceRate: number;
    engagementRate: number;
    engagedSessions: number;
    conversionRate?: number;
  };
  topDevices?: Array<{
    device: string;
    sessions: number;
    percentage: number;
  }>;
  topCountries?: Array<{
    country: string;
    users: number;
    sessions: number;
  }>;
  usersByDay?: Array<{
    date: string;
    activeUsers: number;
    sessions: number;
    pageViews: number;
  }>;
  topDomains?: Array<{
    domain: string;
    referrals: number;
  }>;
  topPages?: Array<{
    path: string;
    views: number;
  }>;
  error?: string;
};

export async function getAdvancedAnalytics(opts?: AdvancedAnalyticsOptions): Promise<AdvancedAnalytics> {
  const propertyId = normalizePropertyId(
    (process.env.GOOGLE_ANALYTICS_PROPERTY_ID ?? "").trim(),
  );
  const clientEmail = (process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL ?? "").trim();
  const privateKeyRaw = (process.env.GOOGLE_ANALYTICS_PRIVATE_KEY ?? "").trim();

  if (!propertyId || !clientEmail || !privateKeyRaw) {
    return {
      configured: false,
      source: "ga4",
    };
  }

  try {
    const accessToken = await fetchGoogleAccessToken(
      clientEmail,
      normalizePrivateKey(privateKeyRaw),
    );

    const startDate = opts?.startDate ?? "7daysAgo";
    const endDate = opts?.endDate ?? "today";
    const topPagesLimit = Math.max(1, Math.min(50, opts?.topPagesLimit ?? 6));
    const countriesLimit = Math.max(1, Math.min(100, opts?.countriesLimit ?? 10));
    const devicesLimit = Math.max(1, Math.min(50, opts?.devicesLimit ?? 10));
    const referrersLimit = Math.max(1, Math.min(50, opts?.referrersLimit ?? 10));

    const cacheKey = `adv:${propertyId}:${startDate}:${endDate}:${topPagesLimit}:${countriesLimit}:${devicesLimit}:${referrersLimit}`;
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const [overview, usersByType, devices, countries, dailyStats, referrers, topPages] =
      await Promise.all([
        runReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: "activeUsers" },
            { name: "newUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" },
            { name: "engagementRate" },
            { name: "engagedSessions" },
          ],
        }),
        runReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "newVsReturning" }],
          metrics: [{ name: "activeUsers" }],
        }),
        runReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "sessions" }],
          orderBys: [
            {
              metric: { metricName: "sessions" },
              desc: true,
            },
          ],
        }),
        runReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }],
          limit: countriesLimit,
          orderBys: [
            {
              metric: { metricName: "activeUsers" },
              desc: true,
            },
          ],
        }),
        runReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "date" }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
          ],
          orderBys: [
            {
              dimension: { dimensionName: "date" },
              desc: true,
            },
          ],
        }),
        runReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "firstUserSource" }],
          metrics: [{ name: "sessions" }],
          limit: referrersLimit,
          orderBys: [
            {
              metric: { metricName: "sessions" },
              desc: true,
            },
          ],
        }),
        runReport(accessToken, propertyId, {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          limit: topPagesLimit,
          orderBys: [
            {
              metric: { metricName: "screenPageViews" },
              desc: true,
            },
          ],
        }),
      ]);

    const metricValues = overview.rows?.[0]?.metricValues ?? [];
    const activeUsers = toNumber(metricValues[0]?.value);
    const totalSessions = toNumber(metricValues[2]?.value);
    const returningUsers = toNumber(
      usersByType.rows
        ?.find(
          (row) =>
            row.dimensionValues?.[0]?.value?.toLowerCase() === "returning",
        )
        ?.metricValues?.[0]?.value,
    );

    const result: AdvancedAnalytics = {
      configured: true,
      source: "ga4",
      propertyId,
      lastUpdated: new Date().toISOString(),
      metrics: {
        activeUsers,
        newUsers: toNumber(metricValues[1]?.value),
        returningUsers,
        returningUsersRate:
          activeUsers > 0
            ? Math.round((returningUsers / activeUsers) * 1000) / 10
            : 0,
        sessions: totalSessions,
        screenPageViews: toNumber(metricValues[3]?.value),
        averageSessionDuration: toNumber(metricValues[4]?.value),
        bounceRate: normalizePercentMetric(toNumber(metricValues[5]?.value)),
        engagementRate: normalizePercentMetric(toNumber(metricValues[6]?.value)),
        engagedSessions: toNumber(metricValues[7]?.value),
      },
      topDevices: (devices.rows ?? []).map((row) => {
        const sessions = toNumber(row.metricValues?.[0]?.value);
        return {
          device: row.dimensionValues?.[0]?.value || "Unknown",
          sessions,
          percentage:
            totalSessions > 0 ? Math.round((sessions / totalSessions) * 1000) / 10 : 0,
        };
      }),
      topCountries: (countries.rows ?? []).map((row) => ({
        country: row.dimensionValues?.[0]?.value || "Unknown",
        users: toNumber(row.metricValues?.[0]?.value),
        sessions: toNumber(row.metricValues?.[1]?.value),
      })),
      usersByDay: (dailyStats.rows ?? []).map((row) => ({
        date: row.dimensionValues?.[0]?.value || "",
        activeUsers: toNumber(row.metricValues?.[0]?.value),
        sessions: toNumber(row.metricValues?.[1]?.value),
        pageViews: toNumber(row.metricValues?.[2]?.value),
      })),
      topDomains: (referrers.rows ?? []).map((row) => ({
        domain: normalizeSourceLabel(row.dimensionValues?.[0]?.value),
        referrals: toNumber(row.metricValues?.[0]?.value),
      })),
      topPages: (topPages.rows ?? []).map((row) => ({
        path: row.dimensionValues?.[0]?.value || "/",
        views: toNumber(row.metricValues?.[0]?.value),
      })),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    return {
      configured: true,
      source: "ga4",
      propertyId,
      error:
        error instanceof Error
          ? error.message
          : "Nie udalo sie pobrac zaawansowanych statystyk.",
    };
  }
}