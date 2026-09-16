-- Plank progression exercises for Nathan Wadey 12-week block (weeks 8 and 10)
-- Added 16 Sep 2026

INSERT INTO exercises (name, source, trainerize_id, trainerize_custom, archetypes, movement_type, muscle_groups, equipment, tags, difficulty, intensity_tiers, coaching_cue, default_mod, image_url, video_url) VALUES
  ('Long-Lever Plank', 'custom', NULL, FALSE, '{"B"}', 'core_anterior', ARRAY['Abs']::text[], ARRAY['mat']::text[], ARRAY['Core']::text[], 3, '{"standard","extended"}', 'Extend arms forward to increase lever length, brace core hard, hold body straight', 'Shorten lever or perform standard plank', NULL, 'https://www.youtube.com/watch?v=SwGNmrAmXP4'),
  ('Weighted Plank', 'custom', NULL, FALSE, '{"B"}', 'core_anterior', ARRAY['Abs']::text[], ARRAY['mat','weight plate']::text[], ARRAY['Core']::text[], 3, '{"standard","extended"}', 'Place weight plate on lower back, maintain neutral spine, brace core throughout', 'Reduce weight or perform unweighted plank', NULL, 'https://www.youtube.com/watch?v=aET_xBkImX8');
