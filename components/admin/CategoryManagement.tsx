import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { createClient } from '../../utils/supabase/client';
import { 
  Save, Loader2, Plus, Trash2, Edit2, X, Layers, LayoutGrid,
  Activity, Heart, Pill, Droplet, Brain, Bone, Thermometer, 
  Leaf, Shield, Zap, User, Baby, Eye, CircleDot, Package,
  Sparkles, Coffee, Wind, Apple
} from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  translations: {
    ru: string;
    en: string;
    zh: string;
    vi: string;
  };
  icon?: string; // For sidebar categories
  order: number;
}

interface CategoryData {
  topMenu: Category[];
  sidebar: Category[];
}

// Available icons for sidebar
const AVAILABLE_ICONS = [
  { id: 'Activity', icon: Activity, label: 'Activity' },
  { id: 'Heart', icon: Heart, label: 'Heart' },
  { id: 'Pill', icon: Pill, label: 'Pill' },
  { id: 'Droplet', icon: Droplet, label: 'Droplet' },
  { id: 'Brain', icon: Brain, label: 'Brain' },
  { id: 'Bone', icon: Bone, label: 'Bone' },
  { id: 'Thermometer', icon: Thermometer, label: 'Thermometer' },
  { id: 'Leaf', icon: Leaf, label: 'Leaf' },
  { id: 'Shield', icon: Shield, label: 'Shield' },
  { id: 'Zap', icon: Zap, label: 'Zap' },
  { id: 'User', icon: User, label: 'User' },
  { id: 'Baby', icon: Baby, label: 'Baby' },
  { id: 'Eye', icon: Eye, label: 'Eye' },
  { id: 'CircleDot', icon: CircleDot, label: 'CircleDot' },
  { id: 'Package', icon: Package, label: 'Package' },
  { id: 'Sparkles', icon: Sparkles, label: 'Sparkles' },
  { id: 'Coffee', icon: Coffee, label: 'Coffee' },
  { id: 'Wind', icon: Wind, label: 'Wind' },
  { id: 'Apple', icon: Apple, label: 'Apple' },
];

