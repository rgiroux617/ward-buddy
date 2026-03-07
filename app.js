//  WardBuddy JS version 3-6-02
let DATA = null;
let selectedApplies = [];
let searchTerm = "";
let activeHighlightTerms = [];

const highlightTerms = {

  undead_spirit_threats: [
    "undead",
    "spirits",
    "ghost",
    "specter",
    "wraith",
    "incorporeal"
  ],

  creature_specific: [
    "wolf",
    "dog",
    "bear",
    "horse",
    "animal",
    "beast"
  ],

  mental_control: [
    "mind",
    "charm",
    "fear",
    "dominate",
    "possession",
    "madness"
  ],

  blood: [
  "blood",
  ],

  ritual: [
    "chanting",
    "recreated",
    "casting",
    "runes",
    "tattoos",
    "markings"
  ],

  plant: [
    "plant",
    "flower",
    "flowers",
    "tree",
    "flowering",
    "stem",
    "petals",
    "leaves",
    "vines",
    "wood",
    "berries"
  ],

  wilderness: [
  "mind",
  "charm",
  "fear",
  "dominate",
  "possession",
  "madness"
]
};

fetch("warding_data.json")
  .then(res => res.json())
  .then(json => {
    DATA = json;
    // populateFilters();
    renderWards();
  });

function populateFilters() {
  const container = document.getElementById("filter-applies");

  DATA.lookups.applies_specific.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.textContent = item.display_name;
    btn.dataset.value = item.id;

    btn.addEventListener("click", () => {
      toggleFilter(item.id, btn);
    });

    container.appendChild(btn);
  });
}

function toggleFilter(value, btn) {
  if (selectedApplies.includes(value)) {
    selectedApplies = selectedApplies.filter(v => v !== value);
    btn.classList.remove("active");
  } else {
    selectedApplies.push(value);
    btn.classList.add("active");
  }

  renderWards();
}

function renderWards() {
  const container = document.getElementById("ward-container");
  container.innerHTML = "";

  // Step 1 — relational filtering
  let wardIds = DATA.wards.map(w => w.ward_id);

  if (selectedApplies.length > 0) {
    const matchingEffects = DATA.effects.filter(e =>
      selectedApplies.includes(e.applies_against_specific)
    );

    wardIds = [...new Set(matchingEffects.map(e => e.ward_id))];
  }

  let wardsToRender = DATA.wards.filter(w =>
    wardIds.includes(w.ward_id)
  );

  // Step 2 — text search filtering
  if (searchTerm.trim() !== "") {
    wardsToRender = wardsToRender.filter(w => {
      const combinedText =
        (w.ward_name || "") +
        " " +
        (w.quote || "") +
        " " +
        (w.raw_text || "");

      return combinedText.toLowerCase().includes(searchTerm);
    });
  }

  wardsToRender.forEach(ward => {
    const card = createWardCard(ward);
    container.appendChild(card);
  });
}

function createWardCard(ward) {
  const div = document.createElement("div");
  div.className = "ward-card";

  const name = document.createElement("div");
  name.className = "ward-name";
  name.textContent = ward.ward_name;

  const quote = document.createElement("div");
  quote.className = "quote collapsible";
  quote.textContent = ward.quote || "";

  const locations = document.createElement("div");
  locations.className = "locations collapsible";
  const locationRows = (DATA.locations || []).filter(loc => loc.ward_id === ward.ward_id);
  const locationText = locationRows.length
    ? "Locations: " + locationRows.map(l => l.location_name ?? l.location_id ?? "").filter(Boolean).join(", ")
    : "";
  locations.textContent = locationText;
  console.log(ward.ward_id, "locations:", locationRows);

  const grade = document.createElement("div");
  grade.className = "dougs-grade collapsible";

  const value = ward.dougs_grade ?? "";

  grade.textContent = value;

  const valueNum = Number(ward.dougs_grade);

  if (!isNaN(valueNum)) {

    const hue = 60 + (valueNum / 10) * 180;

    grade.style.backgroundColor = `hsl(${hue}, 90%, 45%)`;

  }
 
  const raw = document.createElement("div");

  console.log("activeHighlightTerms:", activeHighlightTerms);

  if (searchTerm || activeHighlightTerms.length) {
    raw.innerHTML = highlightText(ward.raw_text || "", searchTerm);
  } else {
    raw.textContent = ward.raw_text || "";
  }

  name.addEventListener("click", () => {
    quote.classList.toggle("show");
    locations.classList.toggle("show");
    grade.classList.toggle("show");
  });

  div.appendChild(name);
  div.appendChild(quote);

  const bottomRow = document.createElement("div");
  bottomRow.className = "ward-bottom";

  bottomRow.appendChild(locations);
  bottomRow.appendChild(grade);

  div.appendChild(raw);
  div.appendChild(bottomRow);

  return div;
}

