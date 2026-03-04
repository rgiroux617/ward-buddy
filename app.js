//  WardBuddy JS version 3-2-01
let DATA = null;
let selectedApplies = [];
let searchTerm = "";

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
 
  const raw = document.createElement("div");

  if (searchTerm) {
    raw.innerHTML = highlightText(ward.raw_text || "", searchTerm);
  } else {
    raw.textContent = ward.raw_text || "";
  }

  name.addEventListener("click", () => {
    quote.classList.toggle("show");
    locations.classList.toggle("show");
  });

  div.appendChild(name);
  div.appendChild(quote);

  div.appendChild(raw);
  div.appendChild(locations);

  return div;
}

function highlightText(text, term) {
  if (!term) return text;

  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedTerm, "gi");

  return text.replace(regex, match =>
    `<span class="highlight">${match}</span>`
  );
}

document
  .getElementById("search-input")
  .addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderWards();
  });