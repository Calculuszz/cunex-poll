-- Images are referenced by their public URL instead of a row in `images`.
-- Flow: POST /images/uploads → { uploadUrl, publicUrl } → the browser PUTs the
-- file straight to S3 → the poll draft stores publicUrl. The API only accepts
-- URLs inside our own bucket and checks the files when the poll is submitted.
-- (No production data exists yet, so the id columns are simply replaced.)

ALTER TABLE polls DROP COLUMN cover_image_id;
ALTER TABLE polls ADD COLUMN cover_image_url text CHECK (length(cover_image_url) <= 500);

ALTER TABLE element_options DROP COLUMN image_id;
ALTER TABLE element_options ADD COLUMN image_url text CHECK (length(image_url) <= 500);

-- `image` elements keep their URL in config: {"url": str, "caption": str?}

DROP TABLE images;
DROP TYPE image_status;
