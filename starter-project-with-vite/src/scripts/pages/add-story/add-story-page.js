// src/scripts/pages/add-story/add-story-page.js
import API from "../../data/api";
import AuthService from "../../data/auth-service";

export default class AddStoryPage {
  constructor() {
    this.mediaStream = null;
    this.photoBlob = null;
    this.selectedLocation = null;
    this.map = null;
    this.locationMarker = null;
  }

  async render() {
    return `
      <section class="container page-transition">
        <h1 class="animate-in">Tambah Story Baru</h1>
        
        <div class="form-container animate-in">
          <div class="form-group">
            <label for="camera-section" class="form-label">Foto Story</label>
            <div id="camera-section" class="camera-container">
              <video id="camera-preview" class="camera-preview" autoplay playsinline></video>
              <canvas id="camera-canvas" class="camera-preview" style="display: none;"></canvas>
              <img id="captured-image" class="captured-image" alt="Foto yang diambil">
              
              <div class="camera-controls">
                <button id="capture-button" class="camera-button" aria-label="Ambil foto">
                  <span>📸</span>
                </button>
                <button id="retake-button" class="camera-button" style="display: none;" aria-label="Ambil ulang foto">
                  <span>🔄</span>
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="location-picker" class="form-label">Lokasi (Opsional - Klik pada peta untuk memilih)</label>
            <div id="location-picker" class="map-picker"></div>
            <p id="selected-location" class="form-text">Belum ada lokasi dipilih</p>
          </div>
          
          <div class="form-group">
            <label for="description" class="form-label">Deskripsi</label>
            <textarea id="description" class="form-input" rows="4" placeholder="Ceritakan pengalamanmu..."></textarea>
            <div id="description-error" class="form-error"></div>
          </div>
          
          <div class="form-group">
            <button id="submit-button" class="btn btn-primary btn-full">Post Story</button>
          </div>
          
          <div id="submission-status"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.initializeElements();
    this.setupCamera();
    this.initMap();
    this.setupEventListeners();
  }

  initializeElements() {
    this.cameraPreview = document.getElementById("camera-preview");
    this.cameraCanvas = document.getElementById("camera-canvas");
    this.capturedImage = document.getElementById("captured-image");
    this.captureButton = document.getElementById("capture-button");
    this.retakeButton = document.getElementById("retake-button");
    this.descriptionInput = document.getElementById("description");
    this.descriptionError = document.getElementById("description-error");
    this.submitButton = document.getElementById("submit-button");
    this.submissionStatus = document.getElementById("submission-status");
    this.selectedLocationText = document.getElementById("selected-location");
  }

  async setupCamera() {
    try {
      // Request access to camera
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // Connect camera stream to video element
      this.cameraPreview.srcObject = this.mediaStream;
    } catch (error) {
      console.error("Error accessing camera:", error);
      // Show error message and fallback to file upload
      const cameraSection = document.getElementById("camera-section");
      cameraSection.innerHTML = `
        <div class="form-error">
          <p>Tidak dapat mengakses kamera. Silakan berikan izin atau gunakan browser lain.</p>
          <input type="file" id="photo-upload" accept="image/*" class="form-input">
          <label for="photo-upload" class="form-label">Pilih foto dari perangkat</label>
        </div>
      `;

      // Setup file upload listener
      const photoUpload = document.getElementById("photo-upload");
      photoUpload.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.photoBlob = this.dataURItoBlob(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  initMap() {
    // Initialize map
    this.map = L.map("location-picker").setView([-0.789275, 113.921327], 5); // Indonesia centered

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

    // Add click event to the map
    this.map.on("click", (e) => {
      this.setLocationMarker(e.latlng);
    });

    // Try to get user's current location
    this.map.locate({ setView: true, maxZoom: 16 });
    
    // Handle location found event
    this.map.on("locationfound", (e) => {
      this.setLocationMarker(e.latlng);
    });
  }

  setLocationMarker(latlng) {
    // Remove existing marker if any
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
    }

    // Add new marker
    this.locationMarker = L.marker(latlng).addTo(this.map);
    this.selectedLocation = latlng;

    // Update text
    this.selectedLocationText.textContent = `Lokasi: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    this.selectedLocationText.classList.add("text-success");
  }

