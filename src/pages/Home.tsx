import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  MapPin,
  User,
  History,
  Users,
  Cloud,
  Sun,
  CloudRain,
  PhoneCall,
  Trash2 as LucideTrash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile, useIsXS } from "@/hooks/use-mobile";
import ImageUpload from "@/components/ImageUpload";
import { useGoongMapsApiKey } from "@/hooks/useGoongMapsApiKey";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Toggle, GooeyFilter } from "@/components/ui/liquid-toggle";
import GoongMapSearch from "@/components/GoongMapSearch";

// --- Định nghĩa initialState cho sosForm ---
const sosFormInitialState = {
  type: "",
  description: "",
  urgency: "",
  people_affected: 1,
  manual_address: "",
};

// --- Interface cho props của SOSFormContentComponent ---
interface SOSFormContentProps {
  sosForm: typeof sosFormInitialState;
  setSOSForm: React.Dispatch<React.SetStateAction<typeof sosFormInitialState>>;
  handleSOSSubmit: () => void;
  servicesApiKey: string | null;
  setSOSImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleClearForm: () => void;
}

// --- Định nghĩa SOSFormContentComponent bên ngoài Home ---
const SOSFormContentComponent: React.FC<SOSFormContentProps> = ({
  sosForm,
  setSOSForm,
  handleSOSSubmit,
  servicesApiKey,
  setSOSImages,
  handleClearForm,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="type" className="text-red-600 text-sm">
          {t("sos.support_type_required")}
        </Label>
        <Select
          value={sosForm.type}
          onValueChange={(value) =>
            setSOSForm((prev) => ({ ...prev, type: value }))
          }
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder={t("sos.typePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y tế khẩn cấp">
              🚑 {t("sos.medical_emergency")}
            </SelectItem>
            <SelectItem value="Sơ tán">🏃‍♂️ {t("sos.evacuation")}</SelectItem>
            <SelectItem value="Cứu hộ">⛑️ {t("sos.rescue")}</SelectItem>
            <SelectItem value="Thực phẩm">🍞 {t("sos.food")}</SelectItem>
            <SelectItem value="Nước uống">💧 {t("sos.water")}</SelectItem>
            <SelectItem value="Chỗ ở">🏠 {t("sos.shelter")}</SelectItem>
            <SelectItem value="Thuốc men">💊 {t("sos.medicine")}</SelectItem>
            <SelectItem value="Quần áo">👕 {t("sos.clothing")}</SelectItem>
            <SelectItem value="Khác">❓ {t("sos.other")}</SelectItem>
          </SelectContent>
        </Select>
        {sosForm.type === "Y tế khẩn cấp" && (
          <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
            💡 {t("sos.medical_tip")}{" "}
            <a
              href="tel:115"
              className="text-blue-500 hover:text-blue-600 hover:underline font-medium"
            >
              115
            </a>{" "}
            {t("sos.for_emergency")}.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="manual_address" className="text-sm">
          {t("sos.manualAddress")}
        </Label>
        {servicesApiKey ? (
          <div className="w-full h-9 text-sm">
            <GoongMapSearch
              map={null}
              mapsApiKey={servicesApiKey}
              servicesApiKey={servicesApiKey}
              onLocationSelect={(location) => {
                setSOSForm((prev) => ({
                  ...prev,
                  manual_address: location.address,
                }));
              }}
            />
          </div>
        ) : (
          <Input
            id="manual_address"
            placeholder={t("sos.address_placeholder")}
            value={sosForm.manual_address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSOSForm((prev) => ({
                ...prev,
                manual_address: e.target.value,
              }))
            }
            className="w-full h-9 text-sm"
          />
        )}
      </div>

      <div>
        <Label htmlFor="description" className="text-red-600 text-sm">
          {t("sos.description")}
        </Label>
        <Textarea
          id="description"
          placeholder={t("sos.descriptionPlaceholder")}
          value={sosForm.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setSOSForm((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full resize-none h-16 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="urgency" className="text-red-600 text-sm">
            {t("sos.urgency")}
          </Label>
          <Select
            value={sosForm.urgency}
            onValueChange={(value) =>
              setSOSForm((prev) => ({ ...prev, urgency: value }))
            }
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder={t("sos.urgencyPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Khẩn cấp">
                🔴 {t("urgency_levels.emergency")}
              </SelectItem>
              <SelectItem value="Trung bình">
                🟡 {t("urgency_levels.medium")}
              </SelectItem>
              <SelectItem value="Thấp">🟢 {t("urgency_levels.low")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="people" className="text-sm">
            {t("sos.peopleAffected")}
          </Label>
          <Input
            id="people"
            type="number"
            min="1"
            value={sosForm.people_affected}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSOSForm((prev) => ({
                ...prev,
                people_affected: parseInt(e.target.value) || 1,
              }))
            }
            className="w-full h-9 text-sm"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm">{t("sos.scene_images")}</Label>
        <div className="mt-1">
          <ImageUpload
            onImagesChange={(images) => {
              const stringImages = Array.isArray(images)
                ? (images.filter((img) => typeof img === "string") as string[])
                : [];
              setSOSImages(stringImages);
            }}
            maxImages={4}
          />
        </div>
      </div>

      <div className="pt-3 grid grid-cols-2 gap-3">
        <Button
          onClick={handleClearForm}
          variant="outline"
          className="w-full h-10"
          type="button"
        >
          <LucideTrash2 className="w-4 h-4 mr-2" />
          {t("sos.clear_form")}
        </Button>
        <Button
          onClick={handleSOSSubmit}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold h-10"
          type="button"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {t("sos.sendRequest")}
        </Button>
      </div>
    </div>
  );
};

interface SosRequest {
  completed_at: string | null;
  created_at: string | null;
  description: string;
  helper_id: string | null;
  id: string;
  latitude: number;
  longitude: number;
  people_affected: number | null;
  status: string | null;
  type: string;
  urgency: string;
  user_id: string;
}

const getRequestStatusInfo = (
  status: string | null,
  t: (key: string) => string
) => {
  switch (status) {
    case "completed":
      return {
        text: t("status.completed"),
        variant: "default" as const,
        className: "bg-green-100 text-green-800 border-green-300",
      };
    case "processing":
    case "in_progress":
      return {
        text: t("status.processing"),
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800 border-blue-300",
      };
    case "pending":
      return {
        text: t("status.pending"),
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800 border-yellow-300",
      };
    case "cancelled":
      return {
        text: t("status.cancelled"),
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800 border-gray-300",
      };
    case "failed":
      return {
        text: t("status.failed"),
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-300",
      };
    default:
      return {
        text: status || t("status.unknown"),
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-700 border-gray-300",
      };
  }
};

const Home: React.FC = () => {
  const { profile, toggleVolunteerStatus } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isXS = useIsXS();
  const { servicesApiKey } = useGoongMapsApiKey();

  const translateRequestType = (type: string) => {
    switch (type) {
      case "Y tế khẩn cấp":
        return t("request_types.medical_emergency");
      case "Sơ tán":
        return t("request_types.evacuation");
      case "Cứu hộ":
        return t("request_types.rescue");
      case "Thực phẩm":
        return t("request_types.food");
      case "Nước uống":
        return t("request_types.water");
      case "Chỗ ở":
        return t("request_types.shelter");
      case "Thuốc men":
        return t("request_types.medicine");
      case "Quần áo":
        return t("request_types.clothing");
      case "Khác":
        return t("request_types.other");
      default:
        return type;
    }
  };

  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [userLocation, setUserLocation] = useState({
    lat: 21.0285,
    lng: 105.8542,
  });
  const [weather, setWeather] = useState<{
    temperature: number;
    description: string;
    humidity: number;
    icon: string;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [sosDialogOpen, setSOSDialogOpen] = useState(false);
  const [recentRequests, setRecentRequests] = useState<SosRequest[]>([]);
  const [recentHelps, setRecentHelps] = useState<SosRequest[]>([]);

  const [sosForm, setSOSForm] = useState(sosFormInitialState);
  const [sosImages, setSOSImages] = useState<string[]>([]);

  // SOSFormContentComponent sẽ được render bên trong Dialog/Drawer

  const handleClearForm = () => {
    setSOSForm(sosFormInitialState);
    setSOSImages([]);
    toast.dismiss();
    toast.success(t("sos.clear_form"));
  };

  useEffect(() => {
    getCurrentLocation();
    if (profile) {
      fetchRecentRequests();
      fetchRecentHelps();
    }
  }, [profile, servicesApiKey]);

  const getCurrentLocation = () => {
    setLocationLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });

          if (servicesApiKey) {
            try {
              const response = await fetch(
                `https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${servicesApiKey}`
              );

              if (response.ok) {
                const data = await response.json();
                const address = data.results[0].formatted_address;
                setCurrentLocation(address);
                if (process.env.NODE_ENV === "development") {
                  console.log("Detailed address from Goong:", address);
                }
              } else {
                if (process.env.NODE_ENV === "development") {
                  console.log("No address found from Goong API");
                }
              }
            } catch (error) {
              if (process.env.NODE_ENV === "development") {
                console.error("Error getting address from Goong:", error);
              }
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("Goong API key not available yet");
            }
          }

          setLocationLoading(false);
        },
        (error) => {
          if (process.env.NODE_ENV === "development") {
            console.error("Error getting location:", error);
          }
          setLocationLoading(false);
        }
      );
    } else {
      setLocationLoading(false);
    }
  };

  const getWeatherIconType = (iconCode: string) => {
    if (iconCode.includes("01") || iconCode.includes("02")) return "sun";
    if (iconCode.includes("03") || iconCode.includes("04")) return "cloud";
    if (
      iconCode.includes("09") ||
      iconCode.includes("10") ||
      iconCode.includes("11")
    )
      return "rain";
    return "sun";
  };

  const getWeatherIcon = (iconType: string) => {
    switch (iconType) {
      case "sun":
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case "cloud":
        return <Cloud className="w-4 h-4 text-gray-500" />;
      case "rain":
        return <CloudRain className="w-4 h-4 text-blue-500" />;
      default:
        return <Sun className="w-4 h-4 text-yellow-500" />;
    }
  };

  const fetchRecentRequests = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("sos_requests")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setRecentRequests(data);
    }
  };

  const fetchRecentHelps = async () => {
    if (!profile) return;

    const { data, error } = await supabase
      .from("sos_requests")
      .select("*")
      .eq("helper_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setRecentHelps(data);
    }
  };

  const handleSOSSubmit = async () => {
    const missingFields = [];
    if (!sosForm.type) missingFields.push(t("sos.support_type"));
    if (!sosForm.description)
      missingFields.push(t("sos.situation_description"));
    if (!sosForm.urgency) missingFields.push(t("sos.urgency_level"));

    if (missingFields.length > 0) {
      toast.dismiss();
      toast.error(
        `${t("sos.please_fill_required")}: ${missingFields.join(", ")}.`
      );
      return;
    }

    if (!profile) {
      toast.dismiss();
      toast.error(t("sos.login_required"));
      navigate("/login");
      return;
    }

    if (!userLocation) {
      toast.dismiss();
      toast.error(t("sos.location_error_desc"));
      return;
    }

    try {
      const sosData: {
        user_id: string;
        type: string;
        description: string;
        urgency: string;
        people_affected: number;
        latitude: number;
        longitude: number;
        manual_address?: string;
        images?: string[];
      } = {
        user_id: profile.id,
        type: sosForm.type,
        description: sosForm.description,
        urgency: sosForm.urgency,
        people_affected: sosForm.people_affected,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      };

      if (sosForm.manual_address && sosForm.manual_address.trim().length > 0) {
        sosData.manual_address = sosForm.manual_address.trim();
      }

      if (sosImages && sosImages.length > 0) {
        sosData.images = sosImages;
      }

      const { data, error } = await supabase
        .from("sos_requests")
        .insert(sosData)
        .select();

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error creating SOS request:", error);
        }
        toast.dismiss();
        toast.error(`${t("sos.cannot_send")}: ${error.message}`);
        return;
      }

      toast.dismiss();
      toast.success(t("sos.sent_successfully"));

      setSOSForm({
        type: "",
        description: "",
        urgency: "",
        people_affected: 1,
        manual_address: "",
      });
      setSOSImages([]);
      setSOSDialogOpen(false);

      navigate("/map");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Unexpected error:", error);
      }
      toast.dismiss();
      toast.error(t("sos.unexpected_error"));
    }
  };

  const handleToggleVolunteer = async () => {
    if (!profile) {
      toast.dismiss();
      toast.error(t("volunteer.login_required_desc"));
    } else {
      await toggleVolunteerStatus();
      toast.dismiss();
      toast.success(
        profile?.is_volunteer_ready
          ? t("map.volunteerModeOff")
          : t("map.volunteerModeOn")
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <GooeyFilter />
      {/* Header */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-neutral-700 px-4 py-4">
        <div className="flex flex-col">
          {/* Top row with logo, greeting and user info */}
          <div className="flex items-center justify-between">
            {/* Left part: Icon + Greeting */}
            <div className="flex items-baseline gap-2">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-lg">🚨</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                <TextShimmer className="inline-block [--base-color:theme(colors.red.600)] white:[--base-color:theme(colors.red.500)]">
                  {`${t("home.greeting")} ${
                    profile?.name?.split(" ").slice(-1)[0] || t("common.you")
                  }!`}
                </TextShimmer>
              </h2>
            </div>
            {/* Right part: Weather + Logo */}
            <div className="flex items-center gap-3">
              {/* Weather */}
              <div className="text-right">
                {weather && (
                  <div className="flex items-center gap-2 text-sm">
                    {getWeatherIcon(weather.icon)}
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {weather.temperature}°C
                    </span>
                    <span className="text-gray-600 dark:text-neutral-400">
                      {weather.description}
                    </span>
                    <span className="text-gray-500 dark:text-neutral-400">
                      • {weather.humidity}% {t("weather.humidity")}
                    </span>
                  </div>
                )}
              </div>
              {/* Logo */}
              <div className="flex-shrink-0 flex flex-col items-center">
                <a
                  href="https://bolt.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:scale-105 transition-transform duration-200"
                >
                  {/* Logo cho chế độ sáng */}
                  <img
                    src="/bolttag/black_circle_360x360.png"
                    alt="SafeConnect Logo - Powered by Bolt.new"
                    className="w-20 h-20 dark:hidden cursor-pointer"
                  />
                  {/* Logo cho chế độ tối */}
                  <img
                    src="/bolttag/white_circle_360x360.png"
                    alt="SafeConnect Logo - Powered by Bolt.new"
                    className="w-20 h-20 hidden dark:block cursor-pointer"
                  />
                </a>
                {/* Powered by Bolt.new link */}
                <a
                  href="https://bolt.new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  Powered by Bolt.new
                </a>
              </div>
            </div>
          </div>

          {/* Location below greeting */}
          <div>
            {locationLoading ? (
              <div className="flex items-center gap-1 text-gray-500 dark:text-neutral-400">
                <MapPin className="w-4 h-4 animate-pulse" />
                <span className="text-sm">{t("location.loading")}</span>
              </div>
            ) : currentLocation ? (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{currentLocation}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-8">
        {/* Emergency Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">
            {t("home.emergency_help")}
          </h1>
          <p className="text-gray-600 dark:text-neutral-400 mb-8">
            {t("home.call_button")}
          </p>

          {/* Emergency Button - Mobile uses Drawer, Desktop uses Dialog */}
          {isMobile ? (
            <Drawer open={sosDialogOpen} onOpenChange={setSOSDialogOpen}>
              <DrawerTrigger asChild>
                <div className="flex flex-col items-center justify-center select-none">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                    <motion.button
                      onClick={() => {
                        if (!profile) {
                          navigate("/login");
                        } else {
                          setSOSDialogOpen(true);
                        }
                      }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full h-full rounded-full bg-red-500 text-white shadow-xl focus:outline-none cursor-pointer"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "#dc2626",
                      }} /* bg-red-600 */
                      aria-label={t("home.sos_button")}
                    >
                      <PhoneCall size={36} className="mb-1" />
                      <span className="text-sm font-semibold tracking-wider">
                        {t("home.sos_button")}
                      </span>
                    </motion.button>
                    <motion.div
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.3, 0.6] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 z-0 w-full h-full bg-red-400 rounded-full pointer-events-none"
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {t("home.tap_for_help")}
                  </p>
                </div>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh] px-4 pb-8">
                <DrawerHeader className="pb-2 px-0">
                  <DrawerTitle>{t("sos.sendRequest")}</DrawerTitle>
                </DrawerHeader>
                <div className="px-0 pb-0">
                  <SOSFormContentComponent
                    sosForm={sosForm}
                    setSOSForm={setSOSForm}
                    handleSOSSubmit={handleSOSSubmit}
                    servicesApiKey={servicesApiKey}
                    setSOSImages={setSOSImages}
                    handleClearForm={handleClearForm}
                  />
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog open={sosDialogOpen} onOpenChange={setSOSDialogOpen}>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center justify-center select-none">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36">
                    <motion.button
                      onClick={() => {
                        if (!profile) {
                          navigate("/login");
                        } else {
                          setSOSDialogOpen(true);
                        }
                      }}
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center w-full h-full rounded-full bg-red-500 text-white shadow-xl focus:outline-none cursor-pointer"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "#dc2626",
                      }} /* bg-red-600 */
                      aria-label={t("home.sos_button")}
                    >
                      <PhoneCall size={36} className="mb-1" />
                      <span className="text-sm font-semibold tracking-wider">
                        {t("home.sos_button")}
                      </span>
                    </motion.button>
                    <motion.div
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.3, 0.6] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 z-0 w-full h-full bg-red-400 rounded-full pointer-events-none"
                    />
                  </div>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    {t("home.tap_for_help")}
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent className="mx-2 max-w-[calc(100vw-1rem)] sm:max-w-lg h-fit max-h-[95vh] rounded-t-3xl sm:rounded-lg border-0 p-0">
                <div className="p-4 sm:p-6 h-full flex flex-col">
                  <DialogHeader>
                    <DialogTitle>{t("sos.sendRequest")}</DialogTitle>
                  </DialogHeader>
                  <SOSFormContentComponent
                    sosForm={sosForm}
                    setSOSForm={setSOSForm}
                    handleSOSSubmit={handleSOSSubmit}
                    servicesApiKey={servicesApiKey}
                    setSOSImages={setSOSImages}
                    handleClearForm={handleClearForm}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">
            {t("home.not_sure")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4">
            {t("home.pick_subject")}
          </p>

          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="outline"
              className="p-4 h-auto justify-start bg-white dark:bg-[#232329] border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
              onClick={() => navigate("/community")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                </div>
                <span className="text-gray-900 dark:text-neutral-100">
                  {t("home.join_community")}
                </span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="p-4 h-auto justify-start bg-white dark:bg-[#232329] border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800"
              onClick={() => navigate("/support-points")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600 dark:text-green-300" />
                </div>
                <span className="text-gray-900 dark:text-neutral-100">
                  {t("home.find_support")}
                </span>
              </div>
            </Button>
          </div>
        </div>

        {/* Status and History Sections */}
        <div className="space-y-6">
          {/* Volunteer Status */}
          {profile && (
            <div className="bg-white dark:bg-[#18181b] rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-neutral-100">
                      {t("home.volunteer_mode")}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-neutral-400">
                      {profile.is_volunteer_ready
                        ? t("home.ready_to_help")
                        : t("home.turned_off")}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={profile.is_volunteer_ready}
                  onCheckedChange={handleToggleVolunteer}
                  variant="success"
                />
              </div>
            </div>
          )}

          {/* Recent Requests - Only show for authenticated users */}
          {profile && (
            <div className="bg-white dark:bg-[#18181b] rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h4 className="font-medium text-gray-900 dark:text-neutral-100">
                  {t("home.recent_requests")}
                </h4>
              </div>
              {recentRequests.length > 0 ? (
                <div className="space-y-2">
                  {recentRequests.slice(0, 2).map((request: SosRequest) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#232329] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                          {translateRequestType(request.type)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-neutral-400">
                          {request.created_at
                            ? new Date(request.created_at).toLocaleDateString(
                                "vi-VN"
                              )
                            : ""}
                        </p>
                      </div>
                      {(() => {
                        const statusInfo = getRequestStatusInfo(
                          request.status,
                          t
                        );
                        return (
                          <Badge
                            variant={statusInfo.variant}
                            className={
                              statusInfo.className +
                              " " +
                              (request.status === "completed"
                                ? "dark:bg-green-700 dark:text-white dark:border-green-800"
                                : request.status === "processing" ||
                                  request.status === "in_progress"
                                ? "dark:bg-blue-700 dark:text-white dark:border-blue-800"
                                : request.status === "pending"
                                ? "dark:bg-yellow-700 dark:text-white dark:border-yellow-800"
                                : request.status === "cancelled"
                                ? "dark:bg-gray-700 dark:text-white dark:border-gray-800"
                                : request.status === "failed"
                                ? "dark:bg-red-700 dark:text-white dark:border-red-800"
                                : "dark:bg-gray-700 dark:text-white dark:border-gray-800")
                            }
                          >
                            {statusInfo.text}
                          </Badge>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {t("home.no_requests")}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => navigate("/history")}
              >
                {t("home.view_all")}
              </Button>
            </div>
          )}

          {/* Recent Helps */}
          {profile?.is_volunteer_ready && (
            <div className="bg-white dark:bg-[#18181b] rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-green-600 dark:text-green-300" />
                <h4 className="font-medium text-gray-900 dark:text-neutral-100">
                  {t("home.recent_helps")}
                </h4>
              </div>
              {recentHelps.length > 0 ? (
                <div className="space-y-2">
                  {recentHelps.slice(0, 2).map((help: SosRequest) => (
                    <div
                      key={help.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#232329] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-neutral-100">
                          {translateRequestType(help.type)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-neutral-400">
                          {help.created_at
                            ? new Date(help.created_at).toLocaleDateString(
                                "vi-VN"
                              )
                            : ""}
                        </p>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-green-600 dark:bg-green-700 dark:text-white dark:border-green-800"
                      >
                        {t("home.helped")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {t("home.no_helps")}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => navigate("/history")}
              >
                {t("home.view_all")}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Access to Map */}
        <div className="mt-8">
          <Button
            onClick={() => navigate("/map")}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t("home.view_rescue_map")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
