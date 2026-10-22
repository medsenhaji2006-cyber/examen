const form = document.getElementById("item-form");
const nameInput = document.getElementById("name");
const descInput = document.getElementById("description");
const submitBtn = document.getElementById("submit-btn");
const list = document.getElementById("items");
const errorBox = document.getElementById("error");
const loadingBox = document.getElementById("loading");
const backendInfo = document.getElementById("backend-info");

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

// Requête avec timeout, vérification de response.ok et bascule vers le backend suivant
async function apiFetch(path, options = {}) {
  const { BACKENDS, TIMEOUT_MS } = window.APP_CONFIG;

  for (const base of BACKENDS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(base + path, { ...options, signal: controller.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      backendInfo.textContent = "Backend utilisé : " + base;
      console.info("Backend utilisé :", base);
      return data;
    } catch (err) {
      const reason = err.name === "AbortError" ? "délai dépassé" : err.message;
      console.warn("Échec sur " + base + " (" + reason + "), bascule...");
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Les deux serveurs sont indisponibles. Réessayez dans un instant.");
}

function render(items) {
  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = '<li class="info">Aucun élément pour le moment.</li>';
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = item.name;
    li.appendChild(strong);
    if (item.description) {
      const small = document.createElement("small");
      small.textContent = item.description;
      li.appendChild(small);
    }
    list.appendChild(li);
  }
}

async function loadItems() {
  clearError();
  loadingBox.hidden = false;
  try {
    render(await apiFetch("/api/items"));
  } catch (e) {
    showError(e.message);
  } finally {
    loadingBox.hidden = true;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();
  submitBtn.disabled = true;

  // Clé d'idempotence : générée une seule fois, réutilisée à chaque nouvel essai
  const requestId = crypto.randomUUID();

  try {
    await apiFetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        description: descInput.value.trim(),
        requestId
      })
    });
    form.reset();
    await loadItems();
  } catch (e) {
    showError(e.message);
  } finally {
    submitBtn.disabled = false;
  }
});

loadItems();