import React, { useState, useEffect } from 'react';

export default function SettingsManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    username: '',
    email: '',
    volume: 70,
    onlineStatus: true,
    theme: 'dark',
    language: 'es',
    animations: true
  });

  const [saveStatus, setSaveStatus] = useState('GUARDAR CAMBIOS');

  // Función para cerrar y limpiar efectos
  const closePopup = () => {
    setIsOpen(false);
    document.body.classList.remove('popup-open-blur');
  };

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      document.body.classList.add('popup-open-blur');
    };

    const handleEsc = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') closePopup(); 
    };
    
    window.addEventListener('open-settings', handleOpen);
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('open-settings', handleOpen);
      window.removeEventListener('keydown', handleEsc);
      document.body.classList.remove('popup-open-blur');
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }

    if (!settings.animations) {
      document.documentElement.classList.add('no-animations');
    } else {
      document.documentElement.classList.remove('no-animations');
    }

    setSaveStatus('✅ AJUSTES APLICADOS');
    setTimeout(() => {
        setSaveStatus('GUARDAR CAMBIOS');
        closePopup();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={closePopup}>
      <div className="settings-panel-popup max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={closePopup} className="close-popup-icon">&times;</button>
        
        <form onSubmit={handleSave}>
          <div className="settings-grid">
            <div className="flex flex-col gap-6 md:gap-8">
              <section className="settings-section">
                <div className="section-header">
                  <i className="fas fa-user-circle"></i> <h2>CUENTA</h2>
                </div>
                <div className="setting-item">
                  <label>Nombre de usuario</label>
                  <input id="username" type="text" value={settings.username} onChange={handleChange} className="custom-input" />
                </div>
                <div className="setting-item">
                  <label>Correo electrónico</label>
                  <input id="email" type="email" value={settings.email} onChange={handleChange} className="custom-input" />
                </div>
              </section>

              <section className="settings-section">
                <div className="section-header">
                  <i className="fas fa-volume-up"></i> <h2>AUDIO</h2>
                </div>
                <div className="setting-item">
                  <div className="flex justify-between items-center mb-1">
                    <label>Volumen general</label>
                    <span className="value-badge">{settings.volume}%</span>
                  </div>
                  <input id="volume" type="range" min="0" max="100" value={settings.volume} onChange={handleChange} className="slider-range" />
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-6 md:gap-8">
              <section className="settings-section">
                <div className="section-header">
                  <i className="fas fa-shield-alt"></i> <h2>PRIVACIDAD E IDIOMA</h2>
                </div>
                <div className="setting-item horizontal">
                  <label>Estado en línea</label>
                  <label className="switch">
                    <input id="onlineStatus" type="checkbox" checked={settings.onlineStatus} onChange={handleChange} />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <label>Idioma</label>
                  <select id="language" value={settings.language} onChange={handleChange} className="custom-select">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </section>

              <section className="settings-section">
                <div className="section-header">
                  <i className="fas fa-paint-brush"></i> <h2>INTERFAZ</h2>
                </div>
                <div className="setting-item">
                  <label>Tema visual</label>
                  <select id="theme" value={settings.theme} onChange={handleChange} className="custom-select">
                    <option value="dark">Oscuro Premium</option>
                    <option value="light">Claro Marfil</option>
                  </select>
                </div>
                <div className="setting-item horizontal">
                  <label>Animaciones</label>
                  <label className="switch">
                    <input id="animations" type="checkbox" checked={settings.animations} onChange={handleChange} />
                    <span className="slider"></span>
                  </label>
                </div>
              </section>
            </div>
          </div>

          <div className="pt-10 flex justify-center">
            <button type="submit" className={`save-master-btn w-full md:w-auto ${saveStatus.includes('✅') ? 'bg-green-600' : ''}`}>
              <span>{saveStatus}</span>
            </button>
          </div>
        </form>
      </div>

      <style>{`
        /* Efecto de desenfoque al fondo */
        :global(body.popup-open-blur > *:not(.popup-overlay)) {
          filter: blur(8px);
          transition: filter 0.4s ease;
          pointer-events: none;
        }

        .popup-overlay {
          position: fixed; inset: 0; 
          background: rgba(0,0,0,0.4); 
          backdrop-filter: blur(4px); /* Blur suave en el overlay mismo */
          z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          overflow-y: auto;
          animation: fadeIn 0.3s ease;
        }
        
        .close-popup-icon {
          position: absolute; top: 1.5rem; right: 2rem;
          background: none; border: none; color: rgba(212, 175, 55, 0.5); font-size: 2.5rem;
          cursor: pointer; line-height: 1; transition: all 0.3s; z-index: 10;
        }
        .close-popup-icon:hover { transform: rotate(90deg); color: #d4af37; }

        .settings-panel-popup {
          background: rgba(10, 10, 10, 0.95); border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 30px; padding: 3.5rem; backdrop-filter: blur(20px);
          box-shadow: 0 30px 70px rgba(0,0,0,0.7);
          position: relative;
          width: 90%;
        }

        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
        @media (max-width: 1024px) { .settings-grid { grid-template-columns: 1fr; } }
        
        .settings-section { background: rgba(255, 255, 255, 0.03); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05); }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; color: #d4af37; font-family: 'Cinzel', serif; }
        .setting-item { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1rem; }
        .setting-item label { font-size: 0.75rem; font-weight: 600; color: #888; text-transform: uppercase; }
        .setting-item.horizontal { flex-direction: row; justify-content: space-between; align-items: center; }
        
        .custom-input, .custom-select { width: 100%; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(212, 175, 55, 0.2); padding: 0.8rem 1rem; border-radius: 8px; color: white; }
        
        .switch { position: relative; width: 50px; height: 26px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #333; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #d4af37; }
        input:checked + .slider:before { transform: translateX(22px); }
        
        .save-master-btn { background: linear-gradient(135deg, #d4af37, #996515); color: black; padding: 1rem 3rem; border-radius: 12px; font-weight: 900; font-family: 'Cinzel', serif; cursor: pointer; transition: 0.3s; border: none;}
        .value-badge { color: #d4af37; font-weight: bold; }
        .slider-range { width: 100%; accent-color: #d4af37; }

        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}