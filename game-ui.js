        // ===== TROPHIES (TOOLS) =====
        function displayTrophies() {
            const display = document.getElementById('trophies-grid');
            if (!display) return;
            
            display.innerHTML = '';
            
            for (const toolId in TOOLS_DATA) {
                const tool = TOOLS_DATA[toolId];
                const owned = gs.tools[toolId] || false;
                
                const toolCard = document.createElement('div');
                toolCard.style.cssText = `
                    background: ${owned ? '#f0fdf4' : '#f3f4f6'};
                    border: 2px solid ${owned ? '#4ade80' : '#d1d5db'};
                    border-radius: 8px;
                    padding: 6px;
                    text-align: center;
                    opacity: ${owned ? '1' : '0.5'};
                    min-height: 70px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                `;
                
                toolCard.innerHTML = `
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;">
                        ${tool.icon}
                    </div>
                    <div style="width:100%;background:${owned ? '#4ade80' : '#9ca3af'};color:#fff;padding:3px 6px;border-radius:4px;font-weight:bold;font-size:9px;margin-top:6px;">
                        ${owned ? '✓ UNLOCKED' : '🔒 LOCKED'}
                    </div>
                `;
                
                display.appendChild(toolCard);
            }
            
            if (Object.keys(TOOLS_DATA).length === 0) {
                display.innerHTML = '<p style="color:#999;text-align:center;padding:40px;grid-column:1/-1;">No tools available yet...</p>';
            }
        }
        
        // ===== SHOP GRID DISPLAY =====
        function displayShopGrid() {
            const grid = document.getElementById('shop-grid');
            if (!grid) return;
            
            grid.innerHTML = '';
            
            // Define shop items with icons
            const shopItems = [
                // Bag upgrade - dynamic pricing
                { 
                    id: 'bag_upgrade', 
                    name: 'Bag Upgrade', 
                    icon: '🎒', 
                    price: 50 + (gs.bagUpgrades * 500), 
                    type: 'upgrade',
                    maxPurchases: 9, // Max 9 upgrades (6 + 18 = 24 slots)
                    currentPurchases: gs.bagUpgrades,
                    description: `+2 Slots (${gs.maxInventory}/24)`
                },
                { id: 'carrot_seeds',  name: '🌱 Carrot Seeds',  icon: '🥕', price: 3,  type: 'item' },
                { id: 'tomato_seeds',  name: '🌱 Tomato Seeds',  icon: '🍅', price: 5,  type: 'item' },
                { id: 'potato_seeds',  name: '🌱 Potato Seeds',  icon: '🥔', price: 4,  type: 'item' },
                { id: 'corn_seeds',    name: '🌱 Corn Seeds',    icon: '🌽', price: 8,  type: 'item' },
                { id: 'onion_seeds',   name: '🌱 Onion Seeds',   icon: '🧅', price: 6,  type: 'item' },
                { id: 'pumpkin_seeds', name: '🌱 Pumpkin Seeds', icon: '🎃', price: 15, type: 'item' },
                { id: 'hammer', name: 'Hammer', icon: '🔨', price: 50, type: 'tool', data: TOOLS_DATA.hammer },
                { id: 'fishing_rod', name: 'Fishing Rod', icon: '🎣', price: 100, type: 'tool', data: TOOLS_DATA.fishing_rod },
                { id: 'better_net', name: 'Fishing Net', icon: '🥅', price: 250, type: 'tool', data: TOOLS_DATA.better_net },
                { id: 'golden_hoe', name: 'Golden Hoe', icon: '⚒️', price: 500, type: 'tool', data: TOOLS_DATA.golden_hoe },
                { id: 'fishing_hat', name: 'Fishing Hat', icon: '🎣', price: 150, type: 'hat', data: HATS_DATA.fishing_hat },
                { id: 'blue_fishing_hat', name: 'Blue Fishing Hat', icon: '🎣', price: 200, type: 'hat', data: HATS_DATA.blue_fishing_hat },
                { id: 'farmer_hat', name: 'Farmer\'s Hat', icon: '🌾', price: 250, type: 'hat', data: HATS_DATA.farmer_hat },
                { id: 'chef_hat', name: 'Chef\'s Hat', icon: '👨‍🍳', price: 300, type: 'hat', data: HATS_DATA.chef_hat },
                { id: 'crown', name: 'Crown', icon: '👑', price: 500, type: 'hat', data: HATS_DATA.crown }
            ];
            
            shopItems.forEach(item => {
                const isOwned = (item.type === 'tool' && gs.tools[item.id]) || (item.type === 'hat' && gs.hats[item.id]);
                const isMaxed = (item.type === 'upgrade' && item.currentPurchases >= item.maxPurchases);
                const canBuy = !isOwned && !isMaxed;
                
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = `
                    background: ${isOwned || isMaxed ? '#d1fae5' : '#fff'};
                    border: 2px solid ${isOwned || isMaxed ? '#10b981' : '#fbbf24'};
                    border-radius: 8px;
                    padding: 6px;
                    text-align: center;
                    cursor: ${canBuy ? 'pointer' : 'default'};
                    transition: all 0.2s;
                    position: relative;
                    min-height: 70px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                `;
                
                if (canBuy) {
                    itemDiv.onmouseenter = () => itemDiv.style.transform = 'scale(1.05)';
                    itemDiv.onmouseleave = () => itemDiv.style.transform = 'scale(1)';
                }
                
                // Build description line
                let bottomLine = '';
                if (isOwned) {
                    bottomLine = '✓ OWNED';
                } else if (isMaxed) {
                    bottomLine = 'MAX';
                } else if (item.type === 'upgrade' && item.description) {
                    bottomLine = `${item.price} 💰 • ${item.description}`;
                } else {
                    bottomLine = `${item.price} 💰`;
                }
                
                itemDiv.innerHTML = `
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;">
                        ${getShopItemDisplay(item)}
                    </div>
                    <div style="font-size:9px;font-weight:bold;color:#333;margin-bottom:3px;line-height:1.1;">${item.name}</div>
                    <div style="font-size:${item.type === 'upgrade' ? '8px' : '10px'};font-weight:bold;color:${isOwned || isMaxed ? '#10b981' : '#f59e0b'};margin-top:3px;">
                        ${bottomLine}
                    </div>
                `;
                
                if (canBuy) {
                    itemDiv.onclick = () => buyShopItem(item);
                }
                
                grid.appendChild(itemDiv);
            });
        }
        
        // Helper function to get shop item display (image or icon)
        function getShopItemDisplay(item) {
            // Check if it's a hat with an image
            if (item.type === 'hat' && item.data && item.data.image) {
                return `<img src="./slimehearth-assets/images/${item.data.image}" style="width:40px;height:40px;object-fit:contain;" />`;
            }
            // Check if it's an item with an image (like carrot seeds)
            if (ITEM_IMAGES[item.id]) {
                return `<img src="${ITEM_IMAGES[item.id]}" style="width:40px;height:40px;object-fit:contain;" />`;
            }
            // Default to emoji icon
            return item.icon;
        }
        
        function buyShopItem(item) {
            if (gs.coins < item.price) {
                notify('❌ Not enough coins!', 'warning');
                return;
            }
            
            if (item.type === 'upgrade') {
                // Bag upgrade
                if (gs.bagUpgrades >= item.maxPurchases) {
                    notify('❌ Bag is already maxed out!', 'warning');
                    return;
                }
                gs.coins -= item.price;
                gs.bagUpgrades++;
                gs.maxInventory += 2;
                save();
                updateUI();
                updateInventoryCounter(); // Update the X/Y display
                displayShopGrid(); // Refresh to update price and description
                notify(`✓ Bag upgraded! Now ${gs.maxInventory} slots!`);
                const buySound = document.getElementById('coin-buy-sound');
                if (buySound) { buySound.currentTime = 0; buySound.play().catch(() => {}); }
            } else if (item.type === 'item') {
                // Buy regular item
                gs.coins -= item.price;
                addItem(item.id, 1);
                save();
                updateUI();
                notify(`✓ Bought ${item.name}!`);
                const buySound = document.getElementById('coin-buy-sound');
                if (buySound) { buySound.currentTime = 0; buySound.play().catch(() => {}); }
            } else if (item.type === 'tool') {
                // Buy tool
                if (gs.tools[item.id]) {
                    notify('❌ You already own this!', 'warning');
                    return;
                }
                gs.coins -= item.price;
                gs.tools[item.id] = true;
                save();
                updateUI();
                displayShopGrid();
                notify(`✓ Purchased ${item.icon} ${item.name}!`);
                const buySound = document.getElementById('coin-buy-sound');
                if (buySound) { buySound.currentTime = 0; buySound.play().catch(() => {}); }
                
                // Update crack button if hammer purchased
                if (item.id === 'hammer') {
                    updateCrackButton();
                }
            } else if (item.type === 'hat') {
                // Buy hat
                if (gs.hats[item.id]) {
                    notify('❌ You already own this!', 'warning');
                    return;
                }
                gs.coins -= item.price;
                gs.hats[item.id] = true;
                save();
                updateUI();
                displayShopGrid();
                const buySound = document.getElementById('coin-buy-sound');
                if (buySound) { buySound.currentTime = 0; buySound.play().catch(() => {}); }
                notify(`✓ Purchased ${item.icon} ${item.name}!`);
            }
        }
        
        function displayShopTools() {
            const display = document.getElementById('shop-tools-display');
            if (!display) return;
            
            display.innerHTML = '';
            
            for (const toolId in TOOLS_DATA) {
                const tool = TOOLS_DATA[toolId];
                const owned = gs.tools[toolId] || false;
                
                const toolDiv = document.createElement('div');
                toolDiv.style.cssText = 'padding:15px;margin:10px 0;border:3px solid ' + (owned ? '#4ade80' : '#fbbf24') + ';border-radius:10px;background:#fff;';
                
                toolDiv.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="flex:1;">
                            <div style="font-size:18px;font-weight:bold;margin-bottom:5px;">
                                ${tool.icon} ${tool.name}
                            </div>
                            <div style="color:#666;font-size:13px;margin-bottom:8px;">
                                ${tool.description}
                            </div>
                            <div style="color:#f59e0b;font-weight:bold;font-size:15px;">
                                💰 ${tool.cost} coins
                            </div>
                        </div>
                        <div style="margin-left:15px;">
                            ${owned ? 
                                '<div style="background:#4ade80;color:#fff;padding:8px 16px;border-radius:8px;font-weight:bold;font-size:14px;">✓ OWNED</div>' :
                                '<button onclick="buyTool(\'' + toolId + '\')" style="background:#fbbf24;color:#fff;padding:8px 16px;border:2px solid #f59e0b;border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;">BUY</button>'
                            }
                        </div>
                    </div>
                `;
                
                display.appendChild(toolDiv);
            }
        }
        
        function buyTool(toolId) {
            const tool = TOOLS_DATA[toolId];
            if (!tool) return;
            
            if (gs.tools[toolId]) {
                notify('❌ You already own this!', 'warning');
                return;
            }
            
            if (gs.coins < tool.cost) {
                notify('❌ Not enough coins!', 'warning');
                return;
            }
            
            gs.coins -= tool.cost;
            gs.tools[toolId] = true;
            save();
            updateUI();
            displayShopTools(); // Update shop display
            
            // If hammer was purchased, update the crack button
            if (toolId === 'hammer') {
                updateCrackButton();
            }
            
            notify('✓ Purchased ' + tool.name + '!');
        }
        
        // ===== HATS (COSMETICS) =====
        function displayHats() {
            const display = document.getElementById('hats-grid');
            const hatNameHeader = document.getElementById('wardrobe-hat-name');
            if (!display) return;
            
            // Update header to show currently equipped hat name (without emoji)
            if (gs.equippedHat && HATS_DATA[gs.equippedHat]) {
                const hatName = HATS_DATA[gs.equippedHat].name.replace(/[^\w\s'-]/g, '').trim();
                hatNameHeader.textContent = hatName;
            } else {
                hatNameHeader.textContent = 'Hats';
            }
            
            display.innerHTML = '';
            
            for (const hatId in HATS_DATA) {
                const hat = HATS_DATA[hatId];
                const owned = gs.hats[hatId] || false;
                const equipped = gs.equippedHat === hatId;
                
                const hatCard = document.createElement('div');
                hatCard.style.cssText = `
                    background: ${equipped ? '#fef3c7' : (owned ? '#f0fdf4' : '#f3f4f6')};
                    border: 2px solid ${equipped ? '#fbbf24' : (owned ? '#4ade80' : '#d1d5db')};
                    border-radius: 8px;
                    padding: 6px;
                    text-align: center;
                    cursor: ${owned ? 'pointer' : 'default'};
                    opacity: ${owned ? '1' : '0.5'};
                    transition: transform 0.1s;
                    min-height: 70px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    z-index: 200;
                `;
                
                // Image only (no text)
                hatCard.innerHTML = `
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;width:100%;">
                        ${hat.image ? 
                            `<img src="./slimehearth-assets/images/${hat.image}" style="width:40px;height:40px;object-fit:contain;" />` : 
                            `<div style="font-size:32px;">${hat.icon}</div>`
                        }
                    </div>
                    <button style="width:100%;margin-top:6px;background:${equipped ? '#fbbf24' : (owned ? '#4ade80' : '#9ca3af')};color:#fff;padding:3px 6px;border:none;border-radius:4px;font-weight:bold;font-size:9px;cursor:pointer;">
                        ${equipped ? '✓ EQUIPPED' : (owned ? 'EQUIP' : (hat.unlockType === 'frogs' ? '🐸 5 Frogs' : '🔒 LOCKED'))}
                    </button>
                `;
                
                // Get the button element
                const button = hatCard.querySelector('button');
                
                // Set onclick for owned hats
                if (owned && !equipped) {
                    hatCard.style.cursor = 'pointer';
                    hatCard.onmouseover = () => hatCard.style.transform = 'scale(1.05)';
                    hatCard.onmouseout = () => hatCard.style.transform = 'scale(1)';
                    button.onclick = (e) => {
                        e.stopPropagation();
                        equipHat(hatId);
                    };
                } else if (equipped) {
                    // Unequip if clicking equipped hat
                    button.onclick = (e) => {
                        e.stopPropagation();
                        unequipHat();
                    };
                } else {
                    button.disabled = true;
                    button.style.cursor = 'not-allowed';
                }
                
                display.appendChild(hatCard);
            }
            
            if (Object.keys(HATS_DATA).length === 0) {
                display.innerHTML = '<p style="color:#999;text-align:center;padding:40px;grid-column:1/-1;">No hats available yet...</p>';
            }
        }
        
        function equipHat(hatId) {
            if (!gs.hats[hatId]) {
                notify('❌ You don\'t own this hat!', 'warning');
                return;
            }
            
            gs.equippedHat = hatId;
            save();
            displayHats();
            updateSlimeHat(); // Update hat on slime
            notify(`Equipped ${HATS_DATA[hatId].icon} ${HATS_DATA[hatId].name}!`);
        }
        
        function unequipHat() {
            gs.equippedHat = null;
            save();
            displayHats();
            updateSlimeHat(); // Remove hat from slime
            notify('Hat removed!');
        }
        
        // ===== KEYS =====
        function displayKeys() {
            const display = document.getElementById('keys-grid');
            if (!display) return;
            
            display.innerHTML = '';
            
            if (Object.keys(KEYS_DATA).length === 0) {
                display.innerHTML = '<p style="color:#999;text-align:center;padding:40px;grid-column:1/-1;">No keys yet... More areas coming soon!</p>';
                return;
            }
            
            for (const keyId in KEYS_DATA) {
                const key = KEYS_DATA[keyId];
                const owned = gs.keys[keyId] || false;
                
                const keyCard = document.createElement('div');
                keyCard.style.cssText = `
                    background: ${owned ? '#fef3c7' : '#f3f4f6'};
                    border: 2px solid ${owned ? '#fbbf24' : '#d1d5db'};
                    border-radius: 8px;
                    padding: 6px;
                    text-align: center;
                    opacity: ${owned ? '1' : '0.5'};
                    min-height: 70px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                `;
                
                keyCard.innerHTML = `
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;">
                        ${key.icon}
                    </div>
                    <div style="width:100%;background:${owned ? '#fbbf24' : '#9ca3af'};color:#fff;padding:3px 6px;border-radius:4px;font-weight:bold;font-size:9px;margin-top:6px;">
                        ${owned ? '✓ OBTAINED' : '🔒 LOCKED'}
                    </div>
                `;
                
                display.appendChild(keyCard);
            }
        }
        
        function displayFrogs() {
            const display = document.getElementById('frogs-grid');
            if (!display) return;
            
            display.innerHTML = '';
            
            for (const frogId in FROGS_DATA) {
                const frog = FROGS_DATA[frogId];
                const collected = gs.frogs[frogId] || false;
                
                const card = document.createElement('div');
                card.style.cssText = `
                    background: ${collected ? frog.color + '22' : '#f3f4f6'};
                    border: 2px solid ${collected ? frog.color : '#d1d5db'};
                    border-radius: 8px;
                    padding: 6px;
                    text-align: center;
                    opacity: ${collected ? '1' : '0.4'};
                    min-height: 70px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                `;
                
                card.innerHTML = `
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:28px;">
                        ${collected ? '🐸' : '❓'}
                    </div>
                    <div style="width:100%;background:${collected ? frog.color : '#9ca3af'};color:#fff;padding:3px 6px;border-radius:4px;font-weight:bold;font-size:8px;margin-top:6px;">
                        ${collected ? frog.name.replace('🐸 ','') : '???'}
                    </div>
                `;
                
                if (collected) {
                    card.title = frog.description;
                }
                
                display.appendChild(card);
            }
        }
        
        function displayShopHats() {
            const display = document.getElementById('shop-hats-display');
            if (!display) return;
            
            display.innerHTML = '';
            
            for (const hatId in HATS_DATA) {
                const hat = HATS_DATA[hatId];
                const owned = gs.hats[hatId] || false;
                
                const hatDiv = document.createElement('div');
                hatDiv.style.cssText = 'padding:15px;margin:10px 0;border:3px solid ' + (owned ? '#4ade80' : '#a78bfa') + ';border-radius:10px;background:#fff;';
                
                hatDiv.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="flex:1;">
                            <div style="font-size:18px;font-weight:bold;margin-bottom:5px;display:flex;align-items:center;gap:8px;">
                                ${hat.image ? 
                                    `<img src="./slimehearth-assets/images/${hat.image}" style="width:30px;height:30px;object-fit:contain;" />` : 
                                    hat.icon
                                }
                                ${hat.name}
                            </div>
                            <div style="color:#666;font-size:13px;margin-bottom:8px;">
                                ${hat.description}
                            </div>
                            <div style="color:#f59e0b;font-weight:bold;font-size:15px;">
                                💰 ${hat.cost} coins
                            </div>
                        </div>
                        <div style="margin-left:15px;">
                            ${owned ? 
                                '<div style="background:#4ade80;color:#fff;padding:8px 16px;border-radius:8px;font-weight:bold;font-size:14px;">✓ OWNED</div>' :
                                '<button onclick="buyHat(\'' + hatId + '\')" style="background:#a78bfa;color:#fff;padding:8px 16px;border:2px solid #7c3aed;border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;">BUY</button>'
                            }
                        </div>
                    </div>
                `;
                
                display.appendChild(hatDiv);
            }
        }
        
        function buyHat(hatId) {
            const hat = HATS_DATA[hatId];
            if (!hat) return;
            
            if (gs.hats[hatId]) {
                notify('❌ You already own this!', 'warning');
                return;
            }
            
            if (gs.coins < hat.cost) {
                notify('❌ Not enough coins!', 'warning');
                return;
            }
            
            gs.coins -= hat.cost;
            gs.hats[hatId] = true;
            save();
            updateUI();
            displayShopHats();
            notify(`✓ Purchased ${hat.icon} ${hat.name}!`);
        }
        
        // ===== ADVENTURE (DOORS & KEYS) =====
        function displayAdventureDoors() {
            const display = document.getElementById('adventure-doors');
            if (!display) return;
            
            display.innerHTML = '';
            
            // Water Door - requires Water Key
            const hasWaterKey = gs.keys.water_key || false;
            
            const waterDoor = document.createElement('div');
            waterDoor.style.cssText = 'padding:20px;margin:15px 0;border:4px solid ' + (hasWaterKey ? '#3b82f6' : '#9ca3af') + ';border-radius:12px;background:' + (hasWaterKey ? '#dbeafe' : '#f3f4f6') + ';cursor:' + (hasWaterKey ? 'pointer' : 'not-allowed') + ';' + (hasWaterKey ? '' : 'opacity:0.6;');
            
            waterDoor.innerHTML = `
                <div style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:10px;">🚪</div>
                    <div style="font-size:24px;font-weight:bold;margin-bottom:8px;color:${hasWaterKey ? '#1e40af' : '#6b7280'};">
                        💧 Water Door
                    </div>
                    <div style="color:#666;font-size:14px;margin-bottom:12px;">
                        ${hasWaterKey ? 'Click to enter!' : '🔒 Requires Water Key (10% from fishing)'}
                    </div>
                    ${hasWaterKey ? '<div style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;display:inline-block;font-weight:bold;">ENTER →</div>' : ''}
                </div>
            `;
            
            if (hasWaterKey) {
                waterDoor.onclick = () => {
                    notify('🚪 Water Door coming soon!');
                    // TODO: Open water door area
                };
            }
            
            display.appendChild(waterDoor);
        }
        
        
        // ===== PRELOAD FISH IMAGES =====
        function preloadFishImages() {
            const fishImagesToLoad = ['fish1', 'fish2', 'fish3', 'fish4'];
            
            fishImagesToLoad.forEach(fishId => {
                const img = new Image();
                img.onload = () => {
                    console.log(`✅ Fish image verified: ${fishId}.png`);
                };
                img.onerror = () => {
                    console.error(`❌ Failed to load ${fishId}.png - check file path!`);
                };
                img.src = ITEM_IMAGES[fishId];
            });
        }
        
        preloadFishImages();
        
// ===== INIT =====
        load();
        updateUI();
