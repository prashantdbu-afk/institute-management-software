import "server-only"

export function getAppUrl(requestUrl?: string) {
  const configuredUrl = process.env.APP_URL

  if (configuredUrl) return configuredUrl.replace(/\/$/, "")

  if (process.env.NODE_ENV === "development" && requestUrl) return new URL(requestUrl).origin

  throw new Error("APP_URL is required outside development")
}
