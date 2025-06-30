import React, { useEffect, useState } from "react";
import { X, Download, Share, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useInstallPromptContext } from "@/contexts/InstallPromptContext";

const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { canInstall, isStandalone, deviceType, install, deferredPrompt } =
    usePWAInstall();
  const { shouldShowPrompt, hidePrompt } = useInstallPromptContext();

  useEffect(() => {
    // Tăng số lần truy cập
    const visitCount = parseInt(localStorage.getItem("appVisitCount") || "0");
    const newVisitCount = visitCount + 1;
    localStorage.setItem("appVisitCount", newVisitCount.toString());

    // Kiểm tra nếu cần hiển thị prompt
    const checkShouldShowPrompt = () => {
      // Nếu được trigger từ context (từ Settings button), hiển thị ngay
      if (shouldShowPrompt) {
        return true;
      }

      const dismissData = localStorage.getItem("installPromptDismissed");

      // Lần đầu truy cập (visitCount = 1), hiển thị ngay
      if (newVisitCount === 1) {
        return true;
      }

      if (!dismissData) {
        return false; // Không phải lần đầu và chưa có data dismiss
      }

      try {
        const data = JSON.parse(dismissData);

        // Nếu đã sử dụng > 5 lần và chưa cài đặt, hiển thị lại
        if (newVisitCount > 5 && !isStandalone) {
          const lastDismissed = new Date(data.timestamp);
          const hoursSinceLastDismiss =
            (Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60);

          // Hiển thị lại sau ít nhất 24 giờ kể từ lần dismiss cuối
          return hoursSinceLastDismiss >= 24;
        }

        return false;
      } catch {
        // Nếu data cũ không hợp lệ, cho phép hiển thị nếu đã dùng > 5 lần
        return newVisitCount > 5 && !isStandalone;
      }
    };

    // Delay hiển thị prompt để không làm gián đoạn trải nghiệm người dùng
    const timer = setTimeout(
      () => {
        if (canInstall && checkShouldShowPrompt()) {
          setShowPrompt(true);
          // Delay nhỏ để trigger animation
          setTimeout(() => setIsVisible(true), 100);
        }
      },
      shouldShowPrompt ? 500 : 3000
    ); // Nếu từ context thì hiện nhanh hơn

    return () => clearTimeout(timer);
  }, [canInstall, isStandalone, shouldShowPrompt]);

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      handleHidePrompt();
    }
  };

  const handleDismiss = () => {
    handleHidePrompt();
    // Lưu thời gian dismiss để tính toán hiển thị lại
    const dismissData = {
      timestamp: new Date().toISOString(),
      visitCount: parseInt(localStorage.getItem("appVisitCount") || "0"),
    };
    localStorage.setItem("installPromptDismissed", JSON.stringify(dismissData));
  };

  const handleHidePrompt = () => {
    setIsVisible(false);
    // Delay để animation hoàn thành trước khi unmount
    setTimeout(() => {
      setShowPrompt(false);
      hidePrompt();
    }, 300);
  };

  const renderIOSInstructions = () => (
    <div className="space-y-4">
      {[
        { icon: Share, text: "Nhấn nút Chia sẻ ở dưới", step: 1 },
        { icon: Plus, text: 'Chọn "Thêm vào Màn hình chính"', step: 2 },
        { icon: Home, text: 'Nhấn "Thêm" để hoàn tất', step: 3 },
      ].map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-sm">{item.step}</span>
          </div>
          <div className="flex items-center gap-2">
            <item.icon className="w-5 h-5 text-blue-600" />
            <span className="text-sm">
              <strong>{item.text.split(" ")[0]}</strong>{" "}
              {item.text.split(" ").slice(1).join(" ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAndroidInstructions = () => (
    <div className="space-y-4">
      {deferredPrompt ? (
        <Button
          onClick={handleInstallClick}
          className="w-full bg-green-600 hover:bg-green-700 transition-all hover:scale-105"
        >
          <Download className="w-5 h-5 mr-2" />
          Cài đặt ứng dụng
        </Button>
      ) : (
        <div className="space-y-3">
          {[
            "Nhấn nút Menu (⋮) trên trình duyệt",
            'Chọn "Thêm vào màn hình chính"',
            'Nhấn "Thêm" để hoàn tất',
          ].map((text, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">
                  {index + 1}
                </span>
              </div>
              <span className="text-sm">
                <strong>{text.split(" ")[0]}</strong>{" "}
                {text.split(" ").slice(1).join(" ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Card
        className={`w-full max-w-sm mx-auto transition-all duration-300 ease-out transform ${
          isVisible
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-95 translate-y-4 opacity-0"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <img
                src="/logoapp.png"
                alt="SafeConnect"
                className={`w-12 h-12 rounded-lg transition-all duration-700 ease-out ${
                  isVisible
                    ? "opacity-100 scale-100 rotate-0"
                    : "opacity-0 scale-75 rotate-12"
                }`}
                style={{
                  transitionDelay: isVisible ? "100ms" : "0ms",
                }}
              />
              <div>
                <h3 className="font-semibold text-lg">Cài đặt SafeConnect</h3>
                <p className="text-sm text-gray-600">
                  Truy cập nhanh hơn từ màn hình chính
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors hover:scale-110"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div>
            {deviceType === "ios" && renderIOSInstructions()}
            {deviceType === "android" && renderAndroidInstructions()}

            {deviceType === "desktop" && (
              <div className="text-center">
                {deferredPrompt ? (
                  <Button onClick={handleInstallClick} className="w-full">
                    <Download className="w-5 h-5 mr-2" />
                    Cài đặt ứng dụng
                  </Button>
                ) : (
                  <p className="text-sm text-gray-600">
                    Sử dụng trình duyệt di động để cài đặt ứng dụng lên màn hình
                    chính
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 transition-all hover:scale-105"
            >
              Để sau
            </Button>
            {(deviceType === "ios" || !deferredPrompt) && (
              <Button
                onClick={handleDismiss}
                className="flex-1 transition-all hover:scale-105"
              >
                Đã hiểu
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
