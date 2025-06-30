import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  User,
  Users,
  MapPin,
  BadgeCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import ImageUpload from "@/components/ImageUpload";
import HashtagInput from "@/components/HashtagInput";
import CommentSection from "@/components/CommentSection";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
import GoongMapSearch from "@/components/GoongMapSearch";
import { useGoongMapsApiKey } from "@/hooks/useGoongMapsApiKey";

interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  images: string[];
  created_at: string;
  likes_count: number;
  comments_count: number;
  privacy_level: string;
  hashtags: string[] | null;
  tagged_users?: string[];
  tagged_users_profiles?: Array<{
    id: string;
    name: string;
    avatar_url: string | null;
  }>;
  profiles: {
    name: string;
    avatar_url: string | null;
    is_verified: boolean | null;
    id?: string;
    is_admin?: boolean;
  } | null;
  post_likes?: Array<{ user_id: string }>;
  location?: string | null;
}

const POSTS_PER_PAGE = 10;

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

// Audio for delete sound
const deleteSound = new Audio("/sounds/delete.mp3");
deleteSound.preload = "none";
deleteSound.muted = true;
deleteSound.setAttribute("playsinline", "true");
deleteSound.setAttribute("webkit-playsinline", "true");
deleteSound.style.display = "none";
deleteSound.style.position = "absolute";
deleteSound.style.left = "-9999px";
deleteSound.style.top = "-9999px";
deleteSound.style.width = "0";
deleteSound.style.height = "0";
deleteSound.style.opacity = "0";
deleteSound.style.pointerEvents = "none";

// Audio for post success sound
const postSuccessSound = new Audio("/sounds/postdone.mp3");
postSuccessSound.preload = "none";
postSuccessSound.muted = true;
postSuccessSound.setAttribute("playsinline", "true");
postSuccessSound.setAttribute("webkit-playsinline", "true");
postSuccessSound.style.display = "none";
postSuccessSound.style.position = "absolute";
postSuccessSound.style.left = "-9999px";
postSuccessSound.style.top = "-9999px";
postSuccessSound.style.width = "0";
postSuccessSound.style.height = "0";
postSuccessSound.style.opacity = "0";
postSuccessSound.style.pointerEvents = "none";

