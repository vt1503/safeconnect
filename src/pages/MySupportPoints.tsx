import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Clock,
  Shield,
  Info,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import GoongMapSearch from "@/components/GoongMapSearch";
import { useGoongMapsApiKey } from "@/hooks/useGoongMapsApiKey";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface SupportPoint {
  id: string;
  name: string;
  type: string;
  description: string | null;
  operating_hours: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  latitude: number;
  longitude: number;
  address?: string;
  contact_info: import("@/integrations/supabase/types").Json | null;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
  images: string[] | null;
}

// Hook phát hiện mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

const MySupportPoints: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [myPoints, setMyPoints] = useState<SupportPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPoint, setEditPoint] = useState<SupportPoint | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<SupportPoint>>({});
  const isMobile = useIsMobile();
  const { mapsApiKey, servicesApiKey } = useGoongMapsApiKey();
  const [deletePoint, setDeletePoint] = useState<SupportPoint | null>(null);

  useEffect(() => {
    if (user) fetchMyPoints();
  }, [user]);

  const fetchMyPoints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_points")
        .select("*")
        .eq("owner_id", user?.id || "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMyPoints((data || []) as SupportPoint[]);
    } catch (error) {
      toast.error(t("mySupportPoints.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (point: SupportPoint) => {
    setEditPoint(point);
    setEditData(point);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editPoint) return;
    try {
      const { error } = await supabase
        .from("support_points")
        .update({
          name: editData.name,
          type: editData.type,
          description: editData.description,
          operating_hours: editData.operating_hours,
          address: editData.address,
          contact_info:
            editData.contact_info as import("@/integrations/supabase/types").Json,
        })
        .eq("id", editPoint.id);
      if (error) throw error;
      toast.success(t("mySupportPoints.updateSuccess"));
      setEditDialogOpen(false);
      fetchMyPoints();
    } catch (error) {
      toast.error(t("mySupportPoints.updateFailed"));
    }
  };

  const handleDelete = async (point: SupportPoint) => {
    setDeletePoint(point);
  };

  const confirmDelete = async () => {
    if (!deletePoint) return;
    try {
      const { error } = await supabase
        .from("support_points")
        .delete()
        .eq("id", deletePoint.id);
      if (error) throw error;
      toast.success(t("mySupportPoints.deleteSuccess"));
      fetchMyPoints();
    } catch (error) {
      toast.error(t("mySupportPoints.deleteFailed"));
    } finally {
      setDeletePoint(null);
    }
  };

  const handleToggleActive = async (point: SupportPoint) => {
    try {
      const { error } = await supabase
        .from("support_points")
        .update({ is_active: !point.is_active })
        .eq("id", point.id);
      if (error) throw error;
      toast.success(t("mySupportPoints.statusUpdateSuccess"));
      fetchMyPoints();
    } catch (error) {
      toast.error(t("mySupportPoints.statusUpdateFailed"));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100">
        {t("mySupportPoints.title")}
      </h1>
      {loading ? (
        <div className="text-center text-gray-600 dark:text-gray-400">
          {t("mySupportPoints.loading")}
        </div>
      ) : myPoints.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400">
          {t("mySupportPoints.noPoints")}
        </div>
      ) : (
        <div className="space-y-4">
          {myPoints.map((point) => (
            <Card
              key={point.id}
              className="hover:shadow-md transition-shadow rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-gray-100">
                      {point.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 text-xs h-auto py-1"
                      >
                        {point.type}
                      </Badge>
                      <Badge
                        className={
                          point.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }
                      >
                        {point.is_active
                          ? t("mySupportPoints.active")
                          : t("mySupportPoints.closed")}
                      </Badge>
                      {(point.is_verified ?? false) && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs h-auto py-1">
                          <Shield size={10} className="mr-1 flex-shrink-0" />
                          {t("mySupportPoints.verified")}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {point.address}
                    </div>
                    {point.description && (
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2 sm:line-clamp-3">
                        {point.description}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(point)}
                      className="w-full sm:w-auto"
                    >
                      <Edit size={16} className="mr-1" />{" "}
                      {t("mySupportPoints.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(point)}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 size={16} className="mr-1" />{" "}
                      {t("mySupportPoints.delete")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleToggleActive(point)}
                      className="w-full sm:w-auto"
                    >
                      {point.is_active ? (
                        <X size={16} className="mr-1" />
                      ) : (
                        <CheckCircle size={16} className="mr-1" />
                      )}
                      {point.is_active
                        ? t("mySupportPoints.close")
                        : t("mySupportPoints.open")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog/Drawer chỉnh sửa */}
      {isMobile ? (
        <Drawer open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DrawerContent className="max-w-full overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DrawerHeader>
              <DrawerTitle className="text-gray-900 dark:text-gray-100">
                {t("mySupportPoints.editTitle")}
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-3">
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.name")}
              </Label>
              <Input
                className="w-full"
                value={editData.name || ""}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.type")}
              </Label>
              <Input
                className="w-full"
                value={editData.type || ""}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, type: e.target.value }))
                }
              />
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.address")}
              </Label>
              {mapsApiKey && servicesApiKey ? (
                <GoongMapSearch
                  map={null}
                  mapsApiKey={mapsApiKey}
                  servicesApiKey={servicesApiKey}
                  onLocationSelect={(location) => {
                    setEditData((prev) => ({
                      ...prev,
                      address: location.address,
                      latitude: location.lat,
                      longitude: location.lng,
                    }));
                  }}
                />
              ) : (
                <Input
                  className="w-full"
                  value={editData.address || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              )}
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.operatingHours")}
              </Label>
              <Input
                className="w-full"
                value={editData.operating_hours || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    operating_hours: e.target.value,
                  }))
                }
              />
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.description")}
              </Label>
              <Textarea
                className="w-full"
                value={editData.description || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <Button className="w-full sm:w-auto" onClick={handleSaveEdit}>
                  {t("mySupportPoints.save")}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  {t("mySupportPoints.cancel")}
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-full sm:max-w-lg overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">
                {t("mySupportPoints.editTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.name")}
              </Label>
              <Input
                className="w-full"
                value={editData.name || ""}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.type")}
              </Label>
              <Input
                className="w-full"
                value={editData.type || ""}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, type: e.target.value }))
                }
              />
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.address")}
              </Label>
              {mapsApiKey && servicesApiKey ? (
                <GoongMapSearch
                  map={null}
                  mapsApiKey={mapsApiKey}
                  servicesApiKey={servicesApiKey}
                  onLocationSelect={(location) => {
                    setEditData((prev) => ({
                      ...prev,
                      address: location.address,
                      latitude: location.lat,
                      longitude: location.lng,
                    }));
                  }}
                />
              ) : (
                <Input
                  className="w-full"
                  value={editData.address || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              )}
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.operatingHours")}
              </Label>
              <Input
                className="w-full"
                value={editData.operating_hours || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    operating_hours: e.target.value,
                  }))
                }
              />
              <Label className="text-gray-700 dark:text-gray-300">
                {t("mySupportPoints.description")}
              </Label>
              <Textarea
                className="w-full"
                value={editData.description || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button className="w-full sm:w-auto" onClick={handleSaveEdit}>
                {t("mySupportPoints.save")}
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                {t("mySupportPoints.cancel")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Popup xác nhận xóa */}
      <AlertDialog
        open={!!deletePoint}
        onOpenChange={(open) => {
          if (!open) setDeletePoint(null);
        }}
      >
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-gray-100">
              {t("mySupportPoints.deleteConfirm")}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {deletePoint?.name && (
              <b className="text-gray-900 dark:text-gray-100">
                {deletePoint.name}
              </b>
            )}
            {deletePoint?.address && (
              <div className="mt-1">{deletePoint.address}</div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("mySupportPoints.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("mySupportPoints.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MySupportPoints;
