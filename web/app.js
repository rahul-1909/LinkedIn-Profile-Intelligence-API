/**
 * LinkedIn Profile Viewer — Apple Liquid Glass UI
 * Built on FastAPI + LinkedIn Voyager REST.
 */

const DEFAULT_API_BASE = window.location.origin;
const STORAGE_KEY = "profile_intelligence_api_base";

const MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ERROR_MESSAGES = {
  configuration_error: "API credentials are being resolved. Please try again in a moment.",
  invalid_url: "Please enter a valid LinkedIn profile URL or vanity username.",
  unauthorized: "LinkedIn session expired. Please refresh session credentials.",
  forbidden: "Access restricted by LinkedIn for this profile.",
  not_found: "LinkedIn profile not found. Please verify the URL or username.",
  rate_limit_exceeded: "Rate limit reached. Please wait a moment and retry.",
  upstream_error: "Unable to retrieve profile from LinkedIn. Please try again.",
};

function resolveApiBase() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("api");
  if (fromQuery) {
    const cleaned = fromQuery.replace(/\/$/, "");
    try {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } catch {
      /* ignore quota / private mode */
    }
    return cleaned;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored.replace(/\/$/, "");
  } catch {
    /* ignore */
  }
  return DEFAULT_API_BASE.replace(/\/$/, "");
}

const API_BASE = resolveApiBase();

const els = {
  form: document.getElementById("search-form"),
  input: document.getElementById("url-input"),
  submitBtn: document.getElementById("submit-btn"),
  btnLabel: document.getElementById("btn-label"),
  btnSpinner: document.getElementById("btn-spinner"),
  btnArrow: document.getElementById("btn-arrow"),
  sampleBtn: document.getElementById("sample-btn"),
  apiHint: document.getElementById("api-hint"),
  errorBanner: document.getElementById("error-banner"),
  featurePreview: document.getElementById("feature-preview"),
  result: document.getElementById("result"),
  cover: document.getElementById("cover"),
  avatar: document.getElementById("avatar"),
  fullName: document.getElementById("full-name"),
  headline: document.getElementById("headline"),
  location: document.getElementById("location"),
  profileLink: document.getElementById("profile-link"),
  sectionAbout: document.getElementById("section-about"),
  summary: document.getElementById("summary"),
  summaryToggle: document.getElementById("summary-toggle"),
  sectionExperience: document.getElementById("section-experience"),
  positions: document.getElementById("positions"),
  sectionEducation: document.getElementById("section-education"),
  educations: document.getElementById("educations"),
  sectionSkills: document.getElementById("section-skills"),
  skills: document.getElementById("skills"),
  skillsBadge: document.getElementById("skills-badge"),
  sectionCerts: document.getElementById("section-certs"),
  certifications: document.getElementById("certifications"),
  sectionLanguages: document.getElementById("section-languages"),
  languages: document.getElementById("languages"),
  sectionMedia: document.getElementById("section-media"),
  treasury: document.getElementById("treasury"),
  fetchedAt: document.getElementById("fetched-at"),
};

