import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { MapPin, Navigation, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface MapLocationPromptProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  detectedCountry?: string;
}

const MapLocationPrompt: React.FC<MapLocationPromptProps> = ({
  isOpen,
  onAccept,
  onDecline,
  detectedCountry,
}) => {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-lg font-semibold">
              {t("mapLocationPrompt.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-800">
                <strong>{t("mapLocationPrompt.notice")}</strong>
              </p>
              <p className="text-blue-700 mt-2">
                {t("mapLocationPrompt.vietnamOnly")}
              </p>
            </div>

            <p>
              {t("mapLocationPrompt.detectedFrom")}{" "}
              <span className="font-medium text-gray-800">
                {detectedCountry || t("mapLocationPrompt.outsideVietnam")}
              </span>
              .
            </p>

            <p>{t("mapLocationPrompt.question")}</p>

            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <Navigation className="h-4 w-4" />
                <span className="font-medium">
                  {t("mapLocationPrompt.mockLocationInfo")}
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                {t("mapLocationPrompt.hanoiLocation")}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {t("mapLocationPrompt.useHanoiLocation")}
          </Button>
          <Button onClick={onDecline} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            {t("mapLocationPrompt.decline")}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          {t("mapLocationPrompt.canChangeAnytime")}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default MapLocationPrompt;
