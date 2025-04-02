// src/scripts/pages/app.js
import routes, { checkRoute } from "../routes/routes";
import { getActiveRoute, parseActivePathname } from "../routes/url-parser";
import AuthService from "../data/auth-service";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #authNavItem = null;

  constructor({ navigationDrawer, drawerButton, content, authNavItem }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#authNavItem = authNavItem;

    this.#setupDrawer();
    this.#updateAuthNavItem();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  #updateAuthNavItem() {
    if (AuthService.isLoggedIn()) {
      this.#authNavItem.textContent = "Logout";
      this.#authNavItem.href = "#/logout";
      this.#authNavItem.addEventListener("click", (event) => {
        event.preventDefault();
        AuthService.destroyAuth();
        window.location.hash = "#/login";
        this.#updateAuthNavItem();
      });
    } else {
      this.#authNavItem.textContent = "Login";
      this.#authNavItem.href = "#/login";
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const urlParams = parseActivePathname();
    const checkedRoute = checkRoute(url);

    if (checkedRoute !== url) {
      window.location.hash = checkedRoute;
      return;
    }

    const routeConfig = routes[url];

    if (!routeConfig) {
      this.#content.innerHTML =
        '<div class="container"><h2>404 - Page Not Found</h2></div>';
      return;
    }

    try {
      // Apply View Transition API if supported
      if (document.startViewTransition) {
        await document.startViewTransition(async () => {
          this.#content.innerHTML = await new routeConfig.page({
            params: urlParams,
          }).render();
        }).ready;
      } else {
        this.#content.innerHTML = await new routeConfig.page({
          params: urlParams,
        }).render();
      }

      await new routeConfig.page({ params: urlParams }).afterRender();
      this.#updateAuthNavItem();

      // Apply custom Animation API for page elements
      this.#animatePageElements();
    } catch (error) {
      console.error("Error rendering page:", error);
      this.#content.innerHTML = `
        <div class="container">
          <h2>An error occurred</h2>
          <p>${error.message}</p>
        </div>
      `;
    }
  }

  #animatePageElements() {
    const elements = this.#content.querySelectorAll(".animate-in");

    elements.forEach((element, index) => {
      // Using Animation API for custom animations
      const animation = element.animate(
        [
          { transform: "translateY(20px)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        {
          duration: 500,
          delay: 100 * index,
          easing: "ease-out",
          fill: "forwards",
        }
      );

      // Remove the animate-in class after animation completes
      animation.onfinish = () => {
        element.classList.remove("animate-in");
      };
    });
  }
}

export default App;
