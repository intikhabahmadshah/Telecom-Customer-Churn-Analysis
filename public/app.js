/* ==============================================================================
   TELECOM CUSTOMER CHURN ANALYTICS - MAIN APPLICATION ENGINE
   MERN Architecture, Three.js 3D Horizon, GSAP Animations & Chart.js Visuals
   ============================================================================== */

// Global State & Data Cache
let masterCustomersList = [];
let activeFilteredCohort = [];

let chartContract = null;
let chartTenure = null;
let chartCharges = null;
let chartPayment = null;
let chartRecall = null;
let chartFeatures = null;

let tableCurrentPage = 1;
const tablePageLimit = 15;

// Bulletproof Boot: runs whether DOM is already ready or still loading
function bootDashboardEngine() {
    console.log('🚀 [Telecom Churn Analytics] Booting VIP Application Engine...');
    try { initThreeJS(); } catch(e) { console.error('Three.js Error:', e); }
    try { initGSAPAnimations(); } catch(e) { console.error('GSAP Error:', e); }
    try { initCard3DTilt(); } catch(e) { console.error('Tilt Error:', e); }
    try { initCharts(); } catch(e) { console.error('Charts Error:', e); }
    try { initSimulator(); } catch(e) { console.error('Simulator Error:', e); }
    try { initDatabaseExplorer(); } catch(e) { console.error('Explorer Error:', e); }
    
    loadMasterDataset().then(() => {
        try { initGlobalFilters(); } catch(e) { console.error('Filters Error:', e); }
    }).catch(err => {
        console.error('Master data load failed:', err);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDashboardEngine);
} else {
    bootDashboardEngine();
}

// -------------------------------------------------------------
// 1. THREE.JS 3D TELECOM HORIZON (BOTTOM TOWERS & SLOW SIGNALS)
// -------------------------------------------------------------
function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 26);

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // A. Ground Horizon Line & Signal Nodes
    const horizonGroup = new THREE.Group();
    scene.add(horizonGroup);

    const groundPoints = [
        new THREE.Vector3(-36, -14.0, -8),
        new THREE.Vector3(36, -14.0, -8)
    ];
    const groundGeo = new THREE.BufferGeometry().setFromPoints(groundPoints);
    const groundMat = new THREE.LineBasicMaterial({
        color: 0x0284C7,
        transparent: true,
        opacity: 0.35
    });
    const groundLine = new THREE.Line(groundGeo, groundMat);
    horizonGroup.add(groundLine);

    // B. 3D Telecom Towers drawn at the Bottom Ground Level
    const towerGroup = new THREE.Group();
    scene.add(towerGroup);

    const towersData = [
        { x: -17.5, y: -13.8, z: -8, height: 8.5, scale: 0.95 },
        { x: 0,     y: -14.0, z: -10, height: 10.5, scale: 1.15 },
        { x: 17.5,  y: -13.8, z: -8, height: 8.5, scale: 0.95 }
    ];

    const towerBeacons = [];

    towersData.forEach((t) => {
        const singleTower = new THREE.Group();
        singleTower.position.set(t.x, t.y, t.z);

        const h = t.height;
        const wBase = 2.4 * t.scale;
        const wTop = 0.5 * t.scale;

        const towerMat = new THREE.LineBasicMaterial({
            color: 0x0284C7,
            transparent: true,
            opacity: 0.65
        });

        const legPoints = [];
        const corners = [
            [-wBase, -wBase, -wTop, -wTop],
            [ wBase, -wBase,  wTop, -wTop],
            [ wBase,  wBase,  wTop,  wTop],
            [-wBase,  wBase, -wTop,  wTop]
        ];

        corners.forEach(([bx, bz, tx, tz]) => {
            legPoints.push(new THREE.Vector3(bx, 0, bz));
            legPoints.push(new THREE.Vector3(tx, h, tz));
        });

        // Lattice shelves & cross braces
        const levels = 6;
        for (let l = 1; l <= levels; l++) {
            const frac = l / levels;
            const curW = wBase + (wTop - wBase) * frac;
            const curY = h * frac;

            legPoints.push(new THREE.Vector3(-curW, curY, -curW));
            legPoints.push(new THREE.Vector3( curW, curY, -curW));

            legPoints.push(new THREE.Vector3( curW, curY, -curW));
            legPoints.push(new THREE.Vector3( curW, curY,  curW));

            legPoints.push(new THREE.Vector3( curW, curY,  curW));
            legPoints.push(new THREE.Vector3(-curW, curY,  curW));

            legPoints.push(new THREE.Vector3(-curW, curY,  curW));
            legPoints.push(new THREE.Vector3(-curW, curY, -curW));

            if (l < levels) {
                const nextFrac = (l + 1) / levels;
                const nextW = wBase + (wTop - wBase) * nextFrac;
                const nextY = h * nextFrac;

                legPoints.push(new THREE.Vector3(-curW, curY, -curW));
                legPoints.push(new THREE.Vector3( nextW, nextY, -nextW));

                legPoints.push(new THREE.Vector3( curW, curY,  curW));
                legPoints.push(new THREE.Vector3(-nextW, nextY,  nextW));
            }
        }

        // Antenna mast extending from apex
        const mastHeight = 3.2 * t.scale;
        legPoints.push(new THREE.Vector3(0, h, 0));
        legPoints.push(new THREE.Vector3(0, h + mastHeight, 0));

        // Cross dipoles
        legPoints.push(new THREE.Vector3(-1.3 * t.scale, h + mastHeight * 0.7, 0));
        legPoints.push(new THREE.Vector3( 1.3 * t.scale, h + mastHeight * 0.7, 0));

        legPoints.push(new THREE.Vector3(0, h + mastHeight * 0.45, -1.1 * t.scale));
        legPoints.push(new THREE.Vector3(0, h + mastHeight * 0.45,  1.1 * t.scale));

        const towerGeo = new THREE.BufferGeometry().setFromPoints(legPoints);
        const towerMesh = new THREE.LineSegments(towerGeo, towerMat);
        singleTower.add(towerMesh);

        // Blinking beacon LED at apex
        const beaconGeo = new THREE.SphereGeometry(0.4 * t.scale, 16, 16);
        const beaconMat = new THREE.MeshBasicMaterial({
            color: 0x0284C7,
            transparent: true,
            opacity: 0.95
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, h + mastHeight, 0);
        singleTower.add(beacon);

        // Pulsing Halo Aura
        const haloGeo = new THREE.RingGeometry(0.45 * t.scale, 1.2 * t.scale, 24);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x38BDF8,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.50
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(0, h + mastHeight, 0);
        singleTower.add(halo);

        const apexWorldY = t.y + h + mastHeight;
        towerBeacons.push({ beacon, halo, topY: apexWorldY, worldX: t.x });
        towerGroup.add(singleTower);
    });

    // C. Slowest Upward Radiating Signal Waves
    const waveCount = 28;
    const waveGroup = new THREE.Group();
    scene.add(waveGroup);

    function createWaveArcGeometry() {
        const arcPoints = [];
        const segments = 48;
        const spanAngle = Math.PI * 0.75;
        const startAngle = (Math.PI - spanAngle) / 2;

        for (let i = 0; i <= segments; i++) {
            const angle = startAngle + (i / segments) * spanAngle;
            const x = Math.cos(angle);
            const y = Math.sin(angle) * 0.45;
            arcPoints.push(new THREE.Vector3(x, y, 0));
        }
        return new THREE.BufferGeometry().setFromPoints(arcPoints);
    }

    const baseArcGeo = createWaveArcGeometry();
    const wavePalette = [0x0284C7, 0x0EA5E9, 0x2563EB, 0x059669, 0x7C3AED];
    const waves = [];

    const bottomYLimit = -4.0;
    const topYLimit = 16.0;
    const totalTravel = topYLimit - bottomYLimit;

    for (let i = 0; i < waveCount; i++) {
        const tower = towerBeacons[i % towerBeacons.length];
        const color = wavePalette[i % wavePalette.length];

        const waveMat = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.55
        });

        const waveMesh = new THREE.Line(baseArcGeo, waveMat);
        const initialY = tower.topY + (i * 0.72);
        const progress = Math.max(0, (initialY - tower.topY) / totalTravel);

        waveMesh.position.set(tower.worldX, initialY, -2);
        const curScale = 1.2 + progress * 26;
        waveMesh.scale.set(curScale, curScale, 1);

        waveGroup.add(waveMesh);

        waves.push({
            mesh: waveMesh,
            tower: tower,
            y: initialY,
            speed: 0.007 + (Math.random() * 0.003), // Calm, slow pace
            scale: curScale,
            maxScale: 28 + Math.random() * 6,
            baseOpacity: 0.55
        });
    }

    // D. Slow Upward Signal Pointers with Smooth Fading
    const pointerCount = 45;
    const pointerGroup = new THREE.Group();
    scene.add(pointerGroup);

    function createPointerMarker() {
        const pts = [
            new THREE.Vector3(0, -0.4, 0),
            new THREE.Vector3(0.25, 0, 0),
            new THREE.Vector3(0, 0.4, 0),
            new THREE.Vector3(-0.25, 0, 0),
            new THREE.Vector3(0, -0.4, 0),
            new THREE.Vector3(0, -1.4, 0)
        ];
        return new THREE.BufferGeometry().setFromPoints(pts);
    }

    const pointerGeo = createPointerMarker();
    const pointers = [];

    for (let i = 0; i < pointerCount; i++) {
        const col = wavePalette[i % wavePalette.length];
        const pMat = new THREE.LineBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.50
        });

        const pMesh = new THREE.Line(pointerGeo, pMat);
        const startX = (Math.random() - 0.5) * 44;
        const startY = -4 + Math.random() * 20;
        const startZ = -4 + Math.random() * 6;
        const sc = 0.5 + Math.random() * 0.4;

        pMesh.position.set(startX, startY, startZ);
        pMesh.scale.set(sc, sc, sc);
        pointerGroup.add(pMesh);

        pointers.push({
            mesh: pMesh,
            mat: pMat,
            x: startX,
            y: startY,
            z: startZ,
            speed: 0.006 + Math.random() * 0.004,
            pulseOffset: Math.random() * Math.PI * 2
        });
    }

    // E. Render Loop with Smooth Camera Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.0005;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.0005;
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let clock = 0;

    function animate() {
        requestAnimationFrame(animate);
        clock += 0.015;

        // Pulse beacon LEDs
        towerBeacons.forEach((tb, idx) => {
            const pulse = (Math.sin(clock * 1.8 + idx) + 1) * 0.5;
            tb.beacon.scale.setScalar(0.9 + pulse * 0.3);
            tb.halo.scale.setScalar(1 + pulse * 0.5);
            tb.halo.material.opacity = 0.22 + pulse * 0.35;
        });

        // Upward waves & smooth fading
        waves.forEach((w) => {
            w.y += w.speed;

            const progress = Math.max(0, Math.min(1, (w.y - w.tower.topY) / totalTravel));
            w.scale = 1.2 + progress * w.maxScale;
            w.mesh.scale.set(w.scale, w.scale * 0.85, 1);
            w.mesh.position.y = w.y;

            let alpha = 0;
            if (w.y < 3) {
                alpha = w.baseOpacity;
            } else if (w.y < 9) {
                alpha = w.baseOpacity * 0.75;
            } else {
                const fadeProgress = (topYLimit - w.y) / (topYLimit - 9);
                alpha = Math.max(0, w.baseOpacity * 0.75 * Math.pow(fadeProgress, 1.4));
            }
            w.mesh.material.opacity = alpha;

            if (w.y > topYLimit) {
                w.y = w.tower.topY;
                w.mesh.position.x = w.tower.worldX + (Math.random() - 0.5) * 1.5;
                w.scale = 1.2;
            }
        });

        // Upward floating pointers
        pointers.forEach((p) => {
            p.y += p.speed;

            const drift = Math.sin(clock + p.pulseOffset) * 0.006;
            p.mesh.position.x += drift;
            p.mesh.position.y = p.y;

            let pAlpha = 0.50;
            if (p.y < 2) {
                pAlpha = 0.50;
            } else if (p.y < 8) {
                pAlpha = 0.40;
            } else {
                const fade = Math.max(0, (topYLimit - p.y) / (topYLimit - 8));
                pAlpha = 0.40 * Math.pow(fade, 1.2);
            }
            p.mat.opacity = pAlpha;

            if (p.y > topYLimit) {
                p.y = -3.5 - Math.random() * 2;
                p.mesh.position.x = (Math.random() - 0.5) * 44;
            }
        });

        // Smooth camera damping
        targetX += (mouseX - targetX) * 0.04;
        targetY += (mouseY - targetY) * 0.04;

        camera.position.x = targetX * 8;
        camera.position.y = -targetY * 6;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
    }
    animate();
}