export const CategoryManagement = () => {
  const { t, currentLanguage } = useLanguage();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'topMenu' | 'sidebar'>('topMenu');
  const [categories, setCategories] = useState<CategoryData>({
    topMenu: [],
    sidebar: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    translations: { ru: '', en: '', zh: '', vi: '' },
    icon: 'Package',
    order: 0,
  });

  useEffect(() => {
    if (accessToken) {
      loadCategories();
    }
  }, [accessToken]);

  const loadCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('kv_store_a75b5353')
        .select('value')
        .eq('key', 'categories')
        .maybeSingle();

      if (error) {
        console.error('❌ Failed to load categories:', error);
        // Use default categories if not found
        const defaultCategories = { topMenu: [], sidebar: [] };
        setCategories(defaultCategories);
      } else {
        const loadedCategories = data?.value || { topMenu: [], sidebar: [] };
        
        console.log('✅ Categories loaded from database');
        console.log('📊 Categories stats:');
        console.log('  - Top Menu categories:', loadedCategories.topMenu?.length || 0);
        console.log('  - Sidebar categories:', loadedCategories.sidebar?.length || 0);
        
        setCategories(loadedCategories);
        setHasUnsavedChanges(false);
        
        // Save to localStorage for frontend use
        localStorage.setItem('categories', JSON.stringify(loadedCategories));
        console.log('💾 Categories saved to localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('💾 Saving categories:', categories);
      
      const supabase = createClient();
      const { error } = await supabase
        .from('kv_store_a75b5353')
        .upsert({
          key: 'categories',
          value: categories,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        // Save to localStorage for frontend use
        localStorage.setItem('categories', JSON.stringify(categories));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('categoriesUpdated'));
        
        setHasUnsavedChanges(false);
        toast.success(t('saveSuccess'));
        console.log('✅ Categories saved successfully');
        console.log('📢 Dispatched categoriesUpdated event');
      } else {
        console.error('❌ Failed to save categories:', error);
        toast.error(t('saveError'));
      }
    } catch (error) {
      console.error('❌ Error saving categories:', error);
      toast.error(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Вы уверены? Это удалит все текущие категории и загрузит категории по умолчанию с правильной структурой переводов.')) {
      return;
    }

    setSaving(true);
    try {
      console.log('🔄 Resetting categories to defaults...');
      
      // Clear localStorage first
      localStorage.removeItem('categories');
      
      // Define default categories
      const defaultCategories = {
        topMenu: [],
        sidebar: []
      };
      
      console.log('✅ Using default categories');
      
      setCategories(defaultCategories);
      
      // Save defaults to database
      const supabase = createClient();
      const { error } = await supabase
        .from('kv_store_a75b5353')
        .upsert({
          key: 'categories',
          value: defaultCategories,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        // Save to localStorage for frontend use
        localStorage.setItem('categories', JSON.stringify(defaultCategories));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('categoriesUpdated'));
        
        setHasUnsavedChanges(false);
        toast.success('✅ Категории сброшены к значениям по умолчанию!');
        console.log('✅ Categories reset to defaults successfully');
        console.log('📢 Dispatched categoriesUpdated event');
      } else {
        console.error('❌ Failed to save default categories:', error);
        toast.error('Ошибка при сохранении категорий по умолчанию');
      }
    } catch (error) {
      console.error('❌ Error resetting categories:', error);
      toast.error('Ошибка при сбросе категорий');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteReset = async () => {
    if (!confirm('⚠️ ВНИМАНИЕ! Это ПОЛНОСТЬЮ удалит все категории из базы данных и создаст заново с новым списком. Вы уверены?')) {
      return;
    }

    if (!confirm('🚨 ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ! Все текущие категории будут безвозвратно удалены. Продолжить?')) {
      return;
    }

    setSaving(true);
    try {
      console.log('🔄 COMPLETE RESET - Deleting all categories and recreating...');
      
      // Clear localStorage first
      localStorage.removeItem('categories');
      
      // Create fresh empty categories
      const freshCategories = {
        topMenu: [],
        sidebar: []
      };
      
      console.log('✅ Fresh categories created');
      
      setCategories(freshCategories);
      
      // Delete and recreate in database
      const supabase = createClient();
      
      // Delete existing
      await supabase
        .from('kv_store_a75b5353')
        .delete()
        .eq('key', 'categories');
      
      // Insert fresh
      const { error } = await supabase
        .from('kv_store_a75b5353')
        .insert({
          key: 'categories',
          value: freshCategories,
          updated_at: new Date().toISOString()
        });

      if (!error) {
        // Save to localStorage for frontend use
        localStorage.setItem('categories', JSON.stringify(freshCategories));
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('categoriesUpdated'));
        
        setHasUnsavedChanges(false);
        toast.success('✅ Категории полностью пересозданы!', { duration: 5000 });
        toast.info('Обновите страницу, чтобы увидеть изменения в интерфейсе', { duration: 8000 });
        console.log('✅ Complete reset successful');
        console.log('📢 Dispatched categoriesUpdated event');
      } else {
        console.error('❌ Failed to reset categories:', error);
        toast.error('Ошибка при полном сбросе категорий: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error in complete reset:', error);
      toast.error('Ошибка при полном сбросе категорий');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    // Validate that all language translations are filled
    if (!newCategory.translations?.ru || !newCategory.translations?.en || 
        !newCategory.translations?.zh || !newCategory.translations?.vi) {
      toast.error(t('fillAllFields'));
      return;
    }

    const category: Category = {
      id: `cat_${Date.now()}`,
      translations: {
        ru: newCategory.translations.ru.trim(),
        en: newCategory.translations.en.trim(),
        zh: newCategory.translations.zh.trim(),
        vi: newCategory.translations.vi.trim(),
      },
      icon: activeTab === 'sidebar' ? newCategory.icon : undefined,
      order: categories[activeTab].length,
    };

    console.log('➕ Adding new category:', category);

    setCategories({
      ...categories,
      [activeTab]: [...categories[activeTab], category],
    });
    
    setHasUnsavedChanges(true);

    setNewCategory({
      translations: { ru: '', en: '', zh: '', vi: '' },
      icon: 'Package',
      order: 0,
    });
    setShowAddModal(false);
    toast.success(t('categoryAdded'));
    toast.info('Не забудьте нажать "Сохранить изменения"', { duration: 5000 });
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm(t('confirmDelete'))) {
      setCategories({
        ...categories,
        [activeTab]: categories[activeTab].filter((cat) => cat.id !== id),
      });
      setHasUnsavedChanges(true);
      toast.success(t('categoryDeleted'));
      toast.info('Не забудьте нажать "Сохранить изменения"', { duration: 5000 });
    }
  };

  const handleUpdateTranslation = (id: string, lang: 'ru' | 'en' | 'zh' | 'vi', value: string) => {
    setCategories({
      ...categories,
      [activeTab]: categories[activeTab].map((cat) =>
        cat.id === id
          ? { ...cat, translations: { ...cat.translations, [lang]: value } }
          : cat
      ),
    });
    setHasUnsavedChanges(true);
  };

  const handleUpdateIcon = (id: string, icon: string) => {
    setCategories({
      ...categories,
      [activeTab]: categories[activeTab].map((cat) =>
        cat.id === id ? { ...cat, icon } : cat
      ),
    });
    setHasUnsavedChanges(true);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories[activeTab]];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCategories.length) return;

    [newCategories[index], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[index],
    ];

    newCategories.forEach((cat, idx) => {
      cat.order = idx;
    });

    setCategories({
      ...categories,
      [activeTab]: newCategories,
    });
    setHasUnsavedChanges(true);
  };

  const getIconComponent = (iconId?: string) => {
    const iconData = AVAILABLE_ICONS.find((i) => i.id === iconId);
    if (!iconData) return Package;
    return iconData.icon;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-red-600" size={48} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-white flex items-center gap-2">
          <Layers size={24} />
          {t('categoryManagement')}
        </h3>
        <p className="text-white text-sm mt-2">
          {t('categoryManagementDescription')}
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('topMenu')}
            className={`flex items-center gap-2 px-6 py-3 transition-colors ${
              activeTab === 'topMenu'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <LayoutGrid size={20} />
            {t('topMenu')}
          </button>
          <button
            onClick={() => setActiveTab('sidebar')}
            className={`flex items-center gap-2 px-6 py-3 transition-colors ${
              activeTab === 'sidebar'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Layers size={20} />
            {t('sidebarMenu')}
          </button>
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-gray-700">
            {activeTab === 'topMenu' ? t('topMenuCategories') : t('sidebarCategories')}
          </h4>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            {t('addCategory')}
          </button>
        </div>

        {categories[activeTab].length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('noCategoriesYet')}
          </div>
        ) : (
          <div className="space-y-3">
            {categories[activeTab].map((category, index) => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {activeTab === 'sidebar' && category.icon && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = getIconComponent(category.icon);
                          return <IconComponent size={20} className="text-red-600" />;
                        })()}
                        {editingId === category.id && (
                          <button
                            onClick={() => setShowIconPicker(true)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            {t('changeIcon')}
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">ID: {category.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Move buttons */}
                    <button
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t('moveUp')}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categories[activeTab].length - 1}
                      className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t('moveDown')}
                    >
                      ▼
                    </button>
                    {editingId === category.id ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-green-600 hover:text-green-700"
                      >
                        <Save size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(category.id)}
                        className="p-2 text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Translations */}
                <div className="grid grid-cols-2 gap-3">
                  {(['ru', 'en', 'zh', 'vi'] as const).map((lang) => (
                    <div key={lang}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {lang.toUpperCase()} - {t(`language_${lang}`)}
                      </label>
                      {editingId === category.id ? (
                        <input
                          type="text"
                          value={category.translations[lang] || ''}
                          onChange={(e) =>
                            handleUpdateTranslation(category.id, lang, e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
                          placeholder={t(`enter_${lang}_name`)}
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                          {category.translations[lang] || '—'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Icon Picker Modal */}
                {showIconPicker && editingId === category.id && activeTab === 'sidebar' && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-gray-800">{t('selectIcon')}</h4>
                        <button
                          onClick={() => setShowIconPicker(false)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                        {AVAILABLE_ICONS.map((iconData) => {
                          const IconComponent = iconData.icon;
                          return (
                            <button
                              key={iconData.id}
                              onClick={() => {
                                handleUpdateIcon(category.id, iconData.id);
                                setShowIconPicker(false);
                              }}
                              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                                category.icon === iconData.id
                                  ? 'border-red-600 bg-red-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <IconComponent size={24} />
                              <span className="text-xs text-gray-600">{iconData.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-gray-800">{t('addNewCategory')}</h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Important notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Все поля на всех языках обязательны для заполнения!
                </p>
              </div>

              {/* Translations */}
              <div className="grid grid-cols-2 gap-3">
                {(['ru', 'en', 'zh', 'vi'] as const).map((lang) => (
                  <div key={lang}>
                    <label className="block text-sm text-gray-700 mb-1">
                      {lang.toUpperCase()} - {t(`language_${lang}`)} *
                    </label>
                    <input
                      type="text"
                      value={newCategory.translations?.[lang] || ''}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          translations: {
                            ...newCategory.translations!,
                            [lang]: e.target.value,
                          },
                        })
                      }
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 ${
                        !newCategory.translations?.[lang] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={t(`enter_${lang}_name`)}
                    />
                  </div>
                ))}
              </div>

              {/* Icon selection for sidebar */}
              {activeTab === 'sidebar' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-2">{t('selectIcon')}</label>
                  <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {AVAILABLE_ICONS.map((iconData) => {
                      const IconComponent = iconData.icon;
                      return (
                        <button
                          key={iconData.id}
                          onClick={() =>
                            setNewCategory({ ...newCategory, icon: iconData.id })
                          }
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                            newCategory.icon === iconData.id
                              ? 'border-red-600 bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent size={20} />
                          <span className="text-xs text-gray-600">{iconData.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Warning Banner */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 mb-2">⚠️ {t('categoryProblems')}</h4>
          <p className="text-sm text-red-700 mb-3">
            {t('categoryProblemsDesc')}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleResetToDefaults}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 className={saving ? "animate-spin" : ""} size={18} />
              🔄 {t('resetToDefaults')}
            </button>

            <button
              onClick={handleCompleteReset}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-red-800"
            >
              <Loader2 className={saving ? "animate-spin" : ""} size={18} />
              🗑️ {t('completelyRecreateCategories')}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-orange-600">
                <span className="text-sm">⚠️ {t('unsavedChanges')}</span>
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                hasUnsavedChanges 
                  ? 'bg-orange-600 hover:bg-orange-700 animate-pulse' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {t('saveChanges')}
                  {hasUnsavedChanges && ' *'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};