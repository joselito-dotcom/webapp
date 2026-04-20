/* Primero configuro mis llaves de Airtable y preparo un "cache" para guardar los datos y no pedirlos a cada rato */
const TOKEN = "patZFjogX1XgnDhuO.e131f470b23d3cfb8428aaf726a158ad460ed907dbaf1f9e777f904ca95407e3";
const BASE_ID = "appHNVXjYwymT0EVC";
let cache = { brands: [], cuisines: [], locations: [] };

/* Aquí guardo todas mis traducciones para que la página sea bilingüe (Español e Inglés) al instante */
const translations = {
    es: { 
        title: "The Best Experience", 
        subtitle: "Explora los 52 mejores sabores de San Francisco", 
        ruleta_title: "¿No sabes qué comer hoy?", 
        ruleta_btn: "🎰 ¡ELIGE POR MÍ!", 
        choose_nation: "Selecciona una Nación", 
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
        contact_title: "Suggestion Book",
        view_details_btn: "VIEW DETAILS",
        host_msg: '"My buddy <strong>Gadiel</strong> tried the Jalea from <strong>El Mono</strong> and was impressed... it\'s on another level!"'
    }
};

/* Esta función es el motor: se conecta a Airtable y descarga toda la info de los locales al cargar la página */
async function init() {
    const h = { Authorization: `Bearer ${TOKEN}` };
    const [rB, rC, rL] = await Promise.all([
        fetch(`https://api.airtable.com/v0/${BASE_ID}/Brands`, { headers: h }),
        fetch(`https://api.airtable.com/v0/${BASE_ID}/cuisines`, { headers: h }),
        fetch(`https://api.airtable.com/v0/${BASE_ID}/Locations`, { headers: h })
    ]);
    const b = await rB.json(); cache.brands = b.records;
    const c = await rC.json(); cache.cuisines = c.records;
    const l = await rL.json(); cache.locations = l.records;
}

/* Con esto hago que todos los textos cambien de idioma sin tener que recargar la web */
function changeLanguage(lang) {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        if (translations[lang][key]) el.innerHTML = translations[lang][key];
    });

    const prizeBtn = document.querySelector('#final-prize .btn-main');
    if (prizeBtn) {
        prizeBtn.innerText = translations[lang].view_details_btn;
    }
}

/* Aquí programo el switch de modo oscuro para que el botón cambie de Luna a Sol y se vea genial */
function toggleTheme() {
    const b = document.body;
    const isD = b.getAttribute('data-theme') === 'dark';
    b.setAttribute('data-theme', isD ? 'light' : 'dark');
    document.getElementById('theme-btn').innerText = isD ? '🌙' : '☀️';
}

/* Esta es la lógica de mi ruleta: primero elijo una nación al azar y luego un restaurante de esa nación */
async function startDobleSpin() {
    const d = document.getElementById('casino-display');
    const p = document.getElementById('final-prize');
    const b = document.getElementById('btn-spin');
    p.style.display = 'none'; d.style.display = 'block'; b.disabled = true;

    const nats = ["Peruvian", "Mexican", "Japanese", "Chinese", "Thai", "Salvadoran", "American"];
    for(let i=0; i<15; i++) { d.innerText = nats[Math.floor(Math.random()*nats.length)]; await new Promise(r=>setTimeout(r,70)); }
    const winNat = nats[Math.floor(Math.random()*nats.length)];
    d.innerText = "🌍 " + winNat;

    setTimeout(async () => {
        const filtered = cache.brands.filter(br => br.fields['cuisine type']?.some(id => cache.cuisines.find(x => x.id === id)?.fields.Name === winNat));
        for(let i=0; i<15; i++) { d.innerText = filtered[Math.floor(Math.random()*filtered.length)].fields.Name; await new Promise(r=>setTimeout(r,70)); }
        const winner = filtered[Math.floor(Math.random()*filtered.length)];
        d.innerText = "🍴 " + winner.fields.Name;

        setTimeout(() => {
            d.style.display = 'none'; p.style.display = 'block';
            const currentLang = document.querySelector('#lang-select').value || 'es';
            const btnLabel = translations[currentLang].view_details_btn;

            p.innerHTML = `<div style="background:var(--bg-alt); padding:30px; border-radius:25px; border:2.5px solid var(--accent);">
                <p style="margin:0; font-size:1.4rem;"><b>${winner.fields.Name}</b></p>
                <div style="background:var(--accent); color:white; padding:15px; border-radius:15px; margin:15px 0; font-weight:800;">🔥 MUST TRY: ${winner.fields['Must Try']}</div>
                <button onclick='openModal(${JSON.stringify(winner).replace(/'/g, "&apos;")})' class="btn-main">${btnLabel}</button>
            </div>`;
            b.disabled = false;
        }, 1000);
    }, 1200);
}

