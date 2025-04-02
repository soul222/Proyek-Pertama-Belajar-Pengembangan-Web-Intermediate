// src/scripts/pages/auth/register-page.js
import API from "../../data/api";

export default class RegisterPage {
  async render() {
    return `
      <section class="container page-transition">
        <h1 class="animate-in">Register</h1>
        
        <div class="form-container animate-in">
          <div class="form-group">
            <label for="name" class="form-label">Nama</label>
            <input type="text" id="name" class="form-input" placeholder="Masukkan nama lengkap">
            <div id="name-error" class="form-error"></div>
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input type="email" id="email" class="form-input" placeholder="Masukkan email">
            <div id="email-error" class="form-error"></div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input type="password" id="password" class="form-input" placeholder="Masukkan password (min. 8 karakter)">
            <div id="password-error" class="form-error"></div>
          </div>
          
          <div class="form-group">
            <label for="confirm-password" class="form-label">Konfirmasi Password</label>
            <input type="password" id="confirm-password" class="form-input" placeholder="Masukkan password kembali">
            <div id="confirm-password-error" class="form-error"></div>
          </div>
          
          <div class="form-group">
            <button id="register-button" class="btn btn-primary btn-full">Register</button>
          </div>
          
          <div id="register-status"></div>
          
          <div class="form-group text-center">
            <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.nameInput = document.getElementById("name");
    this.emailInput = document.getElementById("email");
    this.passwordInput = document.getElementById("password");
    this.confirmPasswordInput = document.getElementById("confirm-password");

    this.nameError = document.getElementById("name-error");
    this.emailError = document.getElementById("email-error");
    this.passwordError = document.getElementById("password-error");
    this.confirmPasswordError = document.getElementById(
      "confirm-password-error"
    );

    this.registerButton = document.getElementById("register-button");
    this.registerStatus = document.getElementById("register-status");

    this.registerButton.addEventListener("click", async () => {
      await this.handleRegister();
    });

    // Enable form submission with Enter key
    document.querySelectorAll(".form-input").forEach((input) => {
      input.addEventListener("keypress", async (event) => {
        if (event.key === "Enter") {
          await this.handleRegister();
        }
      });
    });
  }
}
