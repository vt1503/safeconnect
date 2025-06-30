import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Set VAPID keys for web push
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "BLBz5HWVPrM-cFnl7LVtDzAu4wz5tVrXuRQUfTGUQkjQn9_WNRSSfGfpuJm1NCVAcxpwMJLDvGhvcnb-QEd9G-A";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@safeconnect.com";

webpush.setVapidDetails(
  vapidSubject,
  vapidPublicKey,
  vapidPrivateKey
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { userId, sosRequestId, notificationType, title, body, data } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (subscriptionError) {
      console.error('Error fetching subscriptions:', subscriptionError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions", details: subscriptionError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push subscriptions found for this user" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload
    const notificationPayload = {
      title: title || "SafeConnect",
      body: body || "Bạn có thông báo mới",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: notificationType || "default",
      data: {
        url: "/",
        type: notificationType || "default",
        sosRequestId,
        ...data
      }
    };

    // Send push notification to all user's subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify(notificationPayload)
        );
        return { success: true, subscription: sub.subscription.endpoint };
      } catch (error) {
        console.error('Error sending push notification:', error);
        
        // If subscription is expired or invalid, delete it
        if (error.statusCode === 404 || error.statusCode === 410) {
          try {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', userId)
              .eq('subscription->endpoint', sub.subscription.endpoint);
            
            console.log('Deleted invalid subscription:', sub.subscription.endpoint);
          } catch (deleteError) {
            console.error('Error deleting invalid subscription:', deleteError);
          }
        }
        
        return { success: false, error: error.message, subscription: sub.subscription.endpoint };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Push notifications sent to ${successCount} of ${subscriptions.length} subscriptions`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});