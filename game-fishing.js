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
            const pondBobber = document.getElementById('fishing-bar-pond-bobber');
            if (pondBobber) { pondBobber.style.visibility = 'visible'; pondBobber.style.left = '0px'; }
            const castLabel = document.getElementById('fishing-bar-label');
            if (castLabel) castLabel.textContent = '🎣 Fishing...';
            // Gentle vertical sway on the whole container
            const barContainer = document.getElementById('fishing-progress-pond');
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
                const progressClamped = Math.min(100, progress);
                bar.style.width = progressClamped + '%';
                // Move bobber to leading edge of bar (bar is 200px wide)
                const pondBobberTick = document.getElementById('fishing-bar-pond-bobber');
                if (pondBobberTick) pondBobberTick.style.left = Math.min(174, (progressClamped / 100) * 200) + 'px';
                
                const splash = document.getElementById('pond-splash');
                
                // Check if we're in catch window
                const inCatch = pondElapsedTime >= pondCatchStart && pondElapsedTime <= pondCatchEnd;
                const justEnteredCatch = pondElapsedTime >= pondCatchStart && pondElapsedTime < pondCatchStart + 100;
                
                const barContainer = document.getElementById('fishing-progress-pond');
                if (inCatch) {
                    // CATCH WINDOW — green
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
                        // Bobber sinks and vanishes in sync with the bite jump
                        const pondBobberSink = document.getElementById('fishing-bar-pond-bobber');
                        if (pondBobberSink) {
                            pondBobberSink.style.animation = 'none';
                            void pondBobberSink.offsetWidth;
                            pondBobberSink.style.animation = 'bobberSink 0.6s ease-in forwards';
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
                const resetContainer = document.getElementById('fishing-progress-pond');
                if (resetContainer) resetContainer.style.animation = 'none';
                }
                const resetLabel = document.getElementById('fishing-bar-label');
                if (resetLabel) resetLabel.textContent = '';
                if (splash) splash.style.display = 'none';
                const pondBobberReset = document.getElementById('fishing-bar-pond-bobber');
                if (pondBobberReset) {
                    pondBobberReset.style.animation = 'none';
                    pondBobberReset.style.opacity = '1';
                    pondBobberReset.style.transform = '';
                    pondBobberReset.style.visibility = 'hidden';
                    pondBobberReset.style.left = '0px';
                }
            }, 1500);
        }
        
        function updateFishingBar() {
            // Legacy function - kept for compatibility
        }
        
        // River: Timing minigame
        let riverFishingInterval = null;
        let riverCleanupTimeout = null;
        let riverBarPos = 0;
        let riverTargetPos = 150;
        let riverActive = false;
        
        function startRiverFishing() {
            if (riverActive) return;

            // Cancel any stale hide-timeout from the previous cast
            if (riverCleanupTimeout) { clearTimeout(riverCleanupTimeout); riverCleanupTimeout = null; }

            const bar       = document.getElementById('fishing-bar-river');
            const container = document.getElementById('fishing-bar-container-river');
            const target    = document.getElementById('fishing-target-river');
            const timer     = document.getElementById('fishing-timer-river');
            
            riverActive  = true;
            riverBarPos  = 0;

            // Target only between 40–100% of bar (bar is 280px, zone is 50px wide)
            riverTargetPos = Math.random() * 118 + 112;
            
            target.style.left       = riverTargetPos + 'px';
            target.style.visibility = 'visible';
            bar.style.visibility    = 'visible';
            bar.style.left          = '0px';
            timer.textContent       = 'Release in the zone!';

            // Start gentle wave sway on the bar container
            if (container) container.style.animation = 'pondWave 1.8s ease-in-out infinite';
            
            // 280px over ~10s = 0.84px per 30ms tick
            riverFishingInterval = setInterval(() => {
                riverBarPos += 0.84;
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
            
            const barLeft    = parseFloat(bar.style.left) || 0;
            const targetLeft  = riverTargetPos;
            const targetRight = targetLeft + 50;
            
            const hit = barLeft >= targetLeft && barLeft <= targetRight;
            endRiverFishing(hit);
        }
        
        function endRiverFishing(success) {
            riverActive = false;
            clearInterval(riverFishingInterval);
            
            const bar       = document.getElementById('fishing-bar-river');
            const container = document.getElementById('fishing-bar-container-river');
            const timer     = document.getElementById('fishing-timer-river');
            
            if (success) {
                // Jump animation on the bar container
                if (container) {
                    container.style.animation = 'none';
                    void container.offsetWidth;
                    container.style.animation = 'pondBite 0.6s cubic-bezier(0.2,1.4,0.4,1) forwards';
                }
                // Burst river specks on catch
                document.querySelectorAll('.rspeck').forEach(s => {
                    s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                    s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                });
                // Splash + bobber sound
                const riverSplash = document.getElementById('river-splash');
                if (riverSplash) {
                    riverSplash.style.display = 'block';
                    riverSplash.style.animation = 'none';
                    void riverSplash.offsetWidth;
                    riverSplash.style.animation = 'splash 0.6s ease-out';
                    const bobberSound = document.getElementById('bobber-sound');
                    if (bobberSound) { bobberSound.currentTime = 0; bobberSound.volume = 0.5; bobberSound.play().catch(() => {}); }
                    setTimeout(() => { if (riverSplash) riverSplash.style.display = 'none'; }, 600);
                }
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
                        caughtItem = 'fish8';
                    } else if (fishRand < rareCut) {
                        caughtItem = 'fish7';
                    } else if (fishRand < uncomCut) {
                        caughtItem = 'fish6';
                    } else {
                        caughtItem = 'fish5';
                    }
                    catchMsg = `🎣 Caught ${ITEM_DATA[caughtItem].name}!`;
                    addSkillXP('fishing', 10);
                }

                timer.textContent = catchMsg;
                if (/^fish\d+$/.test(caughtItem)) addFish(caughtItem); else addItem(caughtItem, 1);

                if (Math.random() < 0.05) {
                    addItem('basket', 1);
                    notify('🧺 Found a Basket!');
                }
                if (!gs.frogs.frog_blue && Math.random() < 0.0001) {
                    addItem('frog_blue', 1);
                    notify('🔵🐸 A Blue Frog leapt into your basket!', 'achievement');
                }
            } else {
                timer.textContent = '❌ Missed!';
            }
            
            riverCleanupTimeout = setTimeout(() => {
                riverCleanupTimeout = null;
                riverBarPos = 0;
                bar.style.left = '0px';
                bar.style.visibility = 'hidden';
                if (container) container.style.animation = 'none';
                const tgt = document.getElementById('fishing-target-river');
                if (tgt) tgt.style.visibility = 'hidden';
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
                if (/^fish\d+$/.test(caughtItem)) addFish(caughtItem); else addItem(caughtItem, 1);

                
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
        
        

        // ===== LAKE FISHING: Hold-to-Reel Minigame =====
        // GREEN ZONE moves organically — velocity, momentum, random nudges, occasional darts.
        // PILL is player-controlled: hold = reel to center, release = drift to edge.
        // Easier: wider zone (90px), faster reel, shorter hold times.

        const LAKE_BAR_W    = 280;
        const LAKE_TARGET_W = 90;
        const LAKE_PILL_W   = 36;
        const LAKE_CENTER   = (LAKE_BAR_W - LAKE_PILL_W) / 2;

        const LAKE_FISH = [
            { name: 'Perch',    baseSpeed: 1.2, driftSpeed: 0.6, reelSpeed: 3.0, holdMs: 700,  mood: '😴 Lazy Perch...',    item: 'fish1' },
            { name: 'Bass',     baseSpeed: 2.0, driftSpeed: 1.0, reelSpeed: 2.8, holdMs: 1000, mood: '🐟 Steady Bass',      item: 'fish2' },
            { name: 'Trout',    baseSpeed: 3.2, driftSpeed: 1.6, reelSpeed: 2.5, holdMs: 1400, mood: '💨 Darting Trout!',   item: 'fish3' },
            { name: 'Pike',     baseSpeed: 5.0, driftSpeed: 2.5, reelSpeed: 2.2, holdMs: 1800, mood: '⚡ Wild Pike!!',      item: 'fish4' },
            { name: 'Sturgeon', baseSpeed: 0.8, driftSpeed: 0.4, reelSpeed: 2.0, holdMs: 2400, mood: '🦕 Ancient Sturgeon', item: 'fish8' },
        ];

        let lakeActive   = false;
        let lakePillPos  = LAKE_CENTER;
        let lakeZonePos  = 80;
        let lakeZoneVel  = 0;
        let lakeZoneAcc  = 0;
        let lakeNudgeT   = 0;
        let lakeDartT    = 0;
        let lakeHolding  = false;
        let lakeHoldMs   = 0;
        let lakeInterval = null;

        function lakeOrganicTick(fish) {
            const maxPos = LAKE_BAR_W - LAKE_TARGET_W;

            lakeNudgeT--;
            if (lakeNudgeT <= 0) {
                lakeZoneAcc = (Math.random() - 0.5) * fish.baseSpeed * 0.8;
                lakeNudgeT  = 20 + Math.floor(Math.random() * 30);
            }

            lakeDartT--;
            if (lakeDartT <= 0) {
                lakeZoneVel += (lakeZoneVel >= 0 ? 1 : -1) * fish.baseSpeed * 2.5;
                lakeDartT = 60 + Math.floor(Math.random() * 80);
            }

            lakeZoneVel += lakeZoneAcc;
            const maxV = fish.baseSpeed * 2.8;
            lakeZoneVel = Math.max(-maxV, Math.min(maxV, lakeZoneVel));
            lakeZoneVel *= 0.96;
            lakeZonePos += lakeZoneVel;

            if (lakeZonePos <= 0) {
                lakeZonePos = 0;
                lakeZoneVel = Math.abs(lakeZoneVel) * (0.6 + Math.random() * 0.3);
                lakeNudgeT  = 5;
            }
            if (lakeZonePos >= maxPos) {
                lakeZonePos = maxPos;
                lakeZoneVel = -Math.abs(lakeZoneVel) * (0.6 + Math.random() * 0.3);
                lakeNudgeT  = 5;
            }
        }

        function startLakeFishing() {
            if (lakeActive) return;

            const timer   = document.getElementById('fishing-timer-lake');
            const mood    = document.getElementById('lake-fish-mood');
            const holdBar = document.getElementById('lake-hold-bar');

            const fishLv  = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;
            const weights = [40, 30, 15, 8, 7];
            const lvShift = Math.min(Math.floor((fishLv - 1) / 5), 4);
            const fish    = LAKE_FISH[pickWeighted(weights, lvShift)];

            lakePillPos  = Math.random() < 0.5 ? 0 : LAKE_BAR_W - LAKE_PILL_W;
            lakeZonePos  = 40 + Math.random() * (LAKE_BAR_W - LAKE_TARGET_W - 80);
            lakeZoneVel  = (Math.random() < 0.5 ? 1 : -1) * fish.baseSpeed;
            lakeZoneAcc  = 0;
            lakeNudgeT   = 15;
            lakeDartT    = 60;
            lakeHoldMs   = 0;
            lakeHolding  = true;
            lakeActive   = { fish };

            if (timer)   timer.textContent = 'Hold to reel in — keep pill in green!';
            if (mood)    mood.textContent  = fish.mood;
            if (holdBar) holdBar.style.width = '0%';

            document.querySelectorAll('.lspeck').forEach(s => {
                s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
            });

            const TICK = 30;
            lakeInterval = setInterval(() => {
                const pill   = document.getElementById('fishing-pill-lake');
                const target = document.getElementById('fishing-target-lake');
                if (!pill || !target) return;

                if (lakeHolding) {
                    const diff = LAKE_CENTER - lakePillPos;
                    lakePillPos += Math.sign(diff) * Math.min(fish.reelSpeed, Math.abs(diff));
                } else {
                    const toLeft  = lakePillPos;
                    const toRight = LAKE_BAR_W - LAKE_PILL_W - lakePillPos;
                    lakePillPos  += (toLeft <= toRight ? -1 : 1) * fish.driftSpeed;
                }
                lakePillPos = Math.max(0, Math.min(LAKE_BAR_W - LAKE_PILL_W, lakePillPos));

                lakeOrganicTick(fish);

                pill.style.left   = lakePillPos + 'px';
                target.style.left = lakeZonePos + 'px';

                const pillCenter = lakePillPos + LAKE_PILL_W / 2;
                const inZone = pillCenter >= lakeZonePos && pillCenter <= lakeZonePos + LAKE_TARGET_W;
                pill.classList.toggle('in-zone', inZone);

                if (lakeHolding && inZone) {
                    lakeHoldMs += TICK;
                    const pct = Math.min(100, (lakeHoldMs / fish.holdMs) * 100);
                    if (holdBar) holdBar.style.width = pct + '%';
                    if (lakeHoldMs >= fish.holdMs) {
                        clearInterval(lakeInterval);
                        lakeInterval = null;
                        lakeActive   = false;
                        lakeHolding  = false;
                        endLakeCatch(fish, true);
                    }
                }
            }, TICK);
        }

        function holdLakeButton() { if (lakeActive) lakeHolding = true; }
        function releaseLakeButton() { lakeHolding = false; }

        function cancelLakeFishing() {
            clearInterval(lakeInterval);
            lakeInterval = null;
            lakeActive   = false;
            lakeHolding  = false;
            lakeHoldMs   = 0;
            const holdBar = document.getElementById('lake-hold-bar');
            const pill    = document.getElementById('fishing-pill-lake');
            if (holdBar) holdBar.style.width = '0%';
            if (pill)    pill.classList.remove('in-zone');
        }

        function endLakeCatch(fish, success) {
            const timer   = document.getElementById('fishing-timer-lake');
            const mood    = document.getElementById('lake-fish-mood');
            const holdBar = document.getElementById('lake-hold-bar');
            const pill    = document.getElementById('fishing-pill-lake');

            if (success) {
                if (holdBar) holdBar.style.width = '100%';
                if (pill)    pill.classList.add('in-zone');
                document.querySelectorAll('.lspeck').forEach(s => {
                    s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                    s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                });
                const fishLv  = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;
                const lvBonus = Math.min((fishLv - 1) * 0.015, 0.30);
                const trashChance = Math.max(0.15 - lvBonus, 0.02);
                let caughtItem, catchMsg;
                if (Math.random() < trashChance) {
                    caughtItem = 'seaweed'; catchMsg = '🌿 Pulled up Seaweed...';
                    addSkillXP('fishing', 1);
                } else {
                    const r = Math.random();
                    const epicCut  = Math.min(0.05 + lvBonus * 0.6, 0.22);
                    const rareCut  = Math.min(0.14 + lvBonus,       0.40);
                    const uncomCut = Math.min(0.32 + lvBonus * 0.8, 0.55);
                    caughtItem = r < epicCut ? 'fish8' : r < rareCut ? 'fish7' : r < uncomCut ? 'fish6' : fish.item;
                    catchMsg = '🎣 Caught ' + ITEM_DATA[caughtItem].name + '!';
                    addSkillXP('fishing', 12);
                }
                if (timer) timer.textContent = catchMsg;
                if (mood)  mood.textContent  = '';
                if (/^fish\d+$/.test(caughtItem)) addFish(caughtItem); else addItem(caughtItem, 1);
                if (Math.random() < 0.05) { addItem('basket', 1); notify('🧺 Found a Basket!'); }
                if (!gs.frogs.frog_blue && Math.random() < 0.0001) {
                    addItem('frog_blue', 1);
                    notify('🔵🐸 A Blue Frog leapt into your basket!', 'achievement');
                }
            } else {
                if (timer) timer.textContent = '❌ Fish got away!';
                if (mood)  mood.textContent  = '';
            }
            setTimeout(() => {
                if (timer)   timer.textContent = '';
                if (holdBar) holdBar.style.width = '0%';
                if (pill)    pill.classList.remove('in-zone');
            }, 1800);
        }

        function pickWeighted(weights, shift) {
            const shifted = weights.map((w, i) => Math.max(1, w - shift * i * 3 + shift * (weights.length - 1 - i) * 2));
            const total = shifted.reduce((a, b) => a + b, 0);
            let r = Math.random() * total;
            for (let i = 0; i < shifted.length; i++) { r -= shifted[i]; if (r <= 0) return i; }
            return shifted.length - 1;
        }

        // ===== SEA FISHING: Press & Hold to Lower Lines =====
        // 4 vertical bars. GREEN ZONES move organically per-bar (velocity + nudges + darts).
        // ONE shared red line falls on hold, stops on release. Hit bottom = fail.

        const SEA_BAR_H    = 140;
        const SEA_LINE_H   = 4;
        const SEA_TARGET_H = 36;
        const SEA_FALL_SPEED = 1.5;

        const SEA_FISH_POOL = [
            { emoji: '🦐', name: 'Shrimp',    item: 'fish6', swimSpeed: 0.5 },
            { emoji: '🦞', name: 'Lobster',   item: 'fish5', swimSpeed: 0.7 },
            { emoji: '🐟', name: 'Sardine',   item: 'fish1', swimSpeed: 1.0 },
            { emoji: '🐠', name: 'Mackerel',  item: 'fish2', swimSpeed: 1.4 },
            { emoji: '🦀', name: 'Crab',      item: 'fish7', swimSpeed: 0.9 },
            { emoji: '🐡', name: 'Tuna',      item: 'fish3', swimSpeed: 1.8 },
            { emoji: '🎣', name: 'Swordfish', item: 'fish4', swimSpeed: 2.4 },
            { emoji: '🦈', name: 'Shark',     item: 'fish8', swimSpeed: 3.0 },
        ];

        let seaActive   = false;
        let seaHolding  = false;
        let seaInterval = null;
        let seaLineY    = 0;
        let seaBars     = []; // { fish, zonePos, zoneVel, nudgeT, dartT }

        function seaOrganicTick(b) {
            const maxPos = SEA_BAR_H - SEA_TARGET_H;
            const spd    = b.fish.swimSpeed;

            b.nudgeT--;
            if (b.nudgeT <= 0) {
                b.zoneVel += (Math.random() - 0.5) * spd * 1.2;
                b.nudgeT   = 15 + Math.floor(Math.random() * 35);
            }
            b.dartT--;
            if (b.dartT <= 0) {
                b.zoneVel += (b.zoneVel >= 0 ? 1 : -1) * spd * 3;
                b.dartT    = 50 + Math.floor(Math.random() * 70);
            }

            const maxV = spd * 3;
            b.zoneVel = Math.max(-maxV, Math.min(maxV, b.zoneVel));
            b.zoneVel *= 0.95;
            b.zonePos += b.zoneVel;

            if (b.zonePos <= 0) {
                b.zonePos = 0;
                b.zoneVel = Math.abs(b.zoneVel) * (0.5 + Math.random() * 0.4);
                b.nudgeT  = 5;
            }
            if (b.zonePos >= maxPos) {
                b.zonePos = maxPos;
                b.zoneVel = -Math.abs(b.zoneVel) * (0.5 + Math.random() * 0.4);
                b.nudgeT  = 5;
            }
        }

        function startSeaFishing() {
            if (seaActive) return;

            const timer      = document.getElementById('fishing-timer-sea');
            const scoreLabel = document.getElementById('sea-score-label');
            const fishLv     = (gs.skills && gs.skills.fishing) ? gs.skills.fishing.level : 1;

            const maxIdx = Math.min(Math.floor(fishLv / 2) + 2, SEA_FISH_POOL.length - 1);
            seaBars = [0, 1, 2, 3].map(() => {
                const pool = SEA_FISH_POOL.slice(0, maxIdx + 1);
                const fish = pool[Math.floor(Math.random() * pool.length)];
                const zonePos = 20 + Math.random() * (SEA_BAR_H - SEA_TARGET_H - 30);
                return {
                    fish,
                    zonePos,
                    zoneVel: (Math.random() < 0.5 ? 1 : -1) * fish.swimSpeed,
                    nudgeT:  10 + Math.floor(Math.random() * 20),
                    dartT:   40 + Math.floor(Math.random() * 60),
                };
            });

            seaLineY   = 0;
            seaActive  = true;
            seaHolding = true;

            seaBars.forEach((b, i) => {
                const label     = document.getElementById('sea-label-' + i);
                const result    = document.getElementById('sea-result-' + i);
                const target    = document.getElementById('sea-target-' + i);
                const marker    = document.getElementById('sea-marker-' + i);
                const container = document.getElementById('sea-bar-' + i);
                if (label)     label.textContent  = b.fish.emoji;
                if (result)    result.textContent = '';
                if (target)  { target.style.top = b.zonePos + 'px'; target.style.height = SEA_TARGET_H + 'px'; }
                if (marker)    marker.style.top  = '0px';
                if (container) container.style.background = 'rgba(255,255,255,0.55)';
            });

            if (timer)      timer.textContent = 'Hold to lower — release when in green!';
            if (scoreLabel) scoreLabel.textContent = '';

            const TICK = 30;
            seaInterval = setInterval(() => {
                // Zones always move organically
                seaBars.forEach((b, i) => {
                    seaOrganicTick(b);
                    const target = document.getElementById('sea-target-' + i);
                    if (target) target.style.top = b.zonePos + 'px';
                });

                // Marker only falls while holding
                if (!seaHolding) return;

                seaLineY += SEA_FALL_SPEED;

                seaBars.forEach((b, i) => {
                    const marker = document.getElementById('sea-marker-' + i);
                    if (marker) marker.style.top = seaLineY + 'px';
                });

                if (seaLineY >= SEA_BAR_H - SEA_LINE_H) {
                    seaLineY   = SEA_BAR_H - SEA_LINE_H;
                    seaHolding = false;
                    clearInterval(seaInterval);
                    seaInterval = null;
                    seaActive   = false;
                    const seaGame = document.getElementById('fishing-game-sea');
                    if (seaGame) seaGame.classList.remove('sea-active');
                    scoreSeaFishing(true);
                }
            }, TICK);
        }

        function releaseSeaButton() {
            if (!seaActive) return;
            seaHolding = false;
            clearInterval(seaInterval);
            seaInterval = null;
            seaActive   = false;
            const seaGame = document.getElementById('fishing-game-sea');
            if (seaGame) seaGame.classList.remove('sea-active');
            scoreSeaFishing(false);
        }

        function scoreSeaFishing(forceFail) {
            const timer      = document.getElementById('fishing-timer-sea');
            const scoreLabel = document.getElementById('sea-score-label');
            let hits = 0;
            const caughtItems = [];

            seaBars.forEach((b, i) => {
                const result    = document.getElementById('sea-result-' + i);
                const container = document.getElementById('sea-bar-' + i);
                const lineBottom = seaLineY + SEA_LINE_H;
                const inZone = !forceFail && seaLineY >= b.zonePos && lineBottom <= b.zonePos + SEA_TARGET_H;
                if (inZone) {
                    hits++;
                    caughtItems.push(b.fish.item);
                    if (result)    result.textContent = '✅';
                    if (container) container.style.background = 'rgba(74,222,128,0.25)';
                } else {
                    if (result)    result.textContent = forceFail ? '💀' : '❌';
                    if (container) container.style.background = forceFail ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.1)';
                }
            });

            if (forceFail) {
                if (timer)      timer.textContent = '💀 Too slow!';
                if (scoreLabel) scoreLabel.textContent = '';
            } else if (hits > 0) {
                caughtItems.forEach(itemId => { if (/^fish\d+$/.test(itemId)) addFish(itemId); else addItem(itemId, 1); });
                addSkillXP('fishing', hits * 10);
                const names = [...new Set(caughtItems.map(id => ITEM_DATA[id]?.name || id))].join(', ');
                if (timer)      timer.textContent = '🎣 Caught ' + hits + '/4!' + (hits === 4 ? ' 🔥 Perfect!' : '');
                if (scoreLabel) scoreLabel.textContent = names;
                if (Math.random() < 0.04 * hits) { addItem('basket', 1); notify('🧺 Found a Basket!'); }
                if (!gs.frogs.frog_blue && Math.random() < 0.0001) {
                    addItem('frog_blue', 1);
                    notify('🔵🐸 A Blue Frog leapt from the sea!', 'achievement');
                }
            } else {
                if (timer)      timer.textContent = '❌ Nothing caught!';
                if (scoreLabel) scoreLabel.textContent = '';
            }

            setTimeout(() => {
                if (timer)      timer.textContent = '';
                if (scoreLabel) scoreLabel.textContent = '';
                [0,1,2,3].forEach(i => {
                    const result    = document.getElementById('sea-result-' + i);
                    const container = document.getElementById('sea-bar-' + i);
                    const marker    = document.getElementById('sea-marker-' + i);
                    const label     = document.getElementById('sea-label-' + i);
                    const target    = document.getElementById('sea-target-' + i);
                    if (result)    result.textContent = '';
                    if (label)     label.textContent  = '';
                    if (container) container.style.background = 'rgba(255,255,255,0.55)';
                    if (marker)    marker.style.top = '0px';
                    if (target)    target.style.top = ((SEA_BAR_H - SEA_TARGET_H) / 2) + 'px';
                });
            }, 2000);
        }
