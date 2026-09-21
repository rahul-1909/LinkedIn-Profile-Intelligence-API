/**
 * LinkedIn Profile Intelligence API - Frontend Client
 * Developed by Rahul (rahul-1909)
 */

const API_BASE = window.location.origin.replace(/\/$/, "");
const STORAGE_LI_AT = "lpi_custom_li_at";
const STORAGE_JSESSIONID = "lpi_custom_jsessionid";

let currentProfile = null;
let currentIntelligence = null;

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// DOM Element bindings
const els = {
  form: document.getElementById("search-form"),
  input: document.getElementById("url-input"),
  submitBtn: document.getElementById("submit-btn"),
  btnText: document.getElementById("btn-text"),
  btnSpinner: document.getElementById("btn-spinner"),
  errorAlert: document.getElementById("error-alert"),
  welcomeFeatures: document.getElementById("welcome-features"),
  resultContainer: document.getElementById("result-container"),
  modePill: document.getElementById("mode-pill"),
  modeLabel: document.getElementById("mode-label"),

  // Profile Header Card
  cardCover: document.getElementById("card-cover"),
  cardAvatar: document.getElementById("card-avatar"),
  cardName: document.getElementById("card-name"),
  cardHeadline: document.getElementById("card-headline"),
  cardLocation: document.getElementById("card-location"),
  locText: document.getElementById("loc-text"),
  cardLinkedinLink: document.getElementById("card-linkedin-link"),

  // Intelligence Metrics
  statScore: document.getElementById("stat-score"),
  statExperience: document.getElementById("stat-experience"),
  statSeniority: document.getElementById("stat-seniority"),
  statTenure: document.getElementById("stat-tenure"),
  recruiterPitchText: document.getElementById("recruiter-pitch-text"),

  // Sections
  sectionAbout: document.getElementById("section-about"),
  cardSummary: document.getElementById("card-summary"),
  summaryToggle: document.getElementById("summary-toggle"),
  positionsList: document.getElementById("positions-list"),
  educationsList: document.getElementById("educations-list"),
  skillsCloud: document.getElementById("skills-cloud"),
  sectionCerts: document.getElementById("section-certs"),
  certsList: document.getElementById("certs-list"),
  sectionLanguages: document.getElementById("section-languages"),
  languagesList: document.getElementById("languages-list"),
  sectionMedia: document.getElementById("section-media"),
  mediaList: document.getElementById("media-list"),

  // Tabs & Panes
  tabOverview: document.getElementById("tab-overview"),
  tabIntel: document.getElementById("tab-intel"),
  tabJson: document.getElementById("tab-json"),
  tabCode: document.getElementById("tab-code"),
  paneOverview: document.getElementById("pane-overview"),
  paneIntel: document.getElementById("pane-intel"),
  paneJson: document.getElementById("pane-json"),
  paneCode: document.getElementById("pane-code"),

  // Intel Tab
  tipsList: document.getElementById("tips-list"),
  skillCategoriesContainer: document.getElementById("skill-categories-container"),

  // JSON Tab
  jsonViewer: document.getElementById("json-viewer"),
  btnCopyJson: document.getElementById("btn-copy-json"),
  btnCopyJsonTab: document.getElementById("btn-copy-json-tab"),
  btnExportMd: document.getElementById("btn-export-md"),
  btnDownloadJson: document.getElementById("btn-download-json"),

  // Code Tab
  codeCurl: document.getElementById("code-curl"),
  codePython: document.getElementById("code-python"),
  codeJs: document.getElementById("code-js"),

  // Settings Modal
  settingsModal: document.getElementById("settings-modal"),
  openSettingsBtn: document.getElementById("open-settings-btn"),
  closeSettingsBtn: document.getElementById("close-settings-btn"),
  inputLiAt: document.getElementById("input-li-at"),
  inputJsessionid: document.getElementById("input-jsessionid"),
  btnSaveCreds: document.getElementById("btn-save-creds"),
  btnClearCreds: document.getElementById("btn-clear-creds"),
};

