import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';
import { PromoCodeManagement } from './PromoCodeManagement';
import { PageEditor } from './PageEditor';
import { WordPressParser } from './WordPressParser';
import { UserManagement } from './UserManagement';
import { PaymentSettings } from './PaymentSettings';
import { ChatSettings } from './ChatSettings';
import { EmailSettings } from './EmailSettings';
import { EmailBroadcast } from './EmailBroadcast';
import { Analytics } from './Analytics';
import { SEOSettings } from './SEOSettings';
import { CategoryManagement } from './CategoryManagement';
import { CatalogCSV } from './CatalogCSV';
import { CategoryDebugger } from './CategoryDebugger';
import { OneSignalSettings } from './OneSignalSettings';
import { PushNotifications } from './PushNotifications';
import { PopUpSettings } from './PopUpSettings';
import { ThemeSettings } from './ThemeSettings';
import { EdgeFunctionStatus } from '../EdgeFunctionStatus';
import { 
  Package, 
  ShoppingBag, 
  Tag, 
  FileEdit, 
  Upload, 
  MessageCircle,
  Mail,
  BarChart3,
  Users,
  CreditCard,
  Globe,
  Layers,
  FileText,
  Bug,
  Send,
  Bell,
  BellRing,
  MessageSquare,
  Palette
} from 'lucide-react';

type AdminTab = 'products' | 'orders' | 'promos' | 'users' | 'payment' | 'pages' | 'parser' | 'chat' | 'email' | 'broadcast' | 'analytics' | 'seo' | 'categories' | 'csv' | 'debug' | 'pushSettings' | 'pushNotifications' | 'popup' | 'themes';

export const AdminPanelNew = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const tabs = [
    { id: 'products' as AdminTab, label: t('productManagement'), icon: Package },
    { id: 'orders' as AdminTab, label: t('orderManagement'), icon: ShoppingBag },
    { id: 'promos' as AdminTab, label: t('promoCodes'), icon: Tag },
    { id: 'users' as AdminTab, label: t('userManagement'), icon: Users },
    { id: 'categories' as AdminTab, label: t('categoryManagement'), icon: Layers },
    { id: 'debug' as AdminTab, label: t('categoryDebuggerTitle'), icon: Bug },
    { id: 'csv' as AdminTab, label: t('catalogCSV'), icon: FileText },
    { id: 'payment' as AdminTab, label: t('paymentSettings'), icon: CreditCard },
    { id: 'pages' as AdminTab, label: t('pageEditor'), icon: FileEdit },
    { id: 'parser' as AdminTab, label: t('wordpressParser'), icon: Upload },
    { id: 'chat' as AdminTab, label: t('chatSettings'), icon: MessageCircle },
    { id: 'email' as AdminTab, label: t('emailNotifications'), icon: Mail },
    { id: 'broadcast' as AdminTab, label: t('emailBroadcast'), icon: Send },
    { id: 'pushSettings' as AdminTab, label: t('pushNotificationsSettings'), icon: Bell },
    { id: 'pushNotifications' as AdminTab, label: t('pushNotifications'), icon: BellRing },
    { id: 'popup' as AdminTab, label: t('popUpSettings'), icon: MessageSquare },
    { id: 'themes' as AdminTab, label: t('themeSettings'), icon: Palette },
    { id: 'seo' as AdminTab, label: t('seoSettings'), icon: Globe },
    { id: 'analytics' as AdminTab, label: t('analytics'), icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'promos':
        return <PromoCodeManagement />;
      case 'users':
        return <UserManagement />;
      case 'payment':
        return <PaymentSettings />;
      case 'pages':
        return <PageEditor />;
      case 'parser':
        return <WordPressParser />;
      case 'chat':
        return <ChatSettings />;
      case 'email':
        return <EmailSettings />;
      case 'broadcast':
        return <EmailBroadcast />;
      case 'pushSettings':
        return <OneSignalSettings />;
      case 'pushNotifications':
        return <PushNotifications />;
      case 'popup':
        return <PopUpSettings />;
      case 'themes':
        return <ThemeSettings />;
      case 'seo':
        return <SEOSettings />;
      case 'categories':
        return <CategoryManagement />;
      case 'debug':
        return <CategoryDebugger />;
      case 'csv':
        return <CatalogCSV />;
      case 'analytics':
        return <Analytics />;
      default:
        return <ProductManagement />;
    }
  };

  return (
    <div className="admin-panel-container container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h2 className="text-gray-800 mb-4 sm:mb-6 text-xl sm:text-2xl px-2">{t('adminPanel')}</h2>

      {/* Edge Function Status */}
      <div className="mb-4 sm:mb-6 px-2 sm:px-0">
        <EdgeFunctionStatus />
      </div>

      {/* Tabs - vertical on mobile, horizontal on desktop */}
      <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6 -mx-2 sm:mx-0">
        <div className="flex flex-col sm:flex-row sm:overflow-x-auto sm:border-b sm:border-gray-200 sm:hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-4 py-3 sm:py-4 transition-colors text-sm border-b sm:border-b-0 border-gray-200 sm:whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'sm:border-b-2 sm:border-red-600 text-red-600 bg-red-50 sm:bg-red-50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-2 sm:px-0">
        {renderTabContent()}
      </div>
    </div>
  );
};