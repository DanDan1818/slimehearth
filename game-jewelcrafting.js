// ============================================================
//  SlimeHearth — Jewelcrafting Minigame  (game-jewelcrafting.js)
//  Gem Faceting: orbit a cutting beam around the gem, press CUT
//  in the sweet-spot arc to add a facet. Fill the bar → polished gem!
// ============================================================

(function () {

    // ── Gem data ────────────────────────────────────────────────
    const GEM_DATA = {
        emerald:  { name: 'Emerald',  color: '#10b981', glow: '#34d399', facets: 8,  output: 'polished_emerald',  xpPer: 8,  xpDone: 120 },
        ruby:     { name: 'Ruby',     color: '#ef4444', glow: '#f87171', facets: 8,  output: 'polished_ruby',     xpPer: 10, xpDone: 150 },
        sapphire: { name: 'Sapphire', color: '#3b82f6', glow: '#60a5fa', facets: 8,  output: 'polished_sapphire', xpPer: 12, xpDone: 180 },
        amethyst: { name: 'Amethyst', color: '#a855f7', glow: '#c084fc', facets: 8,  output: 'polished_amethyst', xpPer: 14, xpDone: 210 },
        topaz:    { name: 'Topaz',    color: '#f59e0b', glow: '#fbbf24', facets: 8,  output: 'polished_topaz',    xpPer: 16, xpDone: 260 },
        diamond:  { name: 'Diamond',  color: '#bfdbfe', glow: '#e0f2fe', facets: 10, output: 'polished_diamond',  xpPer: 30, xpDone: 600 },
        gem:      { name: 'Emerald',  color: '#10b981', glow: '#34d399', facets: 8,  output: 'polished_emerald',  xpPer: 8,  xpDone: 120 },
    };

    // ── State ────────────────────────────────────────────────────
    let jcState = {
        gemId: null,      // active gem item id
        facetsDone: 0,
        facetsNeeded: 8,
        precision: 0,     // 0–100 accumulated precision
        precStreak: 0,    // consecutive perfect hits
        running: false,
        beamAngle: 0,     // degrees, increases each frame
        beamSpeed: 1.4,   // deg/frame — increases with JC level
        sweetStart: 60,   // degrees — randomised each facet
        sweetWidth: 40,   // degrees — narrows with level
        lastFrameTime: 0,
        animId: null,
    };

    let canvas, ctx;

    // ── Init (called once on DOMContentLoaded) ───────────────────
    function init() {
        canvas = document.getElementById('jc-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');

        // Navigation buttons
        const gotoBtn = document.getElementById('goto-jewelcrafting');
        if (gotoBtn) gotoBtn.onclick = () => window.switchRoom('jewelcrafting-room');

        const leaveBtn = document.getElementById('leave-jewelcrafting');
        if (leaveBtn) leaveBtn.onclick = () => {
            stopLoop();
            window.switchRoom('forge-menu-room');
        };

        // Cut button
        const cutBtn = document.getElementById('jc-cut-btn');
        if (cutBtn) {
            cutBtn.addEventListener('click',      onCut);
            cutBtn.addEventListener('touchstart', e => { e.preventDefault(); onCut(); }, { passive: false });
        }

        // Clear gem
        const clearBtn = document.getElementById('jc-clear-gem');
        if (clearBtn) clearBtn.onclick = clearGem;

        // Basket drop integration — listen for drops on the gem slot
        setupDropTarget();

        // Start drawing idle state
        startLoop();
    }

    // ── Drop target — listen to basket drag/drop events ──────────
    function setupDropTarget() {
        // The basket engine fires a custom event 'basketDrop' with { itemId, itemKey }
        // We also hook into the Matter.js drag-release via document events.
        // Fallback: user taps the gem slot to pick from inventory.
        const slot = document.getElementById('jc-gem-slot');
        if (!slot) return;

        slot.addEventListener('click', () => {
            if (jcState.gemId) return; // already loaded
            // Find first available gem in inventory
            const gs = window.gs;
            if (!gs || !gs.inventory) return;
            const gemOrder = ['diamond','topaz','amethyst','sapphire','ruby','emerald','gem'];
            for (const gId of gemOrder) {
                const key = Object.keys(gs.inventory).find(k => gs.inventory[k] && gs.inventory[k].itemId === gId);
                if (key) { loadGem(gId, key); break; }
            }
        });

        // Also hook into the basket beforeUpdate to catch drops
        // The basket engine checks proximity to slot
        if (window._jcDropHooked) return;
        window._jcDropHooked = true;

        // Poll: check if any gem item lands near the slot element each frame
        // We inject into the existing basket beforeUpdate cycle via a global hook
        window.jcCheckDrop = function(bodies, basketEngine, World) {
            const room = document.getElementById('jewelcrafting-room');
            if (!room || !room.classList.contains('active')) return;
            if (jcState.gemId) return;

            const slotEl = document.getElementById('jc-gem-slot');
            const canvasEl = document.getElementById('basket-canvas');
            if (!slotEl || !canvasEl) return;

            const slotRect  = slotEl.getBoundingClientRect();
            const canvasRect = canvasEl.getBoundingClientRect();
            const cx = (slotRect.left + slotRect.width / 2)  - canvasRect.left;
            const cy = (slotRect.top  + slotRect.height / 2) - canvasRect.top;

            for (let i = bodies.length - 1; i >= 0; i--) {
                const b = bodies[i];
                if (!b || !b.itemId) continue;
                if (!GEM_DATA[b.itemId]) continue;
                const dist = Math.sqrt((b.position.x - cx) ** 2 + (b.position.y - cy) ** 2);
                if (dist < 36) {
                    const key = b.itemKey;
                    const id  = b.itemId;
                    World.remove(basketEngine.world, b);
                    bodies.splice(i, 1);
                    if (window.gs && window.gs.inventory) delete window.gs.inventory[key];
                    loadGem(id, key);
                    if (window.updateInventoryCounter) window.updateInventoryCounter();
                    if (window.save) window.save();
                    break;
                }
            }
        };
    }

    // ── Load a gem into the crafter ──────────────────────────────
    function loadGem(gemId, itemKey) {
        const data = GEM_DATA[gemId];
        if (!data) return;

        const jcLevel = (window.gs?.skills?.jewelcrafting?.level) || 1;
        jcState.gemId        = gemId;
        jcState.gemItemKey   = itemKey;
        jcState.facetsDone   = 0;
        jcState.facetsNeeded = data.facets;
        jcState.precision    = 0;
        jcState.precStreak   = 0;
        jcState.beamSpeed    = 1.2 + jcLevel * 0.06; // faster with level
        jcState.sweetWidth   = Math.max(22, 46 - jcLevel * 1.2); // narrower sweet spot with level
        jcState.running      = true;
        randomiseSweetSpot();

        // Update slot UI
        document.getElementById('jc-gem-icon').textContent = data.name[0] === 'E' ? '💚' :
            data.name[0] === 'R' ? '❤️' : data.name[0] === 'S' ? '💙' :
            data.name[0] === 'A' ? '💜' : data.name[0] === 'T' ? '🧡' : '💎';
        document.getElementById('jc-gem-name').textContent = data.name;
        document.getElementById('jc-clear-gem').style.display = 'block';
        setStatus('Press CUT when the beam hits the ✨ zone!');
        updateBars();
    }

    function clearGem() {
        // Return gem to inventory
        if (jcState.gemId && window.addItem) {
            window.addItem(jcState.gemId, 1);
        }
        resetJC();
    }

    function resetJC() {
        jcState.gemId      = null;
        jcState.facetsDone = 0;
        jcState.precision  = 0;
        jcState.precStreak = 0;
        jcState.running    = false;
        document.getElementById('jc-gem-icon').textContent = '💎';
        document.getElementById('jc-gem-name').textContent = 'DROP GEM';
        document.getElementById('jc-clear-gem').style.display = 'none';
        setStatus('Drop a gem to begin');
        updateBars();
    }

    function randomiseSweetSpot() {
        jcState.sweetStart = Math.floor(Math.random() * 300);
    }

    // ── Cut action ───────────────────────────────────────────────
    function onCut() {
        if (!jcState.gemId || !jcState.running) return;

        const angle  = ((jcState.beamAngle % 360) + 360) % 360;
        const ss     = jcState.sweetStart;
        const sw     = jcState.sweetWidth;
        const ssEnd  = (ss + sw) % 360;

        // Check if beam is in sweet spot
        let inZone;
        if (ss < ssEnd) {
            inZone = angle >= ss && angle <= ssEnd;
        } else {
            inZone = angle >= ss || angle <= ssEnd;
        }

        // How close to centre of sweet zone?
        const centre    = (ss + sw / 2) % 360;
        let   angleDiff = Math.abs(angle - centre);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        const proximity = Math.max(0, 1 - angleDiff / (sw / 2)); // 0–1

        if (inZone) {
            // Perfect if in inner 40% of zone
            const perfect = proximity > 0.6;
            jcState.facetsDone++;
            jcState.precStreak++;

            const precGain = perfect ? 20 : 10;
            jcState.precision = Math.min(100, jcState.precision + precGain);

            spawnCutSparks(perfect);
            if (perfect) showPerfectLabel();

            const data = GEM_DATA[jcState.gemId];
            const xp   = perfect ? data.xpPer * 2 : data.xpPer;
            if (window.addSkillXP) window.addSkillXP('jewelcrafting', xp);

            if (jcState.facetsDone >= jcState.facetsNeeded) {
                completeCraft();
                return;
            }

            randomiseSweetSpot();
            setStatus(perfect ? '✨ Perfect cut! +' + xp + ' JC XP' : '💎 Good cut! +' + xp + ' JC XP');
        } else {
            // Miss — precision drops, streak resets
            jcState.precision  = Math.max(0, jcState.precision - 15);
            jcState.precStreak = 0;
            setStatus('❌ Missed! Wait for the ✨ zone');
        }

        updateBars();
        if (window.save) window.save();
    }

    function completeCraft() {
        const data = GEM_DATA[jcState.gemId];
        jcState.running = false;

        // Bonus XP if high precision
        const bonusXP = Math.floor(jcState.precision / 100 * data.xpDone * 0.5);
        if (window.addSkillXP) window.addSkillXP('jewelcrafting', data.xpDone + bonusXP);
        if (window.addItem)    window.addItem(data.output, 1);
        if (window.notify)     window.notify('💍 ' + data.name + ' polished! ✨', 'achievement');

        const lvlSound = document.getElementById('skill-levelup-sound');
        if (lvlSound) { lvlSound.currentTime = 0; lvlSound.play().catch(() => {}); }

        updateBars();
        setStatus('💍 ' + data.name + ' complete! +' + (data.xpDone + bonusXP) + ' XP');
        spawnFinishBurst();

        if (window.save) window.save();
        if (window.updateInventoryCounter) window.updateInventoryCounter();

        setTimeout(resetJC, 2200);
    }

    // ── UI helpers ───────────────────────────────────────────────
    function updateBars() {
        const facetPct = jcState.facetsNeeded > 0
            ? Math.min(100, (jcState.facetsDone / jcState.facetsNeeded) * 100)
            : 0;
        const precPct  = jcState.precision;

        const fBar = document.getElementById('jc-facet-bar');
        const pBar = document.getElementById('jc-prec-bar');
        const fDone   = document.getElementById('jc-facets-done');
        const fNeeded = document.getElementById('jc-facets-needed');
        const pPct    = document.getElementById('jc-prec-pct');

        if (fBar)    fBar.style.height    = facetPct + '%';
        if (pBar)    pBar.style.height    = precPct  + '%';
        if (fDone)   fDone.textContent    = jcState.facetsDone;
        if (fNeeded) fNeeded.textContent  = jcState.facetsNeeded;
        if (pPct)    pPct.textContent     = Math.round(precPct);
    }

    function setStatus(msg) {
        const el = document.getElementById('jc-status');
        if (el) el.textContent = msg;
    }

    // ── Canvas animation loop ────────────────────────────────────
    function startLoop() {
        if (jcState.animId) return;
        jcState.lastFrameTime = performance.now();
        function loop(ts) {
            const dt = Math.min(ts - jcState.lastFrameTime, 50);
            jcState.lastFrameTime = ts;
            if (jcState.running) {
                jcState.beamAngle = (jcState.beamAngle + jcState.beamSpeed * (dt / 16.67)) % 360;
            }
            drawFrame();
            jcState.animId = requestAnimationFrame(loop);
        }
        jcState.animId = requestAnimationFrame(loop);
    }

    function stopLoop() {
        if (jcState.animId) { cancelAnimationFrame(jcState.animId); jcState.animId = null; }
    }

    // ── Drawing ──────────────────────────────────────────────────
    function drawFrame() {
        if (!ctx) return;
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const R  = 62; // orbit radius

        ctx.clearRect(0, 0, W, H);

        const data   = jcState.gemId ? GEM_DATA[jcState.gemId] : null;
        const color  = data ? data.color : '#888';
        const glow   = data ? data.glow  : '#aaa';

        // ── 1. Orbit track ──
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth   = 4;
        ctx.stroke();

        // ── 2. Sweet spot arc (golden) ──
        if (jcState.running) {
            const ss  = (jcState.sweetStart - 90) * Math.PI / 180;
            const se  = ss + jcState.sweetWidth * Math.PI / 180;
            ctx.beginPath();
            ctx.arc(cx, cy, R, ss, se);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth   = 7;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur  = 12;
            ctx.stroke();
            ctx.shadowBlur  = 0;

            // Tiny stars on sweet spot
            const midAngle = ss + (se - ss) / 2;
            const sx = cx + R * Math.cos(midAngle);
            const sy = cy + R * Math.sin(midAngle);
            ctx.fillStyle = '#fff';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', sx, sy);
        }

        // ── 3. Gem shape (polygon) ──
        const sides   = data ? (jcState.gemId === 'diamond' ? 8 : 6) : 6;
        const gemSize = 28;
        const pulse   = jcState.running ? Math.sin(Date.now() / 400) * 2 : 0;

        ctx.save();
        ctx.translate(cx, cy);
        // slow independent gem rotation for style
        ctx.rotate((Date.now() / 4000) % (Math.PI * 2));

        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? gemSize + pulse : gemSize * 0.62 + pulse;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();

        // Gem fill
        const grad = ctx.createRadialGradient(-8, -8, 2, 0, 0, gemSize + 4);
        grad.addColorStop(0,   glow  + 'ff');
        grad.addColorStop(0.5, color + 'cc');
        grad.addColorStop(1,   color + '66');
        ctx.fillStyle   = grad;
        ctx.shadowColor = glow;
        ctx.shadowBlur  = 18 + pulse * 2;
        ctx.fill();

        // Gem facet lines
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        // Inner highlight
        ctx.beginPath();
        ctx.arc(-gemSize * 0.25, -gemSize * 0.25, gemSize * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fill();

        ctx.restore();

        // ── 4. Facet ring — show progress as glowing arcs ──
        const facetCount = jcState.facetsNeeded || 8;
        for (let i = 0; i < facetCount; i++) {
            const startA = (i / facetCount) * Math.PI * 2 - Math.PI / 2;
            const endA   = ((i + 0.78) / facetCount) * Math.PI * 2 - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, R - 12, startA, endA);
            ctx.strokeStyle = i < jcState.facetsDone
                ? (color + 'ee')
                : 'rgba(255,255,255,0.12)';
            ctx.lineWidth   = 3;
            if (i < jcState.facetsDone) {
                ctx.shadowColor = color;
                ctx.shadowBlur  = 8;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // ── 5. Orbiting cutting beam ──
        if (jcState.running) {
            const beamRad = (jcState.beamAngle - 90) * Math.PI / 180;
            const bx = cx + R * Math.cos(beamRad);
            const by = cy + R * Math.sin(beamRad);

            // Beam trail
            const trailLen = 8;
            for (let t = 1; t <= trailLen; t++) {
                const ta  = ((jcState.beamAngle - t * jcState.beamSpeed * 3) - 90) * Math.PI / 180;
                const tx  = cx + R * Math.cos(ta);
                const ty  = cy + R * Math.sin(ta);
                const alp = (1 - t / trailLen) * 0.4;
                ctx.beginPath();
                ctx.arc(tx, ty, 4 - t * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${alp})`;
                ctx.fill();
            }

            // Beam head
            ctx.beginPath();
            ctx.arc(bx, by, 7, 0, Math.PI * 2);
            const beamGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 7);
            beamGrad.addColorStop(0, '#fff');
            beamGrad.addColorStop(0.5, '#e0e7ff');
            beamGrad.addColorStop(1, 'rgba(224,231,255,0)');
            ctx.fillStyle   = beamGrad;
            ctx.shadowColor = '#c7d2fe';
            ctx.shadowBlur  = 14;
            ctx.fill();
            ctx.shadowBlur  = 0;

            // Line from centre to beam
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = 'rgba(200,210,255,0.15)';
            ctx.lineWidth   = 1;
            ctx.stroke();
        }

        // ── 6. Idle gem placeholder ──
        if (!jcState.gemId) {
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.font      = '36px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💎', cx, cy);
        }
    }

    // ── Visual FX ────────────────────────────────────────────────
    function spawnCutSparks(perfect) {
        const wrap = document.getElementById('jc-canvas')?.parentElement;
        if (!wrap) return;
        const count  = perfect ? 14 : 7;
        const colors = perfect
            ? ['#ffd700','#ffe066','#fff','#fbbf24','#f0abfc']
            : ['#c4b5fd','#a78bfa','#ddd6fe','#fff'];

        for (let i = 0; i < count; i++) {
            const spark = document.createElement('div');
            const angle = Math.random() * Math.PI * 2;
            const dist  = 20 + Math.random() * 40;
            const sx    = Math.cos(angle) * dist + 'px';
            const sy    = Math.sin(angle) * dist + 'px';
            const size  = 3 + Math.random() * 5;
            const col   = colors[Math.floor(Math.random() * colors.length)];

            spark.style.cssText = `
                position:absolute;
                left:50%;top:50%;
                width:${size}px;height:${size}px;
                border-radius:50%;
                background:${col};
                pointer-events:none;
                z-index:20;
                --sx:${sx};--sy:${sy};
                animation:sparkFly ${0.4 + Math.random() * 0.4}s ease-out forwards;
                box-shadow:0 0 4px ${col};
            `;
            wrap.appendChild(spark);
            setTimeout(() => spark.remove(), 900);
        }
    }

    function showPerfectLabel() {
        const el = document.getElementById('jc-perfect-label');
        if (!el) return;
        el.style.animation = 'none';
        el.offsetHeight; // reflow
        el.style.opacity   = '1';
        el.style.animation = 'perfectFlash 0.9s ease-out forwards';
        setTimeout(() => { el.style.opacity = '0'; el.style.animation = 'none'; }, 900);
    }

    function spawnFinishBurst() {
        const wrap = document.getElementById('jc-canvas')?.parentElement;
        if (!wrap) return;
        const cols = ['#ffd700','#f0abfc','#c084fc','#fff','#fbbf24','#a78bfa'];
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const p     = document.createElement('div');
                const angle = Math.random() * Math.PI * 2;
                const dist  = 30 + Math.random() * 70;
                p.style.cssText = `
                    position:absolute;left:50%;top:50%;
                    width:${4 + Math.random() * 6}px;
                    height:${4 + Math.random() * 6}px;
                    border-radius:50%;
                    background:${cols[Math.floor(Math.random() * cols.length)]};
                    pointer-events:none;z-index:25;
                    --sx:${Math.cos(angle)*dist}px;
                    --sy:${Math.sin(angle)*dist}px;
                    animation:sparkFly ${0.6 + Math.random() * 0.6}s ease-out forwards;
                `;
                wrap.appendChild(p);
                setTimeout(() => p.remove(), 1400);
            }, i * 40);
        }
    }

    // ── Bootstrap ────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
