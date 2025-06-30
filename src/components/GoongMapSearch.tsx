import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Navigation } from "lucide-react";
import { useIsXS } from "@/hooks/use-mobile";
import { useTranslation } from "@/hooks/useTranslation";
import goongjs from "@goongmaps/goong-js";

interface GoongMapSearchProps {
  map: goongjs.Map | null;
  mapsApiKey: string;
  servicesApiKey: string;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
}

const GoongMapSearch: React.FC<GoongMapSearchProps> = ({
  map,
  mapsApiKey,
  servicesApiKey,
  onLocationSelect,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isXS = useIsXS();

  const searchPlaces = async (query: string) => {
    if (!query || !servicesApiKey) return;

    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=${servicesApiKey}&input=${encodeURIComponent(
          query
        )}&location=21.0285,105.8542&radius=50000`
      );
      const data = await response.json();

      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error(t("goongMapSearch.searchError"), error);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://rsapi.goong.io/Place/Detail?place_id=${placeId}&api_key=${servicesApiKey}`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const location = {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          address: data.result.formatted_address || data.result.name,
        };
        onLocationSelect(location);
        setShowSuggestions(false);
        if (inputRef.current) {
          inputRef.current.value = location.address;
        }
      }
    } catch (error) {
      console.error(t("goongMapSearch.placeDetailsError"), error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length > 2) {
      searchPlaces(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleMyLocation = async () => {
    if (!navigator.geolocation || !servicesApiKey) return;

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Reverse geocode to get address
      const geoResponse = await fetch(
        `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${servicesApiKey}`
      );
      const geoData = await geoResponse.json();

      let address = t("goongMapSearch.currentLocation");
      if (geoData.results && geoData.results.length > 0) {
        address = geoData.results[0].formatted_address;
      }

      const location = {
        lat: lat,
        lng: lng,
        address: address,
      };

      onLocationSelect(location);
      if (inputRef.current) {
        inputRef.current.value = address; // Update input field with the address
      }
      if (map) {
        map.setCenter([lng, lat]);
        map.setZoom(17);
      }
    } catch (error) {
      console.error(t("goongMapSearch.locationError"), error);
      // Fallback if geocoding fails or permission denied
      const fallbackLocation = {
        lat: 0, // Or some default lat
        lng: 0, // Or some default lng
        address: t("goongMapSearch.locationError"),
      };
      onLocationSelect(fallbackLocation);
      if (inputRef.current) {
        inputRef.current.value = fallbackLocation.address;
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2 w-full">
        <div className="relative flex-1">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${
              isXS ? "w-3 h-3" : "w-4 h-4"
            }`}
          />
          <Input
            ref={inputRef}
            placeholder={t("goongMapSearch.placeholder")}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className={`bg-white dark:bg-gray-800 shadow-md border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 ${
              isXS ? "pl-8 text-sm h-9" : "pl-10 text-sm sm:text-base"
            }`}
          />
        </div>
        <Button
          onClick={handleMyLocation}
          variant="outline"
          size="icon"
          className={`bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 flex-shrink-0 ${
            isXS ? "w-9 h-9" : "w-10 h-10 sm:w-auto sm:h-auto"
          }`}
          title={t("goongMapSearch.myLocationButton")}
        >
          <Navigation
            className={`text-gray-600 dark:text-gray-400 ${
              isXS ? "w-3 h-3" : "w-4 h-4"
            }`}
          />
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              onClick={() => {
                if (suggestion.place_id) {
                  getPlaceDetails(suggestion.place_id);
                }
              }}
            >
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {suggestion.structured_formatting?.main_text ||
                  suggestion.description}
              </div>
              {suggestion.structured_formatting?.secondary_text && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoongMapSearch;
