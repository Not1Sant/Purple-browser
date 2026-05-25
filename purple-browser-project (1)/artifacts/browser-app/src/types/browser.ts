export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  history: string[];
  historyIndex: number;
  isBlocked: boolean;
}

export interface LauncherSite {
  name: string;
  url: string;
  icon: string;
  color: string;
}
