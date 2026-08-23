"use client";

import { useEffect } from "react";
import { homeInterfaceTranslations } from "../lib/home-interface-translations.generated";
import type { SiteLanguage } from "../lib/site-locale";

type State = { source: string; rendered: string };
const textState = new WeakMap<Text, State>();
const attributeState = new WeakMap<Element, Map<string, State>>();
const nativeNames = new Set(["中文", "English", "Español", "日本語", "한국어", "Français", "Deutsch", "Русский", "Italiano", "Português", "العربية", "हिन्दी"]);

function render(value: string, dictionary: Record<string, string>) {
  const trimmed = value.trim();
  const normalized = trimmed.replace(/\s+/g, " ");
  if (!trimmed || nativeNames.has(normalized)) return value;
  const numbered = normalized.match(/^(\d+)\s+(.+)$/);
  const replacement = dictionary[value] ?? dictionary[trimmed] ?? dictionary[normalized] ?? (numbered && dictionary[numbered[2]] ? `${numbered[1]} ${dictionary[numbered[2]]}` : undefined);
  if (!replacement) return value;
  const start = value.indexOf(trimmed);
  return `${value.slice(0, start)}${replacement}${value.slice(start + trimmed.length)}`;
}

function localize(root: Node, dictionary: Record<string, string>) {
  const base = root instanceof Document ? root.documentElement : root;
  if (base instanceof Element && base.closest("script,style,textarea,[data-no-auto-localize],[data-no-translate]")) return;
  const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = base;
  while (node) {
    if (node instanceof Text && !node.parentElement?.closest("script,style,textarea,[data-no-auto-localize],[data-no-translate]")) {
      let state = textState.get(node);
      if (!state) state = { source: node.data, rendered: node.data };
      else if (node.data !== state.rendered && node.data !== state.source) state = { source: node.data, rendered: node.data };
      const next = render(state.source, dictionary);
      state.rendered = next;
      textState.set(node, state);
      if (node.data !== next) node.data = next;
    } else if (node instanceof Element) {
      let states = attributeState.get(node);
      if (!states) { states = new Map(); attributeState.set(node, states); }
      for (const name of ["aria-label", "title", "placeholder", "alt"]) {
        const value = node.getAttribute(name);
        if (value === null) continue;
        let state = states.get(name);
        if (!state) state = { source: value, rendered: value };
        else if (value !== state.rendered && value !== state.source) state = { source: value, rendered: value };
        const next = render(state.source, dictionary);
        state.rendered = next;
        states.set(name, state);
        if (value !== next) node.setAttribute(name, next);
      }
    }
    node = walker.nextNode();
  }
}

function rewrite(root: ParentNode, locale: SiteLanguage) {
  const anchors = [...(root instanceof HTMLAnchorElement ? [root] : []), ...Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"))];
  for (const anchor of anchors) {
    if (anchor.target === "_blank" || anchor.hasAttribute("download")) continue;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) continue;
    const parts = url.pathname.split("/");
    if (parts[1] && ["zh", "en", "es", "ja", "ko", "fr", "de", "ru", "it", "pt", "ar", "hi"].includes(parts[1])) parts[1] = locale;
    else parts.splice(1, 0, locale);
    url.pathname = parts.join("/") || `/${locale}`;
    anchor.href = `${url.pathname}${url.search}${url.hash}`;
  }
}

export function LocaleRuntime({ locale }: { locale: SiteLanguage }) {
  useEffect(() => {
    rewrite(document, locale);
    const linkObserver = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => { if (node instanceof Element) rewrite(node, locale); })));
    linkObserver.observe(document.body, { childList: true, subtree: true });
    let observer: MutationObserver | undefined;
    let cancelled = false;
    if (locale !== "zh" && locale !== "en") void fetch(`/locales/public-interface/${locale}.json`, { cache: "no-cache" })
      .then(response => response.ok ? response.json() as Promise<Record<string, string>> : {})
      .then(shared => {
        if (cancelled) return;
        const dictionary = { ...shared, ...(homeInterfaceTranslations[locale] ?? {}) };
        localize(document, dictionary);
        observer = new MutationObserver(records => records.forEach(record => {
          record.addedNodes.forEach(node => localize(node, dictionary));
          if (record.type === "characterData" || record.type === "attributes") localize(record.target, dictionary);
        }));
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder", "alt"] });
      }).catch(() => undefined);
    return () => { cancelled = true; observer?.disconnect(); linkObserver.disconnect(); };
  }, [locale]);
  return null;
}
