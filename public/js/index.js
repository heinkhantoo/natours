import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateData } from './updateSetting';
import { bookTour } from './stripe';

const map = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const updateDataForm = document.querySelector('.form--update');
const logoutBtn = document.querySelector('.nav__el--logout');
const updatePasswordForm = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById('book-tour');

if (map) {
  const locations = JSON.parse(map.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (updateDataForm) {
  updateDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateData(form, 'data');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const confirmedPassword = document.getElementById('password-confirm').value;
    updateData({ password, newPassword, confirmedPassword }, 'password');
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);
