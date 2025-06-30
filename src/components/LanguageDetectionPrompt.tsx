import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Globe, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface LanguageDetectionPromptProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
  detectedCountry?: string;
}

const LanguageDetectionPrompt: React.FC<LanguageDetectionPromptProps> = ({
  isOpen,
  onAccept,
  onDecline,
  detectedCountry,
}) => {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onDecline()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <DialogTitle className="text-lg font-semibold">
              {t("languageDetection.title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3">
            <p>
              {t("languageDetection.detectedFrom")}{" "}
              <span className="font-medium text-gray-800">
                {detectedCountry || t("languageDetection.outsideVietnam")}
              </span>
              .
            </p>
            <p
              dangerouslySetInnerHTML={{
                __html: t("languageDetection.question"),
              }}
            />
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            onClick={onAccept}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Globe className="w-4 h-4 mr-2" />
            {t("languageDetection.switchToEnglish")}
          </Button>
          <Button onClick={onDecline} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            {t("languageDetection.keepVietnamese")}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          {t("languageDetection.changeAnytime")}
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageDetectionPrompt;
