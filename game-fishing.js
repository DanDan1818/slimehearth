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
        
        
