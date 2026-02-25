        // ===== GARDEN PLOT SYSTEM (WATER BUTTON LIKE SHACK) =====
        let gardenSlots = [null, null, null, null, null, null, null, null, null]; // 9 slots for seeds
        let gardenGrowing = false;
        let gardenStartTime = null;
        let gardenReadyTime = null;
        let gardenUpdateInterval = null;
        let harvestHoldTimer = null;
        let harvestHoldStartTime = 0;
        let harvestHoldProgress = 0;
        let harvestHoldSlotIndex = -1; // Track which slot is being harvested
        
        // Returns how many slots are unlocked based on farming level
        function getUnlockedSlots() {
            const lv = gs.skills && gs.skills.farming ? gs.skills.farming.level : 1;
            if (lv >= 50) return 6;
            if (lv >= 40) return 5;
            if (lv >= 30) return 4;
            if (lv >= 20) return 3;
            if (lv >= 10) return 3;
            if (lv >= 5)  return 2;
            return 1;
        }
        
        // Returns required farming level for a slot index
        function slotRequiredLevel(i) {
            return [0, 5, 10, 20, 30, 40, 50][i] || 0;
        }
        
        function initGardenPlots() {
            console.log('initGardenPlots called');
            
            // Only reset if not already set in game state
            if (!gs.gardenSlots) {
                gs.gardenSlots = [null, null, null, null, null, null, null, null, null];
            }
            if (gs.gardenGrowing === undefined) {
                gs.gardenGrowing = false;
            }
            
            // Use game state variables
            gardenSlots = gs.gardenSlots;
            gardenGrowing = gs.gardenGrowing;
            gardenStartTime = gs.gardenStartTime;
            gardenReadyTime = gs.gardenReadyTime;
            
            console.log('Garden state loaded:', {
                slots: gardenSlots,
                growing: gardenGrowing,
                readyTime: gardenReadyTime
            });
            
            // Slots handled by drag-drop (lockItemInGardenSlot)
            // Water button handler
            const waterBtn = document.getElementById('water-garden-btn');
            if (waterBtn) {
                waterBtn.onclick = waterGarden;
                console.log('Water button handler attached');
            } else {
                console.error('Water button not found!');
            }
            
            updateGardenDisplay();
        }
        
        function selectGardenSeed(slotIndex, itemId) {
            console.log('selectGardenSeed called - slotIndex:', slotIndex, 'itemId:', itemId);
            
            // Count how many of this seed type are already placed in slots
            let alreadyPlaced = 0;
            for (let i = 0; i < 9; i++) {
                if (gardenSlots[i] === itemId) {
                    alreadyPlaced++;
                }
            }
            
            // Count how many of this seed type are in inventory
            let inInventory = 0;
            for (const key in gs.inventory) {
                if (gs.inventory[key] === itemId) {
                    inInventory++;
                }
            }
            
            console.log(`Seeds check: ${alreadyPlaced} already placed, ${inInventory} in inventory`);
            
            // Check if we have enough seeds
            if (alreadyPlaced >= inInventory) {
                notify('❌ Not enough seeds in inventory!', 'warning');
                closeGardenSeedMenu();
                return;
            }
            
            // Place seed in slot (don't remove from inventory yet)
            gardenSlots[slotIndex] = itemId;
            gs.gardenSlots[slotIndex] = itemId; // Save to game state
            console.log('gardenSlots after select:', gardenSlots);
            save(); // Save immediately
            updateGardenDisplay();
            closeGardenSeedMenu();
        }
        
        
        function waterGarden() {
            console.log('waterGarden called');
            console.log('Current gardenSlots:', gardenSlots);
            console.log('Current inventory:', gs.inventory);
            
            // Check if any seeds are placed
            const hasSeeds = gardenSlots.some(slot => slot !== null);
            if (!hasSeeds) {
                notify('❌ Place some seeds first!', 'warning');
                return;
            }
            
            // Check if already growing
            if (gardenGrowing) {
                notify('❌ Plants are already growing!', 'warning');
                return;
            }
            
            // Remove seeds from inventory - count how many we need to remove
            const seedsToRemove = {};
            for (let i = 0; i < 9; i++) {
                if (gardenSlots[i]) {
                    seedsToRemove[gardenSlots[i]] = (seedsToRemove[gardenSlots[i]] || 0) + 1;
                }
            }
            
            console.log('Seeds to remove:', seedsToRemove);
            
            // Remove the required amount of each seed type
            for (const seedType in seedsToRemove) {
                let countToRemove = seedsToRemove[seedType];
                for (const key in gs.inventory) {
                    if (countToRemove > 0 && gs.inventory[key] === seedType) {
                        console.log('Removing seed:', key, gs.inventory[key]);
                        delete gs.inventory[key];
                        countToRemove--;
                    }
                }
            }
            
            console.log('Inventory after removal:', gs.inventory);
            
            // Start growing
            gardenGrowing = true;
            gardenStartTime = Date.now();
            gardenReadyTime = gardenStartTime + 60000; // 1 minute
            
            // Save to game state
            gs.gardenGrowing = true;
            gs.gardenStartTime = gardenStartTime;
            gs.gardenReadyTime = gardenReadyTime;
            
            const startBar = document.getElementById('garden-progress-bar');
            const startLabel = document.getElementById('garden-timer-display');
            if (startBar) {
                startBar.style.transition = 'width 0.6s ease-out';
                startBar.style.background = 'linear-gradient(90deg,#38bdf8,#0ea5e9,#0284c7)';
                startBar.style.width = '100%';
                if (startLabel) startLabel.textContent = 'Watering...';
                setTimeout(() => {
                    if (startBar) startBar.style.background = 'linear-gradient(90deg,#4ade80,#16a34a)';
                    if (startLabel) startLabel.textContent = 'Growing...';
                }, 650);
            }
            save();
            updateInventoryCounter();
            updateGardenDisplay();
            notify('💧 Garden watered! Plants growing...');
            startGardenUpdateInterval();
        }
        
        function startHarvestHold(slotIndex) {
            if (harvestHoldTimer) return; // Already holding
            if (!gardenSlots[slotIndex]) return; // No crop in this slot
            
            // Check if inventory has space for 3 carrots
            const currentInventoryCount = Object.keys(gs.inventory).length;
            
            const seedId = gardenSlots[slotIndex];
            const seedData = ITEM_DATA[seedId];
            const harvestCount = (seedData && seedData.harvestCount) || 3;
            if (currentInventoryCount + harvestCount > gs.maxInventory) {
                notify(`❌ Inventory full! Need space for ${harvestCount} items.`, 'warning');
                return;
            }
            
            console.log('Starting harvest hold for slot:', slotIndex, '- Inventory:', currentInventoryCount, '/', gs.maxInventory);
            harvestHoldSlotIndex = slotIndex;
            harvestHoldStartTime = Date.now();
            harvestHoldProgress = 0;
            
            // Update progress every 100ms
            harvestHoldTimer = setInterval(() => {
                const elapsed = Date.now() - harvestHoldStartTime;
                harvestHoldProgress = Math.min(elapsed / 5000, 1); // 5 seconds = 100%
                
                updateHarvestProgressDisplay();
                updateSlotHarvestVisual(slotIndex);
                
                if (harvestHoldProgress >= 1) {
                    completeHarvest(slotIndex);
                }
            }, 100);
        }
        
        function stopHarvestHold() {
            if (harvestHoldTimer) {
                console.log('Stopping harvest hold');
                clearInterval(harvestHoldTimer);
                harvestHoldTimer = null;
                harvestHoldProgress = 0;
                harvestHoldSlotIndex = -1;
                updateHarvestProgressDisplay();
                updateGardenDisplay(); // Reset slot visuals
            }
        }
        
        function updateHarvestProgressDisplay() {
            const timerDisplay = document.getElementById('garden-timer-display');
            const bar = document.getElementById('garden-progress-bar');
            
            if (harvestHoldProgress > 0 && harvestHoldProgress < 1) {
                if (timerDisplay) timerDisplay.textContent = 'Harvesting...';
                if (bar) { bar.style.width = (harvestHoldProgress * 100) + '%'; bar.style.background = 'linear-gradient(90deg,#d97706,#b45309)'; bar.style.transition = 'none'; }
            } else if (harvestHoldProgress >= 1) {
                if (timerDisplay) timerDisplay.textContent = 'Harvested!';
                if (bar) { bar.style.width = '100%'; bar.style.background = 'linear-gradient(90deg,#4ade80,#16a34a)'; bar.style.transition = 'none'; }
            } else {
                const remaining = gardenSlots.filter(s => s !== null).length;
                if (remaining > 0) {
                    if (bar) { bar.style.width = '100%'; bar.style.background = 'linear-gradient(90deg,#4ade80,#16a34a)'; bar.style.transition = 'none'; }
                    if (timerDisplay) timerDisplay.textContent = 'Ready to harvest.';
                } else {
                    if (bar) { bar.style.width = '0%'; bar.style.transition = 'none'; }
                    if (timerDisplay) timerDisplay.textContent = 'Plant seeds.';
                }
            }
        }
        
        function updateSlotHarvestVisual(slotIndex) {
            const slot = document.getElementById(`garden-plot-slot-${slotIndex}`);
            if (!slot) return;
            
            // Pulse effect based on progress
            const scale = 1 + (Math.sin(harvestHoldProgress * Math.PI * 4) * 0.1);
            slot.style.transform = `scale(${scale})`;
            
            // Change background based on progress
            const greenIntensity = Math.floor(232 + (harvestHoldProgress * 23)); // 232 to 255
            slot.style.background = `rgb(${greenIntensity - 80}, ${greenIntensity}, ${greenIntensity - 80})`;
        }
        
        function completeHarvest(slotIndex) {
            stopHarvestHold();
            harvestSingleSlot(slotIndex);
        }
        
        function harvestSingleSlot(slotIndex) {
            if (!gardenSlots[slotIndex]) return;
            
            console.log('Harvesting slot:', slotIndex);
            
            // Double-check inventory space (safety check)
            const currentInventoryCount = Object.keys(gs.inventory).length;
            
            const sData = ITEM_DATA[gardenSlots[slotIndex]];
            const hCount = (sData && sData.harvestCount) || 3;
            const hItem  = (sData && sData.harvestItem)  || 'carrot';
            if (currentInventoryCount + hCount > gs.maxInventory) {
                notify('❌ Inventory full! Cannot harvest.', 'warning');
                return;
            }
            addItem(hItem, hCount);
            addSkillXP('farming', 15);
            
            // 0.01% chance to find Green Frog (if not already collected)
            if (!gs.frogs.frog_green && Math.random() < 0.0001) {
                addItem('frog_green', 1);
                notify('🟢🐸 A Green Frog was hiding under the crops!', 'achievement');
            }
            
            // Clear this slot
            gardenSlots[slotIndex] = null;
            gs.gardenSlots[slotIndex] = null;
            
            // Clear locked body for this slot
            if (gardenLockedBodies[slotIndex]) {
                // Remove from physics world
                if (basketEngine) {
                    Matter.World.remove(basketEngine.world, gardenLockedBodies[slotIndex]);
                }
                gardenLockedBodies[slotIndex] = null;
            }
            
            // Fully reset slot visual immediately
            const harvestedSlot = document.getElementById(`garden-plot-slot-${slotIndex}`);
            if (harvestedSlot) {
                harvestedSlot.innerHTML = `<span id="garden-plot-icon-${slotIndex}">+</span>`;
                harvestedSlot.style.background = '#fff';
                harvestedSlot.style.border = '2px dashed #8bc34a';
                harvestedSlot.style.cursor = 'default';
                harvestedSlot.style.pointerEvents = 'none'; // Disable to allow drag-through
                harvestedSlot.style.zIndex = ''; // Reset z-index
                harvestedSlot.style.transform = 'scale(1)';
                harvestedSlot.style.boxShadow = '';
                harvestedSlot.onmousedown = null;
                harvestedSlot.onmouseup = null;
                harvestedSlot.onmouseleave = null;
                harvestedSlot.ontouchstart = null;
                harvestedSlot.ontouchend = null;
            }
            
            // Check if all slots are harvested
            const remaining = gardenSlots.filter(s => s !== null).length;
            console.log('Slots remaining:', remaining);
            
            if (remaining === 0) {
                // All harvested - reset garden
                console.log('All slots harvested - resetting garden');
                gardenGrowing = false;
                gardenStartTime = null;
                gardenReadyTime = null;
                gs.gardenGrowing = false;
                gs.gardenStartTime = null;
                gs.gardenReadyTime = null;
                stopGardenUpdateInterval();
                const doneBar = document.getElementById('garden-progress-bar');
                const doneLabel = document.getElementById('garden-timer-display');
                if (doneBar) { doneBar.style.width = '0%'; doneBar.style.transition = 'none'; }
                if (doneLabel) doneLabel.textContent = 'Plant seeds.';

            }
            
            save();
            updateGardenDisplay();
            
            notify(`✅ Harvested! +15 Farming XP`);
        }
        
        // OLD harvestGarden - now using harvestSingleSlot per slot
        /*
        function harvestGarden() {
            if (!gardenGrowing || Date.now() < gardenReadyTime) return;
            
            // Count how many seeds were planted
            let harvestedCount = 0;
            for (let i = 0; i < 9; i++) {
                if (gardenSlots[i]) {
                    // Give 3 carrots per seed
                    addItem('carrot', 3);
                    harvestedCount++;
                }
            }
            
            // Reset garden
            gardenSlots = [null, null, null, null, null, null, null, null, null];
            gardenGrowing = false;
            gardenStartTime = null;
            gardenReadyTime = null;
            const resetBar = document.getElementById('garden-progress-bar');
            const resetLabel = document.getElementById('garden-timer-display');
            if (resetBar) { resetBar.style.width = '0%'; resetBar.style.transition = 'none'; }
            if (resetLabel) resetLabel.textContent = 'Plant seeds.';
            
            // Reset harvest hold state
            stopHarvestHold();
            harvestHoldProgress = 0;
            
            // Save to game state
            gs.gardenSlots = [null, null, null, null, null, null, null, null, null];
            gs.gardenGrowing = false;
            gs.gardenStartTime = null;
            gs.gardenReadyTime = null;
            
            // Give XP
            addSkillXP('farming', harvestedCount * 15);
            
            save();
            updateGardenDisplay();
            stopGardenUpdateInterval();
            
            const result = document.getElementById('garden-result');
            if (result) {
                result.textContent = `🎉 Harvested ${harvestedCount * 3} Carrots!`;
                result.style.color = '#4caf50';
                setTimeout(() => result.textContent = '', 3000);
            }
            
            notify(`🥕 Harvested ${harvestedCount * 3} Carrots! +${harvestedCount * 15} Farming XP`);
        }
        */
        
        function updateGardenDisplay() {
            console.log('updateGardenDisplay called - gardenGrowing:', gardenGrowing, 'gardenSlots:', gardenSlots);
            const unlockedCount = getUnlockedSlots();
            // Update all 6 slots
            for (let i = 0; i < 6; i++) {
                const icon = document.getElementById(`garden-plot-icon-${i}`);
                const slot = document.getElementById(`garden-plot-slot-${i}`);
                if (!slot) continue;
                
                const locked = i >= unlockedCount;
                
                if (locked) {
                    // Locked slot — show padlock
                    const reqLv = slotRequiredLevel(i);
                    slot.innerHTML = `<span id="garden-plot-icon-${i}" style="display:flex;flex-direction:column;align-items:center;gap:1px;"><span style="font-size:22px;">🔒</span><span style="font-size:7px;font-weight:bold;color:#9ca3af;font-family:'Righteous',sans-serif;">Lv ${reqLv}</span></span>`;
                    slot.style.background = 'rgba(0,0,0,0.15)';
                    slot.style.border = '2px dashed #6b7280';
                    slot.style.cursor = 'not-allowed';
                    slot.style.pointerEvents = 'none';
                    slot.style.opacity = '0.6';
                    slot.onmousedown = null; slot.onmouseup = null;
                    slot.ontouchstart = null; slot.ontouchend = null;
                    continue;
                }
                
                // Unlocked slot
                slot.style.opacity = '1';
                if (icon && !slot.innerHTML.includes('🔒')) {} // preserve icon ref below
                const iconEl = document.getElementById(`garden-plot-icon-${i}`);
                
                if (gardenGrowing) {
                    // Growing state - show seedling
                    if (gardenSlots[i]) {
                        if (iconEl) iconEl.textContent = '🌱';
                        slot.style.background = '#f1f8e9';
                        slot.style.borderColor = '#8bc34a';
                        slot.style.border = '2px dashed #8bc34a';
                    } else {
                        if (iconEl) iconEl.textContent = '';
                        slot.style.background = '#f5f5f5';
                        slot.style.borderColor = '#ccc';
                        slot.style.border = '2px dashed #ccc';
                    }
                    slot.style.cursor = 'not-allowed';
                    slot.style.pointerEvents = 'none';
                    slot.onmousedown = null;
                } else {
                    // Not growing - show selected or empty
                    if (gardenSlots[i]) {
                        if (iconEl) iconEl.textContent = '🌱';
                        slot.style.background = '#fef3c7';
                        slot.style.border = '2px dashed #f59e0b';
                    } else {
                        if (iconEl) iconEl.textContent = '+';
                        slot.style.background = '#fff';
                        slot.style.border = '2px dashed #8bc34a';
                    }
                    slot.style.cursor = 'default';
                    slot.style.pointerEvents = 'none';
                    slot.onmousedown = null;
                }
            }
            
            // Update timer display
            const timerDisplay = document.getElementById('garden-timer-display');
            const waterBtn = document.getElementById('water-garden-btn');
            
            if (gardenGrowing) {
                const now = Date.now();
                const timeLeft = Math.ceil((gardenReadyTime - now) / 1000);
                
                if (timeLeft > 0) {
                    const totalTime = 60000;
                    const elapsed = Date.now() - gardenStartTime;
                    const pct = Math.max(0, Math.min(100, 100 - (elapsed / totalTime * 100)));
                    const bar = document.getElementById('garden-progress-bar');
                    if (bar) { bar.style.width = pct + '%'; bar.style.background = 'linear-gradient(90deg,#4ade80,#16a34a)'; }
                    if (timerDisplay) timerDisplay.textContent = 'Growing...';
                    if (waterBtn) {
                        waterBtn.textContent = '🌱';
                        waterBtn.style.background = '#ccc';
                        waterBtn.style.cursor = 'not-allowed';
                        waterBtn.onclick = null;
                    }
                } else {
                    // Ready to harvest!
                    if (timerDisplay) updateHarvestProgressDisplay();
                    if (waterBtn) {
                        waterBtn.textContent = '💧';
                        waterBtn.style.background = '#ccc';
                        waterBtn.style.cursor = 'not-allowed';
                        waterBtn.onclick = null;
                    }
                    
                    // Update slots to show harvest image and add hold-to-harvest
                    for (let i = 0; i < getUnlockedSlots(); i++) {
                        if (gardenSlots[i]) {
                            const slot = document.getElementById(`garden-plot-slot-${i}`);
                            console.log('Setting up harvest for slot', i, 'element:', slot);
                            if (slot) {
                                // Show harvest item image (e.g. carrot) instead of seed
                                const seedData = ITEM_DATA[gardenSlots[i]];
                                const harvestId = seedData && seedData.harvestItem ? seedData.harvestItem : null;
                                const harvestImg = harvestId && ITEM_IMAGES[harvestId] ? ITEM_IMAGES[harvestId] : null;
                                
                                slot.innerHTML = harvestImg
                                    ? `<img src="${harvestImg}" style="width:48px;height:48px;object-fit:contain;pointer-events:none;" />`
                                    : `<span style="font-size:32px;pointer-events:none;">🥕</span>`;
                                
                                slot.style.background = '#e8f5e9';
                                slot.style.borderColor = '#4caf50';
                                slot.style.border = '2px solid #4caf50';
                                slot.style.cursor = 'pointer';
                                slot.style.pointerEvents = 'auto'; // Enable interaction for harvesting
                                slot.style.position = 'relative';
                                slot.style.zIndex = '200'; // Above basket canvas (z-index: 150)
                                slot.style.transform = 'scale(1)';
                                
                                const slotIndex = i;
                                slot.onmousedown = () => { console.log('onmousedown slot', slotIndex); startHarvestHold(slotIndex); };
                                slot.onmouseup = () => { console.log('onmouseup'); stopHarvestHold(); };
                                slot.onmouseleave = () => { console.log('onmouseleave'); stopHarvestHold(); };
                                slot.ontouchstart = (e) => { e.preventDefault(); console.log('ontouchstart slot', slotIndex); startHarvestHold(slotIndex); };
                                slot.ontouchend = (e) => { e.preventDefault(); console.log('ontouchend'); stopHarvestHold(); };
                                slot.ontouchcancel = () => { console.log('ontouchcancel'); stopHarvestHold(); };
                                
                                console.log('Slot', i, 'pointer-events:', slot.style.pointerEvents, 'handlers set:', !!slot.onmousedown);
                            }
                        } else {
                            // Empty / already harvested slot - fully reset
                            const slot = document.getElementById(`garden-plot-slot-${i}`);
                            if (slot) {
                                slot.innerHTML = `<span id="garden-plot-icon-${i}">+</span>`;
                                slot.style.transform = 'scale(1)';
                                slot.style.background = '#fff';
                                slot.style.border = '2px dashed #8bc34a';
                                slot.style.cursor = 'default';
                                slot.style.pointerEvents = 'none'; // Disable to allow drag-through
                                slot.style.zIndex = ''; // Reset z-index
                                slot.onmousedown = null;
                                slot.onmouseup = null;
                                slot.onmouseleave = null;
                                slot.ontouchstart = null;
                                slot.ontouchend = null;
                            }
                        }
                    }
                }
            } else {
                if (timerDisplay) timerDisplay.textContent = 'Plant seeds.';
                const idleBar = document.getElementById('garden-progress-bar');
                if (idleBar) { idleBar.style.width = '0%'; idleBar.style.transition = 'none'; }
                if (waterBtn) {
                    waterBtn.textContent = '💧';
                    waterBtn.style.background = '#4dd0e1';
                    waterBtn.style.cursor = 'pointer';
                    waterBtn.onclick = waterGarden;
                }
            }
        }
        
        function startGardenUpdateInterval() {
            if (gardenUpdateInterval) return;
            
            gardenUpdateInterval = setInterval(() => {
                updateGardenDisplay();
                
                // Stop if not growing
                if (!gardenGrowing) {
                    stopGardenUpdateInterval();
                }
            }, 1000); // Update every second
        }
        
        function stopGardenUpdateInterval() {
            if (gardenUpdateInterval) {
                clearInterval(gardenUpdateInterval);
                gardenUpdateInterval = null;
            }
        }

        // ===== FARMING MINIGAMES =====
        let gardenTaps = 0;
        let gardenActive = false;
        let gardenTimer = null;
        let gardenTimeLeft = 5.0;
        
        function initGardenGame() {
            gardenTaps = 0;
            gardenTimeLeft = 5.0;
            gardenActive = false;
            document.getElementById('garden-taps-display').textContent = 'Taps: 0 / 20';
            document.getElementById('garden-timer-display').textContent = 'Time: 5.0s';
            document.getElementById('garden-result').textContent = '';
        }
        
        function startGardenGame() {
            if (gardenActive) return;
            gardenActive = true;
            gardenTaps = 0;
            gardenTimeLeft = 5.0;
            document.getElementById('garden-result').textContent = '';
            
            gardenTimer = setInterval(() => {
                gardenTimeLeft -= 0.1;
                document.getElementById('garden-timer-display').textContent = 'Time: ' + gardenTimeLeft.toFixed(1) + 's';
                if (gardenTimeLeft <= 0) endGardenGame();
            }, 100);
        }
        
        function tapGarden() {
            if (!gardenActive) startGardenGame();
            if (gardenActive) {
                gardenTaps++;
                document.getElementById('garden-taps-display').textContent = 'Taps: ' + gardenTaps + ' / 20';
                if (gardenTaps >= 20) endGardenGame();
            }
        }
        
        function endGardenGame() {
            clearInterval(gardenTimer);
            gardenActive = false;
            const result = document.getElementById('garden-result');
            if (gardenTaps >= 20) {
                result.textContent = '🎉 Garden cleared! +1 Carrot';
                addItem('carrot', 1);
                addSkillXP('farming', 10);
                
                // 5% chance to find a Basket
                if (Math.random() < 0.05) {
                    addItem('basket', 1);
                    notify('🧺 Found a Basket!');
                }
            } else {
                result.textContent = '❌ Not enough taps! (' + gardenTaps + '/20)';
            }
            setTimeout(() => initGardenGame(), 2000);
        }
        
        function stopGardenGame() {
            clearInterval(gardenTimer);
            gardenActive = false;
        }
        
        // ===== FIELD MINIGAME: 3 vertical bars, tap to hit green zone =====
        let fieldActive = false;
        let fieldAnimFrame = null;
        let fieldHits = 0;           // successful hits in current round (0-2)
        let fieldCurrentBar = 0;     // which bar is active (0,1,2)
        let fieldIndPos = [0, 0, 0]; // 0..1 position of indicator per bar
        let fieldIndDir = [1, 1, 1]; // direction per bar
        let fieldSpeeds = [0, 0, 0]; // pixels-per-frame per bar
        let fieldZonePos = [0, 0, 0];// 0..1 top of green zone per bar
        let fieldLocked = false;     // brief lock after tap
        
        const FIELD_IND_H  = 0.1375; // indicator height as fraction (22px / 160px)
        const FIELD_ZONE_H = 0.30;   // zone height as fraction
        const FIELD_BASE_SPEED = 0.006;
        
        function initFieldGame() {
            fieldActive = true;
            fieldHits = 0;
            fieldCurrentBar = 0;
            fieldLocked = false;
            
            // Randomise zone positions and speeds
            for (let i = 0; i < 3; i++) {
                fieldZonePos[i] = 0.1 + Math.random() * (0.6 - FIELD_ZONE_H);
                fieldIndPos[i]  = Math.random() * (1 - FIELD_IND_H);
                fieldIndDir[i]  = Math.random() > 0.5 ? 1 : -1;
                // Each bar slightly faster than the last
                fieldSpeeds[i]  = FIELD_BASE_SPEED + i * 0.003 + Math.random() * 0.003;
            }
            
            // Ensure all bars are visible
            showAllFieldBars();
            
            // Reset all indicators to green
            for (let i = 0; i < 3; i++) {
                const ind = document.getElementById('field-ind-' + i);
                if (ind) {
                    ind.style.background = 'linear-gradient(180deg,#fde047,#eab308)';
                    ind.style.border = '1.5px solid #000';
                }
            }
            
            updateFieldDots();
            document.getElementById('field-result').textContent = '';
            
            if (fieldAnimFrame) { cancelAnimationFrame(fieldAnimFrame); fieldAnimFrame = null; }
            fieldAnimFrame = requestAnimationFrame(fieldLoop);
        }
        
        function fieldLoop() {
            if (!fieldActive) { fieldAnimFrame = null; return; }
            
            // All 3 bars animate simultaneously
            for (let i = 0; i < 3; i++) {
                // Already-hit bars stay frozen green — skip them
                if (i < fieldCurrentBar) continue;
                if (fieldLocked && i === fieldCurrentBar) continue;
                
                const pos = fieldIndPos[i] + fieldIndDir[i] * fieldSpeeds[i];
                if (pos <= 0) {
                    fieldIndPos[i] = 0;
                    fieldIndDir[i] = 1;
                } else if (pos + FIELD_IND_H >= 1) {
                    fieldIndPos[i] = 1 - FIELD_IND_H;
                    fieldIndDir[i] = -1;
                } else {
                    fieldIndPos[i] = pos;
                }
                renderBar(i);
            }
            
            fieldAnimFrame = requestAnimationFrame(fieldLoop);
        }
        
        function renderBar(i) {
            const wrap = document.getElementById('field-bar-wrap-' + i);
            if (!wrap) return;
            // Use the fixed height directly — clientHeight is 0 when room is hidden
            const h = 160;
            
            const ind  = document.getElementById('field-ind-' + i);
            const zone = document.getElementById('field-zone-' + i);
            if (ind)  ind.style.top  = (fieldIndPos[i]  * h) + 'px';
            if (zone) zone.style.top = (fieldZonePos[i] * h) + 'px';
        }
        
        function ripFieldBar(i) {
            const wrap = document.getElementById('field-bar-wrap-' + i);
            if (!wrap) return;
            wrap.classList.remove('field-bar-rip');
            void wrap.offsetWidth;
            wrap.classList.add('field-bar-rip');
            wrap.addEventListener('animationend', () => {
                wrap.style.visibility = 'hidden';
                wrap.style.opacity = '0';
                wrap.classList.remove('field-bar-rip');
            }, { once: true });
            
            // Spawn leaf/speck particles at bar position
            const leafColors = ['#4ade80','#86efac','#fde047','#bbf7d0','#a3e635','#fef08a'];
            const anims = ['ripLeaf1','ripLeaf2','ripLeaf3','ripLeaf4','ripLeaf5'];
            const rect = wrap.getBoundingClientRect();
            for (let l = 0; l < 5; l++) {
                const leaf = document.createElement('div');
                leaf.className = 'rip-leaf';
                leaf.style.cssText = `
                    left: ${rect.left + rect.width * 0.1 + Math.random() * rect.width * 0.8}px;
                    top: ${rect.top + rect.height * 0.2 + Math.random() * rect.height * 0.6 + window.scrollY}px;
                    position: fixed;
                    background: ${leafColors[Math.floor(Math.random() * leafColors.length)]};
                    animation: ${anims[l]} ${0.35 + Math.random() * 0.25}s cubic-bezier(0.1,0,0.3,1) forwards;
                    animation-delay: ${l * 0.03}s;
                    width: ${5 + Math.random() * 5}px;
                    height: ${5 + Math.random() * 5}px;
                    opacity: 1;
                `;
                document.body.appendChild(leaf);
                leaf.addEventListener('animationend', () => leaf.remove(), { once: true });
            }
        }
        
        function showAllFieldBars() {
            for (let i = 0; i < 3; i++) {
                const wrap = document.getElementById('field-bar-wrap-' + i);
                if (!wrap) continue;
                wrap.style.visibility = '';
                wrap.style.opacity = '0';
                wrap.style.transform = 'scaleY(0.3)';
                wrap.style.transformOrigin = 'bottom center';
                wrap.style.transition = 'none';
            }
            // All 3 grow back simultaneously, smooth ease-out
            requestAnimationFrame(() => requestAnimationFrame(() => {
                for (let i = 0; i < 3; i++) {
                    const wrap = document.getElementById('field-bar-wrap-' + i);
                    if (!wrap) continue;
                    wrap.style.transition = 'transform 0.25s ease-out, opacity 0.2s ease-out';
                    wrap.style.transform = 'scaleY(1)';
                    wrap.style.opacity = '1';
                }
            }));
        }
        
        function fieldTap() {
            if (!fieldActive || fieldLocked) return;
            
            const i = fieldCurrentBar;
            const indTop    = fieldIndPos[i];
            const indBot    = indTop + FIELD_IND_H;
            const zoneTop   = fieldZonePos[i];
            const zoneBot   = zoneTop + FIELD_ZONE_H;
            
            // Check overlap
            const hit = indTop < zoneBot && indBot > zoneTop;
            
            if (hit) {
                // ✅ Hit!
                fieldLocked = true;
                
                // Flash indicator green
                const ind = document.getElementById('field-ind-' + i);
                if (ind) { ind.style.background = 'linear-gradient(180deg,#4ade80,#16a34a)'; }
                
                // Burst specks
                document.querySelectorAll('.fs' + i + 'a, .fs' + i + 'b').forEach(s => {
                    s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                    s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                });
                
                fieldHits++;
                updateFieldDots();
                
                if (fieldHits === 3) {
                    // 🎉 All 3 hit — success!
                    fieldActive = false;
                    cancelAnimationFrame(fieldAnimFrame);
                    
                    const farmLv = gs.skills && gs.skills.farming ? gs.skills.farming.level : 1;
                    const bonus = Math.floor(farmLv / 5);
                    const xp = 20 + bonus * 5;
                    
                    const crops = ['carrot','potato','corn','tomato','onion'];
                    const crop = crops[Math.floor(Math.random() * crops.length)];
                    const qty = 1 + bonus;
                    addItem(crop, qty);
                    addSkillXP('farming', xp);
                    
                    const cropData = ITEM_DATA[crop];
                    document.getElementById('field-result').textContent =
                        '🎉 ' + (cropData ? cropData.emoji + ' ×' + qty : '✅') + ' Farmed!';
                    
                    setTimeout(() => ripFieldBar(i), 120);
                    setTimeout(() => {
                        showAllFieldBars();
                        initFieldGame();
                    }, 1800);
                    
                } else {
                    // ✅ Advance to next bar — rip the bar away, then unlock next
                    setTimeout(() => {
                        ripFieldBar(i);
                    }, 120);
                    setTimeout(() => {
                        fieldCurrentBar++;
                        fieldLocked = false;
                        updateFieldDots();
                    }, 500);
                }
                
            } else {
                // ❌ Miss — restart
                fieldLocked = true;
                cancelAnimationFrame(fieldAnimFrame);
                
                // Flash all active (non-hit) bars red
                for (let j = fieldCurrentBar; j < 3; j++) {
                    const ind = document.getElementById('field-ind-' + j);
                    if (ind) ind.style.background = 'linear-gradient(180deg,#ef4444,#b91c1c)';
                }
                
                document.getElementById('field-result').textContent = '❌ Missed! Try again';
                
                setTimeout(() => {
                    showAllFieldBars();
                    for (let j = 0; j < 3; j++) {
                        const ind = document.getElementById('field-ind-' + j);
                        if (ind) ind.style.background = 'linear-gradient(180deg,#fde047,#eab308)';
                    }
                    fieldActive = true;
                    fieldLocked = false;
                    initFieldGame();
                }, 900);
            }
        }
        
        function updateFieldDots() {
            for (let i = 0; i < 3; i++) {
                const dot = document.getElementById('field-dot-' + i);
                if (!dot) continue;
                if (i < fieldHits) {
                    // filled — green
                    dot.style.background = '#4ade80';
                    dot.style.borderColor = '#16a34a';
                    dot.style.boxShadow = '0 0 6px #4ade80';
                } else if (i === fieldCurrentBar) {
                    // active — pulse white
                    dot.style.background = '#fff';
                    dot.style.borderColor = '#fff';
                    dot.style.boxShadow = '0 0 8px rgba(255,255,255,0.8)';
                } else {
                    // waiting — dim
                    dot.style.background = 'rgba(255,255,255,0.2)';
                    dot.style.borderColor = 'rgba(255,255,255,0.4)';
                    dot.style.boxShadow = 'none';
                }
            }
        }
        
        // ===== ORCHARD MINIGAME: horizontal bar, ball bounces L-R, zone shrinks per hit =====
        let orchardActive = false;
        let orchardAnimFrame = null;
        let orchardHits = 0;
        let orchardBallPos = 0;      // 0..1 fraction of bar width
        let orchardBallDir = 1;
        let orchardBallSpeed = 0.008;
        let orchardZoneLeft = 0.2;   // 0..1
        let orchardZoneW = 0.38;     // shrinks each hit
        let orchardLocked = false;

        const ORCHARD_BAR_W  = 240;  // px — must match HTML
        const ORCHARD_BALL_W = 22;   // px — ball width
        const ORCHARD_BALL_FRAC = ORCHARD_BALL_W / ORCHARD_BAR_W;

        const ORCHARD_ZONE_SIZES = [0.38, 0.26, 0.16];
        const ORCHARD_SPEEDS     = [0.008, 0.012, 0.017];

        const ORCHARD_FRUITS  = ['apple','pear','orange','cherry','peach','lemon','mango','coconut'];
        const ORCHARD_WEIGHTS = [30, 28, 20, 18, 10, 10, 4, 4];

        function orchardWeightedFruit() {
            const total = ORCHARD_WEIGHTS.reduce((a,b)=>a+b,0);
            let r = Math.random() * total;
            for (let i = 0; i < ORCHARD_FRUITS.length; i++) {
                r -= ORCHARD_WEIGHTS[i];
                if (r <= 0) return ORCHARD_FRUITS[i];
            }
            return ORCHARD_FRUITS[0];
        }

        function initOrchardGame() {
            orchardActive  = true;
            orchardHits    = 0;
            orchardLocked  = false;
            orchardBallSpeed = ORCHARD_SPEEDS[0];
            orchardZoneW     = ORCHARD_ZONE_SIZES[0];
            orchardBallPos   = Math.random() * (1 - ORCHARD_BALL_FRAC);
            orchardBallDir   = Math.random() > 0.5 ? 1 : -1;
            // Zone always centered
            orchardZoneLeft  = (1 - orchardZoneW) / 2;

            // Show + grow bar
            const wrap = document.getElementById('orchard-bar-wrap');
            if (wrap) {
                wrap.style.visibility = '';
                wrap.style.opacity = '1';
                wrap.style.transform = 'scaleY(0)';
                wrap.style.transformOrigin = 'top center';
                wrap.style.transition = 'none';
                requestAnimationFrame(() => requestAnimationFrame(() => {
                    wrap.style.transition = 'transform 0.25s ease-out, opacity 0.2s ease-out';
                    wrap.style.transform = 'scaleY(1)';
                }));
            }

            // Reset ball colour
            const ball = document.getElementById('orchard-ball');
            if (ball) ball.style.background = 'linear-gradient(135deg,#f87171,#dc2626)';

            renderOrchardZone();
            updateOrchardDots();
            document.getElementById('orchard-result').textContent = '';

            if (orchardAnimFrame) { cancelAnimationFrame(orchardAnimFrame); orchardAnimFrame = null; }
            orchardAnimFrame = requestAnimationFrame(orchardLoop);
        }

        function orchardLoop() {
            if (!orchardActive) { orchardAnimFrame = null; return; }
            if (!orchardLocked) {
                const pos = orchardBallPos + orchardBallDir * orchardBallSpeed;
                if (pos <= 0) {
                    orchardBallPos = 0; orchardBallDir = 1;
                } else if (pos + ORCHARD_BALL_FRAC >= 1) {
                    orchardBallPos = 1 - ORCHARD_BALL_FRAC; orchardBallDir = -1;
                } else {
                    orchardBallPos = pos;
                }
                const ball = document.getElementById('orchard-ball');
                if (ball) ball.style.left = (orchardBallPos * ORCHARD_BAR_W) + 'px';
            }
            orchardAnimFrame = requestAnimationFrame(orchardLoop);
        }

        function renderOrchardZone() {
            const zone = document.getElementById('orchard-zone');
            if (!zone) return;
            // Always center the zone
            orchardZoneLeft = (1 - orchardZoneW) / 2;
            zone.style.left  = (orchardZoneLeft * ORCHARD_BAR_W) + 'px';
            zone.style.width = (orchardZoneW    * ORCHARD_BAR_W) + 'px';
        }

        function orchardTap() {
            if (!orchardActive || orchardLocked) return;

            const ballL = orchardBallPos;
            const ballR = ballL + ORCHARD_BALL_FRAC;
            const zoneR = orchardZoneLeft + orchardZoneW;
            const hit   = ballL < zoneR && ballR > orchardZoneLeft;

            if (hit) {
                orchardLocked = true;
                orchardHits++;

                // Shake bar
                const wrap = document.getElementById('orchard-bar-wrap');
                if (wrap) {
                    wrap.classList.remove('orchard-shake');
                    void wrap.offsetWidth;
                    wrap.classList.add('orchard-shake');
                    wrap.addEventListener('animationend', () => wrap.classList.remove('orchard-shake'), { once: true });
                }

                // Burst specks
                document.querySelectorAll('.orchard-speck').forEach(s => {
                    s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                    s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                });

                // Leaf rip particles
                const wrapEl = document.getElementById('orchard-bar-wrap');
                if (wrapEl) {
                    const rect = wrapEl.getBoundingClientRect();
                    const leafColors = ['#fde047','#fb923c','#4ade80','#fef08a','#86efac','#fbbf24'];
                    const anims = ['ripLeaf1','ripLeaf2','ripLeaf3','ripLeaf4','ripLeaf5'];
                    for (let l = 0; l < 6; l++) {
                        const leaf = document.createElement('div');
                        leaf.className = 'rip-leaf';
                        leaf.style.cssText = `
                            left: ${rect.left + rect.width*0.1 + Math.random()*rect.width*0.8}px;
                            top: ${rect.top + rect.height*0.2 + Math.random()*rect.height*0.6}px;
                            position: fixed;
                            background: ${leafColors[Math.floor(Math.random()*leafColors.length)]};
                            animation: ${anims[l%5]} ${0.3+Math.random()*0.3}s cubic-bezier(0.1,0,0.3,1) forwards;
                            animation-delay: ${l*0.03}s;
                            width: ${5+Math.random()*6}px;
                            height: ${5+Math.random()*6}px;
                            opacity: 1;
                        `;
                        document.body.appendChild(leaf);
                        leaf.addEventListener('animationend', () => leaf.remove(), { once: true });
                    }
                }

                updateOrchardDots();

                if (orchardHits === 3) {
                    // 🎉 Success!
                    orchardActive = false;
                    cancelAnimationFrame(orchardAnimFrame);

                    const farmLv = gs.skills && gs.skills.farming ? gs.skills.farming.level : 1;
                    const bonus  = Math.floor(farmLv / 5);
                    const xp     = 25 + bonus * 5;
                    const fruit  = orchardWeightedFruit();
                    const qty    = 1 + bonus;
                    addItem(fruit, qty);
                    addSkillXP('farming', xp);

                    const cropData = ITEM_DATA[fruit];
                    document.getElementById('orchard-result').textContent =
                        '🎉 ' + (cropData ? cropData.emoji + ' ×' + qty : '✅') + ' Picked!';

                    // Rip bar away then respawn fresh
                    setTimeout(() => {
                        if (wrap) {
                            wrap.classList.add('field-bar-rip');
                            wrap.addEventListener('animationend', () => {
                                wrap.style.visibility = 'hidden';
                                wrap.style.opacity = '0';
                                wrap.classList.remove('field-bar-rip');
                            }, { once: true });
                        }
                    }, 120);

                    setTimeout(() => initOrchardGame(), 1800);

                } else {
                    // Shrink zone (stays centered), speed up
                    orchardZoneW     = ORCHARD_ZONE_SIZES[orchardHits];
                    orchardBallSpeed = ORCHARD_SPEEDS[orchardHits];
                    setTimeout(() => {
                        renderOrchardZone();
                        orchardLocked = false;
                    }, 350);
                }

            } else {
                // ❌ Miss
                orchardLocked = true;
                cancelAnimationFrame(orchardAnimFrame);

                const ball = document.getElementById('orchard-ball');
                if (ball) ball.style.background = 'linear-gradient(135deg,#ef4444,#b91c1c)';

                document.getElementById('orchard-result').textContent = '❌ Missed! Try again';

                setTimeout(() => {
                    orchardActive = true;
                    orchardLocked = false;
                    initOrchardGame();
                }, 900);
            }
        }

        function updateOrchardDots() {
            for (let i = 0; i < 3; i++) {
                const dot = document.getElementById('orchard-dot-' + i);
                if (!dot) continue;
                if (i < orchardHits) {
                    dot.style.background = '#fde047';
                    dot.style.borderColor = '#eab308';
                    dot.style.boxShadow   = '0 0 6px #fde047';
                } else if (i === orchardHits) {
                    dot.style.background = '#fff';
                    dot.style.borderColor = '#fff';
                    dot.style.boxShadow   = '0 0 8px rgba(255,255,255,0.8)';
                } else {
                    dot.style.background  = 'rgba(255,255,255,0.2)';
                    dot.style.borderColor = 'rgba(255,255,255,0.4)';
                    dot.style.boxShadow   = 'none';
                }
            }
        }

        function stopOrchardGame() {
            orchardActive = false;
            if (orchardAnimFrame) { cancelAnimationFrame(orchardAnimFrame); orchardAnimFrame = null; }
        }

                function stopFieldGame() {
            fieldActive = false;
            if (fieldAnimFrame) cancelAnimationFrame(fieldAnimFrame);
            fieldAnimFrame = null;
        }
        



        // ===== COOP MINIGAME =====
        // Large square pen with bouncing white circles (chickens).
        // Drop any seed onto a circle → 70% egg, 29% nothing, 1% rock.
        // Cards at top: Buy Chicken (1000 coins), Buy Space (2000 coins), max 5 spaces.

        const COOP_PEN_W  = 220;
        const COOP_PEN_H  = 220;
        const COOP_CIRC_R = 22;   // radius of chicken circle
        const COOP_TICK   = 30;

        let coopIntervals = [];
        let coopChickens  = [];   // { x, y, vx, vy, el, busy }

        function initCoop() {
            if (!gs.coop) gs.coop = { chickens: 1, maxChickens: 2 };
            // Clamp prices in case old save has wrong values
            renderCoopPen();
            updateCoopCountDisplay();
            startCoopAnimations();

            document.getElementById('coop-buy-chicken').onclick = () => {
                if (!gs.coop) gs.coop = { chickens: 1, maxChickens: 2 };
                if (gs.coop.chickens >= gs.coop.maxChickens) {
                    coopMsg('🏠 No space! Buy more coop space first.'); return;
                }
                if (gs.coins < 1000) { coopMsg('❌ Need 1,000 coins!'); return; }
                gs.coins -= 1000;
                gs.coop.chickens++;
                save(); updateUI();
                renderCoopPen();
                startCoopAnimations();
                updateCoopCountDisplay();
                coopMsg('🐔 New chicken moved in!');
            };

            document.getElementById('coop-buy-space').onclick = () => {
                if (!gs.coop) gs.coop = { chickens: 1, maxChickens: 2 };
                if (gs.coop.maxChickens >= 5) { coopMsg('🏠 Coop is max size (5)!'); return; }
                if (gs.coins < 2000) { coopMsg('❌ Need 2,000 coins!'); return; }
                gs.coins -= 2000;
                gs.coop.maxChickens++;
                save(); updateUI();
                updateCoopCountDisplay();
                coopMsg('🏠 Coop expanded! Space: ' + gs.coop.maxChickens);
            };
        }

        function stopCoopAnimations() {
            coopIntervals.forEach(id => clearInterval(id));
            coopIntervals = [];
            coopChickens  = [];
        }

        function startCoopAnimations() {
            stopCoopAnimations();
            if (!gs.coop) return;
            const pen = document.getElementById('coop-pen');
            if (!pen) return;

            coopChickens = Array.from(pen.querySelectorAll('.coop-chicken-circle')).map((el, i) => {
                const spd = 1.4 + Math.random() * 1.2;
                const ang = Math.random() * Math.PI * 2;
                return {
                    el,
                    x: COOP_CIRC_R + Math.random() * (COOP_PEN_W - COOP_CIRC_R * 2),
                    y: COOP_CIRC_R + Math.random() * (COOP_PEN_H - COOP_CIRC_R * 2),
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    busy: false,
                    index: i
                };
            });

            const id = setInterval(() => {
                coopChickens.forEach(c => {
                    if (c.busy) return;
                    c.x += c.vx;
                    c.y += c.vy;
                    // Bounce off pen walls
                    if (c.x - COOP_CIRC_R < 0)            { c.x = COOP_CIRC_R;                    c.vx = Math.abs(c.vx); }
                    if (c.x + COOP_CIRC_R > COOP_PEN_W)   { c.x = COOP_PEN_W - COOP_CIRC_R;       c.vx = -Math.abs(c.vx); }
                    if (c.y - COOP_CIRC_R < 0)            { c.y = COOP_CIRC_R;                    c.vy = Math.abs(c.vy); }
                    if (c.y + COOP_CIRC_R > COOP_PEN_H)   { c.y = COOP_PEN_H - COOP_CIRC_R;       c.vy = -Math.abs(c.vy); }
                    // Position element (top-left of bounding box)
                    c.el.style.left = (c.x - COOP_CIRC_R) + 'px';
                    c.el.style.top  = (c.y - COOP_CIRC_R) + 'px';
                });
            }, COOP_TICK);
            coopIntervals.push(id);
        }

        function renderCoopPen() {
            const pen = document.getElementById('coop-pen');
            if (!pen || !gs.coop) return;
            pen.innerHTML = '';
            for (let i = 0; i < gs.coop.chickens; i++) {
                const div = document.createElement('div');
                div.className = 'coop-chicken-circle';
                div.id = 'coop-circle-' + i;
                div.textContent = '🐔';
                div.style.left = COOP_CIRC_R + 'px';
                div.style.top  = COOP_CIRC_R + 'px';
                pen.appendChild(div);
            }
        }

        function updateCoopCountDisplay() {
            const el = document.getElementById('coop-count-display');
            if (el && gs.coop) el.textContent = gs.coop.chickens + '/' + gs.coop.maxChickens;
        }

        function feedChicken(chickenIndex) {
            const c = coopChickens[chickenIndex];
            if (!c || c.busy) return;
            c.busy = true;
            c.el.classList.add('fed');
            c.el.textContent = '😋';

            setTimeout(() => {
                const r = Math.random();
                let outcome, icon, msg;
                if (r < 0.70)       { outcome = 'egg';  icon = '🥚'; msg = '🥚 Got an Egg!'; }
                else if (r < 0.99)  { outcome = null;   icon = '💨'; msg = '😒 Nothing...'; }
                else                { outcome = 'rock';  icon = '🪨'; msg = '🪨 Just a Rock...'; }

                if (outcome) addItem(outcome, 1);
                coopMsg(icon + ' ' + msg);
                addSkillXP('farming', outcome === 'egg' ? 5 : 1);
                save();

                c.el.classList.remove('fed');
                c.el.textContent = '🐔';
                c.busy = false;
            }, 700);
        }

        function coopMsg(text) {
            const el = document.getElementById('coop-msg');
            if (!el) return;
            el.textContent = text;
            clearTimeout(el._t);
            el._t = setTimeout(() => { el.textContent = ''; }, 2200);
        }

        window.coopOnEnter   = () => { initCoop(); };
        window.coopOnLeave   = () => { stopCoopAnimations(); };
        window.feedChicken   = feedChicken;
        window.coopChickens  = () => coopChickens;
