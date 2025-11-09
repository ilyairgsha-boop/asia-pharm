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
  MessageSquare
} from 'lucide-react';

type AdminTab = 'products' | 'orders' | 'promos' | 'users' | 'payment' | 'pages' | 'parser' | 'chat' | 'email' | 'broadcast' | 'analytics' | 'seo' | 'categories' | 'csv' | 'debug' | 'pushSettings' | 'pushNotifications' | 'popup';

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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-gray-800 mb-6">{t('adminPanel')}</h2>

      {/* Edge Function Status */}
      <div className="mb-6">
        <EdgeFunctionStatus />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {renderTabContent()}
    </div>
  );
};