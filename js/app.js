/* ==========================================================================
   Shree Annapurna Flour Mill - Frosted Glass Clean Owner Edition
   React 18 + HTM Application
   ========================================================================== */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const html = htm.bind(React.createElement);
  const { GRAINS, todayISO, isoDateOffset } = window.CHAKKI_DATA;

  function uid(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function formatRupees(amount) {
    const n = Number(amount || 0);
    return `₹${n % 1 === 0 ? n.toLocaleString("en-IN") : n.toFixed(2)}`;
  }

  /* -------------------- OrderRow Component --------------------
     Strict Rule: Left side shows ONLY Client/Grain info (no status badge beside name).
     Right side shows Amount + Status badge ("Paid" or "Committed for Next Time").
  ---------------------------------------------------------------- */
  function OrderRow({ order, clientName, grain, t, showClient = true, actions = null }) {
    const isPaid = order.status === "paid";
    const grainLabel = t.grains[order.grainId] || order.grainId;

    return html`
      <div className="order-row">
        <div className="order-left">
          <img className="grain-thumb" src=${grain.image} alt=${grainLabel} />
          <div>
            <div className="order-client-name">
              ${showClient ? clientName : grainLabel}
            </div>
            <div className="order-meta">
              ${showClient ? `${grainLabel} · ` : ""}${order.kg} ${t.kgUnit} · ₹${order.ratePerKg}/${t.kgUnit} · ${order.date}
            </div>
          </div>
        </div>
        <div className="order-right">
          <span className="order-amount">${formatRupees(order.total)}</span>
          <span className=${`status-badge ${isPaid ? "status-paid" : "status-next"}`}>
            ${isPaid ? t.statusPaid : t.statusNextTime}
          </span>
          ${actions}
        </div>
      </div>
    `;
  }

  /* -------------------- Rolling Real-Grain Carousel -------------------- */
  function GrainCarousel({ t, millTitle }) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
      if (paused) return;
      const timer = setInterval(() => {
        setIndex((prev) => (prev + 1) % GRAINS.length);
      }, 3600);
      return () => clearInterval(timer);
    }, [paused]);

    const prev = () => setIndex((i) => (i - 1 + GRAINS.length) % GRAINS.length);
    const next = () => setIndex((i) => (i + 1) % GRAINS.length);

    return html`
      <div
        className="carousel-card"
        onMouseEnter=${() => setPaused(true)}
        onMouseLeave=${() => setPaused(false)}
      >
        <div
          className="carousel-track"
          style=${{ transform: `translateX(-${index * 100}%)` }}
        >
          ${GRAINS.map((g, idx) => {
            const name = t.grains[g.id] || g.id;
            return html`
              <div className=${`carousel-slide ${idx === index ? "is-active" : ""}`} key=${g.id}>
                <img src=${g.image} alt=${name} />
                <div className="carousel-overlay">
                  <div className="carousel-glass-box">
                    <span className="carousel-rate-tag">${t.rateBadge}</span>
                    <div className="carousel-title">${name}</div>
                    <div className="carousel-sub">${millTitle}</div>
                  </div>
                </div>
              </div>
            `;
          })}
        </div>

        <button type="button" className="carousel-arrow prev" onClick=${prev} aria-label="Previous grain">
          ‹
        </button>
        <button type="button" className="carousel-arrow next" onClick=${next} aria-label="Next grain">
          ›
        </button>

        <div className="carousel-dots">
          ${GRAINS.map((g, idx) => html`
            <button
              key=${g.id}
              type="button"
              className=${`carousel-dot ${idx === index ? "active" : ""}`}
              onClick=${() => setIndex(idx)}
              aria-label=${t.grains[g.id]}
            />
          `)}
        </div>

        ${!paused ? html`
          <div className="carousel-progress">
            <div key=${index} className="carousel-progress-fill"></div>
          </div>
        ` : null}
      </div>
    `;
  }

  /* -------------------- Home View -------------------- */
  function HomeView({ t, millTitle, store, onGoAuth, session, onOpenDashboard }) {
    const [homeTab, setHomeTab] = useState("today");
    const [calcGrainId, setCalcGrainId] = useState("gehu");
    const [calcKg, setCalcKg] = useState(10);
    const today = todayISO();

    const clientMap = useMemo(() => {
      const m = {};
      store.clients.forEach((c) => { m[c.id] = c.name; });
      return m;
    }, [store.clients]);

    const grainMap = useMemo(() => {
      const m = {};
      GRAINS.forEach((g) => { m[g.id] = g; });
      return m;
    }, []);

    const sortedOrders = useMemo(
      () => [...store.orders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      [store.orders]
    );

    const todayOrders = useMemo(
      () => sortedOrders.filter((o) => o.date === today),
      [sortedOrders, today]
    );

    const lastOrders = useMemo(
      () => sortedOrders.filter((o) => o.date !== today).slice(0, 12),
      [sortedOrders, today]
    );

    const calcGrain = grainMap[calcGrainId] || GRAINS[0];
    const calcCharge = calcKg * calcGrain.defaultRate;

    return html`
      <div className="container">
        <section className="hero-grid">
          <div>
            <div className="hero-badge">${t.heroBadge}</div>
            <h1 className="hero-title">${t.heroHeadline}</h1>
            <p className="hero-desc">${t.heroDesc}</p>

            ${session ? html`
              <div style=${{ marginBottom: "16px" }}>
                <button type="button" className="btn btn-primary btn-lg" onClick=${onOpenDashboard}>
                  ${t.dashboard} (${session.name}) →
                </button>
              </div>
            ` : null}

            <div className="role-cta-grid">
              <button type="button" className="role-card-btn owner" onClick=${() => onGoAuth("owner", store.owners.length === 0 ? "register" : "login")}>
                <span className="role-card-title">1. ${t.ownerPortalBtn}</span>
                <span className="role-card-sub">${t.ownerPortalSub}</span>
              </button>

              <button type="button" className="role-card-btn client" onClick=${() => onGoAuth("client", "register")}>
                <span className="role-card-title">2. ${t.clientPortalBtn}</span>
                <span className="role-card-sub">${t.clientPortalSub}</span>
              </button>
            </div>
          </div>

          <${GrainCarousel} t=${t} millTitle=${millTitle} />
        </section>

        <section className="card">
          <div className="tabs-bar">
            <button
              type="button"
              className=${`tab-btn ${homeTab === "today" ? "active" : ""}`}
              onClick=${() => setHomeTab("today")}
            >
              ${t.tabTodayOrders}
              <span className="tab-count">${todayOrders.length}</span>
            </button>
            <button
              type="button"
              className=${`tab-btn ${homeTab === "last" ? "active" : ""}`}
              onClick=${() => setHomeTab("last")}
            >
              ${t.tabLastOrders}
              <span className="tab-count">${lastOrders.length}</span>
            </button>
            <button
              type="button"
              className=${`tab-btn ${homeTab === "grains" ? "active" : ""}`}
              onClick=${() => setHomeTab("grains")}
            >
              ${t.tabGrainsRates}
              <span className="tab-count">${GRAINS.length}</span>
            </button>
          </div>

          <div key=${homeTab} className="tab-panel-animate">
            ${homeTab === "today" ? html`
              ${todayOrders.length === 0
                ? html`<div className="empty-state">${t.noOrdersYet}</div>`
                : html`
                  <div className="order-list">
                    ${todayOrders.map((o) => html`
                      <${OrderRow}
                        key=${o.id}
                        order=${o}
                        clientName=${clientMap[o.clientId] || "Client"}
                        grain=${grainMap[o.grainId] || GRAINS[0]}
                        t=${t}
                      />
                    `)}
                  </div>
                `}
            ` : null}

            ${homeTab === "last" ? html`
              ${lastOrders.length === 0
                ? html`<div className="empty-state">${t.noOrdersYet}</div>`
                : html`
                  <div className="order-list">
                    ${lastOrders.map((o) => html`
                      <${OrderRow}
                        key=${o.id}
                        order=${o}
                        clientName=${clientMap[o.clientId] || "Client"}
                        grain=${grainMap[o.grainId] || GRAINS[0]}
                        t=${t}
                      />
                    `)}
                  </div>
                `}
            ` : null}

            ${homeTab === "grains" ? html`
              <div className="grains-grid">
                ${GRAINS.map((g) => html`
                  <button
                    type="button"
                    className=${`grain-card ${calcGrainId === g.id ? "selected" : ""}`}
                    key=${g.id}
                    onClick=${() => setCalcGrainId(g.id)}
                  >
                    <div className="grain-card-img-wrap">
                      <img src=${g.image} alt=${t.grains[g.id]} />
                    </div>
                    <div className="grain-card-body">
                      <div className="grain-card-title">${t.grains[g.id]}</div>
                      <div className="grain-card-rate">₹${g.defaultRate} / ${t.kgUnit}</div>
                    </div>
                  </button>
                `)}
              </div>

              <div className="calc-drawer">
                <div>
                  <div style=${{ fontWeight: 700, fontSize: "1rem" }}>${t.calcTitle} — ${t.grains[calcGrainId]}</div>
                  <div className="order-meta">${t.calcHint}</div>
                  <div style=${{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
                    <input
                      className="calc-slider"
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value=${calcKg}
                      onInput=${(e) => setCalcKg(Number(e.target.value))}
                    />
                    <span style=${{ fontWeight: 700 }}>${calcKg} ${t.kgUnit}</span>
                  </div>
                </div>
                <div className="calc-total-pill">
                  <div style=${{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>${t.calcEstimated}</div>
                  <div style=${{ fontSize: "1.45rem", fontWeight: 700, color: "var(--accent)" }}>${formatRupees(calcCharge)}</div>
                </div>
              </div>
            ` : null}
          </div>
        </section>
      </div>
    `;
  }

  /* -------------------- Auth View (Owner & Client Login / Register) -------------------- */
  function AuthView({ role, initialTab, t, store, onBack, onLoginSuccess, onRegisterOwner, onRegisterClient }) {
    const [tab, setTab] = useState(initialTab || "register");
    const [name, setName] = useState("");
    const [millName, setMillName] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
      setError("");
    }, [tab, role]);

    const handleSubmit = (e) => {
      e.preventDefault();
      setError("");
      const cleanMobile = mobile.trim();
      const cleanPin = pin.trim();

      if (tab === "login") {
        if (!cleanMobile || !cleanPin) {
          setError(t.errFillFields);
          return;
        }
        if (role === "owner") {
          if (store.owners.length === 0) {
            setError(t.errNoOwnerYet);
            return;
          }
          const found = store.owners.find((o) => o.mobile === cleanMobile && o.pin === cleanPin);
          if (!found) {
            setError(t.errInvalidLogin);
            return;
          }
          onLoginSuccess({ role: "owner", userId: found.id, name: found.name, millName: found.millName || "" });
        } else {
          const found = store.clients.find((c) => c.mobile === cleanMobile && c.pin === cleanPin);
          if (!found) {
            setError(t.errInvalidLogin);
            return;
          }
          onLoginSuccess({ role: "client", userId: found.id, name: found.name, mobile: found.mobile });
        }
        return;
      }

      if (!name.trim() || !cleanMobile || !cleanPin) {
        setError(t.errFillFields);
        return;
      }

      if (role === "owner") {
        if (store.owners.some((o) => o.mobile === cleanMobile)) {
          setError(t.errAlreadyRegistered);
          return;
        }
        onRegisterOwner({
          name: name.trim(),
          millName: millName.trim(),
          mobile: cleanMobile,
          pin: cleanPin
        });
      } else {
        if (store.clients.some((c) => c.mobile === cleanMobile)) {
          setError(t.errAlreadyRegistered);
          return;
        }
        onRegisterClient({
          name: name.trim(),
          mobile: cleanMobile,
          address: address.trim(),
          pin: cleanPin
        });
      }
    };

    return html`
      <div className="container">
        <div className="auth-wrap card">
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "10px" }}>
            <h2 style=${{ fontSize: "1.25rem" }}>
              ${role === "owner" ? t.ownerAuthTitle : t.clientAuthTitle}
            </h2>
            <button type="button" className="btn btn-sm btn-outline" onClick=${onBack}>
              ← ${t.backHome}
            </button>
          </div>

          <div className="tabs-bar">
            <button
              type="button"
              className=${`tab-btn ${tab === "register" ? "active" : ""}`}
              onClick=${() => setTab("register")}
            >
              ${t.registerTab}
            </button>
            <button
              type="button"
              className=${`tab-btn ${tab === "login" ? "active" : ""}`}
              onClick=${() => setTab("login")}
            >
              ${t.loginTab}
            </button>
          </div>

          ${error ? html`<div className="alert alert-error">${error}</div>` : null}

          <form onSubmit=${handleSubmit}>
            ${tab === "register" ? html`
              <div className="form-group">
                <label className="form-label">${t.fullName} *</label>
                <input
                  className="form-control"
                  value=${name}
                  onInput=${(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                />
              </div>
              ${role === "owner" ? html`
                <div className="form-group">
                  <label className="form-label">${t.millNameLabel}</label>
                  <input
                    className="form-control"
                    value=${millName}
                    onInput=${(e) => setMillName(e.target.value)}
                    placeholder="e.g. Shree Annapurna Chakki"
                  />
                </div>
              ` : html`
                <div className="form-group">
                  <label className="form-label">${t.addressLabel}</label>
                  <input
                    className="form-control"
                    value=${address}
                    onInput=${(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shastri Nagar"
                  />
                </div>
              `}
            ` : null}

            <div className="form-group">
              <label className="form-label">${t.mobileLabel} *</label>
              <input
                className="form-control"
                type="tel"
                value=${mobile}
                onInput=${(e) => setMobile(e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>

            <div className="form-group">
              <label className="form-label">${t.pinLabel} *</label>
              <input
                className="form-control"
                type="password"
                value=${pin}
                onInput=${(e) => setPin(e.target.value)}
                placeholder="1234"
              />
            </div>

            <button type="submit" className="btn btn-primary" style=${{ width: "100%", marginTop: "6px" }}>
              ${tab === "login"
                ? t.loginBtn
                : role === "owner"
                  ? t.registerOwnerBtn
                  : t.registerClientBtn}
            </button>
          </form>
        </div>
      </div>
    `;
  }

  /* -------------------- Add Client Modal -------------------- */
  function AddClientModal({ t, onClose, onSave }) {
    const [name, setName] = useState("");
    const [mobile, setMobile] = useState("");
    const [address, setAddress] = useState("");
    const [pin, setPin] = useState("1234");
    const [err, setErr] = useState("");

    const submit = (e) => {
      e.preventDefault();
      if (!name.trim() || !mobile.trim()) {
        setErr(t.errFillFields);
        return;
      }
      const res = onSave({
        name: name.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        pin: pin.trim() || "1234"
      });
      if (!res.ok) {
        setErr(res.error || t.errAlreadyRegistered);
        return;
      }
      onClose();
    };

    return html`
      <div className="modal-backdrop" onClick=${onClose}>
        <div className="modal-box" onClick=${(e) => e.stopPropagation()}>
          <h3 style=${{ marginBottom: "14px" }}>${t.addClientModalTitle}</h3>
          ${err ? html`<div className="alert alert-error">${err}</div>` : null}
          <form onSubmit=${submit}>
            <div className="form-group">
              <label className="form-label">${t.fullName} *</label>
              <input className="form-control" value=${name} onInput=${(e) => setName(e.target.value)} placeholder="e.g. Prakash Rao" />
            </div>
            <div className="form-group">
              <label className="form-label">${t.mobileLabel} *</label>
              <input className="form-control" type="tel" value=${mobile} onInput=${(e) => setMobile(e.target.value)} placeholder="98XXXXXXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">${t.addressLabel}</label>
              <input className="form-control" value=${address} onInput=${(e) => setAddress(e.target.value)} placeholder="Colony / Village" />
            </div>
            <div className="form-group">
              <label className="form-label">${t.pinLabel}</label>
              <input className="form-control" value=${pin} onInput=${(e) => setPin(e.target.value)} placeholder="1234" />
            </div>
            <div style=${{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "14px" }}>
              <button type="button" className="btn btn-outline" onClick=${onClose}>${t.cancelBtn}</button>
              <button type="submit" className="btn btn-primary">${t.saveClientBtn}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /* -------------------- Owner Dashboard -------------------- */
  function OwnerDashboard({
    t, session, store, onAddClient, onAddOrder, onToggleOrderStatus, onMarkAllClientPaid,
    onDeleteOrder, onMarkAllNotifsRead
  }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [showNotifs, setShowNotifs] = useState(false);
    const [showAddClient, setShowAddClient] = useState(false);
    const [clientSearch, setClientSearch] = useState("");
    const [orderSearch, setOrderSearch] = useState("");
    const [selectedClientId, setSelectedClientId] = useState(store.clients[0]?.id || "");

    // New Order Form State
    const [orderClientId, setOrderClientId] = useState(store.clients[0]?.id || "");
    const [orderGrainId, setOrderGrainId] = useState("gehu");
    const [orderKg, setOrderKg] = useState("10");
    const [orderRate, setOrderRate] = useState("5");
    const [orderStatus, setOrderStatus] = useState("paid");
    const [orderDate, setOrderDate] = useState(todayISO());
    const [orderFilter, setOrderFilter] = useState("all");
    const [orderSavedMsg, setOrderSavedMsg] = useState("");

    useEffect(() => {
      if (!selectedClientId && store.clients.length > 0) {
        setSelectedClientId(store.clients[0].id);
      }
      if (!orderClientId && store.clients.length > 0) {
        setOrderClientId(store.clients[0].id);
      }
    }, [store.clients]);

    const today = todayISO();
    const unreadCount = store.notifications.filter((n) => !n.read).length;

    const clientMap = useMemo(() => {
      const m = {};
      store.clients.forEach((c) => { m[c.id] = c; });
      return m;
    }, [store.clients]);

    const grainMap = useMemo(() => {
      const m = {};
      GRAINS.forEach((g) => { m[g.id] = g; });
      return m;
    }, []);

    const sortedOrders = useMemo(
      () => [...store.orders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      [store.orders]
    );

    const kpis = useMemo(() => {
      let todayIncome = 0;
      let todayKg = 0;
      let totalRemaining = 0;
      let totalPaidAll = 0;
      store.orders.forEach((o) => {
        if (o.date === today) {
          todayKg += Number(o.kg || 0);
          if (o.status === "paid") todayIncome += Number(o.total || 0);
        }
        if (o.status === "next_time") totalRemaining += Number(o.total || 0);
        else totalPaidAll += Number(o.total || 0);
      });
      const grandTotal = totalPaidAll + totalRemaining;
      const paidRatioPct = grandTotal > 0 ? Math.round((totalPaidAll / grandTotal) * 100) : 100;
      return { todayIncome, todayKg, totalRemaining, totalPaidAll, paidRatioPct, clientCount: store.clients.length };
    }, [store.orders, store.clients, today]);

    const nextTimeOrders = useMemo(
      () => sortedOrders.filter((o) => o.status === "next_time"),
      [sortedOrders]
    );

    const weeklyGrainStats = useMemo(() => {
      const cutoff = isoDateOffset(6);
      const map = {};
      GRAINS.forEach((g) => {
        map[g.id] = { grain: g, revenue: 0, kg: 0, count: 0 };
      });
      store.orders.forEach((o) => {
        if (o.date >= cutoff && map[o.grainId]) {
          map[o.grainId].revenue += Number(o.total || 0);
          map[o.grainId].kg += Number(o.kg || 0);
          map[o.grainId].count += 1;
        }
      });
      const list = Object.values(map);
      const maxRev = Math.max(1, ...list.map((x) => x.revenue));
      return { list, maxRev };
    }, [store.orders]);

    const filteredClients = useMemo(() => {
      const q = clientSearch.trim().toLowerCase();
      if (!q) return store.clients;
      return store.clients.filter(
        (c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q)
      );
    }, [store.clients, clientSearch]);

    const filteredAllOrders = useMemo(() => {
      const q = orderSearch.trim().toLowerCase();
      return sortedOrders.filter((o) => {
        if (orderFilter !== "all" && o.status !== orderFilter) return false;
        if (!q) return true;
        const cName = (clientMap[o.clientId]?.name || "").toLowerCase();
        const gName = (t.grains[o.grainId] || o.grainId).toLowerCase();
        return cName.includes(q) || gName.includes(q);
      });
    }, [sortedOrders, orderFilter, orderSearch, clientMap, t.grains]);

    const selectedClient = clientMap[selectedClientId] || null;
    const selectedClientOrders = useMemo(() => {
      if (!selectedClient) return [];
      return sortedOrders.filter((o) => o.clientId === selectedClient.id);
    }, [sortedOrders, selectedClient]);

    const selectedClientTotals = useMemo(() => {
      let paid = 0;
      let due = 0;
      let kg = 0;
      selectedClientOrders.forEach((o) => {
        kg += Number(o.kg || 0);
        if (o.status === "paid") paid += Number(o.total || 0);
        else due += Number(o.total || 0);
      });
      return { paid, due, kg };
    }, [selectedClientOrders]);

    const handleAddOrderSubmit = (e) => {
      e.preventDefault();
      const kgNum = parseFloat(orderKg);
      const rateNum = parseFloat(orderRate);
      if (!orderClientId || !kgNum || kgNum <= 0 || !rateNum || rateNum <= 0) return;
      onAddOrder({
        clientId: orderClientId,
        grainId: orderGrainId,
        kg: kgNum,
        ratePerKg: rateNum,
        status: orderStatus,
        date: orderDate || today
      });
      setOrderSavedMsg(`✓ ${t.saveOrderBtn} (${kgNum} ${t.kgUnit} · ${formatRupees(kgNum * rateNum)})`);
      setTimeout(() => setOrderSavedMsg(""), 3000);
    };

    const handleExportJson = () => {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chakki-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const renderOrderActions = (o) => html`
      <button
        type="button"
        className="btn btn-sm btn-secondary"
        onClick=${() => onToggleOrderStatus(o.id)}
      >
        ${o.status === "paid" ? t.moveNextTimeBtn : t.markPaidBtn}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-danger"
        onClick=${() => onDeleteOrder(o.id)}
      >
        ${t.deleteBtn}
      </button>
    `;

    return html`
      <div className="container">
        <div className="dash-header">
          <div>
            <h1 style=${{ fontSize: "1.45rem" }}>${t.ownerWelcome} — ${session.name}</h1>
            <div style=${{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              ${session.millName || t.chakkiTitle}
            </div>
          </div>

          <div className="dash-actions">
            <button
              type="button"
              className="btn btn-secondary notif-btn"
              onClick=${() => setShowNotifs((v) => !v)}
            >
              🔔 ${t.notificationsBtn}
              ${unreadCount > 0 ? html`<span className="notif-dot">${unreadCount}</span>` : null}
            </button>
            <button type="button" className="btn btn-primary" onClick=${() => setShowAddClient(true)}>
              ${t.addClientBtn}
            </button>
            <button type="button" className="btn btn-secondary" onClick=${() => setActiveTab("new_entry")}>
              ${t.addOrderBtn}
            </button>
            <button type="button" className="btn btn-outline" onClick=${handleExportJson}>
              ⬇ ${t.exportJsonBtn}
            </button>
          </div>
        </div>

        ${showNotifs ? html`
          <div className="card" style=${{ marginBottom: "18px" }}>
            <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3>🔔 ${t.notificationsBtn}</h3>
              ${unreadCount > 0 ? html`
                <button type="button" className="btn btn-sm btn-outline" onClick=${onMarkAllNotifsRead}>
                  ${t.markAllRead}
                </button>
              ` : null}
            </div>
            ${store.notifications.length === 0
              ? html`<div className="empty-state">${t.noNotifications}</div>`
              : html`
                <div className="order-list">
                  ${store.notifications.map((n) => html`
                    <div className="order-row" key=${n.id}>
                      <div>
                        <div style=${{ fontWeight: 700 }}>${t.notifRegisteredMsg}: ${n.clientName}</div>
                        <div className="order-meta">${n.clientMobile} · ${n.date}</div>
                      </div>
                      <span className=${`status-badge ${n.read ? "status-paid" : "status-next"}`}>
                        ${n.read ? "Read" : "New"}
                      </span>
                    </div>
                  `)}
                </div>
              `}
          </div>
        ` : null}

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">${t.kpiTodayIncome}</div>
            <div className="kpi-value">${formatRupees(kpis.todayIncome)}</div>
            <div className="kpi-sub">${today}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">${t.kpiRemaining}</div>
            <div className="kpi-value">${formatRupees(kpis.totalRemaining)}</div>
            <div className="kpi-sub">${nextTimeOrders.length} ${t.ordersUnit}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">${t.kpiTodayKg}</div>
            <div className="kpi-value">${kpis.todayKg} ${t.kgUnit}</div>
            <div className="kpi-sub">${t.rateBadge}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">${t.kpiClients}</div>
            <div className="kpi-value">${kpis.clientCount}</div>
            <div className="kpi-sub">${unreadCount > 0 ? `${unreadCount} new` : t.chakkiSubtitle}</div>
          </div>
        </div>

        <div className="split-gauge-card">
          <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "0.86rem", fontWeight: 600 }}>
            <span>${t.collectionHealthTitle}</span>
            <span>${t.statusPaid}: ${formatRupees(kpis.totalPaidAll)} (${kpis.paidRatioPct}%) · ${t.statusNextTime}: ${formatRupees(kpis.totalRemaining)}</span>
          </div>
          <div className="split-bar-track">
            <div className="split-bar-paid" style=${{ width: `${kpis.paidRatioPct}%` }}></div>
          </div>
        </div>

        <div className="card">
          <div className="tabs-bar">
            <button type="button" className=${`tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick=${() => setActiveTab("overview")}>
              ${t.tabOverview}
            </button>
            <button type="button" className=${`tab-btn ${activeTab === "clients" ? "active" : ""}`} onClick=${() => setActiveTab("clients")}>
              ${t.tabClients}
              <span className="tab-count">${store.clients.length}</span>
            </button>
            <button type="button" className=${`tab-btn ${activeTab === "next_time" ? "active" : ""}`} onClick=${() => setActiveTab("next_time")}>
              ${t.tabNextTime}
              <span className="tab-count">${nextTimeOrders.length}</span>
            </button>
            <button type="button" className=${`tab-btn ${activeTab === "weekly_grains" ? "active" : ""}`} onClick=${() => setActiveTab("weekly_grains")}>
              ${t.tabWeeklyGrains}
            </button>
            <button type="button" className=${`tab-btn ${activeTab === "new_entry" ? "active" : ""}`} onClick=${() => setActiveTab("new_entry")}>
              ${t.tabNewEntry}
            </button>
          </div>

          <div key=${activeTab} className="tab-panel-animate">
            ${activeTab === "overview" ? html`
              <h3 style=${{ marginBottom: "12px" }}>${t.tabTodayOrders}</h3>
              ${sortedOrders.filter((o) => o.date === today).length === 0
                ? html`<div className="empty-state">${t.noOrdersYet}</div>`
                : html`
                  <div className="order-list">
                    ${sortedOrders.filter((o) => o.date === today).map((o) => html`
                      <${OrderRow}
                        key=${o.id}
                        order=${o}
                        clientName=${clientMap[o.clientId]?.name || "Client"}
                        grain=${grainMap[o.grainId] || GRAINS[0]}
                        t=${t}
                        actions=${renderOrderActions(o)}
                      />
                    `)}
                  </div>
                `}
            ` : null}

            ${activeTab === "clients" ? html`
              <div className="clients-layout">
                <div>
                  <div style=${{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <input
                      className="form-control"
                      value=${clientSearch}
                      onInput=${(e) => setClientSearch(e.target.value)}
                      placeholder=${t.searchClients}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick=${() => setShowAddClient(true)}>+</button>
                  </div>
                  <div className="client-pill-list">
                    ${filteredClients.length === 0
                      ? html`<div className="empty-state">${t.noOrdersYet}</div>`
                      : filteredClients.map((c) => {
                        const due = store.orders
                          .filter((o) => o.clientId === c.id && o.status === "next_time")
                          .reduce((sum, o) => sum + Number(o.total || 0), 0);
                        return html`
                          <button
                            key=${c.id}
                            type="button"
                            className=${`client-tab-btn ${selectedClientId === c.id ? "active" : ""}`}
                            onClick=${() => setSelectedClientId(c.id)}
                          >
                            <div>
                              <div style=${{ fontWeight: 700 }}>${c.name}</div>
                              <div className="client-sub">${c.mobile}${c.address ? ` · ${c.address}` : ""}</div>
                            </div>
                            ${due > 0 ? html`<span style=${{ fontWeight: 700, fontSize: "0.82rem" }}>${formatRupees(due)}</span>` : null}
                          </button>
                        `;
                      })}
                  </div>
                </div>

                <div>
                  ${!selectedClient ? html`
                    <div className="empty-state">${t.selectClientPrompt}</div>
                  ` : html`
                    <div className="card-soft" style=${{ marginBottom: "14px" }}>
                      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                        <div>
                          <h3 style=${{ fontSize: "1.15rem" }}>${selectedClient.name}</h3>
                          <div className="order-meta">${selectedClient.mobile}${selectedClient.address ? ` · ${selectedClient.address}` : ""}</div>
                        </div>
                        <div style=${{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          ${selectedClientTotals.due > 0 ? html`
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick=${() => onMarkAllClientPaid(selectedClient.id)}
                            >
                              ✓ ${t.markAllClientPaidBtn}
                            </button>
                          ` : null}
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick=${() => { setOrderClientId(selectedClient.id); setActiveTab("new_entry"); }}
                          >
                            ${t.addOrderBtn}
                          </button>
                        </div>
                      </div>
                      <div className="kpi-grid" style=${{ marginBottom: 0 }}>
                        <div className="kpi-card">
                          <div className="kpi-label">${t.clientTotalPaid}</div>
                          <div className="kpi-value">${formatRupees(selectedClientTotals.paid)}</div>
                        </div>
                        <div className="kpi-card">
                          <div className="kpi-label">${t.clientRemaining}</div>
                          <div className="kpi-value">${formatRupees(selectedClientTotals.due)}</div>
                        </div>
                        <div className="kpi-card">
                          <div className="kpi-label">${t.clientTotalKg}</div>
                          <div className="kpi-value">${selectedClientTotals.kg} ${t.kgUnit}</div>
                        </div>
                      </div>
                    </div>

                    ${selectedClientOrders.length === 0
                      ? html`<div className="empty-state">${t.noOrdersYet}</div>`
                      : html`
                        <div className="order-list">
                          ${selectedClientOrders.map((o) => html`
                            <${OrderRow}
                              key=${o.id}
                              order=${o}
                              clientName=${selectedClient.name}
                              grain=${grainMap[o.grainId] || GRAINS[0]}
                              t=${t}
                              showClient=${false}
                              actions=${renderOrderActions(o)}
                            />
                          `)}
                        </div>
                      `}
                  `}
                </div>
              </div>
            ` : null}

            ${activeTab === "next_time" ? html`
              ${nextTimeOrders.length === 0
                ? html`<div className="empty-state">${t.nextTimeEmpty}</div>`
                : html`
                  <div className="order-list">
                    ${nextTimeOrders.map((o) => html`
                      <${OrderRow}
                        key=${o.id}
                        order=${o}
                        clientName=${clientMap[o.clientId]?.name || "Client"}
                        grain=${grainMap[o.grainId] || GRAINS[0]}
                        t=${t}
                        actions=${renderOrderActions(o)}
                      />
                    `)}
                  </div>
                `}
            ` : null}

            ${activeTab === "weekly_grains" ? html`
              <div style=${{ marginBottom: "16px" }}>
                <h3>${t.weeklyGrainTitle}</h3>
                <p style=${{ fontSize: "0.86rem", color: "var(--text-muted)" }}>${t.weeklyGrainSub}</p>
              </div>
              <div className="revenue-grid">
                ${weeklyGrainStats.list.map(({ grain, revenue, kg, count }) => {
                  const pct = Math.round((revenue / weeklyGrainStats.maxRev) * 100);
                  return html`
                    <div className="revenue-card" key=${grain.id}>
                      <div className="revenue-img-wrap">
                        <img src=${grain.image} alt=${t.grains[grain.id]} />
                      </div>
                      <div className="revenue-body">
                        <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                          <strong>${t.grains[grain.id]}</strong>
                          <span style=${{ fontWeight: 700, color: "var(--accent)", fontSize: "1.05rem" }}>${formatRupees(revenue)}</span>
                        </div>
                        <div className="order-meta">${kg} ${t.kgUnit} · ${count} ${t.ordersUnit}</div>
                        <div className="progress-track">
                          <div className="progress-fill" style=${{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  `;
                })}
              </div>
            ` : null}

            ${activeTab === "new_entry" ? html`
              <div className="card-soft" style=${{ marginBottom: "20px" }}>
                <h3 style=${{ marginBottom: "12px" }}>${t.addOrderBtn}</h3>
                ${orderSavedMsg ? html`<div className="alert alert-success">${orderSavedMsg}</div>` : null}
                ${store.clients.length === 0 ? html`
                  <div className="alert">
                    ${t.selectClientPrompt}
                    <button type="button" className="btn btn-primary btn-sm" style=${{ marginLeft: "10px" }} onClick=${() => setShowAddClient(true)}>
                      ${t.addClientBtn}
                    </button>
                  </div>
                ` : html`
                  <form onSubmit=${handleAddOrderSubmit}>
                    <div style=${{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                      <div className="form-group">
                        <label className="form-label">${t.selectClient}</label>
                        <select className="form-control" value=${orderClientId} onChange=${(e) => setOrderClientId(e.target.value)}>
                          ${store.clients.map((c) => html`<option key=${c.id} value=${c.id}>${c.name} (${c.mobile})</option>`)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">${t.weightKg}</label>
                        <input className="form-control" type="number" step="0.5" min="0.5" value=${orderKg} onInput=${(e) => setOrderKg(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">${t.ratePerKg}</label>
                        <input className="form-control" type="number" step="0.5" min="1" value=${orderRate} onInput=${(e) => setOrderRate(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">${t.orderDate}</label>
                        <input className="form-control" type="date" value=${orderDate} onInput=${(e) => setOrderDate(e.target.value)} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">${t.selectGrain}</label>
                      <div className="grain-picker-grid">
                        ${GRAINS.map((g) => html`
                          <button
                            key=${g.id}
                            type="button"
                            className=${`grain-pick-btn ${orderGrainId === g.id ? "selected" : ""}`}
                            onClick=${() => setOrderGrainId(g.id)}
                          >
                            <img className="grain-pick-img" src=${g.image} alt=${t.grains[g.id]} />
                            <div className="grain-pick-name">${t.grains[g.id]}</div>
                          </button>
                        `)}
                      </div>
                    </div>

                    <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginTop: "12px" }}>
                      <div style=${{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                        <span className="form-label">${t.paymentStatus}:</span>
                        <button
                          type="button"
                          className=${`tab-btn ${orderStatus === "paid" ? "active" : ""}`}
                          onClick=${() => setOrderStatus("paid")}
                        >
                          ${t.statusPaid}
                        </button>
                        <button
                          type="button"
                          className=${`tab-btn ${orderStatus === "next_time" ? "active" : ""}`}
                          onClick=${() => setOrderStatus("next_time")}
                        >
                          ${t.statusNextTime}
                        </button>
                      </div>

                      <div style=${{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <strong>${t.totalAmount}: ${formatRupees((parseFloat(orderKg) || 0) * (parseFloat(orderRate) || 0))}</strong>
                        <button type="submit" className="btn btn-primary">${t.saveOrderBtn}</button>
                      </div>
                    </div>
                  </form>
                `}
              </div>

              <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                <h3>${t.tabNewEntry}</h3>
                <div style=${{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    className="form-control"
                    style=${{ width: "220px", padding: "8px 12px", fontSize: "0.85rem" }}
                    value=${orderSearch}
                    onInput=${(e) => setOrderSearch(e.target.value)}
                    placeholder=${t.searchOrders}
                  />
                  <button type="button" className=${`tab-btn ${orderFilter === "all" ? "active" : ""}`} onClick=${() => setOrderFilter("all")}>All</button>
                  <button type="button" className=${`tab-btn ${orderFilter === "paid" ? "active" : ""}`} onClick=${() => setOrderFilter("paid")}>${t.statusPaid}</button>
                  <button type="button" className=${`tab-btn ${orderFilter === "next_time" ? "active" : ""}`} onClick=${() => setOrderFilter("next_time")}>${t.statusNextTime}</button>
                </div>
              </div>

              ${filteredAllOrders.length === 0
                ? html`<div className="empty-state">${t.noOrdersYet}</div>`
                : html`
                  <div className="order-list">
                    ${filteredAllOrders.map((o) => html`
                      <${OrderRow}
                        key=${o.id}
                        order=${o}
                        clientName=${clientMap[o.clientId]?.name || "Client"}
                        grain=${grainMap[o.grainId] || GRAINS[0]}
                        t=${t}
                        actions=${renderOrderActions(o)}
                      />
                    `)}
                  </div>
                `}
            ` : null}
          </div>
        </div>

        ${showAddClient ? html`
          <${AddClientModal}
            t=${t}
            onClose=${() => setShowAddClient(false)}
            onSave=${(data) => {
              const res = onAddClient(data);
              if (res.ok && res.client) {
                setSelectedClientId(res.client.id);
                setOrderClientId(res.client.id);
              }
              return res;
            }}
          />
        ` : null}
      </div>
    `;
  }

  /* -------------------- Client Dashboard (Strictly Isolated) -------------------- */
  function ClientDashboard({ t, session, store }) {
    const [tab, setTab] = useState("all");

    const grainMap = useMemo(() => {
      const m = {};
      GRAINS.forEach((g) => { m[g.id] = g; });
      return m;
    }, []);

    const myOrders = useMemo(
      () =>
        store.orders
          .filter((o) => o.clientId === session.userId)
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      [store.orders, session.userId]
    );

    const summary = useMemo(() => {
      let paid = 0;
      let remaining = 0;
      let kg = 0;
      myOrders.forEach((o) => {
        kg += Number(o.kg || 0);
        if (o.status === "paid") paid += Number(o.total || 0);
        else remaining += Number(o.total || 0);
      });
      return { paid, remaining, kg };
    }, [myOrders]);

    const visibleOrders = useMemo(() => {
      if (tab === "pending") return myOrders.filter((o) => o.status === "next_time");
      if (tab === "paid") return myOrders.filter((o) => o.status === "paid");
      return myOrders;
    }, [myOrders, tab]);

    return html`
      <div className="container">
        <div className="dash-header">
          <div>
            <h1 style=${{ fontSize: "1.45rem" }}>${t.clientWelcome} — ${session.name}</h1>
            <div style=${{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              ${session.mobile} · ${t.clientNotice}
            </div>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">${t.myRemaining}</div>
            <div className="kpi-value">${formatRupees(summary.remaining)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">${t.myPaidTotal}</div>
            <div className="kpi-value">${formatRupees(summary.paid)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">${t.myTotalKg}</div>
            <div className="kpi-value">${summary.kg} ${t.kgUnit}</div>
          </div>
        </div>

        <div className="card">
          <div className="tabs-bar">
            <button type="button" className=${`tab-btn ${tab === "all" ? "active" : ""}`} onClick=${() => setTab("all")}>
              ${t.tabMyAll}
              <span className="tab-count">${myOrders.length}</span>
            </button>
            <button type="button" className=${`tab-btn ${tab === "pending" ? "active" : ""}`} onClick=${() => setTab("pending")}>
              ${t.tabMyPending}
              <span className="tab-count">${myOrders.filter((o) => o.status === "next_time").length}</span>
            </button>
            <button type="button" className=${`tab-btn ${tab === "paid" ? "active" : ""}`} onClick=${() => setTab("paid")}>
              ${t.tabMyPaid}
              <span className="tab-count">${myOrders.filter((o) => o.status === "paid").length}</span>
            </button>
          </div>

          <div key=${tab} className="tab-panel-animate">
            ${visibleOrders.length === 0
              ? html`<div className="empty-state">${t.noOrdersYet}</div>`
              : html`
                <div className="order-list">
                  ${visibleOrders.map((o) => html`
                    <${OrderRow}
                      key=${o.id}
                      order=${o}
                      clientName=${session.name}
                      grain=${grainMap[o.grainId] || GRAINS[0]}
                      t=${t}
                      showClient=${false}
                    />
                  `)}
                </div>
              `}
          </div>
        </div>
      </div>
    `;
  }

  /* -------------------- Root App Component -------------------- */
  function App() {
    const D = window.CHAKKI_DATA;
    const [prefs, setPrefs] = useState(() => D.loadPrefs());
    const [store, setStore] = useState(() => D.loadStore());
    const [session, setSession] = useState(() => D.loadSession());
    const [view, setView] = useState(() => (D.loadSession() ? "dashboard" : "home"));
    const [authRole, setAuthRole] = useState("owner");
    const [authTab, setAuthTab] = useState("register");
    const [toastMsg, setToastMsg] = useState("");

    const t = window.CHAKKI_I18N[prefs.lang] || window.CHAKKI_I18N.en;
    const displayMillTitle = t.chakkiTitle;

    useEffect(() => {
      document.documentElement.setAttribute("data-theme", prefs.theme);
      document.title = displayMillTitle;
      D.savePrefs(prefs);
    }, [prefs, displayMillTitle]);

    useEffect(() => {
      const onStorage = (ev) => {
        if (ev.key === D.STORAGE_KEYS.STORE_KEY) {
          setStore(D.loadStore());
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, []);

    const showToast = (msg) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(""), 3500);
    };

    const updateStore = (updater) => {
      setStore((prev) => {
        const next = updater(prev);
        D.saveStore(next);
        return next;
      });
    };

    const handleLoginSuccess = (newSession) => {
      setSession(newSession);
      D.saveSession(newSession);
      setView("dashboard");
    };

    const handleLogout = () => {
      setSession(null);
      D.saveSession(null);
      setView("home");
    };

    const handleRegisterOwner = ({ name, millName, mobile, pin }) => {
      const ownerObj = { id: uid("owner"), name, millName, mobile, pin, createdAt: todayISO() };
      updateStore((prev) => ({ ...prev, owners: [...prev.owners, ownerObj] }));
      handleLoginSuccess({ role: "owner", userId: ownerObj.id, name: ownerObj.name, millName: ownerObj.millName });
    };

    const handleRegisterClient = ({ name, mobile, address, pin }) => {
      const clientObj = { id: uid("c"), name, mobile, address, pin, createdAt: todayISO() };
      const notifObj = {
        id: uid("n"),
        type: "client_registered",
        clientId: clientObj.id,
        clientName: clientObj.name,
        clientMobile: clientObj.mobile,
        date: todayISO(),
        read: false
      };
      updateStore((prev) => ({
        ...prev,
        clients: [...prev.clients, clientObj],
        notifications: [notifObj, ...prev.notifications]
      }));
      handleLoginSuccess({ role: "client", userId: clientObj.id, name: clientObj.name, mobile: clientObj.mobile });
      showToast(t.regSuccessClient);
    };

    const handleOwnerAddClient = ({ name, mobile, address, pin }) => {
      if (store.clients.some((c) => c.mobile === mobile)) {
        return { ok: false, error: t.errAlreadyRegistered };
      }
      const clientObj = { id: uid("c"), name, mobile, address, pin, createdAt: todayISO() };
      updateStore((prev) => ({ ...prev, clients: [...prev.clients, clientObj] }));
      return { ok: true, client: clientObj };
    };

    const handleAddOrder = ({ clientId, grainId, kg, ratePerKg, status, date }) => {
      const total = Number((kg * ratePerKg).toFixed(2));
      const newOrder = {
        id: uid("o"),
        clientId,
        grainId,
        kg,
        ratePerKg,
        total,
        status,
        date,
        createdAt: Date.now()
      };
      updateStore((prev) => ({ ...prev, orders: [newOrder, ...prev.orders] }));
    };

    const handleToggleOrderStatus = (orderId) => {
      updateStore((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId ? { ...o, status: o.status === "paid" ? "next_time" : "paid" } : o
        )
      }));
    };

    const handleMarkAllClientPaid = (clientId) => {
      updateStore((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.clientId === clientId && o.status === "next_time" ? { ...o, status: "paid" } : o
        )
      }));
    };

    const handleDeleteOrder = (orderId) => {
      updateStore((prev) => ({
        ...prev,
        orders: prev.orders.filter((o) => o.id !== orderId)
      }));
    };

    const handleMarkAllNotifsRead = () => {
      updateStore((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true }))
      }));
    };

    return html`
      <div>
        <div className="ambient-canvas" aria-hidden="true">
          <div className="ambient-orb orb-a"></div>
          <div className="ambient-orb orb-b"></div>
          <div className="ambient-orb orb-c"></div>
        </div>

        <div className="app-shell">
          <header className="navbar">
            <div className="navbar-inner">
              <button type="button" className="brand-btn" onClick=${() => setView("home")}>
                <div className="brand-mark">
                  <img src="assets/grains/gehu.jpg" alt=${displayMillTitle} />
                </div>
                <div>
                  <div className="brand-title">${displayMillTitle}</div>
                  <div className="brand-subtitle">${t.chakkiSubtitle}</div>
                </div>
              </button>

              <div className="nav-controls">
                <select
                  className="lang-select"
                  value=${prefs.lang}
                  onChange=${(e) => setPrefs((p) => ({ ...p, lang: e.target.value }))}
                  aria-label="Language"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>

                <button
                  type="button"
                  className="icon-btn"
                  onClick=${() => setPrefs((p) => ({ ...p, theme: p.theme === "light" ? "dark" : "light" }))}
                >
                  ${prefs.theme === "light" ? `🌙 ${t.darkMode}` : `☀️ ${t.lightMode}`}
                </button>

                ${view !== "home" ? html`
                  <button type="button" className="icon-btn" onClick=${() => setView("home")}>
                    ${t.home}
                  </button>
                ` : null}

                ${session ? html`
                  <button type="button" className="icon-btn" onClick=${handleLogout}>
                    ${t.logout}
                  </button>
                ` : null}
              </div>
            </div>
          </header>

          <main className="main-content">
            ${toastMsg ? html`
              <div className="container">
                <div className="alert alert-success">${toastMsg}</div>
              </div>
            ` : null}

            ${view === "home" ? html`
              <${HomeView}
                t=${t}
                millTitle=${displayMillTitle}
                store=${store}
                session=${session}
                onOpenDashboard=${() => setView("dashboard")}
                onGoAuth=${(r, initialT) => {
                  setAuthRole(r);
                  setAuthTab(initialT || "register");
                  setView("auth");
                }}
              />
            ` : null}

            ${view === "auth" ? html`
              <${AuthView}
                role=${authRole}
                initialTab=${authTab}
                t=${t}
                store=${store}
                onBack=${() => setView("home")}
                onLoginSuccess=${handleLoginSuccess}
                onRegisterOwner=${handleRegisterOwner}
                onRegisterClient=${handleRegisterClient}
              />
            ` : null}

            ${view === "dashboard" && session?.role === "owner" ? html`
              <${OwnerDashboard}
                t=${t}
                session=${session}
                store=${store}
                onAddClient=${handleOwnerAddClient}
                onAddOrder=${handleAddOrder}
                onToggleOrderStatus=${handleToggleOrderStatus}
                onMarkAllClientPaid=${handleMarkAllClientPaid}
                onDeleteOrder=${handleDeleteOrder}
                onMarkAllNotifsRead=${handleMarkAllNotifsRead}
              />
            ` : null}

            ${view === "dashboard" && session?.role === "client" ? html`
              <${ClientDashboard}
                t=${t}
                session=${session}
                store=${store}
              />
            ` : null}
          </main>
        </div>
      </div>
    `;
  }

  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(html`<${App} />`);
})();
