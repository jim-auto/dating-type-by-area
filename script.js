const map = L.map("map", {
  center: [37.0, 137.0],
  zoom: 6,
  zoomControl: true,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 18,
}).addTo(map);

const panel = document.getElementById("panel");
const panelEmpty = document.getElementById("panel-empty");
const panelContent = document.getElementById("panel-content");

const typeLabels = { fast: "即系", slow: "非即系", mixed: "中間" };

let markers = [];
let selectedMarker = null;
let checklist = { fast: [], slow: [] };

function classifyArea(area) {
  const fastCount = area.fast_checks.filter(Boolean).length;
  const slowCount = area.slow_checks.filter(Boolean).length;
  const diff = fastCount - slowCount;
  if (diff >= 3) return "fast";
  if (diff <= -3) return "slow";
  return "mixed";
}

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

function renderChecklist(area) {
  const container = document.getElementById("checklist");
  const fastItems = checklist.fast
    .map((label, i) => {
      const checked = area.fast_checks[i];
      return `<li class="${checked ? "check-on" : "check-off"}">${checked ? "\u2713" : "\u2717"} ${label}</li>`;
    })
    .join("");
  const slowItems = checklist.slow
    .map((label, i) => {
      const checked = area.slow_checks[i];
      return `<li class="${checked ? "check-on" : "check-off"}">${checked ? "\u2713" : "\u2717"} ${label}</li>`;
    })
    .join("");

  const fastCount = area.fast_checks.filter(Boolean).length;
  const slowCount = area.slow_checks.filter(Boolean).length;

  container.innerHTML = `
    <div class="check-group">
      <div class="check-group-header fast">即系要素 <span class="check-count">${fastCount}/5</span></div>
      <ul>${fastItems}</ul>
    </div>
    <div class="check-group">
      <div class="check-group-header slow">非即系要素 <span class="check-count">${slowCount}/5</span></div>
      <ul>${slowItems}</ul>
    </div>
  `;
}

function showArea(area) {
  document.getElementById("area-name").textContent = area.name;
  document.getElementById("area-city").textContent = area.city;

  const badge = document.getElementById("dating-type");
  badge.textContent = typeLabels[area.dating_type];
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

  renderChecklist(area);

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

let regionMap = {};
let allAreas = [];

function buildTable(areas) {
  const tbody = document.getElementById("area-table-body");
  tbody.innerHTML = areas
    .map((area) => {
      const fastCount = area.fast_checks.filter(Boolean).length;
      const slowCount = area.slow_checks.filter(Boolean).length;
      const traits = area.traits.map((t) => `<span class="table-trait">${t}</span>`).join("");
      const residents = area.residents.join("、");
      return `<tr data-city="${regionMap[area.city] || ""}" data-name="${area.name}">
        <td><strong>${area.name}</strong></td>
        <td>${area.city}</td>
        <td><span class="table-type-badge ${area.dating_type}">${typeLabels[area.dating_type]}</span></td>
        <td class="table-score"><span class="score-fast">${fastCount}</span> - <span class="score-slow">${slowCount}</span></td>
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
        buildTable(allAreas.filter((a) => regionMap[a.city] === filter));
      }
    });
  });
}

async function init() {
  const res = await fetch("data/areas.json");
  const data = await res.json();
  checklist = data.checklist;
  allAreas = data.areas;

  // Build city → region lookup
  for (const [region, cities] of Object.entries(data.regions)) {
    for (const city of cities) {
      regionMap[city] = region;
    }
  }

  allAreas.forEach((area) => {
    area.dating_type = classifyArea(area);
  });

  allAreas.forEach((area) => {
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
