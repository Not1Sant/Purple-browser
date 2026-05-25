import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, RotateCw, Home, X, Plus, Maximize2, Minimize2,
  Shield, Lock, AlertTriangle, ExternalLink, RefreshCw, Search
} from "lucide-react";
import { Tab } from "@/types/browser";
import NewTabPage from "./NewTabPage";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeNewTab(url = ""): Tab {
  return {
    id: generateId(),
    title: url ? getDomainTitle(url) : "New Tab",
    url,
    isLoading: false,
    history: url ? [url] : [],
    historyIndex: url ? 0 : -1,
    isBlocked: false,
  };
}

function getDomainTitle(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const isUrl =
    /^https?:\/\//.test(trimmed) ||
    /^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed) ||
    /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/|$)/.test(trimmed);
  if (isUrl) {
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

function getDisplayUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "") + u.pathname + u.search;
  } catch {
    return url;
  }
}

export default function Browser() {
  const [tabs, setTabs] = useState<Tab[]>([makeNewTab()]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
  const [urlInput, setUrlInput] = useState("");
  const [urlFocused, setUrlFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blockedTabs, setBlockedTabs] = useState<Set<string>>(new Set());
  const iframeRefs = useRef<Map<string, HTMLIFrameElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    setUrlInput(activeTab?.url ?? "");
  }, [activeTabId, activeTab?.url]);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  function navigate(url: string, tabId?: string) {
    const tid = tabId ?? activeTabId;
    const tab = tabs.find((t) => t.id === tid);
    if (!url) return;
    const fullUrl = normalizeUrl(url);
    const newHistory = tab
      ? [...tab.history.slice(0, tab.historyIndex + 1), fullUrl]
      : [fullUrl];
    const newIndex = newHistory.length - 1;
    setBlockedTabs((prev) => {
      const next = new Set(prev);
      next.delete(tid);
      return next;
    });
    updateTab(tid, {
      url: fullUrl,
      title: getDomainTitle(fullUrl),
      isLoading: true,
      history: newHistory,
      historyIndex: newIndex,
      isBlocked: false,
    });
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(urlInput);
    setUrlFocused(false);
  }

  function goBack() {
    const tab = activeTab;
    if (!tab || tab.historyIndex <= 0) return;
    const newIndex = tab.historyIndex - 1;
    const url = tab.history[newIndex];
    setBlockedTabs((prev) => { const n = new Set(prev); n.delete(tab.id); return n; });
    updateTab(tab.id, { url, historyIndex: newIndex, isLoading: true, title: getDomainTitle(url), isBlocked: false });
  }

  function goForward() {
    const tab = activeTab;
    if (!tab || tab.historyIndex >= tab.history.length - 1) return;
    const newIndex = tab.historyIndex + 1;
    const url = tab.history[newIndex];
    setBlockedTabs((prev) => { const n = new Set(prev); n.delete(tab.id); return n; });
    updateTab(tab.id, { url, historyIndex: newIndex, isLoading: true, title: getDomainTitle(url), isBlocked: false });
  }

  function refresh() {
    const tab = activeTab;
    if (!tab?.url) return;
    setBlockedTabs((prev) => { const n = new Set(prev); n.delete(tab.id); return n; });
    const iframe = iframeRefs.current.get(tab.id);
    if (iframe) {
      try { iframe.src = iframe.src; } catch {}
    }
    updateTab(tab.id, { isLoading: true, isBlocked: false });
  }

  function goHome() {
    updateTab(activeTabId, { url: "", title: "New Tab", isLoading: false, isBlocked: false });
    setBlockedTabs((prev) => { const n = new Set(prev); n.delete(activeTabId); return n; });
    setUrlInput("");
  }

  function addTab() {
    const newTab = makeNewTab();
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setUrlInput("");
  }

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = makeNewTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      if (id === activeTabId) {
        const idx = prev.findIndex((t) => t.id === id);
        const nextActive = next[Math.min(idx, next.length - 1)];
        setActiveTabId(nextActive.id);
      }
      return next;
    });
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function handleIframeLoad(tabId: string) {
    updateTab(tabId, { isLoading: false });
  }

  function handleIframeError(tabId: string) {
    updateTab(tabId, { isLoading: false, isBlocked: true });
    setBlockedTabs((prev) => new Set([...prev, tabId]));
  }

  function openInNewTab(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const canBack = activeTab && activeTab.historyIndex > 0;
  const canForward = activeTab && activeTab.historyIndex < activeTab.history.length - 1;
  const isBlocked = blockedTabs.has(activeTabId);
  const hasUrl = !!activeTab?.url;

  const urlIsHttps = activeTab?.url?.startsWith("https://");

  return (
    <div
      ref={containerRef}
      className="flex flex-col w-full h-screen overflow-hidden select-none"
      style={{ background: "hsl(270 60% 8%)" }}
    >
      {/* ── Tab Bar ── */}
      <div
        className="flex items-end pl-2 pr-2 pt-2 gap-0.5 shrink-0 z-10"
        style={{
          background: "linear-gradient(180deg, hsl(270 55% 10%) 0%, hsl(270 50% 12%) 100%)",
          borderBottom: "1px solid hsl(270 30% 18%)",
          minHeight: 44,
        }}
      >
        <div className="flex items-end flex-1 gap-0.5 overflow-x-auto hide-scrollbar min-w-0">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`tab-item flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer min-w-0 flex-shrink-0 max-w-48 transition-all ${
                  isActive
                    ? "text-white"
                    : "text-purple-300/60 hover:text-purple-200/80"
                }`}
                style={{
                  background: isActive
                    ? "hsl(270 45% 15%)"
                    : "transparent",
                  borderTop: isActive ? "1px solid hsl(270 50% 30%)" : "1px solid transparent",
                  borderLeft: isActive ? "1px solid hsl(270 50% 25%)" : "1px solid transparent",
                  borderRight: isActive ? "1px solid hsl(270 50% 25%)" : "1px solid transparent",
                  position: "relative",
                  zIndex: isActive ? 2 : 1,
                }}
              >
                {tab.isLoading ? (
                  <div className="w-4 h-4 shrink-0">
                    <RefreshCw size={14} className="spinner text-purple-400" />
                  </div>
                ) : tab.url ? (
                  <img
                    src={getFaviconUrl(tab.url)}
                    alt=""
                    className="w-4 h-4 shrink-0 rounded-sm"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-4 h-4 shrink-0 rounded-sm flex items-center justify-center">
                    <Search size={11} className="text-purple-400/60" />
                  </div>
                )}
                <span className="text-xs font-medium truncate min-w-0 flex-1">
                  {tab.title || "New Tab"}
                </span>
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="w-4 h-4 shrink-0 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={addTab}
          className="flex items-center justify-center w-8 h-8 mb-1 ml-1 rounded-lg text-purple-400/70 hover:text-purple-200 hover:bg-white/5 transition-colors shrink-0"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-8 h-8 mb-1 ml-1 rounded-lg text-purple-400/70 hover:text-purple-200 hover:bg-white/5 transition-colors shrink-0"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* ── Navigation Bar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0"
        style={{
          background: "hsl(270 45% 13%)",
          borderBottom: "1px solid hsl(270 30% 17%)",
        }}
      >
        {/* Nav buttons */}
        <div className="flex items-center gap-1">
          <NavButton onClick={goBack} disabled={!canBack} title="Back">
            <ArrowLeft size={16} />
          </NavButton>
          <NavButton onClick={goForward} disabled={!canForward} title="Forward">
            <ArrowRight size={16} />
          </NavButton>
          <NavButton onClick={refresh} disabled={!hasUrl} title="Refresh">
            {activeTab?.isLoading ? <RotateCw size={16} className="spinner" /> : <RotateCw size={16} />}
          </NavButton>
          <NavButton onClick={goHome} title="Home">
            <Home size={16} />
          </NavButton>
        </div>

        {/* URL bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center min-w-0">
          <div className="flex-1 flex items-center rounded-lg px-3 py-1.5 gap-2 min-w-0 transition-all"
            style={{
              background: urlFocused ? "hsl(270 40% 17%)" : "hsl(270 40% 14%)",
              border: urlFocused
                ? "1.5px solid hsl(270 70% 55%)"
                : "1.5px solid hsl(270 30% 22%)",
              boxShadow: urlFocused ? "0 0 0 3px hsl(270 70% 55% / 0.15)" : "none",
            }}
          >
            {hasUrl && (
              <div className="shrink-0">
                {urlIsHttps ? (
                  <Lock size={13} className="text-green-400/80" />
                ) : (
                  <Shield size={13} className="text-yellow-400/80" />
                )}
              </div>
            )}
            <input
              type="text"
              value={urlFocused ? urlInput : (activeTab?.url ? getDisplayUrl(activeTab.url) : "")}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={() => {
                setUrlFocused(true);
                setUrlInput(activeTab?.url ?? "");
              }}
              onBlur={() => setUrlFocused(false)}
              placeholder="Search or enter address..."
              className="flex-1 text-sm bg-transparent outline-none text-white/90 placeholder-purple-400/40 min-w-0"
              style={{ caretColor: "hsl(270 80% 70%)" }}
            />
          </div>
        </form>
      </div>

      {/* ── Viewport ── */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ display: tab.id === activeTabId ? "block" : "none" }}
          >
            {!tab.url ? (
              <NewTabPage onNavigate={(url) => navigate(url, tab.id)} />
            ) : blockedTabs.has(tab.id) ? (
              <BlockedPage url={tab.url} onOpenExternal={() => openInNewTab(tab.url)} />
            ) : (
              <>
                {tab.isLoading && <LoadingBar />}
                <iframe
                  ref={(el) => {
                    if (el) iframeRefs.current.set(tab.id, el);
                    else iframeRefs.current.delete(tab.id);
                  }}
                  src={tab.url}
                  className="w-full h-full border-0"
                  title={tab.title}
                  onLoad={() => handleIframeLoad(tab.id)}
                  onError={() => handleIframeError(tab.id)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-modals"
                  allow="autoplay; fullscreen; microphone; camera; geolocation"
                  style={{ colorScheme: "normal" }}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function NavButton({ onClick, disabled, title, children }: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{
        color: disabled ? "hsl(270 20% 35%)" : "hsl(270 30% 70%)",
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = "hsl(270 30% 20%)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function LoadingBar() {
  return (
    <div className="absolute top-0 left-0 right-0 h-0.5 z-10 overflow-hidden" style={{ background: "hsl(270 40% 15%)" }}>
      <div
        className="h-full rounded-full"
        style={{
          background: "linear-gradient(90deg, hsl(270 80% 65%), hsl(280 90% 75%))",
          animation: "loading-bar 1.2s ease-in-out infinite",
          width: "40%",
        }}
      />
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}

function BlockedPage({ url, onOpenExternal }: { url: string; onOpenExternal: () => void }) {
  const domain = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  return (
    <div className="w-full h-full flex flex-col items-center justify-center iframe-blocked px-6 text-center">
      <div className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(270 40% 18%)" }}>
        <AlertTriangle size={32} className="text-yellow-400 pulse-glow" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">This page can't be embedded</h2>
      <p className="text-purple-300/60 text-sm max-w-md mb-1">
        <span className="text-purple-200/80 font-medium">{domain}</span> has blocked embedding in iframes.
      </p>
      <p className="text-purple-400/40 text-xs max-w-sm mb-8">
        This is a security policy set by the website — not a bug. Many sites like Google, YouTube, and social platforms block iframe embedding.
      </p>
      <button
        onClick={onOpenExternal}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{
          background: "hsl(270 70% 50%)",
          color: "white",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(270 70% 55%)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(270 70% 50%)")}
      >
        <ExternalLink size={15} />
        Open in new browser tab
      </button>
    </div>
  );
}
