(() => {
  const localizedContent = window.PORTFOLIO;
  if (!localizedContent?.fr || !localizedContent?.en) return;

  let locale = localStorage.getItem("portfolio-language") === "en" ? "en" : "fr";
  let data = localizedContent[locale];

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
  const tags = (items) => items.map((item) => `<span class="terminal-tag">${escapeHTML(item)}</span>`).join("");
  const chips = (items) => items.map((item) => `<span class="chip">${escapeHTML(item)}</span>`).join("");

  const fileGrid = $("#file-grid");
  const windowLayer = $("#window-layer");
  const osView = $("#os-view");
  const webView = $("#web-view");
  const toast = $("#toast");
  let activeFile = null;
  let activeView = "os";
  let windowLevel = 10;
  let dragState = null;
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
  };

  const renderFiles = () => {
    fileGrid.innerHTML = data.files.map((file) => `
      <button class="file-button${file.id === activeFile ? " is-active" : ""}" type="button" data-file="${escapeHTML(file.id)}" data-tone="${escapeHTML(file.tone)}" aria-pressed="${file.id === activeFile}">
        <span class="file-icon" aria-hidden="true">${escapeHTML(file.icon)}</span>
        <span class="file-name">${escapeHTML(file.name)}</span>
        <span class="file-subtitle">${escapeHTML(file.subtitle)}</span>
      </button>`).join("");
  };

  const profileTemplate = () => `
    <p class="terminal-line">[SYSINFO] ${escapeHTML(data.ui.sysTarget)}: ${escapeHTML(data.profile.availability)}</p>
    <h2>${escapeHTML(data.profile.name)}</h2>
    <p class="lead">${escapeHTML(data.profile.degree)}</p>
    <h3>&gt; ${escapeHTML(data.ui.identityJourney)}</h3>
    <p>${escapeHTML(data.profile.summary)} ${escapeHTML(data.ui.formerExperience)}</p>
    <div class="data-panel">
      <div><span>${escapeHTML(data.ui.locationLabel)}:</span><strong>${escapeHTML(data.profile.location)}</strong></div>
      <div><span>GPA UFPE:</span><strong>${escapeHTML(data.profile.gpa)}</strong></div>
      <div><span>${escapeHTML(data.ui.languagesLabel)}:</span><strong>${escapeHTML(data.profile.languages.join(" · "))}</strong></div>
      <div><span>${escapeHTML(data.ui.statusLabel)}:</span><strong>${escapeHTML(data.ui.openToOpportunities)}</strong></div>
    </div>`;

  const workTemplate = () => `
    <p class="terminal-line">$ history --production --sort=impact</p>
    <div class="history-list">
      ${data.experience.map((item) => `<section class="history-item"><header><h2>${escapeHTML(item.company)}</h2><small>${escapeHTML(item.type)}</small></header><p>${escapeHTML(item.description)}</p><div class="metric-row">${tags(item.metrics)}</div></section>`).join("")}
    </div>`;

  const researchTemplate = () => `
    <p class="terminal-line">$ ml-runtime inspect --focus=nlp</p>
    <h2>${escapeHTML(data.ui.researchTitle)}</h2>
    <p class="lead">${escapeHTML(data.ui.researchLead)}</p>
    <h3>&gt; ${escapeHTML(data.ui.workflow)}</h3>
    <div class="data-panel">
      <div><span>01 / ${escapeHTML(data.ui.dataLabel)}:</span><strong>${escapeHTML(data.ui.preparationQuality)}</strong></div>
      <div><span>02 / ${escapeHTML(data.ui.modelsLabel)}:</span><strong>BERT · PYTORCH</strong></div>
      <div><span>03 / ${escapeHTML(data.ui.evaluationLabel)}:</span><strong>SCIKIT-LEARN</strong></div>
      <div><span>04 / ${escapeHTML(data.ui.targetLabel)}:</span><strong>${escapeHTML(data.ui.production)}</strong></div>
    </div>
    <h3>&gt; ${escapeHTML(data.ui.toolsLabel)}</h3><div class="tag-row">${tags(["Python", "PyTorch", "BERT", "scikit-learn", "NLP", "Classification"])}</div>`;

  const stackTemplate = () => `
    <p class="terminal-line">$ stack-matrix --resolve --production</p>
    <h2>${escapeHTML(data.ui.stackTitle)}</h2>
    <p class="lead">${escapeHTML(data.ui.stackLead)}</p>
    ${data.expertise.map((item) => `<h3>&gt; ${escapeHTML(item.index)} / ${escapeHTML(item.title.toUpperCase())}</h3><p>${escapeHTML(item.copy)}</p><div class="tag-row">${tags(item.tools)}</div>`).join("")}`;

  const contactTemplate = () => `
    <p class="terminal-line">$ connect marcelo --channel=direct</p>
    <h2>${escapeHTML(data.ui.contactTitle)}</h2>
    <p class="lead">${escapeHTML(data.ui.contactLead)}</p>
    <div class="contact-terminal">
      <a href="mailto:${escapeHTML(data.profile.email)}"><span>EMAIL</span><strong>${escapeHTML(data.profile.email)}</strong></a>
      <a href="${escapeHTML(data.profile.linkedin)}" target="_blank" rel="noreferrer"><span>LINKEDIN</span><strong>${escapeHTML(data.ui.openArrow)}</strong></a>
      <a href="${escapeHTML(data.profile.github)}" target="_blank" rel="noreferrer"><span>GITHUB</span><strong>celobastos ↗</strong></a>
    </div>
    <h3>&gt; ${escapeHTML(data.ui.outsideTerminal)}</h3><div class="tag-row">${tags(data.interests)}</div>`;

  const templates = {
    profile: profileTemplate,
    work: workTemplate,
    research: researchTemplate,
    stack: stackTemplate,
    contact: contactTemplate
  };

  const updateActiveState = (fileId) => {
    activeFile = fileId;
    $$(".file-button").forEach((button) => {
      const selected = button.dataset.file === fileId;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    $$(".nav-item[data-open-file]").forEach((button) => button.classList.toggle("is-active", button.dataset.openFile === fileId));
  };

  const focusAppWindow = (windowElement) => {
    $$(".app-window", windowLayer).forEach((item) => item.classList.remove("is-focused"));
    windowLevel += 1;
    windowElement.style.zIndex = windowLevel;
    windowElement.classList.add("is-focused");
    updateActiveState(windowElement.dataset.windowId);
  };

  const buildWindow = (file) => {
    const openCount = $$(".app-window", windowLayer).length;
    const offset = (openCount % 5) * 38;
    const windowElement = document.createElement("article");
    windowElement.className = "app-window";
    windowElement.dataset.windowId = file.id;
    windowElement.setAttribute("aria-labelledby", `window-title-${file.id}`);
    windowElement.style.left = `${24 + offset}px`;
    windowElement.style.top = `${offset}px`;
    windowElement.innerHTML = `
      <header class="window-titlebar">
        <div class="window-controls" aria-label="${escapeHTML(data.ui.windowControls)} ${escapeHTML(file.name)}">
          <button class="window-control close" type="button" data-window-action="close" aria-label="${escapeHTML(data.ui.close)} ${escapeHTML(file.name)}"></button>
          <button class="window-control minimize" type="button" data-window-action="minimize" aria-label="${escapeHTML(data.ui.minimize)} ${escapeHTML(file.name)}"></button>
          <button class="window-control maximize" type="button" data-window-action="maximize" aria-label="${escapeHTML(data.ui.maximize)} ${escapeHTML(file.name)}"></button>
        </div>
        <h1 id="window-title-${escapeHTML(file.id)}">${escapeHTML(file.name)} — UTF-8</h1>
        <span class="window-state">${escapeHTML(data.ui.readOnly)}</span>
      </header>
      <div class="window-content">${templates[file.id]()}</div>`;
    windowLayer.append(windowElement);
    return windowElement;
  };

  const openFile = (fileId, scrollToWindows = false) => {
    const file = data.files.find((item) => item.id === fileId) || data.files[0];
    if (activeView !== "os") setView("os");
    let windowElement = $(`.app-window[data-window-id="${file.id}"]`, windowLayer);
    if (!windowElement) windowElement = buildWindow(file);
    windowElement.classList.remove("is-minimized");
    focusAppWindow(windowElement);
    if (scrollToWindows) {
      const isMobile = matchMedia("(max-width: 760px)").matches;
      const scrollTarget = isMobile ? windowElement : windowLayer;
      scrollTarget.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: isMobile ? "start" : "center"
      });
    }
  };

  const setView = (view) => {
    activeView = view === "web" ? "web" : "os";
    const isOS = activeView === "os";
    osView.hidden = !isOS;
    webView.hidden = isOS;
    $$(".mode-tab").forEach((tab) => {
      const selected = tab.dataset.view === activeView;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.body.dataset.view = activeView;
    if (!isOS) $$(".nav-item").forEach((button) => button.classList.remove("is-active"));
  };

  const renderWebView = () => {
    $("#impact-band").innerHTML = data.impacts.map((item) => `<div class="impact-card"><strong>${escapeHTML(item.value)}</strong><span>${escapeHTML(item.label)}</span></div>`).join("");
    $("#experience-list").innerHTML = data.experience.map((item) => `<article class="experience-row"><div><small>${escapeHTML(item.type)}</small><h3>${escapeHTML(item.company)}</h3></div><p>${escapeHTML(item.description)}</p><div class="chips">${chips(item.stack)}</div></article>`).join("");
    $("#expertise-grid").innerHTML = data.expertise.map((item) => `<article class="expertise-card"><span>${escapeHTML(item.index)} / ${escapeHTML(data.ui.module)}</span><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.copy)}</p><div class="chips">${chips(item.tools)}</div></article>`).join("");
    $("#education-grid").innerHTML = data.education.map((item) => `<article class="education-card"><small>${escapeHTML(item.location)}</small><h3>${escapeHTML(item.place)}</h3><p>${escapeHTML(item.degree)}</p><strong>${escapeHTML(item.detail)}</strong></article>`).join("");
  };

  const applyStaticTranslations = () => {
    document.documentElement.lang = locale;
    document.title = data.ui.documentTitle;
    $("meta[name='description']")?.setAttribute("content", data.ui.metaDescription);
    $$('[data-i18n]').forEach((element) => {
      const translation = data.ui[element.dataset.i18n];
      if (translation) element.textContent = translation;
    });
    $$('[data-i18n-html]').forEach((element) => {
      const translation = data.ui[element.dataset.i18nHtml];
      if (translation) element.innerHTML = translation;
    });

    $(".identity")?.setAttribute("aria-label", data.ui.identityLabel);
    $(".clock")?.setAttribute("aria-label", data.ui.clockLabel);
    $(".header-dock")?.setAttribute("aria-label", data.ui.dockLabel);
    $(".mode-tabs")?.setAttribute("aria-label", data.ui.viewModeLabel);
    $(".top-actions a[href*='github.com']")?.setAttribute("aria-label", data.ui.openGithub);
    $("#share-button")?.setAttribute("aria-label", data.ui.sharePortfolio);
    $("#profile-menu-button")?.setAttribute("aria-label", data.ui.openMenu);
    $(".telemetry")?.setAttribute("aria-label", data.ui.profileInfoLabel);
    fileGrid.setAttribute("aria-label", data.ui.fileExplorerLabel);
    windowLayer.setAttribute("aria-label", data.ui.openWindowsLabel);
    $("#impact-band")?.setAttribute("aria-label", data.ui.resultsLabel);
    windowLayer.style.setProperty("--empty-windows-message", JSON.stringify(data.ui.noWindows));

    const languageButton = $("#language-button");
    languageButton.setAttribute("aria-label", data.ui.switchLanguage);
    languageButton.setAttribute("title", data.ui.switchLanguage);
    $("#language-code").textContent = locale === "fr" ? "EN" : "FR";

    $$(".cv-request-link").forEach((link) => {
      const fileName = `marcelo-bastos-cv-${locale}.pdf`;
      link.href = `assets/cv/${fileName}`;
      link.download = fileName;
    });
  };

  const refreshOpenWindows = () => {
    $$(".app-window", windowLayer).forEach((windowElement) => {
      const file = data.files.find((item) => item.id === windowElement.dataset.windowId);
      if (!file || !templates[file.id]) return;
      $(".window-controls", windowElement).setAttribute("aria-label", `${data.ui.windowControls} ${file.name}`);
      $(".window-control.close", windowElement).setAttribute("aria-label", `${data.ui.close} ${file.name}`);
      $(".window-control.minimize", windowElement).setAttribute("aria-label", `${data.ui.minimize} ${file.name}`);
      $(".window-control.maximize", windowElement).setAttribute("aria-label", `${data.ui.maximize} ${file.name}`);
      $(".window-titlebar h1", windowElement).textContent = `${file.name} — UTF-8`;
      $(".window-state", windowElement).textContent = data.ui.readOnly;
      $(".window-content", windowElement).innerHTML = templates[file.id]();
    });
  };

  const setLocale = (nextLocale) => {
    locale = nextLocale === "en" ? "en" : "fr";
    data = localizedContent[locale];
    localStorage.setItem("portfolio-language", locale);
    applyStaticTranslations();
    renderFiles();
    renderWebView();
    refreshOpenWindows();
    updateActiveState(activeFile);
    updateClock();
  };

  const updateClock = () => {
    const now = new Date();
    $("#clock-time").textContent = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
    $("#clock-zone").textContent = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop().replaceAll("_", " ").toUpperCase();
  };

  applyStaticTranslations();
  renderFiles();
  renderWebView();
  openFile("profile");
  updateClock();
  setInterval(updateClock, 1000);
  $("#year").textContent = new Date().getFullYear();

  $("#language-button").addEventListener("click", () => setLocale(locale === "fr" ? "en" : "fr"));

  document.addEventListener("click", (event) => {
    const fileButton = event.target.closest("[data-file]");
    const fileTrigger = event.target.closest("[data-open-file]");
    const viewTrigger = event.target.closest("[data-view]");
    const toggleTrigger = event.target.closest("[data-toggle-view]");
    if (fileButton) openFile(fileButton.dataset.file, true);
    if (fileTrigger) openFile(fileTrigger.dataset.openFile, true);
    if (viewTrigger) setView(viewTrigger.dataset.view);
    if (toggleTrigger) setView(activeView === "os" ? "web" : "os");
  });

  $(".mode-tabs").addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = activeView === "os" ? "web" : "os";
    setView(next);
    $(`.mode-tab[data-view="${next}"]`).focus();
  });

  windowLayer.addEventListener("click", (event) => {
    const control = event.target.closest("[data-window-action]");
    const windowElement = event.target.closest(".app-window");
    if (!windowElement) return;
    focusAppWindow(windowElement);
    if (!control) return;
    const action = control.dataset.windowAction;
    if (action === "close") {
      windowElement.remove();
      const remaining = $$(".app-window", windowLayer).sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));
      if (remaining[0]) focusAppWindow(remaining[0]);
      else updateActiveState(null);
    }
    if (action === "minimize") windowElement.classList.toggle("is-minimized");
    if (action === "maximize") {
      windowElement.classList.remove("is-minimized");
      windowElement.classList.toggle("is-maximized");
    }
  });

  windowLayer.addEventListener("pointerdown", (event) => {
    const titlebar = event.target.closest(".window-titlebar");
    const windowElement = event.target.closest(".app-window");
    if (!windowElement) return;
    focusAppWindow(windowElement);
    if (!titlebar || event.target.closest(".window-controls") || windowElement.classList.contains("is-maximized") || matchMedia("(max-width: 760px)").matches) return;
    const layerBounds = windowLayer.getBoundingClientRect();
    const windowBounds = windowElement.getBoundingClientRect();
    dragState = {
      windowElement,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: windowBounds.left - layerBounds.left,
      top: windowBounds.top - layerBounds.top
    };
    titlebar.setPointerCapture(event.pointerId);
  });

  windowLayer.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const maxLeft = Math.max(0, windowLayer.clientWidth - dragState.windowElement.offsetWidth);
    const maxTop = Math.max(0, windowLayer.clientHeight - 52);
    const nextLeft = Math.min(maxLeft, Math.max(0, dragState.left + event.clientX - dragState.startX));
    const nextTop = Math.min(maxTop, Math.max(0, dragState.top + event.clientY - dragState.startY));
    dragState.windowElement.style.left = `${nextLeft}px`;
    dragState.windowElement.style.top = `${nextTop}px`;
  });

  const stopDragging = () => { dragState = null; };
  windowLayer.addEventListener("pointerup", stopDragging);
  windowLayer.addEventListener("pointercancel", stopDragging);

  const profileMenuButton = $("#profile-menu-button");
  const profileMenu = $("#profile-menu");
  const setProfileMenu = (open) => {
    profileMenu.hidden = !open;
    profileMenuButton.setAttribute("aria-expanded", String(open));
  };
  profileMenuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setProfileMenu(profileMenuButton.getAttribute("aria-expanded") !== "true");
  });
  profileMenu.addEventListener("click", (event) => event.stopPropagation());
  document.addEventListener("click", () => setProfileMenu(false));

  $("#share-button").addEventListener("click", async () => {
    const shareData = { title: document.title, text: data.ui.shareText, url: location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(location.href);
        showToast(data.ui.linkCopied);
      }
    } catch (error) {
      if (error.name !== "AbortError") showToast(data.ui.copyAddress);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !profileMenu.hidden) {
      setProfileMenu(false);
      profileMenuButton.focus();
      return;
    }
  });
})();
