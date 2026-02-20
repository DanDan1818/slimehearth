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
        
        const FIELD_IND_H  = 0.22;   // indicator height as fraction
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
            
            // Reset all indicators to brown
            for (let i = 0; i < 3; i++) {
                const ind = document.getElementById('field-ind-' + i);
                if (ind) {
                    ind.style.background = 'linear-gradient(180deg,#a16207,#78350f)';
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
                    
                    setTimeout(() => initFieldGame(), 1800);
                    
                } else {
                    // ✅ Advance to next bar — freeze this one green, unlock next
                    setTimeout(() => {
                        // Freeze hit bar: keep indicator green, stop it moving
                        fieldCurrentBar++;
                        fieldLocked = false;
                        updateFieldDots();
                    }, 350);
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
                    // Restore brown before reinit
                    for (let j = 0; j < 3; j++) {
                        const ind = document.getElementById('field-ind-' + j);
                        if (ind) ind.style.background = 'linear-gradient(180deg,#a16207,#78350f)';
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
        
        function stopFieldGame() {
            fieldActive = false;
            if (fieldAnimFrame) cancelAnimationFrame(fieldAnimFrame);
            fieldAnimFrame = null;
        }
        

