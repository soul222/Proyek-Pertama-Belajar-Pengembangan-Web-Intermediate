// src/scripts/pages/auth/login-page.js
import API from "../../data/api";
import AuthService from "../../data/auth-service";

export default class LoginPage {
  async render() {
    return `
      <section class="container page-transition">
        <h1 class="animate-in">Login</h1>
        
        <div class="form-container animate-in">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input type="email" id="email" class="form-input" placeholder="Masukkan email">
            <div id="email-error" class="form-error"></div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input type="password" id="password" class="form-input" placeholder="Masukkan password">
            <div id="password-error" class="form-error"></div>
          </div>
          
          <div class="form-group">
            <button id="login-button" class="btn btn-primary btn-full">Login</button>
          </div>
          
          <div id="login-status"></div>
          
          <div class="form-group text-center">
            <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
    this.emailError = document.getElementById("email-error");
    this.passwordError = document.getElementById("password-error");
    this.loginButton = document.getElementById("login-button");
    this.loginStatus = document.getElementById("login-status");

    this.loginButton.addEventListener("click", async () => {
      await this.handleLogin();
    });

    // Enable form submission with Enter key
    document.querySelectorAll(".form-input").forEach((input) => {
      input.addEventListener("keypress", async (event) => {
        if (event.key === "Enter") {
          await this.handleLogin();
        }
      });
    });
  }

  async handleLogin() {
    try {
      // Clear previous error messages
      this.clearErrors();

      // Validate inputs
      if (!this.validateInputs()) {
        return;
      }

      this.loginButton.disabled = true;
      this.loginStatus.innerHTML = `
        <div class="alert alert-info">
          <p>Logging in...</p>
        </div>
      `;

      const email = this.emailInput.value.trim();
      const password = this.passwordInput.value;

      // Attempt login
      const response = await API.login({
        email,
        password,
      });

      if (response.error) {
        throw new Error(response.message);
      }

      // Save auth data
      AuthService.setAuth({
        userId: response.loginResult.userId,
        name: response.loginResult.name,
        token: response.loginResult.token,
      });

      // Show success message
      this.loginStatus.innerHTML = `
        <div class="alert alert-success">
          <p>Login successful! Redirecting...</p>
        </div>
      `;

      // Redirect to home page
      setTimeout(() => {
        window.location.hash = "#/";
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      this.loginStatus.innerHTML = `
        <div class="alert alert-danger">
          <p>Login failed: ${error.message}</p>
        </div>
      `;
      this.loginButton.disabled = false;
    }
  }

  validateInputs() {
    let isValid = true;

    // Validate email
    const email = this.emailInput.value.trim();
    if (!email) {
      this.emailError.textContent = "Email tidak boleh kosong";
      isValid = false;
    } else if (!this.isValidEmail(email)) {
      this.emailError.textContent = "Email tidak valid";
      isValid = false;
    }

    // Validate password
    const password = this.passwordInput.value;
    if (!password) {
      this.passwordError.textContent = "Password tidak boleh kosong";
      isValid = false;
    } else if (password.length < 8) {
      this.passwordError.textContent = "Password minimal 8 karakter";
      isValid = false;
    }

    return isValid;
  }

  clearErrors() {
    this.emailError.textContent = "";
    this.passwordError.textContent = "";
    this.loginStatus.innerHTML = "";
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
