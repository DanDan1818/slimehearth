// ============================================================
//  SlimeHearth — Jewelcrafting  (game-jewelcrafting.js)
// ============================================================
(function () {

    // ── % chance tables ──────────────────────────────────────────
    const BAR_CHANCE = {
        copper_bar: 10, iron_bar: 15, silver_bar: 20, gold_bar: 25
    };
    const GEM_CHANCE = {
        gem: 5, emerald: 5, topaz: 10, amethyst: 15,
        sapphire: 20, ruby: 25, diamond: 30
    };
    // Skill bar: level 1→1%, level 100→20%, capped at 20%
    // Formula: min(20, level * (19/99) + (1 - 19/99))  ≈ min(20, 0.808 + 0.192*level)
    function skillPct(level) {
        return Math.min(20, Math.max(1, ((level - 1) / 99) * 19 + 1));
    }

    // ── Bar liquid color per item ────────────────────────────────
    const BAR_COLOR = {
        copper_bar: 'linear-gradient(180deg,#fdba74 0%,#b45309 60%,#78350f 100%)',
        iron_bar:   'linear-gradient(180deg,#e5e7eb 0%,#9ca3af 60%,#6b7280 100%)',
        silver_bar: 'linear-gradient(180deg,#f3f4f6 0%,#d1d5db 60%,#9ca3af 100%)',
        gold_bar:   'linear-gradient(180deg,#fde68a 0%,#fbbf24 60%,#d97706 100%)',
    };
    const GEM_COLOR = {
        gem:      'linear-gradient(180deg,#6ee7b7 0%,#10b981 60%,#065f46 100%)',
        emerald:  'linear-gradient(180deg,#6ee7b7 0%,#10b981 60%,#065f46 100%)',
        ruby:     'linear-gradient(180deg,#fca5a5 0%,#ef4444 60%,#991b1b 100%)',
        sapphire: 'linear-gradient(180deg,#93c5fd 0%,#3b82f6 60%,#1e3a8a 100%)',
        amethyst: 'linear-gradient(180deg,#e9d5ff 0%,#a855f7 60%,#6b21a8 100%)',
        topaz:    'linear-gradient(180deg,#fde68a 0%,#f59e0b 60%,#92400e 100%)',
        diamond:  'linear-gradient(180deg,#e0f2fe 0%,#bfdbfe 60%,#93c5fd 100%)',
    };

    const BAR_ICONS = { copper_bar:'🟫', iron_bar:'⬜', silver_bar:'🔲', gold_bar:'🟨' };
    const BAR_NAMES = { copper_bar:'Copper', iron_bar:'Iron', silver_bar:'Silver', gold_bar:'Gold' };
    const GEM_ICONS = { gem:'💚', emerald:'💚', ruby:'❤️', sapphire:'💙', amethyst:'💜', topaz:'🧡', diamond:'💎' };
    const GEM_NAMES = { gem:'Emerald', emerald:'Emerald', ruby:'Ruby', sapphire:'Sapphire', amethyst:'Amethyst', topaz:'Topaz', diamond:'Diamond' };
    const METAL_BARS = Object.keys(BAR_CHANCE);
    const GEMS       = Object.keys(GEM_CHANCE);

    // ── State ────────────────────────────────────────────────────
    let slots = { 1: null, 2: null, 3: null };

    // ── Init ─────────────────────────────────────────────────────
    function init() {
        const gotoBtn = document.getElementById('goto-jewelcrafting');
        if (gotoBtn) gotoBtn.onclick = () => window.switchRoom('jewelcrafting-room');

        const leaveBtn = document.getElementById('leave-jewelcrafting');
        if (leaveBtn) leaveBtn.onclick = () => window.switchRoom('forge-menu-room');

        const craftBtn = document.getElementById('jc-craft-btn');
        if (craftBtn) craftBtn.onclick = onCraft;

        [1, 2, 3].forEach(n => {
            const s = document.getElementById('jc-slot' + n);
            if (s) s.addEventListener('click', () => onSlotClick(n));
        });

        window.jcCheckDrop = jcCheckDrop;
        refreshAll();
    }

    // ── Slot click — pull from inventory ─────────────────────────
    function onSlotClick(n) {
        if (slots[n]) return;
        const gs = window.gs;
        if (!gs || !gs.inventory) return;
        const allowed = n < 3 ? METAL_BARS : GEMS;
        const key = Object.keys(gs.inventory).find(k => gs.inventory[k] && allowed.includes(gs.inventory[k].itemId));
        if (!key) { if (window.notify) window.notify(n < 3 ? 'No Metal Bars!' : 'No Gems!'); return; }
        fillSlot(n, gs.inventory[key].itemId, key);
    }

    function fillSlot(n, itemId, itemKey) {
        slots[n] = { itemId, itemKey };
        if (window.gs?.inventory) delete window.gs.inventory[itemKey];
        if (window.save) window.save();
        if (window.updateInventoryCounter) window.updateInventoryCounter();
        refreshAll();
        spawnDropSpark(document.getElementById('jc-slot' + n), n === 3);
    }

    window.jcClearSlot = function(n) {
        if (!slots[n]) return;
        if (window.addItem) window.addItem(slots[n].itemId, 1);
        slots[n] = null;
        refreshAll();
    };

    // ── Refresh all UI ───────────────────────────────────────────
    function refreshAll() {
        renderSlots();
        updateBarsAndOrb();
        updateCardLevels();
    }

    function renderSlots() {
        [1, 2, 3].forEach(n => {
            const s    = slots[n];
            const icon = document.getElementById('jc-slot' + n + '-icon');
            const name = document.getElementById('jc-slot' + n + '-name');
            const clr  = document.getElementById('jc-slot' + n + '-clear');
            const wrap = document.getElementById('jc-slot' + n);
            if (!icon || !name) return;
            if (s) {
                icon.textContent  = n < 3 ? (BAR_ICONS[s.itemId] || '⬜') : (GEM_ICONS[s.itemId] || '💎');
                name.textContent  = n < 3 ? (BAR_NAMES[s.itemId] || s.itemId) : (GEM_NAMES[s.itemId] || s.itemId);
                name.style.color  = 'rgba(255,255,255,0.9)';
                if (clr) clr.style.display = 'block';
                if (wrap) { wrap.style.border = '2px solid rgba(168,85,247,0.6)'; wrap.style.background = 'rgba(88,28,135,0.3)'; }
            } else {
                icon.textContent  = n < 3 ? '⬜' : '💎';
                name.textContent  = n < 3 ? 'BAR' : 'GEM';
                name.style.color  = n < 3 ? 'rgba(255,255,255,0.5)' : 'rgba(200,160,255,0.7)';
                if (clr) clr.style.display = 'none';
                if (wrap) { wrap.style.border = n < 3 ? '2px dashed rgba(255,255,255,0.25)' : '2px dashed rgba(160,100,255,0.4)'; wrap.style.background = 'rgba(0,0,0,0.3)'; }
            }
        });
    }

    function updateBarsAndOrb() {
        const jcLevel   = window.gs?.skills?.jewelcrafting?.level || 1;
        const jc        = window.gs?.jewelcraft || { ring: 1, amulet: 1, watch: 1 };
        const amuletPct = Math.max(0, ((jc.amulet || 1) - 1)); // level 1 = 0%, level 2 = 1%...

        const pct1 = slots[1] ? (BAR_CHANCE[slots[1].itemId] || 0) : 0;
        const pct2 = slots[2] ? (BAR_CHANCE[slots[2].itemId] || 0) : 0;
        const pct3 = slots[3] ? (GEM_CHANCE[slots[3].itemId] || 0) : 0;
        const pct4 = parseFloat(skillPct(jcLevel).toFixed(1));

        setBar('jc-bar1', !!slots[1], pct1, slots[1] ? BAR_COLOR[slots[1].itemId] : null, 'jc-bar1-pct', pct1 ? pct1 + '%' : '0%');
        setBar('jc-bar2', !!slots[2], pct2, slots[2] ? BAR_COLOR[slots[2].itemId] : null, 'jc-bar2-pct', pct2 ? pct2 + '%' : '0%');
        setBar('jc-bar3', !!slots[3], pct3, slots[3] ? GEM_COLOR[slots[3].itemId] : null, 'jc-bar3-pct', pct3 ? pct3 + '%' : '0%');
        setBar4(pct4);

        // Total = all 4 ingredient bars + amulet passive bonus
        const total = Math.min(100, pct1 + pct2 + pct3 + pct4 + amuletPct);
        const orbFill = document.getElementById('jc-orb-fill');
        const orbPct  = document.getElementById('jc-orb-pct');
        if (orbFill) orbFill.style.height = total + '%';
        if (orbPct)  orbPct.textContent   = Math.round(total);
    }

    // Bars 1-3: fill proportionally where 30% = 100% full bar
    function setBar(barId, filled, chancePct, color, pctId, label) {
        const bar   = document.getElementById(barId);
        const pctEl = document.getElementById(pctId);
        if (!bar) return;
        bar.style.height = filled ? Math.min(100, (chancePct / 30) * 100) + '%' : '0%';
        if (color) bar.style.background = color;
        if (pctEl) pctEl.textContent = label;
    }
    // Bar 4: skill level fills proportionally (1%–20% of bar)
    function setBar4(pct4) {
        const bar   = document.getElementById('jc-bar4');
        const pctEl = document.getElementById('jc-bar4-pct');
        if (bar) bar.style.height = Math.min(100, (pct4 / 20) * 100) + '%';
        if (pctEl) pctEl.textContent = pct4.toFixed(1) + '%';
    }

    function updateCardLevels() {
        const jc = window.gs?.jewelcraft || { ring: 1, amulet: 1, watch: 1 };
        const rLv = jc.ring   || 1;
        const aLv = jc.amulet || 1;
        const wLv = jc.watch  || 1;

        const rEl = document.getElementById('jc-ring-level');
        const aEl = document.getElementById('jc-amulet-level');
        const wEl = document.getElementById('jc-watch-level');
        if (rEl) rEl.textContent = rLv;
        if (aEl) aEl.textContent = aLv;
        if (wEl) wEl.textContent = wLv;

        const rStat = document.getElementById('jc-ring-stat');
        const aStat = document.getElementById('jc-amulet-stat');
        const wStat = document.getElementById('jc-watch-stat');
        if (rStat) rStat.textContent = '+' + (rLv - 1) + '% 2x Sell';
        if (aStat) aStat.textContent = '+' + (aLv - 1) + '% Craft';
        if (wStat) wStat.textContent = '+' + (wLv - 1) + 's Mine';
    }

    // ── Craft ────────────────────────────────────────────────────
    function onCraft() {
        if (!slots[1] || !slots[2] || !slots[3]) {
            if (window.notify) window.notify('💍 Fill all 3 slots first!');
            return;
        }

        const jcLevel = window.gs?.skills?.jewelcrafting?.level || 1;
        const jc      = window.gs?.jewelcraft || { ring: 1, amulet: 1, watch: 1 };
        const pct1 = BAR_CHANCE[slots[1].itemId] || 0;
        const pct2 = BAR_CHANCE[slots[2].itemId] || 0;
        const pct3 = GEM_CHANCE[slots[3].itemId] || 0;
        const pct4 = parseFloat(skillPct(jcLevel).toFixed(1));
        const amuletBonus = Math.max(0, ((jc.amulet || 1) - 1));
        const totalChance = Math.min(100, pct1 + pct2 + pct3 + pct4 + amuletBonus);

        // Consume slots (items already removed from inventory on drop)
        slots[1] = null; slots[2] = null; slots[3] = null;

        // Roll
        const roll = Math.random() * 100;
        const success = roll < totalChance;

        if (success) {
            // Level up a random jewelry card
            if (!window.gs.jewelcraft) window.gs.jewelcraft = { ring: 1, amulet: 1, watch: 1 };
            const cards = ['ring', 'amulet', 'watch'];
            const picked = cards[Math.floor(Math.random() * cards.length)];
            window.gs.jewelcraft[picked] = (window.gs.jewelcraft[picked] || 1) + 1;

            const icons = { ring: '💍', amulet: '📿', watch: '⌚' };
            if (window.notify) window.notify('✨ ' + icons[picked] + ' ' + picked.charAt(0).toUpperCase() + picked.slice(1) + ' leveled up! Lv ' + window.gs.jewelcraft[picked], 'achievement');

            const lvlSound = document.getElementById('skill-levelup-sound');
            if (lvlSound) { lvlSound.currentTime = 0; lvlSound.play().catch(() => {}); }
            if (window.addSkillXP) window.addSkillXP('jewelcrafting', 50);
            spawnCardExplosion(document.getElementById('jc-card-' + picked));
        } else {
            if (window.notify) window.notify('💔 Craft failed! (rolled ' + Math.round(roll) + '%, needed <' + Math.round(totalChance) + '%)');
            if (window.addSkillXP) window.addSkillXP('jewelcrafting', 10);
        }

        if (window.save) window.save();
        refreshAll();
    }

    // ── Basket drop detection ─────────────────────────────────────
    function jcCheckDrop(bodies, basketEngine, World) {
        const room = document.getElementById('jewelcrafting-room');
        if (!room || !room.classList.contains('active')) return;
        const canvasEl = document.getElementById('basket-canvas');
        if (!canvasEl) return;
        const cr    = canvasEl.getBoundingClientRect();
        const scaleX = canvasEl.width  / cr.width;
        const scaleY = canvasEl.height / cr.height;

        for (let i = bodies.length - 1; i >= 0; i--) {
            const b = bodies[i];
            if (!b || !b.itemId) continue;
            const isBar = METAL_BARS.includes(b.itemId);
            const isGem = GEMS.includes(b.itemId);
            if (!isBar && !isGem) continue;

            const targetSlots = isBar ? [1, 2] : [3];
            for (const sn of targetSlots) {
                if (slots[sn]) continue;
                const slotEl = document.getElementById('jc-slot' + sn);
                if (!slotEl) continue;
                const sr  = slotEl.getBoundingClientRect();
                const scx = ((sr.left + sr.width  / 2) - cr.left) * scaleX;
                const scy = ((sr.top  + sr.height / 2) - cr.top)  * scaleY;
                const dist = Math.sqrt((b.position.x - scx) ** 2 + (b.position.y - scy) ** 2);
                if (dist < 38) {
                    const id = b.itemId, key = b.itemKey;
                    World.remove(basketEngine.world, b);
                    bodies.splice(i, 1);
                    if (window.gs?.inventory) delete window.gs.inventory[key];
                    slots[sn] = { itemId: id, itemKey: key };
                    refreshAll();
                    if (window.save) window.save();
                    if (window.updateInventoryCounter) window.updateInventoryCounter();
                    spawnDropSpark(slotEl, isGem);
                    break;
                }
            }
        }
    }

    // ── VFX ──────────────────────────────────────────────────────
    function spawnDropSpark(slotEl, isGem) {
        if (!slotEl) return;
        const parent = slotEl.closest('.room');
        if (!parent) return;
        const rect = slotEl.getBoundingClientRect();
        const pr   = parent.getBoundingClientRect();
        const cx   = rect.left - pr.left + rect.width / 2;
        const cy   = rect.top  - pr.top  + rect.height / 2;
        const cols = isGem ? ['#c084fc','#e879f9','#ffd700','#fff'] : ['#fbbf24','#d1d5db','#c084fc','#fff'];
        for (let i = 0; i < 8; i++) {
            const p = document.createElement('div');
            const a = Math.random() * Math.PI * 2;
            const d = 14 + Math.random() * 20;
            p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:5px;height:5px;border-radius:50%;background:${cols[i%cols.length]};pointer-events:none;z-index:50;--sx:${Math.cos(a)*d}px;--sy:${Math.sin(a)*d}px;animation:sparkFly 0.45s ease-out forwards;`;
            parent.style.position = 'relative';
            parent.appendChild(p);
            setTimeout(() => p.remove(), 500);
        }
    }

    // ── VFX — Card Explosion ──────────────────────────────────────
    function spawnCardExplosion(cardEl) {
        const room = document.getElementById('jewelcrafting-room');
        if (!room || !cardEl) return;

        const roomRect = room.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();

        const cardLeft   = cardRect.left   - roomRect.left;
        const cardRight  = cardRect.right  - roomRect.left;
        const cardTop    = cardRect.top    - roomRect.top;
        const cardBottom = cardRect.bottom - roomRect.top;
        const cardCX     = (cardLeft + cardRight) / 2;
        const cardW      = cardRect.width;
        const distToBottom = roomRect.height - cardBottom;

        room.style.position = 'relative';

        // Flash the card white
        cardEl.style.transition = 'none';
        cardEl.style.boxShadow  = '0 0 0 4px #fff, 0 0 40px 12px rgba(255,255,255,0.9)';
        cardEl.style.transform  = 'scale(1.12)';
        setTimeout(() => {
            cardEl.style.transition = 'box-shadow 0.4s ease-out, transform 0.4s ease-out';
            cardEl.style.boxShadow  = '';
            cardEl.style.transform  = '';
        }, 120);

        // ── SPLINTERS — shoot downward from card bottom edge ─────
        const splinterCols = ['#d4a017','#c0c0c0','#8B4513','#e8e8e8','#ffd700','#b8860b','#aaa','#fff'];
        const splinterCount = 34;
        for (let i = 0; i < splinterCount; i++) {
            setTimeout(() => {
                const p   = document.createElement('div');
                const spawnX = cardLeft + Math.random() * cardW;
                const spawnY = cardBottom - Math.random() * 8;
                // Mostly straight down, small horizontal spread
                const angle = (Math.PI * 0.5) + (Math.random() - 0.5) * 0.55;
                const speed = 280 + Math.random() * 480;
                const sx    = Math.cos(angle) * speed;
                const sy    = Math.sin(angle) * speed;
                const w     = 2 + Math.random() * 3;
                const h     = 7 + Math.random() * 20;
                const rot   = (Math.random() - 0.5) * 60;
                const dur   = 0.32 + Math.random() * 0.28;
                const col   = splinterCols[Math.floor(Math.random() * splinterCols.length)];
                p.style.cssText = `position:absolute;left:${spawnX}px;top:${spawnY}px;width:${w}px;height:${h}px;background:${col};border-radius:1px;pointer-events:none;z-index:100;--sx:${sx}px;--sy:${sy}px;--rot:${rot}deg;animation:cardSplinter ${dur}s cubic-bezier(0.1,0,0.8,0.6) forwards;transform-origin:center center;`;
                room.appendChild(p);
                setTimeout(() => p.remove(), dur * 1000 + 60);
            }, i * 7);
        }

        // ── SMOKE — large dark puffs billowing straight down ─────
        const smokeCount = 20;
        for (let i = 0; i < smokeCount; i++) {
            setTimeout(() => {
                const p     = document.createElement('div');
                const spawnX = cardLeft + (Math.random() * (cardW + 16)) - 8;
                const spawnY = cardTop  + cardRect.height * (0.3 + Math.random() * 0.7);
                const sz    = 32 + Math.random() * 52;
                const sy    = (distToBottom + 80) * (0.65 + Math.random() * 0.5);
                const wx    = (Math.random() - 0.5) * 35;
                const dur   = 0.45 + Math.random() * 0.35;
                const grey  = Math.floor(20 + Math.random() * 55);
                const col   = `rgba(${grey},${grey},${grey},0.78)`;
                p.style.cssText = `position:absolute;left:${spawnX - sz/2}px;top:${spawnY - sz/2}px;width:${sz}px;height:${sz}px;background:radial-gradient(circle, ${col} 0%, transparent 68%);border-radius:50%;pointer-events:none;z-index:99;--sy:${sy}px;--wx:${wx}px;animation:cardSmoke ${dur}s ease-out forwards;`;
                room.appendChild(p);
                setTimeout(() => p.remove(), dur * 1000 + 60);
            }, i * 15);
        }
    }

    // ── Bootstrap ─────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
