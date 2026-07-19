// Login screen — shown when Supabase mode is active and there's no
// session yet. Demo mode never reaches this (main.js enters the panel
// directly).
import { signIn } from "../auth.js";
import { escapeHtml } from "./format.js";
import { friendlyError } from "./toast.js";

export function renderLogin(root) {
  root.innerHTML = `
    <div class="gate">
      <div class="gate-card">
        <img class="gate-logo" src="/assets/logo-wordmark.png" alt="aiLearning" onerror="this.style.display='none'" />
        <div class="gate-title display">Panel de Operaciones</div>
        <div class="gate-sub mono">Inicia sesión con tu cuenta del equipo</div>
        <form id="login-form" style="display:flex;flex-direction:column;gap:12px">
          <div class="field">
            <label>Correo</label>
            <input id="login-email" type="email" autocomplete="username" placeholder="tucorreo@ailearning.mx" required />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input id="login-pass" type="password" autocomplete="current-password" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn pri block" id="login-submit">Entrar</button>
        </form>
        <div id="login-error" style="display:none" class="gate-error"></div>
      </div>
    </div>
  `;

  const form = root.querySelector("#login-form");
  const errorBox = root.querySelector("#login-error");
  const submitBtn = root.querySelector("#login-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";
    const email = root.querySelector("#login-email").value.trim();
    const pass = root.querySelector("#login-pass").value;
    if (!email || !pass) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Entrando…";
    const { error } = await signIn(email, pass);
    if (error) {
      errorBox.textContent = friendlyError(error);
      errorBox.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Entrar";
      return;
    }
    // onAuthChange (subscribed in main.js) takes it from here.
  });
}

export function renderNotLinked(root, session, onLogout) {
  root.innerHTML = `
    <div class="not-linked">
      <div class="ic">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>
        </svg>
      </div>
      <div class="gate-title display">Tu usuario no está vinculado al equipo</div>
      <p class="gate-sub mono" style="margin-bottom:18px">
        La cuenta ${escapeHtml(session?.user?.email || "")} inició sesión correctamente, pero no tiene una fila
        en team_members vinculada. Contacta al administrador para que la vincule con tu auth_user_id.
      </p>
      <button class="btn" id="not-linked-logout">Cerrar sesión</button>
    </div>
  `;
  root.querySelector("#not-linked-logout").addEventListener("click", onLogout);
}