// -------------------------------------------------------------
// 2. GSAP TIMELINES & SCROLLTRIGGER ANIMATIONS
// -------------------------------------------------------------
function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // A. Hero entrance timeline
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.85 } });
    tl.from('.vip-navbar', { y: -35, opacity: 0, duration: 0.65 })
      .from('.hero-pill-badge', { scale: 0.88, opacity: 0, duration: 0.45 }, '-=0.25')
      .from('.hero-headline', { y: 22, opacity: 0, duration: 0.65 }, '-=0.25')
      .from('.hero-description', { y: 18, opacity: 0, duration: 0.55 }, '-=0.35')
      .from('.hero-cta-group', { y: 15, opacity: 0, duration: 0.45 }, '-=0.25')
      .from('.hero-status-card', { x: 35, opacity: 0, duration: 0.65 }, '-=0.45');

    // B. Staggered KPI Cards entrance
    gsap.from('.kpi-card', {
        y: 35,
        opacity: 0,
        scale: 0.96,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power2.out',
        delay: 0.4
    });

    // C. Section ScrollTrigger animations
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.utils.toArray('.vip-section, .filter-bar-section').forEach((section) => {
            gsap.from(section, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                y: 30,
                opacity: 0,
                duration: 0.75,
                ease: 'power2.out'
            });
        });

        // Diagnostic chart cards stagger
        gsap.utils.toArray('.grid-2col').forEach((grid) => {
            gsap.from(grid.children, {
                scrollTrigger: {
                    trigger: grid,
                    start: 'top 82%',
                    toggleActions: 'play none none none'
                },
                y: 25,
                opacity: 0,
                duration: 0.65,
                stagger: 0.14,
                ease: 'power2.out'
            });
        });

        // Recommendation Pillars stagger
        gsap.from('.rec-pillar-card', {
            scrollTrigger: {
                trigger: '.rec-pillars-grid',
                start: 'top 80%',
                toggleActions: 'play none none none'
            },
            y: 30,
            opacity: 0,
            scale: 0.97,
            duration: 0.65,
            stagger: 0.12,
            ease: 'power2.out'
        });

        // Governance mentors stagger
        gsap.from('.gov-card', {
            scrollTrigger: {
                trigger: '.gov-grid',
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            y: 25,
            opacity: 0,
            duration: 0.6,
            stagger: 0.10,
            ease: 'power2.out'
        });
    }

    // D. Trigger initial counter animations
    animateCounter('counter-subscribers', 7043);
    animateCounter('counter-churn', 26.54, 2);
    animateCounter('counter-risk', 139128);
    animateCounter('counter-recall', 82.09, 2);
}

