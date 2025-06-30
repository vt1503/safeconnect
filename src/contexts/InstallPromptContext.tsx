import React, { createContext, useContext, useState, ReactNode } from "react";

interface InstallPromptContextType {
  shouldShowPrompt: boolean;
  showPrompt: () => void;
  hidePrompt: () => void;
}

const InstallPromptContext = createContext<
  InstallPromptContextType | undefined
>(undefined);

export const useInstallPromptContext = () => {
  const context = useContext(InstallPromptContext);
  if (!context) {
    throw new Error(
      "useInstallPromptContext must be used within InstallPromptProvider"
    );
  }
  return context;
};

interface InstallPromptProviderProps {
  children: ReactNode;
}

export const InstallPromptProvider: React.FC<InstallPromptProviderProps> = ({
  children,
}) => {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  const showPrompt = () => setShouldShowPrompt(true);
  const hidePrompt = () => setShouldShowPrompt(false);

  return (
    <InstallPromptContext.Provider
      value={{ shouldShowPrompt, showPrompt, hidePrompt }}
    >
      {children}
    </InstallPromptContext.Provider>
  );
};
