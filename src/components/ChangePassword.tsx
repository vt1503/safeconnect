import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangePasswordFormComponentProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (value: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  loading: boolean;
  handleChangePassword: () => Promise<void>;
  handleClose: () => void;
}

const ChangePasswordFormComponent: React.FC<
  ChangePasswordFormComponentProps
> = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  handleChangePassword,
  handleClose,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">
          {t("change_password.current_password")}
        </Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("change_password.current_password_placeholder")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          >
            {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">{t("change_password.new_password")}</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("change_password.new_password_placeholder")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowNewPassword(!showNewPassword)}
          >
            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {t("change_password.confirm_password")}
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("change_password.confirm_password_placeholder")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button
          onClick={handleClose}
          variant="outline"
          className="flex-1"
          disabled={loading}
        >
          {t("change_password.cancel")}
        </Button>
        <Button
          onClick={handleChangePassword}
          className="flex-1"
          disabled={loading}
        >
          {loading
            ? t("change_password.updating")
            : t("change_password.submit")}
        </Button>
      </div>
    </div>
  );
};

const ChangePassword: React.FC<ChangePasswordProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t("change_password.error_fill_all_fields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("change_password.error_password_mismatch"));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t("change_password.error_password_too_short"));
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(
        t("change_password.error_same_as_current") ||
          "Mật khẩu mới không được trùng với mật khẩu hiện tại"
      );
      return;
    }

    if (!user?.email) {
      toast.error(t("change_password.error_generic"));
      return;
    }

    setLoading(true);
    // Xác thực lại current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setLoading(false);
      toast.error(
        t("change_password.error_wrong_current_password") ||
          "Mật khẩu hiện tại không đúng"
      );
      return;
    }

    const changePassword = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return true;
    };

    toast
      .promise(changePassword(), {
        loading: t("change_password.updating"),
        success: <b>{t("change_password.success_message")}</b>,
        error: <b>{t("change_password.error_generic")}</b>,
      })
      .then(async () => {
        handleClose();
        // Đăng xuất và chuyển hướng về trang đăng nhập
        await supabase.auth.signOut();
        navigate("/login");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{t("change_password.title")}</DrawerTitle>
          </DrawerHeader>
          <ChangePasswordFormComponent
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showCurrentPassword={showCurrentPassword}
            setShowCurrentPassword={setShowCurrentPassword}
            showNewPassword={showNewPassword}
            setShowNewPassword={setShowNewPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            loading={loading}
            handleChangePassword={handleChangePassword}
            handleClose={handleClose}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("change_password.title")}</DialogTitle>
        </DialogHeader>
        <ChangePasswordFormComponent
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          showCurrentPassword={showCurrentPassword}
          setShowCurrentPassword={setShowCurrentPassword}
          showNewPassword={showNewPassword}
          setShowNewPassword={setShowNewPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          loading={loading}
          handleChangePassword={handleChangePassword}
          handleClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChangePassword;
