// ============================================================
//  SlimeHearth — Jewelcrafting  (game-jewelcrafting.js)
// ============================================================
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

// ── Slot state — simple itemId + itemKey tracking, no body refs ──
// Items are removed from gs.inventory on drop; returned with addItem on clear
const jcSlots = { 1: null, 2: null, 3: null };
// { itemId: 'copper_bar', itemKey: 'copper_bar_5' }

// ── Init ─────────────────────────────────────────────────────
function init() {
    const gotoBtn = document.getElementById('goto-jewelcrafting');
    if (gotoBtn) gotoBtn.onclick = () => window.switchRoom('jewelcrafting-room');

    const leaveBtn = document.getElementById('leave-jewelcrafting');
    if (leaveBtn) leaveBtn.onclick = () => window.switchRoom('forge-menu-room');

    const craftBtn = document.getElementById('jc-craft-btn');
    if (craftBtn) craftBtn.onclick = onCraft;

    window.jcOnEnter        = onEnterRoom;
    window.lockItemInJCSlot = lockItemInJCSlot;
    refreshAll();
}

// Called every time the JC room becomes active — just refresh UI
function onEnterRoom() {
    refreshAll();
}

// ── Lock item into slot (called from game-basket enddrag) ─────
function lockItemInJCSlot(body, slotNumber) {
    const itemId  = body.itemId;
    const itemKey = body.itemKey;
    if (!itemId) return;

    // If slot already occupied, return old item to inventory first
    if (jcSlots[slotNumber]) {
        addItem(jcSlots[slotNumber].itemId, 1);
    }

    // Remove this item from inventory and from physics world
    if (gs.inventory && itemKey) delete gs.inventory[itemKey];
    if (basketEngine) Matter.World.remove(basketEngine.world, body);
    const bIdx = basketBodies.indexOf(body);
    if (bIdx > -1) basketBodies.splice(bIdx, 1);
    updateInventoryCounter();

    // Store slot state
    jcSlots[slotNumber] = { itemId, itemKey };

    save();
    refreshAll();
    spawnDropSpark(document.getElementById('jc-slot' + slotNumber), slotNumber === 3);
}

// ── Clear a slot (X button) — return item to inventory ───────
window.jcClearSlot = function(n) {
    if (!jcSlots[n]) return;
    spawnSlotEject(document.getElementById('jc-slot' + n));
    addItem(jcSlots[n].itemId, 1);
    jcSlots[n] = null;
    save();
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
        const s      = jcSlots[n];
        const itemId = s ? s.itemId : null;
        const wrap   = document.getElementById('jc-slot' + n);
        const clr    = document.getElementById('jc-slot' + n + '-clear');
        if (!wrap) return;

        if (itemId) {
            const data   = typeof ITEM_DATA !== 'undefined' ? ITEM_DATA[itemId] : null;
            const imgSrc = typeof ITEM_IMAGES !== 'undefined' ? ITEM_IMAGES[itemId] : null;
            const nameStr = data ? data.name.replace(/[^\w\s'\-]/g, '').trim() : itemId;
            const iconHtml = imgSrc
                ? `<img src="${imgSrc}" style="width:34px;height:34px;object-fit:contain;animation:geodeLock 0.3s ease-out;" />`
                : `<span style="font-size:22px;line-height:1;animation:geodeLock 0.3s ease-out;">${data ? (data.emoji || (n < 3 ? '⬜' : '💎')) : (n < 3 ? '⬜' : '💎')}</span>`;
            wrap.innerHTML = iconHtml + `<span style="font-size:7px;font-weight:bold;color:#fff;text-align:center;margin-top:2px;max-width:52px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-family:'Righteous',sans-serif;">${nameStr}</span>`;
            wrap.style.border     = '2px solid #22c55e';
            wrap.style.boxShadow  = '0 0 8px rgba(34,197,94,0.4)';
            wrap.style.background = 'rgba(88,28,135,0.3)';
            if (clr) clr.style.display = 'block';
        } else {
            const isGem = n === 3;
            wrap.innerHTML = `<span style="font-size:20px;line-height:1;">${isGem ? '💎' : '⬜'}</span><span style="font-size:7px;color:${isGem ? 'rgba(200,160,255,0.7)' : 'rgba(255,255,255,0.5)'};font-family:'Righteous',sans-serif;margin-top:2px;">${isGem ? 'GEM' : 'BAR'}</span>`;
            wrap.style.border     = isGem ? '2px dashed rgba(160,100,255,0.4)' : '2px dashed rgba(255,255,255,0.25)';
            wrap.style.boxShadow  = '';
            wrap.style.background = 'rgba(0,0,0,0.3)';
            if (clr) clr.style.display = 'none';
        }
    });
}

