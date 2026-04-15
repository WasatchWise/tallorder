'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string } | null;
  reset: () => void;
}) {
  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid #E7E5E4', padding: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1C1917', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#78716C', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              We have been notified and are looking into it.
            </p>
            <button
              onClick={reset}
              style={{ width: '100%', backgroundColor: '#D97706', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: 600, cursor: 'pointer', marginBottom: '0.75rem', fontSize: '0.875rem' }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{ display: 'block', width: '100%', backgroundColor: '#E7E5E4', color: '#1C1917', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
