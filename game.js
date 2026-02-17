        // Preload all game images
        (function() {
            const imagesToPreload = [
                './slimehearth-assets/images/titlescreen-background.png',
                './slimehearth-assets/images/egg1.png',
                './slimehearth-assets/images/home-background.png',
                './slimehearth-assets/images/activities-background.png',
                './slimehearth-assets/images/shop-background.png',
                './slimehearth-assets/images/shack-background.png',
                './slimehearth-assets/images/pond-background.png',
                './slimehearth-assets/images/river-background.png',
                './slimehearth-assets/images/fishing-background.png',
                './slimehearth-assets/images/hearth-background.png',
                './slimehearth-assets/images/farm-background.png',
                './slimehearth-assets/images/bag1.png',
                './slimehearth-assets/images/sellbag1.png',
                './slimehearth-assets/images/fish1.png',
                './slimehearth-assets/images/fish2.png',
                './slimehearth-assets/images/fish3.png',
                './slimehearth-assets/images/fish4.png',
                './slimehearth-assets/images/fish5.png',
                './slimehearth-assets/images/fish6.png',
                './slimehearth-assets/images/fish7.png',
                './slimehearth-assets/images/fish8.png',
                './slimehearth-assets/images/gem1.png',
                './slimehearth-assets/images/geode1.png',
                './slimehearth-assets/images/carrot1.png',
                './slimehearth-assets/images/seeds1.png',
                './slimehearth-assets/images/food1.png',
                './slimehearth-assets/images/basket1.png',
                './slimehearth-assets/images/slime1.png',
                './slimehearth-assets/images/slime2.png',
                './slimehearth-assets/images/slime3.png',
                './slimehearth-assets/images/hat1.png'
            ];
            
            let loadedCount = 0;
            const totalImages = imagesToPreload.length;
            const loadingBar = document.getElementById('loading-bar');
            const loadingOverlay = document.getElementById('loading-overlay');
            const titleOverlay = document.getElementById('title-overlay');
            
            function updateProgress() {
                loadedCount++;
                const percent = (loadedCount / totalImages) * 100;
                if (loadingBar) loadingBar.style.width = percent + '%';
                
                if (loadedCount >= totalImages) {
                    // All images loaded, show title screen
                    setTimeout(() => {
                        if (loadingOverlay) loadingOverlay.style.display = 'none';
                        if (titleOverlay) titleOverlay.style.display = 'flex';
                    }, 300);
                }
            }
            
            // Preload each image
            imagesToPreload.forEach(src => {
                const img = new Image();
                img.onload = updateProgress;
                img.onerror = updateProgress; // Continue even if image fails
                img.src = src;
            });
        })();

        // ===== GAME STATE =====
        const gs = {
            hatched: false,
            slimeName: 'Slime', // Default name
            hunger: 100,
            level: 1,
            slimeXP: 0,
            slimeXPNeeded: 10,
            coins: 0,
            inventory: {}, // Format: { 'fish_0': 1, 'carrot_1': 1 }
            itemCounter: 0, // For unique item keys
            tools: {}, // Format: { 'fishing_rod': true, 'better_net': true }
            prospectingLevel: 1, // Prospecting skill (levels up by cracking geodes)
            hats: {}, // Format: { 'top_hat': true, 'party_hat': true }
            equippedHat: null, // Currently equipped hat (null = no hat)
            keys: {}, // Format: { 'bronze_key': true, 'silver_key': true }
            skills: { // Skill levels and XP
                fishing: { level: 1, xp: 0, xpNeeded: 10 },
                farming: { level: 1, xp: 0, xpNeeded: 10 },
                cooking: { level: 1, xp: 0, xpNeeded: 10 }
            },
            lastSkillUsed: null, // Track the last skill that gained XP
            stats: { // Permanent buffs from eating food
                doubleXpChance: 0, // % chance for double XP (0-100)
                doubleLootChance: 0, // % chance for double loot drops (0-100)
                bonusGeodeChance: 0, // % bonus chance for geodes from cracking (0-100)
                rareFindChance: 0, // % bonus chance for rare item drops (0-100)
                foodsEaten: 0 // Total foods consumed
            }
        };
        
        // ===== CONSTANTS =====
        const BASKET_IMAGE = "";
        const MAX_INVENTORY = 6;
        
        const ITEM_COLORS = {
            'fish1': '#9ca3af',
            'fish2': '#4ade80',
            'fish3': '#fbbf24',
            'fish4': '#a855f7',
            'fish5': '#9ca3af',
            'fish6': '#4ade80',
            'fish7': '#fbbf24',
            'fish8': '#a855f7',
            'carrot': '#ffaa44',
            'carrot_seeds': '#8bc34a',
            'food': '#ff69b4',  // Pink for cooked food
            'burnt_food': '#1a1a1a',
            'burnt': '#1a1a1a',
            'small_geode': '#8b7355',
            'rock': '#666666',
            'gem': '#9333ea',
            'ore': '#cd7f32',
            'basket': '#d97706'
        };
        
        const ITEM_IMAGES = {
            'fish1': './slimehearth-assets/images/fish1.png',
            'fish2': './slimehearth-assets/images/fish2.png',
            'fish3': './slimehearth-assets/images/fish3.png',
            'fish4': './slimehearth-assets/images/fish4.png',
            'fish5': './slimehearth-assets/images/fish5.png',
            'fish6': './slimehearth-assets/images/fish6.png',
            'fish7': './slimehearth-assets/images/fish7.png',
            'fish8': './slimehearth-assets/images/fish8.png',
            'gem': './slimehearth-assets/images/gem1.png',
            'small_geode': './slimehearth-assets/images/geode1.png',
            'carrot': './slimehearth-assets/images/carrot1.png',
            'carrot_seeds': './slimehearth-assets/images/seeds1.png',
            'basket': './slimehearth-assets/images/basket1.png'
            // 'food' removed - uses pink color from ITEM_COLORS instead
        };
        
        const ITEM_DATA = {
            'fish1': {
                name: 'Common Fish',
                emoji: '🐟',
                image: 'fish1.png',
                rarity: 'Common',
                rarityColor: '#9ca3af',
                description: 'A common fish from the pond.',
                foodValue: 2,
                sellValue: 3,
                cookable: true,
                feedable: true
            },
            'fish2': {
                name: 'Blue Fish',
                emoji: '🐠',
                image: 'fish2.png',
                rarity: 'Uncommon',
                rarityColor: '#4ade80',
                description: 'A colorful blue fish.',
                foodValue: 3,
                sellValue: 5,
                cookable: true,
                feedable: true
            },
            'fish3': {
                name: 'Tropical Fish',
                emoji: '🐡',
                image: 'fish3.png',
                rarity: 'Rare',
                rarityColor: '#fbbf24',
                description: 'A rare tropical fish!',
                foodValue: 4,
                sellValue: 10,
                cookable: true,
                feedable: true
            },
            'fish4': {
                name: 'Golden Fish',
                emoji: '🎣',
                image: 'fish4.png',
                rarity: 'Epic',
                rarityColor: '#a855f7',
                description: 'A legendary golden fish!',
                foodValue: 5,
                sellValue: 20,
                cookable: true,
                feedable: true
            },
            'fish5': {
                name: 'Lobster',
                emoji: '🦞',
                image: 'fish5.png',
                rarity: 'Common',
                rarityColor: '#9ca3af',
                description: 'A tasty lobster from the river.',
                foodValue: 3,
                sellValue: 5,
                cookable: true,
                feedable: true
            },
            'fish6': {
                name: 'Shrimp',
                emoji: '🦐',
                image: 'fish6.png',
                rarity: 'Uncommon',
                rarityColor: '#4ade80',
                description: 'Fresh river shrimp.',
                foodValue: 4,
                sellValue: 8,
                cookable: true,
                feedable: true
            },
            'fish7': {
                name: 'Crab',
                emoji: '🦀',
                image: 'fish7.png',
                rarity: 'Rare',
                rarityColor: '#fbbf24',
                description: 'A rare river crab!',
                foodValue: 5,
                sellValue: 12,
                cookable: true,
                feedable: true
            },
            'fish8': {
                name: 'Shark',
                emoji: '🦈',
                image: 'fish8.png',
                rarity: 'Epic',
                rarityColor: '#a855f7',
                description: 'An epic shark caught in the river!',
                foodValue: 8,
                sellValue: 25,
                cookable: true,
                feedable: true
            },
            'carrot': {
                name: 'Carrot',
                emoji: '🥕',
                image: 'carrot1.png',
                rarity: 'Common',
                rarityColor: '#9ca3af',
                description: 'A crunchy orange vegetable.',
                foodValue: 10,
                sellValue: 3,
                cookable: true,
                feedable: true
            },
            'carrot_seeds': {
                name: '🌱 Carrot Seeds',
                image: 'seeds1.png',
                rarity: 'Common',
                rarityColor: '#8bc34a',
                description: 'Plant in the garden. Grows in 1 minute.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false,
                isPlantable: true
            },
            'food': {
                name: 'Cooked Food',
                emoji: '🍖',
                rarity: 'Rare',
                rarityColor: '#ff69b4',  // Pink
                description: 'A delicious prepared meal. Restores 100 hunger!',
                foodValue: 100,  // Gives 100 slime XP when eaten
                sellValue: 50,   // Sells for 50 coins
                cookable: false,
                feedable: true
            },
            'burnt_food': {
                name: 'Burnt Food',
                rarity: 'Trash',
                rarityColor: '#78716c',
                description: 'Completely charred and inedible.',
                foodValue: 1,
                sellValue: 1,
                cookable: false,
                feedable: true
            },
            'burnt': {
                name: 'Burnt Food',
                rarity: 'Trash',
                rarityColor: '#78716c',
                description: 'Completely charred and inedible.',
                foodValue: 1,
                sellValue: 1,
                cookable: false,
                feedable: true
            },
            'small_geode': {
                name: 'Small Geode',
                emoji: '🪨',
                image: 'geode1.png',
                rarity: 'Rare',
                rarityColor: '#a78bfa',
                description: 'A mysterious rocky shell.',
                foodValue: 0,
                sellValue: 2,
                cookable: false,
                feedable: false,
                crackable: true
            },
            'rock': {
                name: 'Rock',
                rarity: 'Common',
                rarityColor: '#9ca3af',
                description: 'A plain rock. Not very valuable.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false,
                crackable: false
            },
            'gem': {
                name: 'Gem',
                emoji: '💎',
                image: 'gem1.png',
                rarity: 'Legendary',
                rarityColor: '#fbbf24',
                description: 'A beautiful sparkling gem!',
                foodValue: 0,
                sellValue: 50,
                cookable: false,
                feedable: false
            },
            'ore': {
                name: 'Ore',
                emoji: '⛏️',
                rarity: 'Uncommon',
                rarityColor: '#4ade80',
                description: 'Valuable ore mined from The Cave.',
                foodValue: 0,
                sellValue: 20,
                cookable: false,
                feedable: false
            },
            'basket': {
                name: '🧺 Basket',
                emoji: '🧺',
                image: 'basket1.png',
                rarity: 'Uncommon',
                rarityColor: '#fbbf24',
                description: 'A mysterious basket. Feed to slime to open!',
                foodValue: 0,
                sellValue: 10,
                cookable: false,
                feedable: true,
                crackable: false,
                isBasket: true // Special flag for treasure basket
            }
        };
        
        const TOOLS_DATA = {
            'hammer': {
                name: '🔨 Hammer',
                description: 'Required to crack geodes in the Shack',
                cost: 50,
                icon: '🔨'
            },
            'fishing_rod': {
                name: '🎣 Fishing Rod',
                description: 'Catch fish faster at the pond',
                cost: 100,
                icon: '🎣'
            },
            'better_net': {
                name: '🥅 Fishing Net',
                description: 'Required to fish at the River. Unlocks River fishing!',
                cost: 250,
                icon: '🥅'
            },
            'golden_hoe': {
                name: '⚒️ Golden Hoe',
                description: 'Required to farm at the Fields. Unlocks Fields farming!',
                cost: 500,
                icon: '⚒️'
            }
        };
        
        const HATS_DATA = {
            'crown': {
                name: '👑 Crown',
                description: 'Fit for royalty',
                cost: 500,
                icon: '👑',
                image: 'hat1.png',
                unlockType: 'shop'
            },
            'fishing_hat': {
                name: '🎣 Fishing Hat',
                description: 'Perfect for a day at the pond',
                cost: 150,
                icon: '🎣',
                image: 'hat2.png',
                unlockType: 'shop'
            },
            'blue_fishing_hat': {
                name: '🎣 Blue Fishing Hat',
                description: 'Stay cool by the river',
                cost: 200,
                icon: '🎣',
                image: 'hat3.png',
                unlockType: 'shop'
            },
            'farmer_hat': {
                name: '🌾 Farmer\'s Hat',
                description: 'Essential for working the fields',
                cost: 250,
                icon: '🌾',
                image: 'hat4.png',
                unlockType: 'shop'
            },
            'chef_hat': {
                name: '👨‍🍳 Chef\'s Hat',
                description: 'Cook with style!',
                cost: 300,
                icon: '👨‍🍳',
                image: 'hat5.png',
                unlockType: 'shop'
            }
        };
        
        const KEYS_DATA = {
            'water_key': {
                name: '💧 Water Key',
                description: 'Opens the Water Door - Found while fishing',
                icon: '💧',
                unlockType: 'fishing' // 10% chance from fishing
            }
        };
        
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
        function showItemTooltip(itemId) {
            // Remove existing tooltip
            const existing = document.getElementById('item-tooltip');
            if (existing) existing.remove();
            
            console.log('Tooltip for itemId:', itemId);
            console.log('ITEM_DATA has this?', !!ITEM_DATA[itemId]);
            
            if (!itemId) return;
            
            // Check if data exists
            if (!ITEM_DATA[itemId]) {
                console.error('No ITEM_DATA for:', itemId);
                return;
            }
            
            const data = ITEM_DATA[itemId];
            
            const tooltip = document.createElement('div');
            tooltip.id = 'item-tooltip';
            tooltip.innerHTML = `
                <div style="color: ${data.rarityColor}; font-size: 11px; font-weight: bold; margin-bottom: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    ${data.name}
                </div>
                <div style="color: #fff; font-size: 9px; margin-bottom: 3px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    ${data.description}
                </div>
                ${data.feedable ? `<div style="font-size: 9px; margin-bottom: 2px; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    +${data.foodValue} <span style="color: #ff6b9d; font-weight: bold;">Food</span>
                </div>` : ''}
                <div style="font-size: 9px; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                    💰 ${data.sellValue}
                </div>
                ${data.crackable ? '<div style="font-size: 9px; color: #d4a574; font-weight: bold; margin-top: 2px; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">🔨 Crackable</div>' : ''}
            `;
            
            // Position above inventory bag (bottom-left)
            tooltip.style.cssText = `
                position: fixed;
                bottom: 260px;
                left: 10px;
                background: rgba(139, 115, 85, 0.95);
                color: #fff;
                padding: 6px 8px;
                border-radius: 6px;
                z-index: 135;
                border: 2px solid ${data.rarityColor};
                box-shadow: 0 4px 12px rgba(0,0,0,0.6);
                width: 75px;
                text-align: left;
                pointer-events: none;
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
                setTimeout(() => notif.remove(), 4000);
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
                        cooking: { level: 1, xp: 0, xpNeeded: 10 }
                    };
                }
                
                updateUI();
            }
        }
        
        function updateInventoryCounter() {
            const counter = document.getElementById('inventory-counter');
            if (counter) {
                const count = Object.keys(gs.inventory).length;
                counter.textContent = count + '/' + MAX_INVENTORY;
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
            document.getElementById('double-xp-stat').textContent = (gs.stats.doubleXpChance || 0).toFixed(1);
            document.getElementById('double-loot-stat').textContent = (gs.stats.doubleLootChance || 0).toFixed(1);
            document.getElementById('bonus-geode-stat').textContent = (gs.stats.bonusGeodeChance || 0).toFixed(1);
            document.getElementById('rare-find-stat').textContent = (gs.stats.rareFindChance || 0).toFixed(1);
        }
        
        function updateUI() {
            // Update basket coins display
            const basketCoins = document.getElementById('basket-coins');
            if (basketCoins) {
                basketCoins.textContent = gs.coins;
            }
            updateSkillsUI();
            
            // Update slime name display
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
                slimeXPBar.style.width = percent + '%';
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
        
        function addSkillXP(skillName, amount) {
            console.log('addSkillXP called:', skillName, amount);
            
            // Ensure skills exist
            if (!gs.skills) {
                console.error('gs.skills is undefined! Initializing...');
                gs.skills = {
                    fishing: { level: 1, xp: 0, xpNeeded: 10 },
                    farming: { level: 1, xp: 0, xpNeeded: 10 },
                    cooking: { level: 1, xp: 0, xpNeeded: 10 }
                };
            }
            
            const skill = gs.skills[skillName];
            if (!skill) {
                console.error('Skill not found:', skillName);
                return;
            }
            
            skill.xp += amount;
            console.log(skillName + ' XP:', skill.xp + '/' + skill.xpNeeded);
            
            // Track last skill used
            gs.lastSkillUsed = skillName;
            updateLastSkillDisplay();
            
            // Level up check
            while (skill.xp >= skill.xpNeeded) {
                skill.xp -= skill.xpNeeded;
                skill.level++;
                skill.xpNeeded = Math.floor(skill.xpNeeded * 1.2); // Same as slime
                notify('🎉 ' + skillName.charAt(0).toUpperCase() + skillName.slice(1) + ' Level ' + skill.level + '!');
            }
            
            // Show XP gain notification (subtle)
            notify('+' + amount + ' ' + skillName + ' XP');
            
            save();
            updateSkillsUI();
        }
        
        function updateSkillsUI() {
            if (!gs.skills) return; // Safety check
            
            ['fishing', 'farming', 'cooking'].forEach(skillName => {
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
        
        function updateLastSkillDisplay() {
            const display = document.getElementById('last-skill-display');
            if (!display || !gs.lastSkillUsed) return;
            
            const skill = gs.skills[gs.lastSkillUsed];
            if (!skill) return;
            
            const skillIcons = {
                'fishing': '🎣',
                'farming': '🌾',
                'cooking': '🍳'
            };
            
            const icon = skillIcons[gs.lastSkillUsed] || '';
            const name = gs.lastSkillUsed.charAt(0).toUpperCase() + gs.lastSkillUsed.slice(1);
            display.textContent = `${icon} ${name} Lv ${skill.level}`;
            
            // Update XP bar
            const xpBar = document.getElementById('last-skill-xp-bar');
            if (xpBar) {
                const percent = (skill.xp / skill.xpNeeded) * 100;
                xpBar.style.width = percent + '%';
                
                // Color based on skill
                const skillColors = {
                    'fishing': '#4dd0e1',
                    'farming': '#8bc34a',
                    'cooking': '#ff9800'
                };
                xpBar.style.background = skillColors[gs.lastSkillUsed] || '#9c27b0';
            }
        }
        
        function addItem(itemId, quantity = 1) {
            const currentCount = Object.keys(gs.inventory).length;
            const spaceLeft = MAX_INVENTORY - currentCount;
            
            if (spaceLeft <= 0) {
                notifyInventoryFull();
                return;
            }
            
            const toAdd = Math.min(quantity, spaceLeft);
            for (let i = 0; i < toAdd; i++) {
                const key = itemId + '_' + gs.itemCounter++;
                gs.inventory[key] = itemId; // Store the itemId string, not 1!
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
            
            // Only spawn new items in basket if basket is open
            const container = document.getElementById('basket-container');
            if (container && container.classList.contains('active') && basketEngine) {
                // Spawn only the newly added items
                for (let i = 0; i < toAdd; i++) {
                    const key = itemId + '_' + (gs.itemCounter - toAdd + i);
                    spawnSingleItem(key);
                }
            }
        }
        
        // ===== NAVIGATION =====
        function switchRoom(roomId) {
            document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
            document.getElementById(roomId).classList.add('active');
            
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
                    // In shop - show BOTH bags (HTML walls stay hidden)
                    inventoryBag.style.display = 'block';
                    sellBag.style.display = 'block';
                    if (greenSellBox) greenSellBox.style.display = 'block';
                } else {
                    // Not in shop - show only inventory bag
                    inventoryBag.style.display = 'block';
                    sellBag.style.display = 'none';
                    if (greenSellBox) greenSellBox.style.display = 'none';
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
        }
        
        document.getElementById('nav-home').onclick = () => switchRoom('home-room');
        document.getElementById('nav-area').onclick = () => switchRoom('area-room');
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
        document.getElementById('skills-btn').onclick = () => {
            const overlay = document.getElementById('skills-overlay');
            if (overlay.style.display === 'none') {
                overlay.style.display = 'block';
            } else {
                overlay.style.display = 'none';
            }
        };
        document.getElementById('close-skills').onclick = () => {
            document.getElementById('skills-overlay').style.display = 'none';
        };
        
        // Stats overlay handlers
        document.getElementById('level-display-container').onclick = () => {
            const overlay = document.getElementById('stats-overlay');
            if (overlay.style.display === 'none') {
                updateStatsDisplay();
                overlay.style.display = 'block';
            } else {
                overlay.style.display = 'none';
            }
        };
        document.getElementById('close-stats').onclick = () => {
            document.getElementById('stats-overlay').style.display = 'none';
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
        
        // Open basket on page load (if hatched)
        if (gs.hatched) {
            setTimeout(() => openBasketPermanently(), 100);
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
                { isStatic: true, render: { visible: false } }
            );
            
            // Invisible floor at canvas bottom - sized for 700px canvas
            const invisibleFloor = Bodies.rectangle(
                350, 1230, 900, 100,  // Centered at 350 (middle of 700)
                { isStatic: true, render: { visible: false } }
            );
            
            World.add(basketEngine.world, [leftWall, rightWall, bottom, invisibleFloor]);
            
            // Sell walls are now created dynamically in switchRoom()
            sellWalls = [];
            
            // Velocity limiter
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
                
                // Convert to canvas coordinates and add offset
                // Offset: +100px right, +100px down to match visual slime position
                const slimeX = slimeCenterX - canvasLeft + 100;
                const slimeY = slimeCenterY - canvasTop + 100;
                
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
                    
                    if (dist < 80) {
                        foodNearby = true;
                    }
                    
                    if (dist < 40) {
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
                            
                            gs.stats.foodsEaten++;
                            
                            // Each food grants random stat boost (0.1-0.3%)
                            const statRoll = Math.random();
                            if (statRoll < 0.25) {
                                gs.stats.doubleXpChance += 0.1 + Math.random() * 0.2;
                                notify('📈 +Double XP Chance!', 'achievement');
                            } else if (statRoll < 0.5) {
                                gs.stats.doubleLootChance += 0.1 + Math.random() * 0.2;
                                notify('📈 +Double Loot Chance!', 'achievement');
                            } else if (statRoll < 0.75) {
                                gs.stats.bonusGeodeChance += 0.1 + Math.random() * 0.2;
                                notify('📈 +Bonus Geode Chance!', 'achievement');
                            } else {
                                gs.stats.rareFindChance += 0.1 + Math.random() * 0.2;
                                notify('📈 +Rare Find Chance!', 'achievement');
                            }
                            
                            gs.hunger = Math.min(100, gs.hunger + itemData.foodValue);
                            
                            // Play eating sound
                            const eatSound1 = document.getElementById('eat-sound-1');
                            const eatSound2 = document.getElementById('eat-sound-2');
                            const randomSound = Math.random() < 0.5 ? eatSound1 : eatSound2;
                            if (randomSound) {
                                randomSound.currentTime = 0; // Reset to start
                                randomSound.volume = 0.4; // 40% volume
                                randomSound.play().catch(() => {}); // Play, ignore errors
                            }
                            
                            // Add slime XP
                            const xpGain = itemData.foodValue * 2;
                            gs.slimeXP += xpGain;
                            
                            // Level up check (max level 100)
                            while (gs.slimeXP >= gs.slimeXPNeeded && gs.level < 100) {
                                gs.slimeXP -= gs.slimeXPNeeded;
                                gs.level++;
                                
                                // Gradually increase XP needed (1.2x multiplier for smoother scaling)
                                gs.slimeXPNeeded = Math.floor(gs.slimeXPNeeded * 1.2);
                                
                                notify('🎉 Slime Level Up! Level ' + gs.level, 'levelup');
                                
                                // Create a small geode on level up
                                addItem('small_geode', 1);
                                notify('💎 Found a Small Geode!');
                            }
                            
                            // Cap XP at max level
                            if (gs.level >= 100) {
                                gs.slimeXP = gs.slimeXPNeeded;
                            }
                            
                            notify('+' + xpGain + ' 🍖!');
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
                    showItemTooltip(body.itemId);
                }
            });
            
            Events.on(mouseConstraint, 'enddrag', function(event) {
                console.log('End drag event fired!');
                hideItemTooltip();
                
                // Check if we're on the shack room and dropped a crackable item on the slot
                const shackRoom = document.getElementById('shack-room');
                if (shackRoom && shackRoom.classList.contains('active')) {
                    const body = event.body;
                    if (body && body.itemId && ITEM_DATA[body.itemId] && ITEM_DATA[body.itemId].crackable) {
                        const slotEl = document.getElementById('shack-geode-slot');
                        if (slotEl) {
                            const slotRect = slotEl.getBoundingClientRect();
                            const containerEl = document.getElementById('basket-container');
                            const containerRect = containerEl.getBoundingClientRect();
                            
                            // Get the actual CSS scale value
                            const styleScale = containerEl.style.transform || '';
                            const scaleMatch = styleScale.match(/scale\(([^)]+)\)/);
                            const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 0.8;
                            
                            // Convert physics body coords → screen coords
                            const bodyScreenX = containerRect.left + body.position.x * scale;
                            const bodyScreenY = containerRect.top + body.position.y * scale;
                            
                            console.log('Body screen pos:', bodyScreenX, bodyScreenY);
                            console.log('Slot rect:', slotRect);
                            
                            // Generous hit area - expand slot detection by 30px
                            if (bodyScreenX >= slotRect.left - 30 && bodyScreenX <= slotRect.right + 30 &&
                                bodyScreenY >= slotRect.top - 30 && bodyScreenY <= slotRect.bottom + 30) {
                                lockGeodeInShackSlot(body);
                            }
                        }
                    }
                }
            });
            
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
                        showItemTooltip(hoveredBody.itemId);
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
                        const sellPrice = itemData ? itemData.sellValue : 1;
                        
                        gs.coins += sellPrice;
                        notify('Sold ' + (itemData ? itemData.name : body.itemId) + ' for ' + sellPrice + ' coins! 💰');
                        
                        // Remove
                        World.remove(basketEngine.world, body);
                        basketBodies.splice(i, 1);
                        delete gs.inventory[body.itemKey];
                        
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
        }
        
        function spawnSingleItem(key) {
            if (!basketEngine) return;
            const { Bodies, World } = Matter;
            
            const itemId = gs.inventory[key]; // Get itemId from inventory value, not by parsing key
            const color = ITEM_COLORS[itemId] || '#ff6b9d';
            
            // Spawn at top-center of basket
            const x = 50 + Math.random() * 140;  // Adjusted left to match basket at X=90
            const y = -50;
            
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
                    beamWidth = 25; // Was 100, now 1/4
                    beamColor = '#fbbf24'; // Gold
                    shouldBeam = true;
                    break;
            }
            
            if (!shouldBeam) return;
            
            // Create beam element that shoots UP from bottom
            const beam = document.createElement('div');
            beam.className = 'item-beam';
            beam.style.width = beamWidth + 'px';
            beam.style.height = '0%';
            beam.style.left = (body.position.x - beamWidth/2) + 'px';
            beam.style.bottom = '0px'; // Start from bottom
            beam.style.background = `linear-gradient(to top, ${beamColor}00 0%, ${beamColor}ff 20%, ${beamColor}ff 80%, ${beamColor}00 100%)`;
            beam.style.boxShadow = `0 0 ${beamWidth*2}px ${beamColor}, inset 0 0 ${beamWidth}px ${beamColor}`;
            
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
            
            result.textContent = '🎣 Casting...';
            bar.style.width = '0%';
            bar.style.background = 'linear-gradient(to bottom, #6ee7ff 0%, #4dd0e1 50%, #2ba5b8 100%)';
            
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
                if (pondElapsedTime >= pondCatchStart && pondElapsedTime <= pondCatchEnd) {
                    // CATCH WINDOW!
                    bar.style.background = 'linear-gradient(to bottom, #6fffb0 0%, #4ade80 50%, #2db860 100%)'; // Green 3D gradient
                    bar.style.animation = 'fishFlash 0.3s infinite'; // Add flash
                    result.textContent = '💦 NOW! Hold to catch!';
                    
                    // Show splash on first frame of catch window
                    if (splash && splash.style.display === 'none') {
                        splash.style.display = 'block';
                        
                        // Play bobber sound
                        const bobberSound = document.getElementById('bobber-sound');
                        if (bobberSound) {
                            bobberSound.currentTime = 0;
                            bobberSound.volume = 0.5;
                            bobberSound.play().catch(() => {});
                        }
                        
                        setTimeout(() => { 
                            if (splash) splash.style.display = 'none'; 
                        }, 600);
                    }
                } else {
                    bar.style.background = 'linear-gradient(to bottom, #6ee7ff 0%, #4dd0e1 50%, #2ba5b8 100%)'; // Blue 3D gradient
                    bar.style.animation = 'none'; // Remove flash
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
                    bar.style.background = 'linear-gradient(to bottom, #6ee7ff 0%, #4dd0e1 50%, #2ba5b8 100%)';
                    bar.style.animation = 'none';
                }
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
                // River fish pool: fish5-8 (Lobster, Shrimp, Crab, Shark)
                const rand = Math.random();
                let caughtFish;
                
                if (rand < 0.50) {
                    caughtFish = 'fish5'; // Lobster (Common) - 50%
                } else if (rand < 0.80) {
                    caughtFish = 'fish6'; // Shrimp (Uncommon) - 30%
                } else if (rand < 0.95) {
                    caughtFish = 'fish7'; // Crab (Rare) - 15%
                } else {
                    caughtFish = 'fish8'; // Shark (Epic) - 5%
                }
                
                const fishName = ITEM_DATA[caughtFish].name;
                timer.textContent = `🎣 Caught ${fishName}!`;
                addItem(caughtFish, 1);
                addSkillXP('fishing', 10);
                
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
                // Random fish based on rarity
                const rand = Math.random();
                let caughtFish;
                
                if (rand < 0.50) {
                    caughtFish = 'fish1'; // Common - 50%
                } else if (rand < 0.80) {
                    caughtFish = 'fish2'; // Uncommon - 30%
                } else if (rand < 0.95) {
                    caughtFish = 'fish3'; // Rare - 15%
                } else {
                    caughtFish = 'fish4'; // Epic - 5%
                }
                
                const fishName = ITEM_DATA[caughtFish].name;
                result.textContent = `🎣 Caught a ${fishName}!`;
                addItem(caughtFish, 1);
                addSkillXP('fishing', 10);
                
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
            } else {
                result.textContent = '❌ It got away!';
            }
            
            setTimeout(() => {
                fishingProgress = 0;
                updateFishingBar();
                result.textContent = '';
            }, 1500);
        }
        
        
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
            
            // Set up click handlers for all 9 slots
            for (let i = 0; i < 9; i++) {
                const slot = document.getElementById(`garden-plot-slot-${i}`);
                if (slot) {
                    slot.onclick = () => showGardenSeedMenu(i);
                }
            }
            
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
        
        function showGardenSeedMenu(slotIndex) {
            // Don't allow selecting if already growing
            if (gardenGrowing) {
                notify('❌ Plants are growing! Wait to harvest first.', 'warning');
                return;
            }
            
            // Count plantable items (seeds) in inventory
            const itemCounts = {};
            for (const key in gs.inventory) {
                const itemId = gs.inventory[key];
                if (ITEM_DATA[itemId] && ITEM_DATA[itemId].isPlantable) {
                    itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
                }
            }
            
            // Subtract seeds already placed in slots
            const alreadyPlaced = {};
            for (let i = 0; i < 9; i++) {
                if (gardenSlots[i]) {
                    alreadyPlaced[gardenSlots[i]] = (alreadyPlaced[gardenSlots[i]] || 0) + 1;
                }
            }
            
            // Calculate available (not yet placed)
            const availableCounts = {};
            for (const itemId in itemCounts) {
                const total = itemCounts[itemId];
                const placed = alreadyPlaced[itemId] || 0;
                const available = total - placed;
                if (available > 0) {
                    availableCounts[itemId] = available;
                }
            }
            
            console.log('Item counts:', itemCounts);
            console.log('Already placed:', alreadyPlaced);
            console.log('Available to place:', availableCounts);
            
            // Close existing menu if any
            const existingMenu = document.getElementById('garden-seed-menu');
            if (existingMenu) {
                existingMenu.remove();
                return;
            }
            
            const menu = document.createElement('div');
            menu.id = 'garden-seed-menu';
            menu.style.cssText = 'position:fixed;bottom:300px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.98);border:3px solid #8bc34a;border-radius:10px;padding:15px;z-index:10002;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.5);pointer-events:auto;';
            
            const header = document.createElement('div');
            header.style.cssText = 'font-weight:bold;margin-bottom:10px;color:#333;font-size:16px;';
            header.textContent = 'Select Seeds:';
            menu.appendChild(header);
            
            if (Object.keys(availableCounts).length === 0) {
                const empty = document.createElement('div');
                empty.style.cssText = 'color:#999;font-style:italic;padding:10px;';
                empty.textContent = 'No seeds available (check if already placed)';
                menu.appendChild(empty);
            } else {
                for (const itemId in availableCounts) {
                    const count = availableCounts[itemId];
                    const name = ITEM_DATA[itemId].name;
                    
                    const btn = document.createElement('div');
                    btn.style.cssText = 'width:100%;padding:12px;margin:5px 0;font-size:16px;border:2px solid #8bc34a;border-radius:8px;background:#fff;cursor:pointer;display:flex;justify-content:space-between;pointer-events:auto;';
                    btn.innerHTML = '<span>' + name + '</span><span style="color:#666;font-weight:bold;">x ' + count + '</span>';
                    btn.onclick = function(e) { 
                        e.stopPropagation(); 
                        selectGardenSeed(slotIndex, itemId); 
                    };
                    menu.appendChild(btn);
                }
            }
            
            const cancelBtn = document.createElement('div');
            cancelBtn.style.cssText = 'width:100%;padding:10px;margin-top:10px;background:#999;color:#fff;border:2px solid #666;border-radius:8px;cursor:pointer;text-align:center;pointer-events:auto;';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = function(e) {
                e.stopPropagation();
                closeGardenSeedMenu();
            };
            menu.appendChild(cancelBtn);
            
            document.body.appendChild(menu);
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
        
        function closeGardenSeedMenu() {
            const menu = document.getElementById('garden-seed-menu');
            if (menu) menu.remove();
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
            
            save();
            populateBasket(); // Re-populate basket with updated inventory
            updateGardenDisplay();
            notify('💧 Garden watered! Plants growing...');
            startGardenUpdateInterval();
        }
        
        function startHarvestHold(slotIndex) {
            if (harvestHoldTimer) return; // Already holding
            if (!gardenSlots[slotIndex]) return; // No crop in this slot
            
            // Check if inventory has space for 3 carrots
            const currentInventoryCount = Object.keys(gs.inventory).length;
            
            if (currentInventoryCount + 3 > MAX_INVENTORY) {
                notify('❌ Inventory full! Make space for 3 carrots before harvesting.', 'warning');
                console.log('Cannot harvest - inventory full:', currentInventoryCount, '/', MAX_INVENTORY, '(need space for 3)');
                return;
            }
            
            console.log('Starting harvest hold for slot:', slotIndex, '- Inventory:', currentInventoryCount, '/', MAX_INVENTORY);
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
            
            if (harvestHoldProgress > 0 && harvestHoldProgress < 1) {
                const percent = Math.floor(harvestHoldProgress * 100);
                timerDisplay.textContent = `🥕 Harvesting... ${percent}%`;
                timerDisplay.style.color = '#ff9800';
            } else if (harvestHoldProgress >= 1) {
                timerDisplay.textContent = '✅ Harvested!';
                timerDisplay.style.color = '#4caf50';
            } else {
                // Count remaining crops
                const remaining = gardenSlots.filter(s => s !== null).length;
                if (remaining > 0) {
                    timerDisplay.textContent = `✅ Hold slot to harvest! (${remaining} left)`;
                    timerDisplay.style.color = '#4caf50';
                } else {
                    timerDisplay.textContent = '';
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
            
            if (currentInventoryCount + 3 > MAX_INVENTORY) {
                notify('❌ Inventory full! Cannot harvest.', 'warning');
                console.log('Harvest blocked - inventory full:', currentInventoryCount, '/', MAX_INVENTORY);
                return;
            }
            
            console.log('Inventory check passed:', currentInventoryCount, '+ 3 <=', MAX_INVENTORY);
            
            // Give 3 carrots for this slot
            addItem('carrot', 3);
            addSkillXP('farming', 15);
            
            // Clear this slot
            gardenSlots[slotIndex] = null;
            gs.gardenSlots[slotIndex] = null;
            
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
            }
            
            save();
            updateGardenDisplay();
            
            const result = document.getElementById('garden-result');
            if (result) {
                result.textContent = `🥕 Harvested 3 Carrots! ${remaining > 0 ? `(${remaining} left)` : ''}`;
                result.style.color = '#4caf50';
                setTimeout(() => result.textContent = '', 2000);
            }
            
            notify(`🥕 Harvested 3 Carrots! +15 Farming XP${remaining > 0 ? ` (${remaining} slots left)` : ''}`);
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
            // Update all 9 slots
            for (let i = 0; i < 9; i++) {
                const icon = document.getElementById(`garden-plot-icon-${i}`);
                const slot = document.getElementById(`garden-plot-slot-${i}`);
                
                if (!icon || !slot) continue;
                
                if (gardenGrowing) {
                    // Growing state - show seedling
                    if (gardenSlots[i]) {
                        icon.textContent = '🌱';
                        slot.style.background = '#f1f8e9';
                        slot.style.borderColor = '#8bc34a';
                    } else {
                        icon.textContent = '';
                        slot.style.background = '#f5f5f5';
                        slot.style.borderColor = '#ccc';
                    }
                    slot.style.cursor = 'not-allowed';
                    slot.onclick = null;
                } else {
                    // Not growing - show selected or empty
                    if (gardenSlots[i]) {
                        icon.textContent = '🌱';
                        slot.style.background = '#fef3c7';
                        slot.style.borderColor = '#f59e0b';
                    } else {
                        icon.textContent = '+';
                        slot.style.background = '#fff';
                        slot.style.borderColor = '#8bc34a';
                    }
                    slot.style.cursor = 'pointer';
                    slot.onclick = () => showGardenSeedMenu(i);
                }
            }
            
            // Update timer display
            const timerDisplay = document.getElementById('garden-timer-display');
            const waterBtn = document.getElementById('water-garden-btn');
            
            if (gardenGrowing) {
                const now = Date.now();
                const timeLeft = Math.ceil((gardenReadyTime - now) / 1000);
                
                if (timeLeft > 0) {
                    if (timerDisplay) timerDisplay.textContent = `⏱️ Growing: ${timeLeft}s`;
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
                    
                    // Update icons to carrots and add hold-to-harvest
                    for (let i = 0; i < 9; i++) {
                        if (gardenSlots[i]) {
                            const icon = document.getElementById(`garden-plot-icon-${i}`);
                            const slot = document.getElementById(`garden-plot-slot-${i}`);
                            if (icon) icon.textContent = '🥕';
                            if (slot) {
                                slot.style.background = '#e8f5e9';
                                slot.style.borderColor = '#4caf50';
                                slot.style.cursor = 'pointer';
                                slot.style.transform = 'scale(1)'; // Reset transform
                                
                                // Add press-and-hold handlers with slot index
                                const slotIndex = i; // Capture in closure
                                slot.onmousedown = () => startHarvestHold(slotIndex);
                                slot.onmouseup = stopHarvestHold;
                                slot.onmouseleave = stopHarvestHold;
                                slot.ontouchstart = (e) => {
                                    e.preventDefault();
                                    startHarvestHold(slotIndex);
                                };
                                slot.ontouchend = (e) => {
                                    e.preventDefault();
                                    stopHarvestHold();
                                };
                                slot.ontouchcancel = stopHarvestHold;
                            }
                        } else {
                            // Empty slot - reset visual
                            const slot = document.getElementById(`garden-plot-slot-${i}`);
                            if (slot) {
                                slot.style.transform = 'scale(1)';
                            }
                        }
                    }
                }
            } else {
                if (timerDisplay) timerDisplay.textContent = '';
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
        
        let fieldPattern = [];
        let fieldInput = [];
        let fieldActive = false;
        
        function initFieldGame() {
            fieldActive = true;
            fieldPattern = generateFieldPattern();
            fieldInput = [];
            document.getElementById('field-pattern-display').textContent = fieldPattern.join(' ');
            document.getElementById('field-input-display').textContent = '';
            document.getElementById('field-result').textContent = '';
        }
        
        function generateFieldPattern() {
            const plants = ['🌽', '🥕', '🥔'];
            const pattern = [];
            for (let i = 0; i < 4; i++) {
                pattern.push(plants[Math.floor(Math.random() * plants.length)]);
            }
            return pattern;
        }
        
        function plantInField(plant) {
            if (!fieldActive) return;
            fieldInput.push(plant);
            document.getElementById('field-input-display').textContent = fieldInput.join(' ');
            
            for (let i = 0; i < fieldInput.length; i++) {
                if (fieldInput[i] !== fieldPattern[i]) {
                    const result = document.getElementById('field-result');
                    result.textContent = '❌ Wrong order! Try again';
                    setTimeout(() => {
                        fieldInput = [];
                        document.getElementById('field-input-display').textContent = '';
                        result.textContent = '';
                    }, 1500);
                    return;
                }
            }
            
            if (fieldInput.length === fieldPattern.length) {
                const result = document.getElementById('field-result');
                result.textContent = '🎉 Perfect planting! +1 Carrot';
                addItem('carrot', 1);
                addSkillXP('farming', 15);
                setTimeout(() => initFieldGame(), 2000);
            }
        }
        
        function resetField() {
            fieldInput = [];
            document.getElementById('field-input-display').textContent = '';
            document.getElementById('field-result').textContent = '';
        }
        
        function stopFieldGame() {
            fieldActive = false;
        }
        

        // ===== THE HEARTH (DROPDOWN MENU SYSTEM) =====
        let hearthSlot1ItemId = null;
        let hearthSlot2ItemId = null;
        
        const RECIPES = {
            'fish+carrot': { result: 'food', name: '🍖 Cooked Food' },
            'carrot+fish': { result: 'food', name: '🍖 Cooked Food' }
        };
        
        // Helper function to check if item is a fish
        function isFish(itemId) {
            return ['fish1', 'fish2', 'fish3', 'fish4', 'fish5', 'fish6', 'fish7', 'fish8'].includes(itemId);
        }
        
        // Check if two items match a recipe (supports "any fish")
        function checkRecipe(item1, item2) {
            // Direct match
            const directKey1 = item1 + '+' + item2;
            const directKey2 = item2 + '+' + item1;
            if (RECIPES[directKey1]) return RECIPES[directKey1];
            if (RECIPES[directKey2]) return RECIPES[directKey2];
            
            // Check for fish + carrot combo (any fish works)
            if ((isFish(item1) && item2 === 'carrot') || (item1 === 'carrot' && isFish(item2))) {
                return RECIPES['fish+carrot'];
            }
            
            return null;
        }
        
        function initHearth() {
            hearthSlot1ItemId = null;
            hearthSlot2ItemId = null;
            updateHearthDisplay();
            
            const slot1 = document.getElementById('hearth-slot-1');
            const slot2 = document.getElementById('hearth-slot-2');
            const cookBtn = document.getElementById('cook-hearth-btn');
            
            if (slot1) slot1.onclick = () => showHearthFoodMenu(1);
            if (slot2) slot2.onclick = () => showHearthFoodMenu(2);
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
                    slot1Icon.textContent = item.name.includes('Fish') ? '🐟' : (item.name.includes('Carrot') ? '🥕' : '📦');
                    slot1Name.textContent = item.name;
                } else {
                    slot1Icon.textContent = '+';
                    slot1Name.textContent = '';
                }
            }
            
            if (slot2Icon && slot2Name) {
                if (hearthSlot2ItemId) {
                    const item = ITEM_DATA[hearthSlot2ItemId];
                    slot2Icon.textContent = item.name.includes('Fish') ? '🐟' : (item.name.includes('Carrot') ? '🥕' : '📦');
                    slot2Name.textContent = item.name;
                } else {
                    slot2Icon.textContent = '+';
                    slot2Name.textContent = '';
                }
            }
        }
        
        function cookHearth() {
            if (!hearthSlot1ItemId || !hearthSlot2ItemId) {
                notify('❌ Select two ingredients first!', 'warning');
                return;
            }
            
            const recipe = checkRecipe(hearthSlot1ItemId, hearthSlot2ItemId);
            
            const resultDiv = document.getElementById('hearth-result');
            
            if (recipe) {
                // Valid recipe! Find and remove one of each item
                let removed1 = false, removed2 = false;
                
                // Remove from inventory data
                for (const key in gs.inventory) {
                    if (!removed1 && gs.inventory[key] === hearthSlot1ItemId) {
                        delete gs.inventory[key];
                        removed1 = true;
                    } else if (!removed2 && gs.inventory[key] === hearthSlot2ItemId) {
                        delete gs.inventory[key];
                        removed2 = true;
                    }
                    if (removed1 && removed2) break;
                }
                
                // Remove from physics world BEFORE adding result
                removeIngredientsFromBasket(hearthSlot1ItemId, hearthSlot2ItemId);
                
                // NOW add the result
                addItem(recipe.result, 1);
                addSkillXP('cooking', 15);
                
                if (resultDiv) {
                    resultDiv.textContent = '✨ Cooked ' + recipe.name + '!';
                    resultDiv.style.color = '#4caf50';
                    setTimeout(() => resultDiv.textContent = '', 3000);
                }
                
                notify('✨ Cooked ' + recipe.name + '!');
                
                hearthSlot1ItemId = null;
                hearthSlot2ItemId = null;
                updateHearthDisplay();
                save();
            } else {
                // Invalid recipe - Make burnt food!
                // Remove the ingredients
                let removed1 = false, removed2 = false;
                
                // Remove from inventory data
                for (const key in gs.inventory) {
                    if (!removed1 && gs.inventory[key] === hearthSlot1ItemId) {
                        delete gs.inventory[key];
                        removed1 = true;
                    } else if (!removed2 && gs.inventory[key] === hearthSlot2ItemId) {
                        delete gs.inventory[key];
                        removed2 = true;
                    }
                    if (removed1 && removed2) break;
                }
                
                // Remove from physics world BEFORE adding result
                removeIngredientsFromBasket(hearthSlot1ItemId, hearthSlot2ItemId);
                
                // NOW add burnt food
                addItem('burnt_food', 1);
                addSkillXP('cooking', 5); // Half XP for burnt food
                
                if (resultDiv) {
                    resultDiv.textContent = '🔥 OH NO! Food burnt!';
                    resultDiv.style.color = '#f44336';
                    setTimeout(() => resultDiv.textContent = '', 3000);
                }
                
                notify('💀 Burnt the food!');
                
                hearthSlot1ItemId = null;
                hearthSlot2ItemId = null;
                updateHearthDisplay();
                save();
            }
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
            
            // Compute slot center in physics coordinates
            const slotEl = document.getElementById('shack-geode-slot');
            const slotRect = slotEl.getBoundingClientRect();
            const containerEl = document.getElementById('basket-container');
            const containerRect = containerEl.getBoundingClientRect();
            const styleScale = containerEl.style.transform || '';
            const scaleMatch = styleScale.match(/scale\(([^)]+)\)/);
            const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 0.8;
            
            const slotCenterX = (slotRect.left + slotRect.width / 2 - containerRect.left) / scale;
            const slotCenterY = (slotRect.top + slotRect.height / 2 - containerRect.top) / scale;
            
            // Snap and freeze
            Matter.Body.setPosition(body, { x: slotCenterX, y: slotCenterY });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
            Matter.Body.setStatic(body, true);
            
            // Update slot UI
            const icon = document.getElementById('shack-slot-icon');
            const nameEl = document.getElementById('shack-slot-name');
            const clearBtn = document.getElementById('shack-slot-clear');
            const slotDiv = document.getElementById('shack-geode-slot');
            
            if (icon) icon.style.display = 'none';
            if (nameEl) nameEl.textContent = data.name.replace(/[^\w\s'-]/g, '').trim();
            if (clearBtn) clearBtn.style.display = 'block';
            if (slotDiv) slotDiv.style.border = '3px solid #4ade80';
            
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
            // Unfreeze the body
            if (shackLockedBody) {
                Matter.Body.setStatic(shackLockedBody, false);
                shackLockedBody = null;
            }
            
            shackGeodeSlot = null;
            
            // Reset slot UI
            const icon = document.getElementById('shack-slot-icon');
            const nameEl = document.getElementById('shack-slot-name');
            const clearBtn = document.getElementById('shack-slot-clear');
            const slotDiv = document.getElementById('shack-geode-slot');
            
            if (icon) { icon.textContent = '🪨'; icon.style.display = ''; }
            if (nameEl) nameEl.textContent = '';
            if (clearBtn) clearBtn.style.display = 'none';
            if (slotDiv) slotDiv.style.border = '3px dashed #8b7355';
            
            const crackBtn = document.getElementById('crack-geode-btn');
            if (crackBtn) {
                crackBtn.style.background = '#f5e6d3';
                crackBtn.style.borderColor = '#8b7355';
            }
            
            notify('Geode removed from slot.');
        }
        
        function showShackInventoryMenu() {
            // Now handled by drag-drop
            notify('Drag a geode from your bag into the slot! 🪨');
        }
        
        function updateShackProgress() {
            const display = document.getElementById('shack-progress-display');
            if (display) {
                display.textContent = 'Cracks: ' + shackCrackCount + ' / 20';
            }
        }
        
        function updateCrackButton() {
            const crackBtn = document.getElementById('crack-geode-btn');
            if (!crackBtn) return;
            
            const hasHammer = gs.tools.hammer || false;
            
            if (hasHammer) {
                // Unlocked appearance
                crackBtn.style.background = '#f5e6d3';
                crackBtn.style.borderColor = '#8b7355';
                crackBtn.style.opacity = '1';
                crackBtn.style.cursor = 'pointer';
            } else {
                // Locked appearance
                crackBtn.style.background = '#d1d5db';
                crackBtn.style.borderColor = '#9ca3af';
                crackBtn.style.opacity = '0.5';
                crackBtn.style.cursor = 'not-allowed';
            }
        }
        
        function crackGeode() {
            console.log('Crack clicked, geode:', shackGeodeSlot, 'count:', shackCrackCount);
            
            // Check if player has hammer
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
            
            if (shackCrackCount >= 20) {
                finishCracking();
            }
        }
        
        function finishCracking() {
            console.log('Cracking complete!');
            
            const roll = Math.random();
            const isGem = roll < 0.10;
            console.log('Gem roll:', roll, 'Is gem:', isGem);
            
            const result = document.getElementById('shack-result');
            
            // FIRST: Remove geode from inventory
            let removedKey = null;
            for (const key in gs.inventory) {
                if (gs.inventory[key] === shackGeodeSlot) {
                    delete gs.inventory[key];
                    removedKey = key;
                    console.log('Removed geode from inventory:', key);
                    break;
                }
            }
            
            if (removedKey && basketEngine) {
                const bodyIndex = basketBodies.findIndex(b => b.itemKey === removedKey);
                if (bodyIndex !== -1) {
                    const body = basketBodies[bodyIndex];
                    World.remove(basketEngine.world, body);
                    basketBodies.splice(bodyIndex, 1);
                }
            }
            
            save();
            updateInventoryCounter();
            
            // THEN: Add rock or gem
            if (isGem) {
                result.textContent = '💎 GEM! +1 Gem (50 coins!)';
                addItem('gem', 1);
                notify('✨ Found a GEM!');
            } else {
                result.textContent = '🪨 Rock... +1 Rock (1 coin)';
                addItem('rock', 1);
                notify('😐 Just a rock...');
            }
            
            // Reset shack - clear the slot properly
            if (shackLockedBody) {
                // Remove the locked body from physics world
                World.remove(basketEngine.world, shackLockedBody);
                basketBodies.splice(basketBodies.indexOf(shackLockedBody), 1);
                shackLockedBody = null;
            }
            
            shackGeodeSlot = null;
            shackCrackCount = 0;
            
            // Reset slot UI
            const icon = document.getElementById('shack-slot-icon');
            const nameEl = document.getElementById('shack-slot-name');
            const clearBtn = document.getElementById('shack-slot-clear');
            const slotDiv = document.getElementById('shack-geode-slot');
            if (icon) { icon.textContent = '🪨'; icon.style.display = ''; }
            if (nameEl) nameEl.textContent = '';
            if (clearBtn) clearBtn.style.display = 'none';
            if (slotDiv) slotDiv.style.border = '3px dashed #8b7355';
            
            const crackBtn = document.getElementById('crack-geode-btn');
            if (crackBtn) {
                crackBtn.style.background = '#f5e6d3';
                crackBtn.style.borderColor = '#8b7355';
                crackBtn.style.opacity = '1';
                crackBtn.style.cursor = 'pointer';
            }
            
            updateInventoryCounter();
            updateShackProgress();
            
            // Prospecting level-up check
            checkProspectingLevelUp();
            
            setTimeout(() => {
                result.textContent = '';
            }, 3000);
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
        document.getElementById('goto-mining-menu').onclick = () => switchRoom('mining-menu-room');
        document.getElementById('back-to-area').onclick = () => switchRoom('area-room');
        document.getElementById('back-to-area-mining').onclick = () => switchRoom('area-room');
        document.getElementById('goto-pond').onclick = () => switchRoom('fishing-pond-room');
        document.getElementById('goto-cave').onclick = () => switchRoom('mining-cave-room');
        document.getElementById('goto-river').onclick = () => {
            if (!gs.tools.better_net) {
                notify('❌ You need a Fishing Net to fish at the River! Buy it from the shop.');
                return;
            }
            switchRoom('fishing-river-room');
        };
        document.getElementById('leave-pond').onclick = () => {
            stopFishing();
            switchRoom('fishing-menu-room');
        };
        document.getElementById('leave-cave').onclick = () => {
            stopAutomine();
            switchRoom('mining-menu-room');
        };
        document.getElementById('leave-river').onclick = () => {
            stopFishing();
            riverActive = false;
            clearInterval(riverFishingInterval);
            switchRoom('fishing-menu-room');
        };
        
        // Mining - Automine system
        let automineInterval = null;
        let automineTimeLeft = 0;
        
        function startAutomine() {
            if (automineInterval) return; // Already mining
            
            const button = document.getElementById('start-automine');
            const timer = document.getElementById('automine-timer');
            const result = document.getElementById('automine-result');
            
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            
            automineTimeLeft = 60; // 60 seconds
            timer.textContent = `⏱️ ${automineTimeLeft}s remaining`;
            result.textContent = '';
            
            notify('⛏️ Started automining!');
            
            automineInterval = setInterval(() => {
                automineTimeLeft--;
                timer.textContent = `⏱️ ${automineTimeLeft}s remaining`;
                
                // 5% chance per second to mine ore
                if (Math.random() < 0.05) {
                    addItem('ore', 1);
                    result.textContent = '⛏️ Mined Ore!';
                    setTimeout(() => result.textContent = '', 1000);
                }
                
                if (automineTimeLeft <= 0) {
                    stopAutomine();
                    timer.textContent = '✅ Mining complete!';
                    notify('✅ Automining finished!');
                    setTimeout(() => timer.textContent = '', 3000);
                }
            }, 1000);
        }
        
        function stopAutomine() {
            if (automineInterval) {
                clearInterval(automineInterval);
                automineInterval = null;
            }
            
            const button = document.getElementById('start-automine');
            if (button) {
                button.disabled = false;
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
            
            automineTimeLeft = 0;
        }
        
        document.getElementById('start-automine').onclick = startAutomine;
        
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
            addItem('fish5', 2);  // Lobster
            addItem('fish6', 2);  // Shrimp
            addItem('fish7', 1);  // Crab
            addItem('fish8', 1);  // Shark
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
        document.querySelectorAll('.plant-btn').forEach(btn => {
            btn.onclick = () => plantInField(btn.dataset.plant);
        });
        document.getElementById('reset-field-btn').onclick = resetField;
        

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
        console.log('Game version: v0.388');
        
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
                { id: 'carrot_seeds', name: '🌱 Carrot Seeds', icon: '🌱', price: 3, type: 'item' },
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
                
                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = `
                    background: ${isOwned ? '#d1fae5' : '#fff'};
                    border: 2px solid ${isOwned ? '#10b981' : '#fbbf24'};
                    border-radius: 8px;
                    padding: 6px;
                    text-align: center;
                    cursor: ${isOwned ? 'default' : 'pointer'};
                    transition: all 0.2s;
                    position: relative;
                    min-height: 70px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                `;
                
                if (!isOwned) {
                    itemDiv.onmouseenter = () => itemDiv.style.transform = 'scale(1.05)';
                    itemDiv.onmouseleave = () => itemDiv.style.transform = 'scale(1)';
                }
                
                itemDiv.innerHTML = `
                    <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:32px;">
                        ${getShopItemDisplay(item)}
                    </div>
                    <div style="font-size:9px;font-weight:bold;color:#333;margin-bottom:3px;line-height:1.1;">${item.name}</div>
                    <div style="font-size:10px;font-weight:bold;color:${isOwned ? '#10b981' : '#f59e0b'};margin-top:3px;">
                        ${isOwned ? '✓ OWNED' : `${item.price} 💰`}
                    </div>
                `;
                
                if (!isOwned) {
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
            
            if (item.type === 'item') {
                // Buy regular item
                gs.coins -= item.price;
                addItem(item.id, 1);
                save();
                updateUI();
                notify(`✓ Bought ${item.name}!`);
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
                    <button style="width:100%;margin-top:6px;background:${equipped ? '#fbbf24' : '#4ade80'};color:#fff;padding:3px 6px;border:none;border-radius:4px;font-weight:bold;font-size:9px;cursor:pointer;">
                        ${equipped ? '✓ EQUIPPED' : (owned ? 'EQUIP' : '🔒 LOCKED')}
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
