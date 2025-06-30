import React, { useState, useEffect, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Clock, Shield, Search, Plus, Info, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoongMapsApiKey } from "@/hooks/useGoongMapsApiKey";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

// Lazy loaded components
const GoongMapSearch = lazy(() => import("@/components/GoongMapSearch"));
const SOSLocationInfo = lazy(() => import("@/components/SOSLocationInfo"));

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
  contact_info: any;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
  images: string[] | null;
}

const SupportPoints: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { mapsApiKey, servicesApiKey } = useGoongMapsApiKey();
  const [supportPoints, setSupportPoints] = useState<SupportPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedPoint, setSelectedPoint] = useState<SupportPoint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const translateSupportPointType = (type: string) => {
    switch (type) {
      case "Quán nước miễn phí":
        return t("supportPoints.pointTypes.free_water_station");
      case "Điểm trú tránh thiên tai":
        return t("supportPoints.pointTypes.disaster_relief_point");
      case "Nhà dân/cá nhân hỗ trợ":
        return t("supportPoints.pointTypes.private_household_support");
      case "Tổ chức/nhóm từ thiện":
        return t("supportPoints.pointTypes.charity_organization_group");
      default:
        return type;
    }
  };
  const [newPoint, setNewPoint] = useState({
    name: "",
    type: "",
    description: "",
    operating_hours: "",
    latitude: 0,
    longitude: 0,
    address: "",
    phone: "",
    contact_info: {},
  });

  useEffect(() => {
    fetchSupportPoints();
  }, []);

  const fetchSupportPoints = async () => {
    try {
      const { data, error } = await supabase
        .from("support_points")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSupportPoints(data || []);
    } catch (error) {
      console.error("Error fetching support points:", error);
      toast({
        title: t("common.error"),
        description: t("supportPoints.loadError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPoints = supportPoints.filter((point) => {
    const translatedType = translateSupportPointType(point.type);
    const matchesSearch =
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translatedType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || point.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getStatusText = (isActive: boolean) => {
    return isActive
      ? t("supportPoints.statusActive")
      : t("supportPoints.statusClosed");
  };

  const handleLocationSelect = (location: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    setNewPoint((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address,
    }));
  };

  const handleRegisterPoint = async () => {
    if (!user) {
      toast({
        title: t("common.error"),
        description: t("supportPoints.registerLoginError"),
        variant: "destructive",
      });
      return;
    }

    try {
      const contactInfo = newPoint.phone ? { phone: newPoint.phone } : {};

      const { error } = await supabase.from("support_points").insert({
        name: newPoint.name,
        type: newPoint.type,
        description: newPoint.description,
        operating_hours: newPoint.operating_hours,
        latitude: newPoint.latitude || 10.8231,
        longitude: newPoint.longitude || 106.6297,
        address: newPoint.address,
        contact_info: contactInfo,
        owner_id: user.id,
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("supportPoints.registerSuccess"),
      });

      setNewPoint({
        name: "",
        type: "",
        description: "",
        operating_hours: "",
        latitude: 0,
        longitude: 0,
        address: "",
        phone: "",
        contact_info: {},
      });

      fetchSupportPoints();
    } catch (error) {
      console.error("Error creating support point:", error);
      toast({
        title: t("common.error"),
        description: t("supportPoints.registerError"),
        variant: "destructive",
      });
    }
  };

  const handleViewDetail = (point: SupportPoint) => {
    setSelectedPoint(point);
    setIsDetailOpen(true);
  };

  const handleCallSupport = (phone: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast({
        title: t("common.notification"),
        description: t("supportPoints.phoneUnavailable"),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pb-20">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold text-center mb-8">
            {t("supportPoints.title")}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="h-6 w-40 bg-gray-200 animate-pulse rounded-md"></div>
                        <div className="flex flex-wrap gap-1">
                          <div className="h-5 w-20 bg-gray-200 animate-pulse rounded-md"></div>
                        </div>
                      </div>
                      <div className="h-5 w-28 bg-gray-200 animate-pulse rounded-md"></div>
                      <div className="h-12 w-full bg-gray-200 animate-pulse rounded-md"></div>
                      <div className="space-y-2">
                        <div className="h-5 w-full bg-gray-200 animate-pulse rounded-md"></div>
                        <div className="h-5 w-32 bg-gray-200 animate-pulse rounded-md"></div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="h-8 bg-gray-200 animate-pulse rounded-md flex-1"></div>
                      <div className="h-8 bg-gray-200 animate-pulse rounded-md flex-1"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pb-20 min-h-screen">
      <Suspense
        fallback={
          <div className="h-6 w-40 bg-gray-200 animate-pulse rounded-md mt-6"></div>
        }
      >
        {/* Header */}
        <div className="flex flex-col gap-4 py-4 sm:py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t("supportPoints.title")}
          </h1>
          {/* Register Support Point - Mobile Drawer, Desktop Dialog */}
          {isMobile ? (
            <Drawer>
              <DrawerTrigger asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 w-full flex items-center justify-center text-white dark:bg-blue-500 dark:hover:bg-blue-400 dark:text-white dark:shadow-lg transition-colors"
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      toast({
                        title: t("common.error"),
                        description: t("supportPoints.registerLoginError"),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Plus size={16} className="mr-2 flex-shrink-0" />
                  {t("supportPoints.registerNewPointButton")}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[85vh] dark:bg-gray-900 dark:text-white">
                <DrawerHeader className="p-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <DrawerTitle className="dark:text-white">
                    {t("supportPoints.registerNewPointTitle")}
                  </DrawerTitle>
                </DrawerHeader>
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="pointName"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        {t("supportPoints.form.name")}
                      </Label>
                      <Input
                        id="pointName"
                        value={newPoint.name}
                        onChange={(e) =>
                          setNewPoint((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder={t("supportPoints.form.namePlaceholder")}
                        className="mt-1 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="pointType"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        {t("supportPoints.form.type")}
                      </Label>
                      <Select
                        value={newPoint.type}
                        onValueChange={(value) =>
                          setNewPoint((prev) => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="mt-1 dark:bg-gray-800 dark:text-white">
                          <SelectValue
                            placeholder={t(
                              "supportPoints.form.typePlaceholder"
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:text-white">
                          <SelectItem value="Quán nước miễn phí">
                            {t("supportPoints.pointTypes.free_water_station")}
                          </SelectItem>
                          <SelectItem value="Điểm trú tránh thiên tai">
                            {t(
                              "supportPoints.pointTypes.disaster_relief_point"
                            )}
                          </SelectItem>
                          <SelectItem value="Nhà dân/cá nhân hỗ trợ">
                            {t(
                              "supportPoints.pointTypes.private_household_support"
                            )}
                          </SelectItem>
                          <SelectItem value="Tổ chức/nhóm từ thiện">
                            {t(
                              "supportPoints.pointTypes.charity_organization_group"
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="address"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        {t("supportPoints.form.address")}
                      </Label>
                      {mapsApiKey && servicesApiKey ? (
                        <div className="mt-1">
                          <GoongMapSearch
                            map={null}
                            mapsApiKey={mapsApiKey}
                            servicesApiKey={servicesApiKey}
                            onLocationSelect={handleLocationSelect}
                          />
                        </div>
                      ) : (
                        <Input
                          id="address"
                          value={newPoint.address}
                          onChange={(e) =>
                            setNewPoint((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder="Nhập địa chỉ..."
                          className="mt-1 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      )}
                      {newPoint.address && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {t("supportPoints.form.addressSelected")}{" "}
                          {newPoint.address}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label
                          htmlFor="operatingHours"
                          className="text-sm font-medium dark:text-gray-200"
                        >
                          {t("supportPoints.form.operatingHours")}
                        </Label>
                        <Input
                          id="operatingHours"
                          value={newPoint.operating_hours}
                          onChange={(e) =>
                            setNewPoint((prev) => ({
                              ...prev,
                              operating_hours: e.target.value,
                            }))
                          }
                          placeholder={t(
                            "supportPoints.form.operatingHoursPlaceholder"
                          )}
                          className="mt-1 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="phone"
                          className="text-sm font-medium dark:text-gray-200"
                        >
                          {t("supportPoints.form.phone")}
                        </Label>
                        <Input
                          id="phone"
                          value={newPoint.phone}
                          onChange={(e) =>
                            setNewPoint((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          placeholder={t(
                            "supportPoints.form.contactPhonePlaceholder"
                          )}
                          className="mt-1 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium dark:text-gray-200"
                      >
                        {t("supportPoints.form.description")}
                      </Label>
                      <Textarea
                        id="description"
                        value={newPoint.description}
                        onChange={(e) =>
                          setNewPoint((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder={t(
                          "supportPoints.form.descriptionPlaceholder"
                        )}
                        rows={3}
                        className="mt-1 resize-none dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                    <Button
                      onClick={handleRegisterPoint}
                      className="w-full bg-blue-600 hover:bg-blue-700 mt-4 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-600"
                      disabled={!newPoint.name || !newPoint.type}
                    >
                      {t("supportPoints.form.submitButton")}
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  onClick={(e) => {
                    if (!isAuthenticated) {
                      e.preventDefault();
                      toast({
                        title: t("common.error"),
                        description: t("supportPoints.registerLoginError"),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  {t("supportPoints.registerNewPointButton")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {t("supportPoints.registerNewPointTitle")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pointName">
                      {t("supportPoints.form.name")}
                    </Label>
                    <Input
                      id="pointName"
                      value={newPoint.name}
                      onChange={(e) =>
                        setNewPoint((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder={t("supportPoints.form.namePlaceholder")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pointType">
                      {t("supportPoints.form.type")}
                    </Label>
                    <Select
                      value={newPoint.type}
                      onValueChange={(value) =>
                        setNewPoint((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("supportPoints.form.typePlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Quán nước miễn phí">
                          {t("supportPoints.pointTypes.free_water_station")}
                        </SelectItem>
                        <SelectItem value="Điểm trú tránh thiên tai">
                          {t("supportPoints.pointTypes.disaster_relief_point")}
                        </SelectItem>
                        <SelectItem value="Nhà dân/cá nhân hỗ trợ">
                          {t(
                            "supportPoints.pointTypes.private_household_support"
                          )}
                        </SelectItem>
                        <SelectItem value="Tổ chức/nhóm từ thiện">
                          {t(
                            "supportPoints.pointTypes.charity_organization_group"
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="address">
                      {t("supportPoints.form.address")}
                    </Label>
                    {mapsApiKey && servicesApiKey ? (
                      <Suspense
                        fallback={
                          <div className="h-10 w-full bg-gray-200 animate-pulse rounded-md"></div>
                        }
                      >
                        <GoongMapSearch
                          map={null}
                          mapsApiKey={mapsApiKey}
                          servicesApiKey={servicesApiKey}
                          onLocationSelect={handleLocationSelect}
                        />
                      </Suspense>
                    ) : (
                      <Input
                        id="address"
                        value={newPoint.address}
                        onChange={(e) =>
                          setNewPoint((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder={t(
                          "supportPoints.form.addressSearchPlaceholder"
                        )}
                      />
                    )}
                    {newPoint.address && (
                      <p className="text-sm text-gray-600 mt-1">
                        {t("supportPoints.form.addressSelected")}{" "}
                        {newPoint.address}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="operatingHours">
                        {t("supportPoints.form.operatingHours")}
                      </Label>
                      <Input
                        id="operatingHours"
                        value={newPoint.operating_hours}
                        onChange={(e) =>
                          setNewPoint((prev) => ({
                            ...prev,
                            operating_hours: e.target.value,
                          }))
                        }
                        placeholder={t(
                          "supportPoints.form.operatingHoursPlaceholder"
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">
                        {t("supportPoints.form.phone")}
                      </Label>
                      <Input
                        id="phone"
                        value={newPoint.phone}
                        onChange={(e) =>
                          setNewPoint((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder={t(
                          "supportPoints.form.contactPhonePlaceholder"
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      {t("supportPoints.form.description")}
                    </Label>
                    <Textarea
                      id="description"
                      value={newPoint.description}
                      onChange={(e) =>
                        setNewPoint((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder={t(
                        "supportPoints.form.descriptionPlaceholder"
                      )}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleRegisterPoint}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!newPoint.name || !newPoint.type}
                  >
                    {t("supportPoints.form.submitButton")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search and Filter */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                />
                <Input
                  type="search"
                  placeholder={t("supportPoints.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm pl-10 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="sm:w-[220px] dark:bg-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:text-white">
                  <SelectItem value="all">
                    {t("supportPoints.filterAll")}
                  </SelectItem>
                  <SelectItem value="Quán nước miễn phí">
                    {t("supportPoints.pointTypes.free_water_station")}
                  </SelectItem>
                  <SelectItem value="Điểm trú tránh thiên tai">
                    {t("supportPoints.pointTypes.disaster_relief_point")}
                  </SelectItem>
                  <SelectItem value="Nhà dân/cá nhân hỗ trợ">
                    {t("supportPoints.pointTypes.private_household_support")}
                  </SelectItem>
                  <SelectItem value="Tổ chức/nhóm từ thiện">
                    {t("supportPoints.pointTypes.charity_organization_group")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Support Points List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPoints.map((point) => (
            <Card
              key={point.id}
              className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700"
            >
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {point.name}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {(point.is_verified ?? false) && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs h-auto py-1">
                            <Shield size={10} className="mr-1 flex-shrink-0" />
                            {t("supportPoints.verifiedStatus")}
                          </Badge>
                        )}
                        <Badge
                          className={`${getStatusColor(
                            point.is_active ?? false
                          )} dark:bg-green-900 dark:text-green-300 text-xs h-auto py-1`}
                        >
                          {getStatusText(point.is_active ?? false)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-600 dark:text-blue-300 dark:border-blue-400 text-xs whitespace-normal h-auto py-1"
                      >
                        {translateSupportPointType(point.type)}
                      </Badge>
                      {point.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {point.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      {point.address && (
                        <div className="flex items-start gap-1.5">
                          <MapPin
                            size={14}
                            className="mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                          />
                          <span className="break-words">{point.address}</span>
                        </div>
                      )}
                      {point.operating_hours && (
                        <div className="flex items-center gap-1.5">
                          <Clock
                            size={14}
                            className="flex-shrink-0 text-gray-500 dark:text-gray-400"
                          />
                          <span>
                            {t("supportPoints.card.operatingHours")}{" "}
                            {point.operating_hours}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-center w-full sm:flex-1 dark:text-white dark:border-gray-500"
                      onClick={() => handleViewDetail(point)}
                    >
                      <Info size={14} className="mr-1 flex-shrink-0" />
                      {t("supportPoints.card.viewDetails")}
                    </Button>
                    {point.contact_info?.phone ? (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white justify-center w-full sm:flex-1"
                        onClick={() =>
                          handleCallSupport(point.contact_info.phone)
                        }
                      >
                        <Phone size={14} className="mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {point.contact_info.phone}
                        </span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-gray-400 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed justify-center w-full sm:flex-1"
                        disabled
                      >
                        <Phone size={14} className="mr-1 flex-shrink-0" />
                        {t("supportPoints.card.noPhone")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPoints.length === 0 && !loading && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-12 px-6 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <MapPin className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="text-center text-gray-500 dark:text-gray-400">
                  {t("supportPoints.noPointsFound")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Modal - Mobile Drawer, Desktop Dialog */}
        {isMobile ? (
          <Drawer open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DrawerContent className="max-h-[85vh] dark:bg-gray-900 dark:text-white">
              <DrawerHeader className="p-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <DrawerTitle className="flex items-center gap-2 text-left dark:text-white">
                  <Info size={20} className="text-green-600" />
                  {t("supportPoints.detail.title")}
                </DrawerTitle>
              </DrawerHeader>
              <div className="p-4 overflow-y-auto flex-1">
                {selectedPoint && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedPoint.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {(selectedPoint.is_verified ?? false) && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 h-auto py-1">
                            <Shield size={12} className="mr-1 flex-shrink-0" />
                            {t("supportPoints.verifiedStatus")}
                          </Badge>
                        )}
                        <Badge
                          className={
                            getStatusColor(selectedPoint.is_active ?? false) +
                            " dark:bg-green-900 dark:text-green-300"
                          }
                        >
                          {getStatusText(selectedPoint.is_active ?? false)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className="text-blue-600 border-blue-600 dark:text-blue-300 dark:border-blue-400 whitespace-normal h-auto py-1"
                      >
                        {translateSupportPointType(selectedPoint.type)}
                      </Badge>
                    </div>
                    {selectedPoint.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">
                          {t("supportPoints.detail.description")}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {selectedPoint.description}
                        </p>
                      </div>
                    )}
                    {selectedPoint.operating_hours && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">
                          {t("supportPoints.detail.operatingHours")}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock
                            size={14}
                            className="flex-shrink-0 text-gray-500 dark:text-gray-400"
                          />
                          <span>{selectedPoint.operating_hours}</span>
                        </div>
                      </div>
                    )}
                    {selectedPoint.contact_info?.phone && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">
                          {t("supportPoints.detail.phone")}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCallSupport(selectedPoint.contact_info.phone)
                          }
                          className="w-auto flex items-center dark:text-white dark:border-gray-500"
                        >
                          <Phone
                            size={14}
                            className="mr-2 flex-shrink-0 text-green-600"
                          />
                          <span className="truncate">
                            {selectedPoint.contact_info.phone}
                          </span>
                        </Button>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-3">
                        {t("supportPoints.detail.location")}
                      </h4>
                      <Suspense
                        fallback={
                          <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"></div>
                        }
                      >
                        <SOSLocationInfo
                          latitude={selectedPoint.latitude}
                          longitude={selectedPoint.longitude}
                          address={selectedPoint.address}
                        />
                      </Suspense>
                    </div>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Info size={20} className="text-green-600" />
                  {t("supportPoints.detail.title")}
                </DialogTitle>
              </DialogHeader>
              {selectedPoint && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedPoint.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {(selectedPoint.is_verified ?? false) && (
                        <Badge className="bg-green-100 text-green-800 h-auto py-1">
                          <Shield size={12} className="mr-1 flex-shrink-0" />
                          {t("supportPoints.verifiedStatus")}
                        </Badge>
                      )}
                      <Badge
                        className={getStatusColor(
                          selectedPoint.is_active ?? false
                        )}
                      >
                        {getStatusText(selectedPoint.is_active ?? false)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-600 whitespace-normal h-auto py-1"
                    >
                      {translateSupportPointType(selectedPoint.type)}
                    </Badge>
                  </div>

                  {selectedPoint.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {t("supportPoints.detail.description")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedPoint.description}
                      </p>
                    </div>
                  )}

                  {selectedPoint.operating_hours && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {t("supportPoints.detail.operatingHours")}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock size={14} />
                        <span>{selectedPoint.operating_hours}</span>
                      </div>
                    </div>
                  )}

                  {selectedPoint.contact_info?.phone && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {t("supportPoints.detail.phone")}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCallSupport(selectedPoint.contact_info.phone)
                        }
                        className="flex items-center"
                      >
                        <Phone
                          size={14}
                          className="mr-2 flex-shrink-0 text-green-600"
                        />
                        <span className="truncate">
                          {selectedPoint.contact_info.phone}
                        </span>
                      </Button>
                    </div>
                  )}

                  {selectedPoint && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {t("supportPoints.detail.location")}
                      </h4>
                      <Suspense
                        fallback={
                          <div className="h-20 w-full bg-gray-200 animate-pulse rounded-md"></div>
                        }
                      >
                        <SOSLocationInfo
                          latitude={selectedPoint.latitude}
                          longitude={selectedPoint.longitude}
                          address={selectedPoint.address}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </Suspense>
    </div>
  );
};

export default SupportPoints;