function animateCounter(id, target, decimals = 0) {
    const el = document.getElementById(id);
    if (!el) return;

    if (typeof gsap === 'undefined') {
        el.innerText = decimals > 0 ? target.toFixed(decimals) : Math.round(target).toLocaleString();
        return;
    }

    const currentVal = parseFloat(el.innerText.replace(/,/g, '')) || 0;
    const obj = { val: currentVal };
    gsap.to(obj, {
        val: target,
        duration: 1.3,
        ease: 'power2.out',
        onUpdate: () => {
            if (decimals > 0) {
                el.innerText = obj.val.toFixed(decimals);
            } else {
                el.innerText = Math.round(obj.val).toLocaleString();
            }
        }
    });
}

// -------------------------------------------------------------
// 3. INTERACTIVE 3D CARD HOVER TILTING (VIP LUXURY FEEL)
// -------------------------------------------------------------
function initCard3DTilt() {
    const cards = document.querySelectorAll('[data-tilt], .vip-card, .kpi-card, .sim-card, .gov-card, .rec-pillar-card');
    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const rotateX = -(y / rect.height) * 7;
            const rotateY = (x / rect.width) * 7;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

// -------------------------------------------------------------
// 4. CHART.JS VISUALIZATIONS (BULLETPROOF FACTORY & LIGHT THEME)
// -------------------------------------------------------------
function safeCreateChart(canvasId, config) {
    if (typeof Chart === 'undefined') return null;
    const existing = Chart.getChart(canvasId);
    if (existing) {
        existing.destroy();
    }
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    return new Chart(canvas, config);
}

function initCharts() {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js library is not loaded.');
        return;
    }

    Chart.defaults.color = '#475569';
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.font.size = 11;

    // 1. Contract Churn Chart
    chartContract = safeCreateChart('chart-contract', {
        type: 'bar',
        data: {
            labels: ['Month-to-month', 'One year', 'Two year'],
            datasets: [{
                label: 'Churn Rate (%)',
                data: [42.71, 11.27, 2.83],
                backgroundColor: ['#E11D48', '#0284C7', '#059669'],
                borderColor: ['#BE123C', '#0369A1', '#047857'],
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const clickedContract = ['Month-to-month', 'One year', 'Two year'][index];
                    const contractSelect = document.getElementById('global-filter-contract');
                    if (contractSelect) {
                        contractSelect.value = (contractSelect.value === clickedContract) ? 'All' : clickedContract;
                        applyDashboardFilters();
                    }
                }
            },
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 60,
                    grid: { color: 'rgba(15, 23, 42, 0.06)' },
                    ticks: { callback: (v) => v + '%' }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // 2. Tenure Lifecycle Chart
    chartTenure = safeCreateChart('chart-tenure', {
        type: 'line',
        data: {
            labels: ['0-12 Mo (First Year)', '13-24 Mo', '25-48 Mo', '49-72 Mo (Loyal)'],
            datasets: [{
                label: 'Cohort Churn Rate (%)',
                data: [47.44, 28.71, 14.50, 7.39],
                borderColor: '#0284C7',
                backgroundColor: 'rgba(2, 132, 199, 0.12)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0284C7',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 9
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 65,
                    grid: { color: 'rgba(15, 23, 42, 0.06)' },
                    ticks: { callback: (v) => v + '%' }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // 3. Monthly Bill Ranges Chart
    chartCharges = safeCreateChart('chart-charges', {
        type: 'bar',
        data: {
            labels: ['<$35 (Budget)', '$35-$70', '$70-$100 (High Risk)', '>$100 (Premium)'],
            datasets: [{
                label: 'Churn Rate (%)',
                data: [10.87, 24.35, 37.23, 31.85],
                backgroundColor: ['#059669', '#0284C7', '#E11D48', '#7C3AED'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 50,
                    grid: { color: 'rgba(15, 23, 42, 0.06)' },
                    ticks: { callback: (v) => v + '%' }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // 4. Payment Method Friction Chart
    chartPayment = safeCreateChart('chart-payment', {
        type: 'bar',
        data: {
            labels: ['Electronic Check', 'Mailed Check', 'Bank Transfer (Auto)', 'Credit Card (Auto)'],
            datasets: [{
                label: 'Churn Rate (%)',
                data: [45.29, 19.11, 16.71, 15.24],
                backgroundColor: ['#E11D48', '#94A3B8', '#0284C7', '#059669'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (e, elements) => {
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    const mapping = [
                        'Electronic check',
                        'Mailed check',
                        'Bank transfer (automatic)',
                        'Credit card (automatic)'
                    ];
                    const clicked = mapping[index];
                    const paySelect = document.getElementById('global-filter-payment');
                    if (paySelect) {
                        paySelect.value = (paySelect.value === clicked) ? 'All' : clicked;
                        applyDashboardFilters();
                    }
                }
            },
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 60,
                    grid: { color: 'rgba(15, 23, 42, 0.06)' },
                    ticks: { callback: (v) => v + '%' }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // 5. Model Churner Catch Comparison
    chartRecall = safeCreateChart('chart-recall', {
        type: 'bar',
        data: {
            labels: ['Logistic Regression', 'Decision Tree', 'Random Forest'],
            datasets: [
                {
                    label: 'Standard Model',
                    data: [55.88, 48.66, 48.93],
                    backgroundColor: '#94A3B8',
                    borderRadius: 6
                },
                {
                    label: 'Tuned Balanced Model',
                    data: [78.34, 49.20, 82.09],
                    backgroundColor: '#0284C7',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, color: '#334155' } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(15, 23, 42, 0.06)' },
                    ticks: { callback: (v) => v + '%' }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // 6. Top 15 Feature Importances
    chartFeatures = safeCreateChart('chart-features', {
        type: 'bar',
        data: {
            labels: [
                'Two-Year Contract',
                'Tenure (Months with Company)',
                'One-Year Contract',
                'Fiber Optic Service',
                'Total Bill Charges',
                'Monthly Charges',
                'Electronic Check Payment',
                'No Tech Support',
                'No Online Security',
                'Paperless Billing',
                'Streaming Movies / TV',
                'Senior Citizen Status',
                'No Online Backup',
                'Multiple Phone Lines',
                'Has Partner / Spouse'
            ],
            datasets: [{
                label: 'Importance Weight',
                data: [0.185, 0.162, 0.124, 0.108, 0.095, 0.082, 0.064, 0.045, 0.038, 0.026, 0.021, 0.016, 0.014, 0.011, 0.009],
                backgroundColor: 'rgba(2, 132, 199, 0.85)',
                borderColor: '#0284C7',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(15, 23, 42, 0.06)' }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

// -------------------------------------------------------------
// 5. MASTER DATA LOADING & INTERACTIVE CROSS-FILTERING
// -------------------------------------------------------------
async function loadMasterDataset() {
    try {
        const res = await fetch('/api/customers?all=true');
        const json = await res.json();
        if (json && json.data) {
            masterCustomersList = json.data;
            activeFilteredCohort = masterCustomersList;
            renderCustomerTableData();
        }
    } catch (e) {
        console.warn('Could not load master customer records:', e);
    }
}

function initGlobalFilters() {
    const filterContract = document.getElementById('global-filter-contract');
    const filterInternet = document.getElementById('global-filter-internet');
    const filterPayment = document.getElementById('global-filter-payment');
    const filterChurn = document.getElementById('global-filter-churn');
    const btnReset = document.getElementById('btn-reset-filters');

    if (filterContract) filterContract.addEventListener('change', applyDashboardFilters);
    if (filterInternet) filterInternet.addEventListener('change', applyDashboardFilters);
    if (filterPayment) filterPayment.addEventListener('change', applyDashboardFilters);
    if (filterChurn) filterChurn.addEventListener('change', applyDashboardFilters);

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            const fc = document.getElementById('global-filter-contract');
            const fi = document.getElementById('global-filter-internet');
            const fp = document.getElementById('global-filter-payment');
            const fch = document.getElementById('global-filter-churn');
            const dbSearch = document.getElementById('db-search');

            if (fc) fc.value = 'All';
            if (fi) fi.value = 'All';
            if (fp) fp.value = 'All';
            if (fch) fch.value = 'All';
            if (dbSearch) dbSearch.value = '';

            applyDashboardFilters();
        });
    }
}

function applyDashboardFilters() {
    if (!masterCustomersList || masterCustomersList.length === 0) return;

    const contractSelect = document.getElementById('global-filter-contract');
    const internetSelect = document.getElementById('global-filter-internet');
    const paymentSelect = document.getElementById('global-filter-payment');
    const churnSelect = document.getElementById('global-filter-churn');

    const contractVal = contractSelect?.value || 'All';
    const internetVal = internetSelect?.value || 'All';
    const paymentVal = paymentSelect?.value || 'All';
    const churnVal = churnSelect?.value || 'All';

    // Highlight active filters with CSS class
    contractSelect?.classList.toggle('active-filter', contractVal !== 'All');
    internetSelect?.classList.toggle('active-filter', internetVal !== 'All');
    paymentSelect?.classList.toggle('active-filter', paymentVal !== 'All');
    churnSelect?.classList.toggle('active-filter', churnVal !== 'All');

    // 1. Cross-filter master dataset
    activeFilteredCohort = masterCustomersList.filter((c) => {
        if (contractVal !== 'All' && c.Contract !== contractVal) return false;
        if (internetVal !== 'All' && c.InternetService !== internetVal) return false;
        if (paymentVal !== 'All' && c.PaymentMethod !== paymentVal) return false;
        if (churnVal !== 'All' && c.Churn !== churnVal) return false;
        return true;
    });

    const total = activeFilteredCohort.length;
    const churnedUsers = activeFilteredCohort.filter(c => c.Churn === 'Yes');
    const churnCount = churnedUsers.length;
    const churnRate = total > 0 ? (churnCount / total * 100) : 0;
    const revenueRisk = churnedUsers.reduce((sum, c) => sum + (parseFloat(c.MonthlyCharges) || 0), 0);

    // 2. Transform KPI Cards with smooth GSAP count-up
    animateCounter('counter-subscribers', total);
    animateCounter('counter-churn', churnRate, 2);
    animateCounter('counter-risk', Math.round(revenueRisk));

    const subTrend = document.getElementById('kpi-sub-trend');
    if (subTrend) {
        subTrend.innerHTML = total === masterCustomersList.length 
            ? `&check; 100% Verified in Dataset`
            : `&check; Showing Filtered Cohort`;
    }

    const churnTrend = document.getElementById('kpi-churn-count');
    if (churnTrend) {
        churnTrend.innerHTML = `&nearr; ${churnCount.toLocaleString()} Customers Left`;
    }

    const revTrend = document.getElementById('kpi-revenue-trend');
    if (revTrend) {
        const annualLost = Math.round(revenueRisk * 12 / 1000);
        revTrend.innerHTML = `&#9888; $${annualLost}k Annual Loss`;
    }

    // 3. Update Active Filter Status Badge
    const filterBadge = document.getElementById('active-filter-badge');
    if (filterBadge) {
        if (total === masterCustomersList.length) {
            filterBadge.innerHTML = `<svg class="label-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Showing: All 7,043 Customers`;
        } else {
            const activeTags = [];
            if (contractVal !== 'All') activeTags.push(contractVal);
            if (internetVal !== 'All') activeTags.push(internetVal);
            if (paymentVal !== 'All') activeTags.push(paymentVal);
            if (churnVal !== 'All') activeTags.push(churnVal === 'Yes' ? 'Churned' : 'Retained');
            filterBadge.innerHTML = `<svg class="label-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> Filtered: ${total.toLocaleString()} of 7,043 (${activeTags.join(', ')})`;
        }
    }

    // 4. Transform Contract Chart
    if (chartContract) {
        const contractStats = ['Month-to-month', 'One year', 'Two year'].map(ct => {
            const group = activeFilteredCohort.filter(c => c.Contract === ct);
            return group.length > 0 ? (group.filter(c => c.Churn === 'Yes').length / group.length * 100) : 0;
        });
        chartContract.data.datasets[0].data = contractStats;
        chartContract.update('active');
    }

    // 5. Transform Tenure Chart
    if (chartTenure) {
        const brackets = [
            { min: 0, max: 12 },
            { min: 13, max: 24 },
            { min: 25, max: 48 },
            { min: 49, max: 72 }
        ];
        const tenureStats = brackets.map(b => {
            const group = activeFilteredCohort.filter(c => {
                const t = parseInt(c.tenure) || 0;
                return t >= b.min && t <= b.max;
            });
            return group.length > 0 ? (group.filter(c => c.Churn === 'Yes').length / group.length * 100) : 0;
        });
        chartTenure.data.datasets[0].data = tenureStats;
        chartTenure.update('active');
    }

    // 6. Transform Monthly Bill Chart
    if (chartCharges) {
        const billRanges = [
            { min: 0, max: 34.99 },
            { min: 35, max: 69.99 },
            { min: 70, max: 99.99 },
            { min: 100, max: 9999 }
        ];
        const billStats = billRanges.map(b => {
            const group = activeFilteredCohort.filter(c => {
                const mc = parseFloat(c.MonthlyCharges) || 0;
                return mc >= b.min && mc <= b.max;
            });
            return group.length > 0 ? (group.filter(c => c.Churn === 'Yes').length / group.length * 100) : 0;
        });
        chartCharges.data.datasets[0].data = billStats;
        chartCharges.update('active');
    }

    // 7. Transform Payment Method Chart
    if (chartPayment) {
        const pMethods = [
            'Electronic check',
            'Mailed check',
            'Bank transfer (automatic)',
            'Credit card (automatic)'
        ];
        const payStats = pMethods.map(pm => {
            const group = activeFilteredCohort.filter(c => c.PaymentMethod === pm);
            return group.length > 0 ? (group.filter(c => c.Churn === 'Yes').length / group.length * 100) : 0;
        });
        chartPayment.data.datasets[0].data = payStats;
        chartPayment.update('active');
    }

    // 8. Transform Database Explorer Table
    tableCurrentPage = 1;
    renderCustomerTableData();

    // 9. Update Contextual Insights
    const insightContract = document.getElementById('insight-contract');
    if (insightContract) {
        if (contractVal === 'Month-to-month') {
            insightContract.innerHTML = `<strong>Selected Filter: Month-to-Month contracts</strong> suffer the highest loss (${churnRate.toFixed(1)}% churn). In this group, <strong>$${Math.round(revenueRisk).toLocaleString()}/mo</strong> is at immediate risk.`;
        } else if (contractVal === 'Two year') {
            insightContract.innerHTML = `<strong>Selected Filter: 2-Year contracts</strong> are highly stable (${churnRate.toFixed(1)}% churn). Long-term agreements eliminate customer loss.`;
        } else {
            insightContract.innerHTML = `<strong>Month-to-month contracts (42.71% churn)</strong> account for over 88% of all lost customers. Switching customers to 1-Year or 2-Year contracts is the best way to keep them.`;
        }
    }
}

// -------------------------------------------------------------
// 6. DATABASE EXPLORER TABLE & PAGINATION
// -------------------------------------------------------------
function initDatabaseExplorer() {
    const searchInput = document.getElementById('db-search');
    const contractSelect = document.getElementById('db-filter-contract');
    const churnSelect = document.getElementById('db-filter-churn');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            tableCurrentPage = 1;
            renderCustomerTableData();
        }, 250));
    }

    if (contractSelect) {
        contractSelect.addEventListener('change', (e) => {
            const globalFilter = document.getElementById('global-filter-contract');
            if (globalFilter) globalFilter.value = e.target.value;
            applyDashboardFilters();
        });
    }

    if (churnSelect) {
        churnSelect.addEventListener('change', (e) => {
            const globalFilter = document.getElementById('global-filter-churn');
            if (globalFilter) globalFilter.value = e.target.value;
            applyDashboardFilters();
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (tableCurrentPage > 1) {
                tableCurrentPage--;
                renderCustomerTableData();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const source = getActiveTableSource();
            const totalPages = Math.ceil(source.length / tablePageLimit);
            if (tableCurrentPage < totalPages) {
                tableCurrentPage++;
                renderCustomerTableData();
            }
        });
    }
}

function getActiveTableSource() {
    const search = (document.getElementById('db-search')?.value || '').toLowerCase().trim();
    let source = activeFilteredCohort && activeFilteredCohort.length > 0 ? activeFilteredCohort : masterCustomersList;

    if (search) {
        source = source.filter(c => 
            (c.customerID && c.customerID.toLowerCase().includes(search)) ||
            (c.Contract && c.Contract.toLowerCase().includes(search)) ||
            (c.PaymentMethod && c.PaymentMethod.toLowerCase().includes(search)) ||
            (c.InternetService && c.InternetService.toLowerCase().includes(search))
        );
    }
    return source;
}

function renderCustomerTableData() {
    const tbody = document.getElementById('customers-tbody');
    const pageInfo = document.getElementById('pagination-info');
    const pageInd = document.getElementById('page-indicator');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (!tbody) return;

    const source = getActiveTableSource();
    const total = source.length;
    const totalPages = Math.max(1, Math.ceil(total / tablePageLimit));

    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 24px; color: #64748B;">No customer records match your filter criteria.</td></tr>`;
        if (pageInfo) pageInfo.innerText = `Showing 0 records`;
        if (pageInd) pageInd.innerText = `Page 1 of 1`;
        if (btnPrev) btnPrev.disabled = true;
        if (btnNext) btnNext.disabled = true;
        return;
    }

    if (tableCurrentPage > totalPages) tableCurrentPage = totalPages;

    const startIdx = (tableCurrentPage - 1) * tablePageLimit;
    const endIdx = Math.min(total, startIdx + tablePageLimit);
    const pageRows = source.slice(startIdx, endIdx);

    tbody.innerHTML = pageRows.map(c => {
        const isChurn = c.Churn === 'Yes';
        const badgeClass = isChurn ? 'status-badge-churned' : 'status-badge-retained';
        return `
            <tr>
                <td><strong>${c.customerID}</strong></td>
                <td>${c.gender || 'N/A'}</td>
                <td>${c.tenure || '0'} mo</td>
                <td>${c.Contract || 'N/A'}</td>
                <td>${c.InternetService || 'None'}</td>
                <td>${c.PaymentMethod || 'N/A'}</td>
                <td>$${parseFloat(c.MonthlyCharges || 0).toFixed(2)}</td>
                <td>$${parseFloat(c.TotalCharges || 0).toFixed(2)}</td>
                <td><span class="${badgeClass}">${isChurn ? 'CHURNED' : 'RETAINED'}</span></td>
            </tr>
        `;
    }).join('');

    if (pageInfo) pageInfo.innerText = `Showing records ${(startIdx + 1).toLocaleString()} - ${endIdx.toLocaleString()} of ${total.toLocaleString()}`;
    if (pageInd) pageInd.innerText = `Page ${tableCurrentPage} of ${totalPages}`;

    if (btnPrev) btnPrev.disabled = tableCurrentPage <= 1;
    if (btnNext) btnNext.disabled = tableCurrentPage >= totalPages;
}

// -------------------------------------------------------------
// 7. REAL-TIME CHURN RISK CALCULATOR & SIMULATOR
// -------------------------------------------------------------
function initSimulator() {
    const sliderTenure = document.getElementById('sim-tenure');
    const badgeTenure = document.getElementById('tenure-badge');
    const sliderCharges = document.getElementById('sim-charges');
    const badgeCharges = document.getElementById('charges-badge');
    const btnPredict = document.getElementById('btn-predict');

    if (sliderTenure && badgeTenure) {
        sliderTenure.addEventListener('input', (e) => {
            badgeTenure.innerText = `${e.target.value} Months`;
        });
    }

    if (sliderCharges && badgeCharges) {
        sliderCharges.addEventListener('input', (e) => {
            badgeCharges.innerText = `$${parseFloat(e.target.value).toFixed(2)} / mo`;
        });
    }

    if (btnPredict) {
        btnPredict.addEventListener('click', runPrediction);
    }
}

async function runPrediction() {
    const contract = document.getElementById('sim-contract')?.value || 'Month-to-month';
    const internet = document.getElementById('sim-internet')?.value || 'Fiber optic';
    const payment = document.getElementById('sim-payment')?.value || 'Electronic check';
    const paperless = document.getElementById('sim-paperless')?.value || 'Yes';
    const security = document.getElementById('sim-security')?.value || 'No';
    const tech = document.getElementById('sim-tech')?.value || 'No';
    const tenure = parseInt(document.getElementById('sim-tenure')?.value || '3');
    const monthly = parseFloat(document.getElementById('sim-charges')?.value || '85');

    const payload = {
        Contract: contract,
        InternetService: internet,
        PaymentMethod: payment,
        PaperlessBilling: paperless,
        OnlineSecurity: security,
        TechSupport: tech,
        tenure: tenure,
        MonthlyCharges: monthly,
        TotalCharges: tenure * monthly
    };

    const btn = document.getElementById('btn-predict');
    if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Calculating Churn Risk...`;
        btn.disabled = true;
    }

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.success) {
            updateSimulatorUI(data.probability_pct, data.is_churn, data.recommendations);
        } else {
            fallbackLocalPrediction(payload);
        }
    } catch (err) {
        fallbackLocalPrediction(payload);
    } finally {
        if (btn) {
            btn.innerHTML = `<svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg> Calculate Churn Risk Score`;
            btn.disabled = false;
        }
    }
}

function fallbackLocalPrediction(p) {
    let score = 0.45;
    if (p.Contract === 'Month-to-month') score += 0.32;
    if (p.Contract === 'Two year') score -= 0.35;
    if (p.Contract === 'One year') score -= 0.18;

    if (p.PaymentMethod === 'Electronic check') score += 0.18;
    if (p.PaymentMethod.includes('automatic')) score -= 0.14;

    if (p.InternetService === 'Fiber optic') score += 0.15;
    if (p.OnlineSecurity === 'No') score += 0.08;
    if (p.TechSupport === 'No') score += 0.08;

    if (p.tenure <= 6) score += 0.22;
    else if (p.tenure >= 36) score -= 0.25;

    if (p.MonthlyCharges >= 80) score += 0.12;

    const prob = Math.min(0.96, Math.max(0.04, score));
    const probPct = Math.round(prob * 1000) / 10;
    const isChurn = prob >= 0.50;

    const recs = isChurn ? [
        `Offer a 15% discount to switch from ${p.Contract} to a 1-Year or 2-Year contract.`,
        "Enroll customer in automatic bill pay with a $5 recurring monthly discount.",
        "Include free dedicated Tech Support and Online Security."
    ] : [
        "Customer profile is healthy with high loyalty and low risk.",
        "Good candidate for speed upgrades or premium channel add-ons.",
        "Continue normal customer care and satisfaction check-ins."
    ];

    updateSimulatorUI(probPct, isChurn, recs);
}

function updateSimulatorUI(probPct, isChurn, recs) {
    const elPercent = document.getElementById('prob-percent');
    const elBadge = document.getElementById('risk-badge');
    const elArc = document.getElementById('gauge-arc');
    const elPresc = document.getElementById('presc-list');

    if (elPercent) elPercent.innerText = `${probPct.toFixed(1)}%`;

    if (elArc) {
        const offset = 440 - (440 * (probPct / 100));
        elArc.style.strokeDashoffset = offset;
        elArc.style.stroke = isChurn ? '#E11D48' : '#059669';
    }

    if (elBadge) {
        if (isChurn) {
            elBadge.className = 'badge-risk-critical';
            elBadge.innerHTML = `&#9888; HIGH CHURN RISK (${probPct.toFixed(1)}%)`;
        } else {
            elBadge.className = 'badge-risk-safe';
            elBadge.innerHTML = `&check; LOYAL CUSTOMER (${probPct.toFixed(1)}%)`;
        }
    }

    if (elPresc && recs) {
        elPresc.innerHTML = recs.map(r => `<li><svg class="btn-svg text-neon-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg> ${r}</li>`).join('');
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
