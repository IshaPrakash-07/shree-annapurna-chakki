/* ==========================================================================
   Production Data Store & Real Grain Catalog (Clean Owner Edition)
   ========================================================================== */
(function () {
  const STORE_KEY = "chakki_owner_store_v1";
  const SESSION_KEY = "chakki_owner_session_v1";
  const PREFS_KEY = "chakki_owner_prefs_v1";

  const GRAINS = [
    { id: "gehu", defaultRate: 5, image: "assets/grains/gehu.jpg" },
    { id: "bajara", defaultRate: 5, image: "assets/grains/bajara.jpg" },
    { id: "jwari", defaultRate: 5, image: "assets/grains/jwari.jpg" },
    { id: "laddu", defaultRate: 5, image: "assets/grains/laddu.jpg" },
    { id: "bati", defaultRate: 5, image: "assets/grains/bati.jpg" },
    { id: "chana_daal", defaultRate: 5, image: "assets/grains/chana-daal.jpg" }
  ];

  function isoDateOffset(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function createEmptyStore() {
    return {
      owners: [],
      clients: [],
      orders: [],
      notifications: []
    };
  }

  function safeParse(json, fallback) {
    try {
      return json ? JSON.parse(json) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function loadStore() {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const initial = createEmptyStore();
      localStorage.setItem(STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = safeParse(raw, null);
    if (!parsed || !Array.isArray(parsed.clients) || !Array.isArray(parsed.orders)) {
      const initial = createEmptyStore();
      localStorage.setItem(STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    return {
      owners: Array.isArray(parsed.owners) ? parsed.owners : [],
      clients: parsed.clients,
      orders: parsed.orders,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : []
    };
  }

  function saveStore(store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }

  function loadPrefs() {
    return safeParse(localStorage.getItem(PREFS_KEY), { lang: "en", theme: "light" });
  }

  function savePrefs(prefs) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  function loadSession() {
    return safeParse(localStorage.getItem(SESSION_KEY), null);
  }

  function saveSession(session) {
    if (!session) localStorage.removeItem(SESSION_KEY);
    else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  window.CHAKKI_DATA = {
    GRAINS,
    todayISO: () => isoDateOffset(0),
    isoDateOffset,
    loadStore,
    saveStore,
    loadPrefs,
    savePrefs,
    loadSession,
    saveSession,
    STORAGE_KEYS: { STORE_KEY, SESSION_KEY, PREFS_KEY }
  };
})();
