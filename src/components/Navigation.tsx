import React from "react";
import { NavLink } from "react-router-dom";
import { Home, MapPin, Users, Bell, User } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSound } from "@/contexts/SoundContext";

// Audio for navigation sound
const navigationSound = new Audio("/sounds/pop.wav");
navigationSound.preload = "none";
navigationSound.muted = true;
navigationSound.setAttribute("playsinline", "true");
navigationSound.setAttribute("webkit-playsinline", "true");
navigationSound.style.display = "none";
navigationSound.style.position = "absolute";
navigationSound.style.left = "-9999px";
navigationSound.style.top = "-9999px";
navigationSound.style.width = "0";
navigationSound.style.height = "0";
navigationSound.style.opacity = "0";
navigationSound.style.pointerEvents = "none";

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { playSound } = useSound();

  const handleNavigationClick = () => {
    // Play navigation sound using SoundContext
    playSound(navigationSound);
  };

  const navItems = [
    { to: "/home", icon: Home, label: t("nav.home") },
    { to: "/map", icon: MapPin, label: t("nav.map") },
    { to: "/community", icon: Users, label: t("nav.community") },
    { to: "/support-points", icon: Bell, label: t("nav.support_points") },
    { to: "/profile", icon: User, label: t("nav.profile") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 dark:border-gray-600/20 bg-white/0 dark:bg-gray-800/0 backdrop-blur-lg shadow-2xl">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around py-3 pb-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavigationClick}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center relative transition-all duration-300 ease-out ${
                  isActive
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`
                    relative p-3 rounded-2xl transition-all duration-300 ease-out
                    ${!isActive ? "hover:scale-105" : ""}
                    ${
                      isActive
                        ? "bg-red-100/80 dark:bg-red-900/80 border border-red-200 dark:border-red-700 shadow-lg scale-110"
                        : "hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
                    }
                  `}
                  >
                    <item.icon
                      size={22}
                      className={`transition-all duration-300 ${
                        isActive
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    />
                  </div>
                  <span
                    className={`
                    text-xs mt-1 transition-all duration-300 font-medium
                    ${
                      isActive
                        ? "text-red-600 dark:text-red-400 scale-105"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
