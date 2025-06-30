import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPromptContext } from "@/contexts/InstallPromptContext";

interface InstallButtonWrapperProps {
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  children?: React.ReactNode;
}

const InstallButtonWrapper: React.FC<InstallButtonWrapperProps> = ({
  className = "flex items-center gap-2",
  size = "default",
  variant = "default",
  children,
}) => {
  const { showPrompt } = useInstallPromptContext();

  const handleInstallClick = () => {
    // Trigger hiển thị prompt qua context
    showPrompt();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstallClick}
      className={className}
    >
      {children || (
        <>
          <Download className="w-4 h-4 mr-2" />
          Cài đặt ứng dụng
        </>
      )}
    </Button>
  );
};

export default InstallButtonWrapper;
