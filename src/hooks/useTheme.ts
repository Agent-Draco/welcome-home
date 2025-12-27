import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  fontFamily: string;
  isDark: boolean;
}

export interface CustomTheme {
  id: string;
  user_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  font_family: string;
  is_dark: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'default',
    name: 'Ocean Breeze',
    primary: '178 60% 48%',
    secondary: '186 40% 65%',
    accent: '160 50% 50%',
    background: '180 30% 98%',
    foreground: '180 30% 10%',
    fontFamily: 'Inter',
    isDark: false,
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    primary: '20 90% 55%',
    secondary: '35 85% 60%',
    accent: '350 80% 55%',
    background: '40 30% 98%',
    foreground: '20 30% 10%',
    fontFamily: 'Poppins',
    isDark: false,
  },
  {
    id: 'forest',
    name: 'Forest Calm',
    primary: '140 50% 40%',
    secondary: '120 40% 50%',
    accent: '80 60% 45%',
    background: '120 20% 97%',
    foreground: '140 30% 10%',
    fontFamily: 'Nunito',
    isDark: false,
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    primary: '270 60% 55%',
    secondary: '250 50% 60%',
    accent: '290 70% 50%',
    background: '260 20% 8%',
    foreground: '260 10% 95%',
    fontFamily: 'Space Grotesk',
    isDark: true,
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    primary: '340 70% 55%',
    secondary: '320 60% 65%',
    accent: '0 80% 60%',
    background: '340 30% 98%',
    foreground: '340 30% 10%',
    fontFamily: 'Playfair Display',
    isDark: false,
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    primary: '180 100% 50%',
    secondary: '300 100% 60%',
    accent: '60 100% 50%',
    background: '240 20% 6%',
    foreground: '180 10% 95%',
    fontFamily: 'JetBrains Mono',
    isDark: true,
  },
];

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', className: 'font-sans' },
  { value: 'Poppins', label: 'Poppins', className: 'font-poppins' },
  { value: 'Nunito', label: 'Nunito', className: 'font-nunito' },
  { value: 'Space Grotesk', label: 'Space Grotesk', className: 'font-space' },
  { value: 'Playfair Display', label: 'Playfair Display', className: 'font-playfair' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', className: 'font-mono' },
];

export function useTheme() {
  const { user } = useAuth();
  const [activePreset, setActivePreset] = useState<string>('default');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [activeCustomTheme, setActiveCustomTheme] = useState<CustomTheme | null>(null);
  const [loading, setLoading] = useState(true);

  const applyTheme = useCallback((theme: ThemePreset | CustomTheme) => {
    const root = document.documentElement;
    const isDark = 'isDark' in theme ? theme.isDark : theme.is_dark;
    const primary = 'primary' in theme ? theme.primary : theme.primary_color;
    const secondary = 'secondary' in theme ? theme.secondary : theme.secondary_color;
    const accent = 'accent' in theme ? theme.accent : theme.accent_color;
    const background = 'background' in theme ? theme.background : theme.background_color;
    const foreground = 'foreground' in theme ? theme.foreground : theme.foreground_color;
    const fontFamily = 'fontFamily' in theme ? theme.fontFamily : theme.font_family;

    // Toggle dark mode class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply CSS variables
    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--background', background);
    root.style.setProperty('--foreground', foreground);
    root.style.setProperty('--font-sans', fontFamily);

    // Store in localStorage for persistence
    localStorage.setItem('theme-preset', 'id' in theme ? theme.id : 'custom');
    if (!('isDark' in theme)) {
      localStorage.setItem('custom-theme-id', theme.id);
    }
  }, []);

  const fetchUserThemes = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_themes')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setCustomThemes(data as CustomTheme[]);
    }
  }, [user]);

  const fetchUserPreference = useCallback(async () => {
    if (!user) {
      // Check localStorage for non-logged in users
      const savedPreset = localStorage.getItem('theme-preset');
      if (savedPreset && savedPreset !== 'custom') {
        const preset = THEME_PRESETS.find(p => p.id === savedPreset);
        if (preset) {
          setActivePreset(savedPreset);
          applyTheme(preset);
        }
      }
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('theme_preset, active_theme_id')
      .eq('id', user.id)
      .single();

    if (data) {
      if (data.active_theme_id) {
        const customTheme = customThemes.find(t => t.id === data.active_theme_id);
        if (customTheme) {
          setActiveCustomTheme(customTheme);
          applyTheme(customTheme);
        }
      } else if (data.theme_preset) {
        const preset = THEME_PRESETS.find(p => p.id === data.theme_preset);
        if (preset) {
          setActivePreset(data.theme_preset);
          applyTheme(preset);
        }
      }
    }
    setLoading(false);
  }, [user, customThemes, applyTheme]);

  useEffect(() => {
    fetchUserThemes();
  }, [fetchUserThemes]);

  useEffect(() => {
    fetchUserPreference();
  }, [fetchUserPreference]);

  const selectPreset = async (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setActivePreset(presetId);
    setActiveCustomTheme(null);
    applyTheme(preset);

    if (user) {
      await supabase
        .from('profiles')
        .update({ theme_preset: presetId, active_theme_id: null })
        .eq('id', user.id);
    }
  };

  const selectCustomTheme = async (theme: CustomTheme) => {
    setActiveCustomTheme(theme);
    setActivePreset('');
    applyTheme(theme);

    if (user) {
      await supabase
        .from('profiles')
        .update({ active_theme_id: theme.id, theme_preset: null })
        .eq('id', user.id);
    }
  };

  const createCustomTheme = async (theme: Omit<CustomTheme, 'id' | 'user_id'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_themes')
      .insert({
        user_id: user.id,
        name: theme.name,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        accent_color: theme.accent_color,
        background_color: theme.background_color,
        foreground_color: theme.foreground_color,
        font_family: theme.font_family,
        is_dark: theme.is_dark,
      })
      .select()
      .single();

    if (!error && data) {
      const newTheme = data as CustomTheme;
      setCustomThemes(prev => [...prev, newTheme]);
      return newTheme;
    }
    return null;
  };

  const deleteCustomTheme = async (themeId: string) => {
    if (!user) return;

    await supabase
      .from('user_themes')
      .delete()
      .eq('id', themeId);

    setCustomThemes(prev => prev.filter(t => t.id !== themeId));
    
    if (activeCustomTheme?.id === themeId) {
      selectPreset('default');
    }
  };

  return {
    activePreset,
    activeCustomTheme,
    customThemes,
    presets: THEME_PRESETS,
    fontOptions: FONT_OPTIONS,
    loading,
    selectPreset,
    selectCustomTheme,
    createCustomTheme,
    deleteCustomTheme,
    applyTheme,
  };
}
