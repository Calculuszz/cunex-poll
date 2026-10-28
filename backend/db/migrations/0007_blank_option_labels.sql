-- Drafts may hold options whose label isn't written yet; submit requires one
-- (completeness check), so published polls still never show a blank option.
ALTER TABLE element_options DROP CONSTRAINT element_options_label_check;
ALTER TABLE element_options ADD CONSTRAINT element_options_label_check
  CHECK (length(label) <= 300);
