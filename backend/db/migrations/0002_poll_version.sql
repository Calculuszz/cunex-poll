-- Optimistic concurrency for draft saves: PUT /polls/:id sends If-Match: <version>.
ALTER TABLE polls ADD COLUMN version integer NOT NULL DEFAULT 1 CHECK (version >= 1);
