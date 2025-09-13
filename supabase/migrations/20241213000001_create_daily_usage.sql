-- Create daily_usage table for tracking freemium limits
CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  labels_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),

  -- Ensure one record per user per day
  UNIQUE(user_id, usage_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date
ON daily_usage(user_id, usage_date);

CREATE INDEX IF NOT EXISTS idx_daily_usage_date
ON daily_usage(usage_date);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_daily_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_daily_usage_timestamp
  BEFORE UPDATE ON daily_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_usage_timestamp();

-- Create helper function to get or create daily usage
CREATE OR REPLACE FUNCTION get_or_create_daily_usage(user_uuid uuid)
RETURNS daily_usage AS $$
DECLARE
  result daily_usage;
BEGIN
  -- Try to get existing record for today
  SELECT * INTO result
  FROM daily_usage
  WHERE user_id = user_uuid
    AND usage_date = CURRENT_DATE;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO daily_usage (user_id, usage_date, labels_used)
    VALUES (user_uuid, CURRENT_DATE, 0)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_daily_usage(user_uuid uuid, label_count integer)
RETURNS daily_usage AS $$
DECLARE
  result daily_usage;
BEGIN
  -- Insert or update daily usage
  INSERT INTO daily_usage (user_id, usage_date, labels_used)
  VALUES (user_uuid, CURRENT_DATE, label_count)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET
    labels_used = daily_usage.labels_used + EXCLUDED.labels_used,
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (Row Level Security)
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own usage
CREATE POLICY "Users can view their own daily usage"
ON daily_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily usage"
ON daily_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily usage"
ON daily_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON daily_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_daily_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_usage(uuid, integer) TO authenticated;