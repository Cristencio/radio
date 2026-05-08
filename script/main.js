// ================= CARREGAR ESTAÇÕES =================
let stationsData = [];
if (typeof window.estacoes !== 'undefined' && Array.isArray(window.estacoes)) {
    stationsData = window.estacoes;
} else if (typeof estacoes !== 'undefined' && Array.isArray(estacoes)) {
    stationsData = estacoes;
}
if (!stationsData.length) console.error("estacoesData.js não carregado ou vazio.");

// Normalização (apenas dados essenciais)
stationsData.forEach(est => {
    if (!est.imagem) est.imagem = `https://placehold.co/400/8e4b4c/white?text=${encodeURIComponent(est.nome.substring(0,3))}`;
    if (!est.urlStream || est.urlStream === "#") est.urlStream = "#";
    if (!est.desc) est.desc = "Estação de rádio";
    if (!est.regiao) est.regiao = "Moçambique";
    if (!est.categoria) est.categoria = "Variedades";
});

// ================= ESTADO GLOBAL =================
let currentStation = stationsData[0] || null;
let audio = new Audio();
let isPlaying = false;
let listenInterval = null, listenSeconds = 0, progressInterval = null;
let currentStationId = currentStation ? currentStation.id : null;
let isBuffering = false, bufferingTimeout = null;
let viewMode = 'all';  // 'all' ou 'favorites'

// Elementos DOM
const stationImg = document.getElementById('stationImg');
const stationNameEl = document.getElementById('stationName');
const stationFreqEl = document.getElementById('stationFreq');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const bufferSpinner = document.getElementById('bufferSpinner');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const listenTimeSpan = document.getElementById('listenTime');
const progressBarFill = document.getElementById('progressBarFill');
const playerStatusLed = document.getElementById('playerStatusLed');
const playerStatusText = document.getElementById('playerStatusText');

// Elementos da grelha (movidos para o topo)
const grid = document.getElementById('stationsGrid');
const searchInput = document.getElementById('searchInput');
const catSelect = document.getElementById('categoriaSelect');
const noResults = document.getElementById('noResultsMsg');

// ================= UI AUXILIAR =================
function showBuffering(show) {
    if (show && !isBuffering) {
        isBuffering = true;
        if (bufferSpinner) bufferSpinner.classList.remove('hidden');
        if (playPauseIcon) playPauseIcon.classList.add('hidden');
        if (playPauseBtn) playPauseBtn.classList.remove('play-pulse');
    } else if (!show && isBuffering) {
        isBuffering = false;
        if (bufferSpinner) bufferSpinner.classList.add('hidden');
        if (playPauseIcon) playPauseIcon.classList.remove('hidden');
        if (isPlaying && playPauseBtn) playPauseBtn.classList.add('play-pulse');
    }
}
function setPlayingAnimation(playing) {
    playing ? playPauseBtn.classList.add('play-pulse') : playPauseBtn.classList.remove('play-pulse');
}
function resetProgressBar() { if (progressBarFill) progressBarFill.style.width = '0%'; }
function startProgressAnimation() {
    if (progressInterval) clearInterval(progressInterval);
    if (!progressBarFill) return;
    resetProgressBar();
    progressInterval = setInterval(() => {
        if (isPlaying && progressBarFill) {
            let curr = parseFloat(progressBarFill.style.width) || 0;
            let inc = 0.35;
            let newW = curr + inc;
            if (newW >= 100) newW = 0;
            progressBarFill.style.width = `${newW}%`;
        }
    }, 80);
}
function stopProgressAnimation() { if (progressInterval) { clearInterval(progressInterval); progressInterval = null; } }
function startListenTimer() {
    if (listenInterval) clearInterval(listenInterval);
    listenSeconds = 0;
    if (listenTimeSpan) listenTimeSpan.innerText = "00:00";
    listenInterval = setInterval(() => {
        if (isPlaying) {
            listenSeconds++;
            const mins = Math.floor(listenSeconds / 60);
            const secs = listenSeconds % 60;
            if (listenTimeSpan) listenTimeSpan.innerText = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
        }
    }, 1000);
}
function stopListenTimer() { if (listenInterval) { clearInterval(listenInterval); listenInterval = null; } }
function updatePlayerUI() {
    if (!currentStation) return;
    stationNameEl.innerText = currentStation.nome;
    stationFreqEl.innerText = `${currentStation.regiao} · ${currentStation.categoria}`;
    stationImg.src = currentStation.imagem;
    resetProgressBar();
    if (playerStatusLed) playerStatusLed.className = "w-2 h-2 rounded-full bg-green-500";
    if (playerStatusText) playerStatusText.innerText = "AO VIVO";
}

