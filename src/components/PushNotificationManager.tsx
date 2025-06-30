import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PushNotificationService } from '@/utils/pushNotificationService';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';

interface PushNotificationManagerProps {
  className?: string;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ className }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    const checkPushSupport = async () => {
      const supported = PushNotificationService.isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const hasSubscription = await PushNotificationService.hasSubscription();
        setIsSubscribed(hasSubscription);
        
        // Kiểm tra trạng thái quyền hiện tại
        const currentPermission = PushNotificationService.getNotificationPermissionStatus();
        setPermissionStatus(currentPermission);
      }
    };

    checkPushSupport();
  }, []);

  // Khi user đăng nhập, lưu subscription đang chờ xử lý (nếu có)
  useEffect(() => {
    if (user?.id) {
      PushNotificationService.savePendingSubscription(user.id)
        .catch(error => console.error('Error saving pending subscription:', error));
    }
  }, [user?.id]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const success = await PushNotificationService.subscribe(user?.id);
      
      // Cập nhật trạng thái quyền sau khi yêu cầu
      const newPermissionStatus = PushNotificationService.getNotificationPermissionStatus();
      setPermissionStatus(newPermissionStatus);
      
      if (success) {
        setIsSubscribed(true);
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
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const success = await PushNotificationService.unsubscribe(user?.id);
      if (success) {
        setIsSubscribed(false);
        toast.success(t('pushNotifications.unsubscribeSuccess'));
      } else {
        toast.error(t('pushNotifications.unsubscribeFailed'));
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error(t('pushNotifications.unsubscribeFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  // Nếu quyền đã bị từ chối, hiển thị thông báo
  if (permissionStatus === 'denied') {
    return (
      <div className={className}>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={true}
          className="flex items-center gap-2 text-amber-600 border-amber-300"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>{t('pushNotifications.permissionDenied')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {isSubscribed ? (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleUnsubscribe}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <BellOff className="w-4 h-4" />
          <span>{t('pushNotifications.unsubscribe')}</span>
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSubscribe}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          <span>{t('pushNotifications.subscribe')}</span>
        </Button>
      )}
    </div>
  );
};

export default PushNotificationManager;