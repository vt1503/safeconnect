import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Heart, Clock, CheckCircle, MessageCircle, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/hooks/useTranslation";

interface HelpHistoryItem {
  id: string;
  type: string;
  description: string;
  urgency: string;
  status: string | null;
  created_at: string | null;
  completed_at: string | null;
  requester_profile?: {
    name: string;
  };
  user_id: string;
}

interface HelpHistoryProps {
  onStartChat?: (
    requesterId: string,
    requesterName: string,
    sosId: string
  ) => void;
}

const HelpHistory: React.FC<HelpHistoryProps> = ({ onStartChat }) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [helpRequests, setHelpRequests] = useState<HelpHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const translateUrgency = (urgency: string) => {
    switch (urgency) {
      case "Khẩn cấp":
        return t("urgency_levels.emergency");
      case "Trung bình":
        return t("urgency_levels.medium");
      case "Thấp":
        return t("urgency_levels.low");
      default:
        return urgency;
    }
  };

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

  useEffect(() => {
    if (isOpen && profile) {
      fetchHelpHistory();
    }
  }, [isOpen, profile]);

  const fetchHelpHistory = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sos_requests")
        .select(
          `
          *,
          requester_profile:profiles!sos_requests_user_id_fkey(name)
        `
        )
        .eq("helper_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setHelpRequests(data || []);
    } catch (error) {
      console.error("Error fetching help history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "helping":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants = {
      completed: "default",
      helping: "secondary",
    } as const;

    const labels = {
      completed: t("helpHistory.completed"),
      helping: t("helpHistory.helping"),
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "Khẩn cấp":
        return "text-red-600";
      case "Trung bình":
        return "text-orange-600";
      case "Thấp":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const markAsCompleted = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("sos_requests")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      fetchHelpHistory();
    } catch (error) {
      console.error("Error marking as completed:", error);
    }
  };

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative overflow-hidden rounded-full border-2 border-emerald-300 dark:border-emerald-500 bg-white/30 dark:bg-[#232329]/50 backdrop-blur-[16px] shadow-2xl font-bold text-emerald-900 dark:text-emerald-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-all duration-300 z-10 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/70 before:via-emerald-100/40 before:to-emerald-300/30 before:opacity-90 before:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-white/10 after:blur-[24px] after:opacity-80 after:pointer-events-none after:animate-glass-move"
            >
              <Heart className="w-4 h-4 animate-glow mr-2" />
              {t("helpHistory.title")}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-w-md h-[600px] flex flex-col">
            <DrawerHeader>
              <DrawerTitle>{t("helpHistory.title")}</DrawerTitle>
            </DrawerHeader>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : helpRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("helpHistory.noHelp")}
                </div>
              ) : (
                <div className="space-y-4 p-1">
                  {helpRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 space-y-3 bg-white dark:bg-[#18181b] dark:border-neutral-700 dark:shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <h3 className="font-semibold text-gray-900 dark:text-neutral-100">
                            {translateRequestType(request.type)}
                          </h3>
                          <span
                            className={`text-sm font-medium ${getUrgencyColor(
                              request.urgency
                            )} dark:text-white`}
                          >
                            ({translateUrgency(request.urgency)})
                          </span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-neutral-300">
                        {request.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                        <span>
                          {t("helpHistory.startedHelping")}{" "}
                          {formatDistanceToNow(new Date(request.created_at!), {
                            addSuffix: true,
                          })}
                        </span>
                        {request.completed_at && (
                          <span>
                            {t("helpHistory.completed")}{" "}
                            {formatDistanceToNow(
                              new Date(request.completed_at!),
                              { addSuffix: true }
                            )}
                          </span>
                        )}
                      </div>
                      {request.requester_profile && (
                        <div className="flex items-center justify-between pt-2 border-t dark:border-neutral-700">
                          <span className="text-sm dark:text-neutral-200">
                            <strong>{t("helpHistory.requesterLabel")}:</strong>{" "}
                            {request.requester_profile.name}
                          </span>
                          <div className="flex gap-2">
                            {onStartChat && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onStartChat(
                                    request.user_id,
                                    request.requester_profile!.name,
                                    request.id
                                  )
                                }
                                className="gap-1 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {t("helpHistory.chat")}
                              </Button>
                            )}
                            {request.status === "helping" && (
                              <Button
                                size="sm"
                                onClick={() => markAsCompleted(request.id)}
                                className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 dark:text-white"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {t("helpHistory.complete")}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative overflow-hidden rounded-full border-2 border-emerald-300 dark:border-emerald-500 bg-white/30 dark:bg-[#232329]/50 backdrop-blur-[16px] shadow-2xl font-bold text-emerald-900 dark:text-emerald-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-all duration-300 z-10 before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/70 before:via-emerald-100/40 before:to-emerald-300/30 before:opacity-90 before:pointer-events-none after:absolute after:inset-0 after:rounded-full after:bg-white/10 after:blur-[24px] after:opacity-80 after:pointer-events-none after:animate-glass-move"
            >
              <Heart className="w-4 h-4 animate-glow mr-2" />
              {t("helpHistory.title")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl h-[600px] flex flex-col">
            <DialogHeader>
              <DialogTitle>{t("helpHistory.title")}</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : helpRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t("helpHistory.noHelp")}
                </div>
              ) : (
                <div className="space-y-4 p-1">
                  {helpRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border rounded-lg p-4 space-y-3 bg-white dark:bg-[#18181b] dark:border-neutral-700 dark:shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <h3 className="font-semibold text-gray-900 dark:text-neutral-100">
                            {translateRequestType(request.type)}
                          </h3>
                          <span
                            className={`text-sm font-medium ${getUrgencyColor(
                              request.urgency
                            )} dark:text-white`}
                          >
                            ({translateUrgency(request.urgency)})
                          </span>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-neutral-300">
                        {request.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400">
                        <span>
                          {t("helpHistory.startedHelping")}{" "}
                          {formatDistanceToNow(new Date(request.created_at!), {
                            addSuffix: true,
                          })}
                        </span>
                        {request.completed_at && (
                          <span>
                            {t("helpHistory.completed")}{" "}
                            {formatDistanceToNow(
                              new Date(request.completed_at!),
                              { addSuffix: true }
                            )}
                          </span>
                        )}
                      </div>
                      {request.requester_profile && (
                        <div className="flex items-center justify-between pt-2 border-t dark:border-neutral-700">
                          <span className="text-sm dark:text-neutral-200">
                            <strong>{t("helpHistory.requesterLabel")}:</strong>{" "}
                            {request.requester_profile.name}
                          </span>
                          <div className="flex gap-2">
                            {onStartChat && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  onStartChat(
                                    request.user_id,
                                    request.requester_profile!.name,
                                    request.id
                                  )
                                }
                                className="gap-1 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
                              >
                                <MessageCircle className="w-3 h-3" />
                                {t("helpHistory.chat")}
                              </Button>
                            )}
                            {request.status === "helping" && (
                              <Button
                                size="sm"
                                onClick={() => markAsCompleted(request.id)}
                                className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 dark:text-white"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {t("helpHistory.complete")}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default HelpHistory;
