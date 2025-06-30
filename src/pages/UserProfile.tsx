import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Calendar,
  Users,
  Heart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import CommentSection from "@/components/CommentSection";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  created_at: string | null;
  is_verified: boolean | null;
  reputation: number | null;
}

interface UserPost {
  id: string;
  content: string;
  images: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  hashtags: string[] | null;
  post_likes?: Array<{ user_id: string }>;
}

// Audio for like sound
const likeSound = new Audio("/sounds/like.mp3");
likeSound.preload = "none";
likeSound.muted = true;
likeSound.setAttribute("playsinline", "true");
likeSound.setAttribute("webkit-playsinline", "true");
likeSound.style.display = "none";
likeSound.style.position = "absolute";
likeSound.style.left = "-9999px";
likeSound.style.top = "-9999px";
likeSound.style.width = "0";
likeSound.style.height = "0";
likeSound.style.opacity = "0";
likeSound.style.pointerEvents = "none";

// Thêm SVG icon admin
const ShieldUserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="black"
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

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { playSound } = useSound();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [selectedPostImages, setSelectedPostImages] = useState<string[] | null>(
    null
  );
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [helpCount, setHelpCount] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return t("userProfile.unknownTime");
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === "vi" ? vi : enUS,
    });
  };

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
      fetchHelpCount();
      // Kiểm tra admin
      const checkAdmin = async () => {
        const { data } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", userId)
          .single();
        setIsAdmin(!!data);
      };
      checkAdmin();
    }
  }, [userId]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from("profiles")
        .select(`*`)
        .eq("id", userId ?? "")
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        toast.error(t("toast.userNotFound"));
        return;
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      toast.error(t("toast.userLoadError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      if (!userId) {
        return;
      }
      const { data, error } = await supabase
        .from("community_posts")
        .select(
          "*, post_likes!post_likes_post_id_fkey (user_id), post_comments!post_comments_post_id_fkey (id)"
        )
        .eq("user_id", userId)
        .eq("privacy_level", "public")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(
        data.map((post) => ({
          id: post.id,
          content: post.content,
          images: post.images || [],
          created_at: post.created_at || new Date().toISOString(),
          likes_count: post.post_likes ? post.post_likes.length : 0,
          comments_count: post.post_comments ? post.post_comments.length : 0,
          hashtags: post.hashtags || null,
          post_likes: post.post_likes || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching user posts:", error);
      toast.error(t("toast.postsLoadError"));
    } finally {
      setLoading(false);
    }
  };

  const fetchHelpCount = async () => {
    try {
      const { data, error } = await supabase
        .from("sos_requests")
        .select("id")
        .eq("helper_id", userId ?? "");

      if (error) throw error;
      setHelpCount(data.length);
    } catch (error) {
      console.error("Error fetching help count:", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      toast.error(t("toast.loginRequired"));
      return;
    }

    try {
      const existingLike = posts
        .find((p) => p.id === postId)
        ?.post_likes?.find((l) => l.user_id === currentUser.id);

      if (existingLike) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUser.id);

        if (error) throw error;

        // Update local state to reflect the unlike action
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  post_likes:
                    post.post_likes?.filter(
                      (like) => like.user_id !== currentUser.id
                    ) || [],
                  likes_count: (post.likes_count || 0) - 1,
                }
              : post
          )
        );
      } else {
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: currentUser.id,
        });

        if (error) throw error;

        // Update local state to reflect the like action
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  post_likes: [
                    ...(post.post_likes || []),
                    { user_id: currentUser.id },
                  ],
                  likes_count: (post.likes_count || 0) + 1,
                }
              : post
          )
        );

        // Play like sound only when liking (not unliking)
        playSound(likeSound);
      }
    } catch (error) {
      console.error("Error handling like:", error);
      toast.error(t("toast.actionFailed"));
    }
  };

  const handleCommentToggle = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  const openImageSlider = (postImages: string[], startIndex: number) => {
    setSelectedPostImages(postImages);
    setSelectedImageIndex(startIndex);
  };

  const closeImageSlider = () => {
    setSelectedPostImages(null);
    setSelectedImageIndex(null);
  };

  const goToPreviousImage = () => {
    if (selectedImageIndex !== null && selectedPostImages) {
      setSelectedImageIndex((prev) =>
        prev !== null
          ? prev > 0
            ? prev - 1
            : selectedPostImages.length - 1
          : 0
      );
    }
  };

  const goToNextImage = () => {
    if (selectedImageIndex !== null && selectedPostImages) {
      setSelectedImageIndex((prev) =>
        prev !== null
          ? prev < selectedPostImages.length - 1
            ? prev + 1
            : 0
          : 0
      );
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "left") {
      goToNextImage();
    } else {
      goToPreviousImage();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const startX = e.clientX;
    const handleMouseUp = (e: MouseEvent) => {
      const endX = e.clientX;
      if (startX - endX > 50) {
        handleSwipe("left");
      } else if (endX - startX > 50) {
        handleSwipe("right");
      }
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const startX = e.touches[0].clientX;
    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      if (startX - endX > 50) {
        handleSwipe("left");
      } else if (endX - startX > 50) {
        handleSwipe("right");
      }
      document.removeEventListener("touchend", handleTouchEnd);
    };
    document.addEventListener("touchend", handleTouchEnd);
  };

  if (!userId) {
    return <Navigate to="/community" replace />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-2 md:p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-2 md:p-4 text-center">
        <p className="text-gray-500">{t("userProfile.userNotFound")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-2 sm:px-4 max-w-3xl pb-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6 space-y-4 md:space-y-0">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 mx-auto md:mx-0">
              <AvatarImage
                src={profile.avatar_url ?? ""}
                alt={profile.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xl md:text-2xl">
                {profile.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                <h1 className="text-2xl font-bold">{profile?.name}</h1>
                {isAdmin && (
                  <ShieldUserIcon className="w-5 h-5 min-w-[20px] min-h-[20px]" />
                )}
                {profile?.is_verified && (
                  <BadgeCheck className="w-5 h-5 text-red-500" />
                )}
              </div>

              {profile.bio && (
                <p className="text-sm md:text-base text-gray-700 mb-3">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-sm text-gray-600 mb-3 md:mb-4 space-y-2 md:space-y-0 justify-center md:justify-start">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                  <span>
                    {t("userProfile.memberSince")}{" "}
                    {formatTimeAgo(profile.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  <span>
                    {t("userProfile.helped")}: {helpCount}
                  </span>
                </div>
              </div>

              <div className="flex justify-center md:justify-start space-x-2">
                <Button
                  variant={activeTab === "posts" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("posts")}
                >
                  {t("userProfile.posts")} ({posts.length})
                </Button>
                <Button
                  variant={activeTab === "about" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("about")}
                >
                  {t("userProfile.about")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      {activeTab === "posts" && (
        <div className="space-y-4 md:space-y-6">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center">
              {t("userProfile.noPosts")}
            </p>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handleCommentToggle(post.id)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={profile.avatar_url ?? ""}
                          alt={profile.name}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {profile.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold">
                            {profile?.name || t("userProfile.anonymous")}
                          </p>
                          {isAdmin && (
                            <ShieldUserIcon className="w-4 h-4 min-w-[16px] min-h-[16px]" />
                          )}
                          {profile?.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(post.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 space-y-3">
                    <p className="text-gray-800">{post.content}</p>

                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.map((hashtag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-blue-50 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              /* Add navigation to hashtag */
                            }}
                          >
                            #{hashtag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {post.images && post.images.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-border/50 shadow-sm">
                        {post.images.length === 1 && (
                          <img
                            src={post.images[0]}
                            alt="Post image"
                            className="w-full h-auto max-h-130 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                            onClick={() => openImageSlider(post.images, 0)}
                          />
                        )}
                        {post.images.length === 2 && (
                          <div className="grid grid-cols-2 gap-1">
                            {post.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Post image ${idx + 1}`}
                                className="w-full h-85 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                                onClick={() =>
                                  openImageSlider(post.images, idx)
                                }
                              />
                            ))}
                          </div>
                        )}
                        {post.images.length === 3 && (
                          <div className="grid grid-cols-3 gap-1">
                            <img
                              src={post.images[0]}
                              alt="Post image 1"
                              className="col-span-2 w-full h-auto object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                              onClick={() => openImageSlider(post.images, 0)}
                            />
                            <div className="flex flex-col gap-1">
                              <img
                                src={post.images[1]}
                                alt="Post image 2"
                                className="w-full h-29 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                                onClick={() => openImageSlider(post.images, 1)}
                              />
                              <img
                                src={post.images[2]}
                                alt="Post image 3"
                                className="w-full h-29 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                                onClick={() => openImageSlider(post.images, 2)}
                              />
                            </div>
                          </div>
                        )}
                        {post.images.length > 3 && (
                          <div className="grid grid-cols-2 grid-rows-2 gap-1">
                            {post.images.slice(0, 3).map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Post image ${idx + 1}`}
                                className="w-full h-85 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                                onClick={() =>
                                  openImageSlider(post.images, idx)
                                }
                              />
                            ))}
                            <div className="relative w-auto h-auto">
                              <img
                                src={post.images[3]}
                                alt="Post image 4"
                                className="w-full h-85 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                                onClick={() => openImageSlider(post.images, 3)}
                              />
                              {post.images.length > 4 && (
                                <div
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg text-white text-lg font-bold cursor-pointer"
                                  onClick={() =>
                                    openImageSlider(post.images, 3)
                                  }
                                >
                                  +{post.images.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-gray-500 ${
                          posts
                            .find((p) => p.id === post.id)
                            ?.post_likes?.some(
                              (l) => l.user_id === currentUser?.id
                            )
                            ? "text-red-500"
                            : ""
                        }`}
                        disabled={!currentUser}
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className="w-5 h-5 mr-1" />
                        <span>
                          {t("userProfile.like")} ({post.likes_count})
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-blue-500"
                        onClick={() => handleCommentToggle(post.id)}
                      >
                        <MessageSquare className="w-5 h-5 mr-1" />
                        <span>
                          {t("userProfile.comment")} ({post.comments_count})
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
                {expandedPostId === post.id && (
                  <CardContent className="p-4 border-t">
                    <CommentSection
                      postId={post.id}
                      onCommentAdded={() => {
                        setPosts((prev) =>
                          prev.map((p) =>
                            p.id === post.id
                              ? {
                                  ...p,
                                  comments_count: (p.comments_count || 0) + 1,
                                }
                              : p
                          )
                        );
                      }}
                    />
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "about" && (
        <Card>
          <CardHeader className="p-3 md:p-4 pb-0 md:pb-0">
            {t("userProfile.personalInfo")}
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-1 md:pt-2 space-y-3 md:space-y-4 text-sm md:text-base">
            <div>
              <p className="font-medium text-gray-900 mb-1 md:mb-2">
                {t("userProfile.basicInfo")}
              </p>
              <div className="space-y-1 md:space-y-2 text-gray-700">
                {profile.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                    <span>
                      {t("userProfile.livesIn")} {profile.location}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                  <span>
                    {t("userProfile.memberSince")}{" "}
                    {formatTimeAgo(profile.created_at)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                  <span>
                    {t("userProfile.helped")}: {helpCount}
                  </span>
                </div>
              </div>
            </div>

            {profile.bio && (
              <div>
                <p className="font-medium text-gray-900 mb-1 md:mb-2">
                  {t("userProfile.bio")}
                </p>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Slider Modal for Desktop and Drawer for Mobile */}
      {selectedPostImages && selectedImageIndex !== null && (
        <>
          {/* Desktop: chỉ render Dialog nếu không phải mobile */}
          {!isMobile && (
            <Dialog
              open={true}
              onOpenChange={(open) => !open && closeImageSlider()}
            >
              <DialogContent className="h-screen bg-white/20 dark:bg-[#232329]/30 backdrop-blur-md border border-white/20 dark:border-neutral-700/40 shadow-2xl rounded-xl p-0 max-w-full transition-all duration-300 flex items-center justify-center">
                <div
                  className="w-full h-full flex flex-col items-center justify-center transition-opacity duration-300"
                  onClick={closeImageSlider}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-white hover:bg-black/20 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeImageSlider();
                      }}
                    >
                      <X className="w-8 h-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPreviousImage();
                      }}
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <img
                      src={selectedPostImages[selectedImageIndex]}
                      alt={`Post image ${selectedImageIndex + 1}`}
                      className="max-h-[90vh] max-w-full object-contain rounded-xl mx-auto transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextImage();
                      }}
                    >
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full z-10">
                      {selectedImageIndex + 1} / {selectedPostImages.length}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {/* Mobile: chỉ render Drawer nếu là mobile */}
          {isMobile && (
            <Drawer
              open={true}
              onOpenChange={(open) => !open && closeImageSlider()}
            >
              <DrawerContent className="h-screen bg-white/20 dark:bg-[#232329]/30 backdrop-blur-md border border-white/20 dark:border-neutral-700/40 shadow-2xl rounded-xl transition-all duration-300 flex items-center justify-center p-0">
                <div
                  className="w-full h-full flex flex-col items-center justify-center transition-opacity duration-300"
                  onClick={closeImageSlider}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-4 right-4 text-white hover:bg-black/20 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeImageSlider();
                      }}
                    >
                      <X className="w-8 h-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPreviousImage();
                      }}
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <img
                      src={selectedPostImages[selectedImageIndex]}
                      alt={`Post image ${selectedImageIndex + 1}`}
                      className="max-h-[90vh] max-w-full object-contain rounded-xl mx-auto transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextImage();
                      }}
                    >
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full z-10">
                      {selectedImageIndex + 1} / {selectedPostImages.length}
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          )}
        </>
      )}
    </div>
  );
};

export default UserProfile;
