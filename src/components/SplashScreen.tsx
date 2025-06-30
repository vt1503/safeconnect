import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showSafeConnect, setShowSafeConnect] = useState(true);
  const [showPoweredBy, setShowPoweredBy] = useState(false);

  useEffect(() => {
    // Hide SafeConnect logo after 2.5 seconds
    const hideSafeConnectTimer = setTimeout(() => {
      setShowSafeConnect(false);
    }, 2500);

    // Show "Powered by Bolt" after 3.2 seconds
    const showPoweredByTimer = setTimeout(() => {
      setShowPoweredBy(true);
    }, 3200);

    // Hide splash screen after 6 seconds total
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 800); // Wait for exit animation to complete
    }, 6000);

    return () => {
      clearTimeout(hideSafeConnectTimer);
      clearTimeout(showPoweredByTimer);
      clearTimeout(hideTimer);
    };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
        >
          {/* SafeConnect Logo */}
          <AnimatePresence>
            {showSafeConnect && (
              <motion.div
                initial={{
                  scale: 0.3,
                  opacity: 0,
                  filter: "blur(20px)",
                  rotateY: 180,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  filter: "blur(0px)",
                  rotateY: 0,
                }}
                exit={{
                  scale: 1.2,
                  opacity: 0,
                  filter: "blur(10px)",
                  rotateX: 90,
                }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.3,
                }}
                className="w-32 h-32 flex items-center justify-center"
              >
                <img
                  src="/logosc.png"
                  alt="SafeConnect"
                  className="w-full h-full object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Powered by Bolt Logo */}
          <AnimatePresence>
            {showPoweredBy && (
              <motion.div
                initial={{
                  scale: 0.1,
                  opacity: 0,
                  filter: "blur(15px)",
                  y: 50,
                  rotate: -45,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  filter: "blur(0px)",
                  y: 0,
                  rotate: 0,
                }}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                  filter: "blur(8px)",
                  y: -30,
                  rotate: 15,
                }}
                transition={{
                  duration: 1,
                  type: "spring",
                  bounce: 0.4,
                  stiffness: 100,
                }}
                className="flex items-center justify-center"
              >
                <img
                  src="/bolttag/poweredbybolt.png"
                  alt="Powered by Bolt"
                  className="h-12 object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
