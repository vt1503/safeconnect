import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys();

    return new Response(
      JSON.stringify({
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
        message: "Store these keys securely. Set them as environment variables in your Supabase project."
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating VAPID keys:', error);
    return new Response(
      JSON.stringify({ error: "Failed to generate VAPID keys", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});