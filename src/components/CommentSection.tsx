import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  MoreHorizontal,
  Trash2,
  User,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string | null;
  profiles: {
    name: string;
    avatar_url: string | null;
    is_verified: boolean | null;
  };
}

interface CommentSectionProps {
  postId: string;
  initialCommentsCount?: number;
  onCommentAdded?: () => void;
}

// Audio for send comment sound
const sendCommentSound = new Audio("/sounds/sendsound.mp3");
sendCommentSound.preload = "none";
sendCommentSound.muted = true;
sendCommentSound.setAttribute("playsinline", "true");
sendCommentSound.setAttribute("webkit-playsinline", "true");
sendCommentSound.style.display = "none";
sendCommentSound.style.position = "absolute";
sendCommentSound.style.left = "-9999px";
sendCommentSound.style.top = "-9999px";
sendCommentSound.style.width = "0";
sendCommentSound.style.height = "0";
sendCommentSound.style.opacity = "0";
sendCommentSound.style.pointerEvents = "none";

// Audio for delete comment sound
const deleteCommentSound = new Audio("/sounds/delete.mp3");
deleteCommentSound.preload = "none";
deleteCommentSound.muted = true;
deleteCommentSound.setAttribute("playsinline", "true");
deleteCommentSound.setAttribute("webkit-playsinline", "true");
deleteCommentSound.style.display = "none";
deleteCommentSound.style.position = "absolute";
deleteCommentSound.style.left = "-9999px";
deleteCommentSound.style.top = "-9999px";
deleteCommentSound.style.width = "0";
deleteCommentSound.style.height = "0";
deleteCommentSound.style.opacity = "0";
deleteCommentSound.style.pointerEvents = "none";

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  initialCommentsCount = 0,
  onCommentAdded,
}) => {
  const { user } = useAuth();
  const { playSound } = useSound();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState<string | null>(null);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: language === "vi" ? vi : enUS,
    });
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(
          `
          *,
          profiles!post_comments_user_id_fkey (
            name,
            avatar_url,
            is_verified
          )
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.dismiss();
      toast.error(t("commentSection.loadError"));
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) {
      toast.dismiss();
      toast.error(t("commentSection.validationError"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      toast.dismiss();
      toast.success(t("commentSection.submitSuccess"));
      setNewComment("");
      fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }

      // Play send comment sound
      playSound(sendCommentSound);
    } catch (error) {
      console.error("Error creating comment:", error);
      toast.dismiss();
      toast.error(t("commentSection.submitError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);
      if (error) throw error;
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast.dismiss();
      toast.success(t("commentSection.deleteSuccess"));

      // Play delete comment sound
      playSound(deleteCommentSound);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.dismiss();
      toast.error(t("commentSection.deleteError"));
    }
  };

  return (
    <div className="space-y-3">
      {showComments && (
        <div className="space-y-3 pl-4 border-l-2 border-gray-100">
          {/* Add new comment */}
          {user && (
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("commentSection.placeholder")}
                rows={2}
                className="text-sm"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={loading || !newComment.trim()}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                {loading
                  ? t("commentSection.submitting")
                  : t("commentSection.submitButton")}
              </Button>
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <div className="flex items-start space-x-2" key={comment.id}>
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarImage
                    src={comment.profiles?.avatar_url || undefined}
                  />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col space-y-0.5">
                      <div className="flex items-center space-x-1">
                        <p className="text-sm font-semibold">
                          {comment.profiles?.name ||
                            t("commentSection.anonymousUser")}
                        </p>
                        {comment.profiles?.is_verified && (
                          <CheckCircle className="w-4 h-4 text-red-500 ml-1" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {comment.created_at
                          ? formatTimeAgo(new Date(comment.created_at))
                          : t("commentSection.timestampNotAvailable")}
                      </p>
                    </div>
                    {user?.id === comment.user_id && (
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            setDeleteMenuOpen(
                              deleteMenuOpen === comment.id ? null : comment.id
                            )
                          }
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </Button>
                        {deleteMenuOpen === comment.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-red-500"
                              onClick={() => {
                                handleDeleteComment(comment.id);
                                setDeleteMenuOpen(null);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("commentSection.deleteButton")}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {comment.created_at
                      ? formatTimeAgo(new Date(comment.created_at))
                      : t("commentSection.timestampUndefined")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {comments.length === 0 && showComments && (
            <p className="text-sm text-gray-500 text-center py-4">
              {t("commentSection.noComments")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
