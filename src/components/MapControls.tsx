import React, { useEffect } from "react";
import { useIsXS } from "@/hooks/use-mobile";
import goongjs from "@goongmaps/goong-js";
import { MockLocationService } from "@/utils/mockLocationService";

interface MapControlsProps {
  map: goongjs.Map | null;
  userLocation?: { lat: number; lng: number } | null;
  usingMockLocation?: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  map,
  userLocation,
  usingMockLocation = false,
}) => {
  const isXS = useIsXS();

  useEffect(() => {
    if (map) {
      // Check if user is using mock location
      const isUsingMock =
        usingMockLocation || MockLocationService.isUsingMockLocation();

      if (isUsingMock) {
        // Don't add GeolocateControl when using mock location
        // Instead, we can add a custom marker for mock location
        console.log("Skipping GeolocateControl due to mock location usage");

        // Add a custom marker for mock location if needed
        if (userLocation) {
          // Create a simple marker for mock location
          const mockMarker = new goongjs.Marker({
            color: "#3B82F6", // Blue color to distinguish from real location
          })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(map);

          return () => {
            mockMarker.remove();
          };
        }
        return;
      }

      // Only add GeolocateControl if not using mock location
      const geolocateControl = new goongjs.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      });

      map.addControl(geolocateControl, "top-right");

      // Auto trigger geolocation immediately when map is ready
      const triggerGeolocate = () => {
        try {
          geolocateControl.trigger();
        } catch (error) {
          console.log("Geolocate trigger failed:", error);
        }
      };

      // If map is already loaded, trigger immediately
      if (map.isStyleLoaded()) {
        setTimeout(triggerGeolocate, 500);
      } else {
        // Otherwise wait for map to load
        map.on("load", () => {
          setTimeout(triggerGeolocate, 500);
        });
      }

      return () => {
        map.removeControl(geolocateControl);
      };
    }
  }, [map, userLocation, usingMockLocation]);

  return null;
};

export default MapControls;
