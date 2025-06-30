import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import SplashScreen from "./components/SplashScreen";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SoundProvider } from "./contexts/SoundContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import Home from "./pages/Home";
import Map from "./pages/Map";
import Community from "./pages/Community";
import HashtagPage from "./pages/HashtagPage";
import SupportPoints from "./pages/SupportPoints";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Policy from "./pages/Policy";
import Guide from "./pages/Guide";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSOSRequests from "./pages/admin/AdminSOSRequests";
import AdminSupportPoints from "./pages/admin/AdminSupportPoints";
import AdminCommunity from "./pages/admin/AdminCommunity";
import UserProfile from "./pages/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import MySupportPoints from "./pages/MySupportPoints";
import { InstallPromptProvider } from "./contexts/InstallPromptContext";

const queryClient = new QueryClient();

import React from "react";

const App = () => {
  const [splashDone, setSplashDone] = React.useState(false);

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <HotToaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: `
                  linear-gradient(135deg, 
                    rgba(255,255,255,0.12) 0%,
                    rgba(255,255,255,0.06) 50%,
                    rgba(54,54,54,0.06) 100%
                  ),
                  linear-gradient(45deg,
                    rgba(54,54,54,0.03) 0%,
                    rgba(255,255,255,0.04) 25%,
                    rgba(54,54,54,0.03) 50%,
                    rgba(255,255,255,0.06) 75%,
                    rgba(54,54,54,0.04) 100%
                  )
                `,
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                borderRadius: "12px",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                color: "#fff",
                marginTop: 50,
                WebkitBackdropFilter: "blur(24px)",
              },
              success: {
                style: {
                  background: `
                    linear-gradient(135deg, 
                      rgba(255,255,255,0.12) 0%,
                      rgba(255,255,255,0.06) 50%,
                      rgba(34,197,94,0.06) 100%
                    ),
                    linear-gradient(45deg,
                      rgba(34,197,94,0.03) 0%,
                      rgba(255,255,255,0.04) 25%,
                      rgba(34,197,94,0.03) 50%,
                      rgba(255,255,255,0.06) 75%,
                      rgba(34,197,94,0.04) 100%
                    )
                  `,
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "12px",
                  boxShadow:
                    "0 8px 32px rgba(34, 197, 94, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                  color: "#22c55e",
                  marginTop: 50,
                },
              },
              error: {
                style: {
                  background: `
                    linear-gradient(135deg, 
                      rgba(255,255,255,0.12) 0%,
                      rgba(255,255,255,0.06) 50%,
                      rgba(239,68,68,0.06) 100%
                    ),
                    linear-gradient(45deg,
                      rgba(239,68,68,0.03) 0%,
                      rgba(255,255,255,0.04) 25%,
                      rgba(239,68,68,0.03) 50%,
                      rgba(255,255,255,0.06) 75%,
                      rgba(239,68,68,0.04) 100%
                    )
                  `,
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "12px",
                  boxShadow:
                    "0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                  color: "#ef4444",
                  marginTop: 50,
                },
              },
            }}
          />
          <style>{`
@media (max-width: 600px) {
  .react-hot-toast {
    backdrop-filter: blur(40px) !important;
    -webkit-backdrop-filter: blur(40px) !important;
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(54,54,54,0.04) 100%) !important;
  }
}
`}</style>
          <BrowserRouter>
            <LanguageProvider>
              <AuthProvider>
                <SoundProvider>
                  <InstallPromptProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      {/* Admin Routes */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route
                          path="sos-requests"
                          element={<AdminSOSRequests />}
                        />
                        <Route
                          path="support-points"
                          element={<AdminSupportPoints />}
                        />
                        <Route path="community" element={<AdminCommunity />} />
                        <Route path="admins" element={<AdminUsers />} />
                        <Route path="settings" element={<Profile />} />
                        <Route path="profile" element={<Profile />} />
                        <Route
                          path="profile/:userId"
                          element={<UserProfile />}
                        />
                      </Route>

                      {/* User Routes */}
                      <Route path="/" element={<Layout />}>
                        <Route path="home" element={<Home />} />
                        <Route path="map" element={<Map />} />
                        <Route path="community" element={<Community />} />
                        <Route
                          path="support-points"
                          element={<SupportPoints />}
                        />
                        <Route
                          path="my-support-points"
                          element={<MySupportPoints />}
                        />
                        <Route
                          path="hashtag/:hashtag"
                          element={<HashtagPage />}
                        />
                        <Route
                          path="history"
                          element={
                            <ProtectedRoute>
                              <History />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="profile" element={<Profile />} />
                        <Route path="settings" element={<Settings />} />
                        <Route
                          path="profile/:userId"
                          element={<UserProfile />}
                        />
                        <Route path="about" element={<About />} />
                        <Route path="policy" element={<Policy />} />
                        <Route path="guide" element={<Guide />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </InstallPromptProvider>
                </SoundProvider>
              </AuthProvider>
            </LanguageProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
