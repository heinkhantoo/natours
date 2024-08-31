import axios from 'axios';
import { showAlert } from './alerts';

export async function login(email, password) {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
}

export async function logout() {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged out successfully');
      window.location.assign('/');
    }
  } catch (err) {
    console.log(err);
    showAlert('error', 'Error logging out! Try again!');
  }
}
