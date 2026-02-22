        // ===== AUTOMINE SYSTEM =====
        let automineInterval = null;
        let automineTimeLeft = 0;
        let automineRunId = 0;
        let currentMineDepth = 'cave';
        
        // Ore table entry: [itemId, baseChance, xp, emoji, label]
        // baseChance is per-second at base level; +0.001 per mining level above reqLevel
        const ORE_TABLE = {
            'cave':   [
                { id: 'copper_ore', base: 0.030, xp: 8,  emoji: '🟤', label: 'Copper Ore' },
                { id: 'coal',       base: 0.020, xp: 5,  emoji: '🖤', label: 'Coal'       },
            ],
            'depth1': [
                { id: 'copper_ore', base: 0.035, xp: 8,  emoji: '🟤', label: 'Copper Ore' },
                { id: 'coal',       base: 0.025, xp: 5,  emoji: '🖤', label: 'Coal'       },
                { id: 'iron_ore',   base: 0.012, xp: 20, emoji: '⚙️', label: 'Iron Ore'   },
            ],
            'depth2': [
                { id: 'copper_ore', base: 0.030, xp: 8,  emoji: '🟤', label: 'Copper Ore' },
                { id: 'coal',       base: 0.025, xp: 5,  emoji: '🖤', label: 'Coal'       },
                { id: 'iron_ore',   base: 0.020, xp: 20, emoji: '⚙️', label: 'Iron Ore'   },
            ],
            'depth3': [
                { id: 'copper_ore', base: 0.025, xp: 8,  emoji: '🟤', label: 'Copper Ore' },
                { id: 'coal',       base: 0.020, xp: 5,  emoji: '🖤', label: 'Coal'       },
                { id: 'iron_ore',   base: 0.025, xp: 20, emoji: '⚙️', label: 'Iron Ore'   },
                { id: 'silver_ore', base: 0.008, xp: 40, emoji: '🔘', label: 'Silver Ore' },
            ],
            'depth4': [
                { id: 'coal',       base: 0.020, xp: 5,  emoji: '🖤', label: 'Coal'       },
                { id: 'iron_ore',   base: 0.028, xp: 20, emoji: '⚙️', label: 'Iron Ore'   },
                { id: 'silver_ore', base: 0.014, xp: 40, emoji: '🔘', label: 'Silver Ore' },
            ],
            'depth5': [
                { id: 'iron_ore',   base: 0.025, xp: 20, emoji: '⚙️', label: 'Iron Ore'   },
                { id: 'silver_ore', base: 0.018, xp: 40, emoji: '🔘', label: 'Silver Ore' },
                { id: 'gold_ore',   base: 0.005, xp: 80, emoji: '🌟', label: 'Gold Ore'   },
            ],
        };

        const MINE_DEPTHS = {
            'cave':   { reqLevel: 0,  rockChance: 0.05, rockXP: 1,  label: 'The Cave',  geodeItem: null,           geodeChance: 0      },
            'depth1': { reqLevel: 10, rockChance: 0.07, rockXP: 2,  label: 'Depth 1',  geodeItem: 'small_geode',  geodeChance: 0.01   },
            'depth2': { reqLevel: 20, rockChance: 0.09, rockXP: 3,  label: 'Depth 2',  geodeItem: 'medium_geode', geodeChance: 0.005  },
            'depth3': { reqLevel: 40, rockChance: 0.12, rockXP: 5,  label: 'Depth 3',  geodeItem: 'large_geode',  geodeChance: 0.004  },
            'depth4': { reqLevel: 65, rockChance: 0.15, rockXP: 8,  label: 'Depth 4',  geodeItem: 'rare_geode',   geodeChance: 0.003  },
            'depth5': { reqLevel: 80, rockChance: 0.18, rockXP: 12, label: 'Depth 5',  geodeItem: 'rainbow_geode',geodeChance: 0.001  },
        };
        
        function getAutomineIDs(depth) {
            if (depth === 'cave') return { btn: 'start-automine', instr: 'automine-instruction', timer: 'automine-timer', result: 'automine-result', barWrap: 'mining-bar-wrap-cave', bar: 'mining-bar-cave' };
            return { btn: `start-automine-${depth}`, instr: `automine-instruction-${depth}`, timer: `automine-timer-${depth}`, result: `automine-result-${depth}`, barWrap: `mining-bar-wrap-${depth}`, bar: `mining-bar-${depth}` };
        }
        
        function startAutomine(depth) {
            depth = depth || currentMineDepth || 'cave';
            if (automineInterval) return;
            const ids = getAutomineIDs(depth);
            const button = document.getElementById(ids.btn);
            const instruction = document.getElementById(ids.instr);
            const timer = document.getElementById(ids.timer);
            const result = document.getElementById(ids.result);
            const cfg = MINE_DEPTHS[depth];
            if (!button || !timer || !result) return;
            
            button.innerHTML = '<div style="font-size:40px;">⛏️</div><div style="font-size:14px;">STOP</div>';
            button.style.background = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
            button.onclick = () => stopAutomine(depth);
            if (instruction) instruction.textContent = 'Stop Automine';
            
            automineTimeLeft = 60;
            automineRunId++;
            const myRunId = automineRunId;
            currentMineDepth = depth;
            
            // Show progress bar, reset to full
            const barWrap = document.getElementById(ids.barWrap);
            const barEl = document.getElementById(ids.bar);
            if (barWrap) barWrap.style.display = 'block';
            if (barEl) { barEl.style.transition = 'none'; barEl.style.width = '100%'; }
            
            timer.textContent = `⏱️ ${automineTimeLeft}s remaining`;
            result.textContent = '';
            notify(`⛏️ Started mining at ${cfg.label}!`);
            
            automineInterval = setInterval(() => {
                if (myRunId !== automineRunId) { clearInterval(automineInterval); return; }
                automineTimeLeft--;
                const timerEl = document.getElementById(ids.timer);
                const resultEl = document.getElementById(ids.result);
                if (timerEl) timerEl.textContent = `⏱️ ${automineTimeLeft}s remaining`;
                
                // Update progress bar
                const tickBar = document.getElementById(ids.bar);
                if (tickBar) { tickBar.style.transition = 'width 1s linear'; tickBar.style.width = `${(automineTimeLeft / 60) * 100}%`; }
                
                // --- Ore drops (each ore rolls independently) ---
                const miningLv = gs.skills && gs.skills.mining ? gs.skills.mining.level : 1;
                const lvBonus = (miningLv - 1) * 0.001; // +0.1% per level
                const depthOres = ORE_TABLE[depth] || [];
                let oreDropped = false;
                for (const ore of depthOres) {
                    if (Math.random() < ore.base + lvBonus) {
                        addItem(ore.id, 1);
                        addSkillXP('mining', ore.xp);
                        oreDropped = true;
                        const pickSound = document.getElementById('pickaxe-sound');
                        if (pickSound) { pickSound.currentTime = 0; pickSound.play().catch(() => {}); }
                        if (resultEl) resultEl.textContent = ore.emoji + ' Mined ' + ore.label + '!';
                        setTimeout(() => { if (myRunId === automineRunId && resultEl) resultEl.textContent = ''; }, 1500);
                        break; // One ore drop per tick max
                    }
                }

                // --- Rock drop (only if no ore this tick) ---
                if (!oreDropped && Math.random() < cfg.rockChance) {
                    addItem('rock', 1);
                    addSkillXP('mining', cfg.rockXP);
                    const pickSound = document.getElementById('pickaxe-sound');
                    if (pickSound) { pickSound.currentTime = 0; pickSound.play().catch(() => {}); }
                    if (resultEl) resultEl.textContent = '🪨 Mined Rock!';
                    setTimeout(() => { if (myRunId === automineRunId && resultEl) resultEl.textContent = ''; }, 1500);
                }
                
                if (!gs.frogs.frog_yellow && Math.random() < 0.0001) {
                    addItem('frog_yellow', 1);
                    notify('🟡🐸 A Yellow Frog crawled out of the rocks!', 'achievement');
                }
                
                // Geode drop based on depth
                if (cfg.geodeItem && Math.random() < cfg.geodeChance) {
                    addItem(cfg.geodeItem, 1);
                    const geodeName = cfg.geodeItem.replace('_', ' ').replace(/\w/g, c => c.toUpperCase());
                    if (resultEl) resultEl.textContent = '🪨 Found a ' + geodeName + '!';
                    setTimeout(() => { if (myRunId === automineRunId && resultEl) resultEl.textContent = ''; }, 2000);
                    notify('🪨 Found a ' + geodeName + '!');
                }
                
                if (automineTimeLeft <= 0) {
                    stopAutomine(depth);
                    const t = document.getElementById(ids.timer);
                    if (t) { t.textContent = '✅ Mining complete!'; setTimeout(() => { if (t) t.textContent = ''; }, 3000); }
                    notify('✅ Automining finished!');
                }
            }, 1000);
        }
        
        function stopAutomine(depth) {
            depth = depth || currentMineDepth || 'cave';
            automineRunId++;
            if (automineInterval) { clearInterval(automineInterval); automineInterval = null; }
            const ids = getAutomineIDs(depth);
            const button = document.getElementById(ids.btn);
            const instruction = document.getElementById(ids.instr);
            if (button) {
                button.innerHTML = '<div style="font-size:40px;">⛏️</div><div style="font-size:14px;">START</div>';
                button.style.background = 'linear-gradient(135deg, #8b7355 0%, #5d4e37 100%)';
                button.onclick = () => startAutomine(depth);
                button.disabled = false; button.style.opacity = '1'; button.style.cursor = 'pointer';
            }
            if (instruction) instruction.textContent = 'Press to Automine';
            automineTimeLeft = 0;
            // Hide and reset progress bar
            const barWrap = document.getElementById(ids.barWrap);
            const barEl = document.getElementById(ids.bar);
            if (barWrap) barWrap.style.display = 'none';
            if (barEl) { barEl.style.transition = 'none'; barEl.style.width = '100%'; }
        }
        
        // Wire up all start-automine buttons
        ['cave','depth1','depth2','depth3','depth4','depth5'].forEach(d => {
            const ids = getAutomineIDs(d);
            const btn = document.getElementById(ids.btn);
            if (btn) btn.onclick = () => startAutomine(d);
        });
        
        function displayMiningMenu() {
            const miningLevel = gs.skills && gs.skills.mining ? gs.skills.mining.level : 1;
            const depths = ['cave','depth1','depth2','depth3','depth4','depth5'];
            depths.forEach(depth => {
                const cfg = MINE_DEPTHS[depth];
                const btnId = depth === 'cave' ? 'goto-cave' : `goto-${depth}`;
                const btn = document.getElementById(btnId);
                if (!btn) return;
                const locked = miningLevel < cfg.reqLevel;
                btn.style.opacity = locked ? '0.45' : '1';
                btn.style.cursor = locked ? 'not-allowed' : 'pointer';
                btn.style.filter = locked ? 'grayscale(0.6)' : '';
            });
        }
        try {
            document.getElementById('back-to-area').onclick = () => switchRoom('area-room');
            document.getElementById('back-to-area-mining').onclick = () => switchRoom('area-room');
            document.getElementById('goto-pond').onclick = () => switchRoom('fishing-pond-room');
            document.getElementById('leave-pond').onclick = () => switchRoom('fishing-menu-room');
            
            document.getElementById('goto-river').onclick = () => {
                if (!gs.tools || !gs.tools.better_net) {
                    notify('❌ You need a Fishing Net to fish at the River! Buy it from the shop.');
                    return;
                }
                switchRoom('fishing-river-room');
            };
            document.getElementById('leave-river').onclick = () => switchRoom('fishing-menu-room');
            function enterMineDepth(depth) {
                const cfg = MINE_DEPTHS[depth];
                const miningLevel = gs.skills && gs.skills.mining ? gs.skills.mining.level : 1;
                if (miningLevel < cfg.reqLevel) {
                    notify(`🔒 Requires Mining Level ${cfg.reqLevel}! (You are Level ${miningLevel})`, 'warning');
                    return;
                }
                const roomId = depth === 'cave' ? 'mining-cave-room' : `mining-${depth}-room`;
                switchRoom(roomId);
                currentMineDepth = depth;
                // Restore button state if mining is active in this depth
                if (automineInterval && currentMineDepth === depth) {
                    const ids = getAutomineIDs(depth);
                    const button = document.getElementById(ids.btn);
                    const timer = document.getElementById(ids.timer);
                    const instruction = document.getElementById(ids.instr);
                    if (button) {
                        button.innerHTML = '<div style="font-size:40px;">⛏️</div><div style="font-size:14px;">STOP</div>';
                        button.style.background = 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)';
                        button.onclick = () => stopAutomine(depth);
                    }
                    if (instruction) instruction.textContent = 'Stop Automine';
                    if (timer) timer.textContent = `⏱️ ${automineTimeLeft}s remaining`;
                }
            }
            
            document.getElementById('goto-cave').onclick = () => enterMineDepth('cave');
            document.getElementById('goto-depth1').onclick = () => enterMineDepth('depth1');
            document.getElementById('goto-depth2').onclick = () => enterMineDepth('depth2');
            document.getElementById('goto-depth3').onclick = () => enterMineDepth('depth3');
            document.getElementById('goto-depth4').onclick = () => enterMineDepth('depth4');
            document.getElementById('goto-depth5').onclick = () => enterMineDepth('depth5');
            
            document.getElementById('leave-cave').onclick = () => switchRoom('mining-menu-room');
            document.getElementById('leave-depth1').onclick = () => switchRoom('mining-menu-room');
            document.getElementById('leave-depth2').onclick = () => switchRoom('mining-menu-room');
            document.getElementById('leave-depth3').onclick = () => switchRoom('mining-menu-room');
            document.getElementById('leave-depth4').onclick = () => switchRoom('mining-menu-room');
            document.getElementById('leave-depth5').onclick = () => switchRoom('mining-menu-room');
            
    
            
            // Fishing buttons
            // Pond: hold to fish
            const pondBtn = document.getElementById('fish-pond-btn');
            
            // Desktop: mousedown starts, mouseup checks
            pondBtn.addEventListener('mousedown', () => {
                if (!pondCastActive && !pondHolding) {
                    startFishing('pond');
                }
            });
            pondBtn.addEventListener('mouseup', stopFishing);
            pondBtn.addEventListener('mouseleave', () => {
                if (pondCastActive || pondHolding) stopFishing();
            });
            
            // Mobile: touchstart starts, touchend checks
            pondBtn.addEventListener('touchstart', (e) => { 
                e.preventDefault(); 
                if (!pondCastActive && !pondHolding) {
                    startFishing('pond');
                }
            });
            pondBtn.addEventListener('touchend', (e) => { 
                e.preventDefault(); 
                stopFishing(); 
            });
            
            // River: hold to start, release to stop
            const riverBtn = document.getElementById('cast-river');
            
            riverBtn.addEventListener('mousedown', startRiverFishing);
            riverBtn.addEventListener('mouseup', stopRiverBar);
            riverBtn.addEventListener('mouseleave', () => {
                if (riverActive) stopRiverBar();
            });
            
            riverBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startRiverFishing();
            });
            riverBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopRiverBar();
            });
            
            
            document.getElementById('goto-adventure').onclick = () => {
                switchRoom('adventure-room');
                displayAdventureDoors();
            };
            document.getElementById('back-to-area-adventure').onclick = () => switchRoom('area-room');
            
            document.getElementById('goto-farming-menu').onclick = () => switchRoom('farming-menu-room');
            document.getElementById('back-to-area-farm').onclick = () => switchRoom('area-room');
            document.getElementById('goto-garden').onclick = () => {
                switchRoom('farming-garden-room');
                setTimeout(() => initGardenPlots(), 0);
            };
            document.getElementById('goto-field').onclick = () => {
                if (!gs.tools.golden_hoe) {
                    notify('❌ You need a Golden Hoe to farm at the Fields! Buy it from the shop.');
                    return;
                }
                switchRoom('farming-field-room');
                initFieldGame();
            };
            document.getElementById('leave-garden').onclick = () => {
                stopGardenGame();
                switchRoom('farming-menu-room');
            };
            document.getElementById('leave-field').onclick = () => {
                stopFieldGame();
                switchRoom('farming-menu-room');
            };
            document.getElementById('goto-orchard').onclick = () => {
                switchRoom('farming-orchard-room');
                initOrchardGame();
            };
            document.getElementById('leave-orchard').onclick = () => {
                stopOrchardGame();
                switchRoom('farming-menu-room');
            };
            document.getElementById('orchard-tap-btn').onclick = orchardTap;
            
            // OLD SHOP BUTTONS (replaced by grid)
            /*
            document.getElementById('buy-fish').onclick = () => {
                if (gs.coins >= 10) {
                    gs.coins -= 10;
                    addItem('fish', 1);
                    save();
                } else {
                    notify('Not enough coins!');
                }
            };
            
            document.getElementById('buy-carrot').onclick = () => {
                if (gs.coins >= 5) {
                    gs.coins -= 5;
                    addItem('carrot', 1);
                    save();
                } else {
                    notify('Not enough coins!');
                }
            };
            */
            
            // Debug functions
            document.getElementById('fill-bag').onclick = () => {
                addItem('carrot', 3);  // Carrots
                addItem('fish7', 1);  // Crab
                addItem('fish8', 1);  // Shark
                addItem('fish5', 1);  // Lobster
            };
            
            document.getElementById('toggle-debug-console').onclick = () => {
                const debugConsole = document.getElementById('debug-console');
                if (debugConsole.style.display === 'none') {
                    debugConsole.style.display = 'block';
                    notify('Debug console shown');
                } else {
                    debugConsole.style.display = 'none';
                    notify('Debug console hidden');
                }
            };
            
            document.getElementById('clear-bag').onclick = () => {
                gs.inventory = {};
                save();
                notify('Inventory cleared');
                updateInventoryCounter();
                if (basketEngine) populateBasket();
            };
            
            document.getElementById('fill-geodes').onclick = () => {
                addItem('small_geode', 6);
                notify('Added 6 Small Geodes!');
            };
            
            document.getElementById('give-coins').onclick = () => {
                gs.coins += 1000;
                save();
                updateUI();
                notify('Added 1000 coins!');
            };
            
            document.getElementById('boost-skills').onclick = () => {
                if (!gs.skills) gs.skills = {};
                ['fishing','mining','farming','cooking'].forEach(skill => {
                    if (!gs.skills[skill]) gs.skills[skill] = { level: 1, xp: 0, xpNeeded: 10 };
                    gs.skills[skill].level = Math.min(100, gs.skills[skill].level + 5);
                });
                save(); updateUI();
                notify('📈 +5 to all Skills!', 'achievement');
                displayMiningMenu();
            };
            
            document.getElementById('give-geodes').onclick = () => {
                ['small_geode','medium_geode','large_geode','rare_geode','rainbow_geode'].forEach(id => addItem(id, 1));
                notify('🪨 Gave 1 of each geode!');
            };
            
            document.getElementById('give-frog').onclick = () => {
                const frogIds = Object.keys(FROGS_DATA);
                const randomFrog = frogIds[Math.floor(Math.random() * frogIds.length)];
                addItem(randomFrog, 1);
                notify('🐸 Spawned a ' + FROGS_DATA[randomFrog].name + '!');
            };
            
            const FONT_OPTIONS = [
                { name: 'Press Start 2P', family: "'Press Start 2P', monospace", tag: 'Pixel / Retro' },
                { name: 'Fredoka One',    family: "'Fredoka One', sans-serif",   tag: 'Bubbly / Game' },
                { name: 'Baloo 2',        family: "'Baloo 2', sans-serif",       tag: 'Playful / Chunky' },
                { name: 'Righteous',      family: "'Righteous', sans-serif",     tag: 'Bold / Fun' },
                { name: 'Nunito',         family: "'Nunito', sans-serif",        tag: 'Soft / Rounded' },
                { name: 'Quicksand',      family: "'Quicksand', sans-serif",     tag: 'Light / Modern' },
                { name: 'VT323',          family: "'VT323', monospace",          tag: 'CRT / Terminal' },
                { name: 'monospace',      family: 'monospace',                   tag: 'System Mono' },
                { name: 'sans-serif',     family: 'sans-serif',                  tag: 'System Sans' },
                { name: 'serif',          family: 'serif',                       tag: 'System Serif' },
            ];
            
            document.getElementById('font-preview').onclick = () => {
                const modal = document.getElementById('font-modal');
                const list = document.getElementById('font-list');
                list.innerHTML = '';
                FONT_OPTIONS.forEach(f => {
                    const card = document.createElement('div');
                    card.style.cssText = 'background:rgba(255,255,255,0.1);border-radius:10px;padding:12px 14px;border:1px solid rgba(255,255,255,0.15);';
                    card.innerHTML = `
                        <div style="font-family:${f.family};font-size:18px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.6);margin-bottom:4px;">SlimeHearth 🐸</div>
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-size:11px;color:rgba(255,255,255,0.6);">${f.name}</span>
                            <span style="font-size:10px;background:rgba(0,0,0,0.3);color:rgba(255,255,255,0.7);padding:2px 7px;border-radius:10px;">${f.tag}</span>
                        </div>
                    `;
                    list.appendChild(card);
                });
                modal.style.display = 'flex';
            };
            
            document.getElementById('font-modal-close').onclick = () => {
                document.getElementById('font-modal').style.display = 'none';
            };
            document.getElementById('font-modal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('font-modal'))
                    document.getElementById('font-modal').style.display = 'none';
            });
            
            const resetBtn = document.getElementById('reset-game');
            if (resetBtn) {
                resetBtn.onclick = () => {
                    const confirmed1 = confirm('⚠️ RESET ENTIRE GAME? This will delete all progress and return to the hatch screen. Are you sure?');
                    if (confirmed1) {
                        const confirmed2 = confirm('🚨 FINAL WARNING: All your progress will be lost! Continue?');
                        if (confirmed2) {
                            localStorage.removeItem('slimekeeper_save');
                            notify('🔄 Game Reset! Reloading...', 'achievement');
                            setTimeout(() => location.reload(), 1000);
                        }
                    }
                };
                resetBtn.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    resetBtn.click();
                });
            }
            
            
            // document.getElementById('tap-garden-btn').onclick = tapGarden; // OLD - button doesn't exist anymore
            document.getElementById('field-tap-btn').onclick = fieldTap;
            
    
            document.getElementById('goto-cooking-menu').onclick = () => {
                switchRoom('cooking-menu-room');
                setTimeout(() => initHearth(), 0);
            };
            document.getElementById('goto-shack').onclick = () => {
                switchRoom('shack-room');
                updateCrackButton();
                updateProspectingDisplay();
            };
            document.getElementById('back-to-area-cook').onclick = () => switchRoom('area-room');
            
            // OLD COOKING MINIGAMES - buttons don't exist anymore, we go straight to The Hearth now
            /*
            document.getElementById('goto-kitchen').onclick = () => {
                console.log('Going to kitchen...');
                switchRoom('cooking-kitchen-room');
                
                // Set up slot click handler
                setTimeout(() => {
                    console.log('showKitchenInventoryMenu function exists:', typeof showKitchenInventoryMenu);
                    const slot = document.getElementById('kitchen-ingredient-slot');
                    console.log('Kitchen slot element:', slot);
                    if (slot) {
                        slot.onclick = () => {
                            console.log('SLOT CLICKED!');
                            try {
                                console.log('Calling showKitchenInventoryMenu...');
                                showKitchenInventoryMenu();
                                console.log('showKitchenInventoryMenu completed');
                            } catch(e) {
                                console.error('Error calling menu:', e);
                            }
                        };
                        console.log('Slot handler attached');
                    } else {
                        console.error('Kitchen slot not found!');
                    }
                }, 100);
            };
            document.getElementById('goto-grill').onclick = () => {
                switchRoom('cooking-grill-room');
                initGrillGame();
            };
            document.getElementById('leave-kitchen').onclick = () => {
                stopKitchenGame();
                switchRoom('cooking-menu-room');
            };
            document.getElementById('leave-grill').onclick = () => {
                stopGrillGame();
                switchRoom('cooking-menu-room');
            };
    
            
            document.getElementById('stir-kitchen-btn').onclick = stirKitchen;
            document.getElementById('grill-heat-up').onclick = grillHeatUp;
            document.getElementById('grill-cool-down').onclick = grillCoolDown;
            */
            
            // Shack button handlers
            document.getElementById('shack-geode-slot').onclick = showShackInventoryMenu;
            document.getElementById('crack-geode-btn').onclick = crackGeode;
            document.getElementById('leave-shack').onclick = () => switchRoom('area-room');
            
            // Room button handlers
            document.getElementById('goto-wardrobe').onclick = () => {
                switchRoom('wardrobe-room');
                displayHats();
            };
            document.getElementById('goto-trophies').onclick = () => {
                switchRoom('trophies-room');
                displayTrophies();
                displayKeys();
                displayFrogs();
            };
            document.getElementById('leave-wardrobe').onclick = () => switchRoom('room-room');
            document.getElementById('leave-trophies').onclick = () => switchRoom('room-room');
    
            // Music control
            const bgMusic = document.getElementById('bg-music');
            const musicBtn = document.getElementById('music-btn');
            let musicPlaying = false;
            
            bgMusic.volume = 0.3;
            
            function startMusic() {
                bgMusic.play().then(() => {
                    musicPlaying = true;
                    updateMusicButton();
                }).catch(() => {
                    musicPlaying = false;
                    updateMusicButton();
                });
            }
            
            const musicToggleBtn = document.getElementById('music-toggle-btn');
            const musicStatus = document.getElementById('music-status');
            
            function updateMusicButton() {
                if (musicPlaying) {
                    musicToggleBtn.textContent = '🔊';
                    musicToggleBtn.style.background = '#4caf50';
                    musicStatus.textContent = 'Music Playing';
                    musicStatus.style.color = '#4caf50';
                } else {
                    musicToggleBtn.textContent = '🔇';
                    musicToggleBtn.style.background = '#f44336';
                    musicStatus.textContent = 'Music Muted';
                    musicStatus.style.color = '#f44336';
                }
            }
            
            musicToggleBtn.onclick = () => {
                if (musicPlaying) {
                    bgMusic.pause();
                    musicPlaying = false;
                } else {
                    bgMusic.play();
                    musicPlaying = true;
                }
                updateMusicButton();
            };
            
            startMusic();
            document.addEventListener('click', function() {
                if (!musicPlaying) startMusic();
            }, { once: true });
            
    
            // Volume controls
            const musicVolumeSlider = document.getElementById('music-volume-slider');
            const musicVolumeDisplay = document.getElementById('music-volume-display');
            const sfxVolumeSlider = document.getElementById('sfx-volume-slider');
            const sfxVolumeDisplay = document.getElementById('sfx-volume-display');
            
            musicVolumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                bgMusic.volume = volume;
                musicVolumeDisplay.textContent = e.target.value + '%';
                
                // Auto-play if volume increased from 0
                if (volume > 0 && !musicPlaying) {
                    bgMusic.play();
                    musicPlaying = true;
                    updateMusicButton();
                }
                // Auto-pause if volume set to 0
                if (volume === 0 && musicPlaying) {
                    bgMusic.pause();
                    musicPlaying = false;
                    updateMusicButton();
                }
            });
            
            sfxVolumeSlider.addEventListener('input', (e) => {
                sfxVolumeDisplay.textContent = e.target.value + '%';
                // SFX volume stored for future use
                gs.sfxVolume = e.target.value / 100;
                save();
            });
            
    
            // Debug console
            const debugLog = document.getElementById('debug-log');
            const originalLog = console.log;
            const originalError = console.error;
            
            function addDebugLine(msg, color) {
                const line = document.createElement('div');
                line.style.color = color || '#0f0';
                line.style.marginBottom = '3px';
                line.textContent = msg;
                debugLog.appendChild(line);
                debugLog.scrollTop = debugLog.scrollHeight;
                
                while (debugLog.children.length > 50) {
                    debugLog.removeChild(debugLog.firstChild);
                }
            }
            
            console.log = function() {
                const msg = Array.from(arguments).join(' ');
                originalLog.apply(console, arguments);
                addDebugLine(msg, '#0f0');
            };
            
            console.error = function() {
                const msg = 'ERROR: ' + Array.from(arguments).join(' ');
                originalError.apply(console, arguments);
                addDebugLine(msg, '#f00');
            };
            
            console.log('Debug console initialized');
            console.log('Game version: v0.791');
            
    
        } catch(e) {
            console.error('GAME-MINING INIT CRASH:', e);
            // Show error visibly on screen for debugging
            const errDiv = document.createElement('div');
            errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:#fff;padding:10px;z-index:999999;font-size:13px;font-family:monospace;white-space:pre-wrap;';
            errDiv.textContent = 'INIT ERROR: ' + e.message + '\n' + e.stack;
            document.body.appendChild(errDiv);
        }
