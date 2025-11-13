import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { useLanguage } from '../contexts/LanguageContext';
import { Dialog, DialogContent } from './ui/dialog';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import type { Language } from '../utils/i18n';

interface PopUpContent {
  ru: string;
  en: string;
  zh: string;
  vi: string;
}

interface PopUpSettings {
  enabled: boolean;
  content: PopUpContent | string; // Support old format (string) and new format (object)
  showOnce: boolean;
  delay: number;
}

export const PopUpModal = () => {
  const { language } = useLanguage();
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

  // Get content for current language
  const getContent = (): string => {
    if (!settings?.content) return '';
    
    // Old format support (string)
    if (typeof settings.content === 'string') {
      return settings.content;
    }
    
    // New format (multilingual object)
    const content = settings.content as PopUpContent;
    
    // Return content for current language, fallback to Russian if not available
    return content[language as Language] || content.ru || '';
  };

  const currentContent = getContent();

  if (!settings?.enabled || !currentContent) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-full sm:max-w-2xl p-0 gap-0 mx-2 sm:mx-auto">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 sm:right-4 sm:top-4 z-10 rounded-full bg-white/80 hover:bg-white"
          onClick={handleClose}
        >
          <X size={20} />
        </Button>

        {/* Content */}
        <div 
          className="p-4 sm:p-8"
          dangerouslySetInnerHTML={{ __html: currentContent }}
        />
      </DialogContent>
    </Dialog>
  );
};