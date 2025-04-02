// src/scripts/pages/detail/detail-page.js
import API from "../../data/api";
import AuthService from "../../data/auth-service";
import { showFormattedDate } from "../../utils";

export default class DetailPage {
  constructor({ params }) {
    this.id = params.id;
    this.story = null;
    this.map = null;
  }

  async render() {
    return `
      <section class="container page-transition">
        <div class="story-detail-container animate-in">
          <h1 class="animate-in">Loading story details...</h1>
          <div id="story-content" class="story-content"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      await this.loadStoryDetails();
      this.renderStoryDetails();
      if (this.story.lat && this.story.lon) {
        this.initMap();
      }
    } catch (error) {
      console.error("Error loading story details:", error);
      document.querySelector("h1").textContent = "Error Loading Story";
      document.getElementById("story-content").innerHTML = `
        <div class="error-message">
          <p>Failed to load story details. Please try again later.</p>
          <p>${error.message}</p>
          <a href="#/" class="btn btn-primary">Back to Home</a>
        </div>
      `;
    }
  }

  async loadStoryDetails() {
    const auth = AuthService.getAuth();
    if (!auth) {
      throw new Error("Authentication required");
    }

    const response = await API.getStoryDetail({
      token: auth.token,
      id: this.id,
    });

    if (response.error) {
      throw new Error(response.message);
    }

    this.story = response.story;
  }

  renderStoryDetails() {
    const storyContent = document.getElementById("story-content");
    const heading = document.querySelector("h1");
    
    heading.textContent = `Story by ${this.story.name}`;
    
    storyContent.innerHTML = `
      <div class="story-detail-card card animate-in">
        <img 
          src="${this.story.photoUrl}" 
          alt="Photo by ${this.story.name}" 
          class="story-detail-image"
        >
        
        <div class="story-detail-info">
          <p class="story-author">${this.story.name}</p>
          <p class="story-date">
            ${showFormattedDate(this.story.createdAt, "id-ID", { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          
          <div class="story-description">
            <p>${this.formatDescription(this.story.description)}</p>
          </div>
          
          ${this.story.lat && this.story.lon ? `
            <div class="location-info">
              <h3>Location</h3>
              <div id="detail-map" class="detail-map"></div>
            </div>
          ` : ''}
          
          <div class="story-actions">
            <a href="#/" class="btn btn-primary">Back to Home</a>
          </div>
        </div>
      </div>
    `;
  }

  initMap() {
    // Initialize map
    this.map = L.map("detail-map").setView([this.story.lat, this.story.lon], 13);

    // Add base tile layer (OpenStreetMap)
    const openStreetMap = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.map);

    // Add satellite view tile layer
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      }
    );

    // Add topographic view tile layer
    const topo = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
      }
    );

    // Create layer control
    const baseMaps = {
      "Street Map": openStreetMap,
      "Satellite": satellite,
      "Topographic": topo,
    };

    L.control.layers(baseMaps).addTo(this.map);

    // Add marker for the story location
    L.marker([this.story.lat, this.story.lon])
      .addTo(this.map)
      .bindPopup(`<b>${this.story.name}</b><br>${this.story.description.substring(0, 100)}...`)
      .openPopup();
  }

  formatDescription(description) {
    // Replace newlines with paragraph breaks
    return description.split("\n").map(paragraph => 
      paragraph.trim() ? `<p>${paragraph}</p>` : ""
    ).join("");
  }
}