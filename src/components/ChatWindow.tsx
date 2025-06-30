import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, MessageCircle, Phone, X, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string | null;
  is_read: boolean | null;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
  sosRequestId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  receiverId,
  receiverName,
  sosRequestId,
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessageForDelete, setSelectedMessageForDelete] =
    useState<Message | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen && profile) {
      fetchMessages();

      // Set up real-time subscription
      const channel = supabase
        .channel("chat-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `sos_request_id=eq.${sosRequestId}`,
          },
          (payload) => {
            console.log("Real-time INSERT:", payload);
            setMessages((prev) => [...prev, payload.new as Message]);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "chat_messages",
            filter: `sos_request_id=eq.${sosRequestId}`,
          },
          (payload) => {
            console.log("Real-time DELETE:", payload);
            setMessages((prev) => {
              const filtered = prev.filter((msg) => msg.id !== payload.old.id);
              console.log(
                `Real-time delete: Before: ${prev.length}, After: ${filtered.length}`
              );
              return filtered;
            });
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
      };
    }
  }, [isOpen, profile, sosRequestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto focus input when chat opens
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    // Cleanup long press timer on unmount
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("sos_request_id", sosRequestId)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error(t("chat.load_error"));
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!profile) return;

    try {
      await supabase
        .from("chat_messages")
        .update({ is_read: true })
        .eq("sos_request_id", sosRequestId)
        .eq("receiver_id", profile.id)
        .eq("is_read", false);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      // Silent error - không cần toast cho mark as read
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        content: newMessage.trim(),
        sender_id: profile.id,
        receiver_id: receiverId,
        sos_request_id: sosRequestId,
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error(`${t("chat.send_error")}: ${error.message}`);
        return;
      }

      setNewMessage("");
      // Auto-reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "44px";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("chat.send_retry"));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const handleLongPressStart = (message: Message) => {
    // Only allow deleting own messages
    if (message.sender_id !== profile?.id) return;

    longPressTimerRef.current = setTimeout(() => {
      setSelectedMessageForDelete(message);
      setDeleteConfirmOpen(true);
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageForDelete || !profile) return;

    try {
      console.log("Attempting to delete message:", selectedMessageForDelete.id);

      const { data, error, count } = await supabase
        .from("chat_messages")
        .delete({ count: "exact" })
        .eq("id", selectedMessageForDelete.id)
        .eq("sender_id", profile.id); // Double check ownership

      console.log("Delete result:", { data, error, count });

      if (error) {
        console.error("Supabase delete error:", error);
        toast.error(`${t("chat.delete_error")}: ${error.message}`);
        return;
      }

      if (count === 0) {
        console.warn(
          "No messages were deleted - might not be owner or message doesn't exist"
        );
        toast.error(t("chat.delete_permission_denied"));
        return;
      }

      console.log(`Successfully deleted ${count} message(s)`);

      // Remove message from local state immediately
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) => msg.id !== selectedMessageForDelete.id
        );
        console.log(
          `Removed message from local state. Before: ${prev.length}, After: ${filtered.length}`
        );
        return filtered;
      });

      setDeleteConfirmOpen(false);
      setSelectedMessageForDelete(null);

      // Show success message
      console.log("Message deleted successfully!");
      toast.success(t("chat.delete_success"));

      // Refresh messages to ensure consistency
      setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error(
        `${t("chat.delete_error")}: ${
          error instanceof Error ? error.message : t("common.unknown_error")
        }`
      );
    }
  };

  const formatMessageTime = (timestamp: string | null) => {
    if (!timestamp) return "Unknown";

    const messageDate = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return formatDistanceToNow(messageDate, { addSuffix: true });
    }
  };

  const renderChatHeader = () => (
    <div
      className={`${
        isMobile ? "p-4" : "p-6"
      } border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-lg text-white truncate cursor-pointer hover:text-blue-100 transition-colors"
              onClick={() => {
                onClose();
                navigate(`/profile/${receiverId}`);
              }}
            >
              {receiverName}
            </h3>
            <div className="flex items-center gap-2 text-blue-100">
              <MessageCircle className="w-3 h-3" />
              <span className="text-sm">{t("chat.online")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 w-9 h-9 p-0"
          >
            <Phone className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/10 w-9 h-9 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderMessage = (message: Message, index: number) => {
    const isOwn = message.sender_id === profile?.id;
    const showTime =
      index === 0 ||
      (index > 0 &&
        new Date(message.created_at || "").getTime() -
          new Date(messages[index - 1].created_at || "").getTime() >
          300000); // 5 minutes

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
      >
        <div
          className={`flex items-end gap-2 max-w-[80%] ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          {!isOwn && (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-600" />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <div
              className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                isOwn
                  ? "bg-blue-500 text-white rounded-br-md cursor-pointer select-none"
                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
              }`}
              style={{
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
              onMouseDown={() => isOwn && handleLongPressStart(message)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => isOwn && handleLongPressStart(message)}
              onTouchEnd={handleLongPressEnd}
              onTouchCancel={handleLongPressEnd}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
              {(showTime || index === messages.length - 1) && (
                <p
                  className={`text-xs mt-2 ${
                    isOwn ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{formatMessageTime(message.created_at)}</span>
                    {isOwn && (
                      <span
                        className={`flex items-center gap-1 ${
                          message.is_read ? "text-blue-100" : "text-blue-200"
                        }`}
                      >
                        {message.is_read ? (
                          <>
                            <span className="text-xs">{t("chat.read")}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs">{t("chat.unread")}</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderMessages = () => (
    <ScrollArea
      className={`flex-1 ${isMobile ? "px-3 py-4" : "px-6 py-6"} bg-gray-50`}
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-gray-500">
              {t("chat.loading_messages")}
            </p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t("chat.no_messages")}</p>
            <p className="text-gray-400 text-xs mt-1">
              {t("chat.start_conversation")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence>
            {messages.map((message, index) => renderMessage(message, index))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
  );

  const renderMessageInput = () => (
    <div className={`border-t bg-white ${isMobile ? "p-3 pb-8" : "p-4 pb-8"}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={t("chat.type_message")}
            className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200 min-h-[44px] max-h-[120px]"
            style={{ height: "44px" }}
            rows={1}
          />
        </div>
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full w-11 h-11 p-0 transition-all duration-200 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {isTyping && (
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
            <div
              className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
          <span>
            {receiverName} {t("chat.typing")}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="h-[85vh] max-w-md mx-auto p-0">
            <div className="flex flex-col h-full">
              {renderChatHeader()}
              {renderMessages()}
              {renderMessageInput()}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-md h-[600px] p-0">
            <div className="flex flex-col h-full">
              {renderChatHeader()}
              {renderMessages()}
              {renderMessageInput()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Message Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t("chat.delete_message")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("chat.delete_confirmation")}
            </p>
            {selectedMessageForDelete && (
              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                <p className="text-sm text-gray-700 italic">
                  "{selectedMessageForDelete.content}"
                </p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setSelectedMessageForDelete(null);
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteMessage}
                className="bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatWindow;
