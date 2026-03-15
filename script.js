const map = L.map("map", {
  center: [35.5, 136.5],
  zoom: 7,
  zoomControl: true,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 18,
}).addTo(map);

const panel = document.getElementById("panel");
const panelEmpty = document.getElementById("panel-empty");
const panelContent = document.getElementById("panel-content");

let markers = [];
let selectedMarker = null;

function createMarkerIcon(type) {
  return L.divIcon({
    className: `area-marker ${type}`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createSelectedIcon(type) {
  return L.divIcon({
    className: `area-marker ${type} selected`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function showArea(area) {
  document.getElementById("area-name").textContent = area.name;
  document.getElementById("area-city").textContent = area.city;

  const badge = document.getElementById("dating-type");
  badge.textContent = area.dating_type === "fast" ? "即系" : "非即系";
  badge.className = `dating-type-badge ${area.dating_type}`;

  const traitsContainer = document.getElementById("traits");
  traitsContainer.innerHTML = area.traits
    .map((t) => `<span class="trait-tag">${t}</span>`)
    .join("");

  const residentsList = document.getElementById("residents");
  residentsList.innerHTML = area.residents
    .map((r) => `<li>${r}</li>`)
    .join("");

  document.getElementById("description").textContent = area.description;

  panelEmpty.style.display = "none";
  panelContent.classList.add("active");
}

function selectMarker(marker, area) {
  if (selectedMarker) {
    const prevType = selectedMarker._areaData.dating_type;
    selectedMarker.setIcon(createMarkerIcon(prevType));
  }
  marker.setIcon(createSelectedIcon(area.dating_type));
  selectedMarker = marker;
  marker._areaData = area;
  showArea(area);
}

const cityMap = { "東京": "tokyo", "大阪": "osaka", "名古屋": "nagoya" };
let allAreas = [];

function buildTable(areas) {
  const tbody = document.getElementById("area-table-body");
  tbody.innerHTML = areas
    .map((area) => {
      const typeLabel = area.dating_type === "fast" ? "即系" : "非即系";
      const traits = area.traits.map((t) => `<span class="table-trait">${t}</span>`).join("");
      const residents = area.residents.join("、");
      return `<tr data-city="${cityMap[area.city]}" data-name="${area.name}">
        <td><strong>${area.name}</strong></td>
        <td>${area.city}</td>
        <td><span class="table-type-badge ${area.dating_type}">${typeLabel}</span></td>
        <td><div class="table-traits">${traits}</div></td>
        <td>${residents}</td>
        <td class="table-description">${area.description}</td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      const name = row.dataset.name;
      const marker = markers.find((m) => m._areaData.name === name);
      if (marker) {
        map.setView(marker.getLatLng(), 13);
        selectMarker(marker, marker._areaData);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;
      if (filter === "all") {
        buildTable(allAreas);
      } else {
        buildTable(allAreas.filter((a) => cityMap[a.city] === filter));
      }
    });
  });
}

async function init() {
  const res = await fetch("data/areas.json");
  const data = await res.json();
  allAreas = data.areas;

  data.areas.forEach((area) => {
    const marker = L.marker([area.lat, area.lng], {
      icon: createMarkerIcon(area.dating_type),
    }).addTo(map);

    marker._areaData = area;

    marker.bindTooltip(area.name, {
      className: "",
      direction: "top",
      offset: [0, -10],
    });

    marker.on("click", () => selectMarker(marker, area));

    markers.push(marker);
  });

  buildTable(allAreas);
  setupFilters();
}

init();
