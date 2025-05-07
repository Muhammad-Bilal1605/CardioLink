// ThemeSwitcher.jsx - Compact theme switcher for headers/navbars
import { useState } from 'react';
import { useTheme, recommendedMedicalThemes } from './ThemeProvider';
import { Moon, Sun, Palette } from 'lucide-react';

export const ThemeSwitcher = ({ compact = false }) => {
  const { currentTheme, setTheme, toggleLightDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  // Just show quick light/dark toggle if compact
  if (compact) {
    return (
      <button 
        onClick={toggleLightDark}
        className="btn btn-ghost btn-circle"
        aria-label="Toggle theme"
      >
        {currentTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }
  
  return (
    <div className="dropdown dropdown-end">
      <label 
        tabIndex={0} 
        className="btn btn-ghost btn-circle m-1" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Palette size={20} />
      </label>
      
      {isOpen && (
        <ul 
          tabIndex={0} 
          className="dropdown-content z-10 menu p-2 shadow bg-base-200 rounded-box w-52 mt-4"
          onBlur={() => setIsOpen(false)}
        >
          <li className="menu-title">Medical Themes</li>
          {recommendedMedicalThemes.map(theme => (
            <li key={theme}>
              <button 
                className={currentTheme === theme ? 'active' : ''} 
                onClick={() => setTheme(theme)}
              >
                {theme}
              </button>
            </li>
          ))}
          <li className="menu-title mt-2">Quick Toggle</li>
          <li>
            <button onClick={toggleLightDark}>
              {currentTheme === 'dark' ? (
                <><Sun size={16} /> Light mode</>
              ) : (
                <><Moon size={16} /> Dark mode</>
              )}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default ThemeSwitcher;