// Utilities
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateRange(range) {
  if (!range) return "";
  const startYear = range.start_year;
  const startMonth = range.start_month ? MONTH_NAMES[range.start_month] : "";
  const start = [startMonth, startYear].filter(Boolean).join(" ");
  if (!start) return "";

  if (range.is_current) {
    return `${start} – Present`;
  }
  const endYear = range.end_year;
  const endMonth = range.end_month ? MONTH_NAMES[range.end_month] : "";
  const end = [endMonth, endYear].filter(Boolean).join(" ");
  return end ? `${start} – ${end}` : start;
}

function getInitials(first, last) {
  const f = (first || "").trim().charAt(0);
  const l = (last || "").trim().charAt(0);
  return (f + l).toUpperCase() || "LI";
}

function getHeaders() {
  const headers = { Accept: "application/json" };
  const customLiAt = localStorage.getItem(STORAGE_LI_AT);
  const customJsessionid = localStorage.getItem(STORAGE_JSESSIONID);
  if (customLiAt) headers["X-LinkedIn-Li-At"] = customLiAt;
  if (customJsessionid) headers["X-LinkedIn-JSessionID"] = customJsessionid;
  return headers;
}

// Check Backend Session Status
async function checkStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/session/status`);
    if (res.ok) {
      const data = await res.json();
      const customLiAt = localStorage.getItem(STORAGE_LI_AT);
      if (customLiAt) {
        els.modeLabel.textContent = "Custom Session Active";
        els.modePill.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200";
      } else if (data.configured) {
        els.modeLabel.textContent = "Live Voyager REST Connected";
        els.modePill.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200";
      } else {
        els.modeLabel.textContent = "Demo Sandbox Active";
        els.modePill.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200";
      }
    }
  } catch (err) {
    console.warn("Could not check status:", err);
  }
}

// Tab Switching
function switchTab(tabName) {
  const tabs = [
    { id: "overview", btn: els.tabOverview, pane: els.paneOverview },
    { id: "intel", btn: els.tabIntel, pane: els.paneIntel },
    { id: "json", btn: els.tabJson, pane: els.paneJson },
    { id: "code", btn: els.tabCode, pane: els.paneCode },
  ];

  tabs.forEach((t) => {
    if (t.id === tabName) {
      t.btn.className = "tab-btn px-4 py-2 text-sm font-bold border-b-2 border-brand-600 text-brand-600";
      t.pane.classList.remove("hidden");
    } else {
      t.btn.className = "tab-btn px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800";
      t.pane.classList.add("hidden");
    }
  });
}

els.tabOverview.onclick = () => switchTab("overview");
els.tabIntel.onclick = () => switchTab("intel");
els.tabJson.onclick = () => switchTab("json");
els.tabCode.onclick = () => switchTab("code");

// Render Functions
function renderProfile(profile, intelligence) {
  currentProfile = profile;
  currentIntelligence = intelligence;

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Professional";
  els.cardName.textContent = fullName;
  els.cardHeadline.textContent = profile.headline || "LinkedIn Member";

  // Cover image
  if (profile.cover_picture_url) {
    els.cardCover.style.backgroundImage = `url("${profile.cover_picture_url}")`;
  } else {
    els.cardCover.style.backgroundImage = "";
  }

  // Avatar
  els.cardAvatar.innerHTML = "";
  if (profile.profile_picture_url) {
    const img = document.createElement("img");
    img.src = profile.profile_picture_url;
    img.alt = fullName;
    img.className = "h-full w-full object-cover";
    img.onerror = () => {
      els.cardAvatar.textContent = getInitials(profile.first_name, profile.last_name);
    };
    els.cardAvatar.appendChild(img);
  } else {
    els.cardAvatar.textContent = getInitials(profile.first_name, profile.last_name);
  }

  // Location
  const locDisplay = profile.location?.display;
  if (locDisplay) {
    els.locText.textContent = locDisplay;
    els.cardLocation.classList.remove("hidden");
  } else {
    els.cardLocation.classList.add("hidden");
  }

  // Profile URL
  if (profile.profile_url) {
    els.cardLinkedinLink.href = profile.profile_url;
    els.cardLinkedinLink.classList.remove("hidden");
  } else {
    els.cardLinkedinLink.classList.add("hidden");
  }

  // Intelligence Metrics Bar
  if (intelligence) {
    els.statScore.textContent = `${intelligence.completeness_score}% (${intelligence.profile_strength})`;
    els.statExperience.textContent = `${intelligence.career_metrics.total_experience_years} yrs`;
    els.statSeniority.textContent = intelligence.career_metrics.seniority_level;
    els.statTenure.textContent = `${intelligence.career_metrics.average_tenure_years} yrs avg`;
    els.recruiterPitchText.textContent = intelligence.recruiter_pitch;

    // Render Tips
    els.tipsList.innerHTML = intelligence.optimization_suggestions.map(
      (tip) => `<div class="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl"><span class="text-amber-500 font-bold">💡</span><span>${escapeHtml(tip)}</span></div>`
    ).join("") || `<p class="text-xs text-emerald-600 font-semibold">🎉 Outstanding profile! No critical optimization recommendations.</p>`;

    // Render Skill Clusters
    els.skillCategoriesContainer.innerHTML = intelligence.skill_categories.map(
      (cat) => `
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-800">${escapeHtml(cat.category)}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">${cat.count}</span>
          </div>
          <div class="flex flex-wrap gap-1">
            ${cat.skills.map((s) => `<span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-medium text-slate-700">${escapeHtml(s)}</span>`).join("")}
          </div>
        </div>
      `
    ).join("") || `<p class="text-xs text-slate-400">No skill categories available.</p>`;
  }

  // Summary / About
  if (profile.summary && profile.summary.trim()) {
    els.cardSummary.textContent = profile.summary;
    els.sectionAbout.classList.remove("hidden");
    els.summaryToggle.classList.toggle("hidden", profile.summary.length < 250);
  } else {
    els.sectionAbout.classList.add("hidden");
  }

  // Work Experience
  if (profile.positions && profile.positions.length) {
    els.positionsList.innerHTML = profile.positions.map((p) => {
      const dates = formatDateRange(p.date_range);
      const meta = [dates, p.location, p.employment_type].filter(Boolean).join(" · ");
      const desc = p.description ? `<p class="mt-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">${escapeHtml(p.description)}</p>` : "";
      return `
        <div class="relative">
          <span class="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-brand-600 ring-4 ring-blue-50"></span>
          <h4 class="text-sm font-bold text-slate-900">${escapeHtml(p.title || "Role")}</h4>
          <p class="text-xs font-semibold text-brand-600">${escapeHtml(p.company_name || "")}</p>
          ${meta ? `<p class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(meta)}</p>` : ""}
          ${desc}
        </div>
      `;
    }).join("");
  } else {
    els.positionsList.innerHTML = `<p class="text-xs text-slate-400">No positions listed.</p>`;
  }

  // Education
  if (profile.educations && profile.educations.length) {
    els.educationsList.innerHTML = profile.educations.map((e) => {
      const degree = [e.degree_name, e.field_of_study].filter(Boolean).join(", ");
      const dates = formatDateRange(e.date_range);
      const meta = [dates, e.grade ? `Grade: ${e.grade}` : ""].filter(Boolean).join(" · ");
      return `
        <div class="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
          <h4 class="text-sm font-bold text-slate-900">${escapeHtml(e.school_name || "Institution")}</h4>
          ${degree ? `<p class="text-xs font-medium text-slate-700 mt-0.5">${escapeHtml(degree)}</p>` : ""}
          ${meta ? `<p class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(meta)}</p>` : ""}
        </div>
      `;
    }).join("");
  } else {
    els.educationsList.innerHTML = `<p class="text-xs text-slate-400">No education entries listed.</p>`;
  }

  // Skills
  if (profile.skills && profile.skills.length) {
    els.skillsCloud.innerHTML = profile.skills.map((s) => (
      `<span class="px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-100 text-xs font-semibold text-brand-700">${escapeHtml(s.name)}</span>`
    )).join("");
  } else {
    els.skillsCloud.innerHTML = `<p class="text-xs text-slate-400">No skills listed.</p>`;
  }

  // Certifications
  if (profile.certifications && profile.certifications.length) {
    els.certsList.innerHTML = profile.certifications.map((c) => {
      const title = c.url
        ? `<a href="${escapeHtml(c.url)}" target="_blank" class="text-xs font-bold text-brand-600 hover:underline">${escapeHtml(c.name)} ↗</a>`
        : `<span class="text-xs font-bold text-slate-900">${escapeHtml(c.name)}</span>`;
      return `
        <div class="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
          ${title}
          ${c.authority ? `<p class="text-[11px] text-slate-500">${escapeHtml(c.authority)}</p>` : ""}
          ${c.issue_date ? `<p class="text-[10px] text-slate-400">Issued ${escapeHtml(c.issue_date)}</p>` : ""}
        </div>
      `;
    }).join("");
    els.sectionCerts.classList.remove("hidden");
  } else {
    els.sectionCerts.classList.add("hidden");
  }

  // Languages
  if (profile.languages && profile.languages.length) {
    els.languagesList.innerHTML = profile.languages.map((l) => (
      `<div class="text-xs bg-slate-50 rounded-lg p-2 flex items-center justify-between"><span class="font-bold text-slate-800">${escapeHtml(l.name)}</span><span class="text-slate-500 text-[11px]">${escapeHtml(l.proficiency || "")}</span></div>`
    )).join("");
    els.sectionLanguages.classList.remove("hidden");
  } else {
    els.sectionLanguages.classList.add("hidden");
  }

  // Media
  if (profile.treasury_media && profile.treasury_media.length) {
    els.mediaList.innerHTML = profile.treasury_media.map((m) => (
      `<a href="${escapeHtml(m.url || '#')}" target="_blank" class="block text-xs font-semibold text-brand-600 hover:underline bg-slate-50 p-2 rounded-lg border border-slate-100">${escapeHtml(m.title || m.url || "Featured Media")} ↗</a>`
    )).join("");
    els.sectionMedia.classList.remove("hidden");
  } else {
    els.sectionMedia.classList.add("hidden");
  }

  // Raw JSON
  const combinedPayload = { profile, intelligence };
  els.jsonViewer.textContent = JSON.stringify(combinedPayload, null, 2);

  // Code Snippets
  const slug = profile.public_identifier || "username";
  els.codeCurl.textContent = `curl "${API_BASE}/api/profile?url=${slug}" \\\n  -H "Accept: application/json"`;
  els.codePython.textContent = `import httpx\n\nresponse = httpx.get("${API_BASE}/api/profile", params={"url": "${slug}"})\nprofile = response.json()\nprint(profile["headline"])`;
  els.codeJs.textContent = `const res = await fetch("${API_BASE}/api/profile?url=${slug}");\nconst profile = await res.json();\nconsole.log(profile);`;

  // Display result
  els.welcomeFeatures.classList.add("hidden");
  els.resultContainer.classList.remove("hidden");
}

// Show/Hide Error
function showError(msg) {
  els.errorAlert.textContent = msg;
  els.errorAlert.classList.remove("hidden");
}

function hideError() {
  els.errorAlert.classList.add("hidden");
}

// Fetch Profile & Intelligence
async function fetchAll(urlOrSlug) {
  hideError();
  els.submitBtn.disabled = true;
  els.btnText.textContent = "Analyzing...";
  els.btnSpinner.classList.remove("hidden");

  try {
    const encoded = encodeURIComponent(urlOrSlug);
    const headers = getHeaders();

    const [profileRes, intelRes] = await Promise.all([
      fetch(`${API_BASE}/api/profile?url=${encoded}`, { headers }),
      fetch(`${API_BASE}/api/profile/intelligence?url=${encoded}`, { headers }),
    ]);

    if (!profileRes.ok) {
      let errBody = null;
      try { errBody = await profileRes.json(); } catch {}
      const msg = errBody?.detail || `API request failed (${profileRes.status})`;
      showError(msg);
      return;
    }

    const profile = await profileRes.json();
    const intelligence = intelRes.ok ? await intelRes.json() : null;

    renderProfile(profile, intelligence);
    switchTab("overview");
  } catch (err) {
    showError("Could not connect to the LinkedIn Profile Intelligence API server.");
  } finally {
    els.submitBtn.disabled = false;
    els.btnText.textContent = "Extract & Analyze";
    els.btnSpinner.classList.add("hidden");
  }
}

// Event Listeners
els.form.onsubmit = (e) => {
  e.preventDefault();
  const val = els.input.value.trim();
  if (!val) {
    showError("Please enter a LinkedIn profile URL or vanity slug.");
    return;
  }
  fetchAll(val);
};

// Summary toggle
els.summaryToggle.onclick = () => {
  const collapsed = els.cardSummary.classList.toggle("summary-collapsed");
  els.summaryToggle.textContent = collapsed ? "Show more" : "Show less";
};

// Quick demo buttons
document.querySelectorAll(".demo-btn").forEach((btn) => {
  btn.onclick = () => {
    const demo = btn.getAttribute("data-demo");
    els.input.value = demo;
    fetchAll(demo);
  };
});

// Copy JSON
async function copyJson() {
  if (!currentProfile) return;
  const payload = JSON.stringify({ profile: currentProfile, intelligence: currentIntelligence }, null, 2);
  await navigator.clipboard.writeText(payload);
  alert("Profile JSON copied to clipboard!");
}
els.btnCopyJson.onclick = copyJson;
els.btnCopyJsonTab.onclick = copyJson;

// Download JSON
els.btnDownloadJson.onclick = () => {
  if (!currentProfile) return;
  const payload = JSON.stringify({ profile: currentProfile, intelligence: currentIntelligence }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentProfile.public_identifier || "profile"}_intelligence.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export Markdown
els.btnExportMd.onclick = () => {
  if (!currentProfile) return;
  const p = currentProfile;
  const i = currentIntelligence;
  const md = `# ${p.first_name} ${p.last_name}
