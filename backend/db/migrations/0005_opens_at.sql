-- Scheduled opening: the owner may pick when voting starts.
-- Publish still moves the poll to `open` (and lists it), but ballots are
-- refused until opens_at. NULL = voting starts as soon as it is published.
-- opens_at < closes_at is checked on submit (drafts may be half-done) and when
-- closesAt is moved, not by a constraint.
ALTER TABLE polls ADD COLUMN opens_at timestamptz;
