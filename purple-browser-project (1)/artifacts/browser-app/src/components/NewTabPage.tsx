import { useState } from "react";
import { Search, Globe, BookOpen, Youtube, Calculator, Palette, Music, Gamepad2, Code2, FlaskConical, Map, Cloud } from "lucide-react";

interface LauncherSite {
  name: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

const LAUNCHER_SITES: LauncherSite[] = [
  { name: "Google", url: "https://www.google.com", icon: <Globe size={22} />, color: "#4285F4" },
  { name: "YouTube", url: "https://www.youtube.com", icon: <Youtube size={22} />, color: "#FF0000" },
  { name: "Khan Academy", url: "https://www.khanacademy.org", icon: <BookOpen size={22} />, color: "#14BF96" },
  { name: "Desmos", url: "https://www.desmos.com/calculator", icon: <Calculator size={22} />, color: "#006bb6" },
  { name: "Canva", url: "https://www.canva.com", icon: <Palette size={22} />, color: "#00C4CC" },
  { name: "Spotify", url: "https://open.spotify.com", icon: <Music size={22} />, color: "#1DB954" },
  { name: "Scratch", url: "https://scratch.mit.edu", icon: <Gamepad2 size={22} />, color: "#FF8C00" },
  { name: "CodePen", url: "https://codepen.io", icon: <Code2 size={22} />, color: "#ae63e4" },
  { name: "PhET Sims", url: "https://phet.colorado.edu", icon: <FlaskConical size={22} />, color: "#e8a400" },
  { name: "Google Maps", url: "https://maps.google.com", icon: <Map size={22} />, color: "#34A853" },
  { name: "Weather", url: "https://weather.com", icon: <Cloud size={22} />, color: "#00AEEF" },
  { name: "Replit", url: "https://replit.com", icon: <Code2 size={22} />, color: "#F26207" },
];

interface NewTabPageProps {
  onNavigate: (url: string) => void;
}

export default function NewTabPage({ onNavigate }: NewTabPageProps) {
  const [searchInput, setSearchInput] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const trimmed = searchInput.trim();
    const isUrl = /^(https?:\/\/|www\.)\S+/.test(trimmed) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/\S*)?$/.test(trimmed);
    if (isUrl) {
      onNavigate(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    } else {
      onNavigate(`https://www.google.com/search?q=${encodeURIComponent(trimmed)}`);
    }
    setSearchInput("");
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="w-full h-full flex flex-col items-center justify-start overflow-auto" style={{
      background: "linear-gradient(160deg, hsl(270 60% 8%) 0%, hsl(280 50% 11%) 40%, hsl(260 55% 10%) 100%)"
    }}>
      {/* Header / Clock */}
      <div className="flex flex-col items-center pt-14 pb-8">
        <div className="text-6xl font-light text-white/90 tracking-tight mb-1 tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
          {timeStr}
        </div>
        <div className="text-sm text-purple-300/70 font-medium">{dateStr}</div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="w-full max-w-2xl px-4 mb-10">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 text-purple-400/60 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search or enter address..."
            className="w-full pl-11 pr-5 py-3.5 rounded-2xl text-white/90 text-sm font-normal outline-none transition-all"
            style={{
              background: "hsl(270 40% 16%)",
              border: "1.5px solid hsl(270 30% 25%)",
              caretColor: "hsl(270 80% 70%)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1.5px solid hsl(270 70% 55%)";
              e.currentTarget.style.background = "hsl(270 40% 18%)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1.5px solid hsl(270 30% 25%)";
              e.currentTarget.style.background = "hsl(270 40% 16%)";
            }}
            autoFocus
          />
        </div>
      </form>

      {/* Launcher grid */}
      <div className="w-full max-w-3xl px-4 pb-10">
        <p className="text-xs text-purple-400/50 uppercase tracking-widest mb-4 font-semibold">Quick Launch</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {LAUNCHER_SITES.map((site) => (
            <button
              key={site.name}
              onClick={() => onNavigate(site.url)}
              className="launcher-item flex flex-col items-center gap-2 rounded-xl py-3 px-2 cursor-pointer select-none"
              style={{ background: "hsl(270 40% 14%)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${site.color}22`, color: site.color }}
              >
                {site.icon}
              </div>
              <span className="text-xs text-purple-100/70 font-medium truncate w-full text-center leading-tight">
                {site.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-auto pb-6 text-xs text-purple-500/30 text-center px-4">
        Note: Some websites block embedding in iframes — they will open in a new tab instead.
      </div>
    </div>
  );
}