function highlightText(text, term) {

  let terms = [];

  if (term && term.trim() !== "") {
    terms.push(term.toLowerCase());
  }

  if (activeHighlightTerms.length) {
    terms = terms.concat(activeHighlightTerms);
  }

  if (terms.length === 0) return text;

  const escaped = terms.map(t =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );

  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  return text.replace(regex, match =>
    `<span class="highlight">${match}</span>`
  );

}

function handleIconAction(action) {

  activeHighlightTerms = [];

  switch (action) {

    case "wardoftheday":
      showRandomWard();
      break;

    case "blood":
      filterWardCategory("blood");
      break;

    case "ritual":
      filterWardCategory("ritual");
      break;

    case "plant":
      filterWardCategory("plant");
      break;

    case "wilderness":
      filterLocation("Wilderness");
      break;

    case "ghost":
      filterAppliesGeneral("undead_spirit_threats");
      break;

    case "creature":
      filterAppliesGeneral("creature_specific");
      break;

    case "mental":
      filterAppliesGeneral("mental_control");
      break;

    case "locations":
      openLocationsModal();
      break;

  }

}

function showRandomWard() {

  const container = document.getElementById("ward-container");
  container.innerHTML = "";

  const wards = DATA.wards;

  const randomIndex = Math.floor(Math.random() * wards.length);

  const ward = wards[randomIndex];

  const card = createWardCard(ward);

  container.appendChild(card);

}

function filterWardCategory(category) {

  activeHighlightTerms = highlightTerms[category] || [];

  const container = document.getElementById("ward-container");
  container.innerHTML = "";

  const filtered = DATA.wards.filter(
    w => w.ward_category === category
  );

  filtered.forEach(ward => {
    const card = createWardCard(ward);
    container.appendChild(card);
  });

}

function filterLocation(locationName) {

  const container = document.getElementById("ward-container");
  container.innerHTML = "";

  const locationRows = DATA.locations.filter(
    loc => loc.location_name === locationName
  );

  const wardIds = [...new Set(locationRows.map(l => l.ward_id))];

  const wards = DATA.wards.filter(
    w => wardIds.includes(w.ward_id)
  );

  wards.forEach(ward => {
    const card = createWardCard(ward);
    container.appendChild(card);
  });

}

function filterAppliesGeneral(type) {

  activeHighlightTerms = highlightTerms[type] || [];

  const container = document.getElementById("ward-container");
  container.innerHTML = "";

  const effectRows = DATA.effects.filter(
    e => e.applies_against_general === type
  );

  if (effectRows.length === 0) {
    console.warn("No effects found for:", type);
  }
  
  const wardIds = [...new Set(effectRows.map(e => e.ward_id))];

  const wards = DATA.wards.filter(
    w => wardIds.includes(w.ward_id)
  );

  wards.forEach(ward => {
    const card = createWardCard(ward);
    container.appendChild(card);
  });

}

function openLocationsModal() {

  const modal = document.getElementById("locations-modal");
  const list = document.getElementById("locations-list");

  list.innerHTML = "";

  const locations = [...new Set(
    DATA.locations.map(l => l.location_name)
  )];

  locations.sort((a, b) => a.localeCompare(b));

  locations.forEach(loc => {

    const btn = document.createElement("button");
    btn.textContent = loc;

    btn.addEventListener("click", () => {

      modal.hidden = true;
      filterLocation(loc);

    });

    list.appendChild(btn);

  });

  modal.hidden = false;

}

document
  .getElementById("search-input")
  .addEventListener("input", (e) => {

    searchTerm = e.target.value.toLowerCase();
    activeHighlightTerms = [];

    const iconGrid = document.getElementById("icon-grid");

    if (searchTerm.trim() === "") {
      iconGrid.style.display = "grid";
    } else {
      iconGrid.style.display = "none";
    }

    renderWards();
  });

document
  .getElementById("icon-grid")
  .addEventListener("click", (e) => {

    const btn = e.target.closest(".icon-btn");
    if (!btn) return;

    const action = btn.dataset.action;

    const glowColor = getComputedStyle(btn)
      .getPropertyValue("--glow-color");

    document.documentElement.style.setProperty(
      "--active-highlight-color",
      glowColor
    );

    handleIconAction(action);

  });

document
  .getElementById("close-locations")
  .addEventListener("click", () => {
    document.getElementById("locations-modal").hidden = true;
  });

document.querySelectorAll(".icon-btn").forEach(btn => {

  const hue = Math.floor(Math.random() * 360);

  btn.style.setProperty(
    "--glow-color",
    `hsl(${hue}, 100%, 65%)`
  );

});