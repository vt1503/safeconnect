import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useInstallPromptContext } from "@/contexts/InstallPromptContext";

const InstallButton: React.FC = () => {
  const { canInstall } = usePWAInstall();
  const { showPrompt } = useInstallPromptContext();
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    const count = parseInt(localStorage.getItem("appVisitCount") || "0");
    setVisitCount(count);
  }, []);

  const handleInstallClick = () => {
    // Trigger hiển thị prompt qua context
    showPrompt();
  };

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="flex items-center gap-2 text-xs"
      title={`Đã sử dụng ${visitCount} lần - Nhấn để cài đặt`}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Cài đặt</span>
      {visitCount > 5 && (
        <span className="bg-red-500 text-white text-xs px-1 rounded-full">
          {visitCount}
        </span>
      )}
    </Button>
  );
};

export default InstallButton;
