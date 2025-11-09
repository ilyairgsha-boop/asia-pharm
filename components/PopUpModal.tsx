import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Dialog, DialogContent } from './ui/dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface PopUpSettings {
  enabled: boolean;
  content: string;
  showOnce: boolean;
  delay: number;
}

export const PopUpModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<PopUpSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'popup_settings')
        .single();

      if (error || !data?.value) {
        return;
      }

      const popupSettings = data.value as PopUpSettings;
      setSettings(popupSettings);

      // Check if popup should be shown
      if (popupSettings.enabled) {
        // Check if we should show only once
        if (popupSettings.showOnce) {
          const shown = sessionStorage.getItem('popup_shown');
          if (shown === 'true') {
            return;
          }
        }

        // Show popup after delay
        setTimeout(() => {
          setIsOpen(true);
          if (popupSettings.showOnce) {
            sessionStorage.setItem('popup_shown', 'true');
          }
        }, (popupSettings.delay || 0) * 1000);
      }
    } catch (error) {
      console.error('Error loading popup settings:', error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!settings?.enabled || !settings?.content) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10 rounded-full bg-white/80 hover:bg-white"
          onClick={handleClose}
        >
          <X size={20} />
        </Button>

        {/* Content */}
        <div 
          className="p-8"
          dangerouslySetInnerHTML={{ __html: settings.content }}
        />
      </DialogContent>
    </Dialog>
  );
};