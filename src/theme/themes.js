/* Neo-Kinetic Travelogue — 8 themes × {light, dark}
 * Source of truth for palette tokens. Applied by the effect in App.jsx,
 * which writes CSS custom properties onto :root and also back-compat
 * aliases (`--accent`, `--bg-primary`, etc.) so existing components
 * keep working during the incremental restyle.
 */

export const THEMES = {
  'neo-kinetic': {
    label: 'Neo-Kinetic',
    light: { ink: '#0B0A1F', inkSoft: '#3A3758', inkMute: '#807DA0',
      paper: '#FAF7F2', paper2: '#F2ECE2', paper3: '#E8E0D0', panel: '#FFFFFF',
      indigo: '#4F46E5', coral: '#FF4D6D', yellow: '#FFD60A' },
    dark: { ink: '#F5F1E8', inkSoft: '#C9C3D9', inkMute: '#8A84A6',
      paper: '#1A1830', paper2: '#22203A', paper3: '#2D2A4A', panel: '#26233F',
      indigo: '#8B82FF', coral: '#FF7A93', yellow: '#FFE156' },
  },
  'duck-pond': {
    label: 'Duck Pond',
    light: { ink: '#1F2937', inkSoft: '#4B5563', inkMute: '#8B95A3',
      paper: '#F4EFEA', paper2: '#EBE5DF', paper3: '#DDD4C8', panel: '#FFFFFF',
      indigo: '#F9BC30', coral: '#2BA5FF', yellow: '#53DBC9' },
    dark: { ink: '#F4EFEA', inkSoft: '#D5CEC2', inkMute: '#938C80',
      paper: '#1F2329', paper2: '#262B33', paper3: '#30363F', panel: '#2C323B',
      indigo: '#FFCB5C', coral: '#57BDFF', yellow: '#7BE8D8' },
  },
  'citrus-grove': {
    label: 'Citrus Grove',
    light: { ink: '#1A1A1A', inkSoft: '#3D3D3D', inkMute: '#7A7A7A',
      paper: '#F5F5F0', paper2: '#EBEBE3', paper3: '#DDDDD2', panel: '#FFFFFF',
      indigo: '#E25D33', coral: '#FF8C42', yellow: '#7FB069' },
    dark: { ink: '#F5F5F0', inkSoft: '#CFCFC5', inkMute: '#8F8F85',
      paper: '#1F1E1A', paper2: '#27251F', paper3: '#322F27', panel: '#2A2822',
      indigo: '#FF8657', coral: '#FFB080', yellow: '#A3D28D' },
  },
  'electric-plum': {
    label: 'Electric Plum',
    light: { ink: '#17091F', inkSoft: '#3E1F4B', inkMute: '#7A5A88',
      paper: '#F7F2F9', paper2: '#EEE4F0', paper3: '#E0D0E4', panel: '#FFFFFF',
      indigo: '#7C2FAD', coral: '#E91E63', yellow: '#00D4A8' },
    dark: { ink: '#F7F2F9', inkSoft: '#D9C9DE', inkMute: '#9486A0',
      paper: '#1E0F26', paper2: '#271430', paper3: '#33193F', panel: '#2B1534',
      indigo: '#B366E0', coral: '#FF5A8F', yellow: '#3FE9BE' },
  },
  'harbor': {
    label: 'Harbor',
    light: { ink: '#0C1C2B', inkSoft: '#2E4456', inkMute: '#6E8293',
      paper: '#F2F6F8', paper2: '#E5EDF1', paper3: '#D3DFE6', panel: '#FFFFFF',
      indigo: '#0E7490', coral: '#F97068', yellow: '#FFBF3F' },
    dark: { ink: '#EEF4F6', inkSoft: '#BFCDD2', inkMute: '#7D8E97',
      paper: '#0F1F2B', paper2: '#162836', paper3: '#1E3144', panel: '#1A2C3C',
      indigo: '#3BB4CF', coral: '#FF9189', yellow: '#FFD26E' },
  },
  'monochrome': {
    label: 'Monochrome',
    light: { ink: '#0A0A0A', inkSoft: '#333333', inkMute: '#777777',
      paper: '#F6F4F0', paper2: '#EDE9E0', paper3: '#DED8CC', panel: '#FFFFFF',
      indigo: '#0A0A0A', coral: '#E53935', yellow: '#F6D34A' },
    dark: { ink: '#F6F4F0', inkSoft: '#C4C0B8', inkMute: '#8C887E',
      paper: '#1C1B18', paper2: '#23221F', paper3: '#2D2B26', panel: '#262521',
      indigo: '#F6F4F0', coral: '#FF6E66', yellow: '#FFDF5F' },
  },
  'lumina': {
    label: 'Lumina',
    light: { ink: '#1F1B2E', inkSoft: '#5A5470', inkMute: '#9691A8',
      paper: '#FBFAFD', paper2: '#F3F0F9', paper3: '#E8E3F2', panel: '#FFFFFF',
      indigo: '#8B7FD6', coral: '#F5A695', yellow: '#A8C9A8' },
    dark: { ink: '#F0EEF7', inkSoft: '#C7C1DB', inkMute: '#8D86A5',
      paper: '#1A1726', paper2: '#221E30', paper3: '#2D273F', panel: '#272238',
      indigo: '#B0A4F0', coral: '#FFBCAB', yellow: '#BFE0BF' },
  },
  'playful': {
    label: 'Playful',
    light: { ink: '#1A0B2E', inkSoft: '#3D2960', inkMute: '#7A6594',
      paper: '#FFF8F0', paper2: '#FFEEE0', paper3: '#FFDAC4', panel: '#FFFFFF',
      indigo: '#FF3DA5', coral: '#FF9A3C', yellow: '#A8E61D' },
    dark: { ink: '#FFF4E8', inkSoft: '#E5CFE0', inkMute: '#A18FB2',
      paper: '#1B0E2E', paper2: '#241340', paper3: '#301B52', panel: '#2A1648',
      indigo: '#FF6AB8', coral: '#FFAE5E', yellow: '#C4F04C' },
  },
};

