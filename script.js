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
  badge.textContent = area.dating_type === "fast" ? "Fast dating type" : "Slow dating type";
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

async function init() {
  const res = await fetch("data/areas.json");
  const data = await res.json();

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
}

init();
