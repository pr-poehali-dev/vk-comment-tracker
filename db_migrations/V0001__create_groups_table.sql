CREATE TABLE t_p94871206_vk_comment_tracker.groups (
    id SERIAL PRIMARY KEY,
    vk_id BIGINT NOT NULL UNIQUE,
    screen_name VARCHAR(255) NOT NULL,
    name VARCHAR(512) NOT NULL,
    photo_url TEXT,
    members_count INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);