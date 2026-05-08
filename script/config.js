// ================= config.js (com favoritos como {id, nome}) =================
const RadioConfig = (() => {
  const STORAGE_KEY = 'radioAppData';

  let data = {
    settings: {
      theme: 'auto',
      volume: 70,
      lastStationId: null,
      language: 'pt',
      favorites: []   // [{ id: number, nome: string }]
    },
    history: []
  };

  const MAX_HISTORY = 50;

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        data.settings = { ...data.settings, ...(parsed.settings || {}) };
        if (!Array.isArray(data.settings.favorites)) {
          data.settings.favorites = [];
        }
        data.history = parsed.history || [];
      }
    } catch (e) {
      console.warn('Erro ao carregar configuração, usando padrões.', e);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao guardar configuração.', e);
    }
  }

  function init() {
    loadFromStorage();

    const oldTheme = localStorage.getItem('radioTheme');
    if (oldTheme && (oldTheme === 'dark' || oldTheme === 'light')) {
      data.settings.theme = oldTheme;
      localStorage.removeItem('radioTheme');
      saveToStorage();
    }
  }

  return {
    init,

    getSetting(key, defaultValue) {
      return data.settings.hasOwnProperty(key) ? data.settings[key] : defaultValue;
    },

    setSetting(key, value) {
      data.settings[key] = value;
      saveToStorage();
    },

    getAllSettings() { return { ...data.settings }; },

    addToHistory(stationId) {
      if (!stationId) return;
      if (data.history.length > 0 && data.history[0].stationId === stationId) {
        data.history[0].timestamp = Date.now();
      } else {
        data.history.unshift({ stationId, timestamp: Date.now() });
      }
      if (data.history.length > MAX_HISTORY) data.history.pop();
      saveToStorage();
    },

    getHistory() { return [...data.history]; },
    getRecentStationIds(limit = 10) {
      return data.history.slice(0, limit).map(h => h.stationId);
    },
    clearHistory() { data.history = []; saveToStorage(); },

    // ---------- FAVORITOS (como objetos) ----------
    toggleFavorite(stationId, stationName) {
      const favs = data.settings.favorites;
      const index = favs.findIndex(f => f.id === stationId);
      if (index === -1) {
        favs.push({ id: stationId, nome: stationName });
      } else {
        favs.splice(index, 1);
      }
      saveToStorage();
    },

    isFavorite(stationId) {
      return data.settings.favorites.some(f => f.id === stationId);
    },

    getFavorites() {
      // Retorna uma cópia da lista de objetos {id, nome}
      return [...data.settings.favorites];
    },

    getFavoriteIds() {
      return data.settings.favorites.map(f => f.id);
    },

    clearFavorites() {
      data.settings.favorites = [];
      saveToStorage();
    },

    resetSettings() {
      data.settings = {
        theme: 'auto',
        volume: 70,
        lastStationId: null,
        language: 'pt',
        favorites: []
      };
      saveToStorage();
    },

    clearAll() {
      data = {
        settings: {
          theme: 'auto',
          volume: 70,
          lastStationId: null,
          language: 'pt',
          favorites: []
        },
        history: []
      };
      saveToStorage();
    }
  };
})();

RadioConfig.init();