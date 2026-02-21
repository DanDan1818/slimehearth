        // ===== THE HEARTH (DROPDOWN MENU SYSTEM) =====
        let hearthSlot1ItemId = null;
        let hearthSlot2ItemId = null;
        let hearthLockedBody1 = null;
        let hearthLockedBody2 = null;
        
        // Shared helper: lock a body into a DOM slot visually
        function lockBodyInSlot(body, slotEl, borderColor) {
            const containerEl = document.getElementById('basket-container');
            const containerRect = containerEl.getBoundingClientRect();
            const styleScale = containerEl.style.transform || '';
            const scaleMatch = styleScale.match(/scale\(([^)]+)\)/);
            const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 0.8;
            const slotRect = slotEl.getBoundingClientRect();
            const cx = (slotRect.left + slotRect.width / 2 - containerRect.left) / scale;
            const cy = (slotRect.top + slotRect.height / 2 - containerRect.top) / scale;
            Matter.Body.setPosition(body, { x: cx, y: cy });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            Matter.Body.setAngle(body, 0);
            Matter.Body.setStatic(body, true);
            body.render.opacity = 0;
            
            // Remove from basketBodies array so populateBasket doesn't respawn it
            const index = basketBodies.indexOf(body);
            if (index > -1) {
                basketBodies.splice(index, 1);
            }
        }
        
        // Shared helper: build the locked item image DOM
        function slotLockedHTML(itemId) {
            const data = ITEM_DATA[itemId];
            const imgSrc = ITEM_IMAGES[itemId];
            const nameStr = data ? data.name.replace(/[^\w\s'\-]/g,'').trim() : itemId;
            const iconHtml = imgSrc
                ? `<img src="${imgSrc}" style="width:44px;height:44px;object-fit:contain;animation:geodeLock 0.3s ease-out;" />`
                : `<span style="font-size:30px;line-height:1;animation:geodeLock 0.3s ease-out;">${data ? data.emoji || '📦' : '📦'}</span>`;
            return iconHtml + `<span style="font-size:8px;font-weight:bold;color:#444;text-align:center;margin-top:2px;max-width:68px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${nameStr}</span>`;
        }
        
        // Release a locked body back to physics
        function releaseLockedBody(body) {
            if (!body) return;
            body.render.opacity = 1;
            Matter.Body.setStatic(body, false);
            Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 8, y: -6 });
            
            // Re-add to basketBodies array if not already present
            if (!basketBodies.includes(body)) {
                basketBodies.push(body);
            }
        }
        
        function lockItemInHearthSlot(body, slotNumber) {
            const itemId = body.itemId;
            const data = ITEM_DATA[itemId];
            if (!data) return;
            
            // Release whatever was in this slot before
            if (slotNumber === 1 && hearthLockedBody1) releaseLockedBody(hearthLockedBody1);
            if (slotNumber === 2 && hearthLockedBody2) releaseLockedBody(hearthLockedBody2);
            
            const slotEl = document.getElementById(`hearth-slot-${slotNumber}`);
            lockBodyInSlot(body, slotEl, '#f59e0b');
            
            if (slotNumber === 1) { hearthLockedBody1 = body; hearthSlot1ItemId = itemId; }
            else                  { hearthLockedBody2 = body; hearthSlot2ItemId = itemId; }
            
            // Update slot visual
            slotEl.innerHTML = slotLockedHTML(itemId);
            slotEl.style.border = '3px solid #22c55e';
            slotEl.style.boxShadow = '0 0 8px rgba(34,197,94,0.4)';
            
            // Show clear button
            const clearBtn = document.getElementById(`hearth-clear-${slotNumber}`);
            if (clearBtn) clearBtn.style.display = 'inline-block';
            
            // Name is already set inside slotLockedHTML
            
            updateHearthDisplay();
            notify(`${data.name} added to slot ${slotNumber}!`);
        }
        
        function clearHearthSlot(slotNumber) {
            if (slotNumber === 1) {
                releaseLockedBody(hearthLockedBody1);
                hearthLockedBody1 = null;
                hearthSlot1ItemId = null;
            } else {
                releaseLockedBody(hearthLockedBody2);
                hearthLockedBody2 = null;
                hearthSlot2ItemId = null;
            }
            const slotEl = document.getElementById(`hearth-slot-${slotNumber}`);
            if (slotEl) {
                slotEl.innerHTML = `<span id="hearth-slot-${slotNumber}-icon" style="font-size:32px;line-height:1;">+</span><span id="hearth-slot-${slotNumber}-name" style="font-size:8px;font-weight:bold;color:#444;text-align:center;margin-top:2px;max-width:68px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:none;"></span>`;
                slotEl.style.border = '3px dashed #f59e0b';
                slotEl.style.boxShadow = '';
            }
            const clearBtn = document.getElementById(`hearth-clear-${slotNumber}`);
            if (clearBtn) clearBtn.style.display = 'none';
            updateHearthDisplay();
        }
        
        // Garden locked bodies per slot
        const gardenLockedBodies = new Array(6).fill(null);
        
        function lockItemInGardenSlot(body, slotIndex) {
            if (gardenGrowing) { notify('❌ Plants are growing! Wait to harvest first.', 'warning'); return; }
            const itemId = body.itemId;
            const data = ITEM_DATA[itemId];
            if (!data || !data.isPlantable) return;
            
            // Release whatever was already in this slot
            if (gardenLockedBodies[slotIndex]) releaseLockedBody(gardenLockedBodies[slotIndex]);
            
            const slotEl = document.getElementById(`garden-plot-slot-${slotIndex}`);
            lockBodyInSlot(body, slotEl, '#8bc34a');
            gardenLockedBodies[slotIndex] = body;
            
            // Update slot visual
            slotEl.innerHTML = slotLockedHTML(itemId);
            slotEl.style.border = '3px solid #22c55e';
            slotEl.style.boxShadow = '0 0 8px rgba(34,197,94,0.4)';
            slotEl.style.boxShadow = '0 0 10px rgba(139,195,74,0.5)';
            
            // Use existing garden seed selection logic
            selectGardenSeed(slotIndex, itemId);
            notify(`${data.name} planted in slot ${slotIndex + 1}!`);
        }
        
        function clearGardenSlot(slotIndex) {
            releaseLockedBody(gardenLockedBodies[slotIndex]);
            gardenLockedBodies[slotIndex] = null;
            gardenSlots[slotIndex] = null;
            const slotEl = document.getElementById(`garden-plot-slot-${slotIndex}`);
            if (slotEl) {
                slotEl.innerHTML = `<span id="garden-plot-icon-${slotIndex}">+</span>`;
                slotEl.style.border = '3px dashed #8b7355';
            slotEl.style.boxShadow = '';
                slotEl.style.boxShadow = '';
            }
        }
        
        const RECIPES = {
            // Lv 1 — always unlocked
            'fish+carrot':   { result: 'food',         name: '🍖 Cooked Food',   reqLevel: 1  },
            'carrot+fish':   { result: 'food',         name: '🍖 Cooked Food',   reqLevel: 1  },
            // Lv 3
            'fish+onion':    { result: 'fish_soup',    name: '🍲 Fish Soup',     reqLevel: 3  },
            'onion+fish':    { result: 'fish_soup',    name: '🍲 Fish Soup',     reqLevel: 3  },
            // Lv 5
            'tomato+fish':   { result: 'tomato_soup',  name: '🍅 Tomato Soup',   reqLevel: 5  },
            'fish+tomato':   { result: 'tomato_soup',  name: '🍅 Tomato Soup',   reqLevel: 5  },
            // Lv 8
            'carrot+potato': { result: 'carrot_stew',  name: '🥘 Carrot Stew',   reqLevel: 8  },
            'potato+carrot': { result: 'carrot_stew',  name: '🥘 Carrot Stew',   reqLevel: 8  },
            // Lv 10
            'onion+tomato':  { result: 'onion_broth',  name: '🧅 Onion Broth',   reqLevel: 10 },
            'tomato+onion':  { result: 'onion_broth',  name: '🧅 Onion Broth',   reqLevel: 10 },
            // Lv 15
            'potato+onion':  { result: 'potato_roast', name: '🥔 Potato Roast',  reqLevel: 15 },
            'onion+potato':  { result: 'potato_roast', name: '🥔 Potato Roast',  reqLevel: 15 },
            // Lv 20
            'corn+carrot':   { result: 'corn_bread',   name: '🌽 Corn Bread',    reqLevel: 20 },
            'carrot+corn':   { result: 'corn_bread',   name: '🌽 Corn Bread',    reqLevel: 20 },
            // Lv 25
            'fish+corn':     { result: 'fish_tacos',   name: '🌮 Fish Tacos',    reqLevel: 25 },
            'corn+fish':     { result: 'fish_tacos',   name: '🌮 Fish Tacos',    reqLevel: 25 },
            // Lv 35
            'pumpkin+carrot':{ result: 'pumpkin_pie',  name: '🥧 Pumpkin Pie',   reqLevel: 35 },
            'carrot+pumpkin':{ result: 'pumpkin_pie',  name: '🥧 Pumpkin Pie',   reqLevel: 35 },
            // Lv 50
            'tomato+corn':   { result: 'veggie_feast', name: '🥗 Veggie Feast',  reqLevel: 50 },
            'corn+tomato':   { result: 'veggie_feast', name: '🥗 Veggie Feast',  reqLevel: 50 },
        };
        
        // Helper function to check if item is a fish
        function isFish(itemId) {
            return ['fish1', 'fish2', 'fish3', 'fish4', 'fish5', 'fish6', 'fish7', 'fish8'].includes(itemId);
        }
        
        // Check if two items match a recipe (supports "any fish")
        function checkRecipe(item1, item2) {
            const cookLv = gs.skills && gs.skills.cooking ? gs.skills.cooking.level : 1;
            
            function recipeAllowed(recipe) {
                if (!recipe) return null;
                if (recipe.reqLevel && cookLv < recipe.reqLevel) return { locked: true, reqLevel: recipe.reqLevel, name: recipe.name };
                return recipe;
            }
            
            // Direct match
            const directKey1 = item1 + '+' + item2;
            const directKey2 = item2 + '+' + item1;
            if (RECIPES[directKey1]) return recipeAllowed(RECIPES[directKey1]);
            if (RECIPES[directKey2]) return recipeAllowed(RECIPES[directKey2]);
            
            // Check for fish + carrot / onion / tomato / corn combos (any fish works)
            if (isFish(item1) || isFish(item2)) {
                const veggie = isFish(item1) ? item2 : item1;
                const fishKey = 'fish+' + veggie;
                const veggieKey = veggie + '+fish';
                if (RECIPES[fishKey]) return recipeAllowed(RECIPES[fishKey]);
                if (RECIPES[veggieKey]) return recipeAllowed(RECIPES[veggieKey]);
            }
            
            return null;
        }
        
        function initHearth() {
            hearthSlot1ItemId = null;
            hearthSlot2ItemId = null;
            hearthLockedBody1 = null;
            hearthLockedBody2 = null;
            updateHearthDisplay();
            
            const cookBtn = document.getElementById('cook-hearth-btn');
            if (cookBtn) cookBtn.onclick = cookHearth;
        }
        
        function showHearthFoodMenu(slotNumber) {
            // Count feedable/cookable items
            const itemCounts = {};
            for (const key in gs.inventory) {
                const itemId = gs.inventory[key];
                if (ITEM_DATA[itemId] && (ITEM_DATA[itemId].feedable || ITEM_DATA[itemId].cookable)) {
                    itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
                }
            }
            
            // Close existing menu if any
            const existingMenu = document.getElementById('hearth-food-menu');
            if (existingMenu) {
                existingMenu.remove();
                return;
            }
            
            const menu = document.createElement('div');
            menu.id = 'hearth-food-menu';
            menu.style.cssText = 'position:fixed;bottom:300px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.98);border:3px solid #f59e0b;border-radius:10px;padding:15px;z-index:10001;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
            
            const header = document.createElement('div');
            header.style.cssText = 'font-weight:bold;margin-bottom:10px;color:#333;font-size:16px;';
            header.textContent = 'Select Ingredient:';
            menu.appendChild(header);
            
            if (Object.keys(itemCounts).length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'color:#999;font-style:italic;padding:10px;';
                empty.textContent = 'No ingredients in inventory';
                menu.appendChild(empty);
            } else {
                for (const itemId in itemCounts) {
                    const count = itemCounts[itemId];
                    const name = ITEM_DATA[itemId].name;
                    
                    const btn = document.createElement('div');
                    btn.style.cssText = 'width:100%;padding:12px;margin:5px 0;font-size:16px;border:2px solid #f59e0b;border-radius:8px;background:#fff;cursor:pointer;display:flex;justify-content:space-between;';
                    btn.innerHTML = '<span>' + name + '</span><span style="color:#666;font-weight:bold;">x ' + count + '</span>';
                    btn.onclick = function() { selectHearthFood(slotNumber, itemId); };
                    menu.appendChild(btn);
                }
            }
            
            const cancelBtn = document.createElement('div');
            cancelBtn.style.cssText = 'width:100%;padding:10px;margin-top:10px;background:#999;color:#fff;border:2px solid #666;border-radius:8px;cursor:pointer;text-align:center;';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = closeHearthFoodMenu;
            menu.appendChild(cancelBtn);
            
            document.body.appendChild(menu);
        }
        
        function selectHearthFood(slotNumber, itemId) {
            if (slotNumber === 1) {
                hearthSlot1ItemId = itemId;
            } else {
                hearthSlot2ItemId = itemId;
            }
            
            updateHearthDisplay();
            closeHearthFoodMenu();
        }
        
        function closeHearthFoodMenu() {
            const menu = document.getElementById('hearth-food-menu');
            if (menu) menu.remove();
        }
        
        function updateHearthDisplay() {
            const slot1Icon = document.getElementById('hearth-slot-1-icon');
            const slot1Name = document.getElementById('hearth-slot-1-name');
            const slot2Icon = document.getElementById('hearth-slot-2-icon');
            const slot2Name = document.getElementById('hearth-slot-2-name');
            
            if (slot1Icon && slot1Name) {
                if (hearthSlot1ItemId) {
                    const item = ITEM_DATA[hearthSlot1ItemId];
                    slot1Icon.textContent = item.emoji || '📦';
                    slot1Name.textContent = item.name;
                    slot1Name.style.display = 'block';
                } else {
                    slot1Icon.textContent = '+';
                    slot1Name.textContent = '';
                    slot1Name.style.display = 'none';
                }
            }
            
            if (slot2Icon && slot2Name) {
                if (hearthSlot2ItemId) {
                    const item = ITEM_DATA[hearthSlot2ItemId];
                    slot2Icon.textContent = item.emoji || '📦';
                    slot2Name.textContent = item.name;
                    slot2Name.style.display = 'block';
                } else {
                    slot2Icon.textContent = '+';
                    slot2Name.textContent = '';
                    slot2Name.style.display = 'none';
                }
            }
        }
        
        let hearthCooking = false;
        
        function cookHearth() {
            if (!hearthSlot1ItemId || !hearthSlot2ItemId) {
                notify('❌ Drop two ingredients first!', 'warning');
                return;
            }
            if (hearthCooking) return;
            
            const recipe = checkRecipe(hearthSlot1ItemId, hearthSlot2ItemId);
            
            // Recipe locked behind cooking level
            if (recipe && recipe.locked) {
                notify('🔒 ' + recipe.name + ' requires Cooking Lv ' + recipe.reqLevel + '!', 'warning');
                hearthCooking = false;
                return;
            }
            
            const cookBtn = document.getElementById('cook-hearth-btn');
            const progressContainer = document.getElementById('hearth-progress-container');
            const progressBar = document.getElementById('hearth-progress-bar');
            const clearBtn1 = document.getElementById('hearth-clear-1');
            const clearBtn2 = document.getElementById('hearth-clear-2');
            
            // Lock UI during cooking
            hearthCooking = true;
            const cookSound = document.getElementById('cook-sound');
            if (cookSound) { cookSound.currentTime = 0; cookSound.play().catch(() => {}); }
            if (cookBtn) { cookBtn.style.opacity = '0.5'; cookBtn.style.cursor = 'not-allowed'; cookBtn.onclick = null; }
            if (clearBtn1) clearBtn1.style.display = 'none';
            if (clearBtn2) clearBtn2.style.display = 'none';
            
            // Show and animate progress bar over 5 seconds
            if (progressContainer) progressContainer.style.display = 'block';
            if (progressBar) {
                progressBar.style.width = '0%';
                // Use requestAnimationFrame for smooth fill
                const duration = 5000;
                const start = performance.now();
                function animateBar(now) {
                    const elapsed = now - start;
                    const pct = Math.min((elapsed / duration) * 100, 100);
                    progressBar.style.width = pct + '%';
                    if (pct < 100) {
                        requestAnimationFrame(animateBar);
                    }
                }
                requestAnimationFrame(animateBar);
            }
            
            // Deliver result after 5 seconds
            setTimeout(() => {
                finishCookingHearth(recipe);
            }, 5000);
        }
        
        function finishCookingHearth(recipe) {
            const resultDiv = document.getElementById('hearth-result');
            const progressContainer = document.getElementById('hearth-progress-container');
            const progressBar = document.getElementById('hearth-progress-bar');
            const cookBtn = document.getElementById('cook-hearth-btn');
            
            // Hide progress bar
            if (progressContainer) progressContainer.style.display = 'none';
            if (progressBar) progressBar.style.width = '0%';
            
            // Remove locked bodies from physics first
            if (hearthLockedBody1) { hearthLockedBody1.render.opacity = 1; World.remove(basketEngine.world, hearthLockedBody1); const i = basketBodies.indexOf(hearthLockedBody1); if (i !== -1) basketBodies.splice(i,1); hearthLockedBody1 = null; }
            if (hearthLockedBody2) { hearthLockedBody2.render.opacity = 1; World.remove(basketEngine.world, hearthLockedBody2); const i = basketBodies.indexOf(hearthLockedBody2); if (i !== -1) basketBodies.splice(i,1); hearthLockedBody2 = null; }
            
            if (recipe) {
                // Remove from inventory data
                let removed1 = false, removed2 = false;
                for (const key in gs.inventory) {
                    if (!removed1 && gs.inventory[key] === hearthSlot1ItemId) { delete gs.inventory[key]; removed1 = true; }
                    else if (!removed2 && gs.inventory[key] === hearthSlot2ItemId) { delete gs.inventory[key]; removed2 = true; }
                    if (removed1 && removed2) break;
                }
                setTimeout(() => {
                    addItem(recipe.result, 1);
                    addSkillXP('cooking', 15);
                }, 300);
                
                if (resultDiv) {
                    resultDiv.textContent = '✨ Cooked ' + recipe.name + '!';
                    resultDiv.style.color = '#4caf50';
                    setTimeout(() => resultDiv.textContent = '', 3000);
                }
                notify('✨ Cooked ' + recipe.name + '!');
                document.querySelectorAll('.hspeck').forEach(s => {
                    s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                    s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
                });
                
                // 0.01% chance to find Red Frog (if not already collected)
                if (!gs.frogs.frog_red && Math.random() < 0.0001) {
                    addItem('frog_red', 1);
                    notify('🔴🐸 A Red Frog hopped out of the flames!', 'achievement');
                }
            } else {
                // Burnt!
                let removed1 = false, removed2 = false;
                for (const key in gs.inventory) {
                    if (!removed1 && gs.inventory[key] === hearthSlot1ItemId) { delete gs.inventory[key]; removed1 = true; }
                    else if (!removed2 && gs.inventory[key] === hearthSlot2ItemId) { delete gs.inventory[key]; removed2 = true; }
                    if (removed1 && removed2) break;
                }
                setTimeout(() => {
                    addItem('burnt_food', 1);
                    addSkillXP('cooking', 5);
                }, 300);
                
                if (resultDiv) {
                    resultDiv.textContent = '🔥 OH NO! Food burnt!';
                    resultDiv.style.color = '#f44336';
                    setTimeout(() => resultDiv.textContent = '', 3000);
                }
                notify('💀 Burnt the food!');
            }
            
            // Reset slots and unlock UI
            hearthSlot1ItemId = null;
            hearthSlot2ItemId = null;
            hearthCooking = false;
            ['1','2'].forEach(n => {
                const s = document.getElementById(`hearth-slot-${n}`); if (s) { s.innerHTML = `<span id="hearth-slot-${n}-icon" style="font-size:32px;line-height:1;">+</span><span id="hearth-slot-${n}-name" style="font-size:8px;font-weight:bold;color:#444;text-align:center;margin-top:2px;max-width:68px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:none;"></span>`; s.style.border='3px dashed #f59e0b'; s.style.boxShadow=''; }
                const nm = document.getElementById(`hearth-slot-${n}-name`); if (nm) nm.textContent='';
            });
            if (cookBtn) { cookBtn.style.opacity = '1'; cookBtn.style.cursor = 'pointer'; cookBtn.onclick = cookHearth; }
            
            updateHearthDisplay();
            updateInventoryCounter();
            save();
        }
        
        // Helper function to remove ingredients from physics basket
        function removeIngredientsFromBasket(itemId1, itemId2) {
            let removed1 = false, removed2 = false;
            
            for (let i = basketBodies.length - 1; i >= 0; i--) {
                const body = basketBodies[i];
                if (!removed1 && body.itemId === itemId1) {
                    World.remove(basketEngine.world, body);
                    basketBodies.splice(i, 1);
                    removed1 = true;
                } else if (!removed2 && body.itemId === itemId2) {
                    World.remove(basketEngine.world, body);
                    basketBodies.splice(i, 1);
                    removed2 = true;
                }
                if (removed1 && removed2) break;
            }
            
            updateInventoryCounter();
        }

        // ===== COOKING MINIGAMES =====
        // Kitchen: Rhythm game - click when spoon flashes
        let kitchenScore = 0;
        let kitchenActive = false;
        let kitchenInterval = null;
        let kitchenFlashing = false;
        
        
        // Shack geode cracking functions
        let shackGeodeSlot = null;
        let shackCrackCount = 0;
        let shackLockedBody = null;
        
        function lockGeodeInShackSlot(body) {
            const itemId = body.itemId;
            const data = ITEM_DATA[itemId];
            if (!data || !data.crackable) return;
            
            // If already something locked, clear it first
            if (shackLockedBody) clearShackSlot();
            
            // Store reference to the locked body
            shackLockedBody = body;
            shackGeodeSlot = itemId;
            
            // Snap to center and freeze
            const slotEl = document.getElementById('shack-geode-slot');
            const slotRect = slotEl.getBoundingClientRect();
            const containerEl = document.getElementById('basket-container');
            const containerRect = containerEl.getBoundingClientRect();
            const styleScale = containerEl.style.transform || '';
            const scaleMatch = styleScale.match(/scale\(([^)]+)\)/);
            const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 0.8;
            
            const slotCenterX = (slotRect.left + slotRect.width / 2 - containerRect.left) / scale;
            const slotCenterY = (slotRect.top + slotRect.height / 2 - containerRect.top) / scale;
            
            Matter.Body.setPosition(body, { x: slotCenterX, y: slotCenterY });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            Matter.Body.setAngle(body, 0);
            Matter.Body.setStatic(body, true);
            
            // Hide the physics body visually by making it tiny and offscreen
            // We'll show it as a DOM element instead for clean display
            body.render.opacity = 0;
            
            // Update slot UI - show geode image inside the slot
            const icon = document.getElementById('shack-slot-icon');
            const nameEl = document.getElementById('shack-slot-name');
            const clearBtn = document.getElementById('shack-slot-clear');
            const slotDiv = document.getElementById('shack-geode-slot');
            const imgSrc = ITEM_IMAGES[itemId];
            
            if (icon) {
                if (imgSrc) {
                    icon.style.display = 'flex';
                    icon.style.width = '52px';
                    icon.style.height = '52px';
                    icon.style.background = '';
                    icon.style.borderRadius = '';
                    icon.style.border = '';
                    icon.style.boxShadow = '';
                    icon.style.animation = 'geodeLock 0.3s ease-out';
                    icon.innerHTML = `<img src="${imgSrc}" style="width:44px;height:44px;object-fit:contain;animation:geodeLock 0.3s ease-out;" />`;
                } else {
                    icon.style.display = 'flex';
                    icon.style.animation = 'geodeLock 0.3s ease-out';
                    icon.textContent = '💎';
                }
            }
            if (nameEl) { nameEl.textContent = data.name.replace(/[^\w\s'-]/g, '').trim(); nameEl.style.display = ''; }
            if (clearBtn) clearBtn.style.display = 'block';
            if (slotDiv) {
                slotDiv.style.border = '3px solid #4ade80';
                slotDiv.style.boxShadow = '0 0 10px rgba(74,222,128,0.5)';
                slotDiv.style.animation = 'slotLock 0.3s ease-out';
            }
            
            // Enable crack button
            const crackBtn = document.getElementById('crack-geode-btn');
            if (crackBtn) {
                crackBtn.style.background = '#4ade80';
                crackBtn.style.borderColor = '#22c55e';
                crackBtn.style.opacity = '1';
                crackBtn.style.cursor = 'pointer';
            }
            
            shackCrackCount = 0;
            updateShackProgress();
            
            if (!gs.tools.hammer) {
                notify('⚠️ You need a 🔨 Hammer to crack! (Shop)');
            } else {
                notify('Geode locked! Tap 🔨 20 times to crack!');
            }
        }
        
        function clearShackSlot() {
            // Unfreeze the body and fling it back into the basket area
            if (shackLockedBody) {
                shackLockedBody.render.opacity = 1; // Make visible again
                Matter.Body.setStatic(shackLockedBody, false);
                Matter.Body.setVelocity(shackLockedBody, { 
                    x: (Math.random() - 0.5) * 10, 
                    y: -8 
                });
                shackLockedBody = null;
            }
            
            shackGeodeSlot = null;
            shackCrackCount = 0;
            const resetBar = document.getElementById('shack-progress-bar');
            const resetLabel = document.getElementById('shack-progress-display');
            if (resetBar) { resetBar.style.width = '0%'; }
            if (resetLabel) resetLabel.textContent = 'Crack!';
            
            // Reset slot UI
            const icon = document.getElementById('shack-slot-icon');
            const nameEl = document.getElementById('shack-slot-name');
            const clearBtn = document.getElementById('shack-slot-clear');
            const slotDiv = document.getElementById('shack-geode-slot');
            
            if (icon) {
                icon.innerHTML = '';
                icon.textContent = '🪨';
                icon.style.display = '';
                icon.style.width = '';
                icon.style.height = '';
                icon.style.background = '';
                icon.style.borderRadius = '';
                icon.style.border = '';
                icon.style.boxShadow = '';
                icon.style.animation = '';
            }
            if (nameEl) { nameEl.textContent = ''; nameEl.style.display = 'none'; }
            if (clearBtn) clearBtn.style.display = 'none';
            if (slotDiv) {
                slotDiv.style.border = '3px dashed #8b7355';
                slotDiv.style.boxShadow = '';
                slotDiv.style.animation = '';
            }
            
            const crackBtn = document.getElementById('crack-geode-btn');
            if (crackBtn) {
                crackBtn.style.background = '#a855f7';
                crackBtn.style.borderColor = '#fff';
                crackBtn.style.opacity = '1';
                crackBtn.style.cursor = 'pointer';
            }
            
            updateShackProgress();
            notify('Geode removed from slot.');
        }
        
        function showShackInventoryMenu() {
            // Now handled by drag-drop
            notify('Drag a geode from your bag into the slot! 🪨');
        }
        
        function updateShackProgress() {
            const bar = document.getElementById('shack-progress-bar');
            const label = document.getElementById('shack-progress-display');
            const pct = Math.min(shackCrackCount / 10 * 100, 100);
            if (bar) bar.style.width = pct + '%';
            if (label) label.textContent = shackCrackCount >= 10 ? 'Cracking!' : 'Crack!';
        }
        
        function updateCrackButton() {
            const crackBtn = document.getElementById('crack-geode-btn');
            if (!crackBtn) return;
            
            const hasHammer = gs.tools.hammer || false;
            
            if (hasHammer) {
                crackBtn.style.background = '#a855f7';
                crackBtn.style.borderColor = '#fff';
                crackBtn.style.opacity = '1';
                crackBtn.style.cursor = 'pointer';
            } else {
                crackBtn.style.background = '#9ca3af';
                crackBtn.style.borderColor = '#fff';
                crackBtn.style.opacity = '0.5';
                crackBtn.style.cursor = 'not-allowed';
            }
        }
        
        function crackGeode() {
            if (!gs.tools.hammer) {
                notify('❌ You need a 🔨 Hammer! Buy one from the Shop.', 'warning');
                return;
            }
            if (!shackGeodeSlot) {
                notify('❌ Select a geode first!', 'warning');
                return;
            }
            
            shackCrackCount++;
            updateShackProgress();
            
            // --- Shake the progress bar ---
            const slot = document.getElementById('shack-geode-slot');
            const barContainer = document.getElementById('shack-bar-container');
            if (barContainer) {
                barContainer.classList.remove('crack-shaking');
                void barContainer.offsetWidth;
                barContainer.classList.add('crack-shaking');
                barContainer.addEventListener('animationend', () => barContainer.classList.remove('crack-shaking'), { once: true });
            }
            
            // --- Flash the progress bar fill ---
            const bar = document.getElementById('shack-progress-bar');
            if (bar) {
                bar.style.animation = 'none';
                void bar.offsetWidth;
                bar.style.animation = 'crackFlash 0.35s ease-out';
                bar.addEventListener('animationend', () => bar.style.animation = '', { once: true });
            }
            // --- Burst gem specks on crack hit ---
            document.querySelectorAll('.ssspeck').forEach(s => {
                s.classList.remove('burst'); void s.offsetWidth; s.classList.add('burst');
                s.addEventListener('animationend', () => s.classList.remove('burst'), { once: true });
            });
            
            // --- Pulse + darken the crack button ---
            const btn = document.getElementById('crack-geode-btn');
            if (btn) {
                btn.style.background = '#581c87';
                btn.style.animation = 'none';
                void btn.offsetWidth;
                btn.style.animation = 'crackPulse 0.25s ease-out';
                btn.addEventListener('animationend', () => {
                    btn.style.animation = '';
                    btn.style.background = '#a855f7';
                }, { once: true });
            }
            
            // --- Play pick sound at varying pitch ---
            const pickSound = document.getElementById('pickaxe-sound');
            if (pickSound) {
                pickSound.currentTime = 0;
                pickSound.playbackRate = 0.8 + (shackCrackCount / 10) * 0.5;
                pickSound.play().catch(() => {});
            }
            
            if (shackCrackCount >= 10) {
                finishCracking();
            }
        }
        
        function finishCracking() {
            console.log('Cracking complete!');
            
            const crackedGeodeId = shackGeodeSlot;
            
            const result = document.getElementById('shack-result');
            
            // STEP 1: Remove the locked physics body immediately
            if (shackLockedBody) {
                shackLockedBody.render.opacity = 1;
                World.remove(basketEngine.world, shackLockedBody);
                const idx = basketBodies.indexOf(shackLockedBody);
                if (idx !== -1) basketBodies.splice(idx, 1);
                shackLockedBody = null;
            }
            
            // STEP 2: Remove geode from inventory data
            for (const key in gs.inventory) {
                if (gs.inventory[key] === crackedGeodeId) {
                    delete gs.inventory[key];
                    break;
                }
            }
            
            // STEP 3: Reset slot UI immediately
            const icon = document.getElementById('shack-slot-icon');
            const nameEl = document.getElementById('shack-slot-name');
            const clearBtn = document.getElementById('shack-slot-clear');
            const slotDiv = document.getElementById('shack-geode-slot');
            if (icon) { icon.textContent = '🪨'; icon.style.display = ''; }
            if (nameEl) { nameEl.textContent = ''; nameEl.style.display = 'none'; }
            if (clearBtn) clearBtn.style.display = 'none';
            if (slotDiv) slotDiv.style.border = '3px dashed #8b7355';
            
            const crackBtn = document.getElementById('crack-geode-btn');
            if (crackBtn) {
                crackBtn.style.background = '#a855f7';
                crackBtn.style.borderColor = '#fff';
                crackBtn.style.opacity = '1';
                crackBtn.style.cursor = 'pointer';
            }
            
            shackGeodeSlot = null;
            shackCrackCount = 0;
            const resetBar = document.getElementById('shack-progress-bar');
            const resetLabel = document.getElementById('shack-progress-display');
            if (resetBar) { resetBar.style.width = '0%'; }
            if (resetLabel) resetLabel.textContent = 'Crack!';
            
            save();
            updateInventoryCounter();
            updateShackProgress();
            
            // STEP 4: Determine loot using geode tier + prospecting level
            
            // Base gem chance per geode type
            const GEODE_GEM_CHANCE = {
                'small_geode':   0.10,
                'medium_geode':  0.20,
                'large_geode':   0.30,
                'rare_geode':    0.45,
                'rainbow_geode': 0.65,
            };
            
            // Gem tables per geode tier: [itemId, weight]
            // Higher tier = more valuable gems weighted higher
            const GEODE_GEM_TABLE = {
                'small_geode':   [ ['emerald',30],['ruby',25],['sapphire',20],['amethyst',15],['topaz',10] ],
                'medium_geode':  [ ['emerald',20],['ruby',20],['sapphire',20],['amethyst',20],['topaz',20] ],
                'large_geode':   [ ['emerald',10],['ruby',15],['sapphire',20],['amethyst',25],['topaz',30] ],
                'rare_geode':    [ ['emerald', 5],['ruby',10],['sapphire',15],['amethyst',25],['topaz',45] ],
                'rainbow_geode': [ ['emerald', 2],['ruby', 5],['sapphire',10],['amethyst',15],['topaz',18],['diamond',50] ],
            };
            
            const prospBonus = Math.min((gs.prospectingLevel || 1) - 1, 9) * 0.01; // +1% per level up to +9%
            const baseGemChance = GEODE_GEM_CHANCE[crackedGeodeId] || 0.10;
            const gemChance = Math.min(baseGemChance + prospBonus, 0.95);
            const isGem = Math.random() < gemChance;
            
            setTimeout(() => {
                if (isGem) {
                    // Pick which gem from weighted table
                    const table = GEODE_GEM_TABLE[crackedGeodeId] || GEODE_GEM_TABLE['small_geode'];
                    const totalWeight = table.reduce((s, e) => s + e[1], 0);
                    let r = Math.random() * totalWeight;
                    let gemId = table[0][0];
                    for (const [id, weight] of table) {
                        r -= weight;
                        if (r <= 0) { gemId = id; break; }
                    }
                    const gemData = ITEM_DATA[gemId];
                    const emoji = gemData.emoji || '💎';
                    const coins = gemData.sellValue;
                    addItem(gemId, 1);
                    notify(emoji + ' Found a ' + gemData.name + '! (' + coins + ' coins)');
                } else {
                    addItem('rock', 1);
                    notify('😐 Just a rock...');
                }
                
                // 0.01% chance to find Purple Frog (if not already collected)
                if (!gs.frogs.frog_purple && Math.random() < 0.0001) {
                    addItem('frog_purple', 1);
                    notify('🟣🐸 A Purple Frog was hiding inside the geode!', 'achievement');
                }
                
                checkProspectingLevelUp();
                

            }, 400);
        }
        
        function updateProspectingDisplay() {
            const title = document.getElementById('shack-title');
            if (title) {
                title.textContent = `⛏️ Prospecting Level ${gs.prospectingLevel}`;
            }
            
            // Update level-up chance info
            const info = document.getElementById('shack-levelup-info');
            if (info) {
                let chance = 0;
                switch(gs.prospectingLevel) {
                    case 1: chance = 90; break;
                    case 2: chance = 75; break;
                    case 3: chance = 50; break;
                    case 4: chance = 25; break;
                    default: chance = 10; break;
                }
                
                if (gs.prospectingLevel >= 10) {
                    info.textContent = 'Max Level Reached!';
                    info.style.color = '#2e7d32';
                } else {
                    info.textContent = `${chance}% chance to level up with Small Geode`;
                    info.style.color = '#3e2723';
                }
            }
        }
        
        function checkProspectingLevelUp() {
            // Max level is 10
            if (gs.prospectingLevel >= 10) return;
            
            // Determine level-up chance based on current level
            let levelUpChance = 0;
            switch(gs.prospectingLevel) {
                case 1: levelUpChance = 0.90; break; // 90%
                case 2: levelUpChance = 0.75; break; // 75%
                case 3: levelUpChance = 0.50; break; // 50%
                case 4: levelUpChance = 0.25; break; // 25%
                default: levelUpChance = 0.10; break; // 10% for level 5+
            }
            
            const roll = Math.random();
            console.log(`Prospecting roll: ${roll} vs ${levelUpChance} (Level ${gs.prospectingLevel})`);
            
            if (roll < levelUpChance) {
                gs.prospectingLevel++;
                save();
                updateProspectingDisplay();
                notify(`⛏️ Prospecting Level UP! Now Level ${gs.prospectingLevel}!`, 'levelup');
            }
        }
        
        // Kitchen ingredient slot functions
        let kitchenIngredientSlot = null;
        let burnChance = 0.10; // 10% chance to burn
                
        function showKitchenInventoryMenu() {
            console.log('showKitchenInventoryMenu called');
            
            console.log('Full inventory:', gs.inventory);
            
            const itemCounts = {};
            for (const key in gs.inventory) {
                const itemId = gs.inventory[key];
                console.log('Checking item:', key, '=', itemId);
                console.log('  ITEM_DATA exists:', !!ITEM_DATA[itemId]);
                if (ITEM_DATA[itemId]) {
                    console.log('  cookable:', ITEM_DATA[itemId].cookable);
                }
                
                // Count items that are cookable
                if (ITEM_DATA[itemId] && ITEM_DATA[itemId].cookable) {
                    itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
                    console.log('  Added to menu!');
                }
            }
            
            console.log('Final item counts:', itemCounts);
            
            const existingMenu = document.getElementById('kitchen-inventory-menu');
            if (existingMenu) {
                existingMenu.remove();
                return;
            }
            
            const menu = document.createElement('div');
            menu.id = 'kitchen-inventory-menu';
            menu.style.cssText = 'position:fixed;bottom:300px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.98);border:3px solid #333;border-radius:10px;padding:15px;z-index:10001;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.5);';
            
            const header = document.createElement('div');
            header.style.cssText = 'font-weight:bold;margin-bottom:10px;color:#333;font-size:16px;';
            header.textContent = 'Select Ingredient:';
            menu.appendChild(header);
            
            if (Object.keys(itemCounts).length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'color:#999;font-style:italic;padding:10px;';
                empty.textContent = 'No cookable items';
                menu.appendChild(empty);
            } else {
                for (const itemId in itemCounts) {
                    const count = itemCounts[itemId];
                    const emoji = itemId === 'fish' ? '🐟' : '🥕';
                    const name = itemId === 'fish' ? 'Fish' : 'Carrot';
                    
                    const btn = document.createElement('div');
                    btn.style.cssText = 'width:100%;padding:12px;margin:5px 0;font-size:16px;border:2px solid #333;border-radius:8px;background:#fff;cursor:pointer;display:flex;justify-content:space-between;';
                    btn.innerHTML = '<span>' + emoji + ' ' + name + '</span><span style="color:#666;font-weight:bold;">x ' + count + '</span>';
                    btn.onclick = function() { selectKitchenIngredient(itemId); };
                    menu.appendChild(btn);
                }
            }
            
            const cancelBtn = document.createElement('div');
            cancelBtn.style.cssText = 'width:100%;padding:10px;margin-top:10px;background:#999;color:#fff;border:2px solid #666;border-radius:8px;cursor:pointer;text-align:center;';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = closeKitchenInventoryMenu;
            menu.appendChild(cancelBtn);
            
            document.body.appendChild(menu);
            console.log('Menu added to DOM');
        }
        
        function updateKitchenScore() {
            const display = document.getElementById('kitchen-score-display');
            if (display) {
                display.textContent = 'Score: ' + kitchenScore + ' / 5';
            }
        }
        
        function finishCooking() {
            console.log('Cooking complete!');
            
            // Roll for burn chance
            const roll = Math.random();
            const isBurnt = roll < burnChance;
            console.log('Burn roll:', roll, 'Burnt:', isBurnt);
            
            const result = document.getElementById('kitchen-result');
            
            // FIRST: Remove ingredient from inventory AND basket physics
            let removedKey = null;
            for (const key in gs.inventory) {
                if (gs.inventory[key] === kitchenIngredientSlot) {
                    delete gs.inventory[key];
                    removedKey = key;
                    console.log('Removed from inventory:', key);
                    break;
                }
            }
            
            // Also remove from basket physics if basket is open
            if (removedKey && basketEngine) {
                const bodyIndex = basketBodies.findIndex(b => b.itemKey === removedKey);
                if (bodyIndex !== -1) {
                    const body = basketBodies[bodyIndex];
                    World.remove(basketEngine.world, body);
                    basketBodies.splice(bodyIndex, 1);
                    console.log('Removed from basket physics:', removedKey);
                }
            }
            
            save();
            updateInventoryCounter();
            
            // THEN: Add food item (or burnt food) and XP
            if (isBurnt) {
                result.textContent = '🔥 OH NO! Food burnt! +1 Burnt Food';
                addItem('burnt_food', 1); // Note: itemId is 'burnt_food'
                addSkillXP('cooking', 5); // Half XP for burnt food
                notify('💀 Burnt the food!');
            } else {
                result.textContent = '🎉 Cooked into food! +1 Food';
                addItem('food', 1);
                addSkillXP('cooking', 10);
                notify('✅ Perfectly cooked!');
            }
            
            // Reset kitchen
            kitchenIngredientSlot = null;
            kitchenScore = 0;
            
            const icon = document.getElementById('kitchen-slot-icon');
            if (icon) icon.textContent = '+';
            
            const stirBtn = document.getElementById('stir-kitchen-btn');
            if (stirBtn) {
                stirBtn.style.background = '#ffe0e0';
                stirBtn.style.borderColor = '#ff6b6b';
            }
            
            updateKitchenScore();
            
            setTimeout(() => {
                result.textContent = '';
            }, 3000);
        }
        
        function selectKitchenIngredient(itemId) {
            console.log('Selected:', itemId);
            kitchenIngredientSlot = itemId;
            
            // Update slot icon
            const icon = document.getElementById('kitchen-slot-icon');
            if (icon) {
                icon.textContent = itemId === 'fish' ? '🐟' : '🥕';
            }
            
            // Make stir button green (ready to cook)
            const stirBtn = document.getElementById('stir-kitchen-btn');
            if (stirBtn) {
                stirBtn.style.background = '#4ade80';
                stirBtn.style.borderColor = '#22c55e';
            }
            
            // Reset score
            kitchenScore = 0;
            updateKitchenScore();
            
            closeKitchenInventoryMenu();
            notify('Ready to cook! Click STIR 5 times!');
        }
        
        function closeKitchenInventoryMenu() {
            const menu = document.getElementById('kitchen-inventory-menu');
            if (menu) menu.remove();
        }
        
function initKitchenGame() {
            kitchenScore = 0;
            kitchenActive = false;
            kitchenFlashing = false;
            document.getElementById('kitchen-score-display').textContent = 'Score: 0 / 5';
            document.getElementById('kitchen-result').textContent = '';
            document.getElementById('kitchen-spoon').style.transform = 'scale(1)';
            startKitchenGame();
        }
        
        function startKitchenGame() {
            kitchenActive = true;
            kitchenScore = 0;
            scheduleKitchenFlash();
        }
        
        function scheduleKitchenFlash() {
            if (!kitchenActive) return;
            
            const delay = 1000 + Math.random() * 2000; // 1-3 seconds
            setTimeout(() => {
                if (!kitchenActive) return;
                kitchenFlashing = true;
                const spoon = document.getElementById('kitchen-spoon');
                spoon.style.transform = 'scale(1.5)';
                spoon.style.filter = 'brightness(1.5)';
                
                setTimeout(() => {
                    kitchenFlashing = false;
                    spoon.style.transform = 'scale(1)';
                    spoon.style.filter = 'brightness(1)';
                    
                    if (kitchenActive && kitchenScore < 5) {
                        scheduleKitchenFlash();
                    }
                }, 800);
            }, delay);
        }
        
        function stirKitchen() {
            console.log('Stir clicked, ingredient:', kitchenIngredientSlot, 'score:', kitchenScore);
            
            // Check if ingredient is selected
            if (!kitchenIngredientSlot) {
                notify('❌ Select an ingredient first!');
                return;
            }
            
            // Increment score
            kitchenScore++;
            updateKitchenScore();
            
            // Check if done (5 clicks)
            if (kitchenScore >= 5) {
                finishCooking();
            }
            if (!kitchenActive) return;
            
            if (kitchenFlashing) {
                kitchenScore++;
                document.getElementById('kitchen-score-display').textContent = 'Score: ' + kitchenScore + ' / 5';
                
                if (kitchenScore >= 5) {
                    endKitchenGame(true);
                }
            } else {
                endKitchenGame(false);
            }
        }
        
        function endKitchenGame(success) {
            kitchenActive = false;
            kitchenFlashing = false;
            const result = document.getElementById('kitchen-result');
            
            if (success) {
                result.textContent = '🎉 Perfect dish! +1 Food';
                addItem('food', 1);
                addSkillXP('cooking', 10);
                clearKitchenIngredient();
                notify('✅ Cooked ' + kitchenIngredientSlot + ' into food!');
            } else {
                result.textContent = '❌ Burned! Wrong timing!';
                clearKitchenIngredient();
            }
            
            setTimeout(() => initKitchenGame(), 2000);
        }
        
        function stopKitchenGame() {
            kitchenActive = false;
            kitchenFlashing = false;
        }
        
        // Grill: Temperature control - keep temp in green zone
        let grillTemp = 50;
        let grillActive = false;
        let grillTimer = null;
        let grillTimeLeft = 10.0;
        let grillGoodTime = 0;
        
        function initGrillGame() {
            grillTemp = 50;
            grillActive = false;
            grillTimeLeft = 10.0;
            grillGoodTime = 0;
            updateGrillDisplay();
            document.getElementById('grill-result').textContent = '';
            document.getElementById('grill-timer-display').textContent = 'Time: 10.0s';
            startGrillGame();
        }
        
        function startGrillGame() {
            grillActive = true;
            grillTimeLeft = 10.0;
            grillGoodTime = 0;
            
            grillTimer = setInterval(() => {
                grillTimeLeft -= 0.1;
                document.getElementById('grill-timer-display').textContent = 'Time: ' + grillTimeLeft.toFixed(1) + 's';
                
                // Temperature naturally drops
                grillTemp = Math.max(0, grillTemp - 0.5);
                updateGrillDisplay();
                
                // Check if in green zone (40-60%)
                if (grillTemp >= 40 && grillTemp <= 60) {
                    grillGoodTime += 0.1;
                }
                
                if (grillTimeLeft <= 0) {
                    endGrillGame();
                }
            }, 100);
        }
        
        function grillHeatUp() {
            if (!grillActive) return;
            grillTemp = Math.min(100, grillTemp + 5);
            updateGrillDisplay();
        }
        
        function grillCoolDown() {
            if (!grillActive) return;
            grillTemp = Math.max(0, grillTemp - 5);
            updateGrillDisplay();
        }
        
        function updateGrillDisplay() {
            const bar = document.getElementById('grill-temp-bar');
            const display = document.getElementById('grill-temp-display');
            bar.style.width = grillTemp + '%';
            display.textContent = 'Temp: ' + Math.round(grillTemp) + '%';
            
            // Color based on temp
            if (grillTemp >= 40 && grillTemp <= 60) {
                bar.style.background = '#4caf50';
            } else if (grillTemp > 60) {
                bar.style.background = '#ff6b6b';
            } else {
                bar.style.background = '#2196f3';
            }
        }
        
        function endGrillGame() {
            clearInterval(grillTimer);
            grillActive = false;
            const result = document.getElementById('grill-result');
            
            if (grillGoodTime >= 7.0) {
                result.textContent = '🎉 Perfectly grilled! +1 Food';
                addItem('food', 1);
                addSkillXP('cooking', 15);
            } else {
                result.textContent = '❌ Over/undercooked! (' + grillGoodTime.toFixed(1) + 's/7s in zone)';
            }
            
            setTimeout(() => initGrillGame(), 2500);
        }
        
        function stopGrillGame() {
            clearInterval(grillTimer);
            grillActive = false;
        }
        
// ===== GAME ACTIONS =====
        function hatchSlime() {
            // Guard: Don't hatch if already hatched
            if (gs.hatched) {
                console.log('Slime already hatched, ignoring duplicate call');
                return;
            }
            
            console.log('Hatching slime');
            
            // Randomly select one of 5 slimes (equal chances)
            const slimeVariants = [
                'slime1.png',    // Blue slime
                'slime2.png',    // Orange/red slime
                'slime3.png',    // Green slime
                'slime4.png',    // Yellow slime
                'slime5.png'     // Pink slime
            ];
            
            const randomIndex = Math.floor(Math.random() * slimeVariants.length);
            const chosenSlime = slimeVariants[randomIndex];
            
            // Save which slime was chosen - SET THIS IMMEDIATELY to prevent duplicate calls
            gs.hatched = true;
            gs.slimeVariant = chosenSlime;
            save(); // Save immediately to persist the hatched state
            
            // Set the slime image
            const slimeElement = document.getElementById('slime-square');
            const imagePath = `./slimehearth-assets/images/${chosenSlime}`;
            console.log('Trying to load slime image from:', imagePath);
            slimeElement.style.backgroundImage = `url('${imagePath}')`;
            slimeElement.classList.add('visible');
            
            const crackSound = document.getElementById('egg-crack-sound');
            if (crackSound) { crackSound.currentTime = 0; crackSound.play().catch(() => {}); }
            
            notify('🎉 Your slime has hatched!');
            
            // Prompt for slime name after a brief delay
            setTimeout(() => {
                const name = prompt('What would you like to name your slime?', 'Slime');
                if (name && name.trim() !== '') {
                    gs.slimeName = name.trim();
                    notify(`Meet ${gs.slimeName}! 🎉`);
                } else {
                    gs.slimeName = 'Slime';
                }
                save();
                updateUI();
                
                // Open basket permanently after hatching
                openBasketPermanently();
            }, 600);
            
            // Check if image loaded
            setTimeout(() => {
                const img = new Image();
                img.onload = () => {
                    console.log('✅ Slime image loaded successfully!');
                };
                img.onerror = () => {
                    console.error('❌ Failed to load slime image!');
                    notify('⚠️ Can\'t load slime images. Files may be missing or browser blocking local files.');
                };
                img.src = imagePath;
            }, 500);
            
            save();
            updateUI();
        }
        
        // Make hatchSlime globally accessible
        window.hatchSlime = hatchSlime;
        
        // Navigation - Fishing menu
        document.getElementById('goto-fishing-menu').onclick = () => switchRoom('fishing-menu-room');
        document.getElementById('goto-mining-menu').onclick = () => {
            switchRoom('mining-menu-room');
            displayMiningMenu();
        };
        
