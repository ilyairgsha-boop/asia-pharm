import { useState } from 'react';
import { getServerUrl, getAnonKey } from '../utils/supabase/client';

export const CreateAdminPage = ({ onBack }: { onBack: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('Creating admin...', { email, name });
      
      const response = await fetch(getServerUrl('/create-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': getAnonKey(),
        },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();
      console.log('Create admin response:', result);

      if (!response.ok) {
        setError(result.error || 'Ошибка создания администратора');
      } else {
        setMessage('Администратор успешно создан! Теперь вы можете войти с этими учетными данными.');
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (err) {
      setError('Ошибка соединения с сервером');
      console.warn('⚠️ Create admin error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-2xl text-gray-800 mb-2">Создание администратора</h2>
            <p className="text-sm text-gray-600">
              Создайте первого администратора для управления сайтом
            </p>
          </div>

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Администратор"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Минимум 6 символов"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Создание...' : 'Создать администратора'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onBack}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Вернуться назад
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm text-blue-800 mb-2">ℹ️ Важно</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Эта страница для создания первого администратора</li>
              <li>• После создания используйте эти данные для входа</li>
              <li>• Администратор имеет полный доступ к панели управления</li>
              <li>• Храните пароль в безопасности</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
