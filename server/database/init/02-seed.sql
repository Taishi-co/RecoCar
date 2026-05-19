BEGIN;

INSERT INTO platform_settings (id, commission_rate, created_at, updated_at)
VALUES ('default', 5, now(), now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
