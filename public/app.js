/**
 * Profile Intelligence — Apple Liquid Glass UI
 * Author: Rahul (rahul-1909)
 */

const API_BASE = window.location.origin.replace(/\/$/, "");
const STORAGE_LI_AT = "apple_glass_li_at";
const STORAGE_JSESSIONID = "apple_glass_jsessionid";

let currentProfile = null;
let currentIntelligence = null;

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Elements
const els = {
  form: document.getElementById("search-form"),
  input: document.getElementById("url-input"),
  submitBtn: document.getElementById("submit-btn"),
  btnLabel: document.getElementById("btn-label"),
  btnSpinner: document.getElementById("btn-spinner"),
  errorBanner: document.getElementById("error-banner"),
  idleCards: document.getElementById("idle-cards"),
  resultView: document.getElementById("result-view"),
  modePill: document.getElementById("mode-pill"),
  modeText: document.getElementById("mode-text"),

  // Identity Header
  profileAvatar: document.getElementById("profile-avatar"),
  profileName: document.getElementById("profile-name"),
  profileSeniority: document.getElementById("profile-seniority"),
  profileLocation: document.getElementById("profile-location"),
  profileLink: document.getElementById("profile-link"),
  profileHeadline: document.getElementById("profile-headline"),

  // Action buttons
  btnCopy: document.getElementById("btn-copy"),
  btnDownload: document.getElementById("btn-download"),
  btnExportMd: document.getElementById("btn-export-md"),
  btnCopyTab: document.getElementById("btn-copy-tab"),

  // KPIs
  metricScore: document.getElementById("metric-score"),
  metricExperience: document.getElementById("metric-experience"),
  metricTenure: document.getElementById("metric-tenure"),
  metricStability: document.getElementById("metric-stability"),
  recruiterPitch: document.getElementById("recruiter-pitch"),

  // Segmented Tabs
  tabOverview: document.getElementById("tab-overview"),
  tabIntel: document.getElementById("tab-intel"),
  tabJson: document.getElementById("tab-json"),
  tabCode: document.getElementById("tab-code"),
  paneOverview: document.getElementById("pane-overview"),
  paneIntel: document.getElementById("pane-intel"),
  paneJson: document.getElementById("pane-json"),
  paneCode: document.getElementById("pane-code"),

  // Overview Pane
  sectionAbout: document.getElementById("section-about"),
  profileSummary: document.getElementById("profile-summary"),
  summaryToggle: document.getElementById("summary-toggle"),
  positionsContainer: document.getElementById("positions-container"),
  educationsContainer: document.getElementById("educations-container"),
  skillsTotal: document.getElementById("skills-total"),
  skillsCloud: document.getElementById("skills-cloud"),
  sectionCerts: document.getElementById("section-certs"),
  certsContainer: document.getElementById("certs-container"),
  sectionLanguages: document.getElementById("section-languages"),
  languagesContainer: document.getElementById("languages-container"),

  // Intelligence Pane
  tipsContainer: document.getElementById("tips-container"),
  clustersContainer: document.getElementById("clusters-container"),

  // JSON & Code
  jsonBox: document.getElementById("json-box"),
  codeCurl: document.getElementById("code-curl"),
  codePython: document.getElementById("code-python"),
  codeJs: document.getElementById("code-js"),

  // Session Modal
  modalSession: document.getElementById("modal-session"),
  btnSession: document.getElementById("btn-session"),
  btnCloseModal: document.getElementById("btn-close-modal"),
  inputLiAt: document.getElementById("input-li-at"),
  inputJsessionid: document.getElementById("input-jsessionid"),
  btnSaveSession: document.getElementById("btn-save-session"),
  btnClearSession: document.getElementById("btn-clear-session"),
};

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
  const start = [MONTH_NAMES[range.start_month], range.start_year].filter(Boolean).join(" ");
  if (!start) return "";
  if (range.is_current) return `${start} – Present`;
  const end = [MONTH_NAMES[range.end_month], range.end_year].filter(Boolean).join(" ");
  return end ? `${start} – ${end}` : start;
}

function getInitials(first, last) {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  return (a + b).toUpperCase() || "LI";
}

function getHeaders() {
  const headers = { Accept: "application/json" };
  const customLiAt = localStorage.getItem(STORAGE_LI_AT);
  const customJsessionid = localStorage.getItem(STORAGE_JSESSIONID);
  if (customLiAt) headers["X-LinkedIn-Li-At"] = customLiAt;
  if (customJsessionid) headers["X-LinkedIn-JSessionID"] = customJsessionid;
  return headers;
}

