import { jsx as t, jsxs as c, Fragment as U } from "react/jsx-runtime";
import { useState as f, useEffect as $, useRef as M, useMemo as B } from "react";
import { useQuery as D } from "@tanstack/react-query";
import Y from "axios";
const F = {};
let P = typeof import.meta < "u" && (F == null ? void 0 : F.VITE_TUTOR_HOST) || "https://canvasa.physolympiad.com", E = "olympiz";
function ce(e) {
  e.host && (P = e.host.replace(/\/$/, "")), e.tenant && (E = e.tenant), _.defaults.baseURL = `${P}/api`, _.defaults.headers.common["X-Tutor-Tenant"] = E;
}
function R() {
  return P;
}
function ue() {
  return E;
}
const _ = Y.create({
  baseURL: `${P}/api`,
  timeout: 6e4,
  headers: {
    "Content-Type": "application/json",
    "X-Tutor-Tenant": E
  }
});
function H(e) {
  return e.description || e.desc || e.snippet || "";
}
const C = {
  inventoryCounts: () => _.get("/inventory-counts").then((e) => e.data),
  libraryTopics: () => _.get("/library-topics").then((e) => e.data),
  problemsLibrary: () => _.get("/problems-library").then((e) => e.data),
  generateLesson: (e) => _.post("/generate-lesson", { topic: e }).then((o) => o.data),
  generateFromUrl: (e, o) => _.post("/generate-from-url", { url: e, title: o }).then((r) => r.data),
  generateFromPdf: (e) => {
    const o = new FormData();
    return o.append("file", e), _.post("/generate-from-pdf", o, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((r) => r.data);
  },
  lessonStatus: (e) => _.get(`/lesson-status/${e}`).then((o) => o.data),
  wikiSearch: (e) => _.get("/wiki-opensearch", { params: { q: e } }).then((o) => o.data),
  superstemSearch: (e) => _.get("/superstem-search", { params: { q: e } }).then((o) => o.data)
};
function K() {
  try {
    const e = new URLSearchParams(window.location.search).get("return");
    if (e && /^https?:\/\//i.test(e))
      return e;
    if (typeof window < "u" && window.location)
      return `${window.location.origin}${window.location.pathname}`;
  } catch {
  }
  return `${typeof window < "u" ? window.location.origin : ""}/study`;
}
function q(e) {
  return e === "walkthrough" ? "lecture" : e === "make_me" ? "guide" : e;
}
const j = (e) => `/ai-tutor/${encodeURIComponent(e)}`;
function Q({
  lesson: e,
  lessonHref: o = j,
  defaultMode: r = "lecture",
  autoStart: u,
  eyebrow: a = "Pick a learning mode",
  onClose: p
}) {
  const [i, s] = f(u || r);
  $(() => {
    function n(b) {
      b.key === "Escape" && p();
    }
    return window.addEventListener("keydown", n), () => window.removeEventListener("keydown", n);
  }, [p]), $(() => {
    const n = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      document.body.style.overflow = n;
    };
  }, []);
  function d(n) {
    const b = q(n), h = K(), g = `&return=${encodeURIComponent(h)}`;
    if (b === "guide" || b === "together") {
      if (!e.slug) {
        window.location.href = `${R()}/tutor?ask=${encodeURIComponent(e.title)}${g}`;
        return;
      }
      window.location.href = `${R()}/guide?lesson=${encodeURIComponent(e.slug)}${g}`;
      return;
    }
    if (e.slug && e.cached) {
      window.location.href = o(e.slug);
      return;
    }
    window.location.href = `${R()}/tutor?ask=${encodeURIComponent(e.title)}${g}`;
  }
  $(() => {
    u && d(u);
  }, []);
  const l = q(i);
  return /* @__PURE__ */ t(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      onClick: (n) => {
        n.target === n.currentTarget && p();
      },
      className: "tutor-modal-backdrop",
      children: /* @__PURE__ */ c("div", { className: "tutor-modal", onClick: (n) => n.stopPropagation(), children: [
        /* @__PURE__ */ t("div", { className: "tutor-modal__eyebrow", children: a }),
        /* @__PURE__ */ t("h2", { className: "tutor-modal__title", children: e.title }),
        /* @__PURE__ */ t("p", { className: "tutor-modal__sub", children: e.slug && e.cached ? "Cached — instant start." : "Click Start. The intro audio plays right away while we generate the first beat." }),
        !u && /* @__PURE__ */ c(U, { children: [
          /* @__PURE__ */ t(
            G,
            {
              checked: l === "lecture",
              onSelect: () => s("lecture"),
              title: "Lecture",
              tagline: '"You teach, I learn."',
              desc: "Tutor narrates every step beat-by-beat. Watch the board, listen along, ask tangents anytime. Default mode."
            }
          ),
          /* @__PURE__ */ t(
            G,
            {
              checked: l === "guide",
              onSelect: () => s("guide"),
              title: "Guide",
              tagline: '"You guide, I do it."',
              desc: "Tutor poses each step as a question. You answer (multiple choice or type). Tutor verifies, comments, and guides forward."
            }
          ),
          /* @__PURE__ */ t(
            G,
            {
              checked: l === "together",
              onSelect: () => s("together"),
              title: "Together",
              tagline: '"Let’s solve together."',
              badge: "NEW",
              desc: "You and the tutor solve the problem together, trading turns step-by-step until the solution emerges."
            }
          )
        ] }),
        /* @__PURE__ */ c("div", { className: "tutor-modal__actions", children: [
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              onClick: p,
              className: "tutor-btn--ghost",
              children: "Cancel"
            }
          ),
          !u && /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              onClick: () => d(i),
              className: "tutor-btn",
              children: "Start →"
            }
          )
        ] })
      ] })
    }
  );
}
function G({
  checked: e,
  onSelect: o,
  title: r,
  tagline: u,
  desc: a,
  badge: p
}) {
  return /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      onClick: o,
      className: e ? "tutor-modal__option is-active" : "tutor-modal__option",
      children: /* @__PURE__ */ c("div", { className: "tutor-modal__option-row", children: [
        /* @__PURE__ */ t("span", { className: "tutor-modal__radio", children: e && /* @__PURE__ */ t("span", { className: "tutor-modal__radio-dot" }) }),
        /* @__PURE__ */ c("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ t("span", { className: "tutor-modal__option-title", children: r }),
          u && /* @__PURE__ */ c("span", { className: "tutor-modal__option-tagline", children: [
            " · ",
            /* @__PURE__ */ t("em", { dangerouslySetInnerHTML: { __html: u } })
          ] }),
          p && /* @__PURE__ */ t("span", { className: "tutor-modal__option-badge", children: p }),
          /* @__PURE__ */ t("div", { className: "tutor-modal__option-desc", children: a })
        ] })
      ] })
    }
  );
}
const X = "2.05";
let T = null;
async function J() {
  if (T) return T;
  if (typeof window < "u" && typeof window.renderMathInElement == "function")
    return T = window.renderMathInElement, T;
  try {
    const e = await import("katex/contrib/auto-render");
    return await import("katex/dist/katex.min.css"), T = e.default || e, T;
  } catch (e) {
    return console.warn("[tutor-react] katex auto-render unavailable (no global, no ESM); raw LaTeX will show. Add the CDN <script> tags from the JSDoc comment to enable.", e), null;
  }
}
function V(e, o) {
  $(() => {
    let r = !1, u = 0;
    function a() {
      r || J().then((p) => {
        if (!r) {
          if (!p || !e.current) {
            u++ < 15 && setTimeout(a, 200);
            return;
          }
          p(e.current, {
            delimiters: [
              { left: "$$", right: "$$", display: !0 },
              { left: "$", right: "$", display: !1 },
              { left: "\\(", right: "\\)", display: !1 },
              { left: "\\[", right: "\\]", display: !0 }
            ],
            throwOnError: !1,
            // v0.1.6: NB — 'button' is intentionally NOT in ignoredTags. The
            // ProblemList renders each problem as a <button> for click handling,
            // and the statement div lives INSIDE that button. With 'button'
            // excluded, KaTeX walks into buttons and renders the math.
            ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
          });
        }
      });
    }
    return a(), () => {
      r = !0;
    };
  }, o);
}
const Z = (e) => `/ai-tutor/${e}`;
function W(e) {
  if (!e) return "";
  try {
    const o = new URL(e, "http://x"), r = o.searchParams.get("lesson");
    if (r) return r;
    let u = o.pathname;
    return u = u.replace(/^\/+/, ""), u = u.replace(/^tutor\//, ""), u = u.replace(/^lesson_/, ""), u = u.replace(/\.html$/, ""), u;
  } catch {
    return "";
  }
}
function ee(e) {
  const [o, r] = f(""), [u, a] = f(!1), [p, i] = f("");
  function s(g) {
    if (!g) {
      i("Lesson ready but slug missing"), a(!1);
      return;
    }
    window.location.href = e(g);
  }
  async function d(g) {
    let w = "";
    for (; ; ) {
      try {
        const m = await C.lessonStatus(g), y = (m.progress || m.status || "").replace(/_/g, " ");
        if (y && y !== w && (r(y), w = y), m.ready_url) {
          a(!1), s(W(m.ready_url));
          return;
        }
        if (m.status === "error" || m.error) {
          i(m.error || "Generation failed"), a(!1);
          return;
        }
      } catch (m) {
        i((m == null ? void 0 : m.message) || "Status check failed"), a(!1);
        return;
      }
      await new Promise((m) => setTimeout(m, 1500));
    }
  }
  const l = K();
  function n(g) {
    i(""), r("Opening tutor…"), a(!0), window.location.replace(
      `${R()}/tutor?ask=${encodeURIComponent(g)}&return=${encodeURIComponent(l)}`
    );
  }
  function b(g, w) {
    i(""), r("Opening tutor…"), a(!0);
    const m = w && w.trim() || g;
    window.location.replace(
      `${R()}/tutor?ask=${encodeURIComponent(m)}&return=${encodeURIComponent(l)}`
    );
  }
  async function h(g) {
    var w, m;
    i(""), r("Reading PDF…"), a(!0);
    try {
      const y = await C.generateFromPdf(g), k = W(y.ready_url);
      if (k) {
        s(k);
        return;
      }
      d(y.session_id);
    } catch (y) {
      i(((m = (w = y == null ? void 0 : y.response) == null ? void 0 : w.data) == null ? void 0 : m.detail) || (y == null ? void 0 : y.message) || "PDF upload failed"), a(!1);
    }
  }
  return { progress: o, busy: u, error: p, launchTopic: n, launchUrl: b, launchPdf: h };
}
function de({
  lessonHref: e = Z,
  heroTitle: o,
  heroSub: r,
  className: u
}) {
  const [a, p] = f("ondemand"), [i, s] = f(""), [d, l] = f(""), [n, b] = f("all"), [h, g] = f(""), [w, m] = f("all"), [y, k] = f(null), v = ee(e), { data: I } = D({
    queryKey: ["tutor-inventory-counts"],
    queryFn: C.inventoryCounts,
    staleTime: 5 * 6e4
  }), { data: S } = D({
    queryKey: ["tutor-library-topics"],
    queryFn: C.libraryTopics,
    enabled: a === "concepts",
    staleTime: 5 * 6e4
  }), { data: L } = D({
    queryKey: ["tutor-problems-library"],
    queryFn: C.problemsLibrary,
    enabled: a === "problems",
    staleTime: 5 * 6e4
  });
  function A() {
    const N = i.trim();
    N && k({ title: N });
  }
  return /* @__PURE__ */ c("div", { className: `tutor-page ${u || ""}`.trim(), children: [
    /* @__PURE__ */ c(
      "div",
      {
        title: "Olympiz version. Hard-refresh if this doesn't match the latest deploy.",
        style: {
          position: "fixed",
          top: 10,
          right: 14,
          zIndex: 99999,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 10.5,
          letterSpacing: "0.06em",
          padding: "3px 9px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.94)",
          color: "#46718a",
          border: "1px solid rgba(70,113,138,0.18)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          pointerEvents: "auto",
          userSelect: "none"
        },
        children: [
          "v",
          X
        ]
      }
    ),
    /* @__PURE__ */ c("section", { className: "tutor-hero", children: [
      /* @__PURE__ */ t("h1", { children: o ?? /* @__PURE__ */ c(U, { children: [
        "What do you want to ",
        /* @__PURE__ */ t("em", { children: "learn" }),
        " today?"
      ] }) }),
      /* @__PURE__ */ t("p", { children: r ?? "Drop a question." })
    ] }),
    /* @__PURE__ */ c("nav", { className: "tutor-tabs", role: "tablist", children: [
      /* @__PURE__ */ c(O, { active: a === "ondemand", onClick: () => p("ondemand"), children: [
        "On-demand ",
        /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: "5 ways" })
      ] }),
      /* @__PURE__ */ c(O, { active: a === "concepts", onClick: () => p("concepts"), children: [
        "Concept library",
        I ? /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: I.concepts_total.toLocaleString() }) : null
      ] }),
      /* @__PURE__ */ c(O, { active: a === "problems", onClick: () => p("problems"), children: [
        "Problems",
        I ? /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: I.problems_total.toLocaleString() }) : null
      ] })
    ] }),
    a === "ondemand" && /* @__PURE__ */ c(U, { children: [
      /* @__PURE__ */ c(x, { title: "Type a topic.", children: [
        /* @__PURE__ */ c("div", { className: "tutor-row", children: [
          /* @__PURE__ */ t(
            "input",
            {
              type: "text",
              className: "tutor-input",
              value: i,
              onChange: (N) => s(N.target.value),
              onKeyDown: (N) => N.key === "Enter" && A(),
              disabled: v.busy,
              placeholder: "e.g. Bernoulli's principle · Lenz's law · Maxwell's equations"
            }
          ),
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              className: "tutor-btn",
              onClick: A,
              disabled: v.busy || !i.trim(),
              children: v.busy ? "Working…" : "AI Tutor →"
            }
          )
        ] }),
        (v.progress || v.error) && /* @__PURE__ */ t("div", { className: v.error ? "tutor-status tutor-status--error" : "tutor-status", children: v.error || v.progress })
      ] }),
      /* @__PURE__ */ t(te, { disabled: v.busy, onPick: v.launchUrl }),
      /* @__PURE__ */ t(x, { title: "Or, drop a chapter or paper.", children: /* @__PURE__ */ t(ne, { disabled: v.busy, onFile: v.launchPdf }) })
    ] }),
    a === "concepts" && /* @__PURE__ */ c(
      x,
      {
        title: "Concept library",
        subtitle: S ? `${S.lesson_count.toLocaleString()} lessons across ${S.topics.length} topics` : "Loading…",
        children: [
          /* @__PURE__ */ c("div", { className: "tutor-row", style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ t(
              "input",
              {
                type: "text",
                className: "tutor-input tutor-input--sm",
                value: d,
                onChange: (N) => l(N.target.value),
                placeholder: "Search concepts…"
              }
            ),
            /* @__PURE__ */ t(z, { value: n, onChange: b, options: [
              { value: "all", label: "All" },
              { value: "HS", label: "HS" },
              { value: "UG", label: "UG" },
              { value: "G", label: "G" }
            ] })
          ] }),
          /* @__PURE__ */ t(re, { topics: (S == null ? void 0 : S.topics) || [], q: d, level: n, onPick: k })
        ]
      }
    ),
    a === "problems" && /* @__PURE__ */ c(
      x,
      {
        title: "Problems",
        subtitle: L ? `${L.total.toLocaleString()} problems · ${L.cached_count.toLocaleString()} cached` : "Loading…",
        children: [
          /* @__PURE__ */ c("div", { className: "tutor-row", style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ t(
              "input",
              {
                type: "text",
                className: "tutor-input tutor-input--sm",
                value: h,
                onChange: (N) => g(N.target.value),
                placeholder: "Search problems…"
              }
            ),
            /* @__PURE__ */ t(z, { value: w, onChange: m, options: [
              { value: "all", label: "All" },
              { value: "HS", label: "HS" },
              { value: "UG", label: "UG" },
              { value: "G", label: "G" },
              { value: "Olympiad", label: "Olympiad" },
              { value: "cached", label: "✓" }
            ] })
          ] }),
          /* @__PURE__ */ t(oe, { sections: (L == null ? void 0 : L.sections) || [], q: h, chip: w, onPick: k })
        ]
      }
    ),
    y && /* @__PURE__ */ t(
      Q,
      {
        lesson: y,
        lessonHref: e,
        onClose: () => k(null)
      }
    )
  ] });
}
function O({ active: e, onClick: o, children: r }) {
  return /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": e,
      onClick: o,
      className: e ? "tutor-tab is-active" : "tutor-tab",
      children: r
    }
  );
}
function x({ title: e, subtitle: o, children: r }) {
  return /* @__PURE__ */ c("section", { className: "tutor-section", children: [
    /* @__PURE__ */ t("h2", { children: e }),
    o && /* @__PURE__ */ t("div", { className: "tutor-section__sub", children: o }),
    r
  ] });
}
function z({ value: e, onChange: o, options: r }) {
  return /* @__PURE__ */ t("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: r.map((u) => /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      className: e === u.value ? "tutor-chip is-active" : "tutor-chip",
      onClick: () => o(u.value),
      children: u.label
    },
    u.value
  )) });
}
function te({ disabled: e, onPick: o }) {
  const [r, u] = f("internal"), [a, p] = f(""), [i, s] = f([]), [d, l] = f(!1), n = M(null);
  return $(() => {
    if (!a.trim()) {
      s([]);
      return;
    }
    n.current && clearTimeout(n.current), n.current = setTimeout(async () => {
      l(!0);
      try {
        const h = r === "external" ? await C.wikiSearch(a.trim()) : await C.superstemSearch(a.trim());
        s(h.results || []);
      } catch {
        s([]);
      } finally {
        l(!1);
      }
    }, 300);
  }, [a, r]), /* @__PURE__ */ c(x, { title: "Or, point at a source.", children: [
    /* @__PURE__ */ t("div", { className: "tutor-sources", children: [
      { key: "internal", lbl: "Internal wiki", sub: "SuperStem Physics + AI + HS concept graphs" },
      { key: "external", lbl: "External wiki", sub: "Wikipedia — live" }
    ].map((h) => /* @__PURE__ */ t(
      "button",
      {
        type: "button",
        className: r === h.key ? "tutor-source is-active" : "tutor-source",
        onClick: () => u(h.key),
        children: /* @__PURE__ */ c("div", { className: "tutor-source__row", children: [
          /* @__PURE__ */ t("span", { className: "tutor-source__dot" }),
          /* @__PURE__ */ c("div", { children: [
            /* @__PURE__ */ t("div", { className: "tutor-source__lbl", children: h.lbl }),
            /* @__PURE__ */ t("div", { className: "tutor-source__sub", children: h.sub })
          ] })
        ] })
      },
      h.key
    )) }),
    /* @__PURE__ */ t(
      "input",
      {
        type: "text",
        className: "tutor-input tutor-input--sm",
        value: a,
        onChange: (h) => p(h.target.value),
        disabled: e,
        placeholder: "Type to search the selected source…"
      }
    ),
    d && /* @__PURE__ */ t("div", { className: "tutor-status", children: "Searching…" }),
    i.length > 0 && /* @__PURE__ */ t("div", { className: "tutor-results", children: i.slice(0, 10).map((h, g) => /* @__PURE__ */ c(
      "button",
      {
        type: "button",
        className: "tutor-result",
        disabled: e || !h.url,
        onClick: () => h.url && o(h.url, h.title),
        children: [
          /* @__PURE__ */ t("div", { className: "tutor-result__title", children: h.title }),
          H(h) && /* @__PURE__ */ t("div", { className: "tutor-result__blurb", children: H(h) })
        ]
      },
      g
    )) }),
    /* @__PURE__ */ t("div", { className: "tutor-hint", children: "Searches across SuperStem Physics Wiki (1400+ articles) · AI Wiki · HS Physics/Math/Chemistry concept graphs." })
  ] });
}
function ne({ disabled: e, onFile: o }) {
  const r = M(null), [u, a] = f(!1);
  function p(i) {
    !i || e || i.name.toLowerCase().endsWith(".pdf") && o(i);
  }
  return /* @__PURE__ */ c(
    "div",
    {
      className: `tutor-drop${u ? " is-hover" : ""}`,
      onClick: () => {
        var i;
        return !e && ((i = r.current) == null ? void 0 : i.click());
      },
      onDragOver: (i) => {
        i.preventDefault(), a(!0);
      },
      onDragLeave: () => a(!1),
      onDrop: (i) => {
        var s;
        i.preventDefault(), a(!1), p(((s = i.dataTransfer.files) == null ? void 0 : s[0]) || null);
      },
      children: [
        /* @__PURE__ */ t("div", { className: "tutor-drop__icon", children: "📄" }),
        /* @__PURE__ */ c("div", { className: "tutor-drop__hint", children: [
          "Drop a PDF here, or ",
          /* @__PURE__ */ t("strong", { children: "click to choose a file" })
        ] }),
        /* @__PURE__ */ t(
          "input",
          {
            ref: r,
            type: "file",
            accept: "application/pdf",
            hidden: !0,
            onChange: (i) => {
              var s;
              return p(((s = i.target.files) == null ? void 0 : s[0]) || null);
            }
          }
        )
      ]
    }
  );
}
function re({
  topics: e,
  q: o,
  level: r,
  onPick: u
}) {
  const [a, p] = f({}), i = B(() => {
    const s = o.trim().toLowerCase();
    return e.map((d) => ({
      ...d,
      lessons: d.lessons.filter((l) => !(r !== "all" && l.level !== r || s && !l.title.toLowerCase().includes(s)))
    })).filter((d) => d.lessons.length > 0);
  }, [e, o, r]);
  return e.length ? i.length ? /* @__PURE__ */ t("div", { children: i.map((s) => {
    const d = !!a[s.name];
    return /* @__PURE__ */ c("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ c(
        "h3",
        {
          role: "button",
          tabIndex: 0,
          "aria-expanded": !d,
          onClick: () => p((l) => ({ ...l, [s.name]: !l[s.name] })),
          onKeyDown: (l) => {
            (l.key === "Enter" || l.key === " ") && (l.preventDefault(), p((n) => ({ ...n, [s.name]: !n[s.name] })));
          },
          style: { cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 },
          title: d ? "Click to expand" : "Click to collapse",
          children: [
            /* @__PURE__ */ t(
              "span",
              {
                "aria-hidden": "true",
                style: {
                  display: "inline-block",
                  width: "0.7em",
                  transition: "transform 0.15s ease",
                  transform: d ? "rotate(-90deg)" : "rotate(0deg)",
                  color: "var(--tutor-muted, #5a7c92)",
                  fontSize: "0.75em"
                },
                children: "▾"
              }
            ),
            /* @__PURE__ */ t("span", { children: s.icon }),
            " ",
            s.name,
            /* @__PURE__ */ c("span", { className: "tutor-tab__count", children: [
              "(",
              s.lessons.length,
              ")"
            ] })
          ]
        }
      ),
      !d && /* @__PURE__ */ t("div", { className: "tutor-card-grid", children: s.lessons.map((l, n) => /* @__PURE__ */ c(
        "button",
        {
          type: "button",
          onClick: () => u({ slug: l.slug, title: l.title, cached: l.cached, guide_cached: l.guide_cached }),
          className: "tutor-card",
          style: { textAlign: "left", font: "inherit", cursor: "pointer" },
          children: [
            /* @__PURE__ */ t("div", { className: "tutor-card__title", children: l.title }),
            /* @__PURE__ */ c("div", { className: "tutor-card__meta", children: [
              /* @__PURE__ */ t("span", { children: l.level }),
              l.cached && /* @__PURE__ */ t("span", { className: "tutor-card__cached", children: "✓ cached" }),
              l.guide_cached && /* @__PURE__ */ t("span", { style: { color: "var(--tutor-warning)" }, children: "⚡ guide" })
            ] })
          ]
        },
        s.name + "::" + l.slug + "::" + n
      )) })
    ] }, s.name);
  }) }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "No matches." }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "Loading…" });
}
function oe({
  sections: e,
  q: o,
  chip: r,
  onPick: u
}) {
  const [a, p] = f({}), i = M(null), s = B(() => {
    const d = o.trim().toLowerCase();
    return e.map((l) => ({
      ...l,
      problems: l.problems.filter((n) => !(r === "HS" && n.level !== "HS" || r === "UG" && n.level !== "UG" || r === "G" && n.level !== "G" && n.level !== "Grad" || r === "Olympiad" && n.origin !== "physolympiad" || r === "cached" && !n.cached || d && !n.title.toLowerCase().includes(d) && !(n.statement || "").toLowerCase().includes(d)))
    })).filter((l) => l.problems.length > 0);
  }, [e, o, r]);
  return V(i, [s, a]), e.length ? s.length ? /* @__PURE__ */ t("div", { ref: i, children: s.map((d) => {
    const l = !!a[d.name];
    return /* @__PURE__ */ c("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ c(
        "h3",
        {
          role: "button",
          tabIndex: 0,
          "aria-expanded": !l,
          onClick: () => p((n) => ({ ...n, [d.name]: !n[d.name] })),
          onKeyDown: (n) => {
            (n.key === "Enter" || n.key === " ") && (n.preventDefault(), p((b) => ({ ...b, [d.name]: !b[d.name] })));
          },
          style: { cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 },
          title: l ? "Click to expand" : "Click to collapse",
          children: [
            /* @__PURE__ */ t(
              "span",
              {
                "aria-hidden": "true",
                style: {
                  display: "inline-block",
                  width: "0.7em",
                  transition: "transform 0.15s ease",
                  transform: l ? "rotate(-90deg)" : "rotate(0deg)",
                  color: "var(--tutor-muted, #5a7c92)",
                  fontSize: "0.75em"
                },
                children: "▾"
              }
            ),
            /* @__PURE__ */ t("span", { children: d.icon }),
            " ",
            d.name,
            /* @__PURE__ */ c("span", { className: "tutor-tab__count", children: [
              "(",
              d.problems.length,
              ")"
            ] })
          ]
        }
      ),
      !l && d.problems.map((n, b) => (
        // v0.1.4: removed .slice(0, 50) cap — show all problems per section.
        /* @__PURE__ */ c(
          "button",
          {
            type: "button",
            onClick: () => u({ slug: n.slug, title: n.title, cached: n.cached, guide_cached: n.guide_cached }),
            className: "tutor-prob",
            style: { textAlign: "left", font: "inherit", cursor: "pointer", display: "block", width: "100%" },
            children: [
              /* @__PURE__ */ c("div", { className: "tutor-prob__head", children: [
                /* @__PURE__ */ t("span", { className: "tutor-prob__title", children: n.title }),
                n.difficulty && /* @__PURE__ */ t("span", { className: `tutor-pill tutor-pill--${n.difficulty}`, children: n.difficulty }),
                n.level && /* @__PURE__ */ t("span", { className: "tutor-pill", children: n.level }),
                n.source && /* @__PURE__ */ c("span", { style: { fontSize: "0.7rem", color: "var(--tutor-muted)" }, children: [
                  "· ",
                  n.source
                ] })
              ] }),
              n.statement && /* @__PURE__ */ t("div", { className: "tutor-prob__statement", children: n.statement })
            ]
          },
          d.name + "::" + n.slug + "::" + b
        )
      ))
    ] }, d.name);
  }) }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "No matches." }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "Loading…" });
}
function pe({
  to: e = "/ai-tutor",
  label: o = "AI Tutor",
  badge: r,
  className: u,
  linkComponent: a
}) {
  const p = `tutor-btn ${u || ""}`.trim(), i = { gap: 6 }, s = /* @__PURE__ */ c(U, { children: [
    /* @__PURE__ */ t("span", { children: o }),
    r && /* @__PURE__ */ t(
      "span",
      {
        style: {
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.1em",
          padding: "2px 6px",
          borderRadius: 4,
          background: "var(--tutor-accent)",
          color: "var(--tutor-on-accent)"
        },
        children: r
      }
    )
  ] });
  return a ? /* @__PURE__ */ t(a, { to: e, className: p, style: i, children: s }) : /* @__PURE__ */ t("a", { href: e, className: p, style: i, children: s });
}
function he({
  lesson: e,
  defaultMode: o = "walkthrough",
  autoStart: r,
  lessonHref: u,
  label: a = "Ask AI ↗",
  badge: p,
  className: i,
  trigger: s
}) {
  const [d, l] = f(!1), n = () => l(!0);
  return /* @__PURE__ */ c(U, { children: [
    s ? s(n) : /* @__PURE__ */ c(
      "button",
      {
        type: "button",
        onClick: n,
        className: i || "tutor-btn",
        style: { gap: 6 },
        children: [
          /* @__PURE__ */ t("span", { children: a }),
          p && /* @__PURE__ */ t("span", { style: {
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.1em",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--tutor-accent)",
            color: "var(--tutor-on-accent)"
          }, children: p })
        ]
      }
    ),
    d && /* @__PURE__ */ t(
      Q,
      {
        lesson: e,
        defaultMode: o,
        autoStart: r,
        lessonHref: u,
        onClose: () => l(!1)
      }
    )
  ] });
}
export {
  he as AskTutorButton,
  Q as LessonModeModal,
  pe as TutorButton,
  de as TutorLanding,
  ce as configureTutor,
  R as getTutorHost,
  ue as getTutorTenant,
  H as searchResultBlurb,
  _ as tutorApi,
  C as tutorEndpoints
};
//# sourceMappingURL=tutor-react.js.map
