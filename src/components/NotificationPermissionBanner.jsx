import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';

export default function NotificationPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Only show if notifications are supported and not yet granted
    if (
      'Notification' in window && 
      Notification.permission === 'default' &&
      !localStorage.getItem('notifications-dismissed')
    ) {
      // Show after 2 seconds
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    const granted = await requestNotificationPermission();
    if (granted) {
      setShowBanner(false);
    }
    setIsRequesting(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notifications-dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <Alert className="mb-6 bg-primary/10 border-primary/20">
      <Bell className="h-5 w-5 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-sm">
          Enable browser notifications to get real-time alerts when new trips arrive or drivers go offline.
        </span>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 text-xs"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={isRequesting}
            className="h-8 text-xs"
          >
            {isRequesting ? 'Enabling...' : 'Enable Notifications'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}