async function checkServerStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/session/status`);
    if (res.ok) {
      const data = await res.json();
      const customLiAt = localStorage.getItem(STORAGE_LI_AT);
      if (customLiAt) {
        els.modeText.textContent = "Custom Session";
        els.modePill.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-700 font-medium";
      } else if (data.configured) {
        els.modeText.textContent = "Live Voyager";
        els.modePill.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-medium";
      } else {
        els.modeText.textContent = "Sandbox Active";
        els.modePill.className = "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 font-medium";
      }
    }
  } catch (err) {
    console.warn("Status check failed:", err);
  }
}

// Apple Segmented Switcher
function switchTab(target) {
  const tabs = [
    { key: "overview", btn: els.tabOverview, pane: els.paneOverview },
    { key: "intel", btn: els.tabIntel, pane: els.paneIntel },
    { key: "json", btn: els.tabJson, pane: els.paneJson },
    { key: "code", btn: els.tabCode, pane: els.paneCode },
  ];

  tabs.forEach((t) => {
    if (t.key === target) {
      t.btn.classList.add("active");
      t.pane.classList.remove("hidden");
    } else {
      t.btn.classList.remove("active");
      t.pane.classList.add("hidden");
    }
  });
}

els.tabOverview.onclick = () => switchTab("overview");
els.tabIntel.onclick = () => switchTab("intel");
els.tabJson.onclick = () => switchTab("json");
els.tabCode.onclick = () => switchTab("code");

// Render
function renderProfile(profile, intelligence) {
  currentProfile = profile;
  currentIntelligence = intelligence;

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Candidate";
  els.profileName.textContent = fullName;
  els.profileHeadline.textContent = profile.headline || "LinkedIn Member";

  // Avatar
  els.profileAvatar.innerHTML = "";
  if (profile.profile_picture_url) {
    const img = document.createElement("img");
    img.src = profile.profile_picture_url;
    img.alt = fullName;
    img.className = "h-full w-full object-cover";
    img.onerror = () => {
      els.profileAvatar.textContent = getInitials(profile.first_name, profile.last_name);
    };
    els.profileAvatar.appendChild(img);
  } else {
    els.profileAvatar.textContent = getInitials(profile.first_name, profile.last_name);
  }

  // Location
  if (profile.location?.display) {
    els.profileLocation.innerHTML = `<span>📍</span> ${escapeHtml(profile.location.display)}`;
    els.profileLocation.classList.remove("hidden");
  } else {
    els.profileLocation.classList.add("hidden");
  }

  // LinkedIn link
  if (profile.profile_url) {
    els.profileLink.href = profile.profile_url;
    els.profileLink.classList.remove("hidden");
  } else {
    els.profileLink.classList.add("hidden");
  }

  // Intelligence KPIs
  if (intelligence) {
    const m = intelligence.career_metrics;
    els.profileSeniority.textContent = m.seniority_level;
    els.metricScore.textContent = `${intelligence.completeness_score}%`;
    els.metricExperience.textContent = `${m.total_experience_years} yrs`;
    els.metricTenure.textContent = `${m.average_tenure_years} yrs`;
    els.metricStability.textContent = m.stability_index;
    els.recruiterPitch.textContent = intelligence.recruiter_pitch;

    // Tips
    els.tipsContainer.innerHTML = intelligence.optimization_suggestions.map(
      (tip) => `
        <div class="liquid-glass-subtle p-3 rounded-2xl text-xs text-slate-700 flex items-start gap-2.5">
          <span class="text-apple-blue font-bold">✓</span>
          <span>${escapeHtml(tip)}</span>
        </div>
      `
    ).join("") || `<p class="text-xs text-emerald-600 font-medium">All core profile fields are complete.</p>`;

    // Skill Clusters
    els.clustersContainer.innerHTML = intelligence.skill_categories.map(
      (cat) => `
        <div class="liquid-glass-subtle p-4 rounded-2xl space-y-2">
          <div class="flex items-center justify-between text-xs font-semibold text-apple-dark">
            <span>${escapeHtml(cat.category)}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full bg-black/5 text-slate-600">${cat.count}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${cat.skills.map((s) => `<span class="px-2.5 py-1 rounded-full bg-white text-[11px] font-medium text-slate-700 border border-black/5 shadow-sm">${escapeHtml(s)}</span>`).join("")}
          </div>
        </div>
      `
    ).join("") || `<p class="text-xs text-apple-gray">No skill groupings available.</p>`;
  }

  // Summary / About
  if (profile.summary && profile.summary.trim()) {
    els.profileSummary.textContent = profile.summary;
    els.sectionAbout.classList.remove("hidden");
    els.summaryToggle.classList.toggle("hidden", profile.summary.length < 240);
  } else {
    els.sectionAbout.classList.add("hidden");
  }

  // Experience
  if (profile.positions && profile.positions.length) {
    els.positionsContainer.innerHTML = profile.positions.map((p) => {
      const dates = formatDateRange(p.date_range);
      const meta = [dates, p.location, p.employment_type].filter(Boolean).join(" · ");
      const desc = p.description ? `<p class="mt-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">${escapeHtml(p.description)}</p>` : "";
      return `
        <div class="border-b border-black/5 pb-4 last:border-0 last:pb-0 space-y-0.5">
          <h4 class="text-sm font-semibold text-apple-dark">${escapeHtml(p.title || "Role")}</h4>
          <p class="text-xs font-medium text-apple-blue">${escapeHtml(p.company_name || "")}</p>
          ${meta ? `<p class="text-[11px] text-apple-gray">${escapeHtml(meta)}</p>` : ""}
          ${desc}
        </div>
      `;
    }).join("");
  } else {
    els.positionsContainer.innerHTML = `<p class="text-xs text-apple-gray">No positions listed.</p>`;
  }

  // Education
  if (profile.educations && profile.educations.length) {
    els.educationsContainer.innerHTML = profile.educations.map((e) => {
      const degree = [e.degree_name, e.field_of_study].filter(Boolean).join(", ");
      const dates = formatDateRange(e.date_range);
      return `
        <div class="border-b border-black/5 pb-2.5 last:border-0 last:pb-0 space-y-0.5">
          <h4 class="text-xs font-semibold text-apple-dark">${escapeHtml(e.school_name || "School")}</h4>
          ${degree ? `<p class="text-[11px] text-slate-700">${escapeHtml(degree)}</p>` : ""}
          ${dates ? `<p class="text-[10px] text-apple-gray">${escapeHtml(dates)}</p>` : ""}
        </div>
      `;
    }).join("");
  } else {
    els.educationsContainer.innerHTML = `<p class="text-xs text-apple-gray">No education listed.</p>`;
  }

  // Skills Cloud
  if (profile.skills && profile.skills.length) {
    els.skillsTotal.textContent = `${profile.skills_total || profile.skills.length} total`;
    els.skillsCloud.innerHTML = profile.skills.map((s) => (
      `<span class="px-2.5 py-1 rounded-full bg-white/90 text-xs font-medium text-slate-700 border border-black/5 shadow-sm">${escapeHtml(s.name)}</span>`
    )).join("");
  } else {
    els.skillsTotal.textContent = "";
    els.skillsCloud.innerHTML = `<p class="text-xs text-apple-gray">No skills listed.</p>`;
  }

  // Certifications
  if (profile.certifications && profile.certifications.length) {
    els.certsContainer.innerHTML = profile.certifications.map((c) => {
      const title = c.url
        ? `<a href="${escapeHtml(c.url)}" target="_blank" class="font-medium text-apple-blue hover:underline">${escapeHtml(c.name)} ↗</a>`
        : `<span class="font-medium text-slate-800">${escapeHtml(c.name)}</span>`;
      return `
        <div class="border-b border-black/5 pb-2 last:border-0 last:pb-0">
          ${title}
          ${c.authority ? `<p class="text-[11px] text-apple-gray">${escapeHtml(c.authority)}</p>` : ""}
        </div>
      `;
    }).join("");
    els.sectionCerts.classList.remove("hidden");
  } else {
    els.sectionCerts.classList.add("hidden");
  }

  // Languages
  if (profile.languages && profile.languages.length) {
    els.languagesContainer.innerHTML = profile.languages.map((l) => (
      `<div class="flex items-center justify-between text-xs py-1 border-b border-black/5 last:border-0"><span class="font-medium text-slate-800">${escapeHtml(l.name)}</span><span class="text-apple-gray text-[11px]">${escapeHtml(l.proficiency || "")}</span></div>`
    )).join("");
    els.sectionLanguages.classList.remove("hidden");
  } else {
    els.sectionLanguages.classList.add("hidden");
  }

  // Raw JSON
  els.jsonBox.textContent = JSON.stringify({ profile, intelligence }, null, 2);

  // Snippets
  const slug = profile.public_identifier || "username";
  els.codeCurl.textContent = `curl "${API_BASE}/api/profile?url=${slug}"`;
  els.codePython.textContent = `import httpx\n\nres = httpx.get("${API_BASE}/api/profile", params={"url": "${slug}"})\nprofile = res.json()\nprint(profile["headline"])`;
  els.codeJs.textContent = `const res = await fetch("${API_BASE}/api/profile?url=${slug}");\nconst data = await res.json();\nconsole.log(data);`;

  // Toggle Visibility
  els.idleCards.classList.add("hidden");
  els.resultView.classList.remove("hidden");
}

function showError(msg) {
  els.errorBanner.textContent = msg;
  els.errorBanner.classList.remove("hidden");
}

function hideError() {
  els.errorBanner.classList.add("hidden");
}

async function fetchProfile(urlOrSlug) {
  hideError();
  els.submitBtn.disabled = true;
  els.btnLabel.textContent = "Analyzing…";
  els.btnSpinner.classList.remove("hidden");

  try {
    const encoded = encodeURIComponent(urlOrSlug);
    const headers = getHeaders();

    const [profileRes, intelRes] = await Promise.all([
      fetch(`${API_BASE}/api/profile?url=${encoded}`, { headers }),
      fetch(`${API_BASE}/api/profile/intelligence?url=${encoded}`, { headers }),
    ]);

    if (!profileRes.ok) {
      let err = null;
      try { err = await profileRes.json(); } catch {}
      showError(err?.detail || `Request failed (${profileRes.status})`);
      return;
    }

    const profile = await profileRes.json();
    const intelligence = intelRes.ok ? await intelRes.json() : null;

    renderProfile(profile, intelligence);
    switchTab("overview");
  } catch (err) {
    showError("Could not connect to the Profile Intelligence service.");
  } finally {
    els.submitBtn.disabled = false;
    els.btnLabel.textContent = "Analyze";
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
  fetchProfile(val);
};

// Summary toggle
els.summaryToggle.onclick = () => {
  const isCollapsed = els.profileSummary.classList.toggle("summary-clamp");
  els.summaryToggle.textContent = isCollapsed ? "Show more" : "Show less";
};

// Demo Chips
document.querySelectorAll(".demo-chip").forEach((btn) => {
  btn.onclick = () => {
    const slug = btn.getAttribute("data-demo");
    els.input.value = slug;
    fetchProfile(slug);
  };
});

// Copy JSON
async function copyJson() {
  if (!currentProfile) return;
  const payload = JSON.stringify({ profile: currentProfile, intelligence: currentIntelligence }, null, 2);
  await navigator.clipboard.writeText(payload);
  alert("Profile JSON copied to clipboard!");
}
els.btnCopy.onclick = copyJson;
els.btnCopyTab.onclick = copyJson;

// Download JSON
els.btnDownload.onclick = () => {
  if (!currentProfile) return;
  const payload = JSON.stringify({ profile: currentProfile, intelligence: currentIntelligence }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentProfile.public_identifier || "profile"}_data.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export Markdown CV
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
- **Completeness Score:** ${i?.completeness_score || 0}%

## About
${p.summary || "N/A"}

## Experience
${p.positions.map((pos) => `### ${pos.title} @ ${pos.company_name}
${formatDateRange(pos.date_range)} | ${pos.location || ""}
${pos.description || ""}`).join("\n\n")}

## Education
${p.educations.map((edu) => `- **${edu.school_name}**: ${[edu.degree_name, edu.field_of_study].filter(Boolean).join(", ")} (${formatDateRange(edu.date_range)})`).join("\n")}

## Skills
${p.skills.map((s) => s.name).join(", ")}
`;

  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${p.public_identifier || "profile"}_cv.md`;
  a.click();
  URL.revokeObjectURL(url);
};

// Modal Handlers
els.btnSession.onclick = () => {
  els.inputLiAt.value = localStorage.getItem(STORAGE_LI_AT) || "";
  els.inputJsessionid.value = localStorage.getItem(STORAGE_JSESSIONID) || "";
  els.modalSession.classList.remove("hidden");
};

els.btnCloseModal.onclick = () => {
  els.modalSession.classList.add("hidden");
};

els.btnSaveSession.onclick = () => {
  const liAt = els.inputLiAt.value.trim();
  const jsessionid = els.inputJsessionid.value.trim();
  if (liAt && jsessionid) {
    localStorage.setItem(STORAGE_LI_AT, liAt);
    localStorage.setItem(STORAGE_JSESSIONID, jsessionid);
    alert("Session cookies saved locally in your browser!");
  } else {
    localStorage.removeItem(STORAGE_LI_AT);
    localStorage.removeItem(STORAGE_JSESSIONID);
  }
  els.modalSession.classList.add("hidden");
  checkServerStatus();
};

els.btnClearSession.onclick = () => {
  localStorage.removeItem(STORAGE_LI_AT);
  localStorage.removeItem(STORAGE_JSESSIONID);
  els.inputLiAt.value = "";
  els.inputJsessionid.value = "";
  alert("Cleared custom cookies.");
  els.modalSession.classList.add("hidden");
  checkServerStatus();
};

// Init
checkServerStatus();
