CREATE TABLE IF NOT EXISTS monitor_info (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO monitor_info (name)
SELECT 'Java application availability monitoring'
WHERE NOT EXISTS (SELECT 1 FROM monitor_info);
