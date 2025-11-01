// Mock Mode Configuration
// Set to true to work offline without Supabase
export const MOCK_MODE = false;

// Mock admin credentials for local development
export const MOCK_ADMIN = {
  email: 'admin@asia-pharm.com',
  password: 'admin123',
  id: 'mock-admin-id',
  name: 'Администратор'
};

// Mock user for testing
export const MOCK_USER = {
  email: 'user@test.com',
  password: 'user123',
  id: 'mock-user-id',
  name: 'Тестовый пользователь'
};

export const isMockMode = () => MOCK_MODE;
