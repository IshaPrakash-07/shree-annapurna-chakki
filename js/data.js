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

  function generateReferralCode(existingOwners) {
    const used = new Set((existingOwners || []).map((o) => String(o.referralCode || "").toUpperCase()));
    let code = "";
    for (let i = 0; i < 50; i++) {
      const num = Math.floor(1000 + Math.random() * 9000);
      code = `SAC-${num}`;
      if (!used.has(code)) return code;
    }
    return `SAC-${Date.now().toString().slice(-4)}`;
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

    let migrated = false;
    const owners = (Array.isArray(parsed.owners) ? parsed.owners : []).map((o) => {
      if (o.referralCode) return o;
      migrated = true;
      return { ...o, referralCode: generateReferralCode(parsed.owners) };
    });

    const fallbackOwnerId = owners[0]?.id || "";
    const clients = parsed.clients.map((c) => {
      if (c.ownerId || !fallbackOwnerId) return c;
      migrated = true;
      return { ...c, ownerId: fallbackOwnerId };
    });

    const clientOwnerMap = {};
    clients.forEach((c) => { clientOwnerMap[c.id] = c.ownerId; });

    const orders = parsed.orders.map((o) => {
      if (o.ownerId) return o;
      const inferredOwner = clientOwnerMap[o.clientId] || fallbackOwnerId;
      if (!inferredOwner) return o;
      migrated = true;
      return { ...o, ownerId: inferredOwner };
    });

    const notifications = (Array.isArray(parsed.notifications) ? parsed.notifications : []).map((n) => {
      if (n.ownerId) return n;
      const inferredOwner = clientOwnerMap[n.clientId] || fallbackOwnerId;
      if (!inferredOwner) return n;
      migrated = true;
      return { ...n, ownerId: inferredOwner };
    });

    const store = { owners, clients, orders, notifications };
    if (migrated) saveStore(store);
    return store;
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
    generateReferralCode,
    loadStore,
    saveStore,
    loadPrefs,
    savePrefs,
    loadSession,
    saveSession,
    STORAGE_KEYS: { STORE_KEY, SESSION_KEY, PREFS_KEY }
  };
})();