/* Aquí es donde armo la "Ficha Completa". Dibujo la foto, el precio, el rating y pongo los botones de Web y para Llamar */
function openModal(brand) {
    const f = brand.fields;
    document.getElementById('modal-body').innerHTML = `
        <img src="${f.photos?.[0]?.url || ''}" style="width:100%; height:300px; object-fit:cover;">
        <div style="padding:40px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h2 style="color:var(--accent); margin:0; font-size:2rem;">${f.Name}</h2>
                <span style="background:var(--accent); color:white; padding:8px 15px; border-radius:10px; font-weight:800;">${f['Price Range'] || '$$'}</span>
            </div>
            <p style="font-size:1.1rem; margin-bottom:20px;">⭐ ${f.Rating || '5.0'} | <span style="color:var(--accent); font-weight:800;">${f.Vibe || ''}</span></p>
            <p style="line-height:1.7; opacity:0.9;">${f.Description || 'Una joya gastronómica seleccionada para ti.'}</p>
            <div style="background:var(--bg-alt); padding:25px; border-radius:20px; border-left:8px solid var(--accent); margin:30px 0;">
                <p style="margin:0; font-style:italic;">"${f.Highlight || '¡La experiencia que estabas buscando!'}"</p>
                <hr style="border:0; border-top:1px solid var(--accent); margin:15px 0; opacity:0.3;">
                <p style="margin:0; font-weight:800;">🔥 MUST TRY: ${f['Must Try']}</p>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                <a href="${f.Website}" target="_blank" class="btn-main" style="text-decoration:none; text-align:center; display:flex; align-items:center; justify-content:center;">SITIO WEB</a>
                ${f.phone ? `<a href="tel:${f.phone}" class="btn-main" style="background:#1e293b; text-decoration:none; text-align:center; display:flex; align-items:center; justify-content:center;">LLAMAR</a>` : ''}
            </div>
        </div>`;
    document.getElementById('modal-detail').style.display = 'flex';
}

/* Esta función filtra los restaurantes según la bandera que presionaste y crea las tarjetitas con sus logos */
function showBrandsByText(name) {
    const c = document.getElementById('brands-container');
    document.getElementById('brands-section').style.display = 'block';
    c.innerHTML = "";
    cache.brands.filter(b => b.fields['cuisine type']?.some(id => cache.cuisines.find(x => x.id === id)?.fields.Name === name)).forEach(b => {
        const div = document.createElement('div'); div.className = 'brand-card'; div.onclick = () => openModal(b);
        div.innerHTML = `<img src="${b.fields.Logo?.[0]?.url || ''}"><p style="font-weight:800; color:var(--accent); margin-top:15px;">${b.fields.Name}</p>`;
        c.appendChild(div);
    });
    document.getElementById('brands-section').scrollIntoView({ behavior: 'smooth' });
}

/* Con esto cierro el modal de detalles cuando el usuario hace clic fuera o en la X */
function closeModal() { document.getElementById('modal-detail').style.display = 'none'; }

/* Aquí controlo mi carrusel para que las fotos pasen solas cada 3 segundos y la web se vea dinámica */
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[index].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

setInterval(nextSlide, 3000); 

init();