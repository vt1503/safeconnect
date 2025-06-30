import React, { createContext, useContext, useState, useEffect } from "react";
import { IPDetectionService, LocationData } from "../utils/ipDetection";
import LanguageDetectionPrompt from "../components/LanguageDetectionPrompt";

// Static imports instead of dynamic imports to fix Netlify production issues
import viTranslations from "../i18n/translations/vi.json";
import enTranslations from "../i18n/translations/en.json";

type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

// Translation objects map for reliable access
const translationsMap = {
  vi: viTranslations as unknown as Record<string, string>,
  en: enTranslations as unknown as Record<string, string>,
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage || "vi";
  });

  const [translations, setTranslations] = useState<Record<string, string>>(
    () => {
      return translationsMap[language] || translationsMap.vi;
    }
  );

  const [showLanguagePrompt, setShowLanguagePrompt] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(
    null
  );

  useEffect(() => {
    loadTranslations(language);
  }, [language]);

  // Auto-detect IP location on first visit
  useEffect(() => {
    const checkIPLocation = async () => {
      // Only check if user hasn't set a language preference and hasn't been prompted this session
      if (
        !IPDetectionService.hasLanguagePreference() &&
        !IPDetectionService.hasBeenPrompted()
      ) {
        try {
          const locationData = await IPDetectionService.detectLocation();
          setDetectedLocation(locationData);

          if (IPDetectionService.shouldShowLanguagePrompt(locationData)) {
            setShowLanguagePrompt(true);
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.warn("Failed to detect IP location:", error);
          }
        }
      }
    };

    // Small delay to ensure UI is loaded
    const timer = setTimeout(checkIPLocation, 1000);
    return () => clearTimeout(timer);
  }, []);

  const loadTranslations = (lang: Language) => {
    try {
      const translationData = translationsMap[lang];
      if (translationData) {
        setTranslations(translationData);
      } else {
        // Fallback to Vietnamese if language not found
        setTranslations(translationsMap.vi);
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Translations for ${lang} not found, using Vietnamese fallback`
          );
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Failed to load translations for ${lang}:`, error);
      }
      // Fallback to Vietnamese
      setTranslations(translationsMap.vi);
    }
  };

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem("language", lang);
    setLanguage(lang);
  };

  const handleAcceptEnglish = () => {
    handleSetLanguage("en");
    setShowLanguagePrompt(false);
    IPDetectionService.markAsPrompted();
  };

  const handleDeclineEnglish = () => {
    setShowLanguagePrompt(false);
    IPDetectionService.markAsPrompted();
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: handleSetLanguage, t }}
    >
      {children}
      <LanguageDetectionPrompt
        isOpen={showLanguagePrompt}
        onAccept={handleAcceptEnglish}
        onDecline={handleDeclineEnglish}
        detectedCountry={detectedLocation?.country}
      />
    </LanguageContext.Provider>
  );
};
