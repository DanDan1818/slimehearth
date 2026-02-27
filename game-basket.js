        // ===== BASKET PHYSICS =====
        const { Engine, Render, Bodies, World, Mouse, MouseConstraint, Events, Runner } = Matter;
        
        let basketEngine = null;
        let basketRender = null;
        let basketRunner = null;
        let basketBodies = [];
        let sellWalls = [];
        
        // Sell basket
        let sellBasketEngine = null;
        let sellBasketRender = null;
        let sellBasketRunner = null;
        let sellBasketBodies = [];
        let sellBasketMouseConstraint = null;
        let mouseConstraint = null;
        
        // ===== UTILITY FUNCTIONS =====
        // Format coins with commas: 1234567 → 1,234,567
        function formatCoins(n) {
            n = Math.min(Math.floor(n), 999999);
            return n.toLocaleString();
        }
        
        function showItemTooltip(itemId, itemKey) {
            // Remove existing tooltip
            const existing = document.getElementById('item-tooltip');
            if (existing) existing.remove();
            
            if (!itemId || !ITEM_DATA[itemId]) return;
            
            const data = ITEM_DATA[itemId];
            
            // Fish size info
            let fishSizeHtml = '';
            let displaySellValue = data.sellValue;
            if (/^fish\d+$/.test(itemId) && itemKey && gs.fishSizes && gs.fishSizes[itemKey]) {
                const kg = gs.fishSizes[itemKey];
                const mult = fishSizeMult(kg, itemId);
                const sLabel = fishSizeLabel(kg);
                displaySellValue = Math.round(data.sellValue * mult);
                fishSizeHtml = `<div style="font-size:10px;color:#fff;font-weight:bold;margin-top:3px;text-shadow:0 1px 2px rgba(0,0,0,0.6);">⚖️ ${kg} kg · ${sLabel}</div>`;
            }

            const rarityBorderColor = data.rarityColor === 'rainbow' ? '#d946ef' : (data.rarityColor === '#111111' ? '#666666' : data.rarityColor);
            const headerBg = data.rarityColor === 'rainbow'
                ? 'linear-gradient(90deg,#f87171,#fb923c,#facc15,#4ade80,#60a5fa,#c084fc)'
                : data.rarityColor;

            const tooltip = document.createElement('div');
            tooltip.id = 'item-tooltip';
            tooltip.innerHTML = `
                <div style="background:${headerBg};margin:-8px -10px 6px -10px;padding:5px 10px;border-radius:6px 6px 0 0;display:flex;align-items:center;justify-content:space-between;gap:6px;">
                    <span style="font-family:'Righteous',sans-serif;font-size:13px;font-weight:bold;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;text-shadow:0 1px 3px rgba(0,0,0,0.7);">${data.name}</span>
                    <span style="font-size:11px;font-weight:bold;color:#fff;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.7);">💰 ${displaySellValue}</span>
                </div>
                <div style="font-size:11px;color:#fff;line-height:1.4;margin-bottom:${data.feedable || data.crackable ? '5px' : '0'};text-shadow:0 1px 2px rgba(0,0,0,0.6);">
                    ${data.description}
                </div>
                ${fishSizeHtml}
                ${data.feedable ? `<div style="font-size:11px;color:#fff;font-weight:bold;text-shadow:0 1px 2px rgba(0,0,0,0.6);">❤️ +${data.foodValue} Food</div>` : ''}
                ${data.crackable ? `<div style="font-size:11px;color:#fff;font-weight:bold;margin-top:2px;text-shadow:0 1px 2px rgba(0,0,0,0.6);">🔨 Crackable</div>` : ''}
            `;

            tooltip.style.cssText = `
                position: fixed;
                bottom: 235px;
                left: max(8px, calc(50% - 242px));
                transform: none;
                background-color: #7abdd6;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.4' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.14'/%3E%3C/svg%3E"), linear-gradient(90deg, #6aaec8 0%, #8dcae0 50%, #6aaec8 100%);
                background-blend-mode: multiply, normal;
                color: #fff;
                padding: 8px 10px;
                border-radius: 8px;
                z-index: 1000;
                border: 2px solid ${rarityBorderColor};
                box-shadow: 0 3px 6px rgba(0,0,0,0.4);
                width: 115px;
                text-align: left;
                pointer-events: none;
                font-family: sans-serif;
            `;
            
            document.body.appendChild(tooltip);
        }
        
        function hideItemTooltip() {
            const tooltip = document.getElementById('item-tooltip');
            if (tooltip) tooltip.remove();
        }
        
        function openBasket() {
            notify('🧺 Opening Basket!', 'achievement');
            
            // Basket now drops 3 Gems
            addItem('gem', 3);
            notify('Found: 3 Gems! 💎');
        }
        
        function notifyInventoryFull() {
            // Special notification for inventory full - bigger and centered at bottom
            const existing = document.getElementById('inventory-full-notif');
            if (existing) return; // Don't spam
            
            const notif = document.createElement('div');
            notif.id = 'inventory-full-notif';
            notif.textContent = '📦 INVENTORY FULL (6/6)';
            notif.style.cssText = `
                position: fixed;
                bottom: 200px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255,69,0,0.95);
                color: #fff;
                padding: 10px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                z-index: 10000;
                border: 2px solid #fff;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                animation: fadeOut 0.3s 2.7s;
            `;
            
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        }
        
        window.skillFireworks = function(skillName) {
            const btn = document.getElementById('skills-btn-wrap');
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            const skillColors = {
                fishing:      ['#93c5fd','#60a5fa','#3b82f6','#1d4ed8','#bfdbfe','#e0f2fe'],
                farming:      ['#86efac','#4ade80','#16a34a','#166534','#bbf7d0','#dcfce7'],
                cooking:      ['#fdba74','#fb923c','#ea580c','#fef08a','#fde68a','#fff7ed'],
                mining:       ['#d4a96a','#a16207','#78350f','#fbbf24','#fde68a','#d97706'],
                prospecting:  ['#d8b4fe','#c084fc','#9333ea','#6b21a8','#f3e8ff','#e9d5ff'],
                smelting:     ['#fed7aa','#fb923c','#ea580c','#92400e','#fef3c7','#ffedd5'],
                jewelcrafting:['#f0abfc','#e879f9','#a855f7','#7c3aed','#fde68a','#ffd700'],
            };
            const colors = skillColors[skillName] || ['#fff','#ffd700','#ff6b6b','#4ecdc4'];

            // Multiple burst waves
            for (let wave = 0; wave < 3; wave++) {
                setTimeout(() => {
                    const waveCount = 20 + Math.floor(Math.random() * 15);
                    for (let i = 0; i < waveCount; i++) {
                        (function() {
                            const p = document.createElement('div');
                            const color = colors[Math.floor(Math.random() * colors.length)];
                            const size = 3 + Math.random() * 7;
                            const isStreak = Math.random() < 0.4;
                            const w = isStreak ? (2 + Math.random() * 3) : size;
                            const h = isStreak ? (size * 3) : size;
                            const angle = Math.random() * Math.PI * 2;
                            const power = 60 + Math.random() * 120;
                            const tx = cx + Math.cos(angle) * power;
                            const ty = cy + Math.sin(angle) * power;
                            const duration = 0.5 + Math.random() * 0.5;
                            const gravity = 40 + Math.random() * 60;
                            const rot1 = Math.random() * 360;
                            const rot2 = Math.random() * 720;

                            p.style.position = 'fixed';
                            p.style.width = w + 'px';
                            p.style.height = h + 'px';
                            p.style.borderRadius = isStreak ? '2px' : '50%';
                            p.style.background = color;
                            p.style.boxShadow = `0 0 6px 2px ${color}cc, 0 0 12px ${color}66`;
                            p.style.pointerEvents = 'none';
                            p.style.zIndex = '99999';
                            p.style.left = cx + 'px';
                            p.style.top = cy + 'px';
                            p.style.transform = `translate(-50%,-50%) rotate(${rot1}deg)`;
                            document.body.appendChild(p);

                            // Double rAF ensures element is painted before transition
                            requestAnimationFrame(() => requestAnimationFrame(() => {
                                p.style.transition = `left ${duration}s cubic-bezier(0.2,0.8,0.4,1), top ${duration}s cubic-bezier(0.2,0.9,0.4,1), opacity ${duration * 0.4}s ${duration * 0.6}s ease-in, transform ${duration}s linear`;
                                p.style.left = tx + 'px';
                                p.style.top = (ty + gravity) + 'px';
                                p.style.opacity = '0';
                                p.style.transform = `translate(-50%,-50%) rotate(${rot2}deg) scale(0.2)`;
                            }));

                            setTimeout(() => p.remove(), (duration + 0.2) * 1000);
                        })();
                    }
                }, wave * 180);
            }

            // Glow pulse the skills button itself — reset all styles fully after
            btn.style.transition = 'box-shadow 0.15s, transform 0.15s';
            btn.style.boxShadow = `0 0 20px 8px ${colors[0]}, 0 0 40px 16px ${colors[0]}88`;
            btn.style.transform = 'scale(1.08)';
            setTimeout(() => {
                btn.style.transition = 'box-shadow 0.4s, transform 0.3s';
                btn.style.boxShadow = '';
                btn.style.transform = '';
            }, 400);
        };

        function notifySkillLevelup(skillName, level) {
            console.log('LEVEL UP:', skillName, level);
            const name = skillName.charAt(0).toUpperCase() + skillName.slice(1);
            const container = document.getElementById('special-notifications');
            const notif = document.createElement('div');
            notif.className = 'special-notification skill-' + skillName;
            notif.textContent = name + ' Level Up!  Level ' + level;
            container.appendChild(notif);
            setTimeout(() => notif.remove(), 5000);
            if (window.skillFireworks) window.skillFireworks(skillName);
            const skillLevelupSound = document.getElementById('skill-levelup-sound');
            if (skillLevelupSound) { skillLevelupSound.currentTime = 0; skillLevelupSound.play().catch(() => {}); }
        }

        function notify(message, type = 'normal') {
            // Level-ups and achievements go to special top-center container
            if (type === 'levelup' || type === 'achievement') {
                const container = document.getElementById('special-notifications');
                
                const notif = document.createElement('div');
                notif.className = 'special-notification';
                
                if (type === 'achievement') {
                    notif.classList.add('achievement');
                }
                
                notif.textContent = message;
                container.appendChild(notif);
                setTimeout(() => notif.remove(), 5000);
                return;
            }
            
            // Normal and warning notifications go to regular left container
            const container = document.getElementById('notifications');
            
            // Limit to 5 notifications
            const existing = container.querySelectorAll('.notification');
            if (existing.length >= 5) {
                existing[0].remove(); // Remove oldest
            }
            
            const notif = document.createElement('div');
            notif.className = 'notification';
            
            // Add type-specific class
            if (type === 'warning') {
                notif.classList.add('warning');
            }
            
            notif.textContent = message;
            container.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        }
        
        function save() {
            localStorage.setItem('slimeKeeper', JSON.stringify(gs));
        }
        
        function load() {
            const saved = localStorage.getItem('slimeKeeper');
            if (saved) {
                Object.assign(gs, JSON.parse(saved));
                
                // Initialize slime XP if it doesn't exist (old saves)
                if (gs.slimeXP === undefined) {
                    gs.slimeXP = 0;
                    gs.slimeXPNeeded = 10;
                }
                
                // Initialize skills if they don't exist (old saves)
                if (!gs.skills) {
                    gs.skills = {
                        fishing: { level: 1, xp: 0, xpNeeded: 10 },
                        farming: { level: 1, xp: 0, xpNeeded: 10 },
                        cooking: { level: 1, xp: 0, xpNeeded: 10 },
                        mining:  { level: 1, xp: 0, xpNeeded: 10 },
                        smelting: { level: 1, xp: 0, xpNeeded: 10 },
                        jewelcrafting: { level: 1, xp: 0, xpNeeded: 10 }
                    };
                }
                if (!gs.skills.mining)        gs.skills.mining        = { level: 1, xp: 0, xpNeeded: 10 };
                if (!gs.skills.smelting)      gs.skills.smelting      = { level: 1, xp: 0, xpNeeded: 10 };
                if (!gs.skills.jewelcrafting) gs.skills.jewelcrafting = { level: 1, xp: 0, xpNeeded: 10 };
                
                // Initialize bag upgrade system (old saves)
                if (gs.maxInventory === undefined) {
                    gs.maxInventory = 6;
                }
                if (gs.bagUpgrades === undefined) {
                    gs.bagUpgrades = 0;
                }
                
                // Patch old saves missing frogs
                if (!gs.frogs) {
                    gs.frogs = {};
                }
                
                updateUI();
                
                // Open basket if already hatched
                if (gs.hatched) {
                    setTimeout(() => openBasketPermanently(), 100);
                }
            }
        }
        
        function updateInventoryCounter() {
            const counter = document.getElementById('inventory-counter');
            if (counter) {
                const count = Object.keys(gs.inventory).length;
                counter.textContent = count + '/' + gs.maxInventory;
            }
        }
        
        function updateStatsDisplay() {
            if (!gs.stats) {
                gs.stats = {
                    doubleXpChance: 0,
                    doubleLootChance: 0,
                    bonusGeodeChance: 0,
                    rareFindChance: 0,
                    foodsEaten: 0
                };
            }
            
            document.getElementById('foods-eaten-stat').textContent = gs.stats.foodsEaten || 0;
            const topuiFoods = document.getElementById('foods-eaten-topui');
            if (topuiFoods) topuiFoods.textContent = gs.stats.foodsEaten || 0;
            document.getElementById('double-xp-stat').textContent = (gs.stats.doubleXpChance || 0).toFixed(2);
            document.getElementById('double-loot-stat').textContent = (gs.stats.doubleLootChance || 0).toFixed(2);
            document.getElementById('bonus-geode-stat').textContent = (gs.stats.bonusGeodeChance || 0).toFixed(2);
            document.getElementById('rare-find-stat').textContent = (gs.stats.rareFindChance || 0).toFixed(2);
        }
        
        function updateUI() {
            // Update basket coins display (formatted, capped at 999,999)
            gs.coins = Math.min(gs.coins, 999999);
            const basketCoins = document.getElementById('basket-coins');
            if (basketCoins) {
                basketCoins.textContent = formatCoins(gs.coins);
            }
            updateSkillsUI();
            updateFurnaceUI();
            updateOreBarUI();
            const slimeNameDisplay = document.getElementById('slime-name-display');
            if (slimeNameDisplay && gs.slimeName) {
                slimeNameDisplay.textContent = gs.slimeName;
            }
            
            document.getElementById('level-display').textContent = gs.level;
            
            // Show slime if hatched
            const slimeSquare = document.getElementById('slime-square');
            if (slimeSquare) {
                if (gs.hatched) {
                    slimeSquare.classList.add('visible');
                    // Load the saved slime variant
                    if (gs.slimeVariant) {
                        slimeSquare.style.backgroundImage = `url('./slimehearth-assets/images/${gs.slimeVariant}')`;
                    }
                } else {
                    slimeSquare.classList.remove('visible');
                }
            }
            
            // Update slime XP bar
            const slimeXPBar = document.getElementById('slime-xp-bar');
            const slimeXPText = document.getElementById('slime-xp');
            const slimeXPNeededText = document.getElementById('slime-xp-needed');
            
            if (slimeXPBar) {
                const percent = (gs.slimeXP / gs.slimeXPNeeded) * 100;
                slimeXPBar.style.height = percent + '%';
            }
            if (slimeXPText) slimeXPText.textContent = gs.slimeXP;
            if (slimeXPNeededText) slimeXPNeededText.textContent = gs.slimeXPNeeded;
            
            // Show/hide hatch button (if it exists)
            const hatchBtn = document.getElementById('hatch-btn');
            if (hatchBtn) {
                hatchBtn.style.display = gs.hatched ? 'none' : 'block';
            }
            
            // Update last skill display
            updateLastSkillDisplay();
            
            // Update slime hat display
            updateSlimeHat();
        }
        
        function updateSlimeHat() {
            const hatDisplay = document.getElementById('slime-hat');
            const hatImage = document.getElementById('slime-hat-image');
            
            if (!hatDisplay || !hatImage) return;
            
            // Check if a hat is equipped
            if (gs.equippedHat && HATS_DATA[gs.equippedHat]) {
                const hat = HATS_DATA[gs.equippedHat];
                
                // Only show if hat has an image
                if (hat.image) {
                    hatImage.src = `./slimehearth-assets/images/${hat.image}`;
                    hatDisplay.style.display = 'block';
                } else {
                    hatDisplay.style.display = 'none';
                }
            } else {
                hatDisplay.style.display = 'none';
            }
        }
        
        // Map skill names to their source element IDs for speck bursts
        const skillSourceElements = {
            fishing:     'fishing-progress-pond',
            farming:     'field-bar-wrap',
            cooking:     'hearth-bar-wrap',
            mining:      'mining-bar-wrap',
            prospecting: 'shack-bar-container',
        };

        function addSkillXP(skillName, amount) {
            if (!gs.skills) {
                gs.skills = {
                    fishing: { level: 1, xp: 0, xpNeeded: 10 },
                    farming: { level: 1, xp: 0, xpNeeded: 10 },
                    cooking: { level: 1, xp: 0, xpNeeded: 10 },
                    mining:  { level: 1, xp: 0, xpNeeded: 10 },
                    smelting: { level: 1, xp: 0, xpNeeded: 10 },
                    jewelcrafting: { level: 1, xp: 0, xpNeeded: 10 }
                };
            }
            if (!gs.skills[skillName]) {
                gs.skills[skillName] = { level: 1, xp: 0, xpNeeded: 10 };
            }

            const skill = gs.skills[skillName];
            skill.xp += amount;
            gs.lastSkillUsed = skillName;

            // Level up check
            let leveledUp = false;
            while (skill.xp >= skill.xpNeeded) {
                skill.xp -= skill.xpNeeded;
                skill.level++;
                skill.xpNeeded = Math.floor(skill.xpNeeded * 1.2);
                leveledUp = true;
                notifySkillLevelup(skillName, skill.level);
            }

            notify('+' + amount + ' ' + skillName + ' XP');
            save();
            updateSkillsUI();

            // Fire specks: 1 speck per XP, delay bar fill to match arrival
            const sourceEl = skillSourceElements[skillName];
            const speckDelay = 800; // ms — matches speck travel time
            if (window.speckXPBurst && sourceEl) {
                window.speckXPBurst(sourceEl, skillName, amount);
            }
            // Delay bar fill so it matches when specks arrive
            setTimeout(() => updateLastSkillDisplay(leveledUp), speckDelay);
        }
        
        function spawnLiquidDrop(barWrapId, color) {
            const wrap = document.getElementById(barWrapId);
            if (!wrap) return;

            // Number of drops per splash
            const count = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const drop = document.createElement('div');
                    const size = 8 + Math.floor(Math.random() * 8);
                    const xPos = 10 + Math.random() * (wrap.offsetWidth - size - 10);
                    const dur = 0.5 + Math.random() * 0.35;
                    drop.style.cssText = `
                        position:absolute;
                        left:${xPos}px;
                        top:-${size}px;
                        width:${size}px;
                        height:${size * 1.6}px;
                        border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
                        background:${color};
                        opacity:0.9;
                        pointer-events:none;
                        z-index:10;
                        animation:liquidDrop ${dur}s ease-in forwards;
                        box-shadow:0 0 4px ${color}88;
                    `;
                    wrap.appendChild(drop);

                    // Splash at the fill surface level
                    const fillEl = wrap.querySelector('[id$="-bar"]') || wrap.firstElementChild;
                    const fillPct = fillEl ? parseFloat(fillEl.style.height) / 100 : 0;
                    const splashY = wrap.offsetHeight * (1 - fillPct) - 4;

                    setTimeout(() => {
                        drop.remove();
                        // spawn splash ring at fill surface
                        const splash = document.createElement('div');
                        splash.style.cssText = `
                            position:absolute;
                            left:${xPos - size}px;
                            top:${splashY}px;
                            width:${size * 2}px;
                            height:${size * 0.5}px;
                            border-radius:50%;
                            background:${color};
                            opacity:0.7;
                            pointer-events:none;
                            z-index:10;
                            animation:liquidSplash 0.35s ease-out forwards;
                        `;
                        wrap.appendChild(splash);
                        setTimeout(() => splash.remove(), 350);
                    }, dur * 1000);
                }, i * 80);
            }
        }

        function updateFurnaceUI() {
            if (!gs.furnace) gs.furnace = { fed: 0, needed: 10 };
            const { fed, needed } = gs.furnace;
            const fedEl = document.getElementById('furnace-fed');
            const neededEl = document.getElementById('furnace-needed');
            const bar = document.getElementById('furnace-bar');
            if (fedEl) fedEl.textContent = fed;
            if (neededEl) neededEl.textContent = needed;
            if (bar) bar.style.height = Math.min(100, (fed / needed) * 100) + '%';
        }

        function updateOreBarUI() {
            const ORE_SMELT_COLORS = {
                'copper_ore': { name: 'Copper', icon: '🟤', color: '#b45309',  colorLight: '#d97706' },
                'iron_ore':   { name: 'Iron',   icon: '⚙️',  color: '#6b7280',  colorLight: '#9ca3af' },
                'silver_ore': { name: 'Silver', icon: '🔘',  color: '#9ca3af',  colorLight: '#e5e7eb' },
                'gold_ore':   { name: 'Gold',   icon: '🌟',  color: '#d97706',  colorLight: '#fbbf24' },
            };
            const bar     = document.getElementById('ore-bar');
            const label   = document.getElementById('ore-bar-label');
            const iconEl  = document.getElementById('ore-bar-icon');
            const nameEl  = document.getElementById('ore-bar-name');
            const fedEl   = document.getElementById('ore-bar-fed');
            const needEl  = document.getElementById('ore-bar-needed');
            if (!bar) return;

            const state = gs.oreSmelt || { oreType: null, fed: 0, needed: 10 };
            const pct   = state.oreType ? Math.min(100, (state.fed / state.needed) * 100) : 0;
            bar.style.height = pct + '%';

            if (state.oreType && ORE_SMELT_COLORS[state.oreType]) {
                const d = ORE_SMELT_COLORS[state.oreType];
                // Update bar gradient color
                bar.style.background = `linear-gradient(180deg, ${d.colorLight} 0%, ${d.color} 60%, ${d.color}aa 100%)`;
                // Update wave colors to match ore
                const w1 = document.getElementById('ore-wave1');
                const w2 = document.getElementById('ore-wave2');
                if (w1) w1.style.background = `radial-gradient(ellipse at 50% 100%, ${d.colorLight} 0%, ${d.color}88 50%, transparent 70%)`;
                if (w2) w2.style.background = `radial-gradient(ellipse at 50% 100%, ${d.colorLight}88 0%, ${d.color}44 60%, transparent 75%)`;
                // Show label
                if (label) label.style.display = 'inline';
                if (iconEl) iconEl.textContent = d.icon;
                if (nameEl) nameEl.textContent = d.name;
                if (fedEl)  fedEl.textContent  = state.fed;
                if (needEl) needEl.textContent = state.needed;
            } else {
                // No ore — reset bar to grey, hide label
                bar.style.background = 'linear-gradient(180deg,#aaa 0%,#666 100%)';
                if (label) label.style.display = 'none';
            }
        }

        function updateSkillsUI() {
            if (!gs.skills) return; // Safety check
            
            ['fishing', 'farming', 'cooking', 'mining', 'smelting', 'jewelcrafting'].forEach(skillName => {
                const skill = gs.skills[skillName];
                if (!skill) return; // Safety check
                
                const levelEl = document.getElementById(skillName + '-level');
                const xpEl = document.getElementById(skillName + '-xp');
                const xpNeededEl = document.getElementById(skillName + '-xp-needed');
                const barEl = document.getElementById(skillName + '-xp-bar');
                
                if (levelEl) levelEl.textContent = skill.level;
                if (xpEl) xpEl.textContent = skill.xp;
                if (xpNeededEl) xpNeededEl.textContent = skill.xpNeeded;
                if (barEl) {
                    const percent = (skill.xp / skill.xpNeeded) * 100;
                    barEl.style.width = percent + '%';
                }
            });
        }
        
        function updateLastSkillDisplay(leveledUp) {
            const display = document.getElementById('last-skill-display');
            if (!display || !gs.lastSkillUsed) return;
            
            const skill = gs.skills[gs.lastSkillUsed];
            if (!skill) return;
            
            const skillIcons = {
                'fishing': '🎣', 'farming': '🌾', 'cooking': '🍳',
                'mining': '⛏️', 'prospecting': '⛏️',
                'smelting': '🔥', 'jewelcrafting': '💍'
            };
            
            const icon = skillIcons[gs.lastSkillUsed] || '';
            const name = gs.lastSkillUsed.charAt(0).toUpperCase() + gs.lastSkillUsed.slice(1);
            display.textContent = `${icon} ${name} Lv ${skill.level}`;
            
            const skillColors = {
                'fishing': '#4dd0e1', 'farming': '#8bc34a', 'cooking': '#ff9800',
                'mining': '#78716c', 'prospecting': '#a78bfa',
                'smelting': '#f97316', 'jewelcrafting': '#c084fc'
            };
            const color = skillColors[gs.lastSkillUsed] || '#9c27b0';
            
            const xpBar = document.getElementById('last-skill-xp-bar');
            if (!xpBar) return;
            
            xpBar.style.background = color;
            const targetPct = (skill.xp / skill.xpNeeded) * 100;

            const xpText = document.getElementById('last-skill-xp-text');
            const updateXpText = (pct) => {
                if (!xpText) return;
                xpText.textContent = `${skill.xp} / ${skill.xpNeeded} XP`;
            };
            
            if (leveledUp) {
                xpBar.style.transition = 'none';
                xpBar.style.width = '100%';
                if (xpText) xpText.textContent = `${skill.xpNeeded} / ${skill.xpNeeded} XP`;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        xpBar.style.transition = 'width 0.3s ease-in';
                        xpBar.style.width = '0%';
                        if (xpText) xpText.textContent = '0 / ' + skill.xpNeeded + ' XP';
                        setTimeout(() => {
                            xpBar.style.transition = 'width 3s ease-out';
                            xpBar.style.width = targetPct + '%';
                            updateXpText();
                        }, 350);
                    });
                });
            } else {
                xpBar.style.transition = 'width 3s ease-out';
                xpBar.style.width = targetPct + '%';
                updateXpText();
            }
        }
        
        function levelUpBurst() {
            const slime = document.getElementById('slime-square');
            if (!slime) return;
            const rect = slime.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            
            const container = document.createElement('div');
            container.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:0;height:0;pointer-events:none;z-index:45;`;
            
            // Central glow burst
            const glow = document.createElement('div');
            glow.style.cssText = `position:absolute;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(255,240,0,0.95) 0%,rgba(255,180,0,0.7) 40%,rgba(255,120,0,0) 70%);animation:levelUpBurstGlow 0.8s ease-out forwards;pointer-events:none;`;
            container.appendChild(glow);
            
            // Stars / sparks
            const starChars = ['★','✦','✸','✺','⭐','💫'];
            const count = 18;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * 360;
                const dist = 55 + Math.random() * 55;
                const tx = Math.cos(angle * Math.PI / 180) * dist;
                const ty = Math.sin(angle * Math.PI / 180) * dist;
                const tr = (Math.random() - 0.5) * 360;
                const delay = Math.random() * 0.15;
                const duration = 0.6 + Math.random() * 0.5;
                const size = 10 + Math.floor(Math.random() * 14);
                const colors = ['#ffe600','#ffd000','#ffb800','#fff200','#ffec4f','#fffacd'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const char = starChars[Math.floor(Math.random() * starChars.length)];
                
                const star = document.createElement('div');
                star.textContent = char;
                star.style.cssText = `
                    position:absolute;
                    font-size:${size}px;
                    color:${color};
                    text-shadow:0 0 6px rgba(255,220,0,0.9), 0 0 12px rgba(255,180,0,0.6);
                    left:-${size/2}px;
                    top:-${size/2}px;
                    --tx:${tx}px;
                    --ty:${ty}px;
                    --tr:${tr}deg;
                    animation:levelUpStar ${duration}s ease-out ${delay}s forwards;
                    opacity:1;
                    pointer-events:none;
                `;
                container.appendChild(star);
            }
            
            document.body.appendChild(container);
            setTimeout(() => container.remove(), 2000);
        }
        
        // ── Fish Size System ──
        // Each species has a min/max kg range. Size rolls on a bell curve.
        // Size multiplier on sell: 0.5x (tiny) to 2.5x (massive).
        const FISH_SIZE_RANGES = {
            'fish1': { min: 0.1, max: 1.2, label: 'Common Fish'   },
            'fish2': { min: 0.2, max: 1.8, label: 'Blue Fish'     },
            'fish3': { min: 0.4, max: 2.5, label: 'Tropical Fish' },
            'fish4': { min: 0.8, max: 4.0, label: 'Golden Fish'   },
            'fish5': { min: 0.3, max: 2.0, label: 'Lobster'       },
            'fish6': { min: 0.05,max: 0.6, label: 'Shrimp'        },
            'fish7': { min: 0.2, max: 1.6, label: 'Crab'          },
            'fish8': { min: 2.0, max: 18.0,label: 'Shark'         },
        };

        function rollFishSize(fishId) {
            const range = FISH_SIZE_RANGES[fishId];
            if (!range) return null;
            // Bell curve: average of 3 randoms gives natural bell
            const r = (Math.random() + Math.random() + Math.random()) / 3;
            const kg = range.min + r * (range.max - range.min);
            return Math.round(kg * 100) / 100; // 2 decimal places
        }

        function fishSizeLabel(kg) {
            if (kg === null || kg === undefined) return '';
            if (kg < 0.15) return '🐟 Tiny';
            if (kg < 0.5)  return '🐟 Small';
            if (kg < 1.2)  return '🐠 Average';
            if (kg < 2.5)  return '🐡 Large';
            if (kg < 5.0)  return '🦈 Huge';
            return '🦈 MASSIVE';
        }

        function fishSizeMult(kg, fishId) {
            if (kg === null || kg === undefined) return 1;
            const range = FISH_SIZE_RANGES[fishId];
            if (!range) return 1;
            // Normalize 0→1 across the range, map to 0.5x→2.5x
            const norm = (kg - range.min) / (range.max - range.min);
            return Math.round((0.5 + norm * 2.0) * 100) / 100;
        }

        function addFish(fishId) {
            // Add fish to inventory, roll size, store it, track record
            const currentCount = Object.keys(gs.inventory).length;
            if (currentCount >= gs.maxInventory) { notifyInventoryFull(); return null; }

            const key = fishId + '_' + gs.itemCounter++;
            gs.inventory[key] = fishId;

            if (!gs.fishSeen)  gs.fishSeen  = {};
            if (!gs.fishSizes) gs.fishSizes  = {};
            if (!gs.fishBest)  gs.fishBest   = {};

            gs.fishSeen[fishId] = true;

            const kg = rollFishSize(fishId);
            if (kg !== null) {
                gs.fishSizes[key] = kg;
                if (!gs.fishBest[fishId] || kg > gs.fishBest[fishId]) {
                    gs.fishBest[fishId] = kg;
                    const sLabel = fishSizeLabel(kg);
                    notify(`🏆 New record! ${sLabel} ${ITEM_DATA[fishId].name} — ${kg} kg!`, 'achievement');
                } else {
                    const sLabel = fishSizeLabel(kg);
                    const mult   = fishSizeMult(kg, fishId);
                    notify(`🎣 Caught ${ITEM_DATA[fishId].name} · ${kg} kg (${sLabel}) · 💰 ×${mult}`);
                }
            }

            save();
            updateInventoryCounter();

            const container = document.getElementById('basket-container');
            if (container && container.classList.contains('active') && basketEngine) {
                spawnSingleItem(key);
            }
            return key;
        }

        function addItem(itemId, quantity = 1) {
            const currentCount = Object.keys(gs.inventory).length;
            const spaceLeft = gs.maxInventory - currentCount;
            
            if (spaceLeft <= 0) {
                notifyInventoryFull();
                return;
            }
            
            const toAdd = Math.min(quantity, spaceLeft);
            const addedKeys = [];
            for (let i = 0; i < toAdd; i++) {
                const key = itemId + '_' + gs.itemCounter++;
                gs.inventory[key] = itemId;
                addedKeys.push(key);
            }

            // Mark fish as seen for Fish Collection
            if (/^fish\d+$/.test(itemId)) {
                if (!gs.fishSeen) gs.fishSeen = {};
                gs.fishSeen[itemId] = true;
            }

            save();
            
            // Get proper item name from ITEM_DATA
            const itemName = ITEM_DATA[itemId] ? ITEM_DATA[itemId].name : itemId;
            
            if (toAdd < quantity) {
                notify(`+${toAdd} ${itemName} (inventory full!)`);
            } else {
                notify(`+${toAdd} ${itemName}`);
            }
            
            updateInventoryCounter();
            
            // Only spawn new items if basket is open
            const container = document.getElementById('basket-container');
            if (container && container.classList.contains('active') && basketEngine) {
                addedKeys.forEach(key => spawnSingleItem(key));
            }
        }
        
        // ===== NAVIGATION =====
        function switchRoom(roomId) {
            const overlay = document.getElementById('room-transition');
            if (overlay) {
                // Flash black overlay: fade in quickly, swap room at peak, fade out
                overlay.style.opacity = '1';
                overlay.style.transition = 'opacity 0.08s ease-in';
                overlay.classList.remove('active');
                
                setTimeout(() => {
                    // Swap room at peak darkness
                    document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
                    document.getElementById(roomId).classList.add('active');
                    doSwitchRoom(roomId);
                    
                    // Fade out
                    overlay.style.transition = 'opacity 0.15s ease-out';
                    overlay.style.opacity = '0';
                }, 80);
                return;
            }
            
            document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
            document.getElementById(roomId).classList.add('active');
            doSwitchRoom(roomId);
        }
        
        function doSwitchRoom(roomId) {
            
            // Hide basket canvas interaction in nav-only rooms where buttons would be blocked
            const basketContainer = document.getElementById('basket-container');
            const basketCanvas = document.getElementById('basket-canvas');
            const noBasketRooms = ['room-room', 'wardrobe-room', 'trophies-room', 'area-room', 'fishing-menu-room', 'farming-menu-room', 'mining-menu-room', 'forge-menu-room'];
            if (basketContainer) {
                if (noBasketRooms.includes(roomId)) {
                    basketContainer.style.pointerEvents = 'none';
                    basketContainer.style.opacity = '0';
                    if (basketCanvas) basketCanvas.style.pointerEvents = 'none';
                } else {
                    basketContainer.style.pointerEvents = '';
                    basketContainer.style.opacity = '1';
                    if (basketCanvas) basketCanvas.style.pointerEvents = '';
                }
            }
            
            // Update bag images based on room
            const inventoryBag = document.getElementById('basket-bg-image');
            const sellBag = document.getElementById('sell-bag-image');
            const sellAreaLeft = document.getElementById('sell-area-left');
            const sellAreaRight = document.getElementById('sell-area-right');
            const sellAreaBottom = document.getElementById('sell-area-bottom');
            const greenSellBox = document.getElementById('green-sell-box');
            const isInShop = (roomId === 'shop-room');
            
            if (inventoryBag && sellBag) {
                if (isInShop) {
                    // In shop - show BOTH bags (green box stays hidden until drag)
                    inventoryBag.style.display = 'block';
                    sellBag.style.display = 'block';
                    // Don't show green box here - it's shown on drag start
                } else {
                    // Not in shop - show only inventory bag
                    inventoryBag.style.display = 'block';
                    sellBag.style.display = 'none';
                    // green sell box stays invisible (opacity:0) - no display toggle needed
                }
            }
            
            // Show/hide sell basket walls based on room
            if (basketEngine && sellWalls.length > 0) {
                // Remove sell walls first
                sellWalls.forEach(wall => {
                    if (wall.isStatic) World.remove(basketEngine.world, wall);
                });
                
                // Add sell walls only if in shop
                if (roomId === 'shop-room') {
                    // Recreate sell walls with current position
                    const { Bodies } = Matter;
                    
                    // Use same position for all devices now that canvas is 700px
                    // Right side: 550-676 (126px wide)
                    const sellMinX = 550;
                    const sellMaxX = 676;
                    const sellBasketCenterX = (sellMinX + sellMaxX) / 2;
                    const sellBasketWidth = sellMaxX - sellMinX;
                    
                    const sellBasketBottom = 1194;
                    const sellWallHeight = 60;  // Shorter walls
                    const sellWallThickness = 6;
                    
                    // Create LEFT wall
                    const sellLeftWall = Bodies.rectangle(
                        sellMinX + sellWallThickness/2,
                        sellBasketBottom - sellWallHeight/2,
                        sellWallThickness,
                        sellWallHeight,
                        { 
                            isStatic: true, 
                            friction: 0.8,
                            restitution: 0.3,
                            render: { fillStyle: 'lime', strokeStyle: 'lime', lineWidth: 3, visible: true }
                        }
                    );
                    
                    // Create RIGHT wall
                    const sellRightWall = Bodies.rectangle(
                        sellMaxX - sellWallThickness/2,
                        sellBasketBottom - sellWallHeight/2,
                        sellWallThickness,
                        sellWallHeight,
                        { 
                            isStatic: true,
                            friction: 0.8,
                            restitution: 0.3,
                            render: { fillStyle: 'lime', strokeStyle: 'lime', lineWidth: 3, visible: true }
                        }
                    );
                    
                    // Create BOTTOM bar
                    const sellBottom = Bodies.rectangle(
                        sellBasketCenterX,
                        sellBasketBottom - 10,
                        sellBasketWidth,
                        20,
                        { 
                            isStatic: true,
                            friction: 0.8,
                            restitution: 0.3,
                            render: { fillStyle: 'lime', strokeStyle: 'lime', lineWidth: 3, visible: true }
                        }
                    );
                    
                    // Create BIG VISIBLE GREEN BACKGROUND BOX (for visibility)
                    const greenBox = Bodies.rectangle(
                        sellBasketCenterX,
                        sellBasketBottom - sellWallHeight/2,
                        sellBasketWidth - 12,
                        sellWallHeight - 10,
                        {
                            isStatic: true,
                            isSensor: true,  // Doesn't block items
                            render: { 
                                fillStyle: 'rgba(0, 255, 0, 0.6)',  // Brighter green
                                strokeStyle: 'lime', 
                                lineWidth: 3,
                                visible: true,
                                zIndex: 9999  // Over everything
                            }
                        }
                    );
                    
                    sellWalls = [sellLeftWall, sellRightWall, sellBottom, greenBox];
                    World.add(basketEngine.world, sellWalls);
                }
            }

            // Notify jewelcrafting to refresh UI whenever the room is entered
            if (roomId === 'jewelcrafting-room' && window.jcOnEnter) window.jcOnEnter();
        }

        document.getElementById('nav-home').onclick = () => switchRoom('home-room');
        document.getElementById('nav-area').onclick = () => switchRoom('area-room');
        
        // Giant Slime room back button
        const leaveFurnaceBtn = document.getElementById('leave-furnace');
        if (leaveFurnaceBtn) leaveFurnaceBtn.onclick = () => switchRoom('forge-menu-room');

        // Forge menu nav
        const gotoSmithingBtn = document.getElementById('goto-furnace');
        if (gotoSmithingBtn) gotoSmithingBtn.onclick = () => switchRoom('furnace-room');
        const backToForgeBtn = document.getElementById('back-to-area-forge');
        if (backToForgeBtn) backToForgeBtn.onclick = () => switchRoom('area-room');
        document.getElementById('nav-shop').onclick = () => {
            switchRoom('shop-room');
            displayShopGrid();
        };
        document.getElementById('nav-room').onclick = () => switchRoom('room-room');
        document.getElementById('nav-settings').onclick = () => {
            const overlay = document.getElementById('settings-overlay');
            const backdrop = document.getElementById('settings-backdrop');
            if (overlay.style.display === 'none') {
                overlay.style.display = 'block';
                backdrop.style.display = 'block';
            } else {
                overlay.style.display = 'none';
                backdrop.style.display = 'none';
            }
        };
        
        document.getElementById('close-settings').onclick = () => {
            document.getElementById('settings-overlay').style.display = 'none';
            document.getElementById('settings-backdrop').style.display = 'none';
        };
        
        // Click backdrop to close
        document.getElementById('settings-backdrop').onclick = () => {
            document.getElementById('settings-overlay').style.display = 'none';
            document.getElementById('settings-backdrop').style.display = 'none';
        };
        function openOverlay(overlay, btn) {
            const topUI = document.getElementById('top-ui');
            const btnRect = btn.getBoundingClientRect();
            const uiRect = topUI.getBoundingClientRect();
            const isSkills = overlay.id === 'skills-overlay';
            overlay.style.width = (btnRect.width - (isSkills ? 17 : 18)) + 'px';
            overlay.style.left = isSkills ? 'auto' : btnRect.left + 'px';
            overlay.style.right = isSkills ? (window.innerWidth - btnRect.right) + 'px' : 'auto';
            overlay.style.top = uiRect.bottom + 'px';
            overlay.style.display = 'block';
            overlay.classList.remove('rolling');
            void overlay.offsetWidth; // force reflow
            overlay.classList.add('unrolling');
        }
        function closeOverlay(overlay) {
            overlay.classList.remove('unrolling');
            overlay.classList.add('rolling');
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.remove('rolling');
            }, 250);
        }
        document.getElementById('skills-btn').onclick = () => {
            const overlay = document.getElementById('skills-overlay');
            if (overlay.style.display === 'none') {
                openOverlay(overlay, document.getElementById('skills-btn-wrap'));
            } else {
                closeOverlay(overlay);
            }
        };
        
        
        // Stats overlay handlers
        document.getElementById('level-display-container').onclick = () => {
            const overlay = document.getElementById('stats-overlay');
            if (overlay.style.display === 'none') {
                updateStatsDisplay();
                openOverlay(overlay, document.getElementById('level-display-container'));
            } else {
                closeOverlay(overlay);
            }
        };
        
        function toggleBasket() {
            console.log('Toggling basket');
            
            const container = document.getElementById('basket-container');
            if (container.classList.contains('active')) {
                console.log('Closing basket');
                container.classList.remove('active');
                stopBasket();
            } else {
                console.log('Opening basket');
                container.classList.add('active');
                
                // Show appropriate bag image based on current room
                const inventoryBag = document.getElementById('basket-bg-image');
                const sellBag = document.getElementById('sell-bag-image');
                const isInShop = document.getElementById('shop-room').classList.contains('active');
                
                if (inventoryBag && sellBag) {
                    if (isInShop) {
                        // In shop - show BOTH bags
                        inventoryBag.style.display = 'block';
                        sellBag.style.display = 'block';
                    } else {
                        // Not in shop - show only inventory bag
                        inventoryBag.style.display = 'block';
                        sellBag.style.display = 'none';
                    }
                }
                
                if (!basketEngine) {
                    console.log('Initializing basket for first time');
                    initBasket();
                } else {
                    console.log('Basket already initialized, populating');
                    populateBasket();
                }
            }
        }
        
        // Bag is now always open after hatching - no button needed
        // Open basket automatically when game loads (after hatching)
        function openBasketPermanently() {
            const container = document.getElementById('basket-container');
            container.classList.add('active');
            
            // Show inventory bag by default
            const inventoryBag = document.getElementById('basket-bg-image');
            const sellBag = document.getElementById('sell-bag-image');
            if (inventoryBag) inventoryBag.style.display = 'block';
            if (sellBag) sellBag.style.display = 'none';
            
            // Initialize basket physics
            if (!basketEngine) {
                initBasket();
            } else {
                populateBasket();
            }
        }
        
        // ===== BASKET SYSTEM =====
        function initBasket() {
            // Set basket background image
            const basketBg = document.getElementById('basket-bg-image');
            if (basketBg) {
                // Set bag1.png as background (relative path)
                basketBg.style.backgroundImage = "url('./slimehearth-assets/images/bag1.png?v=7')";
                basketBg.style.backgroundSize = 'contain';
                basketBg.style.backgroundRepeat = 'no-repeat';
                basketBg.style.backgroundPosition = 'center';
                console.log('Basket background image set to bag1.png');
                console.log('Background image value:', basketBg.style.backgroundImage);
            }
            
            console.log('Basket opening...');
            const canvas = document.getElementById('basket-canvas');
            if (!canvas) return;
            
            // Create engine
            basketEngine = Engine.create();
            basketEngine.world.bounds = { min: { x: -1000, y: -1000 }, max: { x: 1700, y: 1700 } };
            basketEngine.gravity.y = 0.5;
            
            // Create renderer
            basketRender = Render.create({
                canvas: canvas,
                engine: basketEngine,
                options: {
                    width: 700,  // Match mobile width
                    height: 1200,
                    wireframes: false,
                    background: 'transparent'
                }
            });
            
            // Create basket walls (no top) - SHORTER walls so items can fly over
            const basketCenterX = 90;  // Moved left to align with bag image
            const basketBottom = 1194;
            const basketWidth = 180;
            const wallHeight = 60;  // Reduced from 112 to 60 - items can fly over!
            const wallThickness = 6;
            
            const leftWall = Bodies.rectangle(
                basketCenterX - basketWidth/2 + wallThickness/2,
                basketBottom - wallHeight/2,
                wallThickness,
                wallHeight,
                { isStatic: true, render: { visible: false } }
            );
            
            const rightWall = Bodies.rectangle(
                basketCenterX + basketWidth/2 - wallThickness/2,
                basketBottom - wallHeight/2,
                wallThickness,
                wallHeight,
                { isStatic: true, render: { visible: false } }
            );
            
            const bottom = Bodies.rectangle(
                basketCenterX,
                basketBottom - 10,
                basketWidth,
                20,
                { isStatic: true, render: { visible: false }, label: 'Floor' }
            );
            
            // Invisible floor at canvas bottom - sized for 700px canvas
            const invisibleFloor = Bodies.rectangle(
                350, 1230, 900, 100,  // Centered at 350 (middle of 700)
                { isStatic: true, render: { visible: false }, label: 'Floor' }
            );
            
            World.add(basketEngine.world, [leftWall, rightWall, bottom, invisibleFloor]);
            
            // Sell walls are now created dynamically in switchRoom()
            sellWalls = [];
            
            // Velocity limiter + Auto-leveling
            Events.on(basketEngine, 'beforeUpdate', () => {
                basketBodies.forEach(body => {
                    const maxSpeed = 21.5;
                    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                    
                    if (speed > maxSpeed) {
                        const scale = maxSpeed / speed;
                        Matter.Body.setVelocity(body, {
                            x: body.velocity.x * scale,
                            y: body.velocity.y * scale
                        });
                    }
                    
                    // Auto-level items when they're settling (low velocity)
                    if (speed < 2 && Math.abs(body.angularVelocity) < 0.1) {
                        // Gently rotate toward horizontal (angle = 0)
                        let targetAngle = 0;
                        let currentAngle = body.angle % (Math.PI * 2);
                        
                        // Normalize to -PI to PI
                        if (currentAngle > Math.PI) currentAngle -= Math.PI * 2;
                        if (currentAngle < -Math.PI) currentAngle += Math.PI * 2;
                        
                        // Apply gentle rotation toward 0 (reduced from 0.15 to 0.08)
                        const angleDiff = targetAngle - currentAngle;
                        if (Math.abs(angleDiff) > 0.01) {
                            Matter.Body.setAngle(body, currentAngle + angleDiff * 0.08);
                        }
                    }
                });
            });
            
            // Bounce sound on collision with floor
            Events.on(basketEngine, 'collisionStart', (event) => {
                event.pairs.forEach(pair => {
                    const { bodyA, bodyB } = pair;
                    // Check if one body is an item and the other is the floor
                    const item = basketBodies.includes(bodyA) ? bodyA : (basketBodies.includes(bodyB) ? bodyB : null);
                    const isFloor = bodyA.label === 'Floor' || bodyB.label === 'Floor';
                    
                    if (item && isFloor) {
                        // Play bounce sound if impact velocity is high enough
                        const speed = Math.sqrt(item.velocity.x ** 2 + item.velocity.y ** 2);
                        if (speed > 3) { // Only play for noticeable bounces
                            const bounceSound = document.getElementById('bounce-sound');
                            if (bounceSound) {
                                bounceSound.currentTime = 0;
                                bounceSound.volume = Math.min(speed / 20, 0.5); // Scale volume with speed
                                bounceSound.play().catch(() => {});
                            }
                        }
                    }
                });
            });
            
            // Return forces for items outside basket
            Events.on(basketEngine, 'afterUpdate', () => {
                const basketLeft = basketCenterX - basketWidth/2;  // 90 - 90 = 0
                const basketRight = basketCenterX + basketWidth/2; // 90 + 90 = 180
                const basketTop = 1080;
                
                basketBodies.forEach(body => {
                    const nearFloor = body.position.y > 1150;
                    const aboveBasket = body.position.y < basketTop;
                    
                    // Pull items back INTO the basket if they escape horizontally
                    if (body.position.x < basketLeft) {
                        // Item escaped to the LEFT - pull it RIGHT (back into basket)
                        const pullStrength = nearFloor ? 0.06 : 0.00002;
                        const upForce = nearFloor ? -0.07 : 0;
                        Matter.Body.applyForce(body, body.position, { x: pullStrength, y: upForce });
                    } else if (body.position.x > basketRight) {
                        // Item escaped to the RIGHT - pull it LEFT (back into basket)
                        const pullStrength = nearFloor ? 0.06 : 0.00002;
                        const upForce = nearFloor ? -0.07 : 0;
                        Matter.Body.applyForce(body, body.position, { x: -pullStrength, y: upForce });
                    }
                    
                    // Apply downward force if item is above the basket and within horizontal bounds
                    if (aboveBasket && body.position.x > basketLeft && body.position.x < basketRight) {
                        Matter.Body.applyForce(body, body.position, { x: 0, y: 0.01 });
                    }
                });
            });
            
            // Eating mechanic - only on home screen
            Events.on(basketEngine, 'beforeUpdate', () => {
                if (!gs.hatched) return;
                
                const homeRoom = document.getElementById('home-room');
                const isHome = homeRoom && homeRoom.classList.contains('active');
                
                if (!isHome) {
                    const mouth = document.getElementById('slime-mouth');
                    if (mouth) mouth.style.display = 'none';
                    return;
                }
                
                // Get actual slime position from the DOM
                const slimeElement = document.getElementById('slime-square');
                const basketCanvas = document.getElementById('basket-canvas');
                
                if (!slimeElement || !basketCanvas) return;
                
                const slimeRect = slimeElement.getBoundingClientRect();
                const canvasRect = basketCanvas.getBoundingClientRect();
                
                // Calculate slime center in canvas coordinates
                const slimeCenterX = slimeRect.left + slimeRect.width / 2;
                const slimeCenterY = slimeRect.top + slimeRect.height / 2;
                const canvasLeft = canvasRect.left;
                const canvasTop = canvasRect.top;
                
                // Convert to canvas coordinates - offset tuned to match mouth position (~230,700)
                const slimeX = slimeCenterX - canvasLeft + 50;
                const slimeY = slimeCenterY - canvasTop + 150;
                
                const mouth = document.getElementById('slime-mouth');
                
                // Show/hide mouth based on screen
                if (mouth) {
                    mouth.style.display = isHome ? 'block' : 'none';
                }
                
                if (!isHome) return;
                
                let foodNearby = false;
                
                for (let i = basketBodies.length - 1; i >= 0; i--) {
                    const b = basketBodies[i];
                    if (!b || !b.itemId) continue;
                    
                    const itemData = ITEM_DATA[b.itemId];
                    if (!itemData || !itemData.feedable) continue;
                    
                    const dist = Math.sqrt((b.position.x - slimeX)**2 + (b.position.y - slimeY)**2);
                    
                    if (dist < 55) {
                        foodNearby = true;
                    }
                    
                    if (dist < 25) {
                        World.remove(basketEngine.world, b);
                        basketBodies.splice(i, 1);
                        delete gs.inventory[b.itemKey];
                        
                        // Check if it's a basket (treasure chest)
                        if (itemData.isBasket) {
                            // Open basket and give random items!
                            openBasket();
                        } else {
                            // Regular food - grant stats!
                            if (!gs.stats) {
                                gs.stats = {
                                    doubleXpChance: 0,
                                    doubleLootChance: 0,
                                    bonusGeodeChance: 0,
                                    rareFindChance: 0,
                                    foodsEaten: 0
                                };
                            }
                            
                            // Check if it's a frog - add to collection instead of eating
                            if (b.itemId && b.itemId.startsWith('frog_')) {
                                gs.frogs[b.itemId] = true;
                                
                                // Play frog sound
                                const frogSound = document.getElementById('frog-drop-sound');
                                if (frogSound) { frogSound.currentTime = 0; frogSound.play().catch(() => {}); }
                                
                                notify('🐸 ' + (FROGS_DATA[b.itemId] ? FROGS_DATA[b.itemId].name : b.itemId) + ' added to Collection!', 'achievement');
                                
                                // Instantly fill XP to max → level up
                                if (gs.level < 100) {
                                    gs.slimeXP = gs.slimeXPNeeded;
                                    while (gs.slimeXP >= gs.slimeXPNeeded && gs.level < 100) {
                                        gs.slimeXP -= gs.slimeXPNeeded;
                                        gs.level++;
                                        gs.slimeXPNeeded = Math.floor(gs.slimeXPNeeded * 1.2);
                                    }
                                    notify('🐸 Level Up! Now Level ' + gs.level + '!', 'levelup');
                                    levelUpBurst();
                                    const levelupSound = document.getElementById('slime-levelup-sound');
                                    if (levelupSound) { levelupSound.currentTime = 0; levelupSound.play().catch(() => {}); }
                                    // Geode reward using same curve
                                    const lvl2 = gs.level;
                                    const w2 = [
                                        Math.exp(-0.5*Math.pow((lvl2-5)/12,2)),
                                        Math.exp(-0.5*Math.pow((lvl2-25)/18,2)),
                                        Math.exp(-0.5*Math.pow((lvl2-50)/20,2)),
                                        Math.exp(-0.5*Math.pow((lvl2-75)/18,2)),
                                        Math.exp(-0.5*Math.pow((lvl2-95)/12,2)),
                                    ];
                                    const geos2 = ['small_geode','medium_geode','large_geode','rare_geode','rainbow_geode'];
                                    const tot2  = w2.reduce((a,b)=>a+b,0);
                                    let p2 = Math.random()*tot2, ch2 = geos2[0];
                                    for (let g=0;g<geos2.length;g++){p2-=w2[g];if(p2<=0){ch2=geos2[g];break;}}
                                    addItem(ch2, 1);
                                }
                                
                                // Check if all 5 frogs collected → unlock Frog Hat
                                const allFrogs = Object.keys(FROGS_DATA).every(id => gs.frogs[id]);
                                if (allFrogs && !gs.hats.frog_hat) {
                                    gs.hats.frog_hat = true;
                                    notify('🐸 Frog Hat unlocked! Check your Wardrobe!', 'achievement');
                                }
                                
                                save();
                                updateUI();
                            } else {
                            
                            gs.stats.foodsEaten++;
                            
                            // Each food has a random chance to give +0.01% to one of the 4 2x stats
                            const statRoll = Math.random();
                            const statChance = Math.random();
                            if (statChance < 0.25) { // 25% chance to get any boost at all
                                if (statRoll < 0.25) {
                                    gs.stats.doubleXpChance += 0.01;
                                    notify('⚡ +0.01% 2x XP Chance!', 'achievement');
                                } else if (statRoll < 0.5) {
                                    gs.stats.doubleLootChance += 0.01;
                                    notify('📦 +0.01% 2x Loot Chance!', 'achievement');
                                } else if (statRoll < 0.75) {
                                    gs.stats.bonusGeodeChance += 0.01;
                                    notify('🪨 +0.01% 2x Geode Chance!', 'achievement');
                                } else {
                                    gs.stats.rareFindChance += 0.01;
                                    notify('✨ +0.01% 2x Rarity Chance!', 'achievement');
                                }
                            }
                            
                            gs.hunger = Math.min(100, gs.hunger + itemData.foodValue);
                            
                            // Play eating sound
                            const eatSound1 = document.getElementById('eat-sound-1');
                            const eatSound2 = document.getElementById('eat-sound-2');
                            const randomSound = Math.random() < 0.5 ? eatSound1 : eatSound2;
                            if (randomSound) {
                                randomSound.currentTime = 0;
                                randomSound.volume = 0.4;
                                randomSound.play().catch(() => {});
                            }
                            
                            // Add slime XP
                            const xpGain = itemData.foodValue * 2;
                            gs.slimeXP += xpGain;
                            
                            // Level up check (max level 100)
                            let didLevelUp = false;
                            while (gs.slimeXP >= gs.slimeXPNeeded && gs.level < 100) {
                                gs.slimeXP -= gs.slimeXPNeeded;
                                gs.level++;
                                gs.slimeXPNeeded = Math.floor(gs.slimeXPNeeded * 1.2);
                                notify('🎉 Slime Level Up! Level ' + gs.level, 'levelup');
                                levelUpBurst();

                                // Geode reward — smooth curve across levels 1-100
                                // Each geode peaks at a different level with a bell-curve weight
                                const lvl = gs.level;
                                function geodeBell(peak, width) {
                                    return Math.exp(-0.5 * Math.pow((lvl - peak) / width, 2));
                                }
                                const weights = [
                                    geodeBell(5,  12),   // small_geode   — peaks lvl 5,  fades by ~30
                                    geodeBell(25, 18),   // medium_geode  — peaks lvl 25, fades by ~60
                                    geodeBell(50, 20),   // large_geode   — peaks lvl 50, fades by ~85
                                    geodeBell(75, 18),   // rare_geode    — peaks lvl 75
                                    geodeBell(95, 12),   // rainbow_geode — peaks lvl 95
                                ];
                                const geodes = ['small_geode','medium_geode','large_geode','rare_geode','rainbow_geode'];
                                const total  = weights.reduce((a, b) => a + b, 0);
                                let pick = Math.random() * total;
                                let chosen = geodes[0];
                                for (let g = 0; g < geodes.length; g++) {
                                    pick -= weights[g];
                                    if (pick <= 0) { chosen = geodes[g]; break; }
                                }
                                addItem(chosen, 1);
                                const geodeName = ITEM_DATA[chosen] ? ITEM_DATA[chosen].name : chosen;
                                notify('💎 Found a ' + geodeName + '!');

                                didLevelUp = true;
                            }
                            
                            // Play level-up sound AFTER eat sound finishes
                            if (didLevelUp) {
                                const playLevelUp = () => {
                                    const levelupSound = document.getElementById('slime-levelup-sound');
                                    if (levelupSound) { levelupSound.currentTime = 0; levelupSound.play().catch(() => {}); }
                                };
                                if (randomSound && !randomSound.ended) {
                                    randomSound.addEventListener('ended', playLevelUp, { once: true });
                                } else {
                                    playLevelUp();
                                }
                            }
                            
                            // Cap XP at max level
                            if (gs.level >= 100) {
                                gs.slimeXP = gs.slimeXPNeeded;
                            }
                            
                            notify('+' + xpGain + ' 🍖!');
                            } // end else (not a frog)
                        }
                        
                        save();
                        updateUI();
                        updateInventoryCounter();
                    }
                }
                
                if (mouth) {
                    mouth.style.opacity = foodNearby ? '1' : '0';
                }
            });

            // Giant Slime feeding mechanic - only in furnace-room
            Events.on(basketEngine, 'beforeUpdate', () => {
                const giantRoom = document.getElementById('furnace-room');
                if (!giantRoom || !giantRoom.classList.contains('active')) return;

                const targetEl = document.getElementById('furnace-target');
                const basketCanvas = document.getElementById('basket-canvas');
                if (!targetEl || !basketCanvas) return;

                const targetRect = targetEl.getBoundingClientRect();
                const canvasRect = basketCanvas.getBoundingClientRect();
                const scaleX = basketCanvas.width  / canvasRect.width;
                const scaleY = basketCanvas.height / canvasRect.height;

                const targetX = ((targetRect.left + targetRect.width  / 2) - canvasRect.left) * scaleX;
                const targetY = ((targetRect.top  + targetRect.height / 2) - canvasRect.top)  * scaleY;

                for (let i = basketBodies.length - 1; i >= 0; i--) {
                    const b = basketBodies[i];
                    if (!b || !b.itemId) continue;

                    // Furnace only accepts coal (fuel items)
                    if (b.itemId !== 'coal') continue;

                    const dist = Math.sqrt((b.position.x - targetX) ** 2 + (b.position.y - targetY) ** 2);
                    if (dist < 55) {
                        // Consume coal
                        World.remove(basketEngine.world, b);
                        basketBodies.splice(i, 1);
                        delete gs.inventory[b.itemKey];

                        // Init furnace state if needed
                        if (!gs.furnace) gs.furnace = { fed: 0, needed: 10 };

                        // Cap at max — no overflow/reset
                        if (gs.furnace.fed < gs.furnace.needed) {
                            gs.furnace.fed = Math.min(gs.furnace.needed, gs.furnace.fed + 1);
                            if (gs.furnace.fed >= gs.furnace.needed) {
                                notify('🔥 Furnace fully fueled!', 'achievement');
                            } else {
                                notify('+1 🔥 Fuel!');
                            }
                        } else {
                            notify('🔥 Fuel tank full!');
                        }

                        // +1 Smelting XP per coal
                        addSkillXP('smelting', 1);

                        // Liquid drop effect on fuel bar
                        spawnLiquidDrop('furnace-bar-wrap', '#444');

                        // Play cook sound
                        const cookSound = document.getElementById('cook-sound');
                        if (cookSound) { cookSound.currentTime = 0; cookSound.volume = 0.4; cookSound.play().catch(() => {}); }

                        updateFurnaceUI();
                        save();
                        updateInventoryCounter();
                    }
                }
            });

            // ── Porkchops (Barn) feed mechanic ──
            // Trash items dropped near the pig circle → random pork loot
            const BARN_TRASH = new Set(['rock','lily_pad','old_boot','seaweed']);
            const BARN_LOOT = [
                { id: 'rainbow_milk', weight: 0.001,  emoji: '🌈', label: 'Rainbow Milk',  rarity: 'rainbow'    },
                { id: 'bacon',        weight: 0.05,   emoji: '🥓', label: 'Bacon',          rarity: 'legendary'  },
                { id: 'sausages',     weight: 0.10,   emoji: '🌭', label: 'Sausages',       rarity: 'rare'       },
                { id: 'ham',          weight: 0.25,   emoji: '🍖', label: 'Ham',             rarity: 'uncommon'   },
                { id: 'porkchops',    weight: 0.599,  emoji: '🥩', label: 'Porkchops',      rarity: 'common'     },
            ];
            let barnDropLog = []; // recent drops, max 5
            let barnCooldown = false;

            function barnRollLoot() {
                const r = Math.random();
                let cum = 0;
                for (const entry of BARN_LOOT) {
                    cum += entry.weight;
                    if (r < cum) return entry;
                }
                return BARN_LOOT[BARN_LOOT.length - 1];
            }

            function barnPushDrop(entry) {
                barnDropLog.unshift(entry);
                if (barnDropLog.length > 5) barnDropLog.length = 5;
                for (let i = 0; i < 5; i++) {
                    const el = document.getElementById('barn-drop-' + i);
                    if (!el) continue;
                    if (barnDropLog[i]) {
                        const rarityColors = { rainbow:'#d946ef', legendary:'#ea580c', rare:'#2563eb', uncommon:'#2d8a2d', common:'rgba(255,255,255,0.8)' };
                        el.textContent = barnDropLog[i].emoji + ' ' + barnDropLog[i].label;
                        el.style.color = rarityColors[barnDropLog[i].rarity] || '#fff';
                        el.classList.add('visible');
                    } else {
                        el.textContent = '';
                        el.classList.remove('visible');
                    }
                }
            }

            Events.on(basketEngine, 'beforeUpdate', () => {
                const barnRoom = document.getElementById('farming-barn-room');
                if (!barnRoom || !barnRoom.classList.contains('active')) return;
                if (barnCooldown) return;

                const targetEl = document.getElementById('barn-pig-target');
                const basketCanvas = document.getElementById('basket-canvas');
                if (!targetEl || !basketCanvas) return;

                const targetRect = targetEl.getBoundingClientRect();
                const canvasRect  = basketCanvas.getBoundingClientRect();
                const scaleX = basketCanvas.width  / canvasRect.width;
                const scaleY = basketCanvas.height / canvasRect.height;
                const targetX = ((targetRect.left + targetRect.width  / 2) - canvasRect.left) * scaleX;
                const targetY = ((targetRect.top  + targetRect.height / 2) - canvasRect.top)  * scaleY;

                for (let i = basketBodies.length - 1; i >= 0; i--) {
                    const b = basketBodies[i];
                    if (!b || !b.itemId) continue;
                    if (!BARN_TRASH.has(b.itemId)) continue;

                    const dist = Math.sqrt((b.position.x - targetX) ** 2 + (b.position.y - targetY) ** 2);
                    if (dist < 60) {
                        // Consume trash
                        World.remove(basketEngine.world, b);
                        basketBodies.splice(i, 1);
                        delete gs.inventory[b.itemKey];
                        updateInventoryCounter();

                        // Roll loot
                        const drop = barnRollLoot();
                        addItem(drop.id, 1);
                        barnPushDrop(drop);

                        // Pig reaction
                        const reaction = document.getElementById('barn-pig-reaction');
                        if (reaction) {
                            reaction.textContent = drop.rarity === 'rainbow' ? '🌈' : drop.rarity === 'legendary' ? '🤩' : drop.rarity === 'rare' ? '😎' : '😋';
                            reaction.style.opacity = '1';
                            setTimeout(() => { if (reaction) reaction.style.opacity = '0'; }, 900);
                        }

                        // Rainbow Milk special: +1 level to ALL skills
                        if (drop.id === 'rainbow_milk') {
                            const skills = ['fishing','farming','cooking','mining','smelting','jewelcrafting'];
                            skills.forEach(sk => {
                                if (!gs.skills) gs.skills = {};
                                if (!gs.skills[sk]) gs.skills[sk] = { level: 1, xp: 0, xpNeeded: 10 };
                                gs.skills[sk].level++;
                                gs.skills[sk].xp = 0;
                                gs.skills[sk].xpNeeded = Math.floor(gs.skills[sk].xpNeeded * 1.2);
                            });
                            notify('🌈 Rainbow Milk! ALL skills leveled up!', 'achievement');
                            const msgEl = document.getElementById('barn-msg');
                            if (msgEl) { msgEl.textContent = '🌈 Rainbow Milk! +1 ALL Skills!'; msgEl.style.color = '#f0abfc'; }
                        } else {
                            const rarityLabels = { legendary:'✨ Legendary!', rare:'💙 Rare!', uncommon:'🟢 Uncommon', common:'😋 Nom nom' };
                            const msgEl = document.getElementById('barn-msg');
                            if (msgEl) { msgEl.textContent = drop.emoji + ' ' + drop.label; msgEl.style.color = '#fff'; }
                            notify(drop.emoji + ' Porkchops gave you ' + drop.label + '!');
                        }

                        addSkillXP('farming', 3);
                        save();
                        updateUI();

                        // Brief cooldown to prevent multi-consume
                        barnCooldown = true;
                        setTimeout(() => {
                            barnCooldown = false;
                            const msgEl = document.getElementById('barn-msg');
                            if (msgEl) msgEl.textContent = '';
                        }, 800);

                        break;
                    }
                }
            });

            // Ore smelting mechanic - only in furnace-room
            const ORE_SMELT = {
                'copper_ore': { name: 'Copper', icon: '🟤', color: '#b45309', colorLight: '#d97706', output: 'copper_bar', needed: 5, xpPer: 2,  xpBar: 80  },
                'iron_ore':   { name: 'Iron',   icon: '⚙️',  color: '#6b7280', colorLight: '#9ca3af', output: 'iron_bar',   needed: 5, xpPer: 3,  xpBar: 120 },
                'silver_ore': { name: 'Silver', icon: '🔘',  color: '#9ca3af', colorLight: '#e5e7eb', output: 'silver_bar', needed: 5, xpPer: 4,  xpBar: 250 },
                'gold_ore':   { name: 'Gold',   icon: '🌟',  color: '#d97706', colorLight: '#fbbf24', output: 'gold_bar',   needed: 5, xpPer: 10, xpBar: 500 },
            };

            // Jewelcrafting slot detection is now handled in the enddrag handler above

            Events.on(basketEngine, 'beforeUpdate', () => {
                const furnaceRoom = document.getElementById('furnace-room');
                if (!furnaceRoom || !furnaceRoom.classList.contains('active')) return;

                const targetEl = document.getElementById('furnace-target');
                const basketCanvas = document.getElementById('basket-canvas');
                if (!targetEl || !basketCanvas) return;

                const targetRect = targetEl.getBoundingClientRect();
                const canvasRect = basketCanvas.getBoundingClientRect();
                const scaleX = basketCanvas.width  / canvasRect.width;
                const scaleY = basketCanvas.height / canvasRect.height;
                const targetX = ((targetRect.left + targetRect.width  / 2) - canvasRect.left) * scaleX;
                const targetY = ((targetRect.top  + targetRect.height / 2) - canvasRect.top)  * scaleY;

                // Init ore smelt state
                if (!gs.oreSmelt) gs.oreSmelt = { oreType: null, fed: 0, needed: 5 };

                for (let i = basketBodies.length - 1; i >= 0; i--) {
                    const b = basketBodies[i];
                    if (!b || !b.itemId) continue;
                    const oreData = ORE_SMELT[b.itemId];
                    if (!oreData) continue;

                    // Lock to current ore type if one is active
                    if (gs.oreSmelt.oreType && gs.oreSmelt.oreType !== b.itemId) continue;

                    const dist = Math.sqrt((b.position.x - targetX) ** 2 + (b.position.y - targetY) ** 2);
                    if (dist < 55) {
                        // Check fuel
                        if (!gs.furnace) gs.furnace = { fed: 0, needed: 10 };
                        if (gs.furnace.fed <= 0) {
                            notify('🔥 No fuel! Add Coal first.');
                            continue;
                        }

                        // Lock ore type
                        if (!gs.oreSmelt.oreType) {
                            gs.oreSmelt.oreType = b.itemId;
                            gs.oreSmelt.fed = 0;
                            gs.oreSmelt.needed = oreData.needed;
                        }

                        // Consume ore
                        World.remove(basketEngine.world, b);
                        basketBodies.splice(i, 1);
                        delete gs.inventory[b.itemKey];

                        // Consume 2 fuel
                        gs.furnace.fed = Math.max(0, gs.furnace.fed - 2);
                        updateFurnaceUI();

                        gs.oreSmelt.fed += 1;

                        // Play cook sound
                        const cookSound = document.getElementById('cook-sound');
                        if (cookSound) { cookSound.currentTime = 0; cookSound.volume = 0.3; cookSound.play().catch(() => {}); }

                        // Per-ore XP
                        addSkillXP('smelting', oreData.xpPer);

                        // Liquid drop effect on ore bar
                        spawnLiquidDrop('ore-bar-wrap', oreData.colorLight);

                        notify('+1 ' + oreData.icon + ' ' + oreData.name + ' Ore smelting... (+' + oreData.xpPer + ' XP)');
                        updateOreBarUI();

                        // Check if bar is full → produce bar item
                        if (gs.oreSmelt.fed >= gs.oreSmelt.needed) {
                            addItem(oreData.output, 1);
                            notify('✨ ' + oreData.name + ' Bar crafted!', 'achievement');
                            const skillLvlSound = document.getElementById('skill-levelup-sound');
                            if (skillLvlSound) { skillLvlSound.currentTime = 0; skillLvlSound.play().catch(() => {}); }
                            addSkillXP('smelting', oreData.xpBar);
                            // Reset ore bar
                            gs.oreSmelt.oreType = null;
                            gs.oreSmelt.fed = 0;
                            updateOreBarUI();
                        }

                        save();
                        updateInventoryCounter();
                    }
                }
            });
            
            // Mouse control
            const mouse = Mouse.create(canvas);
            
            // Scale mouse coordinates to compensate for CSS scale(0.8)
            mouse.pixelRatio = 0.8;
            
            console.log('Creating mouse constraint...');
            mouseConstraint = MouseConstraint.create(basketEngine, {
                mouse: mouse,
                constraint: {
                    stiffness: 1.9,
                    render: { visible: false }
                }
            });
            World.add(basketEngine.world, mouseConstraint);
            
            console.log('Adding drag event listeners...');
            
            // Tooltip on drag
            Events.on(mouseConstraint, 'startdrag', function(event) {
                const body = event.body;
                console.log('Start drag event fired!', body);
                if (body && body.itemId) {
                    console.log('Showing tooltip for:', body.itemId);
                    showItemTooltip(body.itemId, body.itemKey);
                    // Green sell box kept hidden (for testing purposes only)
                }
            });
            
            Events.on(mouseConstraint, 'enddrag', function(event) {
                console.log('End drag event fired!');
                hideItemTooltip();
                
                const body = event.body;
                if (!body || !body.itemId) return;
                const itemId = body.itemId;
                const data = ITEM_DATA[itemId];
                if (!data) return;
                
                // ── SHACK: crackable → geode slot ──
                const shackRoom = document.getElementById('shack-room');
                if (shackRoom && shackRoom.classList.contains('active') && data.crackable) {
                    const slotEl = document.getElementById('shack-geode-slot');
                    if (slotEl && isBodyOverElement(body, slotEl)) {
                        lockGeodeInShackSlot(body);
                        return;
                    }
                }
                
                // ── HEARTH: cookable/feedable → slot 1 or slot 2 ──
                const hearthRoom = document.getElementById('cooking-menu-room');
                if (hearthRoom && hearthRoom.classList.contains('active') && (data.cookable || data.feedable)) {
                    const slot1El = document.getElementById('hearth-slot-1');
                    const slot2El = document.getElementById('hearth-slot-2');
                    if (slot1El && isBodyOverElement(body, slot1El)) {
                        lockItemInHearthSlot(body, 1);
                        return;
                    }
                    if (slot2El && isBodyOverElement(body, slot2El)) {
                        lockItemInHearthSlot(body, 2);
                        return;
                    }
                }
                
                // ── GARDEN: plantable → any empty plot slot ──
                const gardenRoom = document.getElementById('farming-garden-room');
                if (gardenRoom && gardenRoom.classList.contains('active') && data.isPlantable) {
                    const unlockedCount = (typeof getUnlockedSlots === 'function') ? getUnlockedSlots() : 6;
                    for (let i = 0; i < unlockedCount; i++) {
                        const slotEl = document.getElementById(`garden-plot-slot-${i}`);
                        if (slotEl && isBodyOverElement(body, slotEl)) {
                            lockItemInGardenSlot(body, i);
                            return;
                        }
                    }
                }

                // ── JEWELCRAFTING: bars → slots 1&2, gems → slot 3 ──
                const jcRoom = document.getElementById('jewelcrafting-room');
                if (jcRoom && jcRoom.classList.contains('active')) {
                    const isBar = ['copper_bar','iron_bar','silver_bar','gold_bar'].includes(itemId);
                    const isGem = ['gem','emerald','ruby','sapphire','amethyst','topaz','diamond'].includes(itemId);
                    if (isBar) {
                        for (const sn of [1, 2]) {
                            const slotEl = document.getElementById('jc-slot' + sn);
                            const over = slotEl && isBodyOverElement(body, slotEl);
                            if (over) {
                                if (window.lockItemInJCSlot) window.lockItemInJCSlot(body, sn);
                                return;
                            }
                        }
                    } else if (isGem) {
                        const slotEl = document.getElementById('jc-slot3');
                        const over = slotEl && isBodyOverElement(body, slotEl);
                        if (over) {
                            if (window.lockItemInJCSlot) window.lockItemInJCSlot(body, 3);
                            return;
                        }
                    }
                }

                // ── COOP: seeds → chicken circle ──
                const coopRoom = document.getElementById('farming-coop-room');
                const isSeed = data.isPlantable;
                if (coopRoom && coopRoom.classList.contains('active') && isSeed) {
                    const chickens = window.coopChickens ? window.coopChickens() : [];
                    for (let i = 0; i < chickens.length; i++) {
                        const circEl = document.getElementById('coop-circle-' + i);
                        if (circEl && isBodyOverElement(body, circEl, 24)) {
                            // Consume seed
                            const itemKey = body.itemKey;
                            if (gs.inventory && itemKey) delete gs.inventory[itemKey];
                            Matter.World.remove(basketEngine.world, body);
                            const bIdx = basketBodies.indexOf(body);
                            if (bIdx > -1) basketBodies.splice(bIdx, 1);
                            updateInventoryCounter();
                            if (window.feedChicken) window.feedChicken(i);
                            return;
                        }
                    }
                }
            });
            
            // Helper: check if a physics body center is over a DOM element (with padding)
            function isBodyOverElement(body, el, padding = 30) {
                const rect = el.getBoundingClientRect();
                const containerEl = document.getElementById('basket-container');
                const containerRect = containerEl.getBoundingClientRect();
                const styleScale = containerEl.style.transform || '';
                const scaleMatch = styleScale.match(/scale\(([^)]+)\)/);
                const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 0.8;
                const screenX = containerRect.left + body.position.x * scale;
                const screenY = containerRect.top + body.position.y * scale;
                return screenX >= rect.left - padding && screenX <= rect.right + padding &&
                       screenY >= rect.top - padding && screenY <= rect.bottom + padding;
            }
            
            // Hover tooltip - check what's under mouse
            let lastHoveredBody = null;
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Convert to world coordinates
                const bodies = basketBodies;
                let hoveredBody = null;
                
                for (const body of bodies) {
                    const bounds = body.bounds;
                    if (mouseX >= bounds.min.x && mouseX <= bounds.max.x &&
                        mouseY >= bounds.min.y && mouseY <= bounds.max.y) {
                        hoveredBody = body;
                        break;
                    }
                }
                
                // Show/hide tooltip based on hover
                if (hoveredBody && hoveredBody !== lastHoveredBody) {
                    if (hoveredBody.itemId) {
                        showItemTooltip(hoveredBody.itemId, hoveredBody.itemKey);
                    }
                } else if (!hoveredBody && lastHoveredBody) {
                    hideItemTooltip();
                }
                
                lastHoveredBody = hoveredBody;
            });
            
            // Mouse coordinates debug
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const coordsDiv = document.getElementById('mouse-coords');
                if (coordsDiv) {
                    coordsDiv.textContent = Math.round(x) + ', ' + Math.round(y);
                }
            });
            
            
            // SELL DETECTION - items in sell basket area get sold
            Events.on(basketEngine, 'beforeUpdate', () => {
                const shopActive = document.getElementById('shop-room').classList.contains('active');
                if (!shopActive) return;
                
                // Get the green box position dynamically
                const greenBox = document.getElementById('green-sell-box');
                if (!greenBox) return;
                
                const boxRect = greenBox.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                
                // Convert screen coordinates to canvas physics coordinates
                // Account for container scaling (0.8x) and positioning
                const scale = 0.8;
                const containerLeft = canvasRect.left;
                
                // Calculate physics coordinates from green box position
                const sellMinX = (boxRect.left - containerLeft) / scale;
                const sellMaxX = (boxRect.right - containerLeft) / scale;
                const sellMinY = (boxRect.top - canvasRect.top) / scale;
                const sellMaxY = (boxRect.bottom - canvasRect.top) / scale;
                
                for (let i = basketBodies.length - 1; i >= 0; i--) {
                    const body = basketBodies[i];
                    if (!body || !body.itemKey) continue;
                    
                    const inSellX = body.position.x > sellMinX && body.position.x < sellMaxX;
                    const inSellY = body.position.y > sellMinY && body.position.y < sellMaxY;
                    
                    if (inSellX && inSellY) {
                        // Get sell price from ITEM_DATA
                        const itemData = ITEM_DATA[body.itemId];
                        
                        // Block unsellable items (frogs etc)
                        if (itemData && itemData.sellable === false) {
                            notify(itemData.name + ' cannot be sold!', 'warning');
                            continue;
                        }
                        
                        const sellPrice = itemData ? itemData.sellValue : 1;

                        // Fish size sell multiplier
                        let fishMult = 1;
                        let fishSizeStr = '';
                        if (itemData && /^fish\d+$/.test(body.itemId) && gs.fishSizes && gs.fishSizes[body.itemKey]) {
                            const kg = gs.fishSizes[body.itemKey];
                            fishMult = fishSizeMult(kg, body.itemId);
                            fishSizeStr = ` (${kg}kg)`;
                        }
                        const sizedPrice = Math.round(sellPrice * fishMult);
                        
                        // Ring bonus: +1% chance per ring level to sell at 2x price
                        const ringLevel = (gs.jewelcraft && gs.jewelcraft.ring) ? gs.jewelcraft.ring : 1;
                        const ringBonus = (ringLevel - 1) * 0.01;
                        const doubled   = Math.random() < ringBonus;
                        const finalSell = doubled ? sizedPrice * 2 : sizedPrice;
                        
                        gs.coins = Math.min(gs.coins + finalSell, 999999);
                        if (doubled) {
                            notify('💍 DOUBLE SALE! Sold ' + (itemData ? itemData.name : body.itemId) + fishSizeStr + ' for ' + finalSell + ' coins! 💰');
                        } else {
                            notify('Sold ' + (itemData ? itemData.name : body.itemId) + fishSizeStr + ' for ' + finalSell + ' coins! 💰');
                        }
                        const sellSound = document.getElementById('coin-sell-sound');
                        if (sellSound) { sellSound.currentTime = 0; sellSound.play().catch(() => {}); }
                        
                        // Remove
                        World.remove(basketEngine.world, body);
                        basketBodies.splice(i, 1);
                        delete gs.inventory[body.itemKey];
                        if (gs.fishSizes && gs.fishSizes[body.itemKey]) delete gs.fishSizes[body.itemKey];
                        
                        save();
                        updateUI();
                        updateInventoryCounter();
                    }
                }
            });
            
// Populate with items
            populateBasket();
            
            // Run engine
            basketRunner = Runner.create();
            Runner.run(basketRunner, basketEngine);
            Render.run(basketRender);
            
            // Frog jumping — every 1.2s each frog body has a 30% chance to leap
            setInterval(() => {
                if (!basketBodies || !basketEngine) return;
                basketBodies.forEach(body => {
                    if (!body.itemId || !body.itemId.startsWith('frog_')) return;
                    if (Math.random() > 0.30) return; // 30% chance per tick
                    
                    // Random horizontal direction, strong upward impulse
                    const jumpX = (Math.random() - 0.5) * 12;
                    const jumpY = -(14 + Math.random() * 8);
                    Matter.Body.setVelocity(body, { x: jumpX, y: jumpY });
                    Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
                    
                    // Play frog sound (at low volume so it doesn't spam)
                    const frogSound = document.getElementById('frog-drop-sound');
                    if (frogSound) {
                        frogSound.currentTime = 0;
                        frogSound.volume = 0.3;
                        frogSound.play().catch(() => {});
                    }
                });
            }, 1200);
        }
        
        function spawnSingleItem(key) {
            // Play frog sound if spawning a frog
            const spawnItemId = gs.inventory[key];
            if (spawnItemId && spawnItemId.startsWith('frog_')) {
                const frogSound = document.getElementById('frog-drop-sound');
                if (frogSound) { frogSound.currentTime = 0; frogSound.play().catch(() => {}); }
            }
            if (!basketEngine) return;
            const { Bodies, World } = Matter;
            
            const itemId = gs.inventory[key]; // Get itemId from inventory value, not by parsing key
            console.log('spawnSingleItem - key:', key, 'itemId:', itemId);
            
            const color = ITEM_COLORS[itemId] || '#ff6b9d';
            
            // Spawn at top-center of basket
            const x = 50 + Math.random() * 140;  // Adjusted left to match basket at X=90
            const y = -50;
            
            const renderOptions = { fillStyle: color };
            
            // Use image for items if available - but only if image actually exists in ITEM_IMAGES
            const itemData = ITEM_DATA[itemId];
            console.log('itemData for', itemId, ':', itemData);
            console.log('Has image property?', itemData?.image);
            console.log('ITEM_IMAGES has entry?', ITEM_IMAGES[itemId]);
            
            if (itemData && itemData.image && ITEM_IMAGES[itemId]) {
                console.log('Setting sprite for:', itemId, 'at path:', ITEM_IMAGES[itemId]);
                renderOptions.sprite = {
                    texture: ITEM_IMAGES[itemId],
                    xScale: 0.075,
                    yScale: 0.075
                };
                // Important: Don't remove fillStyle - it acts as fallback if sprite fails to load
            } else {
                console.log('NOT using sprite for:', itemId);
            }
            
            const box = Bodies.rectangle(x, y, 40, 40, {
                restitution: 0.4,
                friction: 0.8,
                render: renderOptions,
                itemKey: key,
                itemId: itemId
            });
            
            World.add(basketEngine.world, box);
            basketBodies.push(box);
            
            // Play special spawn sounds for gem/basket
            if (itemId === 'gem') {
                const gemSound = document.getElementById('gem-drop-sound');
                if (gemSound) { gemSound.currentTime = 0; gemSound.play().catch(() => {}); }
            } else if (itemId === 'basket') {
                const basketSound = document.getElementById('basket-drop-sound');
                if (basketSound) { basketSound.currentTime = 0; basketSound.play().catch(() => {}); }
            }
            
            // Add glow effect for rare items
            createItemGlow(box, itemId);
        }
        
        function createItemGlow(body, itemId) {
            const itemData = ITEM_DATA[itemId];
            if (!itemData) return;
            
            const canvas = document.getElementById('basket-canvas');
            if (!canvas) return;
            
            // Determine beam based on rarity
            let beamWidth = 0;
            let beamColor = '';
            let shouldBeam = false;
            
            switch(itemData.rarity) {
                case 'Uncommon':
                    beamWidth = 10; // Was 40, now 1/4
                    beamColor = '#4ade80'; // Green
                    shouldBeam = true;
                    break;
                case 'Rare':
                    beamWidth = 15; // Was 60, now 1/4
                    beamColor = '#a78bfa'; // Purple
                    shouldBeam = true;
                    break;
                case 'Epic':
                    beamWidth = 20; // Was 80, now 1/4
                    beamColor = '#f59e0b'; // Orange
                    shouldBeam = true;
                    break;
                case 'Legendary':
                    beamWidth = 25;
                    beamColor = '#fbbf24'; // Gold
                    shouldBeam = true;
                    break;
                case 'Rainbow':
                    beamWidth = 30;
                    beamColor = 'rainbow';
                    shouldBeam = true;
                    break;
            }
            
            if (!shouldBeam) return;
            
            // Create beam element that shoots UP from bottom
            const beam = document.createElement('div');
            const isRainbow = (beamColor === 'rainbow');
            beam.className = isRainbow ? 'item-beam-rainbow' : 'item-beam';
            beam.style.width = beamWidth + 'px';
            beam.style.height = '0%';
            beam.style.left = (body.position.x - beamWidth/2) + 'px';
            beam.style.bottom = '0px';
            if (isRainbow) {
                beam.style.background = 'linear-gradient(to top, rgba(255,0,0,0) 0%, red 10%, orange 25%, yellow 40%, green 55%, blue 70%, violet 85%, rgba(238,130,238,0) 100%)';
                beam.style.boxShadow = '0 0 20px rgba(255,0,255,0.8), 0 0 40px rgba(0,255,255,0.6), 0 0 60px rgba(255,255,0,0.4)';
            } else {
                beam.style.background = `linear-gradient(to top, ${beamColor}00 0%, ${beamColor}ff 20%, ${beamColor}ff 80%, ${beamColor}00 100%)`;
                beam.style.boxShadow = `0 0 ${beamWidth*2}px ${beamColor}, inset 0 0 ${beamWidth}px ${beamColor}`;
            }
            
            canvas.parentElement.appendChild(beam);
            
            // Remove beam after animation completes (0.8s)
            setTimeout(() => {
                beam.remove();
            }, 800);
        }
        
        function populateBasket() {
            if (!basketEngine) return;
            
            // Clear existing items
            basketBodies.forEach(body => World.remove(basketEngine.world, body));
            basketBodies = [];
            
            // Add items from inventory
            const items = Object.keys(gs.inventory);
            items.forEach((key, idx) => {
                const itemId = gs.inventory[key]; // Get itemId from inventory value, not by parsing key
                const color = ITEM_COLORS[itemId] || '#ff6b9d';
                
                const x = 80 + Math.random() * 140;
                const y = -50 - (idx * 45);
                
                const renderOptions = { fillStyle: color };
                
                // Use image for fish types if available
                const itemData = ITEM_DATA[itemId];
                if (itemData && itemData.image && ITEM_IMAGES[itemId]) {
                    renderOptions.sprite = {
                        texture: ITEM_IMAGES[itemId],
                        xScale: 0.075,
                        yScale: 0.075
                    };
                }
                
                const box = Bodies.rectangle(x, y, 40, 40, {
                    restitution: 0.4,
                    friction: 0.8,
                    render: renderOptions,
                    itemKey: key,
                    itemId: itemId
                });
                
                World.add(basketEngine.world, box);
                basketBodies.push(box);
                
                // Add glow effect for rare items
                createItemGlow(box, itemId);
            });
            
            updateInventoryCounter();
        }
        
        
        function initSellBasket() {
            const canvas = document.getElementById('sell-basket-canvas');
            if (!canvas) return;
            
            // Create engine
            sellBasketEngine = Engine.create();
            sellBasketEngine.world.bounds = { min: { x: -500, y: -500 }, max: { x: 850, y: 1100 } };
            sellBasketEngine.gravity.y = 0.5;
            
            // Create renderer
            sellBasketRender = Render.create({
                canvas: canvas,
                engine: sellBasketEngine,
                options: {
                    width: 350,
                    height: 600,
                    wireframes: false,
                    background: 'transparent'
                }
            });
            
            // Create sell basket walls (centered in 350px width)
            const basketCenterX = 175;
            const basketBottom = 580;
            const basketWidth = 180;
            const wallHeight = 60;  // Shorter walls like bag inventory
            const wallThickness = 6;
            
            const leftWall = Bodies.rectangle(
                basketCenterX - basketWidth/2 + wallThickness/2,
                basketBottom - wallHeight/2,
                wallThickness,
                wallHeight,
                { isStatic: true, render: { visible: true, fillStyle: 'green', strokeStyle: 'green', lineWidth: 2 } }
            );
            
            const rightWall = Bodies.rectangle(
                basketCenterX + basketWidth/2 - wallThickness/2,
                basketBottom - wallHeight/2,
                wallThickness,
                wallHeight,
                { isStatic: true, render: { visible: true, fillStyle: 'green', strokeStyle: 'green', lineWidth: 2 } }
            );
            
            const bottom = Bodies.rectangle(
                basketCenterX,
                basketBottom - 10,
                basketWidth,
                20,
                { isStatic: true, render: { visible: true, fillStyle: 'green', strokeStyle: 'green', lineWidth: 2 } }
            );
            
            const invisibleFloor = Bodies.rectangle(
                175, 620, 400, 100,
                { isStatic: true, render: { visible: true, fillStyle: 'rgba(0, 255, 0, 0.3)', strokeStyle: 'green', lineWidth: 2 } }
            );
            
            World.add(sellBasketEngine.world, [leftWall, rightWall, bottom, invisibleFloor]);
            
            // Velocity limiter
            Events.on(sellBasketEngine, 'beforeUpdate', () => {
                sellBasketBodies.forEach(body => {
                    const maxSpeed = 21.5;
                    const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
                    
                    if (speed > maxSpeed) {
                        const scale = maxSpeed / speed;
                        Matter.Body.setVelocity(body, {
                            x: body.velocity.x * scale,
                            y: body.velocity.y * scale
                        });
                    }
                });
            });
            
            // Return forces
            Events.on(sellBasketEngine, 'afterUpdate', () => {
                const basketLeft = 90;
                const basketRight = 260;
                const basketTop = 468;
                
                sellBasketBodies.forEach(body => {
                    const nearFloor = body.position.y > 540;
                    const aboveBasket = body.position.y < basketTop;
                    
                    if (body.position.x < basketLeft) {
                        const pullStrength = nearFloor ? 0.06 : 0.00002;
                        const upForce = nearFloor ? -0.07 : 0;
                        Matter.Body.applyForce(body, body.position, { x: pullStrength, y: upForce });
                    } else if (body.position.x > basketRight) {
                        const pullStrength = nearFloor ? 0.06 : 0.00002;
                        const upForce = nearFloor ? -0.07 : 0;
                        Matter.Body.applyForce(body, body.position, { x: -pullStrength, y: upForce });
                    }
                    
                    if (aboveBasket && body.position.x > basketLeft && body.position.x < basketRight) {
                        Matter.Body.applyForce(body, body.position, { x: 0, y: 0.01 });
                    }
                });
            });
            
            // Selling detection - items touching bottom bar get sold instantly
            Events.on(sellBasketEngine, 'beforeUpdate', () => {
                for (let i = sellBasketBodies.length - 1; i >= 0; i--) {
                    const body = sellBasketBodies[i];
                    if (!body || !body.itemId) continue;
                    
                    // If item touches bottom bar (y > 560)
                    if (body.position.y > 560) {
                        // Sell the item
                        const sellPrice = getSellPrice(body.itemId);
                        gs.coins += sellPrice;
                        
                        notify(`Sold ${body.itemId} for ${sellPrice} coins!`);
                        
                        // Remove from physics and inventory
                        World.remove(sellBasketEngine.world, body);
                        sellBasketBodies.splice(i, 1);
                        
                        // Remove from main inventory too
                        delete gs.inventory[body.itemKey];
                        
                        // Remove from main basket if it exists
                        const mainIdx = basketBodies.findIndex(b => b.itemKey === body.itemKey);
                        if (mainIdx !== -1) {
                            if (basketEngine) World.remove(basketEngine.world, basketBodies[mainIdx]);
                            basketBodies.splice(mainIdx, 1);
                        }
                        
                        save();
                        updateUI();
                        updateInventoryCounter();
                    }
                }
            });
            
            // Mouse control
            const mouse = Mouse.create(canvas);
            sellBasketMouseConstraint = MouseConstraint.create(sellBasketEngine, {
                mouse: mouse,
                constraint: {
                    stiffness: 1.9,
                    render: { visible: false }
                }
            });
            World.add(sellBasketEngine.world, sellBasketMouseConstraint);
            
            // Don't populate - items come from dragging from main basket
            
            // Run engine
            sellBasketRunner = Runner.create();
            Runner.run(sellBasketRunner, sellBasketEngine);
            Render.run(sellBasketRender);
        }
        
        function populateSellBasket() {
            if (!sellBasketEngine) return;
            
            // Clear existing
            sellBasketBodies.forEach(body => World.remove(sellBasketEngine.world, body));
            sellBasketBodies = [];
            
            // Add items from inventory
            const items = Object.keys(gs.inventory);
            items.forEach((key, idx) => {
                const itemId = gs.inventory[key]; // Get itemId from inventory value, not by parsing key
                const color = ITEM_COLORS[itemId] || '#ff6b9d';
                
                const x = 105 + Math.random() * 140;
                const y = -50 - (idx * 45);
                
                const box = Bodies.rectangle(x, y, 40, 40, {
                    restitution: 0.4,
                    friction: 0.8,
                    render: { fillStyle: color },
                    itemKey: key,
                    itemId: itemId
                });
                
                World.add(sellBasketEngine.world, box);
                sellBasketBodies.push(box);
            });
        }
        
        function stopSellBasket() {
            if (sellBasketEngine) {
                Runner.stop(sellBasketRunner);
                Render.stop(sellBasketRender);
                Engine.clear(sellBasketEngine);
                sellBasketEngine = null;
                sellBasketRender = null;
                sellBasketRunner = null;
                sellBasketBodies = [];
            }
        }
        
        function getSellPrice(itemId) {
            // Use ITEM_DATA if available
            if (ITEM_DATA[itemId] && ITEM_DATA[itemId].sellValue !== undefined) {
                return ITEM_DATA[itemId].sellValue;
            }
            // Fallback to 1 if not found
            return 1;
        }
        
function stopBasket() {
            if (basketEngine) {
                Runner.stop(basketRunner);
                Render.stop(basketRender);
                Engine.clear(basketEngine);
                basketEngine = null;
                basketRender = null;
                basketRunner = null;
                basketBodies = [];
                sellWalls = [];
            }
        }
        
        // Close basket button
        document.getElementById('basket-close').onclick = () => {
            document.getElementById('basket-container').classList.remove('active');
            stopBasket();
        };
        
        
