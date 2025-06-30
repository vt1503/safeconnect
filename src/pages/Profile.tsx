import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  User,
  Settings,
  Lock,
  Globe,
  ChevronRight,
  MoreHorizontal,
  MapPin,
  History,
  CheckCircle,
  BadgeCheck,
  UserCircle,
  Settings as SettingsIcon, // Added icons
} from "lucide-react";
import toast from "react-hot-toast";
import AvatarUpload from "@/components/AvatarUpload";
import ChangePassword from "@/components/ChangePassword";
import { useNavigate } from "react-router-dom"; // Added useNavigate

interface UserStats {
  sos_requests: number;
  help_provided: number;
  average_rating: number;
}

// Thêm SVG icon admin
const ShieldUserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-shield-user-icon lucide-shield-user ml-1 ${
      props.className || ""
    }`}
    {...props}
  >
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
    <circle cx="12" cy="11" r="4" />
  </svg>
);

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { profile, logout, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate(); // Initialized navigate
  const [stats, setStats] = useState<UserStats>({
    sos_requests: 0,
    help_provided: 0,
    average_rating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editProfile, setEditProfile] = useState({
    name: profile?.name || "",
    bio: profile?.bio || "",
    location: profile?.location || "",
    marital_status: profile?.marital_status || "",
    birth_date: profile?.birth_date || "",
    privacy_level: profile?.privacy_level || "public",
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return;

      try {
        // Fetch SOS requests count
        const { data: sosData, error: sosError } = await supabase
          .from("sos_requests")
          .select("id")
          .eq("user_id", profile.id);

        if (sosError) throw sosError;

        // Fetch help provided count
        const { data: helpData, error: helpError } = await supabase
          .from("sos_requests")
          .select("id")
          .eq("helper_id", profile.id);

        if (helpError) throw helpError;

        // Fetch ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from("sos_ratings")
          .select("rating")
          .eq("helper_id", profile.id);

        if (ratingsError) throw ratingsError;

        const averageRating =
          ratingsData && ratingsData.length > 0
            ? ratingsData.reduce((sum, r) => sum + r.rating, 0) /
              ratingsData.length
            : 0;

        setStats({
          sos_requests: sosData?.length || 0,
          help_provided: helpData?.length || 0,
          average_rating: averageRating,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profile?.id]);

  useEffect(() => {
    if (profile) {
      setEditProfile({
        name: profile.name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        marital_status: profile.marital_status || "",
        birth_date: profile.birth_date || "",
        privacy_level: profile.privacy_level || "public",
      });
    }
  }, [profile]);

  useEffect(() => {
    // Kiểm tra admin
    const checkAdmin = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", profile.id)
        .single();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [profile?.id]);

  if (!isAuthenticated) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 text-center bg-gray-50 dark:bg-gray-900">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <SettingsIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>
        <UserCircle size={64} className="text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">
          {t("profile.login_required_title")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {t("profile.login_required_desc")}
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate("/login")}>{t("login.title")}</Button>
          <Button variant="outline" onClick={() => navigate("/register")}>
            {t("register.title")}
          </Button>
        </div>
      </div>
    );
  }

  const handleAvatarUpdate = async (url: string) => {
    try {
      const { error } = await updateProfile({ avatar_url: url });

      if (error) {
        toast.error(t("avatar_update_failed"));
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error(t("avatar_update_error"));
    }
  };

  const handleSaveProfile = async () => {
    const saveProfile = async () => {
      // Thêm delay nhỏ để đảm bảo loading state hiển thị
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { error } = await updateProfile(editProfile);
      if (error) {
        throw new Error(error.message);
      }
      return true;
    };

    toast.promise(saveProfile(), {
      loading: t("saving_changes"),
      success: <b>{t("profile_updated")}</b>,
      error: <b>{t("profile_update_failed")}</b>,
    });
  };

  const handleLogout = () => {
    logout();
  };

  const handleMenuItemClick = (action: string) => {
    switch (action) {
      case "password":
        setShowChangePassword(true);
        break;
      case "orders":
        navigate("/history");
        break;
      case "settings":
        navigate("/settings");
        break;
      case "support_points":
        navigate("/my-support-points");
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { icon: User, label: t("my_profile"), action: "profile" },
    { icon: History, label: t("activity_history"), action: "orders" },
    { icon: MapPin, label: t("my-support-points"), action: "support_points" },
    { icon: Settings, label: t("settings"), action: "settings" },
    { icon: Lock, label: t("change_password"), action: "password" },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("loading_user_info")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-700 dark:from-red-800 dark:via-red-700 dark:to-red-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-400 dark:bg-red-600 rounded-full opacity-30"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-red-300 dark:bg-red-500 rounded-full opacity-25"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-red-400 dark:bg-red-600 rounded-full opacity-20"></div>
        <div className="absolute top-20 right-32 w-12 h-12 bg-red-200 dark:bg-red-400 rounded-full opacity-35"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center p-6 text-white">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => handleMenuItemClick("settings")}
          aria-label={t("settings")}
        >
          <MoreHorizontal size={24} />
        </Button>
      </div>

      {/* Profile Section */}
      <div className="relative z-10 flex flex-col items-center px-6 mb-8">
        <div className="mb-4">
          <AvatarUpload
            currentAvatar={profile?.avatar_url}
            userName={profile?.name || ""}
            onAvatarUpdate={handleAvatarUpdate}
          />
        </div>

        <div className="flex items-center space-x-2 mb-1">
          <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
          {isAdmin && (
            <ShieldUserIcon className="w-5 h-5 min-w-[20px] min-h-[20px]" />
          )}
          {profile?.is_verified && (
            <BadgeCheck className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="text-green-100 dark:text-green-200 text-sm text-center mt-1 space-y-0.5 px-4 w-full max-w-xs sm:max-w-sm md:max-w-md">
          {profile?.bio && (
            <p className="truncate" title={profile.bio}>
              {profile.bio}
            </p>
          )}
          {profile?.location && (
            <p
              className="truncate flex items-center justify-center"
              title={profile.location}
            >
              <MapPin size={14} className="inline mr-1.5 flex-shrink-0" />
              {profile.location}
            </p>
          )}
          {!profile?.bio && !profile?.location && (
            <p className="opacity-75">{t("no_bio_or_location")}</p>
          )}
        </div>
      </div>

      {/* Account Overview Card */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-t-3xl flex-1 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {t("account_overview")}
        </h3>

        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.action === "profile" ? (
                <Drawer>
                  <DrawerTrigger asChild>
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          <item.icon
                            size={20}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight
                        size={20}
                        className="text-gray-400 dark:text-gray-500"
                      />
                    </div>
                  </DrawerTrigger>

                  <DrawerContent className="max-h-[90vh]">
                    <DrawerHeader>
                      <DrawerTitle className="dark:text-white">
                        {t("edit_profile")}
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 space-y-4 overflow-y-auto">
                      <div>
                        <Label htmlFor="name" className="dark:text-white">
                          {t("full_name")}
                        </Label>
                        <Input
                          id="name"
                          value={editProfile.name}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="bio" className="dark:text-white">
                          {t("bio")}
                        </Label>
                        <Textarea
                          id="bio"
                          value={editProfile.bio}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              bio: e.target.value,
                            }))
                          }
                          placeholder={t("bio_placeholder")}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="location" className="dark:text-white">
                          {t("location")}
                        </Label>
                        <Input
                          id="location"
                          value={editProfile.location}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              location: e.target.value,
                            }))
                          }
                          placeholder={t("location_placeholder")}
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="maritalStatus"
                          className="dark:text-white"
                        >
                          {t("marital_status")}
                        </Label>
                        <Select
                          value={editProfile.marital_status}
                          onValueChange={(value) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              marital_status: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("select_marital_status")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single">
                              {t("single")}
                            </SelectItem>
                            <SelectItem value="married">
                              {t("married")}
                            </SelectItem>
                            <SelectItem value="other">{t("other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="birthDate" className="dark:text-white">
                          {t("birth_date")}
                        </Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={editProfile.birth_date}
                          onChange={(e) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              birth_date: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="privacy" className="dark:text-white">
                          {t("privacy")}
                        </Label>
                        <Select
                          value={editProfile.privacy_level}
                          onValueChange={(value) =>
                            setEditProfile((prev) => ({
                              ...prev,
                              privacy_level: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">
                              {t("public")}
                            </SelectItem>
                            <SelectItem value="private">
                              {t("private")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleSaveProfile} className="w-full">
                        {t("save_changes")}
                      </Button>
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <div
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleMenuItemClick(item.action)}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-lg ${
                        index === 0
                          ? "bg-blue-100 dark:bg-blue-900"
                          : index === 1
                          ? "bg-green-100 dark:bg-green-900"
                          : index === 2
                          ? "bg-purple-100 dark:bg-purple-900"
                          : index === 3
                          ? "bg-orange-100 dark:bg-orange-900"
                          : "bg-pink-100 dark:bg-pink-900"
                      }`}
                    >
                      <item.icon
                        size={20}
                        className={
                          index === 0
                            ? "text-blue-600 dark:text-blue-400"
                            : index === 1
                            ? "text-green-600 dark:text-green-400"
                            : index === 2
                            ? "text-purple-600 dark:text-purple-400"
                            : index === 3
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-pink-600 dark:text-pink-400"
                        }
                      />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            {t("activity_stats")}
          </h4>
          {loading ? (
            <div className="grid grid-cols-3 gap-4 text-center py-4">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div className="h-6 w-12 mx-auto bg-gray-200 dark:bg-gray-600 animate-pulse rounded-md mb-1"></div>
                  <div className="h-4 w-16 mx-auto bg-gray-100 dark:bg-gray-500 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {stats.sos_requests}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t("sos_requests")}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.help_provided}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t("help_provided")}
                </p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.average_rating > 0
                    ? `${stats.average_rating.toFixed(1)}/5`
                    : "Chưa có"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t("average_rating")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600 pb-6">
          <Button
            onClick={handleLogout}
            className="w-full text-white bg-red-600 border-none hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 dark:text-white transition-colors"
          >
            {t("logout")}
          </Button>
        </div>
      </div>

      {/* Change Password Component */}
      <ChangePassword
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default Profile;
