// ============================================================
//  SlimeHearth — Jewelcrafting  (game-jewelcrafting.js)
//  Layout: 3 recipe cards → 4 bars + progress orb → 3 item slots → Craft
// ============================================================

(function () {

    const METAL_BARS = ['copper_bar', 'iron_bar', 'silver_bar', 'gold_bar'];
    const GEMS       = ['gem', 'emerald', 'ruby', 'sapphire', 'amethyst', 'topaz', 'diamond'];

    const BAR_ICONS = { copper_bar:'🟫', iron_bar:'⬜', silver_bar:'🔲', gold_bar:'🟨' };
    const BAR_NAMES = { copper_bar:'Copper Bar', iron_bar:'Iron Bar', silver_bar:'Silver Bar', gold_bar:'Gold Bar' };
    const GEM_ICONS = { gem:'💚', emerald:'💚', ruby:'❤️', sapphire:'💙', amethyst:'💜', topaz:'🧡', diamond:'💎' };
    const GEM_NAMES = { gem:'Emerald', emerald:'Emerald', ruby:'Ruby', sapphire:'Sapphire', amethyst:'Amethyst', topaz:'Topaz', diamond:'Diamond' };
    const RECIPE_ICONS = { ring:'💍', amulet:'📿', watch:'⌚' };

    let selectedRecipe = 'ring';
    let slots = { 1: null, 2: null, 3: null };

    function init() {
        const gotoBtn = document.getElementById('goto-jewelcrafting');
        if (gotoBtn) gotoBtn.onclick = () => window.switchRoom('jewelcrafting-room');

        const leaveBtn = document.getElementById('leave-jewelcrafting');
        if (leaveBtn) leaveBtn.onclick = () => window.switchRoom('forge-menu-room');

        const craftBtn = document.getElementById('jc-craft-btn');
        if (craftBtn) craftBtn.onclick = onCraft;

        [1, 2, 3].forEach(n => {
            const slot = document.getElementById('jc-slot' + n);
            if (slot) slot.addEventListener('click', () => onSlotClick(n));
        });

        selectRecipe('ring');
        window.jcCheckDrop = jcCheckDrop;
    }

    window.jcSelectRecipe = function(recipe) { selectRecipe(recipe); };

    function selectRecipe(recipe) {
        selectedRecipe = recipe;
        ['ring', 'amulet', 'watch'].forEach(r => {
            const card = document.getElementById('jc-card-' + r);
            if (!card) return;
            if (r === recipe) {
                card.style.border     = '2px solid rgba(168,85,247,0.9)';
                card.style.background = 'rgba(88,28,135,0.5)';
                card.style.boxShadow  = '0 0 12px rgba(168,85,247,0.5)';
            } else {
                card.style.border     = '2px solid rgba(255,255,255,0.15)';
                card.style.background = 'rgba(0,0,0,0.3)';
                card.style.boxShadow  = 'none';
            }
        });
        const orbIcon = document.getElementById('jc-orb-icon');
        if (orbIcon) orbIcon.textContent = RECIPE_ICONS[recipe] || '💍';
    }

    function onSlotClick(slotNum) {
        if (slots[slotNum]) return;
        const gs = window.gs;
        if (!gs || !gs.inventory) return;
        const allowed = (slotNum < 3) ? METAL_BARS : GEMS;
        const key = Object.keys(gs.inventory).find(k => {
            const it = gs.inventory[k];
            return it && allowed.includes(it.itemId);
        });
        if (!key) {
            if (window.notify) window.notify(slotNum < 3 ? 'No Metal Bars in basket!' : 'No Gems in basket!');
            return;
        }
        fillSlot(slotNum, gs.inventory[key].itemId, key);
    }

    function fillSlot(slotNum, itemId, itemKey) {
        slots[slotNum] = { itemId, itemKey };
        if (window.gs && window.gs.inventory) delete window.gs.inventory[itemKey];
        if (window.save) window.save();
        if (window.updateInventoryCounter) window.updateInventoryCounter();
        renderSlots();
        updateOrbProgress();
    }

    window.jcClearSlot = function(slotNum) {
        if (!slots[slotNum]) return;
        if (window.addItem) window.addItem(slots[slotNum].itemId, 1);
        slots[slotNum] = null;
        renderSlots();
        updateOrbProgress();
    };

    function barColor(itemId) {
        const cols = {
            copper_bar: 'linear-gradient(180deg,#fdba74 0%,#b45309 60%,#78350f 100%)',
            iron_bar:   'linear-gradient(180deg,#e5e7eb 0%,#9ca3af 60%,#6b7280 100%)',
            silver_bar: 'linear-gradient(180deg,#f3f4f6 0%,#d1d5db 60%,#9ca3af 100%)',
            gold_bar:   'linear-gradient(180deg,#fde68a 0%,#fbbf24 60%,#d97706 100%)',
        };
        return cols[itemId] || 'linear-gradient(180deg,#c4b5fd 0%,#7c3aed 60%,#4c1d95 100%)';
    }
    function gemColor(itemId) {
        const cols = {
            gem:      'linear-gradient(180deg,#6ee7b7 0%,#10b981 60%,#065f46 100%)',
            emerald:  'linear-gradient(180deg,#6ee7b7 0%,#10b981 60%,#065f46 100%)',
            ruby:     'linear-gradient(180deg,#fca5a5 0%,#ef4444 60%,#991b1b 100%)',
            sapphire: 'linear-gradient(180deg,#93c5fd 0%,#3b82f6 60%,#1e3a8a 100%)',
            amethyst: 'linear-gradient(180deg,#e9d5ff 0%,#a855f7 60%,#6b21a8 100%)',
            topaz:    'linear-gradient(180deg,#fde68a 0%,#f59e0b 60%,#92400e 100%)',
            diamond:  'linear-gradient(180deg,#e0f2fe 0%,#bfdbfe 60%,#93c5fd 100%)',
        };
        return cols[itemId] || 'linear-gradient(180deg,#c4b5fd 0%,#7c3aed 60%,#4c1d95 100%)';
    }

    function renderSlots() {
        [1, 2, 3].forEach(n => {
            const s    = slots[n];
            const icon = document.getElementById('jc-slot' + n + '-icon');
            const name = document.getElementById('jc-slot' + n + '-name');
            const clr  = document.getElementById('jc-slot' + n + '-clear');
            const wrap = document.getElementById('jc-slot' + n);
            if (!icon || !name || !clr) return;
            if (s) {
                icon.textContent  = n < 3 ? (BAR_ICONS[s.itemId] || '⬜') : (GEM_ICONS[s.itemId] || '💎');
                name.textContent  = n < 3 ? (BAR_NAMES[s.itemId] || s.itemId) : (GEM_NAMES[s.itemId] || s.itemId);
                name.style.color  = 'rgba(255,255,255,0.9)';
                clr.style.display = 'block';
                if (wrap) {
                    wrap.style.border     = '2px solid rgba(168,85,247,0.6)';
                    wrap.style.background = 'rgba(88,28,135,0.3)';
                }
            } else {
                icon.textContent  = n < 3 ? '⬜' : '💎';
                name.textContent  = n < 3 ? 'BAR' : 'GEM';
                name.style.color  = n < 3 ? 'rgba(255,255,255,0.5)' : 'rgba(200,160,255,0.7)';
                clr.style.display = 'none';
                if (wrap) {
                    wrap.style.border     = n < 3 ? '2px dashed rgba(255,255,255,0.25)' : '2px dashed rgba(160,100,255,0.4)';
                    wrap.style.background = 'rgba(0,0,0,0.3)';
                }
            }
        });
        // Update bar fills & colors
        const b1 = document.getElementById('jc-bar1');
        const b2 = document.getElementById('jc-bar2');
        const b3 = document.getElementById('jc-bar3');
        const b4 = document.getElementById('jc-bar4');
        if (b1) { b1.style.height = (slots[1] ? 100 : 0) + '%'; b1.style.background = barColor(slots[1]?.itemId); }
        if (b2) { b2.style.height = (slots[2] ? 100 : 0) + '%'; b2.style.background = barColor(slots[2]?.itemId); }
        if (b3) { b3.style.height = (slots[3] ? 100 : 0) + '%'; b3.style.background = gemColor(slots[3]?.itemId); }
        if (b4) { b4.style.height = (slots[3] ? 100 : 0) + '%'; b4.style.background = gemColor(slots[3]?.itemId); }
    }

    function updateOrbProgress() {
        const filled = [slots[1], slots[2], slots[3]].filter(Boolean).length;
        const pct    = Math.round((filled / 3) * 100);
        const fill   = document.getElementById('jc-orb-fill');
        const pctEl  = document.getElementById('jc-orb-pct');
        if (fill)  fill.style.height  = pct + '%';
        if (pctEl) pctEl.textContent  = pct;
    }

    function jcCheckDrop(bodies, basketEngine, World) {
        const room = document.getElementById('jewelcrafting-room');
        if (!room || !room.classList.contains('active')) return;
        const canvasEl  = document.getElementById('basket-canvas');
        if (!canvasEl) return;
        const canvasRect = canvasEl.getBoundingClientRect();

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
                const scx = (sr.left + sr.width / 2)  - canvasRect.left;
                const scy = (sr.top  + sr.height / 2) - canvasRect.top;
                const dist = Math.sqrt((b.position.x - scx) ** 2 + (b.position.y - scy) ** 2);
                if (dist < 38) {
                    const id  = b.itemId;
                    const key = b.itemKey;
                    World.remove(basketEngine.world, b);
                    bodies.splice(i, 1);
                    if (window.gs && window.gs.inventory) delete window.gs.inventory[key];
                    slots[sn] = { itemId: id, itemKey: key };
                    renderSlots();
                    updateOrbProgress();
                    if (window.save) window.save();
                    if (window.updateInventoryCounter) window.updateInventoryCounter();
                    spawnDropSpark(slotEl, isGem);
                    break;
                }
            }
        }
    }

    function onCraft() {
        if (!slots[1] || !slots[2] || !slots[3]) {
            if (window.notify) window.notify('💍 Fill all 3 slots first!');
            return;
        }
        if (window.notify) window.notify('💍 Crafting coming soon!');
        // TODO: recipe lookup and output
    }

    function spawnDropSpark(slotEl, isGem) {
        const parent = slotEl.closest('.room');
        if (!parent) return;
        const rect = slotEl.getBoundingClientRect();
        const pr   = parent.getBoundingClientRect();
        const cx   = rect.left - pr.left + rect.width / 2;
        const cy   = rect.top  - pr.top  + rect.height / 2;
        const cols = isGem
            ? ['#c084fc','#e879f9','#ffd700','#fff']
            : ['#fbbf24','#d1d5db','#f0abfc','#fff'];
        for (let i = 0; i < 8; i++) {
            const p   = document.createElement('div');
            const ang = Math.random() * Math.PI * 2;
            const d   = 16 + Math.random() * 22;
            p.style.cssText = `
                position:absolute;left:${cx}px;top:${cy}px;
                width:5px;height:5px;border-radius:50%;
                background:${cols[i % cols.length]};
                pointer-events:none;z-index:50;
                --sx:${Math.cos(ang)*d}px;--sy:${Math.sin(ang)*d}px;
                animation:sparkFly 0.45s ease-out forwards;
            `;
            parent.style.position = 'relative';
            parent.appendChild(p);
            setTimeout(() => p.remove(), 500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
