/**
 * IntelLens — LinkedIn Profile Intelligence Engine
 * Modern Cyber-Glass Client Logic
 * Author: Rahul (rahul-1909)
 */

const API_BASE = window.location.origin.replace(/\/$/, "");
const STORAGE_LI_AT = "intellens_custom_li_at";
const STORAGE_JSESSIONID = "intellens_custom_jsessionid";

let currentProfile = null;
let currentIntelligence = null;

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// DOM references
const els = {
  form: document.getElementById("profile-form"),
  input: document.getElementById("profile-query"),
  btnAnalyze: document.getElementById("btn-analyze"),
  analyzeLabel: document.getElementById("analyze-label"),
  analyzeSpinner: document.getElementById("analyze-spinner"),
  analyzeArrow: document.getElementById("analyze-arrow"),
  errorToast: document.getElementById("error-toast"),
  errorToastMsg: document.getElementById("error-toast-msg"),
  idleShowcase: document.getElementById("idle-showcase"),
  activeProfileView: document.getElementById("active-profile-view"),
  modeBadge: document.getElementById("mode-badge"),
  modeBadgeLabel: document.getElementById("mode-badge-label"),

  // Identity Header
  pCover: document.getElementById("p-cover"),
  pAvatar: document.getElementById("p-avatar"),
  pName: document.getElementById("p-name"),
  pSeniorityBadge: document.getElementById("p-seniority-badge"),
  pLocation: document.getElementById("p-location"),
  pLocationText: document.getElementById("p-location-text"),
  pLinkedinLink: document.getElementById("p-linkedin-link"),
  pHeadline: document.getElementById("p-headline"),

  // KPIs & AI Briefing
  kpiScore: document.getElementById("kpi-score"),
  kpiExperience: document.getElementById("kpi-experience"),
  kpiTenure: document.getElementById("kpi-tenure"),
  kpiStability: document.getElementById("kpi-stability"),
  pRecruiterBrief: document.getElementById("p-recruiter-brief"),

  // Actions
  btnCopyJson: document.getElementById("btn-action-copy-json"),
  btnExportMd: document.getElementById("btn-action-export-md"),
  btnDownloadJson: document.getElementById("btn-action-download-json"),
  btnCopyJsonTab: document.getElementById("btn-copy-json-tab"),

  // Tabs
  tabTimeline: document.getElementById("view-tab-timeline"),
  tabIntelligence: document.getElementById("view-tab-intelligence"),
  tabJson: document.getElementById("view-tab-json"),
  tabCode: document.getElementById("view-tab-code"),
  paneTimeline: document.getElementById("pane-timeline"),
  paneIntelligence: document.getElementById("pane-intelligence"),
  paneJson: document.getElementById("pane-json"),
  paneCode: document.getElementById("pane-code"),

  // Content Sections
  pSectionAbout: document.getElementById("p-section-about"),
  pSummary: document.getElementById("p-summary"),
  btnSummaryToggle: document.getElementById("btn-summary-toggle"),
  pPositionsContainer: document.getElementById("p-positions-container"),
  pEducationsContainer: document.getElementById("p-educations-container"),
  pSkillsCount: document.getElementById("p-skills-count"),
  pSkillsCloud: document.getElementById("p-skills-cloud"),
  pSectionCerts: document.getElementById("p-section-certs"),
  pCertsContainer: document.getElementById("p-certs-container"),
  pSectionLanguages: document.getElementById("p-section-languages"),
  pLanguagesContainer: document.getElementById("p-languages-container"),
  pSectionMedia: document.getElementById("p-section-media"),
  pMediaContainer: document.getElementById("p-media-container"),

  // Intelligence Pane
  pIntelTips: document.getElementById("p-intel-tips"),
  pIntelClusters: document.getElementById("p-intel-clusters"),

  // Code & Raw Display
  rawJsonDisplay: document.getElementById("raw-json-display"),
  snippetCurl: document.getElementById("snippet-curl"),
  snippetPython: document.getElementById("snippet-python"),
  snippetJs: document.getElementById("snippet-js"),

  // Credentials Modal
  modalCredentials: document.getElementById("modal-credentials"),
  btnOpenCredentials: document.getElementById("btn-open-credentials"),
  btnCloseModal: document.getElementById("btn-close-modal"),
  modalLiAt: document.getElementById("modal-li-at"),
  modalJsessionid: document.getElementById("modal-jsessionid"),
  btnSaveTokens: document.getElementById("btn-save-tokens"),
  btnClearTokens: document.getElementById("btn-clear-tokens"),
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

function getClientHeaders() {
  const headers = { Accept: "application/json" };
  const customLiAt = localStorage.getItem(STORAGE_LI_AT);
  const customJsessionid = localStorage.getItem(STORAGE_JSESSIONID);
  if (customLiAt) headers["X-LinkedIn-Li-At"] = customLiAt;
  if (customJsessionid) headers["X-LinkedIn-JSessionID"] = customJsessionid;
  return headers;
}

async function verifySessionMode() {
  try {
    const res = await fetch(`${API_BASE}/api/session/status`);
    if (res.ok) {
      const data = await res.json();
      const customLiAt = localStorage.getItem(STORAGE_LI_AT);
      if (customLiAt) {
        els.modeBadgeLabel.textContent = "CUSTOM LIVE SESSION ACTIVE";
        els.modeBadge.className = "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-cyan-500/10 text-neon-cyan border border-cyan-500/30";
      } else if (data.configured) {
        els.modeBadgeLabel.textContent = "LIVE VOYAGER CONNECTED";
        els.modeBadge.className = "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      } else {
        els.modeBadgeLabel.textContent = "SANDBOX DEMO MODE";
        els.modeBadge.className = "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30";
      }
    }
  } catch (err) {
    console.warn("Could not check server status:", err);
  }
}

// Tab Switching Mechanism
function switchView(tabKey) {
  const tabs = [
    { key: "timeline", btn: els.tabTimeline, pane: els.paneTimeline },
    { key: "intelligence", btn: els.tabIntelligence, pane: els.paneIntelligence },
    { key: "json", btn: els.tabJson, pane: els.paneJson },
    { key: "code", btn: els.tabCode, pane: els.paneCode },
  ];

  tabs.forEach((t) => {
    if (t.key === tabKey) {
      t.btn.className = "view-tab px-4 py-2.5 font-bold border-b-2 border-neon-cyan text-neon-cyan";
      t.pane.classList.remove("hidden");
    } else {
      t.btn.className = "view-tab px-4 py-2.5 font-semibold text-slate-400 hover:text-white";
      t.pane.classList.add("hidden");
    }
  });
}

els.tabTimeline.onclick = () => switchView("timeline");
els.tabIntelligence.onclick = () => switchView("intelligence");
els.tabJson.onclick = () => switchView("json");
els.tabCode.onclick = () => switchView("code");

// Main Render Function
function renderProfileData(profile, intelligence) {
  currentProfile = profile;
  currentIntelligence = intelligence;

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Candidate";
  els.pName.textContent = fullName;
  els.pHeadline.textContent = profile.headline || "LinkedIn Member";

  // Cover image
  if (profile.cover_picture_url) {
    els.pCover.style.backgroundImage = `url("${profile.cover_picture_url}")`;
  } else {
    els.pCover.style.backgroundImage = "";
  }

  // Avatar
  els.pAvatar.innerHTML = "";
  if (profile.profile_picture_url) {
    const img = document.createElement("img");
    img.src = profile.profile_picture_url;
    img.alt = fullName;
    img.className = "h-full w-full object-cover";
    img.onerror = () => {
      els.pAvatar.textContent = getInitials(profile.first_name, profile.last_name);
    };
    els.pAvatar.appendChild(img);
  } else {
    els.pAvatar.textContent = getInitials(profile.first_name, profile.last_name);
  }

  // Location
  if (profile.location?.display) {
    els.pLocationText.textContent = profile.location.display;
    els.pLocation.classList.remove("hidden");
  } else {
    els.pLocation.classList.add("hidden");
  }

  // LinkedIn link
  if (profile.profile_url) {
    els.pLinkedinLink.href = profile.profile_url;
    els.pLinkedinLink.classList.remove("hidden");
  } else {
    els.pLinkedinLink.classList.add("hidden");
  }

  // Intelligence Metrics & Telemetry
  if (intelligence) {
    const m = intelligence.career_metrics;
    els.pSeniorityBadge.textContent = m.seniority_level;
    els.kpiScore.textContent = `${intelligence.completeness_score}%`;
    els.kpiExperience.textContent = `${m.total_experience_years} yrs`;
    els.kpiTenure.textContent = `${m.average_tenure_years} yrs`;
    els.kpiStability.textContent = m.stability_index;
    els.pRecruiterBrief.textContent = intelligence.recruiter_pitch;

    // Render Tips
    els.pIntelTips.innerHTML = intelligence.optimization_suggestions.map(
      (tip) => `
        <div class="glass-panel p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs flex items-start gap-2.5">
          <span class="text-base leading-none">💡</span>
          <span>${escapeHtml(tip)}</span>
        </div>
      `
    ).join("") || `<p class="text-xs text-emerald-400 font-mono">Profile is optimized with highest telemetry fidelity!</p>`;

    // Render Skill Categories
    els.pIntelClusters.innerHTML = intelligence.skill_categories.map(
      (cat) => `
        <div class="glass-panel p-4 rounded-xl border-white/5 space-y-2">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="font-bold text-white">${escapeHtml(cat.category)}</span>
            <span class="px-2 py-0.5 rounded bg-space-950 text-neon-cyan border border-cyan-500/20">${cat.count}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${cat.skills.map((s) => `<span class="px-2 py-0.5 rounded bg-space-950/80 border border-white/5 text-[11px] text-slate-300 font-mono">${escapeHtml(s)}</span>`).join("")}
          </div>
        </div>
      `
    ).join("") || `<p class="text-xs text-slate-500 font-mono">No skills clusters computed.</p>`;
  }

  // Summary / Bio
  if (profile.summary && profile.summary.trim()) {
    els.pSummary.textContent = profile.summary;
    els.pSectionAbout.classList.remove("hidden");
    els.btnSummaryToggle.classList.toggle("hidden", profile.summary.length < 240);
  } else {
    els.pSectionAbout.classList.add("hidden");
  }

  // Work Experience
  if (profile.positions && profile.positions.length) {
    els.pPositionsContainer.innerHTML = profile.positions.map((p) => {
      const dates = formatDateRange(p.date_range);
      const meta = [dates, p.location, p.employment_type].filter(Boolean).join(" • ");
      const desc = p.description ? `<p class="mt-2.5 text-xs text-slate-400 whitespace-pre-line leading-relaxed font-sans">${escapeHtml(p.description)}</p>` : "";
      return `
        <div class="relative group">
          <span class="absolute -left-[35px] top-1.5 h-3.5 w-3.5 rounded-full bg-space-950 border-2 border-neon-cyan shadow-neon-cyan"></span>
          <div class="space-y-0.5">
            <h4 class="text-sm font-bold text-white">${escapeHtml(p.title || "Role")}</h4>
            <p class="text-xs font-semibold text-neon-cyan font-mono">${escapeHtml(p.company_name || "")}</p>
            ${meta ? `<p class="text-[11px] font-mono text-slate-400">${escapeHtml(meta)}</p>` : ""}
          </div>
          ${desc}
        </div>
      `;
    }).join("");
  } else {
    els.pPositionsContainer.innerHTML = `<p class="text-xs font-mono text-slate-500">No positions listed.</p>`;
  }

  // Education
  if (profile.educations && profile.educations.length) {
    els.pEducationsContainer.innerHTML = profile.educations.map((e) => {
      const degree = [e.degree_name, e.field_of_study].filter(Boolean).join(", ");
      const dates = formatDateRange(e.date_range);
      return `
        <div class="border-b border-white/5 pb-3 last:border-0 last:pb-0 space-y-1">
          <h4 class="text-sm font-bold text-white">${escapeHtml(e.school_name || "Institution")}</h4>
          ${degree ? `<p class="text-xs text-slate-300 font-mono">${escapeHtml(degree)}</p>` : ""}
          ${dates ? `<p class="text-[11px] font-mono text-slate-500">${escapeHtml(dates)}</p>` : ""}
        </div>
      `;
    }).join("");
  } else {
    els.pEducationsContainer.innerHTML = `<p class="text-xs font-mono text-slate-500">No education entries listed.</p>`;
  }

  // Skills Cloud
  if (profile.skills && profile.skills.length) {
    els.pSkillsCount.textContent = `${profile.skills_total || profile.skills.length} Skills`;
    els.pSkillsCloud.innerHTML = profile.skills.map((s) => (
      `<span class="px-2.5 py-1 rounded-lg glass-panel font-mono text-xs text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/50 transition">${escapeHtml(s.name)}</span>`
    )).join("");
  } else {
    els.pSkillsCount.textContent = "0 Skills";
    els.pSkillsCloud.innerHTML = `<p class="text-xs font-mono text-slate-500">No skills declared.</p>`;
  }

  // Certifications
  if (profile.certifications && profile.certifications.length) {
    els.pCertsContainer.innerHTML = profile.certifications.map((c) => {
      const title = c.url
        ? `<a href="${escapeHtml(c.url)}" target="_blank" class="text-xs font-bold text-neon-cyan hover:underline">${escapeHtml(c.name)} ↗</a>`
        : `<span class="text-xs font-bold text-white">${escapeHtml(c.name)}</span>`;
      return `
        <div class="border-b border-white/5 pb-2 last:border-0 last:pb-0 space-y-0.5">
          ${title}
          ${c.authority ? `<p class="text-[11px] text-slate-400">${escapeHtml(c.authority)}</p>` : ""}
          ${c.issue_date ? `<p class="text-[10px] text-slate-500">Issued ${escapeHtml(c.issue_date)}</p>` : ""}
        </div>
      `;
    }).join("");
    els.pSectionCerts.classList.remove("hidden");
  } else {
    els.pSectionCerts.classList.add("hidden");
  }

  // Languages
  if (profile.languages && profile.languages.length) {
    els.pLanguagesContainer.innerHTML = profile.languages.map((l) => (
      `<div class="glass-panel p-2.5 rounded-xl flex items-center justify-between font-mono"><span class="font-bold text-slate-200">${escapeHtml(l.name)}</span><span class="text-slate-400 text-[11px]">${escapeHtml(l.proficiency || "")}</span></div>`
    )).join("");
    els.pSectionLanguages.classList.remove("hidden");
  } else {
    els.pSectionLanguages.classList.add("hidden");
  }

  // Media
  if (profile.treasury_media && profile.treasury_media.length) {
    els.pMediaContainer.innerHTML = profile.treasury_media.map((m) => (
      `<a href="${escapeHtml(m.url || '#')}" target="_blank" class="block glass-panel p-2.5 rounded-xl font-mono text-xs text-neon-cyan hover:border-cyan-500/50 transition">${escapeHtml(m.title || m.url || "Media Item")} ↗</a>`
    )).join("");
    els.pSectionMedia.classList.remove("hidden");
  } else {
    els.pSectionMedia.classList.add("hidden");
  }

  // Raw JSON
  els.rawJsonDisplay.textContent = JSON.stringify({ profile, intelligence }, null, 2);

  // Snippets
  const slug = profile.public_identifier || "username";
  els.snippetCurl.textContent = `curl "${API_BASE}/api/profile?url=${slug}" \\\n  -H "Accept: application/json"`;
  els.snippetPython.textContent = `import httpx\n\nwith httpx.Client() as client:\n    res = client.get("${API_BASE}/api/profile", params={"url": "${slug}"})\n    profile = res.json()\n    print(profile["first_name"], profile["headline"])`;
  els.snippetJs.textContent = `const res = await fetch("${API_BASE}/api/profile?url=${slug}");\nconst { first_name, headline } = await res.json();\nconsole.log(first_name, headline);`;

  // Toggle Visibility
  els.idleShowcase.classList.add("hidden");
  els.activeProfileView.classList.remove("hidden");
}

function showError(msg) {
  els.errorToastMsg.textContent = msg;
  els.errorToast.classList.remove("hidden");
}

function hideError() {
  els.errorToast.classList.add("hidden");
}

async function executeProfileLookup(urlOrSlug) {
  hideError();
  els.btnAnalyze.disabled = true;
  els.analyzeLabel.textContent = "Querying Voyager...";
  els.analyzeSpinner.classList.remove("hidden");
  els.analyzeArrow.classList.add("hidden");

  try {
    const encoded = encodeURIComponent(urlOrSlug);
    const headers = getClientHeaders();

    const [profileRes, intelRes] = await Promise.all([
      fetch(`${API_BASE}/api/profile?url=${encoded}`, { headers }),
      fetch(`${API_BASE}/api/profile/intelligence?url=${encoded}`, { headers }),
    ]);

    if (!profileRes.ok) {
      let errBody = null;
      try { errBody = await profileRes.json(); } catch {}
      const msg = errBody?.detail || `API request failed with status ${profileRes.status}`;
      showError(msg);
      return;
    }

    const profile = await profileRes.json();
    const intelligence = intelRes.ok ? await intelRes.json() : null;

    renderProfileData(profile, intelligence);
    switchView("timeline");
  } catch (err) {
    showError("Network exception: unable to connect to the IntelLens Voyager service.");
  } finally {
    els.btnAnalyze.disabled = false;
    els.analyzeLabel.textContent = "Analyze Profile";
    els.analyzeSpinner.classList.add("hidden");
    els.analyzeArrow.classList.remove("hidden");
  }
}

// Event Listeners
els.form.onsubmit = (e) => {
  e.preventDefault();
  const val = els.input.value.trim();
  if (!val) {
    showError("Please provide a valid LinkedIn URL or vanity slug.");
    return;
  }
  executeProfileLookup(val);
};

// Summary toggle
els.btnSummaryToggle.onclick = () => {
  const isCollapsed = els.pSummary.classList.toggle("summary-clamp");
  els.btnSummaryToggle.textContent = isCollapsed ? "Show more" : "Show less";
};

// Demo Preset Buttons
document.querySelectorAll(".btn-demo-preset").forEach((btn) => {
  btn.onclick = () => {
    const slug = btn.getAttribute("data-demo-slug");
    els.input.value = slug;
    executeProfileLookup(slug);
  };
});

// Copy JSON
async function copyPayload() {
  if (!currentProfile) return;
  const payload = JSON.stringify({ profile: currentProfile, intelligence: currentIntelligence }, null, 2);
  await navigator.clipboard.writeText(payload);
  alert("Profile JSON telemetry copied to clipboard!");
}
els.btnCopyJson.onclick = copyPayload;
els.btnCopyJsonTab.onclick = copyPayload;

// Download JSON
els.btnDownloadJson.onclick = () => {
  if (!currentProfile) return;
  const payload = JSON.stringify({ profile: currentProfile, intelligence: currentIntelligence }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${currentProfile.public_identifier || "profile"}_intel.json`;
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

## Career Telemetry
- **Seniority Rank:** ${i?.career_metrics.seniority_level || "N/A"}
- **Total Experience:** ${i?.career_metrics.total_experience_years || 0} years
- **Average Tenure:** ${i?.career_metrics.average_tenure_years || 0} years / role
- **Completeness Score:** ${i?.completeness_score || 0}%

## About
${p.summary || "N/A"}

## Work Experience
${p.positions.map((pos) => `### ${pos.title} @ ${pos.company_name}
${formatDateRange(pos.date_range)} | ${pos.location || ""}
${pos.description || ""}`).join("\n\n")}

## Academic Background
${p.educations.map((edu) => `- **${edu.school_name}**: ${[edu.degree_name, edu.field_of_study].filter(Boolean).join(", ")} (${formatDateRange(edu.date_range)})`).join("\n")}

## Core Skills
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
els.btnOpenCredentials.onclick = () => {
  els.modalLiAt.value = localStorage.getItem(STORAGE_LI_AT) || "";
  els.modalJsessionid.value = localStorage.getItem(STORAGE_JSESSIONID) || "";
  els.modalCredentials.classList.remove("hidden");
};

els.btnCloseModal.onclick = () => {
  els.modalCredentials.classList.add("hidden");
};

els.btnSaveTokens.onclick = () => {
  const liAt = els.modalLiAt.value.trim();
  const jsessionid = els.modalJsessionid.value.trim();
  if (liAt && jsessionid) {
    localStorage.setItem(STORAGE_LI_AT, liAt);
    localStorage.setItem(STORAGE_JSESSIONID, jsessionid);
    alert("Tokens saved locally in browser storage!");
  } else {
    localStorage.removeItem(STORAGE_LI_AT);
    localStorage.removeItem(STORAGE_JSESSIONID);
  }
  els.modalCredentials.classList.add("hidden");
  verifySessionMode();
};

els.btnClearTokens.onclick = () => {
  localStorage.removeItem(STORAGE_LI_AT);
  localStorage.removeItem(STORAGE_JSESSIONID);
  els.modalLiAt.value = "";
  els.modalJsessionid.value = "";
  alert("Cleared custom session tokens.");
  els.modalCredentials.classList.add("hidden");
  verifySessionMode();
};

// Initial verification
verifySessionMode();
