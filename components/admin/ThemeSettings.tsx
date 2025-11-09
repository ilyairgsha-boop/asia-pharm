import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { themes, ThemeType } from '../../utils/themes';
import { Check, Palette, Sparkles } from 'lucide-react';

export const ThemeSettings = () => {
  const { t, language } = useLanguage();
  const { currentTheme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleThemeChange = async (themeId: ThemeType) => {
    setLoading(true);
    try {
      await setTheme(themeId);
      toast.success(t('themeApplied'));
    } catch (error) {
      console.error('Error changing theme:', error);
      toast.error(t('themeError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6" />
            <CardTitle>{t('themeSettings')}</CardTitle>
          </div>
          <CardDescription>{t('themeSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(themes).map((theme) => {
              const isActive = currentTheme === theme.id;
              const hasDecorations = theme.decorations?.enabled;

              return (
                <Card
                  key={theme.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isActive ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => !loading && handleThemeChange(theme.id)}
                >
                  <CardHeader className="relative">
                    {isActive && (
                      <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-1">
                        <Check size={16} />
                      </div>
                    )}
                    
                    <CardTitle className="text-lg flex items-center gap-2">
                      {theme.name[language]}
                      {hasDecorations && (
                        <Sparkles size={16} className="text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {theme.description[language]}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Color Preview */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{t('colorScheme')}:</p>
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: theme.colors.primary }}
                          title={t('primaryColor')}
                        />
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: theme.colors.secondary }}
                          title={t('secondaryColor')}
                        />
                        <div
                          className="w-8 h-8 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: theme.colors.accent }}
                          title={t('accentColor')}
                        />
                      </div>
                    </div>

                    {/* Decorations Badge */}
                    {hasDecorations && (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles size={12} />
                        {t('withDecorations')}
                      </Badge>
                    )}

                    {/* Apply Button */}
                    {!isActive && (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={loading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleThemeChange(theme.id);
                        }}
                      >
                        {t('applyTheme')}
                      </Button>
                    )}

                    {isActive && (
                      <Button
                        className="w-full"
                        variant="default"
                        disabled
                      >
                        {t('activeTheme')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Theme Preview Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t('themePreviewTitle')}</CardTitle>
          <CardDescription>{t('themePreviewDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">{t('currentTheme')}:</h3>
              <p className="text-lg">{themes[currentTheme].name[language]}</p>
              <p className="text-sm text-gray-600">
                {themes[currentTheme].description[language]}
              </p>
            </div>

            {themes[currentTheme].decorations?.enabled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Sparkles className="inline w-4 h-4 mr-1" />
                  {t('decorationsEnabled')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
