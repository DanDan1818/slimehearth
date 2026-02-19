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
            frogs: {}, // Format: { 'frog_blue': true, ... } - collected frogs
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
            },
            maxInventory: 6, // Inventory capacity (upgradeable)
            bagUpgrades: 0, // Number of bag upgrades purchased
            frogs: {} // Collected frogs: { 'frog_blue': true, ... }
        };
        
        // ===== CONSTANTS =====
        const BASKET_IMAGE = "";
        
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
            'carrot_seeds':  '#8bc34a',
            'tomato':        '#e53935',
            'tomato_seeds':  '#8bc34a',
            'potato':        '#c8a96e',
            'potato_seeds':  '#8bc34a',
            'corn':          '#fdd835',
            'corn_seeds':    '#8bc34a',
            'onion':         '#ce93d8',
            'onion_seeds':   '#8bc34a',
            'pumpkin':       '#f4511e',
            'pumpkin_seeds': '#8bc34a',
            'food': '#ff69b4',  // Pink for cooked food
            'burnt_food': '#1a1a1a',
            'burnt': '#1a1a1a',
            'small_geode': '#8b7355',
            'rock': '#666666',
            'gem': '#9333ea',
            'ore': '#cd7f32',
            'basket': '#d97706',
            'lily_pad': '#4ade80',
            'old_boot': '#78716c',
            'seaweed': '#16a34a',
            'frog_blue': '#3b82f6',
            'frog_yellow': '#eab308',
            'frog_red': '#ef4444',
            'frog_green': '#22c55e',
            'frog_purple': '#a855f7'
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
            'carrot_seeds':  './slimehearth-assets/images/seeds1.png',
            'tomato_seeds':  './slimehearth-assets/images/seeds1.png',
            'potato_seeds':  './slimehearth-assets/images/seeds1.png',
            'corn_seeds':    './slimehearth-assets/images/seeds1.png',
            'onion_seeds':   './slimehearth-assets/images/seeds1.png',
            'pumpkin_seeds': './slimehearth-assets/images/seeds1.png',
            'basket': './slimehearth-assets/images/basket1.png',
            'food': './slimehearth-assets/images/food1.png',
            'rock': './slimehearth-assets/images/rock1.png',
            'ore': './slimehearth-assets/images/ore1.png',
            'lily_pad': './slimehearth-assets/images/trash1.png',
            'frog_blue':   './slimehearth-assets/images/frog1.png',
            'frog_yellow': './slimehearth-assets/images/frog2.png',
            'frog_red':    './slimehearth-assets/images/frog3.png',
            'frog_green':  './slimehearth-assets/images/frog4.png',
            'frog_purple': './slimehearth-assets/images/frog5.png'
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
                emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common',
                rarityColor: '#8bc34a',
                description: 'Plant in the garden. Yields 3 Carrots.',
                foodValue: 0, sellValue: 1, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'carrot', harvestCount: 3
            },
            'tomato': {
                name: 'Tomato', emoji: '🍅',
                rarity: 'Common', rarityColor: '#9ca3af',
                description: 'A juicy red tomato.',
                foodValue: 12, sellValue: 5, cookable: true, feedable: true
            },
            'tomato_seeds': {
                name: '🌱 Tomato Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#8bc34a',
                description: 'Plant in the garden. Yields 2 Tomatoes.',
                foodValue: 0, sellValue: 2, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'tomato', harvestCount: 2
            },
            'potato': {
                name: 'Potato', emoji: '🥔',
                rarity: 'Common', rarityColor: '#9ca3af',
                description: 'A hearty starchy potato.',
                foodValue: 8, sellValue: 4, cookable: true, feedable: true
            },
            'potato_seeds': {
                name: '🌱 Potato Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#8bc34a',
                description: 'Plant in the garden. Yields 4 Potatoes.',
                foodValue: 0, sellValue: 1, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'potato', harvestCount: 4
            },
            'corn': {
                name: 'Corn', emoji: '🌽',
                rarity: 'Uncommon', rarityColor: '#fbbf24',
                description: 'Sweet golden corn.',
                foodValue: 15, sellValue: 8, cookable: true, feedable: true
            },
            'corn_seeds': {
                name: '🌱 Corn Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#8bc34a',
                description: 'Plant in the garden. Yields 2 Corn.',
                foodValue: 0, sellValue: 3, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'corn', harvestCount: 2
            },
            'onion': {
                name: 'Onion', emoji: '🧅',
                rarity: 'Common', rarityColor: '#9ca3af',
                description: 'Brings tears of joy.',
                foodValue: 10, sellValue: 6, cookable: true, feedable: true
            },
            'onion_seeds': {
                name: '🌱 Onion Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#8bc34a',
                description: 'Plant in the garden. Yields 3 Onions.',
                foodValue: 0, sellValue: 2, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'onion', harvestCount: 3
            },
            'pumpkin': {
                name: 'Pumpkin', emoji: '🎃',
                rarity: 'Rare', rarityColor: '#a855f7',
                description: 'A prize-winning pumpkin.',
                foodValue: 25, sellValue: 20, cookable: true, feedable: true
            },
            'pumpkin_seeds': {
                name: '🌱 Pumpkin Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Uncommon', rarityColor: '#fbbf24',
                description: 'Plant in the garden. Yields 1 Pumpkin.',
                foodValue: 0, sellValue: 5, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'pumpkin', harvestCount: 1
            },
            'food': {
                name: 'Cooked Food',
                emoji: '🍖',
                image: 'food1.png',
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
                image: 'rock1.png',
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
                image: 'ore1.png',
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
                isBasket: true
            },
            'lily_pad': {
                name: 'Lily Pad',
                emoji: '🌿',
                image: 'trash1.png',
                rarity: 'Common',
                rarityColor: '#9ca3af',
                description: 'A soggy lily pad. Not much use.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false
            },
            'old_boot': {
                name: 'Old Boot',
                emoji: '👢',
                rarity: 'Common',
                rarityColor: '#9ca3af',
                description: 'Someone lost this long ago.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false
            },
            'seaweed': {
                name: 'Seaweed',
                emoji: '🌿',
                rarity: 'Common',
                rarityColor: '#9ca3af',
                description: 'Slimy river weed.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false
            },
            'frog_blue': {
                name: '🐸 Blue Frog',
                emoji: '🐸',
                rarity: 'Rainbow',
                rarityColor: 'rainbow',
                image: 'frog1.png',
                description: 'A rare blue frog found fishing. Feed to the slime to add to your Collection!',
                foodValue: 0,
                sellValue: 0,
                sellable: false,
                cookable: false,
                feedable: true
            },
            'frog_yellow': {
                name: '🐸 Yellow Frog',
                emoji: '🐸',
                rarity: 'Rainbow',
                rarityColor: 'rainbow',
                image: 'frog2.png',
                description: 'A rare yellow frog found mining. Feed to the slime to add to your Collection!',
                foodValue: 0,
                sellValue: 0,
                sellable: false,
                cookable: false,
                feedable: true
            },
            'frog_red': {
                name: '🐸 Red Frog',
                emoji: '🐸',
                rarity: 'Rainbow',
                rarityColor: 'rainbow',
                image: 'frog3.png',
                description: 'A rare red frog found cooking. Feed to the slime to add to your Collection!',
                foodValue: 0,
                sellValue: 0,
                sellable: false,
                cookable: false,
                feedable: true
            },
            'frog_green': {
                name: '🐸 Green Frog',
                emoji: '🐸',
                rarity: 'Rainbow',
                rarityColor: 'rainbow',
                image: 'frog4.png',
                description: 'A rare green frog found farming. Feed to the slime to add to your Collection!',
                foodValue: 0,
                sellValue: 0,
                sellable: false,
                cookable: false,
                feedable: true
            },
            'frog_purple': {
                name: '🐸 Purple Frog',
                emoji: '🐸',
                rarity: 'Rainbow',
                rarityColor: 'rainbow',
                image: 'frog5.png',
                description: 'A rare purple frog found in a geode. Feed to the slime to add to your Collection!',
                foodValue: 0,
                sellValue: 0,
                sellable: false,
                cookable: false,
                feedable: true
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
            },
            'frog_hat': {
                name: '🐸 Frog Hat',
                description: 'Awarded for collecting all 5 Frogs!',
                cost: 0,
                icon: '🐸',
                image: 'frog_hat.png',
                unlockType: 'frogs'
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
        
        const FROGS_DATA = {
            'frog_blue':   { name: '🐸 Blue Frog',   icon: '🔵🐸', color: '#3b82f6', description: 'Found while fishing at the Pond or River' },
            'frog_yellow': { name: '🐸 Yellow Frog', icon: '🟡🐸', color: '#eab308', description: 'Found while automining in the Cave' },
            'frog_red':    { name: '🐸 Red Frog',    icon: '🔴🐸', color: '#ef4444', description: 'Found while cooking at the Hearth' },
            'frog_green':  { name: '🐸 Green Frog',  icon: '🟢🐸', color: '#22c55e', description: 'Found while farming in the Garden' },
            'frog_purple': { name: '🐸 Purple Frog', icon: '🟣🐸', color: '#a855f7', description: 'Found inside a geode at the Shack' }
        };
        