export const THEME_IDS = Object.keys(THEMES);
export const DEFAULT_THEME = 'neo-kinetic';
export const DEFAULT_MODE = 'light';

/** Apply a theme palette to :root as Neo-Kinetic tokens + legacy aliases. */
export function applyTheme(themeId, mode) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const m = mode === 'dark' ? 'dark' : 'light';
  const c = theme[m];
  const isDark = m === 'dark';
  const root = document.documentElement;

  /* Neo-Kinetic tokens */
  root.style.setProperty('--ink', c.ink);
  root.style.setProperty('--ink-soft', c.inkSoft);
  root.style.setProperty('--ink-mute', c.inkMute);
  root.style.setProperty('--paper', c.paper);
  root.style.setProperty('--paper-2', c.paper2);
  root.style.setProperty('--paper-3', c.paper3);
  root.style.setProperty('--panel', c.panel);
  root.style.setProperty('--indigo', c.indigo);
  root.style.setProperty('--indigo-soft', isDark ? c.paper3 : '#EEEBFF');
  root.style.setProperty('--coral', c.coral);
  root.style.setProperty('--yellow', c.yellow);

  /* Status tokens — light uses brand palette; dark uses mixed tints */
  root.style.setProperty('--st-draft-bg', isDark ? c.paper3 : '#EDE6D6');
  root.style.setProperty('--st-draft-bd', isDark ? c.inkMute : '#B8AE95');
  root.style.setProperty('--st-pending-bg', isDark ? `color-mix(in srgb, ${c.coral} 28%, ${c.panel})` : '#FFE4E9');
  root.style.setProperty('--st-pending-bd', c.coral);
  root.style.setProperty('--st-approved-bg', isDark ? `color-mix(in srgb, ${c.yellow} 55%, ${c.panel})` : c.yellow);
  root.style.setProperty('--st-approved-bd', isDark ? c.yellow : c.ink);
  root.style.setProperty('--st-req-bg', isDark ? `color-mix(in srgb, ${c.indigo} 22%, ${c.panel})` : '#EEEBFF');
  root.style.setProperty('--st-req-bd', c.indigo);
  root.style.setProperty('--hol-bg', isDark ? `color-mix(in srgb, ${c.coral} 18%, ${c.panel})` : '#FFE4E9');
  root.style.setProperty('--hol-text', c.coral);

  /* Back-compat aliases for components that haven't been restyled yet */
  root.style.setProperty('--bg-primary', c.paper);
  root.style.setProperty('--bg-secondary', c.paper2);
  root.style.setProperty('--bg-panel', c.panel);
  root.style.setProperty('--text-primary', c.ink);
  root.style.setProperty('--text-secondary', c.inkSoft);
  root.style.setProperty('--accent', c.indigo);
  root.style.setProperty('--accent-secondary', c.coral);
  root.style.setProperty('--accent-alert', c.coral);
  root.style.setProperty('--border', c.paper3);
  root.style.setProperty('--topbar-bg', c.ink);
  root.style.setProperty('--topbar-text', c.paper);
  root.style.setProperty('--draft-bg', isDark ? c.paper3 : '#EDE6D6');
  root.style.setProperty('--draft-border', isDark ? c.inkMute : '#B8AE95');
  root.style.setProperty('--pending-bg', isDark ? `color-mix(in srgb, ${c.coral} 28%, ${c.panel})` : '#FFE4E9');
  root.style.setProperty('--pending-border', c.coral);
  root.style.setProperty('--approved-bg', isDark ? `color-mix(in srgb, ${c.yellow} 55%, ${c.panel})` : c.yellow);
  root.style.setProperty('--approved-border', isDark ? c.yellow : c.ink);
  root.style.setProperty('--requested-bg', isDark ? `color-mix(in srgb, ${c.indigo} 22%, ${c.panel})` : '#EEEBFF');
  root.style.setProperty('--requested-border', c.indigo);
  root.style.setProperty('--coverage-green', '#0EA89A');
  root.style.setProperty('--coverage-yellow', c.yellow);
  root.style.setProperty('--coverage-red', c.coral);
  root.style.setProperty('--holiday-bg', isDark ? `color-mix(in srgb, ${c.coral} 18%, ${c.panel})` : '#FFE4E9');
  root.style.setProperty('--holiday-border', c.coral);
  root.style.setProperty('--holiday-text', c.coral);
  root.style.setProperty('--holiday-stripe-color', `color-mix(in srgb, ${c.coral} 30%, transparent)`);

  document.body.setAttribute('data-theme', themeId);
  document.body.setAttribute('data-mode', m);
}
