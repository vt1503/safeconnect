import { supabase } from '@/integrations/supabase/client';

export interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static readonly VAPID_PUBLIC_KEY = 'BLBz5HWVPrM-cFnl7LVtDzAu4wz5tVrXuRQUfTGUQkjQn9_WNRSSfGfpuJm1NCVAcxpwMJLDvGhvcnb-QEd9G-A';

  /**
   * Kiểm tra xem trình duyệt có hỗ trợ Push API không
   */
  static isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Kiểm tra xem người dùng đã đăng ký nhận thông báo chưa
   */
  static async hasSubscription(): Promise<boolean> {
    try {
      if (!this.isPushSupported()) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking push subscription:', error);
      return false;
    }
  }

  /**
   * Kiểm tra trạng thái quyền thông báo hiện tại
   */
  static getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Đăng ký nhận thông báo đẩy
   */
  static async subscribe(userId?: string): Promise<boolean> {
    try {
      if (!this.isPushSupported()) {
        console.warn('Push notifications are not supported in this browser');
        return false;
      }

      // Kiểm tra xem service worker đã đăng ký chưa
      let swRegistration;
      try {
        swRegistration = await navigator.serviceWorker.ready;
      } catch (error) {
        console.error('Service Worker not ready:', error);
        
        // Thử đăng ký service worker nếu chưa có
        try {
          swRegistration = await navigator.serviceWorker.register('/sw.js');
          // Đợi service worker kích hoạt
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (swError) {
          console.error('Failed to register service worker:', swError);
          return false;
        }
      }

      // Yêu cầu quyền thông báo
      let permission;
      try {
        permission = await Notification.requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        
        // Xử lý trình duyệt cũ sử dụng callback thay vì Promise
        if (error instanceof TypeError) {
          permission = await new Promise<NotificationPermission>(resolve => {
            Notification.requestPermission(result => resolve(result));
          });
        } else {
          return false;
        }
      }

      if (permission !== 'granted') {
        console.warn('Notification permission denied:', permission);
        return false;
      }

      // Đăng ký subscription
      try {
        const subscription = await swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
        });

        // Lưu subscription vào Supabase
        if (userId) {
          await this.saveSubscription(userId, subscription);
        } else {
          // Lưu subscription vào localStorage nếu chưa đăng nhập
          // Sẽ được lưu vào Supabase sau khi đăng nhập
          localStorage.setItem('pendingPushSubscription', JSON.stringify(subscription));
        }

        return true;
      } catch (subscribeError) {
        console.error('Error subscribing to push:', subscribeError);
        return false;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  /**
   * Hủy đăng ký nhận thông báo đẩy
   */
  static async unsubscribe(userId?: string): Promise<boolean> {
    try {
      if (!this.isPushSupported()) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) return true; // Đã hủy đăng ký rồi

      // Hủy đăng ký
      const result = await subscription.unsubscribe();

      // Xóa subscription khỏi Supabase nếu đã đăng nhập
      if (userId) {
        await this.deleteSubscription(userId, subscription.endpoint);
      }

      // Xóa subscription khỏi localStorage nếu có
      localStorage.removeItem('pendingPushSubscription');

      return result;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Lưu subscription vào Supabase
   */
  static async saveSubscription(userId: string, subscription: PushSubscriptionJSON): Promise<void> {
    try {
      // Kiểm tra xem subscription đã tồn tại chưa
      const { data: existingSubscription } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('subscription->endpoint', subscription.endpoint)
        .single();

      if (existingSubscription) {
        // Cập nhật subscription nếu đã tồn tại
        await supabase
          .from('push_subscriptions')
          .update({ subscription })
          .eq('id', existingSubscription.id);
      } else {
        // Thêm mới nếu chưa tồn tại
        await supabase
          .from('push_subscriptions')
          .insert({ user_id: userId, subscription });
      }
    } catch (error) {
      console.error('Error saving push subscription to Supabase:', error);
      throw error;
    }
  }

  /**
   * Xóa subscription khỏi Supabase
   */
  static async deleteSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId)
        .eq('subscription->endpoint', endpoint);
    } catch (error) {
      console.error('Error deleting push subscription from Supabase:', error);
      throw error;
    }
  }

  /**
   * Chuyển đổi base64 URL-safe thành Uint8Array
   * (Cần thiết cho applicationServerKey)
   */
  private static urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Lưu subscription đang chờ xử lý vào Supabase sau khi đăng nhập
   */
  static async savePendingSubscription(userId: string): Promise<void> {
    try {
      const pendingSubscription = localStorage.getItem('pendingPushSubscription');
      if (pendingSubscription) {
        await this.saveSubscription(userId, JSON.parse(pendingSubscription));
        localStorage.removeItem('pendingPushSubscription');
      }
    } catch (error) {
      console.error('Error saving pending push subscription:', error);
    }
  }
}