ALTER TABLE wa_inbound_events ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'processing';
ALTER TABLE wa_inbound_events ADD COLUMN error_message TEXT;
ALTER TABLE wa_inbound_events ADD COLUMN delivered_at TEXT;
ALTER TABLE wa_inbound_events ADD COLUMN updated_at TEXT;

UPDATE wa_inbound_events
SET processing_status = 'completed',
    delivered_at = COALESCE(delivered_at, created_at),
    updated_at = COALESCE(updated_at, created_at)
WHERE processing_status IS NULL OR processing_status = 'processing';