// Burst particles outward from the slot element when clearing
function spawnSlotEject(slotEl) {
    if (!slotEl) return;
    const room = slotEl.closest('.room') || document.body;
    const sr   = slotEl.getBoundingClientRect();
    const rr   = room.getBoundingClientRect();
    const cx   = sr.left - rr.left + sr.width  / 2;
    const cy   = sr.top  - rr.top  + sr.height / 2;
    const cols = ['#c084fc','#a855f7','#e879f9','#ffd700','#fff'];
    for (let i = 0; i < 10; i++) {
        const p  = document.createElement('div');
        const a  = (i / 10) * Math.PI * 2;
        const d  = 18 + Math.random() * 22;
        const sz = 5 + Math.random() * 5;
        p.style.cssText = `
            position:absolute;left:${cx}px;top:${cy}px;
            width:${sz}px;height:${sz}px;border-radius:50%;
            background:${cols[i % cols.length]};
            pointer-events:none;z-index:200;
            transform:translate(-50%,-50%);
            animation:jcEject 0.4s ease-out forwards;
            --ex:${Math.cos(a) * d}px;--ey:${Math.sin(a) * d}px;
        `;
        room.appendChild(p);
        setTimeout(() => p.remove(), 420);
    }
}

function updateBarsAndOrb() {
    const jcLevel   = gs?.skills?.jewelcrafting?.level || 1;
    const jc        = gs?.jewelcraft || { ring: 1, amulet: 1, watch: 1 };
    const amuletPct = Math.max(0, ((jc.amulet || 1) - 1));

    const id1 = jcSlots[1]?.itemId; const id2 = jcSlots[2]?.itemId; const id3 = jcSlots[3]?.itemId;
    const pct1 = id1 ? (BAR_CHANCE[id1] || 0) : 0;
    const pct2 = id2 ? (BAR_CHANCE[id2] || 0) : 0;
    const pct3 = id3 ? (GEM_CHANCE[id3] || 0) : 0;
    const pct4 = parseFloat(skillPct(jcLevel).toFixed(1));

    setBar('jc-bar1', !!id1, pct1, id1 ? BAR_COLOR[id1] : null, 'jc-bar1-pct', pct1 ? pct1 + '%' : '0%');
    setBar('jc-bar2', !!id2, pct2, id2 ? BAR_COLOR[id2] : null, 'jc-bar2-pct', pct2 ? pct2 + '%' : '0%');
    setBar('jc-bar3', !!id3, pct3, id3 ? GEM_COLOR[id3] : null, 'jc-bar3-pct', pct3 ? pct3 + '%' : '0%');
    setBar4(pct4);

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
    const jc = gs?.jewelcraft || { ring: 1, amulet: 1, watch: 1 };
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
    if (!jcSlots[1] || !jcSlots[2] || !jcSlots[3]) {
        notify('💍 Fill all 3 slots first!');
        return;
    }

    const jcLevel = gs?.skills?.jewelcrafting?.level || 1;
    const jc      = gs?.jewelcraft || { ring: 1, amulet: 1, watch: 1 };
    const pct1 = BAR_CHANCE[jcSlots[1].itemId] || 0;
    const pct2 = BAR_CHANCE[jcSlots[2].itemId] || 0;
    const pct3 = GEM_CHANCE[jcSlots[3].itemId] || 0;
    const pct4 = parseFloat(skillPct(jcLevel).toFixed(1));
    const amuletBonus = Math.max(0, ((jc.amulet || 1) - 1));
    const totalChance = Math.min(100, pct1 + pct2 + pct3 + pct4 + amuletBonus);

    // Consume slots — items already removed from inventory when dropped in
    jcSlots[1] = null; jcSlots[2] = null; jcSlots[3] = null;

    // Roll
    const roll = Math.random() * 100;
    const success = roll < totalChance;

    if (success) {
        if (!gs.jewelcraft) gs.jewelcraft = { ring: 1, amulet: 1, watch: 1 };
        const cards = ['ring', 'amulet', 'watch'];
        const picked = cards[Math.floor(Math.random() * cards.length)];
        gs.jewelcraft[picked] = (gs.jewelcraft[picked] || 1) + 1;

        const icons = { ring: '\u{1F48D}', amulet: '\u{1F4FF}', watch: '\u231A' };
        notify('\u2728 ' + icons[picked] + ' ' + picked.charAt(0).toUpperCase() + picked.slice(1) + ' leveled up! Lv ' + gs.jewelcraft[picked], 'achievement');

        const lvlSound = document.getElementById('skill-levelup-sound');
        if (lvlSound) { lvlSound.currentTime = 0; lvlSound.play().catch(() => {}); }
        if (typeof addSkillXP === 'function') addSkillXP('jewelcrafting', 50);
        spawnCardExplosion(document.getElementById('jc-card-' + picked));
    } else {
        notify('\uD83D\uDC94 Craft failed! (rolled ' + Math.round(roll) + '%, needed <' + Math.round(totalChance) + '%)');
        if (typeof addSkillXP === 'function') addSkillXP('jewelcrafting', 10);
    }

    save();
    refreshAll();
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
