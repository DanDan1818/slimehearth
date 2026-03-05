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
                './slimehearth-assets/images/gem2.png',
                './slimehearth-assets/images/gem3.png',
                './slimehearth-assets/images/gem4.png',
                './slimehearth-assets/images/gem5.png',
                './slimehearth-assets/images/gem6.png',
                './slimehearth-assets/images/geode1.png',
                './slimehearth-assets/images/geode2.png',
                './slimehearth-assets/images/geode3.png',
                './slimehearth-assets/images/geode4.png',
                './slimehearth-assets/images/geode5.png',
                './slimehearth-assets/images/trash1.png',
                './slimehearth-assets/images/trash2.png',
                './slimehearth-assets/images/trash3.png',
                './slimehearth-assets/images/trash4.png',
                './slimehearth-assets/images/fruit1.png',
                './slimehearth-assets/images/fruit2.png',
                './slimehearth-assets/images/fruit3.png',
                './slimehearth-assets/images/fruit4.png',
                './slimehearth-assets/images/fruit5.png',
                './slimehearth-assets/images/fruit6.png',
                './slimehearth-assets/images/fruit7.png',
                './slimehearth-assets/images/fruit8.png',
                './slimehearth-assets/images/meat1.png',
                './slimehearth-assets/images/meat2.png',
                './slimehearth-assets/images/meat3.png',
                './slimehearth-assets/images/meat4.png',
                './slimehearth-assets/images/meat5.png',
                './slimehearth-assets/images/veg1.png',
                './slimehearth-assets/images/veg2.png',
                './slimehearth-assets/images/veg3.png',
                './slimehearth-assets/images/veg4.png',
                './slimehearth-assets/images/veg5.png',
                './slimehearth-assets/images/veg6.png',
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
            frogs: {}, // Collected frogs: { 'frog_blue': true, ... }
            coop: { chickens: 1, maxChickens: 2 }, // Coop state
            fishSeen:  {}, // Fish ever caught: { 'fish1': true, ... }
            fishSizes: {}, // Size per inventory slot: { 'fish1_3': 1.24, ... }
            fishBest:  {}  // Personal record kg per species: { 'fish1': 1.24, ... }
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
            'apple':   '#ef4444',
            'pear':    '#a3e635',
            'orange':  '#f97316',
            'cherry':  '#dc2626',
            'peach':   '#fb923c',
            'lemon':   '#facc15',
            'mango':   '#f59e0b',
            'coconut': '#d6d3d1',
            'porkchops':    '#f87171',
            'ham':          '#fb923c',
            'sausages':     '#a78bfa',
            'bacon':        '#dc2626',
            'rainbow_milk': 'rainbow',
            'food': '#ff69b4',  // Pink for cooked food
            'burnt_food': '#1a1a1a',
            'burnt': '#1a1a1a',
            'small_geode':   '#8b7355',
            'medium_geode':  '#6b7280',
            'large_geode':   '#7c3aed',
            'rare_geode':    '#d97706',
            'rainbow_geode': '#ec4899',
            'rock': '#666666',
            'egg':  '#fef9c3',
            'emerald':  '#10b981',
            'ruby':     '#ef4444',
            'sapphire': '#3b82f6',
            'amethyst': '#a855f7',
            'topaz':    '#f59e0b',
            'diamond':  '#e0f2fe',
            'ore':         '#cd7f32',
            'copper_ore':  '#cd7f32',
            'coal':        '#374151',
            'iron_ore':    '#9ca3af',
            'silver_ore':  '#e2e8f0',
            'gold_ore':    '#fbbf24',
            'copper_bar':  '#b45309',
            'iron_bar':    '#9ca3af',
            'silver_bar':  '#d1d5db',
            'gold_bar':    '#fbbf24',
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
            'emerald':  './slimehearth-assets/images/gem2.png',
            'ruby':     './slimehearth-assets/images/gem4.png',
            'sapphire': './slimehearth-assets/images/gem5.png',
            'amethyst': './slimehearth-assets/images/gem1.png',
            'topaz':    './slimehearth-assets/images/gem6.png',
            'diamond':  './slimehearth-assets/images/gem3.png',
            'small_geode':   './slimehearth-assets/images/geode1.png',
            'medium_geode':  './slimehearth-assets/images/geode2.png',
            'large_geode':   './slimehearth-assets/images/geode3.png',
            'rare_geode':    './slimehearth-assets/images/geode4.png',
            'rainbow_geode': './slimehearth-assets/images/geode5.png',
            'carrot':  './slimehearth-assets/images/veg1.png',
            'potato':  './slimehearth-assets/images/veg2.png',
            'onion':   './slimehearth-assets/images/veg3.png',
            'pumpkin': './slimehearth-assets/images/veg4.png',
            'corn':    './slimehearth-assets/images/veg5.png',
            'tomato':  './slimehearth-assets/images/veg6.png',
            'carrot_seeds':  './slimehearth-assets/images/seeds1.png',
            'tomato_seeds':  './slimehearth-assets/images/seeds1.png',
            'potato_seeds':  './slimehearth-assets/images/seeds1.png',
            'corn_seeds':    './slimehearth-assets/images/seeds1.png',
            'onion_seeds':   './slimehearth-assets/images/seeds1.png',
            'pumpkin_seeds': './slimehearth-assets/images/seeds1.png',
            'basket': './slimehearth-assets/images/basket1.png',
            'food': './slimehearth-assets/images/food1.png',
            'rock': './slimehearth-assets/images/rock1.png',
            'ore':         './slimehearth-assets/images/ore1.png',
            'copper_ore':  './slimehearth-assets/images/ore1.png',
            'coal':        './slimehearth-assets/images/fuel1.png',
            'iron_ore':    './slimehearth-assets/images/ore3.png',
            'silver_ore':  './slimehearth-assets/images/ore4.png',
            'gold_ore':    './slimehearth-assets/images/ore2.png',
            'copper_bar': './slimehearth-assets/images/metal1.png',
            'iron_bar':   './slimehearth-assets/images/metal2.png',
            'silver_bar': './slimehearth-assets/images/metal3.png',
            'gold_bar':   './slimehearth-assets/images/metal4.png',
            'lily_pad':   './slimehearth-assets/images/trash1.png',
            'burnt_food': './slimehearth-assets/images/trash2.png',
            'burnt':      './slimehearth-assets/images/trash2.png',
            'seaweed':    './slimehearth-assets/images/trash3.png',
            'old_boot':   './slimehearth-assets/images/trash4.png',
            'apple':   './slimehearth-assets/images/fruit1.png',
            'pear':    './slimehearth-assets/images/fruit2.png',
            'orange':  './slimehearth-assets/images/fruit3.png',
            'cherry':  './slimehearth-assets/images/fruit4.png',
            'peach':   './slimehearth-assets/images/fruit5.png',
            'lemon':   './slimehearth-assets/images/fruit6.png',
            'mango':   './slimehearth-assets/images/fruit7.png',
            'coconut': './slimehearth-assets/images/fruit8.png',
            'porkchops':   './slimehearth-assets/images/meat1.png',
            'ham':         './slimehearth-assets/images/meat2.png',
            'sausages':    './slimehearth-assets/images/meat3.png',
            'bacon':       './slimehearth-assets/images/meat4.png',
            'rainbow_milk':'./slimehearth-assets/images/meat5.png',
            'frog_blue':   './slimehearth-assets/images/frog1.png',
            'frog_yellow': './slimehearth-assets/images/frog2.png',
            'frog_red':    './slimehearth-assets/images/frog3.png',
            'frog_green':  './slimehearth-assets/images/frog4.png',
            'frog_purple': './slimehearth-assets/images/frog5.png',
            'egg':         './slimehearth-assets/images/egg1.png'
        };
        
        const ITEM_DATA = {
            'fish1': {
                name: 'Common Fish',
                emoji: '🐟',
                image: 'fish1.png',
                rarity: 'Common',
                rarityColor: '#111111',
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
                rarityColor: '#2d8a2d',
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
                rarityColor: '#2563eb',
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
                rarityColor: '#7c3aed',
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
                rarityColor: '#111111',
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
                rarityColor: '#2d8a2d',
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
                rarityColor: '#2563eb',
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
                rarityColor: '#7c3aed',
                description: 'An epic shark caught in the river!',
                foodValue: 8,
                sellValue: 25,
                cookable: true,
                feedable: true
            },
            'carrot': {
                name: 'Carrot',
                emoji: '🥕',
                image: 'veg1.png',
                rarity: 'Common',
                rarityColor: '#111111',
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
                rarityColor: '#111111',
                description: 'Plant in the garden. Yields 3 Carrots.',
                foodValue: 0, sellValue: 1, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'carrot', harvestCount: 3
            },
            'tomato': {
                name: 'Tomato', emoji: '🍅', image: 'veg6.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'A juicy red tomato.',
                foodValue: 12, sellValue: 5, cookable: true, feedable: true
            },
            'tomato_seeds': {
                name: '🌱 Tomato Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'Plant in the garden. Yields 2 Tomatoes.',
                foodValue: 0, sellValue: 2, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'tomato', harvestCount: 2
            },
            'potato': {
                name: 'Potato', emoji: '🥔', image: 'veg2.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'A hearty starchy potato.',
                foodValue: 8, sellValue: 4, cookable: true, feedable: true
            },
            'potato_seeds': {
                name: '🌱 Potato Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'Plant in the garden. Yields 4 Potatoes.',
                foodValue: 0, sellValue: 1, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'potato', harvestCount: 4
            },
            'corn': {
                name: 'Corn', emoji: '🌽', image: 'veg5.png',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'Sweet golden corn.',
                foodValue: 15, sellValue: 8, cookable: true, feedable: true
            },
            'corn_seeds': {
                name: '🌱 Corn Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'Plant in the garden. Yields 2 Corn.',
                foodValue: 0, sellValue: 3, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'corn', harvestCount: 2
            },
            'onion': {
                name: 'Onion', emoji: '🧅', image: 'veg3.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'Brings tears of joy.',
                foodValue: 10, sellValue: 6, cookable: true, feedable: true
            },
            'onion_seeds': {
                name: '🌱 Onion Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'Plant in the garden. Yields 3 Onions.',
                foodValue: 0, sellValue: 2, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'onion', harvestCount: 3
            },
            'pumpkin': {
                name: 'Pumpkin', emoji: '🎃', image: 'veg4.png',
                rarity: 'Rare', rarityColor: '#2563eb',
                description: 'A prize-winning pumpkin.',
                foodValue: 25, sellValue: 20, cookable: true, feedable: true
            },
            'pumpkin_seeds': {
                name: '🌱 Pumpkin Seeds', emoji: '🌱',
                image: 'seeds1.png',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'Plant in the garden. Yields 1 Pumpkin.',
                foodValue: 0, sellValue: 5, cookable: false, feedable: false,
                isPlantable: true, harvestItem: 'pumpkin', harvestCount: 1
            },
            // === ORCHARD FRUITS ===
            'apple': {
                name: 'Apple', emoji: '🍎', image: 'fruit1.png',
                rarity: 'Common', rarityColor: '#16a34a',
                description: 'A crisp red apple from the orchard.',
                foodValue: 18, sellValue: 6, cookable: true, feedable: true
            },
            'pear': {
                name: 'Pear', emoji: '🍐', image: 'fruit2.png',
                rarity: 'Common', rarityColor: '#16a34a',
                description: 'A juicy green pear.',
                foodValue: 16, sellValue: 5, cookable: true, feedable: true
            },
            'orange': {
                name: 'Orange', emoji: '🍊', image: 'fruit3.png',
                rarity: 'Uncommon', rarityColor: '#d97706',
                description: 'A bright citrus orange.',
                foodValue: 22, sellValue: 9, cookable: true, feedable: true
            },
            'cherry': {
                name: 'Cherry', emoji: '🍒', image: 'fruit4.png',
                rarity: 'Uncommon', rarityColor: '#d97706',
                description: 'Sweet red cherries.',
                foodValue: 20, sellValue: 8, cookable: true, feedable: true
            },
            'peach': {
                name: 'Peach', emoji: '🍑', image: 'fruit5.png',
                rarity: 'Rare', rarityColor: '#2563eb',
                description: 'A golden peach. Rare find!',
                foodValue: 35, sellValue: 18, cookable: true, feedable: true
            },
            'lemon': {
                name: 'Lemon', emoji: '🍋', image: 'fruit6.png',
                rarity: 'Rare', rarityColor: '#2563eb',
                description: 'Tart and zesty. Great for cooking.',
                foodValue: 14, sellValue: 15, cookable: true, feedable: true
            },
            'mango': {
                name: 'Mango', emoji: '🥭', image: 'fruit7.png',
                rarity: 'Epic', rarityColor: '#9333ea',
                description: 'A tropical prize from a tall tree.',
                foodValue: 50, sellValue: 30, cookable: true, feedable: true
            },
            'coconut': {
                name: 'Coconut', emoji: '🥥', image: 'fruit8.png',
                rarity: 'Epic', rarityColor: '#9333ea',
                description: 'Hard to shake down but worth it.',
                foodValue: 45, sellValue: 28, cookable: true, feedable: true
            },
            'food': {
                name: 'Cooked Food',
                emoji: '🍖',
                image: 'food1.png',
                rarity: 'Rare',
                rarityColor: '#2563eb',  // Pink
                description: 'A delicious prepared meal. Restores 100 hunger!',
                foodValue: 100,  // Gives 100 slime XP when eaten
                sellValue: 50,   // Sells for 50 coins
                cookable: false,
                feedable: true
            },
            'burnt_food': {
                name: 'Burnt Food',
                rarity: 'Common',
                rarityColor: '#111111',
                description: 'Completely charred and inedible.',
                foodValue: 1,
                sellValue: 1,
                cookable: false,
                feedable: true
            },
            // === COOKED FOODS ===
            'fish_soup': {
                name: 'Fish Soup', emoji: '🍲',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'A warm bowl of fish broth.',
                foodValue: 180, sellValue: 60,
                cookable: false, feedable: true
            },
            'carrot_stew': {
                name: 'Carrot Stew', emoji: '🥘',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'Thick hearty carrot stew.',
                foodValue: 220, sellValue: 80,
                cookable: false, feedable: true
            },
            'tomato_soup': {
                name: 'Tomato Soup', emoji: '🍅',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'Rich creamy tomato soup.',
                foodValue: 170, sellValue: 55,
                cookable: false, feedable: true
            },
            'potato_roast': {
                name: 'Potato Roast', emoji: '🥔',
                rarity: 'Rare', rarityColor: '#2563eb',
                description: 'Crispy golden roasted potatoes.',
                foodValue: 280, sellValue: 110,
                cookable: false, feedable: true
            },
            'corn_bread': {
                name: 'Corn Bread', emoji: '🌽',
                rarity: 'Rare', rarityColor: '#2563eb',
                description: 'Sweet golden corn bread.',
                foodValue: 320, sellValue: 130,
                cookable: false, feedable: true
            },
            'onion_broth': {
                name: 'Onion Broth', emoji: '🧅',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'A rich savoury onion broth.',
                foodValue: 200, sellValue: 75,
                cookable: false, feedable: true
            },
            'pumpkin_pie': {
                name: 'Pumpkin Pie', emoji: '🥧',
                rarity: 'Epic', rarityColor: '#7c3aed',
                description: 'A legendary slice of pumpkin pie.',
                foodValue: 500, sellValue: 250,
                cookable: false, feedable: true
            },
            'fish_tacos': {
                name: 'Fish Tacos', emoji: '🌮',
                rarity: 'Rare', rarityColor: '#2563eb',
                description: 'Fish and corn wrapped up tight.',
                foodValue: 380, sellValue: 160,
                cookable: false, feedable: true
            },
            'veggie_feast': {
                name: 'Veggie Feast', emoji: '🥗',
                rarity: 'Epic', rarityColor: '#7c3aed',
                description: 'Every vegetable in one bowl.',
                foodValue: 800, sellValue: 500,
                cookable: false, feedable: true
            },

            'burnt': {
                name: 'Burnt Food',
                rarity: 'Common',
                rarityColor: '#111111',
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
                rarity: 'Uncommon',
                rarityColor: '#2d8a2d',
                description: 'A small mysterious rocky shell. Crack it at the Shack!',
                foodValue: 0, sellValue: 2, cookable: false, feedable: false,
                crackable: true
            },
            'medium_geode': {
                name: 'Medium Geode',
                emoji: '🪨',
                image: 'geode2.png',
                rarity: 'Rare',
                rarityColor: '#2563eb',
                description: 'A medium geode from Depth 2. Crack it at the Shack!',
                foodValue: 0, sellValue: 5, cookable: false, feedable: false,
                crackable: true
            },
            'large_geode': {
                name: 'Large Geode',
                emoji: '🪨',
                image: 'geode3.png',
                rarity: 'Epic',
                rarityColor: '#7c3aed',
                description: 'A large geode from Depth 3. Crack it at the Shack!',
                foodValue: 0, sellValue: 10, cookable: false, feedable: false,
                crackable: true
            },
            'rare_geode': {
                name: 'Rare Geode',
                emoji: '🪨',
                image: 'geode4.png',
                rarity: 'Legendary',
                rarityColor: '#ea580c',
                description: 'A rare golden geode from Depth 4. Crack it at the Shack!',
                foodValue: 0, sellValue: 20, cookable: false, feedable: false,
                crackable: true
            },
            'rainbow_geode': {
                name: 'Rainbow Geode',
                emoji: '🌈🪨',
                image: 'geode5.png',
                rarity: 'Rainbow',
                rarityColor: 'rainbow',
                description: 'An impossibly rare geode from the deepest depths. Crack it at the Shack!',
                foodValue: 0, sellValue: 100, cookable: false, feedable: false,
                crackable: true,
                sellable: false
            },
            'rock': {
                name: 'Rock',
                image: 'rock1.png',
                rarity: 'Common',
                rarityColor: '#111111',
                description: 'A plain rock. Not very valuable.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false,
                crackable: false
            },
            'egg': {
                name: 'Egg',
                emoji: '🥚',
                image: 'egg1.png',
                rarity: 'Common',
                rarityColor: '#111111',
                description: 'A fresh egg from the coop. Can be cooked or fed to your slime.',
                foodValue: 8,
                sellValue: 4,
                cookable: true,
                feedable: true
            },
            'porkchops': {
                name: 'Porkchops',
                emoji: '🥩',
                image: 'meat1.png',
                rarity: 'Common',
                rarityColor: '#111111',
                description: 'Hearty pork chops from Porkchops the pig.',
                foodValue: 18,
                sellValue: 8,
                cookable: true,
                feedable: true
            },
            'ham': {
                name: 'Ham',
                emoji: '🍖',
                image: 'meat2.png',
                rarity: 'Uncommon',
                rarityColor: '#2d8a2d',
                description: 'A thick cut of ham. Porkchops outdid himself.',
                foodValue: 30,
                sellValue: 18,
                cookable: true,
                feedable: true
            },
            'sausages': {
                name: 'Sausages',
                emoji: '🌭',
                image: 'meat3.png',
                rarity: 'Rare',
                rarityColor: '#2563eb',
                description: 'Plump sausages. Rare even for Porkchops.',
                foodValue: 45,
                sellValue: 35,
                cookable: true,
                feedable: true
            },
            'bacon': {
                name: 'Bacon',
                emoji: '🥓',
                image: 'meat4.png',
                rarity: 'Legendary',
                rarityColor: '#ea580c',
                description: 'Legendary crispy bacon. Almost too good to eat.',
                foodValue: 70,
                sellValue: 80,
                cookable: true,
                feedable: true
            },
            'rainbow_milk': {
                name: 'Rainbow Milk',
                emoji: '🌈',
                image: 'meat5.png',
                rarity: 'Rainbow',
                rarityColor: 'rainbow',
                description: 'Magical rainbow milk from Porkchops. Grants +1 level to ALL skills!',
                foodValue: 50,
                sellValue: 500,
                cookable: false,
                feedable: false
            },
            'emerald': {
                name: 'Emerald', emoji: '💚', image: 'gem2.png',
                rarity: 'Legendary', rarityColor: '#ea580c',
                description: 'A sparkling green emerald.',
                foodValue: 0, sellValue: 100, cookable: false, feedable: false
            },
            'ruby': {
                name: 'Ruby', emoji: '❤️', image: 'gem4.png',
                rarity: 'Legendary', rarityColor: '#ea580c',
                description: 'A brilliant red ruby.',
                foodValue: 0, sellValue: 120, cookable: false, feedable: false
            },
            'sapphire': {
                name: 'Sapphire', emoji: '💙', image: 'gem5.png',
                rarity: 'Legendary', rarityColor: '#ea580c',
                description: 'A deep blue sapphire.',
                foodValue: 0, sellValue: 140, cookable: false, feedable: false
            },
            'amethyst': {
                name: 'Amethyst', emoji: '💜', image: 'gem1.png',
                rarity: 'Legendary', rarityColor: '#ea580c',
                description: 'A rich purple amethyst.',
                foodValue: 0, sellValue: 160, cookable: false, feedable: false
            },
            'topaz': {
                name: 'Topaz', emoji: '🧡', image: 'gem6.png',
                rarity: 'Legendary', rarityColor: '#ea580c',
                description: 'A warm golden topaz.',
                foodValue: 0, sellValue: 200, cookable: false, feedable: false
            },
            'diamond': {
                name: 'Diamond', emoji: '💎', image: 'gem3.png',
                rarity: 'Rainbow', rarityColor: 'rainbow',
                description: 'An impossibly perfect diamond. Worth a fortune.',
                foodValue: 0, sellValue: 1000, cookable: false, feedable: false
            },
            'ore': {
                name: 'Copper Ore', emoji: '🟤', image: 'ore1.png',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'Uncommon copper ore found in The Cave.',
                foodValue: 0, sellValue: 10, cookable: false, feedable: false
            },
            'copper_ore': {
                name: 'Copper Ore', emoji: '🟤', image: 'ore1.png',
                rarity: 'Uncommon', rarityColor: '#2d8a2d',
                description: 'Uncommon copper ore found in The Cave.',
                foodValue: 0, sellValue: 10, cookable: false, feedable: false
            },
            'coal': {
                name: 'Coal', emoji: '🖤', image: 'fuel1.png',
                rarity: 'Common', rarityColor: '#111111',
                description: 'A lump of coal. Burns well.',
                foodValue: 0, sellValue: 6, cookable: false, feedable: false
            },
            'iron_ore': {
                name: 'Iron Ore', emoji: '⚙️', image: 'ore3.png',
                rarity: 'Rare', rarityColor: '#2563eb',
                description: 'Dense iron ore from Depth 1 and beyond.',
                foodValue: 0, sellValue: 35, cookable: false, feedable: false
            },
            'silver_ore': {
                name: 'Silver Ore', emoji: '🔘', image: 'ore4.png',
                rarity: 'Epic', rarityColor: '#7c3aed',
                description: 'Gleaming silver ore from deep within Depth 3.',
                foodValue: 0, sellValue: 100, cookable: false, feedable: false
            },
            'gold_ore': {
                name: 'Gold Ore', emoji: '🌟', image: 'ore2.png',
                rarity: 'Legendary', rarityColor: '#ea580c',
                description: 'Precious gold ore found only at Depth 5.',
                foodValue: 0, sellValue: 300, cookable: false, feedable: false
            },
            'copper_bar': {
                name: 'Copper Bar', emoji: '🟫', image: 'metal1.png',
                rarity: 'Common', rarityColor: '#b45309',
                description: 'A smelted copper bar, forged in the Furnace.',
                foodValue: 0, sellValue: 40, cookable: false, feedable: false
            },
            'iron_bar': {
                name: 'Iron Bar', emoji: '⬜', image: 'metal2.png',
                rarity: 'Uncommon', rarityColor: '#6b7280',
                description: 'A smelted iron bar, forged in the Furnace.',
                foodValue: 0, sellValue: 80, cookable: false, feedable: false
            },
            'silver_bar': {
                name: 'Silver Bar', emoji: '🔲', image: 'metal3.png',
                rarity: 'Rare', rarityColor: '#9ca3af',
                description: 'A smelted silver bar, forged in the Furnace.',
                foodValue: 0, sellValue: 200, cookable: false, feedable: false
            },
            'gold_bar': {
                name: 'Gold Bar', emoji: '🟨', image: 'metal4.png',
                rarity: 'Legendary', rarityColor: '#d97706',
                description: 'A smelted gold bar, forged in the Furnace.',
                foodValue: 0, sellValue: 600, cookable: false, feedable: false
            },
            'basket': {
                name: '🧺 Basket',
                emoji: '🧺',
                image: 'basket1.png',
                rarity: 'Uncommon',
                rarityColor: '#2d8a2d',
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
                rarityColor: '#111111',
                description: 'A soggy lily pad. Not much use.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false
            },
            'old_boot': {
                name: 'Old Boot',
                emoji: '👢',
                image: 'trash4.png',
                rarity: 'Common',
                rarityColor: '#111111',
                description: 'Someone lost this long ago.',
                foodValue: 0,
                sellValue: 1,
                cookable: false,
                feedable: false
            },
            'seaweed': {
                name: 'Seaweed',
                emoji: '🌿',
                image: 'trash3.png',
                rarity: 'Common',
                rarityColor: '#111111',
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
        };
        
        const FROGS_DATA = {
            'frog_blue':   { name: '🐸 Blue Frog',   icon: '🔵🐸', color: '#3b82f6', description: 'Found while fishing at the Pond or River' },
            'frog_yellow': { name: '🐸 Yellow Frog', icon: '🟡🐸', color: '#eab308', description: 'Found while automining in the Cave' },
            'frog_red':    { name: '🐸 Red Frog',    icon: '🔴🐸', color: '#ef4444', description: 'Found while cooking at the Hearth' },
            'frog_green':  { name: '🐸 Green Frog',  icon: '🟢🐸', color: '#22c55e', description: 'Found while farming in the Garden' },
            'frog_purple': { name: '🐸 Purple Frog', icon: '🟣🐸', color: '#a855f7', description: 'Found inside a geode at the Shack' }
        };
        
