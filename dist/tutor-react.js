import { jsx as t, jsxs as s, Fragment as I } from "react/jsx-runtime";
import { useState as f, useEffect as $, useRef as G, useMemo as z } from "react";
import { useQuery as D } from "@tanstack/react-query";
import Q from "axios";
import { Link as Y } from "react-router-dom";
const F = {};
let P = typeof import.meta < "u" && (F == null ? void 0 : F.VITE_TUTOR_HOST) || "https://canvasa.physolympiad.com", E = "olympiz";
function ue(e) {
  e.host && (P = e.host.replace(/\/$/, "")), e.tenant && (E = e.tenant), _.defaults.baseURL = `${P}/api`, _.defaults.headers.common["X-Tutor-Tenant"] = E;
}
function R() {
  return P;
}
function de() {
  return E;
}
const _ = Q.create({
  baseURL: `${P}/api`,
  timeout: 6e4,
  headers: {
    "Content-Type": "application/json",
    "X-Tutor-Tenant": E
  }
});
function M(e) {
  return e.description || e.desc || e.snippet || "";
}
const C = {
  inventoryCounts: () => _.get("/inventory-counts").then((e) => e.data),
  libraryTopics: () => _.get("/library-topics").then((e) => e.data),
  problemsLibrary: () => _.get("/problems-library").then((e) => e.data),
  generateLesson: (e) => _.post("/generate-lesson", { topic: e }).then((o) => o.data),
  generateFromUrl: (e, o) => _.post("/generate-from-url", { url: e, title: o }).then((a) => a.data),
  generateFromPdf: (e) => {
    const o = new FormData();
    return o.append("file", e), _.post("/generate-from-pdf", o, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((a) => a.data);
  },
  lessonStatus: (e) => _.get(`/lesson-status/${e}`).then((o) => o.data),
  wikiSearch: (e) => _.get("/wiki-opensearch", { params: { q: e } }).then((o) => o.data),
  superstemSearch: (e) => _.get("/superstem-search", { params: { q: e } }).then((o) => o.data)
};
function B() {
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
const j = (e) => `/ai-tutor/${encodeURIComponent(e)}`;
function K({
  lesson: e,
  lessonHref: o = j,
  defaultMode: a = "walkthrough",
  autoStart: i,
  eyebrow: l = "Pick a learning mode",
  onClose: p
}) {
  const [c, u] = f(i || a);
  $(() => {
    function r(n) {
      n.key === "Escape" && p();
    }
    return window.addEventListener("keydown", r), () => window.removeEventListener("keydown", r);
  }, [p]), $(() => {
    const r = document.body.style.overflow;
    return document.body.style.overflow = "hidden", () => {
      document.body.style.overflow = r;
    };
  }, []);
  function d(r) {
    const n = B(), b = `&return=${encodeURIComponent(n)}`;
    if (r === "make_me") {
      if (!e.slug) {
        window.location.href = `${R()}/tutor?ask=${encodeURIComponent(e.title)}${b}`;
        return;
      }
      window.location.href = `${R()}/guide?lesson=${encodeURIComponent(e.slug)}${b}`;
      return;
    }
    if (e.slug && e.cached) {
      window.location.href = o(e.slug);
      return;
    }
    window.location.href = `${R()}/tutor?ask=${encodeURIComponent(e.title)}${b}`;
  }
  return $(() => {
    i && d(i);
  }, []), /* @__PURE__ */ t(
    "div",
    {
      role: "dialog",
      "aria-modal": "true",
      onClick: (r) => {
        r.target === r.currentTarget && p();
      },
      className: "tutor-modal-backdrop",
      children: /* @__PURE__ */ s("div", { className: "tutor-modal", onClick: (r) => r.stopPropagation(), children: [
        /* @__PURE__ */ t("div", { className: "tutor-modal__eyebrow", children: l }),
        /* @__PURE__ */ t("h2", { className: "tutor-modal__title", children: e.title }),
        /* @__PURE__ */ t("p", { className: "tutor-modal__sub", children: e.slug && e.cached ? "Cached — instant start." : "Click Start. The intro audio plays right away while we generate the first beat." }),
        !i && /* @__PURE__ */ s(I, { children: [
          /* @__PURE__ */ t(
            H,
            {
              checked: c === "walkthrough",
              onSelect: () => u("walkthrough"),
              title: '"You teach, I learn."',
              desc: "Tutor narrates every step. Watch the board, listen along, ask tangents anytime. Default mode."
            }
          ),
          /* @__PURE__ */ t(
            H,
            {
              checked: c === "make_me",
              onSelect: () => u("make_me"),
              title: '"You guide, I do it."',
              badge: "NEW",
              desc: "Tutor poses each step as a question. You answer (multiple choice or type). Tutor verifies, comments, and guides forward. Interactive learning."
            }
          )
        ] }),
        /* @__PURE__ */ s("div", { className: "tutor-modal__actions", children: [
          /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              onClick: p,
              className: "tutor-btn--ghost",
              children: "Cancel"
            }
          ),
          !i && /* @__PURE__ */ t(
            "button",
            {
              type: "button",
              onClick: () => d(c),
              className: "tutor-btn",
              children: "Start →"
            }
          )
        ] })
      ] })
    }
  );
}
function H({
  checked: e,
  onSelect: o,
  title: a,
  desc: i,
  badge: l
}) {
  return /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      onClick: o,
      className: e ? "tutor-modal__option is-active" : "tutor-modal__option",
      children: /* @__PURE__ */ s("div", { className: "tutor-modal__option-row", children: [
        /* @__PURE__ */ t("span", { className: "tutor-modal__radio", children: e && /* @__PURE__ */ t("span", { className: "tutor-modal__radio-dot" }) }),
        /* @__PURE__ */ s("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ t("span", { className: "tutor-modal__option-title", children: a }),
          l && /* @__PURE__ */ t("span", { className: "tutor-modal__option-badge", children: l }),
          /* @__PURE__ */ t("div", { className: "tutor-modal__option-desc", children: i })
        ] })
      ] })
    }
  );
}
const X = "2.05";
let L = null;
async function J() {
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
function V(e, o) {
  $(() => {
    let a = !1, i = 0;
    function l() {
      a || J().then((p) => {
        if (!a) {
          if (!p || !e.current) {
            i++ < 15 && setTimeout(l, 200);
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
    return l(), () => {
      a = !0;
    };
  }, o);
}
const Z = (e) => `/ai-tutor/${e}`;
function q(e) {
  if (!e) return "";
  try {
    const o = new URL(e, "http://x"), a = o.searchParams.get("lesson");
    if (a) return a;
    let i = o.pathname;
    return i = i.replace(/^\/+/, ""), i = i.replace(/^tutor\//, ""), i = i.replace(/^lesson_/, ""), i = i.replace(/\.html$/, ""), i;
  } catch {
    return "";
  }
}
function ee(e) {
  const [o, a] = f(""), [i, l] = f(!1), [p, c] = f("");
  function u(g) {
    if (!g) {
      c("Lesson ready but slug missing"), l(!1);
      return;
    }
    window.location.href = e(g);
  }
  async function d(g) {
    let w = "";
    for (; ; ) {
      try {
        const h = await C.lessonStatus(g), y = (h.progress || h.status || "").replace(/_/g, " ");
        if (y && y !== w && (a(y), w = y), h.ready_url) {
          l(!1), u(q(h.ready_url));
          return;
        }
        if (h.status === "error" || h.error) {
          c(h.error || "Generation failed"), l(!1);
          return;
        }
      } catch (h) {
        c((h == null ? void 0 : h.message) || "Status check failed"), l(!1);
        return;
      }
      await new Promise((h) => setTimeout(h, 1500));
    }
  }
  const r = B();
  function n(g) {
    c(""), a("Opening tutor…"), l(!0), window.location.replace(
      `${R()}/tutor?ask=${encodeURIComponent(g)}&return=${encodeURIComponent(r)}`
    );
  }
  function b(g, w) {
    c(""), a("Opening tutor…"), l(!0);
    const h = w && w.trim() || g;
    window.location.replace(
      `${R()}/tutor?ask=${encodeURIComponent(h)}&return=${encodeURIComponent(r)}`
    );
  }
  async function m(g) {
    var w, h;
    c(""), a("Reading PDF…"), l(!0);
    try {
      const y = await C.generateFromPdf(g), N = q(y.ready_url);
      if (N) {
        u(N);
        return;
      }
      d(y.session_id);
    } catch (y) {
      c(((h = (w = y == null ? void 0 : y.response) == null ? void 0 : w.data) == null ? void 0 : h.detail) || (y == null ? void 0 : y.message) || "PDF upload failed"), l(!1);
    }
  }
  return { progress: o, busy: i, error: p, launchTopic: n, launchUrl: b, launchPdf: m };
}
function pe({
  lessonHref: e = Z,
  heroTitle: o,
  heroSub: a,
  className: i
}) {
  const [l, p] = f("ondemand"), [c, u] = f(""), [d, r] = f(""), [n, b] = f("all"), [m, g] = f(""), [w, h] = f("all"), [y, N] = f(null), v = ee(e), { data: U } = D({
    queryKey: ["tutor-inventory-counts"],
    queryFn: C.inventoryCounts,
    staleTime: 5 * 6e4
  }), { data: S } = D({
    queryKey: ["tutor-library-topics"],
    queryFn: C.libraryTopics,
    enabled: l === "concepts",
    staleTime: 5 * 6e4
  }), { data: T } = D({
    queryKey: ["tutor-problems-library"],
    queryFn: C.problemsLibrary,
    enabled: l === "problems",
    staleTime: 5 * 6e4
  });
  function A() {
    const k = c.trim();
    k && N({ title: k });
  }
  return /* @__PURE__ */ s("div", { className: `tutor-page ${i || ""}`.trim(), children: [
    /* @__PURE__ */ s(
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
    /* @__PURE__ */ s("section", { className: "tutor-hero", children: [
      /* @__PURE__ */ t("h1", { children: o ?? /* @__PURE__ */ s(I, { children: [
        "What do you want to ",
        /* @__PURE__ */ t("em", { children: "learn" }),
        " today?"
      ] }) }),
      /* @__PURE__ */ t("p", { children: a ?? "Drop a question." })
    ] }),
    /* @__PURE__ */ s("nav", { className: "tutor-tabs", role: "tablist", children: [
      /* @__PURE__ */ s(O, { active: l === "ondemand", onClick: () => p("ondemand"), children: [
        "On-demand ",
        /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: "5 ways" })
      ] }),
      /* @__PURE__ */ s(O, { active: l === "concepts", onClick: () => p("concepts"), children: [
        "Concept library",
        U ? /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: U.concepts_total.toLocaleString() }) : null
      ] }),
      /* @__PURE__ */ s(O, { active: l === "problems", onClick: () => p("problems"), children: [
        "Problems",
        U ? /* @__PURE__ */ t("span", { className: "tutor-tab__count", children: U.problems_total.toLocaleString() }) : null
      ] })
    ] }),
    l === "ondemand" && /* @__PURE__ */ s(I, { children: [
      /* @__PURE__ */ s(x, { title: "Type a topic.", children: [
        /* @__PURE__ */ s("div", { className: "tutor-row", children: [
          /* @__PURE__ */ t(
            "input",
            {
              type: "text",
              className: "tutor-input",
              value: c,
              onChange: (k) => u(k.target.value),
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
              disabled: v.busy || !c.trim(),
              children: v.busy ? "Working…" : "AI Tutor →"
            }
          )
        ] }),
        (v.progress || v.error) && /* @__PURE__ */ t("div", { className: v.error ? "tutor-status tutor-status--error" : "tutor-status", children: v.error || v.progress })
      ] }),
      /* @__PURE__ */ t(te, { disabled: v.busy, onPick: v.launchUrl }),
      /* @__PURE__ */ t(x, { title: "Or, drop a chapter or paper.", children: /* @__PURE__ */ t(re, { disabled: v.busy, onFile: v.launchPdf }) })
    ] }),
    l === "concepts" && /* @__PURE__ */ s(
      x,
      {
        title: "Concept library",
        subtitle: S ? `${S.lesson_count.toLocaleString()} lessons across ${S.topics.length} topics` : "Loading…",
        children: [
          /* @__PURE__ */ s("div", { className: "tutor-row", style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ t(
              "input",
              {
                type: "text",
                className: "tutor-input tutor-input--sm",
                value: d,
                onChange: (k) => r(k.target.value),
                placeholder: "Search concepts…"
              }
            ),
            /* @__PURE__ */ t(W, { value: n, onChange: b, options: [
              { value: "all", label: "All" },
              { value: "HS", label: "HS" },
              { value: "UG", label: "UG" },
              { value: "G", label: "G" }
            ] })
          ] }),
          /* @__PURE__ */ t(ne, { topics: (S == null ? void 0 : S.topics) || [], q: d, level: n, onPick: N })
        ]
      }
    ),
    l === "problems" && /* @__PURE__ */ s(
      x,
      {
        title: "Problems",
        subtitle: T ? `${T.total.toLocaleString()} problems · ${T.cached_count.toLocaleString()} cached` : "Loading…",
        children: [
          /* @__PURE__ */ s("div", { className: "tutor-row", style: { marginBottom: 14 }, children: [
            /* @__PURE__ */ t(
              "input",
              {
                type: "text",
                className: "tutor-input tutor-input--sm",
                value: m,
                onChange: (k) => g(k.target.value),
                placeholder: "Search problems…"
              }
            ),
            /* @__PURE__ */ t(W, { value: w, onChange: h, options: [
              { value: "all", label: "All" },
              { value: "HS", label: "HS" },
              { value: "UG", label: "UG" },
              { value: "G", label: "G" },
              { value: "Olympiad", label: "Olympiad" },
              { value: "cached", label: "✓" }
            ] })
          ] }),
          /* @__PURE__ */ t(ae, { sections: (T == null ? void 0 : T.sections) || [], q: m, chip: w, onPick: N })
        ]
      }
    ),
    y && /* @__PURE__ */ t(
      K,
      {
        lesson: y,
        lessonHref: e,
        onClose: () => N(null)
      }
    )
  ] });
}
function O({ active: e, onClick: o, children: a }) {
  return /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      role: "tab",
      "aria-selected": e,
      onClick: o,
      className: e ? "tutor-tab is-active" : "tutor-tab",
      children: a
    }
  );
}
function x({ title: e, subtitle: o, children: a }) {
  return /* @__PURE__ */ s("section", { className: "tutor-section", children: [
    /* @__PURE__ */ t("h2", { children: e }),
    o && /* @__PURE__ */ t("div", { className: "tutor-section__sub", children: o }),
    a
  ] });
}
function W({ value: e, onChange: o, options: a }) {
  return /* @__PURE__ */ t("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: a.map((i) => /* @__PURE__ */ t(
    "button",
    {
      type: "button",
      className: e === i.value ? "tutor-chip is-active" : "tutor-chip",
      onClick: () => o(i.value),
      children: i.label
    },
    i.value
  )) });
}
function te({ disabled: e, onPick: o }) {
  const [a, i] = f("internal"), [l, p] = f(""), [c, u] = f([]), [d, r] = f(!1), n = G(null);
  return $(() => {
    if (!l.trim()) {
      u([]);
      return;
    }
    n.current && clearTimeout(n.current), n.current = setTimeout(async () => {
      r(!0);
      try {
        const m = a === "external" ? await C.wikiSearch(l.trim()) : await C.superstemSearch(l.trim());
        u(m.results || []);
      } catch {
        u([]);
      } finally {
        r(!1);
      }
    }, 300);
  }, [l, a]), /* @__PURE__ */ s(x, { title: "Or, point at a source.", children: [
    /* @__PURE__ */ t("div", { className: "tutor-sources", children: [
      { key: "internal", lbl: "Internal wiki", sub: "SuperStem Physics + AI + HS concept graphs" },
      { key: "external", lbl: "External wiki", sub: "Wikipedia — live" }
    ].map((m) => /* @__PURE__ */ t(
      "button",
      {
        type: "button",
        className: a === m.key ? "tutor-source is-active" : "tutor-source",
        onClick: () => i(m.key),
        children: /* @__PURE__ */ s("div", { className: "tutor-source__row", children: [
          /* @__PURE__ */ t("span", { className: "tutor-source__dot" }),
          /* @__PURE__ */ s("div", { children: [
            /* @__PURE__ */ t("div", { className: "tutor-source__lbl", children: m.lbl }),
            /* @__PURE__ */ t("div", { className: "tutor-source__sub", children: m.sub })
          ] })
        ] })
      },
      m.key
    )) }),
    /* @__PURE__ */ t(
      "input",
      {
        type: "text",
        className: "tutor-input tutor-input--sm",
        value: l,
        onChange: (m) => p(m.target.value),
        disabled: e,
        placeholder: "Type to search the selected source…"
      }
    ),
    d && /* @__PURE__ */ t("div", { className: "tutor-status", children: "Searching…" }),
    c.length > 0 && /* @__PURE__ */ t("div", { className: "tutor-results", children: c.slice(0, 10).map((m, g) => /* @__PURE__ */ s(
      "button",
      {
        type: "button",
        className: "tutor-result",
        disabled: e || !m.url,
        onClick: () => m.url && o(m.url, m.title),
        children: [
          /* @__PURE__ */ t("div", { className: "tutor-result__title", children: m.title }),
          M(m) && /* @__PURE__ */ t("div", { className: "tutor-result__blurb", children: M(m) })
        ]
      },
      g
    )) }),
    /* @__PURE__ */ t("div", { className: "tutor-hint", children: "Searches across SuperStem Physics Wiki (1400+ articles) · AI Wiki · HS Physics/Math/Chemistry concept graphs." })
  ] });
}
function re({ disabled: e, onFile: o }) {
  const a = G(null), [i, l] = f(!1);
  function p(c) {
    !c || e || c.name.toLowerCase().endsWith(".pdf") && o(c);
  }
  return /* @__PURE__ */ s(
    "div",
    {
      className: `tutor-drop${i ? " is-hover" : ""}`,
      onClick: () => {
        var c;
        return !e && ((c = a.current) == null ? void 0 : c.click());
      },
      onDragOver: (c) => {
        c.preventDefault(), l(!0);
      },
      onDragLeave: () => l(!1),
      onDrop: (c) => {
        var u;
        c.preventDefault(), l(!1), p(((u = c.dataTransfer.files) == null ? void 0 : u[0]) || null);
      },
      children: [
        /* @__PURE__ */ t("div", { className: "tutor-drop__icon", children: "📄" }),
        /* @__PURE__ */ s("div", { className: "tutor-drop__hint", children: [
          "Drop a PDF here, or ",
          /* @__PURE__ */ t("strong", { children: "click to choose a file" })
        ] }),
        /* @__PURE__ */ t(
          "input",
          {
            ref: a,
            type: "file",
            accept: "application/pdf",
            hidden: !0,
            onChange: (c) => {
              var u;
              return p(((u = c.target.files) == null ? void 0 : u[0]) || null);
            }
          }
        )
      ]
    }
  );
}
function ne({
  topics: e,
  q: o,
  level: a,
  onPick: i
}) {
  const [l, p] = f({}), c = z(() => {
    const u = o.trim().toLowerCase();
    return e.map((d) => ({
      ...d,
      lessons: d.lessons.filter((r) => !(a !== "all" && r.level !== a || u && !r.title.toLowerCase().includes(u)))
    })).filter((d) => d.lessons.length > 0);
  }, [e, o, a]);
  return e.length ? c.length ? /* @__PURE__ */ t("div", { children: c.map((u) => {
    const d = !!l[u.name];
    return /* @__PURE__ */ s("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ s(
        "h3",
        {
          role: "button",
          tabIndex: 0,
          "aria-expanded": !d,
          onClick: () => p((r) => ({ ...r, [u.name]: !r[u.name] })),
          onKeyDown: (r) => {
            (r.key === "Enter" || r.key === " ") && (r.preventDefault(), p((n) => ({ ...n, [u.name]: !n[u.name] })));
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
            /* @__PURE__ */ t("span", { children: u.icon }),
            " ",
            u.name,
            /* @__PURE__ */ s("span", { className: "tutor-tab__count", children: [
              "(",
              u.lessons.length,
              ")"
            ] })
          ]
        }
      ),
      !d && /* @__PURE__ */ t("div", { className: "tutor-card-grid", children: u.lessons.map((r, n) => /* @__PURE__ */ s(
        "button",
        {
          type: "button",
          onClick: () => i({ slug: r.slug, title: r.title, cached: r.cached, guide_cached: r.guide_cached }),
          className: "tutor-card",
          style: { textAlign: "left", font: "inherit", cursor: "pointer" },
          children: [
            /* @__PURE__ */ t("div", { className: "tutor-card__title", children: r.title }),
            /* @__PURE__ */ s("div", { className: "tutor-card__meta", children: [
              /* @__PURE__ */ t("span", { children: r.level }),
              r.cached && /* @__PURE__ */ t("span", { className: "tutor-card__cached", children: "✓ cached" }),
              r.guide_cached && /* @__PURE__ */ t("span", { style: { color: "var(--tutor-warning)" }, children: "⚡ guide" })
            ] })
          ]
        },
        u.name + "::" + r.slug + "::" + n
      )) })
    ] }, u.name);
  }) }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "No matches." }) : /* @__PURE__ */ t("p", { className: "tutor-empty", children: "Loading…" });
}
function ae({
  sections: e,
  q: o,
  chip: a,
  onPick: i
}) {
  const [l, p] = f({}), c = G(null), u = z(() => {
    const d = o.trim().toLowerCase();
    return e.map((r) => ({
      ...r,
      problems: r.problems.filter((n) => !(a === "HS" && n.level !== "HS" || a === "UG" && n.level !== "UG" || a === "G" && n.level !== "G" && n.level !== "Grad" || a === "Olympiad" && n.origin !== "physolympiad" || a === "cached" && !n.cached || d && !n.title.toLowerCase().includes(d) && !(n.statement || "").toLowerCase().includes(d)))
    })).filter((r) => r.problems.length > 0);
  }, [e, o, a]);
  return V(c, [u, l]), e.length ? u.length ? /* @__PURE__ */ t("div", { ref: c, children: u.map((d) => {
    const r = !!l[d.name];
    return /* @__PURE__ */ s("div", { style: { marginBottom: 24 }, children: [
      /* @__PURE__ */ s(
        "h3",
        {
          role: "button",
          tabIndex: 0,
          "aria-expanded": !r,
          onClick: () => p((n) => ({ ...n, [d.name]: !n[d.name] })),
          onKeyDown: (n) => {
            (n.key === "Enter" || n.key === " ") && (n.preventDefault(), p((b) => ({ ...b, [d.name]: !b[d.name] })));
          },
          style: { cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 8 },
          title: r ? "Click to expand" : "Click to collapse",
          children: [
            /* @__PURE__ */ t(
              "span",
              {
                "aria-hidden": "true",
                style: {
                  display: "inline-block",
                  width: "0.7em",
                  transition: "transform 0.15s ease",
                  transform: r ? "rotate(-90deg)" : "rotate(0deg)",
                  color: "var(--tutor-muted, #5a7c92)",
                  fontSize: "0.75em"
                },
                children: "▾"
              }
            ),
            /* @__PURE__ */ t("span", { children: d.icon }),
            " ",
            d.name,
            /* @__PURE__ */ s("span", { className: "tutor-tab__count", children: [
              "(",
              d.problems.length,
              ")"
            ] })
          ]
        }
      ),
      !r && d.problems.map((n, b) => (
        // v0.1.4: removed .slice(0, 50) cap — show all problems per section.
        /* @__PURE__ */ s(
          "button",
          {
            type: "button",
            onClick: () => i({ slug: n.slug, title: n.title, cached: n.cached, guide_cached: n.guide_cached }),
            className: "tutor-prob",
            style: { textAlign: "left", font: "inherit", cursor: "pointer", display: "block", width: "100%" },
            children: [
              /* @__PURE__ */ s("div", { className: "tutor-prob__head", children: [
                /* @__PURE__ */ t("span", { className: "tutor-prob__title", children: n.title }),
                n.difficulty && /* @__PURE__ */ t("span", { className: `tutor-pill tutor-pill--${n.difficulty}`, children: n.difficulty }),
                n.level && /* @__PURE__ */ t("span", { className: "tutor-pill", children: n.level }),
                n.source && /* @__PURE__ */ s("span", { style: { fontSize: "0.7rem", color: "var(--tutor-muted)" }, children: [
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
function me({ to: e = "/ai-tutor", label: o = "AI Tutor", badge: a, className: i }) {
  return /* @__PURE__ */ s(Y, { to: e, className: `tutor-btn ${i || ""}`.trim(), style: { gap: 6 }, children: [
    /* @__PURE__ */ t("span", { children: o }),
    a && /* @__PURE__ */ t("span", { style: {
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: "0.1em",
      padding: "2px 6px",
      borderRadius: 4,
      background: "var(--tutor-accent)",
      color: "var(--tutor-on-accent)"
    }, children: a })
  ] });
}
function he({
  lesson: e,
  defaultMode: o = "walkthrough",
  autoStart: a,
  lessonHref: i,
  label: l = "Ask AI ↗",
  badge: p,
  className: c,
  trigger: u
}) {
  const [d, r] = f(!1), n = () => r(!0);
  return /* @__PURE__ */ s(I, { children: [
    u ? u(n) : /* @__PURE__ */ s(
      "button",
      {
        type: "button",
        onClick: n,
        className: c || "tutor-btn",
        style: { gap: 6 },
        children: [
          /* @__PURE__ */ t("span", { children: l }),
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
      K,
      {
        lesson: e,
        defaultMode: o,
        autoStart: a,
        lessonHref: i,
        onClose: () => r(!1)
      }
    )
  ] });
}
export {
  he as AskTutorButton,
  K as LessonModeModal,
  me as TutorButton,
  pe as TutorLanding,
  ue as configureTutor,
  R as getTutorHost,
  de as getTutorTenant,
  M as searchResultBlurb,
  _ as tutorApi,
  C as tutorEndpoints
};
//# sourceMappingURL=tutor-react.js.map