// ================= RENDERIZAR GRADE (COMPACTA) =================
function escapeHtml(str) { return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

function renderGrid() {
    if (!stationsData.length) {
        if (grid) grid.innerHTML = '<div class="col-span-full text-center py-10">Nenhuma estação carregada</div>';
        return;
    }

    // 📌 Guardar a posição do scroll
    const scrollContainer = document.getElementById('stationsScrollContainer') || grid.parentElement;
    const previousScroll = scrollContainer ? scrollContainer.scrollTop : 0;

    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const cat = catSelect ? catSelect.value : 'todas';

    let filtered;
    if (viewMode === 'favorites') {
        const favList = RadioConfig.getFavorites();
        filtered = favList.map(fav => {
            const est = stationsData.find(s => s.id === fav.id);
            if (est) return est;
            return {
                id: fav.id,
                nome: fav.nome,
                desc: 'Estação não disponível',
                regiao: '',
                categoria: '',
                imagem: `https://placehold.co/400/8e4b4c/white?text=${encodeURIComponent(fav.nome.substring(0,3))}`,
                urlStream: '#',
            };
        }).filter(est => {
            if (cat !== 'todas' && est.categoria !== cat) return false;
            if (term && !est.nome.toLowerCase().includes(term) && !est.desc.toLowerCase().includes(term)) return false;
            return true;
        });
    } else {
        filtered = stationsData.filter(s => {
            if (cat !== 'todas' && s.categoria !== cat) return false;
            if (term && !s.nome.toLowerCase().includes(term) && !s.desc.toLowerCase().includes(term)) return false;
            return true;
        });
    }

    if (!filtered.length) {
        if (grid) grid.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    if (noResults) noResults.classList.add('hidden');

    const favorites = new Set(RadioConfig.getFavoriteIds());

    grid.innerHTML = filtered.map(s => {
        const isCurrentAndPlaying = (currentStation && s.id === currentStation.id && isPlaying);
        const isFav = favorites.has(s.id);

        const buttonHtml = isCurrentAndPlaying
            ? `<div class="mt-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-[10px] font-medium flex items-center justify-center gap-1 w-full">
                <div class="wave-animation"><span></span><span></span><span></span></div>
                <span>Tocando...</span>
               </div>`
            : (s.urlStream !== '#' 
                ? `<button data-id="${s.id}" class="ouvir-btn mt-2 bg-primary text-white px-2 py-1 rounded-full text-[13px] font-medium hover:bg-primary/90 transition flex items-center justify-center gap-1 w-full">
                    <span class="material-symbols-outlined text-[15px]">play_arrow</span> Ouvir
                   </button>`
                : `<div class="mt-2 text-[10px] text-stone-400 italic w-full text-center">Indisponível</div>`
              );

        return `
            <div class="station-card bg-surface-container-lowest rounded-lg border border-outline-variant p-5 flex flex-col h-full dark:bg-surface-container-lowest dark:border-outline-variant transition-all">
                <div class="flex-grow">
                    <div class="flex justify-between items-start gap-1">
                        <div>
                            <h3 class="font-bold text-sm leading-tight dark:text-stone-100">
                                ${escapeHtml(s.nome)}
                                ${s.categoria ? `<span class="inline-block px-1.5 py-0.5 rounded bg-primary-container/20 text-primary text-[10px] font-medium dark:bg-primary-container/20 dark:text-primary-container ml-1">
                                    ${escapeHtml(s.categoria)}
                                </span>` : ''}
                            </h3>
                        </div>
                        <span class="material-symbols-outlined text-stone-400 text-[16px]">radio</span>
                    </div>
                    <div class="mt-1">
                        <span class="text-xs font-normal text-stone-450 dark:text-stone-300">
                            ${escapeHtml(s.desc)}
                        </span>
                    </div>
                    <div class="flex gap-2 mt-1.5 text-secondary text-[10px]">
                        ${s.regiao ? `<span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">location_on</span> ${escapeHtml(s.regiao)}</span>` : ''}
                        <span class="flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">signal_cellular_alt</span> Digital</span>
                    </div>
                </div>
                <div class="flex items-center gap-1 mt-1.5">
                    <button class="fav-btn ml-auto text-lg ${isFav ? 'text-red-800' : 'text-stone-350'}" data-id="${s.id}" data-nome="${escapeHtml(s.nome)}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                        <span class="material-symbols-outlined text-[18px]">${isFav ? 'favorite' : 'favorite_border'}</span>
                    </button>
                    ${buttonHtml}
                </div>
            </div>
        `;
    }).join('');

    // 📌 Restaurar o scroll
    if (scrollContainer) {
        requestAnimationFrame(() => {
            scrollContainer.scrollTop = Math.min(previousScroll, scrollContainer.scrollHeight - scrollContainer.clientHeight);
        });
    }

    // Listeners
    document.querySelectorAll('.ouvir-btn').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const est = stationsData.find(e => e.id === id);
            if (est && est.urlStream !== '#') switchToStation(est);
        };
    });

    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const nome = btn.dataset.nome;
            RadioConfig.toggleFavorite(id, nome);
            renderGrid();
        };
    });
}

// ================= REPRODUÇÃO =================
async function switchToStation(newStation) {
    if (currentStation && newStation.id === currentStation.id) {
        if (isPlaying) {
            showPlayer();
            return;
        } else {
            pauseStream();
            showBuffering(true);
            if (audio.src !== newStation.urlStream) {
                audio.src = newStation.urlStream;
                audio.load();
            }
            try {
                await audio.play();
                isPlaying = true;
                playPauseIcon.innerText = 'pause';
                setPlayingAnimation(true);
                startListenTimer();
                startProgressAnimation();
                showBuffering(false);
                RadioConfig.addToHistory(newStation.id);
                renderGrid();
                showPlayer();
            } catch (err) {
                console.warn(err);
                alert("Não foi possível retomar a reprodução.");
                showBuffering(false);
            }
            return;
        }
    }

    if (isPlaying) {
        pauseStream();
    }

    currentStation = newStation;
    currentStationId = newStation.id;
    RadioConfig.setSetting('lastStationId', newStation.id);
    updatePlayerUI();

    showBuffering(true);

    if (audio._handlers) {
        audio.removeEventListener('waiting', audio._handlers.waiting);
        audio.removeEventListener('playing', audio._handlers.playing);
        audio.removeEventListener('canplay', audio._handlers.canplay);
        audio.removeEventListener('error', audio._handlers.error);
        delete audio._handlers;
    }

    if (audio.src !== newStation.urlStream) {
        audio.src = newStation.urlStream;
        audio.load();
    }

    const onWaiting = () => showBuffering(true);
    const onPlaying = () => { showBuffering(false); setPlayingAnimation(true); };
    const onCanPlay = () => { showBuffering(false); };
    const onError = () => {
        clearTimeout(bufferingTimeout);
        showBuffering(false);
        isPlaying = false;
        playPauseIcon.innerText = 'play_arrow';
        setPlayingAnimation(false);
        alert(`Não foi possível reproduzir "${newStation.nome}". O stream pode estar indisponível.`);
        renderGrid();
    };

    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio._handlers = { waiting: onWaiting, playing: onPlaying, canplay: onCanPlay, error: onError };

    try {
        await audio.play();
        isPlaying = true;
        playPauseIcon.innerText = 'pause';
        setPlayingAnimation(true);
        if (!listenInterval) startListenTimer();
        startProgressAnimation();
        if (bufferingTimeout) clearTimeout(bufferingTimeout);
        bufferingTimeout = setTimeout(() => {
            if (isPlaying && audio.paused) showBuffering(true);
        }, 500);
        RadioConfig.addToHistory(newStation.id);
        renderGrid();
        showPlayer();
    } catch (err) {
        console.warn(err);
        onError();
    }
}

function pauseStream() {
    audio.pause();
    isPlaying = false;
    playPauseIcon.innerText = 'play_arrow';
    setPlayingAnimation(false);
    stopProgressAnimation();
    stopListenTimer();
    showBuffering(false);
    if (audio._handlers) {
        audio.removeEventListener('waiting', audio._handlers.waiting);
        audio.removeEventListener('playing', audio._handlers.playing);
        audio.removeEventListener('canplay', audio._handlers.canplay);
        audio.removeEventListener('error', audio._handlers.error);
        delete audio._handlers;
    }
    renderGrid();
}

function togglePlayPause() {
    if (isPlaying) pauseStream();
    else if (currentStation) switchToStation(currentStation);
}

// ================= NAVEGAÇÃO ENTRE ESTAÇÕES =================
function playPrevious() {
    if (!stationsData.length) return;
    let idx = (stationsData.findIndex(s => s.id === currentStation.id) - 1 + stationsData.length) % stationsData.length;
    switchToStation(stationsData[idx]);
}
function playNext() {
    if (!stationsData.length) return;
    let idx = (stationsData.findIndex(s => s.id === currentStation.id) + 1) % stationsData.length;
    switchToStation(stationsData[idx]);
}
function setVolume(val) {
    let vol = Math.min(100, Math.max(0, val));
    audio.volume = vol / 100;
    if (volumeSlider) volumeSlider.value = vol;
    RadioConfig.setSetting('volume', vol);
}

playPauseBtn.addEventListener('click', togglePlayPause);
prevBtn.addEventListener('click', playPrevious);
nextBtn.addEventListener('click', playNext);
if (volumeSlider) volumeSlider.addEventListener('input', (e) => setVolume(e.target.value));
audio.addEventListener('pause', () => { isPlaying = false; playPauseIcon.innerText = 'play_arrow'; setPlayingAnimation(false); stopProgressAnimation(); showBuffering(false); renderGrid(); });
audio.addEventListener('play', () => { isPlaying = true; playPauseIcon.innerText = 'pause'; setPlayingAnimation(true); startProgressAnimation(); renderGrid(); });
audio.addEventListener('error', () => { if (isPlaying) { alert("Falha no stream."); pauseStream(); } });

const savedVolume = RadioConfig.getSetting('volume', 70);
setVolume(savedVolume);

// ================= TEMA (DARK/LIGHT) =================
const htmlElement = document.documentElement;
const headerThemeBtn = document.getElementById('headerThemeBtn');
const headerThemeIcon = document.getElementById('headerThemeIcon');

function setTheme(theme) {
    if (theme === 'dark') {
        htmlElement.classList.remove('light');
        htmlElement.classList.add('dark');
        if (headerThemeIcon) headerThemeIcon.innerText = 'dark_mode';
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.classList.add('light');
        if (headerThemeIcon) headerThemeIcon.innerText = 'light_mode';
    }
    RadioConfig.setSetting('theme', theme);
}

function initTheme() {
    const saved = RadioConfig.getSetting('theme', 'auto');
    if (saved === 'dark') {
        setTheme('dark');
    } else if (saved === 'light') {
        setTheme('light');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
    }
}

if (headerThemeBtn) headerThemeBtn.addEventListener('click', () => {
    const isDark = htmlElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
});
initTheme();

// ================= NAVEGAÇÃO ENTRE VIEWS =================
const stationsView = document.getElementById('stationsView');
const playerView = document.getElementById('playerView');
const navStations = document.getElementById('navStationsBtn');
const navPlayer = document.getElementById('navPlayerBtn');
const navLibrary = document.getElementById('navLibraryBtn');

function showStations() {
    viewMode = 'all';
    if (stationsView) stationsView.classList.remove('hidden');
    if (playerView) playerView.classList.add('hidden');
    if (navStations) {
        navStations.classList.add('text-primary-container', 'scale-105');
        navStations.classList.remove('text-stone-400');
    }
    if (navPlayer) {
        navPlayer.classList.remove('text-primary-container');
        navPlayer.classList.add('text-stone-400');
    }
    if (navLibrary) {
        navLibrary.classList.remove('text-primary-container');
        navLibrary.classList.add('text-stone-400');
    }
    if (!isPlaying) stopListenTimer();
    if (listenTimeSpan) listenTimeSpan.innerText = "00:00";
    resetProgressBar();
    stopProgressAnimation();
    renderGrid();
}

function showPlayer() {
    viewMode = 'all';
    if (stationsView) stationsView.classList.add('hidden');
    if (playerView) playerView.classList.remove('hidden');
    if (navPlayer) {
        navPlayer.classList.add('text-primary-container', 'scale-105');
        navPlayer.classList.remove('text-stone-400');
    }
    if (navStations) {
        navStations.classList.remove('text-primary-container');
        navStations.classList.add('text-stone-400');
    }
    if (navLibrary) {
        navLibrary.classList.remove('text-primary-container');
        navLibrary.classList.add('text-stone-400');
    }
    updatePlayerUI();
    if (isPlaying) {
        startListenTimer();
        startProgressAnimation();
        setPlayingAnimation(true);
    } else {
        if (listenInterval) stopListenTimer();
        stopProgressAnimation();
        resetProgressBar();
        setPlayingAnimation(false);
    }
}

function showFavorites() {
    viewMode = 'favorites';
    if (stationsView) stationsView.classList.remove('hidden');
    if (playerView) playerView.classList.add('hidden');
    if (navLibrary) {
        navLibrary.classList.add('text-primary-container', 'scale-105');
        navLibrary.classList.remove('text-stone-400');
    }
    if (navStations) {
        navStations.classList.remove('text-primary-container');
        navStations.classList.add('text-stone-400');
    }
    if (navPlayer) {
        navPlayer.classList.remove('text-primary-container');
        navPlayer.classList.add('text-stone-400');
    }
    stopListenTimer();
    stopProgressAnimation();
    resetProgressBar();
    renderGrid();
}

if (navStations) navStations.addEventListener('click', showStations);
if (navPlayer) navPlayer.addEventListener('click', showPlayer);
if (navLibrary) navLibrary.addEventListener('click', showFavorites);

// ================= RETOMAR ÚLTIMA ESTAÇÃO =================
const urlId = parseInt(new URLSearchParams(location.search).get('id'));
if (!isNaN(urlId) && stationsData.length) {
    const found = stationsData.find(s => s.id === urlId);
    if (found) switchToStation(found);
    else showStations();
} else {
    const lastId = RadioConfig.getSetting('lastStationId');
    if (lastId && stationsData.length) {
        const found = stationsData.find(s => s.id == lastId);
        if (found) {
            currentStation = found;
            currentStationId = found.id;
            updatePlayerUI();
            showStations();
        } else {
            showStations();
        }
    } else {
        showStations();
    }
}

// ================= LISTENERS DE BUSCA E CATEGORIA =================
if (searchInput) searchInput.addEventListener('input', renderGrid);
if (catSelect) catSelect.addEventListener('change', renderGrid);

// Primeira renderização
renderGrid();

// ================= LIMPEZA AO SAIR =================
window.addEventListener('beforeunload', () => {
    if (listenInterval) clearInterval(listenInterval);
    if (progressInterval) clearInterval(progressInterval);
    if (bufferingTimeout) clearTimeout(bufferingTimeout);
});