try {
  els.apiHint.textContent = `API: ${new URL(API_BASE).host}`;
} catch {
  els.apiHint.textContent = `API: ${API_BASE}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMonthYear(month, year) {
  if (!year) return null;
  if (month && month >= 1 && month <= 12) return `${MONTHS[month]} ${year}`;
  return String(year);
}

function formatDateRange(range) {
  if (!range) return "";
  const start = formatMonthYear(range.start_month, range.start_year);
  if (!start) return "";
  if (range.is_current) return `${start} – Present`;
  const end = formatMonthYear(range.end_month, range.end_year);
  return end ? `${start} – ${end}` : start;
}

function initials(first, last) {
  const a = (first || "").trim().charAt(0);
  const b = (last || "").trim().charAt(0);
  const out = `${a}${b}`.toUpperCase();
  return out || "?";
}

function setLoading(loading) {
  els.submitBtn.disabled = loading;
  els.btnLabel.textContent = loading ? "Fetching…" : "Fetch Profile";
  els.btnSpinner.classList.toggle("hidden", !loading);
  els.btnArrow.classList.toggle("hidden", loading);
}

function showError(message) {
  els.errorBanner.textContent = message;
  els.errorBanner.classList.remove("hidden");
  els.errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideError() {
  els.errorBanner.classList.add("hidden");
  els.errorBanner.textContent = "";
}

function friendlyError(status, payload) {
  if (payload && payload.error && ERROR_MESSAGES[payload.error]) {
    return payload.detail
      ? `${ERROR_MESSAGES[payload.error]} (${payload.detail})`
      : ERROR_MESSAGES[payload.error];
  }
  if (payload && payload.detail) {
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.detail)) {
      return payload.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    }
  }
  if (status === 404) return ERROR_MESSAGES.not_found;
  if (status === 429) return ERROR_MESSAGES.rate_limit_exceeded;
  if (status >= 500) return ERROR_MESSAGES.upstream_error;
  return `Error (${status}). Please check the URL and try again.`;
}

function toggleSection(element, visible) {
  if (!element) return;
  element.classList.toggle("hidden", !visible);
}

function renderHeader(profile) {
  if (profile.cover_picture_url) {
    els.cover.style.backgroundImage = `url("${profile.cover_picture_url}")`;
  } else {
    els.cover.style.backgroundImage = "";
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  els.fullName.textContent = name || profile.public_identifier || "LinkedIn Member";

  if (profile.profile_picture_url) {
    els.avatar.innerHTML = `<img src="${escapeHtml(profile.profile_picture_url)}" alt="${escapeHtml(name)}" class="h-full w-full object-cover rounded-full" />`;
  } else {
    els.avatar.textContent = initials(profile.first_name, profile.last_name);
  }

  els.headline.textContent = profile.headline || "";
  toggleSection(els.headline, Boolean(profile.headline));

  const loc = profile.location ? profile.location.display : "";
  if (loc) {
    const locSpan = els.location.querySelector("span");
    if (locSpan) locSpan.textContent = loc;
    else els.location.textContent = loc;
    els.location.classList.remove("hidden");
  } else {
    els.location.classList.add("hidden");
  }

  if (profile.profile_url) {
    els.profileLink.href = profile.profile_url;
    els.profileLink.classList.remove("hidden");
  } else {
    els.profileLink.classList.add("hidden");
  }
}

function renderAbout(summary) {
  if (!summary || !summary.trim()) {
    toggleSection(els.sectionAbout, false);
    return;
  }

  els.summary.textContent = summary;
  els.summary.classList.add("summary-collapsed");
  toggleSection(els.sectionAbout, true);

  requestAnimationFrame(() => {
    const needsToggle = els.summary.scrollHeight > els.summary.clientHeight + 4;
    els.summaryToggle.classList.toggle("hidden", !needsToggle);
    els.summaryToggle.textContent = "Show more";
    els.summaryToggle.onclick = () => {
      const collapsed = els.summary.classList.toggle("summary-collapsed");
      els.summaryToggle.textContent = collapsed ? "Show more" : "Show less";
    };
  });
}

function renderPositions(positions) {
  if (!positions || !positions.length) {
    toggleSection(els.sectionExperience, false);
    return;
  }

  els.positions.innerHTML = positions
    .map((p) => {
      const title = escapeHtml(p.title || "Role");
      const company = escapeHtml(p.company_name || "");
      const dates = escapeHtml(formatDateRange(p.date_range));
      const location = escapeHtml(p.location || "");
      const employment = escapeHtml(p.employment_type || "");
      const meta = [dates, location, employment].filter(Boolean).join(" · ");
      const desc = p.description
        ? `<p class="mt-3 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-600 font-normal pl-3 border-l-2 border-apple-blue/20">${escapeHtml(p.description)}</p>`
        : "";
      return `
        <article class="apple-glass-card rounded-2xl p-4 sm:p-5 relative transition hover:bg-white/80">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
            <div>
              <h4 class="font-bold text-apple-dark text-sm sm:text-base">${title}</h4>
              ${company ? `<p class="text-xs font-medium text-slate-700 mt-0.5">${company}</p>` : ""}
            </div>
            ${meta ? `<span class="apple-glass-pill px-3 py-1 text-[11px] font-medium text-apple-gray shrink-0 rounded-full self-start">${meta}</span>` : ""}
          </div>
          ${desc}
        </article>
      `;
    })
    .join("");

  toggleSection(els.sectionExperience, true);
}

function renderEducations(educations) {
  if (!educations || !educations.length) {
    toggleSection(els.sectionEducation, false);
    return;
  }

  els.educations.innerHTML = educations
    .map((e) => {
      const school = escapeHtml(e.school_name || "Institution");
      const degreeBits = [e.degree_name, e.field_of_study].filter(Boolean).join(" — ");
      const dates = escapeHtml(formatDateRange(e.date_range));
      const grade = e.grade ? `Grade: ${escapeHtml(e.grade)}` : "";
      const meta = [dates, grade].filter(Boolean).join(" · ");
      const activities = e.activities
        ? `<p class="mt-1 text-xs text-slate-600">${escapeHtml(e.activities)}</p>`
        : "";
      const desc = e.description
        ? `<p class="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">${escapeHtml(e.description)}</p>`
        : "";
      return `
        <article class="apple-glass-card rounded-2xl p-4 sm:p-5 relative transition hover:bg-white/80">
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
            <div>
              <h4 class="font-bold text-apple-dark text-sm">${school}</h4>
              ${degreeBits ? `<p class="text-xs text-slate-700 mt-0.5">${escapeHtml(degreeBits)}</p>` : ""}
            </div>
            ${meta ? `<span class="apple-glass-pill px-3 py-1 text-[11px] font-medium text-apple-gray shrink-0 rounded-full self-start">${meta}</span>` : ""}
          </div>
          ${activities}
          ${desc}
        </article>
      `;
    })
    .join("");

  toggleSection(els.sectionEducation, true);
}

function renderSkills(skills, skillsTotal) {
  if (!skills || !skills.length) {
    toggleSection(els.sectionSkills, false);
    return;
  }

  if (els.skillsBadge) {
    els.skillsBadge.textContent = skillsTotal ? `${skillsTotal} Total` : `${skills.length}`;
  }

  const chips = skills
    .map(
      (s) =>
        `<span class="apple-glass-pill px-3 py-1.5 text-xs font-medium text-slate-800 rounded-full cursor-default">${escapeHtml(s.name)}</span>`,
    )
    .join("");

  let more = "";
  if (typeof skillsTotal === "number" && skillsTotal > skills.length) {
    const remaining = skillsTotal - skills.length;
    more = `<span class="apple-glass-pill px-3 py-1.5 text-xs font-semibold text-apple-blue rounded-full">+${remaining} more</span>`;
  }

  els.skills.innerHTML = chips + more;
  toggleSection(els.sectionSkills, true);
}

function renderCertifications(certs) {
  if (!certs || !certs.length) {
    toggleSection(els.sectionCerts, false);
    return;
  }

  els.certifications.innerHTML = certs
    .map((c) => {
      const name = escapeHtml(c.name || "Certification");
      const title = c.url
        ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-apple-blue hover:underline">${name} ↗</a>`
        : `<span class="text-xs font-semibold text-apple-dark">${name}</span>`;
      const authority = c.authority
        ? `<p class="text-[11px] text-apple-gray mt-0.5">${escapeHtml(c.authority)}</p>`
        : "";
      const issued = c.issue_date
        ? `<span class="apple-glass-pill px-2.5 py-0.5 text-[10px] font-medium text-slate-500 rounded-full shrink-0">${escapeHtml(c.issue_date)}</span>`
        : "";
      return `
        <article class="apple-glass-card rounded-2xl p-3.5 transition hover:bg-white/80 flex items-start justify-between gap-2">
          <div class="min-w-0">
            ${title}
            ${authority}
          </div>
          ${issued}
        </article>
      `;
    })
    .join("");

  toggleSection(els.sectionCerts, true);
}

