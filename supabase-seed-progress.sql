-- Progress chart fake data seed
-- Creates 20 sessions over the past 80 days with multiple exercises per session
-- Each session shares a unique date so no constraint violations occur
-- Run this in the Supabase SQL editor

DO $$
DECLARE
  v_user   uuid;
  v_sess   uuid;
  v_se     uuid;
  v_date   date;
  i        int;

  -- exercise IDs
  ex_pullup   uuid;
  ex_pushup   uuid;
  ex_dip      uuid;
  ex_plank    uuid;
  ex_deadhang uuid;

  -- progression values
  pu_reps  int;
  ps_reps  int;
  dip_reps int;
  plank_s  int;
  hang_s   int;
BEGIN
  -- Get your user id
  SELECT id INTO v_user FROM auth.users LIMIT 1;
  IF v_user IS NULL THEN RAISE EXCEPTION 'No user found'; END IF;

  -- Look up exercise IDs (case-insensitive)
  SELECT id INTO ex_pullup   FROM exercises WHERE lower(name) = 'pull-ups'  AND (user_id IS NULL OR user_id = v_user) LIMIT 1;
  SELECT id INTO ex_pushup   FROM exercises WHERE lower(name) = 'push-ups'  AND (user_id IS NULL OR user_id = v_user) LIMIT 1;
  SELECT id INTO ex_dip      FROM exercises WHERE lower(name) = 'dips'      AND (user_id IS NULL OR user_id = v_user) LIMIT 1;
  SELECT id INTO ex_plank    FROM exercises WHERE lower(name) = 'plank'     AND (user_id IS NULL OR user_id = v_user) LIMIT 1;
  SELECT id INTO ex_deadhang FROM exercises WHERE lower(name) = 'dead hang' AND (user_id IS NULL OR user_id = v_user) LIMIT 1;

  -- Insert any missing exercises so the data has somewhere to go
  IF ex_pullup IS NULL THEN
    INSERT INTO exercises (id, name, type) VALUES (gen_random_uuid(), 'Pull-ups', 'reps') RETURNING id INTO ex_pullup;
  END IF;
  IF ex_pushup IS NULL THEN
    INSERT INTO exercises (id, name, type) VALUES (gen_random_uuid(), 'Push-ups', 'reps') RETURNING id INTO ex_pushup;
  END IF;
  IF ex_dip IS NULL THEN
    INSERT INTO exercises (id, name, type) VALUES (gen_random_uuid(), 'Dips', 'reps') RETURNING id INTO ex_dip;
  END IF;
  IF ex_plank IS NULL THEN
    INSERT INTO exercises (id, name, type) VALUES (gen_random_uuid(), 'Plank', 'timed') RETURNING id INTO ex_plank;
  END IF;
  IF ex_deadhang IS NULL THEN
    INSERT INTO exercises (id, name, type) VALUES (gen_random_uuid(), 'Dead Hang', 'timed') RETURNING id INTO ex_deadhang;
  END IF;

  -- Create 20 sessions, each 4 days apart, going back 80 days
  FOR i IN 0..19 LOOP
    v_date := current_date - ((19 - i) * 4) * interval '1 day';

    -- Reuse existing session on this date, or create a new one
    SELECT id INTO v_sess FROM sessions WHERE user_id = v_user AND date = v_date LIMIT 1;
    IF v_sess IS NULL THEN
      INSERT INTO sessions (id, user_id, date, feel, notes)
      VALUES (
        gen_random_uuid(),
        v_user,
        v_date,
        1 + (i % 5),
        CASE WHEN i % 5 = 0 THEN 'Felt great today' WHEN i % 7 = 0 THEN 'Tough one' ELSE NULL END
      )
      RETURNING id INTO v_sess;
    END IF;

    -- Compute progressive values (gentle upward trend)
    pu_reps  := 5  + (i * 4 / 10);   -- 5 → 12 reps
    ps_reps  := 15 + i;               -- 15 → 34 reps
    dip_reps := 6  + (i * 5 / 10);   -- 6 → 15 reps
    plank_s  := 30 + i * 3;           -- 30 → 87 seconds
    hang_s   := 20 + i * 2;           -- 20 → 58 seconds

    -- Pull-ups: 3 sets every session
    INSERT INTO session_exercises (id, session_id, exercise_id, type)
    VALUES (gen_random_uuid(), v_sess, ex_pullup, 'reps') RETURNING id INTO v_se;
    INSERT INTO session_sets (id, session_exercise_id, reps) VALUES
      (gen_random_uuid(), v_se, pu_reps),
      (gen_random_uuid(), v_se, pu_reps - 1),
      (gen_random_uuid(), v_se, pu_reps - 2);

    -- Push-ups: 3 sets every session
    INSERT INTO session_exercises (id, session_id, exercise_id, type)
    VALUES (gen_random_uuid(), v_sess, ex_pushup, 'reps') RETURNING id INTO v_se;
    INSERT INTO session_sets (id, session_exercise_id, reps) VALUES
      (gen_random_uuid(), v_se, ps_reps),
      (gen_random_uuid(), v_se, ps_reps - 3),
      (gen_random_uuid(), v_se, ps_reps - 5);

    -- Dips: every other session
    IF i % 2 = 0 THEN
      INSERT INTO session_exercises (id, session_id, exercise_id, type)
      VALUES (gen_random_uuid(), v_sess, ex_dip, 'reps') RETURNING id INTO v_se;
      INSERT INTO session_sets (id, session_exercise_id, reps) VALUES
        (gen_random_uuid(), v_se, dip_reps),
        (gen_random_uuid(), v_se, dip_reps - 1);
    END IF;

    -- Plank (timed): every 3rd session
    IF i % 3 = 0 THEN
      INSERT INTO session_exercises (id, session_id, exercise_id, type)
      VALUES (gen_random_uuid(), v_sess, ex_plank, 'timed') RETURNING id INTO v_se;
      INSERT INTO session_sets (id, session_exercise_id, hold_time_seconds) VALUES
        (gen_random_uuid(), v_se, plank_s),
        (gen_random_uuid(), v_se, plank_s - 10);
    END IF;

    -- Dead Hang (timed): every 4th session
    IF i % 4 = 0 THEN
      INSERT INTO session_exercises (id, session_id, exercise_id, type)
      VALUES (gen_random_uuid(), v_sess, ex_deadhang, 'timed') RETURNING id INTO v_se;
      INSERT INTO session_sets (id, session_exercise_id, hold_time_seconds) VALUES
        (gen_random_uuid(), v_se, hang_s);
    END IF;

  END LOOP;

  RAISE NOTICE 'Seed complete for user %', v_user;
END $$;


-- ============================================================
-- CLEANUP: run this later to remove the fake data
-- ============================================================
-- DELETE FROM sessions
-- WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
--   AND date BETWEEN current_date - interval '90 days' AND current_date - interval '3 days';
