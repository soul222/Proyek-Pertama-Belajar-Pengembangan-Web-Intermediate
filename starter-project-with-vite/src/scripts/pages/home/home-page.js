// src/scripts/pages/home/home-page.js
import API from "../../data/api";
import AuthService from "../../data/auth-service";
import { showFormattedDate } from "../../utils";

export default class HomePage {
  constructor() {
    this.stories = [];
    this.map = null;
    this.markers = [];
  }

  async render() {
    return `
      <section class="container page-transition">
        <h1 class="animate-in">Dicoding Story</h1>
        <p class="animate-in">Berbagi cerita seputar Dicoding</p>
        
        <div id="map-container" class="map-container animate-in"></div>
        
        <div class="stories-grid" id="stories-container">
          <p>Loading stories...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    try {
      await this.loadStories();
      this.initMap();
      this.renderStories();
    } catch (error) {
      console.error("Error loading stories:", error);
      document.getElementById("stories-container").innerHTML = `
        <div class="error-message">
          <p>Failed to load stories. Please try again later.</p>
        </div>
      `;
    }
  }

  async loadStories() {
    const auth = AuthService.getAuth();
    if (!auth) return;

    const response = await API.getAllStories({
      token: auth.token,
      location: 1, // Get stories with location
    });

    if (response.error) {
      throw new Error(response.message);
    }

    this.stories = response.listStory;
  }

  initMap() {
    // Initialize map
    this.map = L.map("map-container").setView([-0.789275, 113.921327], 5); // Indonesia centered

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
      Satellite: satellite,
      Topographic: topo,
    };

    L.control.layers(baseMaps).addTo(this.map);

    // Add markers for stories with location
    this.addStoryMarkers();
  }

  addStoryMarkers() {
    this.stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map);

        marker.bindPopup(`
          <div class="map-popup">
            <h3>${story.name}</h3>
            <img src="${story.photoUrl}" alt="Foto dari ${story.name}" style="width:100%;max-width:200px;border-radius:4px;">
            <p>${story.description}</p>
            <a href="#/detail/${story.id}">View Detail</a>
          </div>
        `);

        this.markers.push(marker);
      }
    });

    // Fit map to markers if any exist
    if (this.markers.length > 0) {
      const group = new L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  renderStories() {
    const storiesContainer = document.getElementById("stories-container");

    if (this.stories.length === 0) {
      storiesContainer.innerHTML = `
        <div class="empty-message">
          <p>No stories found. Be the first to share!</p>
          <a href="#/add" class="btn btn-primary">Add New Story</a>
        </div>
      `;
      return;
    }

    storiesContainer.innerHTML = this.stories
      .map(
        (story, index) => `
      <article class="card story-card animate-in" style="animation-delay: ${
        index * 100
      }ms">
        <img src="${story.photoUrl}" alt="Story image by ${
          story.name
        }" loading="lazy">
        <div class="story-info">
          <p class="story-author">${story.name}</p>
          <p class="story-date">${showFormattedDate(
            story.createdAt,
            "id-ID"
          )}</p>
          <p class="story-description">${this.truncateText(
            story.description,
            150
          )}</p>
          <a href="#/detail/${story.id}" class="btn btn-primary">Read More</a>
        </div>
      </article>
    `
      )
      .join("");
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  }
}
