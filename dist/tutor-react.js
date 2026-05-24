import { jsx as t, jsxs as l, Fragment as I } from "react/jsx-runtime";
import { useState as f, useEffect as $, useRef as M, useMemo as B } from "react";
import { useQuery as D } from "@tanstack/react-query";
import Y from "axios";
import { Link as j } from "react-router-dom";
const F = {};
let P = typeof import.meta < "u" && (F == null ? void 0 : F.VITE_TUTOR_HOST) || "https://canvasa.physolympiad.com", E = "olympiz";
function de(e) {
  e.host && (P = e.host.replace(/\/$/, "")), e.tenant && (E = e.tenant), _.defaults.baseURL = `${P}/api`, _.defaults.headers.common["X-Tutor-Tenant"] = E;
}
function R() {
  return P;
}
function pe() {
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
  generateFromUrl: (e, o) => _.post("/generate-from-url", { url: e, title: o }).then((n) => n.data),
  generateFromPdf: (e) => {
    const o = new FormData();
    return o.append("file", e), _.post("/generate-from-pdf", o, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((n) => n.data);
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
const X = (e) => `/ai-tutor/${encodeURIComponent(e)}`;
function Q({
  lesson: e,
  lessonHref: o = X,
  defaultMode: n = "lecture",
  autoStart: s,
  eyebrow: i = "Pick a learning mode",
  onClose: p
}) {
  const [u, c] = f(s || n);
  $(() => {
    function r(b) {
      b.key === "Escape" && p();
    }
    return window.addEventListener("keydown", r), () => window.removeEventListener("keydown", r);
  }, [p]), $(() => {
    const r = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      document.body.style.overflow = r;
    };
  }, []);
  function d(r) {
    const b = q(r), h = K(), g = `&return=${encodeURIComponent(h)}`;
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
    s && d(s);
  }, []);
  const a = q(u);
  return /* @__PURE__ */ t(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      onClick: (r) => {
        r.target === r.currentTarget && p();
      },
      className: "tutor-modal-backdrop",
      children: /* @__PURE__ */ l("div", { className: "tutor-modal", onClick: (r) => r.stopPropagation(), children: [
        /* @__PURE__ */ t("div", { className: "tutor-modal__eyebrow", children: i }),
        /* @__PURE__ */ t("h2", { className: "tutor-modal__title", children: e.title }),
        /* @__PURE__ */ t("p", { className: "tutor-modal__sub", children: e.slug && e.cached ? "Cached — instant start." : "Click Start. The intro audio plays right away while we generate the first beat." }),
        !s && /* @__PURE__ */ l(I, { children: [
          /* @__PURE__ */ t(
            G,
            {
              checked: a === "lecture",
              onSelect: () => c("lecture"),
              title: "Lecture",
              tagline: '"You teach, I learn."',
              desc: "Tutor narrates every step beat-by-beat. Watch the board, listen along, ask tangents anytime. Default mode."
            }
          ),
          /* @__PURE__ */ t(
            G,
            {
              checked: a === "guide",
              onSelect: () => c("guide"),
              title: "Guide",
              tagline: '"You guide, I do it."',
              desc: "Tutor poses each step as a question. You answer (multiple choice or type). Tutor verifies, comments, and guides forward."
            }
          ),
          /* @__PURE__ */ t(
            G,
            {
              checked: a === "together",
              onSelect: () => c("together"),
              title: "Together",
              tagline: '"Let’s solve together."',
              badge: "NEW",
              desc: "You and the tutor solve the problem together, trading turns step-by-step until the solution emerges."
            }
          )
        ] }),
        /* @__PURE__ */ l("div", { className: "tutor-modal__actions", children: [
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              onClick: p,
              className: "tutor-btn--ghost",
              children: "Cancel"
            }
          ),
          !s && /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              onClick: () => d(u),
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
  title: n,
  tagline: s,
  desc: i,
  badge: p
}) {
  return /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      onClick: o,
      className: e ? "tutor-modal__option is-active" : "tutor-modal__option",
      children: /* @__PURE__ */ l("div", { className: "tutor-modal__option-row", children: [
        /* @__PURE__ */ t("span", { className: "tutor-modal__radio", children: e && /* @__PURE__ */ t("span", { className: "tutor-modal__radio-dot" }) }),
        /* @__PURE__ */ l("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ t("span", { className: "tutor-modal__option-title", children: n }),
          s && /* @__PURE__ */ l("span", { className: "tutor-modal__option-tagline", children: [
            " · ",
            /* @__PURE__ */ t("em", { dangerouslySetInnerHTML: { __html: s } })
          ] }),
          p && /* @__PURE__ */ t("span", { className: "tutor-modal__option-badge", children: p }),
          /* @__PURE__ */ t("div", { className: "tutor-modal__option-desc", children: i })
        ] })
      ] })
    }
  );
}
const J = "2.05";
let L = null;
async function V() {
  if (L) return L;
  if (typeof window < "u" && typeof window.renderMathInElement == "function")
    return L = window.renderMathInElement, L;
  try {
    const e = await import("katex/contrib/auto-render");
    return await import("katex/dist/katex.min.css"), L = e.default || e, L;
  } catch (e) {
    return console.warn("[tutor-react] katex auto-render unavailable (no global, no ESM); raw LaTeX will show. Add the CDN <script> tags from the JSDoc comment to enable.", e), null;
  }
}
function Z(e, o) {
  $(() => {
    let n = !1, s = 0;
    function i() {
      n || V().then((p) => {
        if (!n) {
          if (!p || !e.current) {
            s++ < 15 && setTimeout(i, 200);
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
    return i(), () => {
      n = !0;
    };
  }, o);
}
const ee = (e) => `/ai-tutor/${e}`;
function W(e) {
  if (!e) return "";
  try {
    const o = new URL(e, "http://x"), n = o.searchParams.get("lesson");
    if (n) return n;
    let s = o.pathname;
    return s = s.replace(/^\/+/, ""), s = s.replace(/^tutor\//, ""), s = s.replace(/^lesson_/, ""), s = s.replace(/\.html$/, ""), s;
  } catch {
    return "";
  }
}
function te(e) {
  const [o, n] = f(""), [s, i] = f(!1), [p, u] = f("");
  function c(g) {
    if (!g) {
      u("Lesson ready but slug missing"), i(!1);
      return;
    }
    window.location.href = e(g);
  }
  async function d(g) {
    let w = "";
    for (; ; ) {
      try {
        const m = await C.lessonStatus(g), y = (m.progress || m.status || "").replace(/_/g, " ");
        if (y && y !== w && (n(y), w = y), m.ready_url) {
          i(!1), c(W(m.ready_url));
          return;
        }
        if (m.status === "error" || m.error) {
          u(m.error || "Generation failed"), i(!1);
          return;
        }
      } catch (m) {
        u((m == null ? void 0 : m.message) || "Status check failed"), i(!1);
        return;
      }
      await new Promise((m) => setTimeout(m, 1500));
    }
  }
  const a = K();
  function r(g) {
    u(""), n("Opening tutor…"), i(!0), window.location.replace(
      `${R()}/tutor?ask=${encodeURIComponent(g)}&return=${encodeURIComponent(a)}`
    );
  }
  function b(g, w) {
    u(""), n("Opening tutor…"), i(!0);
    const m = w && w.trim() || g;
    window.location.replace(
      `${R()}/tutor?ask=${encodeURIComponent(m)}&return=${encodeURIComponent(a)}`
    );
  }
  async function h(g) {
    var w, m;
    u(""), n("Reading PDF…"), i(!0);
    try {
      const y = await C.generateFromPdf(g), N = W(y.ready_url);
      if (N) {
        c(N);
        return;
      }
      d(y.session_id);
    } catch (y) {
      u(((m = (w = y == null ? void 0 : y.response) == null ? void 0 : w.data) == null ? void 0 : m.detail) || (y == null ? void 0 : y.message) || "PDF upload failed"), i(!1);
    }
  }
  return { progress: o, busy: s, error: p, launchTopic: r, launchUrl: b, launchPdf: h };
}
function he({
  lessonHref: e = ee,
  heroTitle: o,
  heroSub: n,
  className: s
}) {
  const [i, p] = f("ondemand"), [u, c] = f(""), [d, a] = f(""), [r, b] = f("all"), [h, g] = f(""), [w, m] = f("all"), [y, N] = f(null), v = te(e), { data: U } = D({
    queryKey: ["tutor-inventory-counts"],
    queryFn: C.inventoryCounts,
    staleTime: 5 * 6e4
  }), { data: S } = D({
    queryKey: ["tutor-library-topics"],
    queryFn: C.libraryTopics,
    enabled: i === "concepts",
    staleTime: 5 * 6e4
  }), { data: T } = D({
    queryKey: ["tutor-problems-library"],
    queryFn: C.problemsLibrary,
    enabled: i === "problems",
    staleTime: 5 * 6e4
  });
  function A() {
    const k = u.trim();
    k && N({ title: k });
  }
  return /* @__PURE__ */ l("div", { className: `tutor-page ${s || ""}`.trim(), children: [
    /* @__PURE__ */ l(
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
          J
        ]
      }
    ),
    /* @__PURE__ */ l("section", { className: "tutor-hero", children: [
      /* @__PURE__ */ t("h1", { children: o ?? /* @__PURE__ */ l(I, { children: [
        "What do you want to ",
        /* @__PURE__ */ t("em", { children: "learn" }),
        " today?"
      ] }) }),
      /* @__PURE__ */ t("p", { children: n ?? "Drop a question." })
    ] }),
    /* @__PURE__ */ l("nav", { className: "tutor-tabs", role: "tablist", children: [
      /* @__PURE__ */ l(O, { active: i === "ondemand", onClick: () => p("ondemand"), children: [
        "On-demand ",
        /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: "5 ways" })
      ] }),
      /* @__PURE__ */ l(O, { active: i === "concepts", onClick: () => p("concepts"), children: [
        "Concept library",
        U ? /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: U.concepts_total.toLocaleString() }) : null
      ] }),
      /* @__PURE__ */ l(O, { active: i === "problems", onClick: () => p("problems"), children: [
        "Problems",
        U ? /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: U.problems_total.toLocaleString() }) : null
      ] })
    ] }),
    i === "ondemand" && /* @__PURE__ */ l(I, { children: [
      /* @__PURE__ */ l(x, { title: "Type a topic.", children: [
        /* @__PURE__ */ l("div", { className: "tutor-row", children: [
          /* @__PURE__ */ t(
            "input",
            {
              type: "text",
              className: "tutor-input",
              value: u,
              onChange: (k) => c(k.target.value),
              onKeyDown: (k) => k.key === "Enter" && A(),
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
              disabled: v.busy || !u.trim(),
              children: v.busy ? "Working…" : "AI Tutor →"
            }
          )
        ] }),
        (v.progress || v.error) && /* @__PURE__ */ t("div", { className: v.error ? "tutor-status tutor-status--error" : "tutor-status", children: v.error || v.progress })
      ] }),
      /* @__PURE__ */ t(re, { disabled: v.busy, onPick: v.launchUrl }),
      /* @__PURE__ */ t(x, { title: "Or, drop a chapter or paper.", children: /* @__PURE__ */ t(ne, { disabled: v.busy, onFile: v.launchPdf }) })
    ] }),
    i === "concepts" && /* @__PURE__ */ l(
      x,
      {
        title: "Concept library",
        subtitle: S ? `${S.lesson_count.toLocaleString()} lessons across ${S.topics.length} topics` : "Loading…",
        children: [
          /* @__PURE__ */ l("div", { className: "tutor-row", style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ t(
              "input",
              {
                type: "text",
                className: "tutor-input tutor-input--sm",
                value: d,
                onChange: (k) => a(k.target.value),
                placeholder: "Search concepts…"
              }
            ),
            /* @__PURE__ */ t(z, { value: r, onChange: b, options: [
              { value: "all", label: "All" },
              { value: "HS", label: "HS" },
              { value: "UG", label: "UG" },
              { value: "G", label: "G" }
            ] })
          ] }),
          /* @__PURE__ */ t(oe, { topics: (S == null ? void 0 : S.topics) || [], q: d, level: r, onPick: N })
        ]
      }
    ),
    i === "problems" && /* @__PURE__ */ l(
      x,
      {
        title: "Problems",
        subtitle: T ? `${T.total.toLocaleString()} problems · ${T.cached_count.toLocaleString()} cached` : "Loading…",
        children: [
          /* @__PURE__ */ l("div", { className: "tutor-row", style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ t(
              "input",
              {
                type: "text",
                className: "tutor-input tutor-input--sm",
                value: h,
                onChange: (k) => g(k.target.value),
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
          /* @__PURE__ */ t(ae, { sections: (T == null ? void 0 : T.sections) || [], q: h, chip: w, onPick: N })
        ]
      }
    ),
    y && /* @__PURE__ */ t(
      Q,
      {
        lesson: y,
        lessonHref: e,
        onClose: () => N(null)
      }
    )
  ] });
}
function O({ active: e, onClick: o, children: n }) {
  return /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": e,
      onClick: o,
      className: e ? "tutor-tab is-active" : "tutor-tab",
      children: n
    }
  );
}
function x({ title: e, subtitle: o, children: n }) {
  return /* @__PURE__ */ l("section", { className: "tutor-section", children: [
    /* @__PURE__ */ t("h2", { children: e }),
    o && /* @__PURE__ */ t("div", { className: "tutor-section__sub", children: o }),
    n
  ] });
}
function z({ value: e, onChange: o, options: n }) {
  return /* @__PURE__ */ t("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: n.map((s) => /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      className: e === s.value ? "tutor-chip is-active" : "tutor-chip",
      onClick: () => o(s.value),
      children: s.label
    },
    s.value
  )) });
}
function re({ disabled: e, onPick: o }) {
  const [n, s] = f("internal"), [i, p] = f(""), [u, c] = f([]), [d, a] = f(!1), r = M(null);
  return $(() => {
    if (!i.trim()) {
      c([]);
      return;
    }
    r.current && clearTimeout(r.current), r.current = setTimeout(async () => {
      a(!0);
      try {
        const h = n === "external" ? await C.wikiSearch(i.trim()) : await C.superstemSearch(i.trim());
        c(h.results || []);
      } catch {
        c([]);
      } finally {
        a(!1);
      }
    }, 300);
  }, [i, n]), /* @__PURE__ */ l(x, { title: "Or, point at a source.", children: [
    /* @__PURE__ */ t("div", { className: "tutor-sources", children: [
      { key: "internal", lbl: "Internal wiki", sub: "SuperStem Physics + AI + HS concept graphs" },
      { key: "external", lbl: "External wiki", sub: "Wikipedia — live" }
    ].map((h) => /* @__PURE__ */ t(
      "button",
      {
        type: "button",
        className: n === h.key ? "tutor-source is-active" : "tutor-source",
        onClick: () => s(h.key),
        children: /* @__PURE__ */ l("div", { className: "tutor-source__row", children: [
          /* @__PURE__ */ t("span", { className: "tutor-source__dot" }),
          /* @__PURE__ */ l("div", { children: [
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
        value: i,
        onChange: (h) => p(h.target.value),
        disabled: e,
        placeholder: "Type to search the selected source…"
      }
    ),
    d && /* @__PURE__ */ t("div", { className: "tutor-status", children: "Searching…" }),
    u.length > 0 && /* @__PURE__ */ t("div", { className: "tutor-results", children: u.slice(0, 10).map((h, g) => /* @__PURE__ */ l(
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
  const n = M(null), [s, i] = f(!1);
  function p(u) {
    !u || e || u.name.toLowerCase().endsWith(".pdf") && o(u);
  }
  return /* @__PURE__ */ l(
    "div",
    {
      className: `tutor-drop${s ? " is-hover" : ""}`,
      onClick: () => {
        var u;
        return !e && ((u = n.current) == null ? void 0 : u.click());
      },
      onDragOver: (u) => {
        u.preventDefault(), i(!0);
      },
      onDragLeave: () => i(!1),
      onDrop: (u) => {
        var c;
        u.preventDefault(), i(!1), p(((c = u.dataTransfer.files) == null ? void 0 : c[0]) || null);
      },
      children: [
        /* @__PURE__ */ t("div", { className: "tutor-drop__icon", children: "📄" }),
        /* @__PURE__ */ l("div", { className: "tutor-drop__hint", children: [
          "Drop a PDF here, or ",
          /* @__PURE__ */ t("strong", { children: "click to choose a file" })
        ] }),
        /* @__PURE__ */ t(
          "input",
          {
            ref: n,
            type: "file",
            accept: "application/pdf",
            hidden: !0,
            onChange: (u) => {
              var c;
              return p(((c = u.target.files) == null ? void 0 : c[0]) || null);
            }
          }
        )
      ]
    }
  );
}
function oe({
  topics: e,
  q: o,
  level: n,
  onPick: s
}) {
  const [i, p] = f({}), u = B(() => {
    const c = o.trim().toLowerCase();
    return e.map((d) => ({
      ...d,
      lessons: d.lessons.filter((a) => !(n !== "all" && a.level !== n || c && !a.title.toLowerCase().includes(c)))
    })).filter((d) => d.lessons.length > 0);
  }, [e, o, n]);
  return e.length ? u.length ? /* @__PURE__ */ t("div", { children: u.map((c) => {
    const d = !!i[c.name];
    return /* @__PURE__ */ l("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ l(
        "h3",
        {
          role: "button",
          tabIndex: 0,
          "aria-expanded": !d,
          onClick: () => p((a) => ({ ...a, [c.name]: !a[c.name] })),
          onKeyDown: (a) => {
            (a.key === "Enter" || a.key === " ") && (a.preventDefault(), p((r) => ({ ...r, [c.name]: !r[c.name] })));
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
            /* @__PURE__ */ t("span", { children: c.icon }),
            " ",
            c.name,
            /* @__PURE__ */ l("span", { className: "tutor-tab__count", children: [
              "(",
              c.lessons.length,
              ")"
            ] })
          ]
        }
      ),
      !d && /* @__PURE__ */ t("div", { className: "tutor-card-grid", children: c.lessons.map((a, r) => /* @__PURE__ */ l(
        "button",
        {
          type: "button",
          onClick: () => s({ slug: a.slug, title: a.title, cached: a.cached, guide_cached: a.guide_cached }),
          className: "tutor-card",
          style: { textAlign: "left", font: "inherit", cursor: "pointer" },
          children: [
            /* @__PURE__ */ t("div", { className: "tutor-card__title", children: a.title }),
            /* @__PURE__ */ l("div", { className: "tutor-card__meta", children: [
              /* @__PURE__ */ t("span", { children: a.level }),
              a.cached && /* @__PURE__ */ t("span", { className: "tutor-card__cached", children: "✓ cached" }),
              a.guide_cached && /* @__PURE__ */ t("span", { style: { color: "var(--tutor-warning)" }, children: "⚡ guide" })
            ] })
          ]
        },
        c.name + "::" + a.slug + "::" + r
      )) })
    ] }, c.name);
  }) }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "No matches." }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "Loading…" });
}
function ae({
  sections: e,
  q: o,
  chip: n,
  onPick: s
}) {
  const [i, p] = f({}), u = M(null), c = B(() => {
    const d = o.trim().toLowerCase();
    return e.map((a) => ({
      ...a,
      problems: a.problems.filter((r) => !(n === "HS" && r.level !== "HS" || n === "UG" && r.level !== "UG" || n === "G" && r.level !== "G" && r.level !== "Grad" || n === "Olympiad" && r.origin !== "physolympiad" || n === "cached" && !r.cached || d && !r.title.toLowerCase().includes(d) && !(r.statement || "").toLowerCase().includes(d)))
    })).filter((a) => a.problems.length > 0);
  }, [e, o, n]);
  return Z(u, [c, i]), e.length ? c.length ? /* @__PURE__ */ t("div", { ref: u, children: c.map((d) => {
    const a = !!i[d.name];
    return /* @__PURE__ */ l("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ l(
        "h3",
        {
          role: "button",
          tabIndex: 0,
          "aria-expanded": !a,
          onClick: () => p((r) => ({ ...r, [d.name]: !r[d.name] })),
          onKeyDown: (r) => {
            (r.key === "Enter" || r.key === " ") && (r.preventDefault(), p((b) => ({ ...b, [d.name]: !b[d.name] })));
          },
          style: { cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 },
          title: a ? "Click to expand" : "Click to collapse",
          children: [
            /* @__PURE__ */ t(
              "span",
              {
                "aria-hidden": "true",
                style: {
                  display: "inline-block",
                  width: "0.7em",
                  transition: "transform 0.15s ease",
                  transform: a ? "rotate(-90deg)" : "rotate(0deg)",
                  color: "var(--tutor-muted, #5a7c92)",
                  fontSize: "0.75em"
                },
                children: "▾"
              }
            ),
            /* @__PURE__ */ t("span", { children: d.icon }),
            " ",
            d.name,
            /* @__PURE__ */ l("span", { className: "tutor-tab__count", children: [
              "(",
              d.problems.length,
              ")"
            ] })
          ]
        }
      ),
      !a && d.problems.map((r, b) => (
        // v0.1.4: removed .slice(0, 50) cap — show all problems per section.
        /* @__PURE__ */ l(
          "button",
          {
            type: "button",
            onClick: () => s({ slug: r.slug, title: r.title, cached: r.cached, guide_cached: r.guide_cached }),
            className: "tutor-prob",
            style: { textAlign: "left", font: "inherit", cursor: "pointer", display: "block", width: "100%" },
            children: [
              /* @__PURE__ */ l("div", { className: "tutor-prob__head", children: [
                /* @__PURE__ */ t("span", { className: "tutor-prob__title", children: r.title }),
                r.difficulty && /* @__PURE__ */ t("span", { className: `tutor-pill tutor-pill--${r.difficulty}`, children: r.difficulty }),
                r.level && /* @__PURE__ */ t("span", { className: "tutor-pill", children: r.level }),
                r.source && /* @__PURE__ */ l("span", { style: { fontSize: "0.7rem", color: "var(--tutor-muted)" }, children: [
                  "· ",
                  r.source
                ] })
              ] }),
              r.statement && /* @__PURE__ */ t("div", { className: "tutor-prob__statement", children: r.statement })
            ]
          },
          d.name + "::" + r.slug + "::" + b
        )
      ))
    ] }, d.name);
  }) }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "No matches." }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "Loading…" });
}
function me({ to: e = "/ai-tutor", label: o = "AI Tutor", badge: n, className: s }) {
  return /* @__PURE__ */ l(j, { to: e, className: `tutor-btn ${s || ""}`.trim(), style: { gap: 6 }, children: [
    /* @__PURE__ */ t("span", { children: o }),
    n && /* @__PURE__ */ t("span", { style: {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.1em",
      padding: "2px 6px",
      borderRadius: 4,
      background: "var(--tutor-accent)",
      color: "var(--tutor-on-accent)"
    }, children: n })
  ] });
}
function fe({
  lesson: e,
  defaultMode: o = "walkthrough",
  autoStart: n,
  lessonHref: s,
  label: i = "Ask AI ↗",
  badge: p,
  className: u,
  trigger: c
}) {
  const [d, a] = f(!1), r = () => a(!0);
  return /* @__PURE__ */ l(I, { children: [
    c ? c(r) : /* @__PURE__ */ l(
      "button",
      {
        type: "button",
        onClick: r,
        className: u || "tutor-btn",
        style: { gap: 6 },
        children: [
          /* @__PURE__ */ t("span", { children: i }),
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
        autoStart: n,
        lessonHref: s,
        onClose: () => a(!1)
      }
    )
  ] });
}
export {
  fe as AskTutorButton,
  Q as LessonModeModal,
  me as TutorButton,
  he as TutorLanding,
  de as configureTutor,
  R as getTutorHost,
  pe as getTutorTenant,
  H as searchResultBlurb,
  _ as tutorApi,
  C as tutorEndpoints
};
//# sourceMappingURL=tutor-react.js.map
