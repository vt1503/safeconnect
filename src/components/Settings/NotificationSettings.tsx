import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { PushNotificationService } from '@/utils/pushNotificationService';
import toast from 'react-hot-toast';

const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
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

  const handleToggleNotifications = async () => {
    if (!isSupported) {
      toast.error(t('pushNotifications.notSupported'));
      return;
    }

    setLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe
        const success = await PushNotificationService.unsubscribe(user?.id);
        if (success) {
          setIsSubscribed(false);
          toast.success(t('pushNotifications.unsubscribeSuccess'));
        } else {
          toast.error(t('pushNotifications.unsubscribeFailed'));
        }
      } else {
        // Subscribe
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
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      toast.error(isSubscribed 
        ? t('pushNotifications.unsubscribeFailed') 
        : t('pushNotifications.subscribeFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t('pushNotifications.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-600">
                <BellOff size={20} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {t('pushNotifications.notSupported')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('pushNotifications.description')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('pushNotifications.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              {isSubscribed ? (
                <Bell size={20} className="text-blue-600 dark:text-blue-400" />
              ) : (
                <BellOff size={20} className="text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {isSubscribed 
                  ? t('pushNotifications.unsubscribe')
                  : t('pushNotifications.subscribe')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('pushNotifications.description')}
              </p>
              
              {/* Hiển thị thông báo nếu quyền bị từ chối */}
              {permissionStatus === 'denied' && (
                <div className="flex items-center mt-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  <span>{t('pushNotifications.permissionDenied')}</span>
                </div>
              )}
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={loading || permissionStatus === 'denied'}
          />
        </div>
        
        {/* Hiển thị hướng dẫn nếu quyền bị từ chối */}
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
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;