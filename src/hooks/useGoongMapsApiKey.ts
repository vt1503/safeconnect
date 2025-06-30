import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GoongApiKeys {
  mapsApiKey: string;
  servicesApiKey: string;
}

export const useGoongMapsApiKey = () => {
  const [apiKeys, setApiKeys] = useState<GoongApiKeys>({
    mapsApiKey: "",
    servicesApiKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoading(true);
        setError(null);

        if (process.env.NODE_ENV === "development") {
          console.log("Calling get-maps-config edge function...");
        }
        const { data, error } = await supabase.functions.invoke(
          "get-maps-config"
        );

        if (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error calling get-maps-config:", error);
          }
          setError(`Lỗi kết nối: ${error.message}`);
          return;
        }

        // Don't log the actual API keys - only log success/failure
        if (process.env.NODE_ENV === "development") {
          console.log(
            "Response from get-maps-config: API keys received successfully"
          );
        }

        if (data?.error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error from get-maps-config function:", data.error);
          }
          setError(
            `Lỗi server: ${data.error}${
              data.details ? ` - ${data.details}` : ""
            }`
          );
          return;
        }

        if (data?.goongMapsApiKey && data?.goongApiKey) {
          if (process.env.NODE_ENV === "development") {
            console.log("Successfully got both Goong API keys");
          }
          setApiKeys({
            mapsApiKey: data.goongMapsApiKey,
            servicesApiKey: data.goongApiKey,
          });
        } else {
          if (process.env.NODE_ENV === "development") {
            console.error("Missing API keys in response - keys present:", {
              hasGoongMapsApiKey: !!data?.goongMapsApiKey,
              hasGoongApiKey: !!data?.goongApiKey,
            });
          }
          setError("Không tìm thấy đầy đủ Goong API keys trong phản hồi");
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error in useGoongMapsApiKey:", err);
        }
        setError(
          `Lỗi không mong muốn: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  return {
    apiKey: apiKeys.mapsApiKey, // Backward compatibility
    mapsApiKey: apiKeys.mapsApiKey,
    servicesApiKey: apiKeys.servicesApiKey,
    loading,
    error,
  };
};
