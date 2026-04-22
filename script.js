/* Configuración de Airtable */
const TOKEN = "patZFjogX1XgnDhuO.e131f470b23d3cfb8428aaf726a158ad460ed907dbaf1f9e777f904ca95407e3";
const BASE_ID = "appHNVXjYwymT0EVC";
let cache = { brands: [], cuisines: [], locations: [] };
let mainMap = null;

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
        
        console.log("Datos cargados correctamente");
        getNearbyLocations(); 

    } catch (e) {
        console.error("Error cargando datos de Airtable:", e);
    }
}

/* Modal con Mapa Corregido para Móvil (HTTPS) */
function openModal(brand) {
    const f = brand.fields;
    const personalHighlight = f.Highlight || "";
    const loc = cache.locations.find(l => l.fields.brand?.[0] === brand.id);

    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
        <img src="${f.photos?.[0]?.url || 'https://via.placeholder.com/600x300'}" style="width:100%; height:250px; object-fit:cover;">
        <div style="padding:25px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h2 style="color:var(--accent); margin:0; font-size:1.5rem;">${f.Name}</h2>
                <span style="background:var(--accent); color:white; padding:5px 12px; border-radius:10px; font-weight:800;">${f['Price Range'] || '$$'}</span>
            </div>

            ${personalHighlight ? `
                <div style="background: rgba(212, 175, 55, 0.1); border-radius: 12px; padding: 15px; border-left: 5px solid var(--accent); margin-bottom: 20px;">
                    <p style="margin: 0; font-style: italic; color: var(--text); font-size: 0.95rem;">"${personalHighlight}"</p>
                </div>` : ''}

            <div style="background:var(--bg-alt); padding:15px; border-radius:15px; border-left:6px solid var(--accent); margin:15px 0;">
                <p style="margin:0; font-weight:800; font-size:0.9rem;">🔥 MUST TRY: ${f['Must Try'] || 'Delicioso'}</p>
            </div>

            ${loc ? `
                <div style="margin-bottom:20px;">
                    <p style="font-size:0.85rem; margin-bottom:8px;">📍 <b>Dirección:</b> ${loc.fields.Address}</p>
                    <div style="width:100%; height:180px; border-radius:15px; overflow:hidden; border:2px solid var(--accent);">
                        <iframe width="100%" height="100%" frameborder="0" style="border:0" 
                        src="https://maps.google.com/maps?q=${loc.fields.Lat},${loc.fields.Lng}&hl=es&z=15&output=embed">
                        </iframe>
                    </div>
                </div>` : ''}
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <a href="${f.Website}" target="_blank" class="btn-main" style="text-decoration:none; text-align:center; font-size:0.8rem;">SITIO WEB</a>
                ${f.phone ? `<a href="tel:${f.phone}" class="btn-main" style="background:#1e293b; text-decoration:none; text-align:center; font-size:0.8rem;">LLAMAR</a>` : ''}
            </div>
        </div>`;
    document.getElementById('modal-detail').style.display = 'flex';
}

function openModalById(brandId) {
    const brand = cache.brands.find(b => b.id === brandId);
    if(brand) openModal(brand);
}

/* Cambio de idioma */
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
            p.innerHTML = `<div style="background:var(--bg-alt); padding:25px; border-radius:25px; border:2.5px solid var(--accent);">
                <p style="margin:0; font-size:1.2rem;"><b>${winner.fields.Name}</b></p>
                <div style="background:var(--accent); color:white; padding:12px; border-radius:12px; margin:12px 0; font-weight:800; font-size:0.8rem;">🔥 MUST TRY: ${winner.fields['Must Try'] || 'Delicioso'}</div>
                <button onclick="openModalById('${winner.id}')" class="btn-main">${translations[currentLang].view_details_btn}</button>
            </div>`;
            b.disabled = false;
        }, 800);
    }, 1000);
}

function closeModal() { document.getElementById('modal-detail').style.display = 'none'; }

/* --- FUNCIONES DE CERCANÍA --- */

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
        item.innerHTML = `<b>${i+1}. ${loc.brandInfo.fields.Name} ${loc.fields.Lookup || '📍'}</b><span>${loc.distance.toFixed(1)} millas</span>`;
        list.appendChild(item);
        L.marker([loc.fields.Lat, loc.fields.Lng]).addTo(mainMap).bindPopup(loc.brandInfo.fields.Name);
    });
    // Forzar actualización del tamaño del mapa (Fix para móviles)
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