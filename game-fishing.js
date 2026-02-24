        // ===== FISHING MINIGAME =====
        // Pond: Click-and-hold
        let fishingProgress = 0;
        let fishingInterval = null;
        let fishingArea = 'pond';
        
        // ===== POND FISHING: Cast & Hold Timing =====
        let pondCastActive = false;
        let pondHolding = false;
        let pondTimerInterval = null;
        let pondElapsedTime = 0;
        let pondCatchStart = 0;
        let pondCatchEnd = 0;
        
        function startFishing(area) {
            if (area !== 'pond') return; // Only pond uses this new system
            
            if (!pondCastActive && !pondHolding) {
                // Start cast AND hold immediately
                castPondLine();
                pondHolding = true; // Player is holding from the start
            }
        }
        
        function castPondLine() {
            pondCastActive = true;
            pondElapsedTime = 0;
            
            const result = document.getElementById('fishing-result-pond');
            const bar = document.getElementById('fishing-bar-pond');
            
            result.textContent = '';
            bar.style.width = '0%';
            bar.style.transition = 'none';
            const castLabel = document.getElementById('fishing-bar-label');
            if (castLabel) castLabel.textContent = '🎣 Fishing...';
            // Gentle vertical sway on the whole container
            const barContainer = document.getElementById('fishing-progress-pond');
            bar.style.background = 'linear-gradient(90deg,#38bdf8,#0ea5e9,#0284c7)';
            bar.style.backgroundSize = '';
            bar.style.animation = 'none';
            if (barContainer) barContainer.style.animation = 'pondWave 1.8s ease-in-out infinite';
            
            // Random wait time 1-20 seconds
            const totalTime = 1000 + Math.random() * 19000; // 1-20 seconds in ms
            
            // Random catch window (2 second duration) somewhere in the timeline
            const catchWindowStart = Math.random() * (totalTime - 2000); // Ensure 2s window fits
            pondCatchStart = catchWindowStart;
            pondCatchEnd = catchWindowStart + 2000; // 2 second window
            
            console.log('Cast! Total time:', totalTime, 'Catch window:', pondCatchStart, '-', pondCatchEnd);
            
            // Start timer
            pondTimerInterval = setInterval(() => {
                pondElapsedTime += 50;
                const progress = (pondElapsedTime / totalTime) * 100;
                bar.style.width = Math.min(100, progress) + '%';
                
                const splash = document.getElementById('pond-splash');
                
                // Check if we're in catch window
                const inCatch = pondElapsedTime >= pondCatchStart && pondElapsedTime <= pondCatchEnd;
                const justEnteredCatch = pondElapsedTime >= pondCatchStart && pondElapsedTime < pondCatchStart + 100;
                
                const barContainer = document.getElementById('fishing-progress-pond');
                if (inCatch) {
                    // CATCH WINDOW — green
                    bar.style.background = 'linear-gradient(90deg,#4ade80,#86efac,#16a34a)';
                    bar.style.backgroundSize = '';
                    bar.style.animation = 'none';
                    result.textContent = '';
                    const biteLabel = document.getElementById('fishing-bar-label');
                    if (biteLabel) biteLabel.textContent = '🐟 BITE! Release now!';
                    
                    // On first frame: whole container jumps upward like a fish!
                    if (justEnteredCatch) {
                        if (barContainer) {
                            barContainer.style.animation = 'none';
                            void barContainer.offsetWidth;
                            barContainer.style.animation = 'pondBite 0.6s cubic-bezier(0.2,1.4,0.4,1) forwards, pondWave 1.2s ease-in-out 0.6s infinite';
                        }
                        // Burst the outer specks
                        const specks = document.querySelectorAll('.pspeck');
                        specks.forEach((s, i) => {
                            s.classList.remove('burst');
                            void s.offsetWidth;
                            s.classList.add('burst');
                            s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                        });
                        // Show splash
                        if (splash && splash.style.display === 'none') {
                            splash.style.display = 'block';
                            const bobberSound = document.getElementById('bobber-sound');
                            if (bobberSound) {
                                bobberSound.currentTime = 0;
                                bobberSound.volume = 0.5;
                                bobberSound.play().catch(() => {});
                            }
                            setTimeout(() => { if (splash) splash.style.display = 'none'; }, 600);
                        }
                    }
                } else {
                    // Normal fishing — gentle vertical sway on whole container
                    bar.style.background = 'linear-gradient(90deg,#38bdf8,#0ea5e9,#0284c7)';
                    bar.style.backgroundSize = '';
                    bar.style.animation = 'none';
                    if (barContainer) barContainer.style.animation = 'pondWave 1.8s ease-in-out infinite';
                    const fishLabel = document.getElementById('fishing-bar-label');
                    if (fishLabel) fishLabel.textContent = '🎣 Fishing...';
                }
                
                // Time's up
                if (pondElapsedTime >= totalTime) {
                    clearInterval(pondTimerInterval);
                    pondTimerInterval = null;
                    result.textContent = '❌ Missed - line too long!';
                    resetPondFishing();
                }
            }, 50);
        }
        
        function startPondHold() {
            // Removed - no longer needed
        }
        
        function stopFishing() {
            if (!pondCastActive && !pondHolding) return; // Not active
            
            clearInterval(pondTimerInterval);
            
            // Check if released during catch window
            if (pondElapsedTime >= pondCatchStart && pondElapsedTime <= pondCatchEnd) {
                // SUCCESS!
                completeFishing(true);
                resetPondFishing();
            } else {
                // MISSED - released too early or too late
                const result = document.getElementById('fishing-result-pond');
                result.textContent = '❌ Too early/late!';
                resetPondFishing();
            }
        }
        
        function resetPondFishing() {
            pondCastActive = false;
            pondHolding = false;
            pondElapsedTime = 0;
            clearInterval(pondTimerInterval);
            pondTimerInterval = null;
            
            setTimeout(() => {
                const result = document.getElementById('fishing-result-pond');
                const bar = document.getElementById('fishing-bar-pond');
                const splash = document.getElementById('pond-splash');
                
                if (result) result.textContent = '';
                if (bar) {
                    bar.style.width = '0%';
                bar.style.animation = 'none';
                bar.style.backgroundSize = '';
                const resetContainer = document.getElementById('fishing-progress-pond');
                if (resetContainer) resetContainer.style.animation = 'none';
                    bar.style.background = 'linear-gradient(90deg,#38bdf8,#0ea5e9,#0284c7)';
                    bar.style.animation = 'none';
                }
                const resetLabel = document.getElementById('fishing-bar-label');
                if (resetLabel) resetLabel.textContent = '';
                if (splash) splash.style.display = 'none';
            }, 1500);
        }
        
        function updateFishingBar() {
            // Legacy function - kept for compatibility
        }
        
        // River: Timing minigame
        let riverFishingInterval = null;
        let riverBarPos = 0;
        let riverTargetPos = 150;
        let riverActive = false;
        
        function startRiverFishing() {
            if (riverActive) return;
            
            const bar = document.getElementById('fishing-bar-river');
            const target = document.getElementById('fishing-target-river');
            const timer = document.getElementById('fishing-timer-river');
            const castBtn = document.getElementById('cast-river');
            
            riverActive = true;
            riverBarPos = 0;
            riverTargetPos = Math.random() * 200 + 20;
            
            target.style.left = riverTargetPos + 'px';
            timer.textContent = 'Release in green!';
            
            // Start bar movement immediately
            riverFishingInterval = setInterval(() => {
                riverBarPos += 5;
                bar.style.left = riverBarPos + 'px';
                
                if (riverBarPos >= 270) {
                    endRiverFishing(false);
                }
            }, 30);
        }
        
        function stopRiverBar() {
            if (!riverActive) return;
            
            const bar = document.getElementById('fishing-bar-river');
            clearInterval(riverFishingInterval);
            
            const barLeft = parseInt(bar.style.left) || 0;
            const targetLeft = riverTargetPos;
            const targetRight = targetLeft + 50;
            
            const hit = barLeft >= targetLeft && barLeft <= targetRight;
            endRiverFishing(hit);
        }
        
        function endRiverFishing(success) {
            riverActive = false;
            clearInterval(riverFishingInterval);
            
            const bar = document.getElementById('fishing-bar-river');
            const timer = document.getElementById('fishing-timer-river');
            const castBtn = document.getElementById('cast-river');
            
            if (success) {
                // Burst river specks on catch
                document.querySelectorAll('.rspeck').forEach(s => {
                    s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                    s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                });
                // Fishing level scales loot
                const fishLv = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;
                const lvBonus = Math.min((fishLv - 1) * 0.015, 0.30);

                // River drop table
                const trashChance = Math.max(0.35 - lvBonus * 2, 0.05);
                const rand = Math.random();
                let caughtItem;
                let catchMsg;

                if (rand < trashChance) {
                    caughtItem = 'seaweed';
                    catchMsg = '🌿 Pulled up Seaweed...';
                    addSkillXP('fishing', 1);
                } else {
                    const fishRand = Math.random();
                    const epicCut  = Math.min(0.03 + lvBonus * 0.5, 0.18);
                    const rareCut  = Math.min(0.10 + lvBonus,       0.35);
                    const uncomCut = Math.min(0.28 + lvBonus * 0.8, 0.50);
                    if (fishRand < epicCut) {
                        caughtItem = 'fish8'; // Shark (Epic)
                    } else if (fishRand < rareCut) {
                        caughtItem = 'fish7'; // Crab (Rare)
                    } else if (fishRand < uncomCut) {
                        caughtItem = 'fish6'; // Shrimp (Uncommon)
                    } else {
                        caughtItem = 'fish5'; // Lobster (Common)
                    }
                    catchMsg = `🎣 Caught ${ITEM_DATA[caughtItem].name}!`;
                    addSkillXP('fishing', 10);
                }

                timer.textContent = catchMsg;
                addItem(caughtItem, 1);
                
                // 10% chance to find Water Key (only if not already obtained)
                if (!gs.keys.water_key && Math.random() < 0.10) {
                    gs.keys.water_key = true;
                    save();
                    notify('💧 Found a Water Key!', 'achievement');
                }
                
                // 5% chance to find a Basket
                if (Math.random() < 0.05) {
                    addItem('basket', 1);
                    notify('🧺 Found a Basket!');
                }
                
                // 0.01% chance to find Blue Frog (if not already collected)
                if (!gs.frogs.frog_blue && Math.random() < 0.0001) {
                    addItem('frog_blue', 1);
                    notify('🔵🐸 A Blue Frog leapt into your basket!', 'achievement');
                }
            } else {
                timer.textContent = '❌ Missed!';
            }
            
            setTimeout(() => {
                riverBarPos = 0;
                bar.style.left = '0px';
                timer.textContent = '';
            }, 1500);
        }
        
        function completeFishing(success) {
            clearInterval(fishingInterval);
            fishingInterval = null;
            
            const result = document.getElementById('fishing-result-' + fishingArea);
            
            if (success) {
                // Fishing level scales loot — higher level = less trash, better fish
                const fishLv = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;
                const lvBonus = Math.min((fishLv - 1) * 0.015, 0.30); // up to +30% fish chance at lv21+

                // Pond drop table (base rates, scaled by level)
                // Trash shrinks as level rises; fish chances grow proportionally
                const trashChance = Math.max(0.35 - lvBonus * 2, 0.05); // 35% → 5% min
                const rand = Math.random();
                let caughtItem;
                let catchMsg;

                if (rand < trashChance * 0.6) {
                    caughtItem = 'lily_pad';
                    catchMsg = '🌿 Pulled up a Lily Pad...';
                    addSkillXP('fishing', 1);
                } else if (rand < trashChance) {
                    caughtItem = 'old_boot';
                    catchMsg = '👢 Fished up an Old Boot...';
                    addSkillXP('fishing', 1);
                } else {
                    // Fish pool — scaled rates
                    const fishRand = Math.random();
                    const epicCut   = Math.min(0.03 + lvBonus * 0.5, 0.18);  // 3%→18%
                    const rareCut   = Math.min(0.10 + lvBonus,       0.35);  // 10%→35%
                    const uncomCut  = Math.min(0.28 + lvBonus * 0.8, 0.50);  // 28%→50%
                    if (fishRand < epicCut) {
                        caughtItem = 'fish4'; // Golden Fish (Epic)
                    } else if (fishRand < rareCut) {
                        caughtItem = 'fish3'; // Tropical (Rare)
                    } else if (fishRand < uncomCut) {
                        caughtItem = 'fish2'; // Blue Fish (Uncommon)
                    } else {
                        caughtItem = 'fish1'; // Common Fish
                    }
                    catchMsg = `🎣 Caught a ${ITEM_DATA[caughtItem].name}!`;
                    addSkillXP('fishing', 10);
                }

                result.textContent = catchMsg;
                addItem(caughtItem, 1);
                
                // 10% chance to find Water Key (only if not already obtained)
                if (!gs.keys.water_key && Math.random() < 0.10) {
                    gs.keys.water_key = true;
                    save();
                    notify('💧 Found a Water Key!', 'achievement');
                }
                
                // 5% chance to find a Basket
                if (Math.random() < 0.05) {
                    addItem('basket', 1);
                    notify('🧺 Found a Basket!');
                }
                
                // 0.01% chance to find Blue Frog (if not already collected)
                if (!gs.frogs.frog_blue && Math.random() < 0.0001) {
                    addItem('frog_blue', 1);
                    notify('🔵🐸 A Blue Frog leapt into your basket!', 'achievement');
                }
            } else {
                result.textContent = '❌ It got away!';
            }
            
            setTimeout(() => {
                fishingProgress = 0;
                updateFishingBar();
                result.textContent = '';
            }, 1500);
        }
        
        

        // ===== LAKE FISHING: Moving Target Minigame =====
        // The green zone bounces back and forth at variable speed.
        // Player hits the button when the fixed red marker overlaps the green zone.

        let lakeActive      = false;
        let lakeTargetPos   = 0;      // left px of green zone
        let lakeTargetDir   = 1;      // 1 = moving right, -1 = moving left
        let lakeTargetSpeed = 3;      // px per tick — changes per fish
        let lakeInterval    = null;
        const LAKE_BAR_W    = 280;
        const LAKE_TARGET_W = 60;
        const LAKE_MARKER   = 125;    // fixed red marker position (center of bar)

        // Fish personalities: name, speed range, zone width label, drop table key
        const LAKE_FISH = [
            { name: 'Perch',    speedMin: 2,  speedMax: 3,  mood: '😴 Lazy Perch...', item: 'fish1' },
            { name: 'Bass',     speedMin: 3,  speedMax: 5,  mood: '🐟 Steady Bass',   item: 'fish2' },
            { name: 'Trout',    speedMin: 5,  speedMax: 7,  mood: '💨 Darting Trout!', item: 'fish3' },
            { name: 'Pike',     speedMin: 7,  speedMax: 10, mood: '⚡ Wild Pike!!',    item: 'fish4' },
            { name: 'Sturgeon', speedMin: 2,  speedMax: 4,  mood: '🦕 Ancient Sturgeon', item: 'fish8' },
        ];

        function startLakeFishing() {
            if (lakeActive) {
                // Button pressed during active session = catch attempt
                stopLakeFishing();
                return;
            }

            const castBtn = document.getElementById('cast-lake');
            const timer   = document.getElementById('fishing-timer-lake');
            const mood    = document.getElementById('lake-fish-mood');
            const target  = document.getElementById('fishing-target-lake');

            // Pick a fish personality weighted by fishing level
            const fishLv = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;
            const weights = [40, 30, 15, 8, 7]; // perch, bass, trout, pike, sturgeon
            // Higher level shifts weight toward harder fish
            const lvShift = Math.min(Math.floor((fishLv - 1) / 5), 4);
            const picked  = pickWeighted(weights, lvShift);
            const fish    = LAKE_FISH[picked];

            lakeActive      = true;
            lakeTargetPos   = Math.random() * (LAKE_BAR_W - LAKE_TARGET_W);
            lakeTargetDir   = Math.random() < 0.5 ? 1 : -1;
            lakeTargetSpeed = fish.speedMin + Math.random() * (fish.speedMax - fish.speedMin);

            target.style.left = lakeTargetPos + 'px';
            if (timer) timer.textContent = 'Hit when marker is in green!';
            if (mood)  mood.textContent  = fish.mood;

            // Burst specks on cast
            document.querySelectorAll('.lspeck').forEach(s => {
                s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
            });

            lakeInterval = setInterval(() => {
                lakeTargetPos += lakeTargetDir * lakeTargetSpeed;

                // Bounce off edges
                if (lakeTargetPos <= 0) {
                    lakeTargetPos = 0;
                    lakeTargetDir = 1;
                    // Slightly randomize speed on bounce for unpredictability
                    lakeTargetSpeed = fish.speedMin + Math.random() * (fish.speedMax - fish.speedMin);
                }
                if (lakeTargetPos >= LAKE_BAR_W - LAKE_TARGET_W) {
                    lakeTargetPos = LAKE_BAR_W - LAKE_TARGET_W;
                    lakeTargetDir = -1;
                    lakeTargetSpeed = fish.speedMin + Math.random() * (fish.speedMax - fish.speedMin);
                }

                target.style.left = lakeTargetPos + 'px';
            }, 30);

            // Store picked fish for result
            lakeActive = { fish };
        }

        function stopLakeFishing() {
            if (!lakeActive || lakeActive === true) return;
            clearInterval(lakeInterval);
            lakeInterval = null;

            const fish   = lakeActive.fish;
            const timer  = document.getElementById('fishing-timer-lake');
            const mood   = document.getElementById('lake-fish-mood');
            const target = document.getElementById('fishing-target-lake');

            lakeActive = false;

            // Check: is fixed marker (LAKE_MARKER) inside the green zone?
            const zoneLeft  = lakeTargetPos;
            const zoneRight = lakeTargetPos + LAKE_TARGET_W;
            const hit = LAKE_MARKER >= zoneLeft && LAKE_MARKER <= zoneRight;

            if (hit) {
                // Burst specks
                document.querySelectorAll('.lspeck').forEach(s => {
                    s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                    s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                });

                const fishLv  = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;
                const lvBonus = Math.min((fishLv - 1) * 0.015, 0.30);

                // Trash chance reduces with level
                const trashChance = Math.max(0.20 - lvBonus * 1.5, 0.03);
                let caughtItem, catchMsg;

                if (Math.random() < trashChance) {
                    caughtItem = 'seaweed';
                    catchMsg   = '🌿 Pulled up Seaweed...';
                    addSkillXP('fishing', 1);
                } else {
                    // Fish determined by which personality was picked + level bonus
                    const epicCut  = Math.min(0.05 + lvBonus * 0.6, 0.22);
                    const rareCut  = Math.min(0.14 + lvBonus,       0.40);
                    const uncomCut = Math.min(0.32 + lvBonus * 0.8, 0.55);
                    const fishRand = Math.random();
                    if (fishRand < epicCut) {
                        caughtItem = 'fish8'; // Sturgeon (Epic)
                    } else if (fishRand < rareCut) {
                        caughtItem = 'fish7';
                    } else if (fishRand < uncomCut) {
                        caughtItem = 'fish6';
                    } else {
                        caughtItem = fish.item; // Personality-matched catch
                    }
                    catchMsg = '🎣 Caught ' + ITEM_DATA[caughtItem].name + '!';
                    addSkillXP('fishing', 12);
                }

                if (timer) timer.textContent = catchMsg;
                if (mood)  mood.textContent  = '';
                addItem(caughtItem, 1);

                // 5% basket chance
                if (Math.random() < 0.05) { addItem('basket', 1); notify('🧺 Found a Basket!'); }
                // Blue frog
                if (!gs.frogs.frog_blue && Math.random() < 0.0001) {
                    addItem('frog_blue', 1);
                    notify('🔵🐸 A Blue Frog leapt into your basket!', 'achievement');
                }
            } else {
                if (timer) timer.textContent = '❌ Missed! Try again.';
                if (mood)  mood.textContent  = '';
            }

            setTimeout(() => {
                if (timer) timer.textContent = '';
                if (target) target.style.left = (LAKE_BAR_W / 2 - LAKE_TARGET_W / 2) + 'px';
            }, 1500);
        }

        function pickWeighted(weights, shift) {
            // Shift weight toward higher indices based on level
            const shifted = weights.map((w, i) => Math.max(1, w - shift * i * 3 + shift * (weights.length - 1 - i) * 2));
            const total = shifted.reduce((a, b) => a + b, 0);
            let r = Math.random() * total;
            for (let i = 0; i < shifted.length; i++) {
                r -= shifted[i];
                if (r <= 0) return i;
            }
            return shifted.length - 1;
        }

        // ===== SEA FISHING: 4 Vertical Bars =====
        // All 4 green zones move independently at their fish's speed.
        // Tap cast to start all 4, tap again to stop all 4 and score.

        const SEA_BAR_H    = 140;   // px height of each bar
        const SEA_TARGET_H = 44;    // px height of green zone
        const SEA_MARKER_Y = 67;    // fixed red marker position (center of bar)

        // Sea fish pool — each bar gets one independently
        const SEA_FISH_POOL = [
            { emoji: '🐟', name: 'Sardine',   item: 'fish1', speedMin: 1.5, speedMax: 2.5 },
            { emoji: '🐠', name: 'Mackerel',  item: 'fish2', speedMin: 2,   speedMax: 4   },
            { emoji: '🐡', name: 'Tuna',      item: 'fish3', speedMin: 3.5, speedMax: 6   },
            { emoji: '🦈', name: 'Shark',     item: 'fish8', speedMin: 6,   speedMax: 9   },
            { emoji: '🦞', name: 'Lobster',   item: 'fish5', speedMin: 1,   speedMax: 2   },
            { emoji: '🦐', name: 'Shrimp',    item: 'fish6', speedMin: 2,   speedMax: 3.5 },
            { emoji: '🦀', name: 'Crab',      item: 'fish7', speedMin: 1.5, speedMax: 3   },
            { emoji: '🎣', name: 'Swordfish', item: 'fish4', speedMin: 5,   speedMax: 8   },
        ];

        let seaActive   = false;
        let seaInterval = null;
        let seaBars     = []; // per-bar state: { fish, pos, dir, speed }

        function startSeaFishing() {
            if (seaActive) {
                stopSeaFishing();
                return;
            }

            const timer     = document.getElementById('fishing-timer-sea');
            const scoreLabel = document.getElementById('sea-score-label');
            const fishLv    = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;

            // Assign a random fish to each bar, weighted by level
            seaBars = [0, 1, 2, 3].map(i => {
                // Higher level → harder fish available
                const maxIdx = Math.min(Math.floor(fishLv / 3) + 3, SEA_FISH_POOL.length - 1);
                const pool = SEA_FISH_POOL.slice(0, maxIdx + 1);
                const fish = pool[Math.floor(Math.random() * pool.length)];
                const speed = fish.speedMin + Math.random() * (fish.speedMax - fish.speedMin);
                return {
                    fish,
                    pos: Math.random() * (SEA_BAR_H - SEA_TARGET_H),
                    dir: Math.random() < 0.5 ? 1 : -1,
                    speed,
                };
            });

            seaActive = true;

            // Set labels, clear results
            seaBars.forEach((b, i) => {
                const label = document.getElementById('sea-label-' + i);
                const result = document.getElementById('sea-result-' + i);
                const target = document.getElementById('sea-target-' + i);
                if (label)  label.textContent  = b.fish.emoji;
                if (result) result.textContent = '';
                if (target) target.style.top   = b.pos + 'px';
                // Reset bar background
                const container = document.getElementById('sea-bar-' + i);
                if (container) container.style.background = 'rgba(255,255,255,0.55)';
            });

            if (timer)      timer.textContent = 'Stop when markers hit green!';
            if (scoreLabel) scoreLabel.textContent = '';

            // Animation loop
            seaInterval = setInterval(() => {
                seaBars.forEach((b, i) => {
                    b.pos += b.dir * b.speed;
                    // Bounce + re-randomize speed
                    if (b.pos <= 0) {
                        b.pos = 0; b.dir = 1;
                        b.speed = b.fish.speedMin + Math.random() * (b.fish.speedMax - b.fish.speedMin);
                    }
                    if (b.pos >= SEA_BAR_H - SEA_TARGET_H) {
                        b.pos = SEA_BAR_H - SEA_TARGET_H; b.dir = -1;
                        b.speed = b.fish.speedMin + Math.random() * (b.fish.speedMax - b.fish.speedMin);
                    }
                    const target = document.getElementById('sea-target-' + i);
                    if (target) target.style.top = b.pos + 'px';
                });
            }, 30);
        }

        function stopSeaFishing() {
            if (!seaActive) return;
            clearInterval(seaInterval);
            seaInterval = null;
            seaActive   = false;

            const timer      = document.getElementById('fishing-timer-sea');
            const scoreLabel = document.getElementById('sea-score-label');
            const fishLv     = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;

            let hits = 0;
            const caughtItems = [];

            seaBars.forEach((b, i) => {
                const zoneTop    = b.pos;
                const zoneBottom = b.pos + SEA_TARGET_H;
                const hit = SEA_MARKER_Y >= zoneTop && SEA_MARKER_Y <= zoneBottom;

                const result    = document.getElementById('sea-result-' + i);
                const container = document.getElementById('sea-bar-' + i);

                if (hit) {
                    hits++;
                    if (result)    result.textContent = '✅';
                    if (container) container.style.background = 'rgba(74,222,128,0.3)';
                    caughtItems.push(b.fish.item);
                } else {
                    if (result)    result.textContent = '❌';
                    if (container) container.style.background = 'rgba(239,68,68,0.15)';
                }
            });

            // Award catches
            if (hits > 0) {
                caughtItems.forEach(itemId => addItem(itemId, 1));
                addSkillXP('fishing', hits * 8);
                const names = caughtItems.map(id => ITEM_DATA[id] ? ITEM_DATA[id].name : id).join(', ');
                if (timer)      timer.textContent = '🎣 Caught ' + hits + '/4! ' + (hits === 4 ? '🔥 Perfect!' : '');
                if (scoreLabel) scoreLabel.textContent = names;

                // Bonuses
                if (Math.random() < 0.05 * hits) { addItem('basket', 1); notify('🧺 Found a Basket!'); }
                if (!gs.frogs.frog_blue && Math.random() < 0.0001) {
                    addItem('frog_blue', 1);
                    notify('🔵🐸 A Blue Frog leapt from the sea!', 'achievement');
                }
            } else {
                if (timer)      timer.textContent = '❌ Nothing caught!';
                if (scoreLabel) scoreLabel.textContent = '';
            }

            // Reset after delay
            setTimeout(() => {
                if (timer)      timer.textContent = '';
                if (scoreLabel) scoreLabel.textContent = '';
                [0,1,2,3].forEach(i => {
                    const result    = document.getElementById('sea-result-' + i);
                    const container = document.getElementById('sea-bar-' + i);
                    const target    = document.getElementById('sea-target-' + i);
                    const label     = document.getElementById('sea-label-' + i);
                    if (result)    result.textContent = '';
                    if (label)     label.textContent  = '';
                    if (container) container.style.background = 'rgba(255,255,255,0.55)';
                    if (target)    target.style.top = ((SEA_BAR_H - SEA_TARGET_H) / 2) + 'px';
                });
            }, 2000);
        }
