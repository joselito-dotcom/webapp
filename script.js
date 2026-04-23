/* Configuración de Airtable */
const TOKEN = "patZFjogX1XgnDhuO.e131f470b23d3cfb8428aaf726a158ad460ed907dbaf1f9e777f904ca95407e3";
const BASE_ID = "appHNVXjYwymT0EVC";
let cache = { brands: [], cuisines: [], locations: [] };
let mainMap = null;
let modalMap = null; // Variable para el mapa del detalle

/* Traducciones */
const translations = {
    es: { 
        title: "The Best Experience", 
        subtitle: "Explora los 52 mejores sabores de San Francisco", 
        ruleta_title: "¿No sabes qué comer hoy?", 
        ruleta_btn: "🎰 ¡ELIGE POR MÍ!", 
        choose_nation: "Selecciona una Nación", 
        nearby_title: "📍 Los 5 más cercanos",
        contact_title: "Libro de Sugerencias",
        view_details_btn: "VER FICHA COMPLETA",
        host_msg: '"Mi compa <strong>Gadiel</strong> probó la Jalea de <strong>El Mono</strong> y quedó impresionado... ¡es otro nivel!"'
    },
    en: { 
        title: "The Best Experience", 
        subtitle: "Explore SF's 52 best flavors", 
        ruleta_title: "Don't know what to eat?", 
        ruleta_btn: "🎰 CHOOSE FOR ME!", 
        choose_nation: "Select a Nation", 
        nearby_title: "📍 The 5 Nearby",
        contact_title: "Suggestion Book",
        view_details_btn: "VIEW DETAILS",
        host_msg: '"My buddy <strong>Gadiel</strong> tried the Jalea from <strong>El Mono</strong> and was impressed... it\'s on another level!"'
    }
};

/* --- EFECTOS VISUALES (HUELLAS Y LLUVIA) --- */
document.addEventListener('mousedown', (e) => {
    const paw = document.createElement('div');
    paw.className = 'cat-paw-click';
    paw.style.left = `${e.pageX - 15}px`;
    paw.style.top = `${e.pageY - 15}px`;
    document.body.appendChild(paw);
    setTimeout(() => paw.remove(), 800);
});

function triggerBurgerRain() {
    const container = document.getElementById('burger-rain-container');
    if (!container) return;
    container.style.display = 'block';
    const items = ['🍔', '🍟', '🍕', '🌭', '🌮'];
    const interval = setInterval(() => {
        const drop = document.createElement('div');
        drop.className = 'food-drop';
        drop.innerText = items[Math.floor(Math.random() * items.length)];
        drop.style.left = Math.random() * 100 + 'vw';
        drop.style.animationDuration = (Math.random() * 2 + 1) + 's';
        container.appendChild(drop);
        setTimeout(() => drop.remove(), 3000);
    }, 150);
    setTimeout(() => { clearInterval(interval); setTimeout(() => container.style.display = 'none', 3000); }, 4500);
}

async function init() {
    try {
        const h = { Authorization: `Bearer ${TOKEN}` };
        const [rB, rC, rL] = await Promise.all([
            fetch(`https://api.airtable.com/v0/${BASE_ID}/Brands`, { headers: h }),
            fetch(`https://api.airtable.com/v0/${BASE_ID}/cuisines`, { headers: h }),
            fetch(`https://api.airtable.com/v0/${BASE_ID}/Locations`, { headers: h })
        ]);
        const b = await rB.json(); cache.brands = b.records || [];
        const c = await rC.json(); cache.cuisines = c.records || [];
        const l = await rL.json(); cache.locations = l.records || [];
        
        getNearbyLocations(); 
    } catch (e) { console.error("Error cargando Airtable:", e); }
}