function renderLanguages(languages) {
  if (!languages || !languages.length) {
    toggleSection(els.sectionLanguages, false);
    return;
  }

  els.languages.innerHTML = languages
    .map((l) => {
      const name = escapeHtml(l.name || "Language");
      const proficiency = l.proficiency
        ? `<span class="text-apple-gray text-[11px]">${escapeHtml(l.proficiency)}</span>`
        : "";
      return `
        <div class="apple-glass-pill px-3.5 py-2 rounded-xl text-xs font-medium text-slate-800 flex items-center justify-between">
          <span>${name}</span>
          ${proficiency}
        </div>
      `;
    })
    .join("");

  toggleSection(els.sectionLanguages, true);
}

function renderTreasury(items) {
  if (!items || !items.length) {
    toggleSection(els.sectionMedia, false);
    return;
  }

  els.treasury.innerHTML = items
    .map((t) => {
      const title = escapeHtml(t.title || t.url || "Document");
      const link = t.url
        ? `<a href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-apple-blue hover:underline block truncate">${title} ↗</a>`
        : `<span class="text-xs font-medium text-slate-900 block truncate">${title}</span>`;
      const kind = t.kind
        ? `<span class="apple-glass-pill px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 rounded">${escapeHtml(t.kind)}</span>`
        : "";
      return `
        <div class="apple-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 transition hover:bg-white/80">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-apple-blue text-xs font-bold">📄</span>
            <div class="min-w-0">
              ${link}
            </div>
          </div>
          ${kind}
        </div>
      `;
    })
    .join("");

  toggleSection(els.sectionMedia, true);
}

function renderProfile(profile) {
  renderHeader(profile);
  renderAbout(profile.summary);
  renderPositions(profile.positions);
  renderEducations(profile.educations);
  renderSkills(profile.skills, profile.skills_total);
  renderCertifications(profile.certifications);
  renderLanguages(profile.languages);
  renderTreasury(profile.treasury_media);

  if (profile.fetched_at) {
    const d = new Date(profile.fetched_at);
    els.fetchedAt.textContent = `Extracted at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Cached via Voyager Engine`;
  } else {
    els.fetchedAt.textContent = "";
  }

  els.result.classList.remove("hidden");
  els.featurePreview.classList.add("hidden");
  requestAnimationFrame(() => {
    els.result.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function fetchProfile(url) {
  hideError();
  els.result.classList.add("hidden");
  els.featurePreview.classList.remove("hidden");
  setLoading(true);

  try {
    const endpoint = `${API_BASE}/api/profile?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok) {
      showError(friendlyError(res.status, body));
      return;
    }

    renderProfile(body);
  } catch {
    showError(
      `Could not connect to the profile service at ${API_BASE}. Please check your connection and try again.`,
    );
  } finally {
    setLoading(false);
  }
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const url = els.input.value.trim();
  if (!url) {
    showError("Please paste a LinkedIn profile URL or vanity handle first.");
    return;
  }
  fetchProfile(url);
});

els.sampleBtn.addEventListener("click", () => {
  els.input.value = "https://www.linkedin.com/in/nallarahulteja";
  hideError();
  els.input.focus();
  els.input.select();
});
