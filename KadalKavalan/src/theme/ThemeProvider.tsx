import React from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeColors, ThemeMode, ResolvedThemeMode, getThemeColors } from './colors';
import { spacing, radii } from './spacing';
import { typography } from './typography';
import { shadows, tabShadow } from './shadows';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  shadows: typeof shadows;
  tabShadow: ReturnType<typeof tabShadow>;
  setMode: (mode: ThemeMode) => void;
}

const THEME_MODE_KEY = '@kadal_kavalan_theme_mode';

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getResolvedMode(mode: ThemeMode, scheme: ColorSchemeName): ResolvedThemeMode {
  if (mode === 'dark') {
    return 'dark';
  }
  if (mode === 'light') {
    return 'light';
  }
  return scheme === 'dark' ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = React.useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = React.useState<ColorSchemeName>(Appearance.getColorScheme());

  React.useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((value) => {
        if (!mounted || !value) {
          return;
        }

        if (value === 'system' || value === 'light' || value === 'dark') {
          setModeState(value);
        }
      })
      .catch(() => {
        // Keep default mode when storage read fails.
      });

    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const setMode = React.useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, next).catch(() => {
      // Ignore storage persistence failures and continue with in-memory mode.
    });
  }, []);

  const resolvedMode = React.useMemo(() => getResolvedMode(mode, systemScheme), [mode, systemScheme]);
  const isDark = resolvedMode === 'dark';
  const colors = React.useMemo(() => getThemeColors(resolvedMode), [resolvedMode]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      isDark,
      colors,
      spacing,
      radii,
      typography,
      shadows,
      tabShadow: tabShadow(isDark),
      setMode,
    }),
    [mode, resolvedMode, isDark, colors, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};
