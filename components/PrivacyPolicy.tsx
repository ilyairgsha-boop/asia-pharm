import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { createClient } from '../utils/supabase/client';

interface PrivacyPolicyProps {
  onNavigate: (page: string) => void;
}

export const PrivacyPolicy = ({ onNavigate }: PrivacyPolicyProps) => {
  const { language, t } = useLanguage();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [language]);

  const fetchContent = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('pages')
        .select('content')
        .eq('slug', 'privacy-policy')
        .eq('language', language)
        .maybeSingle();

      if (!error && data?.content) {
        setContent(data.content);
      } else {
        setContent(getDefaultContent());
      }
    } catch (error) {
      console.warn('⚠️ Error fetching privacy policy:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    const defaults = {
      ru: `
        <h2>Политика конфиденциальности</h2>
        <p>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта.</p>
        
        <h3>1. Сбор информации</h3>
        <p>Мы собираем только ту информацию, которую вы предоставляете добровольно при регистрации и оформлении заказов.</p>
        
        <h3>2. Использование информации</h3>
        <p>Ваши данные используются исключительно для обработки заказов и улучшения качества обслуживания.</p>
        
        <h3>3. Защита данных</h3>
        <p>Мы применяем современные методы шифрования для защиты ваших персональных данных.</p>
        
        <h3>4. Передача третьим лицам</h3>
        <p>Мы не передаем ваши персональные данные третьим лицам без вашего согласия.</p>
        
        <h3>5. Контакты</h3>
        <p>По вопросам обработки персональных данных обращайтесь: info@asia-pharm.ru</p>
      `,
      en: `
        <h2>Privacy Policy</h2>
        <p>This Privacy Policy defines the procedure for processing and protecting personal data of website users.</p>
        
        <h3>1. Information Collection</h3>
        <p>We collect only the information you voluntarily provide during registration and ordering.</p>
        
        <h3>2. Use of Information</h3>
        <p>Your data is used exclusively for order processing and service quality improvement.</p>
        
        <h3>3. Data Protection</h3>
        <p>We use modern encryption methods to protect your personal data.</p>
        
        <h3>4. Third Party Disclosure</h3>
        <p>We do not share your personal data with third parties without your consent.</p>
        
        <h3>5. Contact</h3>
        <p>For questions about personal data processing, contact: info@asia-pharm.ru</p>
      `,
      zh: `
        <h2>隐私政策</h2>
        <p>本隐私政策定义了网站用户个人数据的处理和保护程序。</p>
        
        <h3>1. 信息收集</h3>
        <p>我们仅收集您在注册和下订单时自愿提供的信息。</p>
        
        <h3>2. 信息使用</h3>
        <p>您的数据仅用于订单处理和服务质量改进。</p>
        
        <h3>3. 数据保护</h3>
        <p>我们使用现代加密方法保护您的个人数据。</p>
        
        <h3>4. 第三方披露</h3>
        <p>未经您同意，我们不会与第三方共享您的个人数据。</p>
        
        <h3>5. 联系方式</h3>
        <p>有关个人数据处理的问题，请联系：info@asia-pharm.ru</p>
      `,
      vi: `
        <h2>Chính sách bảo mật</h2>
        <p>Chính sách bảo mật này xác định quy trình xử lý và bảo vệ dữ liệu cá nhân của người dùng trang web.</p>
        
        <h3>1. Thu thập thông tin</h3>
        <p>Chúng tôi chỉ thu thập thông tin mà bạn cung cấp tự nguyện khi đăng ký và đặt hàng.</p>
        
        <h3>2. Sử dụng thông tin</h3>
        <p>Dữ liệu của bạn chỉ được sử dụng để xử lý đơn hàng và cải thiện chất lượng dịch vụ.</p>
        
        <h3>3. Bảo vệ dữ liệu</h3>
        <p>Chúng tôi sử dụng các phương pháp mã hóa hiện đại để bảo vệ dữ liệu cá nhân của bạn.</p>
        
        <h3>4. Tiết lộ cho bên thứ ba</h3>
        <p>Chúng tôi không chia sẻ dữ liệu cá nhân của bạn với bên thứ ba mà không có sự đồng ý của bạn.</p>
        
        <h3>5. Liên hệ</h3>
        <p>Đối với các câu hỏi về xử lý dữ liệu cá nhân, liên hệ: info@asia-pharm.ru</p>
      `
    };
    return defaults[language] || defaults.ru;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => onNavigate('home')}
        className="mb-4 text-red-600 hover:underline"
      >
        ← {t('backToHome')}
      </button>
      <div className="bg-white rounded-lg shadow-md p-8">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};
