import * as Sentry from "@sentry/nextjs";

if (!Sentry.getClient()) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    sendDefaultPii: true,
    enableLogs: true,
    tracesSampleRate: 1.0,
    debug: false,
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development') return null;
      return event;
    },
    ignoreErrors: [
      'ETIMEDOUT',
      'ECONNREFUSED',
      'No signatures found matching the expected signature',
    ],
  });
}