**${p.headline || ""}**
*Location:* ${p.location?.display || "N/A"} | *LinkedIn:* ${p.profile_url || ""}

## Recruiter Briefing
> ${i?.recruiter_pitch || ""}

## Career Metrics
- **Seniority:** ${i?.career_metrics.seniority_level || "N/A"}
- **Total Experience:** ${i?.career_metrics.total_experience_years || 0} years
- **Average Tenure:** ${i?.career_metrics.average_tenure_years || 0} years / role
- **Profile Completeness:** ${i?.completeness_score || 0}%

## Summary
${p.summary || "N/A"}

## Experience
${p.positions.map((pos) => `### ${pos.title} @ ${pos.company_name}
${formatDateRange(pos.date_range)} | ${pos.location || ""}
${pos.description || ""}`).join("\n\n")}

## Education
${p.educations.map((edu) => `- **${edu.school_name}**: ${[edu.degree_name, edu.field_of_study].filter(Boolean).join(", ")} (${formatDateRange(edu.date_range)})`).join("\n")}

## Top Skills
${p.skills.map((s) => s.name).join(", ")}
`;

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${p.public_identifier || "profile"}_resume.md`;
  a.click();
  URL.revokeObjectURL(url);
};

// Settings Modal Handlers
els.openSettingsBtn.onclick = () => {
  els.inputLiAt.value = localStorage.getItem(STORAGE_LI_AT) || "";
  els.inputJsessionid.value = localStorage.getItem(STORAGE_JSESSIONID) || "";
  els.settingsModal.classList.remove("hidden");
};

els.closeSettingsBtn.onclick = () => {
  els.settingsModal.classList.add("hidden");
};

els.btnSaveCreds.onclick = () => {
  const liAt = els.inputLiAt.value.trim();
  const jsessionid = els.inputJsessionid.value.trim();
  if (liAt && jsessionid) {
    localStorage.setItem(STORAGE_LI_AT, liAt);
    localStorage.setItem(STORAGE_JSESSIONID, jsessionid);
    alert("Custom LinkedIn credentials saved locally in browser!");
  } else {
    localStorage.removeItem(STORAGE_LI_AT);
    localStorage.removeItem(STORAGE_JSESSIONID);
  }
  els.settingsModal.classList.add("hidden");
  checkStatus();
};

els.btnClearCreds.onclick = () => {
  localStorage.removeItem(STORAGE_LI_AT);
  localStorage.removeItem(STORAGE_JSESSIONID);
  els.inputLiAt.value = "";
  els.inputJsessionid.value = "";
  alert("Cleared custom credentials.");
  els.settingsModal.classList.add("hidden");
  checkStatus();
};

// Init
checkStatus();
