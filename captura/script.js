
(async () => {
  const overlay = document.getElementById('login-overlay');
  const form = document.getElementById('login-form');
  const userInput = document.getElementById('login-user');
  const passInput = document.getElementById('login-pass');
  const errorBox = document.getElementById('login-error');
  const toggle = document.getElementById('toggle-pass');

  /* HASH SHA-256 */
  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* TIMING SAFE COMPARE */
  function safeCompare(a, b) {
    if (a.length !== b.length) return false;
    let res = 0;
    for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return res === 0;
  }

  /* CREDENCIAIS HASH */
  const VALID_USER_HASH = await sha256('Cryptitys');
  const VALID_EMAIL_HASH = await sha256('Vrodriguespereira11@gmail.com');
  const VALID_PASS_HASH = await sha256('central');

  /* SESSION */
  if (localStorage.getItem('auth_ok') === '1') {
    overlay.style.display = 'none';
    return;
  }

  toggle.onclick = () => {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorBox.textContent = '';

    const userHash = await sha256(userInput.value.trim());
    const passHash = await sha256(passInput.value);

    const userOk = safeCompare(userHash, VALID_USER_HASH) || safeCompare(userHash, VALID_EMAIL_HASH);
    const passOk = safeCompare(passHash, VALID_PASS_HASH);

    if (userOk && passOk) {
      localStorage.setItem('auth_ok', '1');
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    } else {
      errorBox.textContent = 'Credenciais inválidas';
    }
  });
})();
