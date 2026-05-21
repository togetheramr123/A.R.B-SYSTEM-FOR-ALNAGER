import { login } from './app/actions/login';

async function test() {
  const formData = new FormData();
  formData.append('username', '01121466223');
  formData.append('password', '3080');
  formData.append('locale', 'ar');

  try {
    const result = await login(null, formData);
    console.log('Login result:', result);
  } catch (error) {
    console.error('Login threw error:', error);
  }
}

test();
