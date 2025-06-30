/*
  # Add Push Notification Support

  1. New Tables
    - `push_subscriptions` - Stores user push notification subscriptions
  2. Security
    - Enable RLS on `push_subscriptions` table
    - Add policy for users to manage their own subscriptions
  3. Functions
    - `notify_sos_request` - Sends push notifications for new SOS requests
    - `notify_sos_accepted` - Sends push notifications when SOS is accepted
    - `notify_message` - Sends push notifications for new messages
*/

-- Create push_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to notify about new SOS requests
CREATE OR REPLACE FUNCTION notify_sos_request()
RETURNS TRIGGER AS $$
DECLARE
  nearby_volunteers RECORD;
  response RECORD;
BEGIN
  -- Find volunteers within ~5km radius who are ready to help
  FOR nearby_volunteers IN
    SELECT p.id
    FROM profiles p
    WHERE 
      p.is_volunteer_ready = true 
      AND p.id != NEW.user_id
      -- Approximate distance calculation (1 degree ≈ 111km at equator)
      AND (
        (p.latitude - NEW.latitude)^2 + 
        (p.longitude - NEW.longitude)^2
      ) <= (5/111)^2
  LOOP
    -- Call Edge Function to send push notification
    SELECT
      net.http_post(
        url:= CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-push-notification'),
        headers:= '{"Content-Type": "application/json", "Authorization": "Bearer ', current_setting('app.settings.service_role_key'), '"}',
        body:= json_build_object(
          'userId', nearby_volunteers.id,
          'sosRequestId', NEW.id,
          'notificationType', 'sos',
          'title', 'SOS Gần Bạn',
          'body', CONCAT('Có người cần giúp đỡ gần bạn: ', NEW.type, ' - ', NEW.urgency),
          'data', json_build_object(
            'latitude', NEW.latitude,
            'longitude', NEW.longitude,
            'type', NEW.type,
            'urgency', NEW.urgency
          )
        )::text
      ) INTO response;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new SOS requests
DROP TRIGGER IF EXISTS trigger_notify_sos_request ON sos_requests;
CREATE TRIGGER trigger_notify_sos_request
  AFTER INSERT ON sos_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_sos_request();

-- Create function to notify when SOS is accepted
CREATE OR REPLACE FUNCTION notify_sos_accepted()
RETURNS TRIGGER AS $$
DECLARE
  response RECORD;
BEGIN
  -- Only trigger when status changes to 'helping' and helper_id is set
  IF NEW.status = 'helping' AND NEW.helper_id IS NOT NULL AND 
     (OLD.status != 'helping' OR OLD.helper_id IS NULL) THEN
    
    -- Get helper name
    DECLARE
      helper_name TEXT;
    BEGIN
      SELECT name INTO helper_name FROM profiles WHERE id = NEW.helper_id;
      
      -- Call Edge Function to send push notification to requester
      SELECT
        net.http_post(
          url:= CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-push-notification'),
          headers:= '{"Content-Type": "application/json", "Authorization": "Bearer ', current_setting('app.settings.service_role_key'), '"}',
          body:= json_build_object(
            'userId', NEW.user_id,
            'sosRequestId', NEW.id,
            'notificationType', 'sos_accepted',
            'title', 'Yêu cầu SOS được chấp nhận',
            'body', CONCAT(helper_name, ' đang đến giúp bạn với yêu cầu ', NEW.type),
            'data', json_build_object(
              'helperId', NEW.helper_id,
              'helperName', helper_name
            )
          )::text
        ) INTO response;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for SOS accepted
DROP TRIGGER IF EXISTS trigger_notify_sos_accepted ON sos_requests;
CREATE TRIGGER trigger_notify_sos_accepted
  AFTER UPDATE ON sos_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_sos_accepted();

-- Create function to notify about new messages
CREATE OR REPLACE FUNCTION notify_message()
RETURNS TRIGGER AS $$
DECLARE
  response RECORD;
  sender_name TEXT;
BEGIN
  -- Get sender name
  SELECT name INTO sender_name FROM profiles WHERE id = NEW.sender_id;
  
  -- Call Edge Function to send push notification
  SELECT
    net.http_post(
      url:= CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-push-notification'),
      headers:= '{"Content-Type": "application/json", "Authorization": "Bearer ', current_setting('app.settings.service_role_key'), '"}',
      body:= json_build_object(
        'userId', NEW.receiver_id,
        'sosRequestId', NEW.sos_request_id,
        'notificationType', 'message',
        'title', 'Tin nhắn mới',
        'body', CONCAT(sender_name, ': ', substring(NEW.content, 1, 50), CASE WHEN length(NEW.content) > 50 THEN '...' ELSE '' END),
        'data', json_build_object(
          'senderId', NEW.sender_id,
          'senderName', sender_name,
          'messageId', NEW.id
        )
      )::text
    ) INTO response;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_message ON chat_messages;
CREATE TRIGGER trigger_notify_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_message();

-- Create function to notify when SOS is completed
CREATE OR REPLACE FUNCTION notify_sos_completed()
RETURNS TRIGGER AS $$
DECLARE
  response RECORD;
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.helper_id IS NOT NULL THEN
    -- Call Edge Function to send push notification to helper
    SELECT
      net.http_post(
        url:= CONCAT(current_setting('app.settings.supabase_url'), '/functions/v1/send-push-notification'),
        headers:= '{"Content-Type": "application/json", "Authorization": "Bearer ', current_setting('app.settings.service_role_key'), '"}',
        body:= json_build_object(
          'userId', NEW.helper_id,
          'sosRequestId', NEW.id,
          'notificationType', 'sos_completed',
          'title', 'Yêu cầu SOS đã hoàn thành',
          'body', CONCAT('Yêu cầu ', NEW.type, ' đã được đánh dấu hoàn thành'),
          'data', json_build_object(
            'requesterId', NEW.user_id
          )
        )::text
      ) INTO response;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for SOS completed
DROP TRIGGER IF EXISTS trigger_notify_sos_completed ON sos_requests;
CREATE TRIGGER trigger_notify_sos_completed
  AFTER UPDATE ON sos_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_sos_completed();

-- Set app settings for Edge Function URLs
DO $$
BEGIN
  -- Check if the settings already exist
  IF NOT EXISTS (SELECT 1 FROM pg_settings WHERE name = 'app.settings.supabase_url') THEN
    -- Set Supabase URL and service role key
    PERFORM set_config('app.settings.supabase_url', 'https://wnoxakazjgvtevpbacqp.supabase.co', false);
    PERFORM set_config('app.settings.service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indub3hha2F6amd2dGV2cGJhY3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODY2NTU2MiwiZXhwIjoyMDY0MjQxNTYyfQ.Yd-Yk_Oj-Yd-Yk_Oj-Yd-Yk_Oj', false);
  END IF;
END $$;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;