/* Modal Corregido con Mapa Leaflet y Google Maps Link */
function openModal(brand) {
    const f = brand.fields;
    const rating = f.Rating || 0;
    const loc = cache.locations.find(l => l.fields.brand?.[0] === brand.id);
    const gMapsUrl = loc ? `https://www.google.com/maps/search/?api=1&query=${loc.fields.Lat},${loc.fields.Lng}` : "#";

    document.getElementById('modal-body').innerHTML = `
        <img src="${f.photos?.[0]?.url || 'https://via.placeholder.com/600x300'}" style="width:100%; height:250px; object-fit:cover; border-bottom:3px solid var(--accent);">
        <div style="padding:25px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h2 style="color:var(--accent); margin:0; text-transform:uppercase;">${f.Name}</h2>
                <span style="background:var(--accent); color:white; padding:5px 12px; border-radius:10px; font-weight:800;">${f['Price Range'] || '$$'}</span>
            </div>
            <div style="color:#ffb400; margin: 10px 0;">${'★'.repeat(Math.floor(rating))} (${rating})</div>
            <p style="margin: 15px 0; line-height: 1.5;">${f.Description || ''}</p>
            
            <div style="background:rgba(212,175,55,0.1); padding:15px; border-radius:12px; border-left:5px solid var(--accent); margin-bottom:15px;">
                <p style="margin:0; font-weight:800; color:var(--accent); font-size:0.75rem;">💡 HIGHLIGHT</p>
                <p style="margin:5px 0 0 0; font-style:italic;">"${f.Highlight || 'Reseña de Alek'}"</p>
            </div>

            <div style="background:var(--bg-alt); padding:15px; border-radius:12px; border-left:5px solid var(--accent); margin-bottom:20px;">
                <p style="margin:0; font-weight:800; color:var(--accent); font-size:0.75rem;">🔥 MUST TRY</p>
                <p style="margin:5px 0 0 0; font-weight:600;">${f['Must Try'] || 'Plato Jefe'}</p>
            </div>

            ${loc ? `
                <div style="margin-bottom:20px;">
                    <p style="font-size:0.9rem; margin-bottom:10px;">
                        <a href="${gMapsUrl}" target="_blank" style="color:var(--accent); font-weight:bold; text-decoration:underline;">📍 Dirección: ${loc.fields.Address}</a>
                    </p>
                    <div id="map-modal" onclick="window.open('${gMapsUrl}', '_blank')" style="height:200px; border-radius:15px; border:2px solid var(--accent); cursor:pointer;"></div>
                </div>` : ''}
            
            <div style="display:flex; gap:20px; margin-top:25px;">
                <a href="${f.Website}" target="_blank" class="btn-main" style="text-decoration:none; text-align:center; height:50px; flex:1; display:flex; align-items:center; justify-content:center;">WEB</a>
                <a href="tel:${f.phone}" class="btn-main" style="background:#475569; text-decoration:none; text-align:center; height:50px; flex:1; display:flex; align-items:center; justify-content:center;">CALL</a>
            </div>
        </div>`;
    
    document.getElementById('modal-detail').style.display = 'flex';

    if(loc) {
        setTimeout(() => {
            if(modalMap) modalMap.remove();
            modalMap = L.map('map-modal').setView([loc.fields.Lat, loc.fields.Lng], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(modalMap);
            L.marker([loc.fields.Lat, loc.fields.Lng]).addTo(modalMap);
            modalMap.invalidateSize();
        }, 300);
    }
}

function openModalById(brandId) {
    const brand = cache.brands.find(b => b.id === brandId);
    if(brand) openModal(brand);
}

function changeLanguage(lang) {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[lang] && translations[lang][key]) {
            el.innerHTML = translations[lang][key];
        }
    });
}

function toggleTheme() {
    const b = document.body;
    const isDark = b.getAttribute('data-theme') === 'dark';
    b.setAttribute('data-theme', isDark ? 'light' : 'dark');
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerText = isDark ? '🌙' : '☀️';
}

function showBrandsByText(name) {
    const c = document.getElementById('brands-container');
    const s = document.getElementById('brands-section');
    if (!c || !s) return;
    s.style.display = 'block';
    c.innerHTML = "";
    const filtered = cache.brands.filter(b => 
        b.fields['cuisine type']?.some(id => cache.cuisines.find(x => x.id === id)?.fields.Name === name)
    );
    filtered.forEach(b => {
        const div = document.createElement('div'); 
        div.className = 'brand-card'; 
        div.onclick = () => openModal(b);
        div.innerHTML = `<img src="${b.fields.Logo?.[0]?.url || 'https://via.placeholder.com/150'}"><p style="font-weight:800; color:var(--accent); margin-top:15px;">${b.fields.Name}</p>`;
        c.appendChild(div);
    });
    s.scrollIntoView({ behavior: 'smooth' });
}

