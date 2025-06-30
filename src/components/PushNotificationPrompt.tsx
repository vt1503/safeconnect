import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { PushNotificationService } from '@/utils/pushNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface PushNotificationPromptProps {
  onClose: () => void;
}

const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    const checkShouldPrompt = async () => {
      // Kiểm tra trạng thái quyền hiện tại
      const currentPermission = PushNotificationService.getNotificationPermissionStatus();
      setPermissionStatus(currentPermission);
      
      // Không hiển thị prompt nếu quyền đã bị từ chối
      if (currentPermission === 'denied') {
        return;
      }
      
      // Không hiển thị prompt nếu không hỗ trợ
      if (!PushNotificationService.isPushSupported()) {
        return;
      }

      const hasSubscription = await PushNotificationService.hasSubscription();
      if (hasSubscription) {
        return;
      }

      // Kiểm tra xem đã hiển thị prompt gần đây chưa
      const lastPrompt = localStorage.getItem('push-notification-prompt-time');
      if (lastPrompt) {
        const lastPromptTime = parseInt(lastPrompt, 10);
        const now = Date.now();
        // Không hiển thị lại nếu chưa đủ 7 ngày
        if (now - lastPromptTime < 7 * 24 * 60 * 60 * 1000) {
          return;
        }
      }

      // Hiển thị prompt
      setIsOpen(true);
    };

    // Trì hoãn hiển thị prompt để không ảnh hưởng đến quá trình tải ban đầu
    const timer = setTimeout(checkShouldPrompt, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const success = await PushNotificationService.subscribe(user?.id);
      
      // Cập nhật trạng thái quyền sau khi yêu cầu
      const newPermissionStatus = PushNotificationService.getNotificationPermissionStatus();
      setPermissionStatus(newPermissionStatus);
      
      if (success) {
        // Ghi nhận đã hiển thị prompt
        localStorage.setItem('push-notification-prompt-time', Date.now().toString());
        toast.success(t('pushNotifications.subscribeSuccess'));
      } else {
        if (newPermissionStatus === 'denied') {
          toast.error(t('pushNotifications.permissionDenied'));
        } else {
          toast.error(t('pushNotifications.subscribeFailed'));
        }
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error(t('pushNotifications.subscribeFailed'));
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Ghi nhận đã hiển thị prompt ngay cả khi người dùng từ chối
    localStorage.setItem('push-notification-prompt-time', Date.now().toString());
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-blue-600" />
            {t('pushNotifications.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {t('pushNotifications.description')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('pushNotifications.sosNearby')}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Nhận thông báo khi có yêu cầu SOS gần bạn
            </p>
          </div>
          
          {/* Hiển thị thông báo nếu quyền bị từ chối */}
          {permissionStatus === 'denied' && (
            <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Quyền thông báo đã bị chặn
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    Để bật thông báo, bạn cần vào cài đặt trình duyệt và cho phép thông báo cho trang web này.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSubscribe}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading || permissionStatus === 'denied'}
          >
            <Bell className="w-4 h-4 mr-2" />
            {loading ? "Đang xử lý..." : t('pushNotifications.subscribe')}
          </Button>
          <Button onClick={handleClose} variant="outline" className="flex-1">
            <X className="w-4 h-4 mr-2" />
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PushNotificationPrompt;