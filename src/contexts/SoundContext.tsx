import React, { createContext, useContext, useState, useEffect } from "react";

interface SoundContextType {
  isSoundEnabled: boolean;
  toggleSound: () => void;
  playSound: (audio: HTMLAudioElement) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
};

interface SoundProviderProps {
  children: React.ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Load sound preference from localStorage
    const saved = localStorage.getItem("soundEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    // Save sound preference to localStorage
    localStorage.setItem("soundEnabled", JSON.stringify(isSoundEnabled));
  }, [isSoundEnabled]);

  const toggleSound = () => {
    setIsSoundEnabled((prev: boolean) => !prev);
  };

  const playSound = (audio: HTMLAudioElement) => {
    if (isSoundEnabled) {
      // Create a new audio element dynamically to avoid media controls
      const newAudio = new Audio(audio.src);
      newAudio.preload = "none";
      newAudio.muted = false;
      newAudio.volume = 0.5;

      // Set playsinline attributes for mobile
      newAudio.setAttribute("playsinline", "true");
      newAudio.setAttribute("webkit-playsinline", "true");

      // Hide the audio element completely
      newAudio.style.display = "none";
      newAudio.style.position = "absolute";
      newAudio.style.left = "-9999px";
      newAudio.style.top = "-9999px";
      newAudio.style.width = "0";
      newAudio.style.height = "0";
      newAudio.style.opacity = "0";
      newAudio.style.pointerEvents = "none";

      // Add to DOM temporarily
      document.body.appendChild(newAudio);

      // Play the sound
      newAudio.play().catch((error) => {
        console.log("Error playing sound:", error);
      });

      // Clean up the audio element after playing
      newAudio.addEventListener("ended", () => {
        if (newAudio.parentNode) {
          newAudio.parentNode.removeChild(newAudio);
        }
      });

      // Also clean up after a timeout in case ended event doesn't fire
      setTimeout(() => {
        if (newAudio.parentNode) {
          newAudio.parentNode.removeChild(newAudio);
        }
      }, 5000);
    }
  };

  const value = {
    isSoundEnabled,
    toggleSound,
    playSound,
  };

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
};