  setupEventListeners() {
    // Capture photo
    this.captureButton.addEventListener("click", () => {
      this.capturePhoto();
    });

    // Retake photo
    this.retakeButton.addEventListener("click", () => {
      this.retakePhoto();
    });

    // Submit form
    this.submitButton.addEventListener("click", async () => {
      await this.submitStory();
    });
  }

  capturePhoto() {
    // Set canvas dimensions to match video
    this.cameraCanvas.width = this.cameraPreview.videoWidth;
    this.cameraCanvas.height = this.cameraPreview.videoHeight;

    // Draw video frame on canvas
    const context = this.cameraCanvas.getContext("2d");
    context.drawImage(
      this.cameraPreview,
      0,
      0,
      this.cameraCanvas.width,
      this.cameraCanvas.height
    );

    // Convert canvas to blob
    this.cameraCanvas.toBlob((blob) => {
      this.photoBlob = blob;

      // Create object URL for preview
      const imageUrl = URL.createObjectURL(blob);
      this.capturedImage.src = imageUrl;
      this.capturedImage.style.display = "block";

      // Hide video and show retake button
      this.cameraPreview.style.display = "none";
      this.captureButton.style.display = "none";
      this.retakeButton.style.display = "block";
    }, "image/jpeg", 0.8);
  }

  retakePhoto() {
    // Reset photo blob
    this.photoBlob = null;

    // Show video and capture button
    this.cameraPreview.style.display = "block";
    this.captureButton.style.display = "block";

    // Hide captured image and retake button
    this.capturedImage.style.display = "none";
    this.retakeButton.style.display = "none";
  }

  async submitStory() {
    try {
      // Validate inputs
      if (!this.validateInputs()) {
        return;
      }

      this.submitButton.disabled = true;
      this.submissionStatus.innerHTML = `
        <div class="alert alert-info">
          <p>Mengirim story...</p>
        </div>
      `;

      const auth = AuthService.getAuth();
      const description = this.descriptionInput.value.trim();

      // Prepare location data if selected
      let lat, lon;
      if (this.selectedLocation) {
        lat = this.selectedLocation.lat;
        lon = this.selectedLocation.lng;
      }

      // Submit to API
      const response = await API.addNewStory({
        token: auth.token,
        description,
        photo: this.photoBlob,
        lat,
        lon,
      });

      if (response.error) {
        throw new Error(response.message);
      }

      // Show success message
      this.submissionStatus.innerHTML = `
        <div class="alert alert-success">
          <p>Story berhasil dibuat!</p>
        </div>
      `;

      // Redirect to home page after successful submission
      setTimeout(() => {
        window.location.hash = "#/";
      }, 2000);
    } catch (error) {
      console.error("Error submitting story:", error);
      this.submissionStatus.innerHTML = `
        <div class="alert alert-danger">
          <p>Error: ${error.message}</p>
        </div>
      `;
      this.submitButton.disabled = false;
    }
  }

  validateInputs() {
    // Validate description
    if (!this.descriptionInput.value.trim()) {
      this.descriptionError.textContent = "Deskripsi tidak boleh kosong";
      return false;
    }

    // Validate photo
    if (!this.photoBlob) {
      this.submissionStatus.innerHTML = `
        <div class="alert alert-danger">
          <p>Foto harus diambil terlebih dahulu</p>
        </div>
      `;
      return false;
    }

    return true;
  }

  dataURItoBlob(dataURI) {
    // Convert base64/URLEncoded data component to raw binary data held in a string
    let byteString;
    if (dataURI.split(",")[0].indexOf("base64") >= 0) {
      byteString = atob(dataURI.split(",")[1]);
    } else {
      byteString = unescape(dataURI.split(",")[1]);
    }

    // Separate out the mime component
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

    // Write the bytes of the string to a typed array
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });
  }

  // Properly clean up camera stream when navigating away
  disconnectedCallback() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.mediaStream = null;
    }
  }
}