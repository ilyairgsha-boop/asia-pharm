import { useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import type { Language } from '../utils/i18n';

interface TermsOfServiceProps {
  onNavigate: (page: string) => void;
  language?: Language;
  t?: (key: string) => string;
  embedded?: boolean; // Для встраивания в Dialog
}

export const TermsOfService = ({ onNavigate, language = 'ru', t = (key) => key, embedded = false }: TermsOfServiceProps) => {
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
        .eq('slug', 'terms-of-service')
        .eq('language', language)
        .maybeSingle();

      if (!error && data?.content) {
        setContent(data.content);
      } else {
        setContent(getDefaultContent());
      }
    } catch (error) {
      console.warn('⚠️ Error fetching terms of service:', error);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    const defaults = {
      ru: `
        <h2>Правила и условия сайта</h2>
        <p>Настоящие Правила определяют условия использования интернет-магазина и порядок взаимоотношений между пользователем и администрацией сайта.</p>
        
        <h3>1. Общие положения</h3>
        <p>Используя сайт, вы соглашаетесь с настоящими Правилами и обязуетесь их соблюдать.</p>
        
        <h3>2. Регистрация и учетная запись</h3>
        <p>Для оформления заказов необходима регистрация. Вы обязуетесь предоставлять актуальную информацию.</p>
        
        <h3>3. Оформление заказов</h3>
        <p>Заказ считается принятым после подтверждения администрацией. Цены и наличие товаров могут изменяться.</p>
        
        <h3>3.1. Категория "Пробники" (только для магазина Товары из Китая)</h3>
        <p>Товары из категории "Пробники" имеют особые условия:</p>
        <ul>
          <li>Пробники можно купить только при минимальной сумме заказа в 3000 рублей</li>
          <li>Только 1 наименование пробника в 1 экземпляре на один заказ</li>
          <li>Пробники не участвуют в программе лояльности (баллы за покупку пробников не начисляются)</li>
          <li>При использовании баллов лояльности стоимость пробников не учитывается в расчете скидки</li>
          <li>Стоимость пробников не учитывается в общей сумме для бесплатной доставки</li>
        </ul>
        
        <h3>4. Оплата и доставка</h3>
        <p>Информация об оплате и доставке указывается при оформлении заказа.</p>
        
        <h3>5. Возврат товара</h3>
        <p>Возврат товара осуществляется в соответствии с законодательством РФ.</p>
        
        <h3>6. Ответственность</h3>
        <p>Администрация не несет ответственности за неправильное использование препаратов. Перед применением проконсультируйтесь с врачом.</p>
        
        <h3>7. Контакты</h3>
        <p>По всем вопросам обращайтесь: info@asia-pharm.ru</p>
      `,
      en: `
        <h2>Terms of Service</h2>
        <p>These Terms define the conditions for using the online store and the relationship between the user and the site administration.</p>
        
        <h3>1. General Provisions</h3>
        <p>By using the site, you agree to these Terms and undertake to comply with them.</p>
        
        <h3>2. Registration and Account</h3>
        <p>Registration is required to place orders. You undertake to provide current information.</p>
        
        <h3>3. Placing Orders</h3>
        <p>An order is considered accepted after confirmation by the administration. Prices and product availability may change.</p>
        
        <h3>3.1. "Samples" Category (only for Products from China store)</h3>
        <p>Products from the "Samples" category have special conditions:</p>
        <ul>
          <li>Samples can only be purchased with a minimum order amount of 3000 rubles</li>
          <li>Only 1 sample item in 1 quantity per order</li>
          <li>Samples do not participate in the loyalty program (no points are awarded for sample purchases)</li>
          <li>When using loyalty points, the cost of samples is not included in the discount calculation</li>
          <li>The cost of samples is not included in the total for free shipping</li>
        </ul>
        
        <h3>4. Payment and Delivery</h3>
        <p>Payment and delivery information is provided when placing an order.</p>
        
        <h3>5. Product Returns</h3>
        <p>Product returns are carried out in accordance with Russian legislation.</p>
        
        <h3>6. Liability</h3>
        <p>The administration is not responsible for improper use of products. Consult a doctor before use.</p>
        
        <h3>7. Contact</h3>
        <p>For all questions, contact: info@asia-pharm.ru</p>
      `,
      zh: `
        <h2>服务条款</h2>
        <p>本条款定义了使用在线商店的条件以及用户与网站管理部门之间的关系。</p>
        
        <h3>1. 总则</h3>
        <p>使用本网站即表示您同意这些条款并承诺遵守它们。</p>
        
        <h3>2. 注册和账户</h3>
        <p>下订单需要注册。您承诺提供最新信息。</p>
        
        <h3>3. 下订单</h3>
        <p>订单在管理部门确认后视为已接受。价格和产品供应情况可能会发生变化。</p>
        
        <h3>3.1. "试用装"类别（仅适用于中国商品店）</h3>
        <p>"试用装"类别的产品有特殊条件：</p>
        <ul>
          <li>试用装只能在最低订单金额为3000卢布时购买</li>
          <li>每个订单仅限1种试用装，数量为1</li>
          <li>试用装不参与忠诚度计划（购买试用装不会获得积分）</li>
          <li>使用忠诚度积分时，试用装的费用不包括在折扣计算中</li>
          <li>试用装的费用不包括在免费送货的总额中</li>
        </ul>
        
        <h3>4. 付款和交付</h3>
        <p>付款和交付信息在下订单时提供。</p>
        
        <h3>5. 产品退货</h3>
        <p>产品退货按照俄罗斯法律进行。</p>
        
        <h3>6. 责任</h3>
        <p>管理部门对不当使用产品不承担责任。使用前请咨询医生。</p>
        
        <h3>7. 联系方式</h3>
        <p>如有任何问题，请联系：info@asia-pharm.ru</p>
      `,
      vi: `
        <h2>Điều khoản dịch vụ</h2>
        <p>Các Điều khoản này xác định điều kiện sử dụng cửa hàng trực tuyến và mối quan hệ giữa người dùng và ban quản trị trang web.</p>
        
        <h3>1. Quy định chung</h3>
        <p>Bằng cách sử dụng trang web, bạn đồng ý với các Điều khoản này và cam kết tuân thủ chúng.</p>
        
        <h3>2. Đăng ký và tài khoản</h3>
        <p>Cần đăng ký để đặt hàng. Bạn cam kết cung cấp thông tin hiện tại.</p>
        
        <h3>3. Đặt hàng</h3>
        <p>Đơn hàng được coi là đã chấp nhận sau khi ban quản trị xác nhận. Giá cả và tình trạng sản phẩm có thể thay đổi.</p>
        
        <h3>3.1. Danh mục "Mẫu thử" (chỉ dành cho cửa hàng Sản phẩm từ Trung Quốc)</h3>
        <p>Sản phẩm từ danh mục "Mẫu thử" có các điều kiện đặc biệt:</p>
        <ul>
          <li>Mẫu thử chỉ có thể được mua với số tiền đơn hàng tối thiểu là 3000 rúp</li>
          <li>Chỉ 1 loại mẫu thử với số lượng 1 cho mỗi đơn hàng</li>
          <li>Mẫu thử không tham gia chương trình khách hàng thân thiết (không có điểm được tặng cho việc mua mẫu thử)</li>
          <li>Khi sử dụng điểm khách hàng thân thiết, chi phí mẫu thử không được tính trong tính toán giảm giá</li>
          <li>Chi phí mẫu thử không được tính trong tổng số để nhận miễn phí vận chuyển</li>
        </ul>
        
        <h3>4. Thanh toán và giao hàng</h3>
        <p>Thông tin thanh toán và giao hàng được cung cấp khi đặt hàng.</p>
        
        <h3>5. Trả hàng</h3>
        <p>Việc trả hàng được thực hiện theo pháp luật Nga.</p>
        
        <h3>6. Trách nhiệm</h3>
        <p>Ban quản trị không chịu trách nhiệm về việc sử dụng sản phẩm không đúng cách. Hãy tham khảo ý kiến bác sĩ trước khi sử dụng.</p>
        
        <h3>7. Liên hệ</h3>
        <p>Đối với mọi câu hỏi, liên hệ: info@asia-pharm.ru</p>
      `
    };
    return defaults[language] || defaults.ru;
  };

  if (loading) {
    if (embedded) {
      return (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      );
    }
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
  };

  // Встроенный режим для Dialog
  if (embedded) {
    return (
      <div 
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Полностраничный режим
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