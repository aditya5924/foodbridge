CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS organizations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, location TEXT NOT NULL DEFAULT '',
 capacity INTEGER NOT NULL DEFAULT 0, need TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','rejected')),
 lat DOUBLE PRECISION, lng DOUBLE PRECISION, reject_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('donor','organization','volunteer','admin')),
 organization_id UUID REFERENCES organizations(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS donations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), donor_id UUID NOT NULL REFERENCES users(id),
 title TEXT NOT NULL, category TEXT NOT NULL, quantity NUMERIC(12,2) NOT NULL CHECK(quantity>0), unit TEXT NOT NULL,
 prepared_at TIMESTAMPTZ NOT NULL, pickup_start TIMESTAMPTZ NOT NULL, pickup_end TIMESTAMPTZ NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL, storage TEXT NOT NULL DEFAULT '', location TEXT NOT NULL,
 lat DOUBLE PRECISION, lng DOUBLE PRECISION, photo_url TEXT,
 status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','reserved','accepted','collected','delivered','cancelled','expired')),
 safety TEXT NOT NULL DEFAULT 'pending' CHECK(safety IN ('pending','passed','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS reservations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), donation_id UUID NOT NULL REFERENCES donations(id),
 organization_id UUID NOT NULL REFERENCES organizations(id), status TEXT NOT NULL DEFAULT 'reserved'
 CHECK(status IN ('reserved','accepted','declined','collected','delivered','cancelled')),
 decline_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS one_active_reservation ON reservations(donation_id) WHERE status IN ('reserved','accepted','collected','delivered');
CREATE TABLE IF NOT EXISTS pickups (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), donation_id UUID NOT NULL REFERENCES donations(id),
 reservation_id UUID NOT NULL REFERENCES reservations(id), organization_id UUID NOT NULL REFERENCES organizations(id),
 volunteer_id UUID REFERENCES users(id), status TEXT NOT NULL DEFAULT 'open'
 CHECK(status IN ('open','assigned','collected','delivered','cancelled','missed')),
 handover_code_hash TEXT NOT NULL, handover_code_encrypted TEXT NOT NULL, proof_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS one_active_pickup ON pickups(reservation_id) WHERE status NOT IN ('cancelled','missed');
CREATE TABLE IF NOT EXISTS donation_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), donation_id UUID NOT NULL REFERENCES donations(id),
 actor_id UUID REFERENCES users(id), actor_name TEXT NOT NULL, actor_role TEXT NOT NULL,action TEXT NOT NULL,
 status TEXT, notes TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS incidents (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), donation_id UUID NOT NULL REFERENCES donations(id),
 reporter_id UUID NOT NULL REFERENCES users(id), severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')),
 description TEXT NOT NULL,photo_url TEXT,status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved')),
 resolution TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),resolved_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS notifications (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID NOT NULL REFERENCES users(id),
 text TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'update',read BOOLEAN NOT NULL DEFAULT false,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS donor_schedules (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID NOT NULL REFERENCES users(id),
 frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly')),day TEXT,time TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS donation_status_expiry_idx ON donations(status,expires_at);
CREATE INDEX IF NOT EXISTS donation_donor_idx ON donations(donor_id);
CREATE INDEX IF NOT EXISTS events_donation_idx ON donation_events(donation_id,created_at);
CREATE INDEX IF NOT EXISTS notification_user_idx ON notifications(user_id,created_at DESC);