async function startDobleSpin() {
    const d = document.getElementById('casino-display');
    const p = document.getElementById('final-prize');
    const b = document.getElementById('btn-spin');
    if(!d || !p || !b) return;
    p.style.display = 'none'; d.style.display = 'block'; b.disabled = true;
    
    triggerBurgerRain(); // Activa lluvia

    const nats = ["Peruvian", "Mexican", "Japanese", "Chinese", "Thai", "Salvadoran", "American"];
    for(let i=0; i<12; i++) { d.innerText = nats[Math.floor(Math.random()*nats.length)]; await new Promise(r=>setTimeout(r,80)); }
    const winNat = nats[Math.floor(Math.random()*nats.length)];
    d.innerText = "🌍 " + winNat;
    setTimeout(async () => {
        const filtered = cache.brands.filter(br => br.fields['cuisine type']?.some(id => cache.cuisines.find(x => x.id === id)?.fields.Name === winNat));
        if (filtered.length === 0) { d.innerText = "No hay locales"; b.disabled = false; return; }
        for(let i=0; i<12; i++) { d.innerText = filtered[Math.floor(Math.random()*filtered.length)].fields.Name; await new Promise(r=>setTimeout(r,80)); }
        const winner = filtered[Math.floor(Math.random()*filtered.length)];
        d.innerText = "🍴 " + winner.fields.Name;
        setTimeout(() => {
            d.style.display = 'none'; p.style.display = 'block';
            const currentLang = document.querySelector('#lang-select').value || 'es';
            p.innerHTML = `<div style="background:var(--bg-alt); padding:25px; border-radius:25px; border:2.5px solid var(--accent); text-align:center;">
                <p style="margin:0; font-size:1.2rem;"><b>${winner.fields.Name}</b></p>
                <div style="background:var(--accent); color:white; padding:12px; border-radius:12px; margin:12px 0; font-weight:800; font-size:0.8rem;">🔥 MUST TRY: ${winner.fields['Must Try'] || 'Delicioso'}</div>
                <button onclick="openModalById('${winner.id}')" class="btn-main">${translations[currentLang].view_details_btn}</button>
            </div>`;
            b.disabled = false;
        }, 800);
    }, 1000);
}

function closeModal() { document.getElementById('modal-detail').style.display = 'none'; }

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

function getNearbyLocations() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(position => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;
        let dists = cache.locations.map(loc => {
            const brandInfo = cache.brands.find(b => b.id === loc.fields.brand?.[0]);
            return { ...loc, brandInfo, distance: getDistance(uLat, uLng, loc.fields.Lat, loc.fields.Lng) };
        }).filter(item => item.brandInfo).sort((a, b) => a.distance - b.distance).slice(0, 5);
        renderNearby(dists, uLat, uLng);
    }, () => { console.warn("Ubicación denegada."); });
}

function renderNearby(top5, uLat, uLng) {
    const list = document.getElementById('nearby-list');
    if (!list) return;
    if (mainMap) mainMap.remove();
    mainMap = L.map('map-main').setView([uLat, uLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mainMap);
    L.marker([uLat, uLng]).addTo(mainMap).bindPopup("Tú estás aquí 📍").openPopup();
    list.innerHTML = "";
    top5.forEach((loc, i) => {
        const item = document.createElement('div');
        item.className = 'distance-item';
        item.onclick = () => openModal(loc.brandInfo);
        item.innerHTML = `<b>${i+1}. ${loc.brandInfo.fields.Name}</b><span>${loc.distance.toFixed(1)} millas</span>`;
        list.appendChild(item);
        L.marker([loc.fields.Lat, loc.fields.Lng]).addTo(mainMap).bindPopup(loc.brandInfo.fields.Name);
    });
    setTimeout(() => { mainMap.invalidateSize(); }, 500);
}

setInterval(() => {
    const s = document.querySelectorAll('.carousel-slide');
    if (!s.length) return;
    let idx = Array.from(s).findIndex(x => x.classList.contains('active'));
    s[idx].classList.remove('active');
    s[(idx + 1) % s.length].classList.add('active');
}, 3500);

init();