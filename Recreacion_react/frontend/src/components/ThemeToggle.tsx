import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      aria-label={
        theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'
      }
    >
      {theme === 'dark' ? '☀' : '☽'}
    </button>
  );
}
