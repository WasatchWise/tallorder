-- Stripe webhook idempotency: deduplicate retried events.
-- Insert before processing; skip on 23505 unique_violation.
CREATE TABLE IF NOT EXISTS stripe_events (
  event_id    text        PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);