// Skeleton component for post loading
// Skeleton component for post loading - Updated for responsiveness
const PostSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-3 mb-4">
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>

        {/* Hashtags skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-16 bg-gray-200 rounded" />
          <div className="h-6 w-16 bg-gray-200 rounded" />
        </div>

        {/* Images skeleton */}
        {/* Responsive Images skeleton - assuming 2 placeholders */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2 mb-4">
          <div className="aspect-video bg-gray-200 rounded" />
          <div className="aspect-video bg-gray-200 rounded" />
        </div>

        {/* Actions skeleton */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex space-x-2 sm:space-x-4">
            <div className="h-8 w-16 bg-gray-200 rounded" />
            <div className="h-8 w-16 bg-gray-200 rounded" />
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Create Post Form Skeleton
// Create Post Form Skeleton - Updated for responsiveness
const CreatePostSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="h-24 bg-gray-200 rounded animate-pulse" />
      <div className="h-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      <div className="flex items-center justify-between">
        <div className="h-10 w-full sm:w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-full sm:w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

// Thêm SVG icon admin
const ShieldUserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-shield-user-icon lucide-shield-user ml-1 text-red-500 ${
      props.className || ""
    }`}
    {...props}
  >
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
    <circle cx="12" cy="11" r="4" />
  </svg>
);

const Community: React.FC = () => {
  const { user } = useAuth(); // Removed 'profile' as it's not used in this component
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { playSound } = useSound();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [postPrivacy, setPostPrivacy] = useState("public");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postHashtags, setPostHashtags] = useState<string[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<
    { id: string; name: string; avatar_url: string | null }[]
  >([]);
  const [tagSearch, setTagSearch] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<
    { id: string; name: string; avatar_url: string | null }[]
  >([]);

  // Edit post state
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editHashtags, setEditHashtags] = useState<string[]>([]);
  const [editPrivacy, setEditPrivacy] = useState("public");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const { servicesApiKey } = useGoongMapsApiKey();
  const [postLocation, setPostLocation] = useState<string>("");

  const [openMapDialog, setOpenMapDialog] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = useCallback(async (offset = 0, limit = POSTS_PER_PAGE) => {
    try {
      setLoading(offset === 0);
      setLoadingMore(offset > 0);

      const { data, error } = await supabase
        .from("community_posts")
        .select(
          "*, profiles(name, avatar_url, is_verified, id), post_likes(user_id)"
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Lấy danh sách user_id của các post
      const userIds = (data || []).map((post) => post.user_id);
      // Query bảng admin_users để lấy user admin
      let adminMap: Record<string, boolean> = {};
      if (userIds.length > 0) {
        const { data: adminUsers } = await supabase
          .from("admin_users")
          .select("user_id")
          .in("user_id", userIds);
        if (adminUsers) {
          adminMap = Object.fromEntries(
            adminUsers.map((u) => [u.user_id, true])
          );
        }
      }

      const processedData: CommunityPost[] = (data || []).map((post) => ({
        ...post,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        privacy_level: post.privacy_level || "public",
        hashtags: post.hashtags || [],
        tagged_users_profiles: [],
        images: Array.isArray(post.images) ? post.images : [],
        location:
          typeof (post as { location?: string }).location === "string"
            ? (post as { location?: string }).location
            : null,
        created_at: typeof post.created_at === "string" ? post.created_at : "",
        profiles: post.profiles
          ? { ...post.profiles, is_admin: adminMap[post.user_id] || false }
          : null,
      }));

      // Fetch tagged users for each post separately
      for (const post of processedData) {
        if (post.tagged_users && post.tagged_users.length > 0) {
          const { data: taggedData, error: taggedError } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .in("id", post.tagged_users);

          if (taggedError) {
            console.error(
              `Error fetching tagged users for post ${post.id}:`,
              taggedError
            );
            continue;
          }

          post.tagged_users_profiles = taggedData || [];
        }
      }

      if (offset === 0) {
        setPosts(processedData);
      } else {
        setPosts((prev) => [...prev, ...processedData]);
      }

      setHasMore((data || []).length === limit);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.dismiss();
      toast.error(t("community.error_fetching_posts"));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(posts.length);
    }
  }, [posts.length, loadingMore, hasMore]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !==
          document.documentElement.offsetHeight ||
        loadingMore
      ) {
        return;
      }
      loadMorePosts();
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMorePosts, loadingMore]);

  const handleHashtagClick = (hashtag: string) => {
    const cleanHashtag = hashtag.replace("#", "");
    navigate(`/hashtag/${cleanHashtag}`);
  };

  const renderContentWithHashtags = (content: string) => {
    const hashtagRegex = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = hashtagRegex.exec(content)) !== null) {
      // Add text before hashtag
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Add hashtag as clickable element
      const hashtag = match[0];
      parts.push(
        <span
          key={`hashtag-${keyIndex++}`}
          className="text-blue-500 cursor-pointer hover:underline font-medium"
          onClick={(e) => {
            e.stopPropagation();
            handleHashtagClick(hashtag);
          }}
        >
          {hashtag}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last hashtag
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.dismiss();
      toast.error(t("community.login_required"));
      return;
    }

    try {
      const existingLike = posts
        .find((p) => p.id === postId)
        ?.post_likes?.find((l) => l.user_id === user?.id);

      if (existingLike) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Update local state to reflect the unlike action
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  post_likes:
                    post.post_likes?.filter(
                      (like) => like.user_id !== user.id
                    ) || [],
                  likes_count: (post.likes_count || 0) - 1,
                }
              : post
          )
        );
      } else {
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
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
                    { user_id: user.id },
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
      toast.dismiss();
      toast.error(t("community.error_handling_like"));
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.trim()) return;

    try {
      // Extract hashtags from the post content
      const hashtags =
        newPost.match(/#\w+/g)?.map((tag) => tag.substring(1)) || [];

      // Create an array of tagged user IDs
      const taggedUserIds = taggedUsers.map((user) => user.id);

      const { data, error } = await supabase
        .from("community_posts")
        .insert([
          {
            user_id: user.id,
            content: newPost,
            images: postImages,
            hashtags,
            tagged_users: taggedUserIds.length > 0 ? taggedUserIds : null,
            privacy_level: postPrivacy,
            location: postLocation || null,
          },
        ])
        .select(
          "*, profiles(name, avatar_url, is_verified), post_likes(user_id)"
        )
        .single();

      if (error) throw error;

      // Fetch tagged users for the new post if any
      let taggedProfiles: Array<{
        id: string;
        name: string;
        avatar_url: string | null;
      }> = [];
      if (taggedUserIds.length > 0) {
        const { data: taggedData, error: taggedError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", taggedUserIds);

        if (taggedError) {
          console.error(
            "Error fetching tagged users for new post:",
            taggedError
          );
        } else {
          taggedProfiles = taggedData || [];
        }
      }

      // Construct the post object to match CommunityPost interface
      const newPostData: CommunityPost = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        images: data.images || [],
        created_at: data.created_at || new Date().toISOString(),
        likes_count: data.likes_count || 0,
        comments_count: data.comments_count || 0,
        privacy_level: data.privacy_level || "public",
        hashtags: data.hashtags || [],
        tagged_users: (data as { tagged_users?: string[] }).tagged_users || [],
        tagged_users_profiles: taggedProfiles,
        profiles: data.profiles || null,
        post_likes: data.post_likes || [],
        location: (data as { location?: string }).location || null,
      };

      // Prepend the new post to existing posts
      setPosts((prevPosts) => [newPostData, ...prevPosts]);
      setNewPost("");
      setPostImages([]);
      setTaggedUsers([]);
      setPostLocation("");
      toast.dismiss();
      toast.success(t("community.post_created"));

      // Play post success sound
      playSound(postSuccessSound);
    } catch (error) {
      console.error("Error creating post:", error);
      toast.dismiss();
      toast.error(t("community.error_creating_post"));
    }
  };

  const handleEditPost = (post: CommunityPost) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditImages(post.images || []);
    setEditHashtags(post.hashtags || []);
    setEditPrivacy(post.privacy_level);
    setEditDialogOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editContent.trim()) {
      toast.dismiss();
      toast.error(t("community.post_content_required"));
      return;
    }

    try {
      const { error } = await supabase
        .from("community_posts")
        .update({
          content: editContent.trim(),
          privacy_level: editPrivacy,
          images: editImages.length > 0 ? editImages : [],
          hashtags: editHashtags.length > 0 ? editHashtags : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPost.id);

      if (error) throw error;

      toast.dismiss();
      toast.success(t("community.post_updated"));
      setEditDialogOpen(false);
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error("Error updating post:", error);
      toast.dismiss();
      toast.error(t("community.error_updating_post"));
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      if (!user) {
        toast.dismiss();
        toast.error(t("community.login_required"));
        return;
      }
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;
      setPosts(posts.filter((post) => post.id !== postId));
      toast.dismiss();
      toast.success(t("community.post_deleted"));

      // Play delete sound
      playSound(deleteSound);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.dismiss();
      toast.error(t("community.error_deleting_post"));
    }
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return t("community.unknown_time");
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === "vi" ? vi : enUS,
    });
  };

  const isPostLikedByUser = (post: CommunityPost) => {
    return user && post.post_likes?.some((like) => like.user_id === user.id);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
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

  // Handle mouse swipe for desktop
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

  // Handle touch swipe for mobile
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

  const [selectedPostImages, setSelectedPostImages] = useState<string[] | null>(
    null
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        (window as Window & { opera?: string }).opera ||
        "";
      const isOpera =
        typeof (window as Window & { opera?: string }).opera !== "undefined" ||
        navigator.userAgent.indexOf(" OPR/") >= 0;
      setIsMobile(
        /android|iPad|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        ) || isOpera
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchUserSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .order("name", { ascending: true })
        .limit(10);

      if (error) throw error;

      setUserSuggestions(data || []);
    } catch (error) {
      console.error("Error fetching user suggestions:", error);
    }
  };

  const addTaggedUser = (user: {
    id: string;
    name: string;
    avatar_url: string | null;
  }) => {
    setTaggedUsers((prev) => [...prev, user]);
    setTagSearch("");
  };

  const removeTaggedUser = (userId: string) => {
    setTaggedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  return (
    <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6 pb-8">
      {/* Notification for unauthenticated users */}
      {!user && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-800 font-medium">
            {t("community.login_required")}
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="mt-2 bg-red-500 hover:bg-red-600 text-white"
          >
            {t("auth.login")}
          </Button>
        </div>
      )}
      {/* Create Post */}
      {user &&
        (loading ? (
          <CreatePostSkeleton />
        ) : (
          <Card className="bg-white dark:bg-[#18181b] dark:border-neutral-700">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                {t("community.create_post")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={t("community.post_placeholder")}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                rows={3}
                className="resize-none mb-3 bg-white dark:bg-[#232329] border border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
              />
              {/* Tag people who helped */}
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                  <span className="text-sm text-gray-500 dark:text-neutral-400">
                    {t("community.tag_people")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {taggedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                    >
                      <span>{user.name}</span>
                      <button
                        onClick={() => removeTaggedUser(user.id)}
                        className="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder={t("community.search_users")}
                    className="w-full p-2 border border-gray-300 dark:border-neutral-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#232329] text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500"
                    onFocus={fetchUserSuggestions}
                  />
                  {tagSearch && userSuggestions.length > 0 && (
                    <div className="absolute w-full mt-1 bg-white dark:bg-[#232329] border border-gray-300 dark:border-neutral-700 rounded shadow-lg max-h-60 overflow-auto z-10">
                      {userSuggestions
                        .filter(
                          (user) =>
                            user.name
                              .toLowerCase()
                              .includes(tagSearch.toLowerCase()) &&
                            !taggedUsers.some((tagged) => tagged.id === user.id)
                        )
                        .map((user) => (
                          <div
                            key={user.id}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer text-sm flex items-center space-x-2 text-gray-900 dark:text-neutral-100"
                            onClick={() => addTaggedUser(user)}
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage
                                src={user.avatar_url ?? ""}
                                alt={user.name || "User"}
                              />
                              <AvatarFallback>
                                {user.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Location input */}
              <div className="mb-3">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-neutral-400" />
                  <span className="text-sm text-gray-500 dark:text-neutral-400">
                    {t("community.location")}
                  </span>
                </div>
                {servicesApiKey && (
                  <GoongMapSearch
                    map={null}
                    mapsApiKey={servicesApiKey}
                    servicesApiKey={servicesApiKey}
                    onLocationSelect={(location) =>
                      setPostLocation(location.address)
                    }
                  />
                )}
                {!servicesApiKey && (
                  <input
                    type="text"
                    value={postLocation}
                    onChange={(e) => setPostLocation(e.target.value)}
                    placeholder={t("community.location_placeholder")}
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              <ImageUpload
                onImagesChange={(images) => setPostImages(images)}
                initialImageUrls={postImages}
              />

              <HashtagInput
                hashtags={postHashtags}
                onHashtagsChange={setPostHashtags}
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <Select value={postPrivacy} onValueChange={setPostPrivacy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      {t("community.public")}
                    </SelectItem>
                    <SelectItem value="private">
                      {t("community.private")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleCreatePost}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                  disabled={!newPost.trim()}
                >
                  {t("community.post")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Posts Feed */}
      <div className="space-y-4">
        {loading
          ? // Show skeleton loading for initial posts
            Array.from({ length: 3 }).map((_, index) => (
              <PostSkeleton key={index} />
            ))
          : (posts as CommunityPost[]).map((p) => (
              <Card
                key={p.id}
                className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md rounded-xl bg-white dark:bg-[#18181b] dark:border-neutral-700 dark:shadow-lg backdrop-blur-sm"
              >
                <CardHeader className="p-3 md:p-4 border-b border-border/50 bg-background/50 dark:bg-[#232329] dark:border-neutral-700 relative overflow-visible">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0 mr-2"
                      onClick={() => handleUserClick(p.user_id)}
                    >
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border border-border/50 dark:border-neutral-700 shadow-sm">
                        <AvatarImage
                          src={p.profiles?.avatar_url ?? ""}
                          alt={p.profiles?.name || "User"}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          <User className="w-5 h-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[320px]">
                            {p.profiles?.name || "Ẩn danh"}
                          </span>
                          {p.profiles?.is_admin && (
                            <ShieldUserIcon className="w-4 h-4 min-w-[16px] min-h-[16px] flex-shrink-0" />
                          )}
                          {p.profiles?.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-red-500 min-w-[16px] min-h-[16px] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">
                          {formatTimeAgo(p.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0">
                      {user && user.id === p.user_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === p.id ? null : p.id);
                          }}
                          className="hover:bg-gray-100 dark:hover:bg-neutral-800"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      )}
                      <AnimatePresence>
                        {menuOpen === p.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="absolute right-0 top-10 w-48 bg-white dark:bg-[#232329] border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg z-[9999] dark:text-neutral-100"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPost(p);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left justify-start hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900 dark:text-blue-400"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {t("community.edit_post")}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePost(p.id);
                                setMenuOpen(null);
                              }}
                              className="w-full text-left justify-start hover:bg-red-100 text-red-600 dark:hover:bg-red-900 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("community.delete_post")}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <p className="text-gray-800 dark:text-neutral-100 text-base leading-relaxed whitespace-pre-line">
                    {renderContentWithHashtags(p.content)}
                  </p>
                  {p.location && (
                    <div
                      className="flex items-center gap-2 mt-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      onClick={() => {
                        setSelectedAddress(p.location!);
                        setOpenMapDialog(true);
                      }}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{p.location}</span>
                    </div>
                  )}
                  {p.hashtags && p.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.hashtags.map((hashtag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 cursor-pointer"
                          onClick={() => handleHashtagClick(hashtag)}
                        >
                          #{hashtag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {p.tagged_users_profiles &&
                    p.tagged_users_profiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center text-sm text-gray-600 dark:text-blue-400">
                        <span className="mr-1">
                          {t("community.tagged_users")}
                        </span>
                        {p.tagged_users_profiles.map((taggedUser, index) => (
                          <span
                            key={taggedUser.id}
                            className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline mr-2"
                            onClick={() => handleUserClick(taggedUser.id)}
                          >
                            {taggedUser.name}
                            {index < p.tagged_users_profiles!.length - 1
                              ? ","
                              : ""}
                          </span>
                        ))}
                      </div>
                    )}
                </CardHeader>
                {p.images && p.images.length > 0 && (
                  <CardContent className="p-0 relative bg-black dark:bg-black overflow-hidden border-b border-border/50 dark:border-neutral-700">
                    <div className="relative w-full h-auto min-h-[120px] sm:min-h-[180px] md:min-h-[240px] overflow-hidden bg-white dark:bg-black">
                      {/* Thiết kế lại hiển thị ảnh, không dùng carousel */}
                      {p.images.length === 1 && (
                        <img
                          src={p.images[0]}
                          alt="Post image"
                          className="w-full h-auto max-h-130 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                          onClick={() => openImageSlider(p.images, 0)}
                        />
                      )}
                      {p.images.length === 2 && (
                        <div className="grid grid-cols-2 gap-1">
                          {p.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-85 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                              onClick={() => openImageSlider(p.images, idx)}
                            />
                          ))}
                        </div>
                      )}
                      {p.images.length === 3 && (
                        <div className="grid grid-cols-3 gap-1">
                          <img
                            src={p.images[0]}
                            alt="Post image 1"
                            className="col-span-2 w-full h-auto object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                            onClick={() => openImageSlider(p.images, 0)}
                          />
                          <div className="flex flex-col gap-1">
                            <img
                              src={p.images[1]}
                              alt="Post image 2"
                              className="w-full h-29 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                              onClick={() => openImageSlider(p.images, 1)}
                            />
                            <img
                              src={p.images[2]}
                              alt="Post image 3"
                              className="w-full h-29 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                              onClick={() => openImageSlider(p.images, 2)}
                            />
                          </div>
                        </div>
                      )}
                      {p.images.length > 3 && (
                        <div className="grid grid-cols-2 grid-rows-2 gap-1">
                          {p.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-85 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                              onClick={() => openImageSlider(p.images, idx)}
                            />
                          ))}
                          <div className="relative w-auto h-auto">
                            <img
                              src={p.images[3]}
                              alt="Post image 4"
                              className="w-full h-85 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                              onClick={() => openImageSlider(p.images, 3)}
                            />
                            {p.images.length > 4 && (
                              <div
                                className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg text-white text-lg font-bold cursor-pointer"
                                onClick={() => openImageSlider(p.images, 3)}
                              >
                                +{p.images.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
                <CardFooter className="flex flex-col items-start p-4 relative overflow-hidden bg-background/50 dark:bg-[#232329] border-t border-border/50 dark:border-neutral-700">
                  <div className="flex justify-between items-center w-full mb-2 text-muted-foreground text-sm">
                    <div className="flex space-x-4 items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-gray-500 dark:text-neutral-300 ${
                          isPostLikedByUser(p)
                            ? "text-red-500 dark:text-red-400"
                            : ""
                        } hover:bg-transparent active:bg-transparent focus:outline-none`}
                        style={{ pointerEvents: "auto" }}
                        disabled={!user}
                        onClick={() => handleLike(p.id)}
                      >
                        <Heart className="w-5 h-5 mr-1" />
                        <span>
                          {t("community.likes")} ({p.likes_count})
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 dark:text-neutral-300 hover:text-blue-500 dark:hover:text-blue-400"
                        onClick={() =>
                          setExpandedPostId(
                            expandedPostId === p.id ? null : p.id
                          )
                        }
                      >
                        <MessageSquare className="w-5 h-5 mr-1" />
                        <span>
                          {t("community.comments")} ({p.comments_count})
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardFooter>
                {expandedPostId === p.id && (
                  <CardContent className="p-4 border-t dark:border-neutral-700 bg-white dark:bg-[#18181b]">
                    <CommentSection
                      postId={p.id}
                      onCommentAdded={() => {
                        setPosts((prev) =>
                          prev.map((post) =>
                            post.id === p.id
                              ? {
                                  ...post,
                                  comments_count:
                                    (post.comments_count || 0) + 1,
                                }
                              : post
                          )
                        );
                      }}
                    />
                  </CardContent>
                )}
              </Card>
            ))}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
          </div>
        )}

        {posts.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">{t("community.no_posts")}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Slider for viewing images in full screen */}
      {selectedPostImages &&
        selectedImageIndex !== null &&
        (isMobile ? (
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
        ) : (
          <Dialog
            open={true}
            onOpenChange={(open) => !open && closeImageSlider()}
          >
            <DialogContent className="h-screen bg-black border-none p-0 max-w-full transition-all duration-300">
              <DialogHeader className="hidden">
                <DialogTitle>Image Viewer</DialogTitle>
              </DialogHeader>
              <div
                className="fixed inset-0 bg-transparent z-50 flex flex-col items-center justify-center transition-opacity duration-300"
                onClick={closeImageSlider}
              >
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPreviousImage();
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>

                <div
                  className="max-w-5xl w-full h-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  <img
                    src={selectedPostImages[selectedImageIndex]}
                    alt={`Post image ${selectedImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain transition-all duration-300"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextImage();
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>

                <div className="absolute bottom-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full z-10">
                  {selectedImageIndex + 1} / {selectedPostImages.length}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}

      {/* Edit Post Dialog / Drawer */}
      {isDesktop ? (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-lg p-4 md:p-6">
            <DialogHeader>
              <DialogTitle>{t("community.edit_post")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder={t("community.post_placeholder")}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
              />
              <ImageUpload
                onImagesChange={setEditImages}
                initialImageUrls={editImages}
              />
              <HashtagInput
                hashtags={editHashtags}
                onHashtagsChange={setEditHashtags}
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 pt-4">
              <Select value={editPrivacy} onValueChange={setEditPrivacy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    {t("community.public")}
                  </SelectItem>
                  <SelectItem value="private">
                    {t("community.private")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  {t("common.close")}
                </Button>
                <Button
                  onClick={handleUpdatePost}
                  disabled={!editContent.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t("community.save_changes")}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{t("community.edit_post")}</DrawerTitle>
              <DrawerDescription>
                {t("community.edit_post_desc")}
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <Textarea
                placeholder={t("community.post_placeholder")}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
              />
              <ImageUpload
                onImagesChange={setEditImages}
                initialImageUrls={editImages}
              />
              <HashtagInput
                hashtags={editHashtags}
                onHashtagsChange={setEditHashtags}
              />
              <Select value={editPrivacy} onValueChange={setEditPrivacy}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    {t("community.public")}
                  </SelectItem>
                  <SelectItem value="private">
                    {t("community.private")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DrawerFooter className="pt-2">
              <Button
                onClick={handleUpdatePost}
                disabled={!editContent.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("community.save_changes")}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">{t("common.close")}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Dialog chọn mở maps */}
      <Dialog open={openMapDialog} onOpenChange={setOpenMapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("community.open_map")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Button
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedAddress || ""
                  )}`,
                  "_blank"
                );
                setOpenMapDialog(false);
              }}
              className="w-full"
            >
              Google Maps
            </Button>
            <Button
              onClick={() => {
                window.open(
                  `https://maps.apple.com/?q=${encodeURIComponent(
                    selectedAddress || ""
                  )}`,
                  "_blank"
                );
                setOpenMapDialog(false);
              }}
              className="w-full"
            >
              Apple Maps
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
