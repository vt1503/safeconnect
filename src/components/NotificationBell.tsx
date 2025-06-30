import React, { useState, useEffect, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSound } from "@/contexts/SoundContext";

interface Notification {
  id: string;
  type: "new_request" | "help_completed" | "sos_accepted" | "sos_nearby";
  title: string;
  description: string;
  created_at: string;
  is_read: boolean;
  sos_request_id?: string;
  sender_name?: string;
}

interface NotificationBellProps {
  onStartChat?: (helperId: string, helperName: string, sosId: string) => void;
}

interface NotificationState {
  [notificationId: string]: {
    is_read: boolean;
    is_deleted: boolean;
  };
}

// Audio for notification sound
const noticeSound = new Audio("/sounds/noticesound.mp3");
noticeSound.preload = "none";
noticeSound.muted = true;
noticeSound.setAttribute("playsinline", "true");
noticeSound.setAttribute("webkit-playsinline", "true");
noticeSound.style.display = "none";
noticeSound.style.position = "absolute";
noticeSound.style.left = "-9999px";
noticeSound.style.top = "-9999px";
noticeSound.style.width = "0";
noticeSound.style.height = "0";
noticeSound.style.opacity = "0";
noticeSound.style.pointerEvents = "none";

const NotificationBell: React.FC<NotificationBellProps> = ({ onStartChat }) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { playSound } = useSound();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swipedNotificationId, setSwipedNotificationId] = useState<
    string | null
  >(null);
  const [notificationStates, setNotificationStates] =
    useState<NotificationState>({});
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0);

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return t("notifications.unknown_time");
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: language === "vi" ? vi : enUS,
    });
  };

  const translateRequestType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      medical_emergency: t("request_types.medical_emergency"),
      "medical emergency": t("request_types.medical_emergency"),
      evacuation: t("request_types.evacuation"),
      "sơ tán": t("request_types.evacuation"),
      "so tan": t("request_types.evacuation"),
      rescue: t("request_types.rescue"),
      "cứu hộ": t("request_types.rescue"),
      "cuu ho": t("request_types.rescue"),
      food: t("request_types.food"),
      "thức ăn": t("request_types.food"),
      "thuc an": t("request_types.food"),
      water: t("request_types.water"),
      "nước uống": t("request_types.water"),
      "nuoc uong": t("request_types.water"),
      shelter: t("request_types.shelter"),
      "chỗ ở": t("request_types.shelter"),
      "cho o": t("request_types.shelter"),
      medicine: t("request_types.medicine"),
      thuốc: t("request_types.medicine"),
      thuoc: t("request_types.medicine"),
      clothing: t("request_types.clothing"),
      "quần áo": t("request_types.clothing"),
      "quan ao": t("request_types.clothing"),
      other: t("request_types.other"),
      khác: t("request_types.other"),
      khac: t("request_types.other"),
    };
    return typeMap[type.toLowerCase()] || typeMap[type] || type;
  };

  const translateUrgency = (urgency: string) => {
    const urgencyMap: { [key: string]: string } = {
      emergency: t("urgency_levels.emergency"),
      "khẩn cấp": t("urgency_levels.emergency"),
      "khan cap": t("urgency_levels.emergency"),
      urgent: t("urgency_levels.emergency"),
      high: t("urgency_levels.emergency"),
      medium: t("urgency_levels.medium"),
      "trung bình": t("urgency_levels.medium"),
      "trung binh": t("urgency_levels.medium"),
      normal: t("urgency_levels.medium"),
      low: t("urgency_levels.low"),
      thấp: t("urgency_levels.low"),
      thap: t("urgency_levels.low"),
    };
    return urgencyMap[urgency.toLowerCase()] || urgencyMap[urgency] || urgency;
  };

  // Load notification states from localStorage
  useEffect(() => {
    if (profile) {
      const saved = localStorage.getItem(`notification_states_${profile.id}`);
      if (saved) {
        try {
          setNotificationStates(JSON.parse(saved));
        } catch (error) {
          console.error("Error loading notification states:", error);
        }
      }
    }
  }, [profile]);

  // Play notification sound when new notifications arrive
  useEffect(() => {
    const newUnreadCount = notifications.filter((n) => !n.is_read).length;

    // Only play sound if there are new unread notifications and this isn't the initial load
    if (
      newUnreadCount > previousNotificationCount &&
      previousNotificationCount > 0
    ) {
      playSound(noticeSound);
    }

    setPreviousNotificationCount(newUnreadCount);
  }, [notifications, previousNotificationCount, playSound]);

  // Save notification states to localStorage
  const saveNotificationStates = (states: NotificationState) => {
    if (profile) {
      localStorage.setItem(
        `notification_states_${profile.id}`,
        JSON.stringify(states)
      );
      setNotificationStates(states);
    }
  };

  const getNotificationState = (notificationId: string) => {
    return (
      notificationStates[notificationId] || {
        is_read: false,
        is_deleted: false,
      }
    );
  };

  const updateNotificationState = (
    notificationId: string,
    isRead: boolean = false,
    isDeleted: boolean = false
  ) => {
    const newStates = {
      ...notificationStates,
      [notificationId]: { is_read: isRead, is_deleted: isDeleted },
    };
    saveNotificationStates(newStates);
  };

  useEffect(() => {
    if (profile) {
      fetchNotifications();

      // Set up real-time subscription for new SOS requests
      const sosChannel = supabase
        .channel("sos-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "sos_requests",
          },
          (payload) => {
            // Only show notifications to volunteers who are ready
            if (
              profile.is_volunteer_ready &&
              payload.new.user_id !== profile.id
            ) {
              fetchNotifications(true); // Refresh notifications with sound
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for SOS status changes (accepted)
      const sosAcceptedChannel = supabase
        .channel("sos-accepted-notifications")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sos_requests",
          },
          (payload) => {
            // Show notification if user's SOS was accepted
            if (
              payload.new.user_id === profile.id &&
              payload.old.status === "active" &&
              payload.new.status === "accepted"
            ) {
              fetchNotifications(true); // Refresh notifications with sound
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for SOS status changes
      const sosStatusChannel = supabase
        .channel("sos-status-notifications")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sos_requests",
          },
          (payload) => {
            // Show notification if user's SOS was completed
            if (
              payload.new.user_id === profile.id &&
              payload.old.status !== payload.new.status &&
              payload.new.status === "completed"
            ) {
              fetchNotifications(true); // Refresh notifications with sound
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(sosChannel);
        supabase.removeChannel(sosAcceptedChannel);
        supabase.removeChannel(sosStatusChannel);
      };
    }
  }, [profile]);

  const fetchNotifications = async (shouldPlaySound = false) => {
    if (!profile) return;

    setLoading(true);
    const previousCount = notifications.length;
    try {
      const notifications: Notification[] = [];

      // Fetch recent SOS requests for volunteers (nearby alerts)
      if (profile.is_volunteer_ready) {
        const { data: sosRequests } = await supabase
          .from("sos_requests")
          .select(
            `
            id,
            type,
            urgency,
            created_at,
            latitude,
            longitude,
            profiles!sos_requests_user_id_fkey(name)
          `
          )
          .eq("status", "active")
          .neq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (sosRequests) {
          sosRequests.forEach((sos) => {
            const notificationId = `sos-${sos.id}`;
            const state = getNotificationState(notificationId);

            if (!state.is_deleted && sos.created_at) {
              notifications.push({
                id: notificationId,
                type: "sos_nearby",
                title: t("notifications.sosNearby"),
                description: `${translateRequestType(
                  sos.type
                )} - ${translateUrgency(sos.urgency)} ${t(
                  "notifications.from"
                )} ${sos.profiles?.name || t("notifications.user")}`,
                created_at: sos.created_at,
                is_read: state.is_read,
                sos_request_id: sos.id,
              });
            }
          });
        }
      }

      // Fetch SOS requests that were accepted (for requesters)
      const { data: acceptedSOS } = await supabase
        .from("sos_requests")
        .select(
          `
          id,
          type,
          created_at,
          profiles!sos_requests_helper_id_fkey(name)
        `
        )
        .eq("user_id", profile.id)
        .eq("status", "accepted")
        .order("created_at", { ascending: false })
        .limit(5);

      if (acceptedSOS) {
        acceptedSOS.forEach((sos) => {
          const notificationId = `accepted-${sos.id}`;
          const state = getNotificationState(notificationId);

          if (!state.is_deleted && sos.created_at) {
            notifications.push({
              id: notificationId,
              type: "sos_accepted",
              title: t("notifications.sosAccepted"),
              description: `${t("notifications.acceptedBy")} ${
                sos.profiles?.name || t("notifications.helper")
              } - ${translateRequestType(sos.type)}`,
              created_at: sos.created_at,
              is_read: state.is_read,
              sos_request_id: sos.id,
              sender_name: sos.profiles?.name || t("notifications.helper"),
            });
          }
        });
      }

      // Fetch completed SOS requests where user was the requester
      const { data: completedSOS } = await supabase
        .from("sos_requests")
        .select(
          `
          id,
          type,
          completed_at,
          profiles!sos_requests_helper_id_fkey(name)
        `
        )
        .eq("user_id", profile.id)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(5);

      if (completedSOS) {
        completedSOS.forEach((sos) => {
          const notificationId = `completed-${sos.id}`;
          const state = getNotificationState(notificationId);

          if (!state.is_deleted && sos.completed_at) {
            notifications.push({
              id: notificationId,
              type: "help_completed",
              title: t("notifications.helpCompleted"),
              description: `${t("notifications.completedBy")} ${
                sos.profiles?.name || t("notifications.helper")
              } - ${translateRequestType(sos.type)}`,
              created_at: sos.completed_at,
              is_read: state.is_read,
              sos_request_id: sos.id,
            });
          }
        });
      }

      // Sort all notifications by creation time
      notifications.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(notifications);
      const newUnreadCount = notifications.filter((n) => !n.is_read).length;
      setUnreadCount(newUnreadCount);

      // Play sound if there are new notifications and shouldPlaySound is true
      if (shouldPlaySound && notifications.length > previousCount) {
        playSound(noticeSound);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error(t("notifications.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.is_read) return;

    // Update notification state
    updateNotificationState(notification.id, true, false);

    // Update local state
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);

    // Mark all unread notifications as read
    const newStates = { ...notificationStates };
    unreadNotifications.forEach((notification) => {
      newStates[notification.id] = { is_read: true, is_deleted: false };
    });
    saveNotificationStates(newStates);

    // Update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    toast.success(t("notifications.markAllReadSuccess"));
  };

  const deleteNotification = async (notificationId: string) => {
    // Mark as deleted
    updateNotificationState(notificationId, false, true);

    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== notificationId);
      const deletedNotification = prev.find((n) => n.id === notificationId);

      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
      }

      return filtered;
    });
    setSwipedNotificationId(null);

    toast.success(t("notifications.deleteSuccess"));
  };

  const deleteAllNotifications = async () => {
    // Mark all notifications as deleted
    const newStates = { ...notificationStates };
    notifications.forEach((notification) => {
      newStates[notification.id] = { is_read: false, is_deleted: true };
    });
    saveNotificationStates(newStates);

    setNotifications([]);
    setUnreadCount(0);

    toast.success(t("notifications.deleteAllSuccess"));
  };

  const handleNotificationClick = (notification: Notification) => {
    console.log("Notification clicked:", notification);
    markAsRead(notification);

    // Handle different notification types
    // Only handle SOS-related notifications now
    setIsOpen(false);
  };

  const handleTriggerClick = () => {
    console.log("Notification bell clicked, current isOpen:", isOpen);
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_request":
      case "sos_nearby":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "sos_accepted":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "help_completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleSwipeStart = (e: React.TouchEvent, notificationId: string) => {
    const touch = e.touches[0];
    const startX = touch.clientX;

    const handleSwipeMove = (moveEvent: TouchEvent) => {
      const currentTouch = moveEvent.touches[0];
      const deltaX = startX - currentTouch.clientX;

      if (deltaX > 100) {
        setSwipedNotificationId(notificationId);
        document.removeEventListener("touchmove", handleSwipeMove);
        document.removeEventListener("touchend", handleSwipeEnd);
      }
    };

    const handleSwipeEnd = () => {
      document.removeEventListener("touchmove", handleSwipeMove);
      document.removeEventListener("touchend", handleSwipeEnd);
    };

    document.addEventListener("touchmove", handleSwipeMove);
    document.addEventListener("touchend", handleSwipeEnd);
  };

  const NotificationContent = () => (
    <div className="flex flex-col h-full">
      {/* Header with actions */}
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-semibold">{t("notifications.title")}</h3>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-blue-600 hover:text-blue-700"
            >
              <Check className="w-4 h-4 mr-1" />
              {t("notifications.markAllRead")}
            </Button>
          )}
          {notifications.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t("notifications.deleteAll")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("notifications.deleteAllConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("notifications.deleteAllConfirmMessage")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("notifications.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllNotifications}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t("notifications.deleteAll")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("notifications.noNotifications")}
          </div>
        ) : (
          <div className="space-y-2 p-1">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative border rounded-lg transition-all duration-200 ${
                  swipedNotificationId === notification.id
                    ? "transform translate-x-[-100px]"
                    : ""
                } ${!notification.is_read ? "bg-blue-50 border-blue-200" : ""}`}
                onTouchStart={(e) => handleSwipeStart(e, notification.id)}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 transition-colors p-1 rounded"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.description}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>

                  {/* Always visible delete button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("notifications.deleteConfirmTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("notifications.deleteConfirmMessage")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("notifications.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteNotification(notification.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {t("notifications.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Swipe delete button for mobile */}
                {swipedNotificationId === notification.id && (
                  <div className="absolute right-[-80px] top-0 h-full flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-full bg-red-500 hover:bg-red-600 text-white rounded-l-none px-6"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Fix React ref warning by using forwardRef for the trigger button
  const TriggerButton = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
  >((props, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      className="relative"
      onClick={handleTriggerClick}
      {...props}
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </Badge>
      )}
    </Button>
  ));

  TriggerButton.displayName = "TriggerButton";

  return isMobile ? (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <TriggerButton />
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-lg">
            {t("notifications.title")}
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden px-4 pb-6">
          <NotificationContent />
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <TriggerButton />
      </DialogTrigger>
      <DialogContent className="max-w-md h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("notifications.title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("notifications.description")}
          </DialogDescription>
        </DialogHeader>
        <NotificationContent />
      </DialogContent>
    </Dialog>
  );
};

export default NotificationBell;