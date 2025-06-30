import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Globe,
  Info,
  Shield,
  BookOpen,
  ArrowLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Download,
  Smartphone,
  MapPin,
  Navigation,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useSound } from "../contexts/SoundContext";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import InstallButtonWrapper from "@/components/InstallButtonWrapper";
import { MockLocationService, MockLocation } from "@/utils/mockLocationService";
import { IPDetectionService, LocationData } from "@/utils/ipDetection";
import toast from "react-hot-toast";

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { isSoundEnabled, toggleSound } = useSound();
  const { theme, setTheme } = useTheme();
  const { canInstall, isStandalone } = usePWAInstall();
  const [visitCount, setVisitCount] = React.useState(0);
  const [mockLocationEnabled, setMockLocationEnabled] = React.useState(false);
  const [mockLocationStatus, setMockLocationStatus] = React.useState<{
    settingEnabled: boolean;
    isUsing: boolean;
    currentLocation: MockLocation | null;
  }>({ settingEnabled: false, isUsing: false, currentLocation: null });
  const [isVietnameseIP, setIsVietnameseIP] = React.useState<boolean>(true);
  const [showMockLocationSetting, setShowMockLocationSetting] =
    React.useState<boolean>(false);

  React.useEffect(() => {
    const count = parseInt(localStorage.getItem("appVisitCount") || "0");
    setVisitCount(count);

    // Detect IP location to determine if should show mock location setting
    const detectIPLocation = async () => {
      try {
        // First check cached location data
        const cachedLocationData = sessionStorage.getItem(
          "detected-location-data"
        );
        if (cachedLocationData) {
          const locationData = JSON.parse(cachedLocationData);
          setIsVietnameseIP(locationData.isVietnam);

          // For Vietnamese IP: disable and hide mock location setting
          // For Foreign IP: load saved settings and show setting
          if (locationData.isVietnam) {
            // Vietnamese IP: force disable and hide
            MockLocationService.setMockLocationSetting(false);
            setMockLocationEnabled(false);
            setMockLocationStatus(
              MockLocationService.getMockLocationStatus(locationData.isVietnam)
            );
            setShowMockLocationSetting(false);
            console.log(
              "[Settings] Vietnamese IP detected - mock location disabled and hidden (cached)"
            );
          } else {
            // Foreign IP: show setting with default disabled state
            setMockLocationEnabled(false);
            setMockLocationStatus(
              MockLocationService.getMockLocationStatus(locationData.isVietnam)
            );
            setShowMockLocationSetting(true);
            console.log(
              "[Settings] Foreign IP detected - mock location setting shown (cached)"
            );
          }
          return;
        }

        // If no cached data, do fresh IP detection
        const locationData = await IPDetectionService.detectLocation();
        if (locationData) {
          setIsVietnameseIP(locationData.isVietnam);
          sessionStorage.setItem(
            "detected-location-data",
            JSON.stringify(locationData)
          );

          // For Vietnamese IP: disable and hide mock location setting
          // For Foreign IP: load saved settings and show setting
          if (locationData.isVietnam) {
            // Vietnamese IP: force disable and hide
            MockLocationService.setMockLocationSetting(false);
            setMockLocationEnabled(false);
            setMockLocationStatus(
              MockLocationService.getMockLocationStatus(locationData.isVietnam)
            );
            setShowMockLocationSetting(false);
            console.log(
              "[Settings] Vietnamese IP detected - mock location disabled and hidden (fresh)"
            );
          } else {
            // Foreign IP: show setting with default disabled state
            setMockLocationEnabled(false);
            setMockLocationStatus(
              MockLocationService.getMockLocationStatus(locationData.isVietnam)
            );
            setShowMockLocationSetting(true);
            console.log(
              "[Settings] Foreign IP detected - mock location setting shown (fresh)"
            );
          }
        } else {
          // Default to foreign IP if detection fails - show mock location setting with default disabled
          setMockLocationEnabled(false);
          setMockLocationStatus(
            MockLocationService.getMockLocationStatus(false)
          );
          setShowMockLocationSetting(true);
          console.log(
            "[Settings] IP detection failed, assuming foreign IP - mock location setting shown"
          );
        }
      } catch (error) {
        console.warn("Failed to detect IP location in Settings:", error);
        // Default to foreign IP if error occurs - show mock location setting with default disabled
        setMockLocationEnabled(false);
        setMockLocationStatus(MockLocationService.getMockLocationStatus(false));
        setShowMockLocationSetting(true);
      }
    };

    detectIPLocation();
  }, []);

  const handleLanguageChange = (language: string) => {
    setLanguage(language as "vi" | "en");
    toast.success(t("settings.language_changed"));
  };

  const handleSoundToggle = () => {
    toggleSound();
    toast.success(
      isSoundEnabled
        ? t("settings.sound_disabled")
        : t("settings.sound_enabled")
    );
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "light" | "dark" | "system");
    toast.success(t("settings.theme_changed"));
  };

  const handleMockLocationToggle = () => {
    // Prevent Vietnamese IP from enabling mock location
    if (isVietnameseIP) {
      toast.error(t("settings.mockLocation_not_allowed"));
      return;
    }

    const newEnabled = !mockLocationEnabled;
    MockLocationService.setMockLocationSetting(newEnabled);
    setMockLocationEnabled(newEnabled);
    setMockLocationStatus(
      MockLocationService.getMockLocationStatus(isVietnameseIP)
    );

    // If disabling, also clear any existing mock location
    if (!newEnabled) {
      MockLocationService.clearMockLocation();
    }

    toast.success(
      newEnabled
        ? t("settings.mockLocation_enabled")
        : t("settings.mockLocation_disabled")
    );
  };

  const getSettingsItems = () => {
    const baseItems = [
      {
        icon: Globe,
        title: t("settings.language_title"),
        description: t("settings.language_desc"),
        action: "language",
        hasArrow: false,
      },
      {
        icon: theme === "dark" ? Moon : theme === "light" ? Sun : Moon,
        title: t("settings.theme_title"),
        description: t("settings.theme_desc"),
        action: "theme",
        hasArrow: false,
      },
      {
        icon: isSoundEnabled ? Volume2 : VolumeX,
        title: t("settings.sound_title"),
        description: t("settings.sound_desc"),
        action: "sound",
        hasArrow: false,
      },
    ];

    // Only add mock location setting for non-Vietnamese IPs or if already using mock location
    if (showMockLocationSetting) {
      baseItems.push({
        icon: mockLocationEnabled ? Navigation : MapPin,
        title: t("settings.mockLocation_title"),
        description: t("settings.mockLocation_desc"),
        action: "mockLocation",
        hasArrow: false,
      });
    }

    // Add remaining items
    baseItems.push(
      {
        icon: Info,
        title: t("settings.about_title"),
        description: t("settings.about_desc"),
        action: "about",
        hasArrow: true,
      },
      {
        icon: Shield,
        title: t("settings.policy_title"),
        description: t("settings.policy_desc"),
        action: "policy",
        hasArrow: true,
      },
      {
        icon: BookOpen,
        title: t("settings.guide_title"),
        description: t("settings.guide_desc"),
        action: "guide",
        hasArrow: true,
      }
    );

    return baseItems;
  };

  const settingsItems = getSettingsItems();

  const handleItemClick = (action: string) => {
    switch (action) {
      case "about":
        navigate("/about");
        break;
      case "policy":
        navigate("/policy");
        break;
      case "guide":
        navigate("/guide");
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t("settings.title")}
            </h1>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-4 space-y-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white">
              {t("settings.general")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsItems.map((item, index) => (
              <div key={index}>
                {item.action === "language" ? (
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <item.icon
                          size={20}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Select
                      value={language}
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">{t("settings.vi")}</SelectItem>
                        <SelectItem value="en">{t("settings.en")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : item.action === "theme" ? (
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                        <item.icon
                          size={20}
                          className="text-purple-600 dark:text-purple-400"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Select value={theme} onValueChange={handleThemeChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          {t("settings.theme_light")}
                        </SelectItem>
                        <SelectItem value="dark">
                          {t("settings.theme_dark")}
                          <span className="ml-2 inline-block align-middle px-2 py-0.5 text-xs font-semibold rounded bg-yellow-300 text-yellow-900 dark:bg-yellow-400 dark:text-yellow-900">
                            beta
                          </span>
                        </SelectItem>
                        <SelectItem value="system">
                          {t("settings.theme_system")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : item.action === "sound" ? (
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                        <item.icon
                          size={20}
                          className="text-green-600 dark:text-green-400"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isSoundEnabled}
                      onCheckedChange={handleSoundToggle}
                    />
                  </div>
                ) : item.action === "mockLocation" ? (
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                        <item.icon
                          size={20}
                          className="text-amber-600 dark:text-amber-400"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                        {mockLocationStatus.isUsing &&
                          mockLocationStatus.currentLocation && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              {t("settings.mockLocation_status_using")}{" "}
                              {mockLocationStatus.currentLocation.address}
                            </p>
                          )}
                      </div>
                    </div>
                    <Switch
                      checked={mockLocationEnabled}
                      onCheckedChange={handleMockLocationToggle}
                    />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleItemClick(item.action)}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg ${
                          index === 3
                            ? "bg-orange-100 dark:bg-orange-900"
                            : index === 4
                            ? "bg-red-100 dark:bg-red-900"
                            : "bg-indigo-100 dark:bg-indigo-900"
                        }`}
                      >
                        <item.icon
                          size={20}
                          className={
                            index === 3
                              ? "text-orange-600 dark:text-orange-400"
                              : index === 4
                              ? "text-red-600 dark:text-red-400"
                              : "text-indigo-600 dark:text-indigo-400"
                          }
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    {item.hasArrow && (
                      <ChevronRight
                        size={20}
                        className="text-gray-400 dark:text-gray-500"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PWA Install Section */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              {t("settings.pwa_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isStandalone ? (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-green-600 dark:text-green-400">
                  {t("settings.pwa_installed")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("settings.pwa_installed_desc")}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {t("settings.pwa_installed_count")} {visitCount}
                </div>
              </div>
            ) : canInstall ? (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {t("settings.pwa_install_title")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("settings.pwa_install_desc")}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {t("settings.pwa_installed_count")} {visitCount}
                  </div>
                </div>
                <div className="flex justify-center">
                  <InstallButtonWrapper />
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    {t("settings.pwa_install_benefit_title")}
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• {t("settings.pwa_install_benefit_1")}</li>
                    <li>• {t("settings.pwa_install_benefit_2")}</li>
                    <li>• {t("settings.pwa_install_benefit_3")}</li>
                    <li>• {t("settings.pwa_install_benefit_4")}</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-600 dark:text-gray-400">
                  {t("settings.pwa_install_unavailable")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {t("settings.pwa_install_unavailable_desc")}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {t("settings.pwa_installed_count")} {visitCount}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("settings.app_name")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t("settings.version")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {t("settings.copyright")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
