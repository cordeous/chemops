// Redirect if already logged in
if (getToken()) window.location.href = '/dashboard.html';

document.getElementById('toggle-pw').addEventListener('click', () => {
  const pw = document.getElementById('password');
  const icon = document.querySelector('#toggle-pw i');
  pw.type = pw.type === 'password' ? 'text' : 'password';
  icon.className = pw.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const spinner = document.getElementById('login-spinner');
  const alertBox = document.getElementById('alert-box');

  btn.disabled = true;
  spinner.classList.remove('d-none');
  alertBox.classList.add('d-none');

  try {
    const { data } = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    localStorage.setItem('chemops_token', data.token);
    localStorage.setItem('chemops_user', JSON.stringify(data.user));
    window.location.href = '/dashboard.html';
  } catch (err) {
    alertBox.textContent = err.message || 'Login failed. Please try again.';
    alertBox.classList.remove('d-none');
    btn.disabled = false;
    spinner.classList.add('d-none');
  }
});
