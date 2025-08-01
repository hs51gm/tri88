// Game Configuration
const config = {
    maxLevels: 15,
    potionColors: ['red', 'yellow', 'purple', 'orange', 'darkblue', 'lightblue', 'darkgreen', 'lightgreen', 'brown', 'pink'],
    // Level setup - each level now has dynamic formula generation based on difficulty
    levels: [
        { level_id: 1, formula_length: 3, max_attempts: 12 },
        { level_id: 2, formula_length: 4, max_attempts: 12 },
        { level_id: 3, formula_length: 5, max_attempts: 10 },
        { level_id: 4, formula_length: 5, max_attempts: 10 },
        { level_id: 5, formula_length: 6, max_attempts: 10 },
        { level_id: 6, formula_length: 6, max_attempts: 8 },
        { level_id: 7, formula_length: 7, max_attempts: 8 },
        { level_id: 8, formula_length: 7, max_attempts: 8 },
        { level_id: 9, formula_length: 8, max_attempts: 7 },
        { level_id: 10, formula_length: 8, max_attempts: 7 },
        { level_id: 11, formula_length: 8, max_attempts: 6 },
        { level_id: 12, formula_length: 9, max_attempts: 6 },
        { level_id: 13, formula_length: 9, max_attempts: 6 },
        { level_id: 14, formula_length: 10, max_attempts: 5 },
        { level_id: 15, formula_length: 10, max_attempts: 5 }
    ],
    animationDelay: 500, // ms
    checkDelay: 1000     // ms
};

// Game State
const gameState = {
    currentLevel: 1,
    score: 100,
    attempts: 10,
    completedLevels: [],
    currentFormula: [],
    availablePotions: [],
    selectedPotions: [],
    lockedPositions: [],
    splashPositions: [], // Tracks where splashes are to avoid placing same color
    racks: [],
    currentAttempt: 0,
    isChecking: false
};

// DOM Elements
const gameArea = document.getElementById('gameArea');
const bottomRack = document.getElementById('bottomRack');
const progressFill = document.getElementById('progressFill');
const cauldronBubbles = document.getElementById('cauldronBubbles');
const successOverlay = document.getElementById('successOverlay');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const levelIndicator = document.querySelector('.level-indicator');
const coinAmount = document.querySelector('.coin-amount');

// Initialize the game
function initGame() {
    console.log('Initializing Magic Cauldron Game...');
    
    // Set initial level indicator
    levelIndicator.textContent = gameState.currentLevel;
    
    // Create cauldron bubbles
    createCauldronBubbles();
    
    // Set up event listeners
    setupEventListeners();
    
    // Preload images
    preloadImages();
    
    // Generate level
    generateLevel(gameState.currentLevel);
    
    // Update progress bar
    updateProgressBar();
}

// Generate a random formula for a level
function generateRandomFormula(length) {
    // Shuffle all available colors
    const shuffledColors = shuffleArray([...config.potionColors]);
    
    // Take the first 'length' colors
    return shuffledColors.slice(0, length);
}

// Preload images
function preloadImages() {
    const colors = config.potionColors;
    const images = [];
    
    // Add all potion images
    colors.forEach(color => {
        images.push(`potion_${color}.png`);
        images.push(`splash_${color}.png`);
    });
    
    // Preload all images
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Create cauldron bubbles
function createCauldronBubbles() {
    cauldronBubbles.innerHTML = '';
    
    for (let i = 0; i < 10; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        const size = 5 + Math.random() * 10;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        bubble.style.left = `${10 + Math.random() * 80}%`;
        bubble.style.bottom = `${Math.random() * 70}%`;
        
        bubble.style.animationDuration = `${1 + Math.random() * 2}s`;
        bubble.style.animationDelay = `${Math.random()}s`;
        
        cauldronBubbles.appendChild(bubble);
    }
}

// Setup event listeners
function setupEventListeners() {
    nextLevelBtn.addEventListener('click', () => {
        successOverlay.classList.remove('active');
        
        // Go to next level or restart if at max level
        if (gameState.currentLevel < config.maxLevels) {
            gameState.currentLevel++;
        } else {
            // Reset to level 1 after completing all levels
            gameState.currentLevel = 1;
        }
        
        generateLevel(gameState.currentLevel);
    });
}

// Generate a level
function generateLevel(levelNumber) {
    console.log(`Generating level ${levelNumber}`);
    
    // Get the level data
    const levelData = config.levels.find(level => level.level_id === levelNumber) || config.levels[0];
    
    // Update level indicator
    levelIndicator.textContent = levelNumber;
    
    // Generate random formula for this level
    const formula = generateRandomFormula(levelData.formula_length);
    console.log(`Level ${levelNumber} formula:`, formula);
    
    // Reset game state for new level
    gameState.attempts = levelData.max_attempts;
    gameState.currentFormula = [...formula];
    
    // Generate available potions - add some extras beyond formula
    // For harder levels, we'll add more decoy colors
    const extraColors = Math.min(4, 10 - levelData.formula_length); // Extra decoy colors
    let availableColors = [...formula];
    
    // Add decoy colors that aren't in formula
    const decoyColors = config.potionColors.filter(c => !formula.includes(c));
    const selectedDecoys = shuffleArray(decoyColors).slice(0, extraColors);
    availableColors = availableColors.concat(selectedDecoys);
    
    // Make sure availablePotions has no duplicates
    gameState.availablePotions = [...new Set(availableColors)];
    
    gameState.selectedPotions = [];
    gameState.lockedPositions = Array(formula.length).fill(null);
    
    // Reset splash positions for new level - using unique arrays for each position
    gameState.splashPositions = Array(formula.length).fill().map(() => []);
    
    gameState.racks = [];
    gameState.currentAttempt = 0;
    gameState.isChecking = false;
    
    // Clear game area
    gameArea.innerHTML = '';
    
    // Create first rack
    createNewRack();
    
    // Populate bottom rack with potions
    populateBottomRack();
    
    // Update progress bar
    updateProgressBar();
    
    // Log for debugging
    console.log("Level setup complete:");
    console.log("- Formula length:", formula.length);
    console.log("- Formula:", gameState.currentFormula);
    console.log("- Available colors:", gameState.availablePotions);
    console.log("- Max attempts:", gameState.attempts);
}

// Create a new rack for the next attempt
function createNewRack() {
    const rack = document.createElement('div');
    rack.classList.add('rack');
    rack.dataset.attempt = gameState.currentAttempt;
    
    // Create slots based on formula length
    for (let i = 0; i < gameState.currentFormula.length; i++) {
        const slot = document.createElement('div');
        slot.classList.add('slot');
        slot.dataset.index = i;
        
        // Create slot base (green platform)
        const slotBase = document.createElement('div');
        slotBase.classList.add('slot-base');
        slot.appendChild(slotBase);
        
        // If this position is locked (correct from previous attempt)
        if (gameState.lockedPositions[i] !== null) {
            // Create a locked potion
            const potion = document.createElement('div');
            potion.classList.add('potion', `potion-${gameState.lockedPositions[i]}`);
            potion.dataset.color = gameState.lockedPositions[i];
            potion.dataset.locked = 'true';
            
            // Highlight the slot to show it's correct
            slot.classList.add('correct-position');
            
            slot.appendChild(potion);
        }
        // NO SPLASH ADDED TO NEW RACKS
        
        rack.appendChild(slot);
    }
    
    // Add the rack to the game area
    gameArea.insertBefore(rack, gameArea.firstChild);
    
    // Keep track of racks
    gameState.racks.push(rack);
    gameState.currentAttempt++;
    
    // Scroll to the newest rack
    setTimeout(() => {
        rack.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Populate the bottom rack with potions
function populateBottomRack() {
    // Clear the bottom rack
    bottomRack.innerHTML = '';
    
    // Get all colors that are already correctly placed
    const correctColors = gameState.lockedPositions.filter(color => color !== null);
    
    // Remove colors that are already locked in their correct positions
    const remainingFormulaColors = gameState.currentFormula.filter((color, index) => 
        gameState.lockedPositions[index] === null
    );
    
    // Get available colors (minus already locked ones)
    const availableBottomColors = gameState.availablePotions.filter(color => 
        !correctColors.includes(color)
    );
    
    // Make sure all remaining formula colors are included
    const mustIncludeColors = remainingFormulaColors.filter((color, index, self) => 
        self.indexOf(color) === index // Unique colors from formula
    );
    
    // Select colors for the bottom rack
    let bottomRackColors = [...mustIncludeColors];
    
    // Add extra decoy colors if needed to fill the rack
    const extraColors = availableBottomColors.filter(c => !bottomRackColors.includes(c));
    const shuffledExtras = shuffleArray(extraColors);
    const neededExtras = Math.max(0, gameState.currentFormula.length - bottomRackColors.length);
    bottomRackColors = bottomRackColors.concat(shuffledExtras.slice(0, neededExtras));
    
    // IMPORTANT: Randomly shuffle ALL the bottom rack colors to avoid order matching formula
    bottomRackColors = shuffleArray(bottomRackColors);
    
    // Add the potions to the bottom rack in random order
    bottomRackColors.forEach(color => {
        const potion = document.createElement('div');
        potion.classList.add('potion', `potion-${color}`);
        potion.dataset.color = color;
        potion.addEventListener('click', () => selectPotion(potion));
        
        bottomRack.appendChild(potion);
    });
    
    // Final check for duplicates
    const finalColors = Array.from(bottomRack.querySelectorAll('.potion')).map(p => p.dataset.color);
    if (new Set(finalColors).size !== finalColors.length) {
        console.error("DUPLIKAT TERDETEKSI di bottom rack:", finalColors);
    }
}

// Enhanced potion selection with animation
function selectPotion(potion) {
    // Don't allow selection during checking
    if (gameState.isChecking) return;
    
    // Get color of selected potion
    const color = potion.dataset.color;
    
    // Find the first empty slot in the current rack
    const currentRack = gameState.racks[gameState.racks.length - 1];
    const emptySlots = Array.from(currentRack.querySelectorAll('.slot')).filter(slot => 
        !slot.querySelector('.potion')
    );
    
    if (emptySlots.length > 0) {
        // Take the first empty slot
        const slot = emptySlots[0];
        const slotIndex = parseInt(slot.dataset.index);
        
        // Get position data for animation
        const potionRect = potion.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();
        
        // Create a clone for the animation
        const clone = potion.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = `${potionRect.left}px`;
        clone.style.top = `${potionRect.top}px`;
        clone.style.width = `${potionRect.width}px`;
        clone.style.height = `${potionRect.height}px`;
        clone.style.zIndex = '1000';
        clone.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
        
        // Add to document body for animation
        document.body.appendChild(clone);
        
        // Start animation after a small delay
        setTimeout(() => {
            clone.style.left = `${slotRect.left + slotRect.width/2 - potionRect.width/2}px`;
            clone.style.top = `${slotRect.top + slotRect.height/2 - potionRect.height/2}px`;
        }, 10);
        
        // Remove the original potion from bottom rack
        potion.remove();
        
        // After animation completes, create the actual potion in the slot
        setTimeout(() => {
            // Remove the animated clone
            clone.remove();
            
            // Create new potion in the rack slot
            const newPotion = document.createElement('div');
            newPotion.classList.add('potion', `potion-${color}`);
            newPotion.dataset.color = color;
            
            slot.appendChild(newPotion);
            
            // Update selected potions
            gameState.selectedPotions[slotIndex] = color;
            
            // Check if the rack is full
            const isRackFull = currentRack.querySelectorAll('.potion').length === gameState.currentFormula.length;
            
            if (isRackFull) {
                // Check the formula after a delay
                gameState.isChecking = true;
                setTimeout(() => checkFormula(), config.checkDelay);
            }
        }, 600);
    }
}

// Check if the current formula matches the target
function checkFormula() {
    console.log("Checking formula...");
    
    // Decrease attempts
    gameState.attempts--;
    
    // Get the current rack
    const currentRack = gameState.racks[gameState.racks.length - 1];
    
    // Get all potions in the rack that aren't already locked
    const potions = Array.from(currentRack.querySelectorAll('.potion:not([data-locked="true"])'));
    
    // Create feedback array for animation
    const feedback = [];
    
    // Check each position
    potions.forEach((potion) => {
        const slotIndex = parseInt(potion.parentNode.dataset.index);
        const color = potion.dataset.color;
        const targetColor = gameState.currentFormula[slotIndex];
        
        // Check if the color is correct for this position
        if (color === targetColor) {
            feedback.push({ potion, result: 'correct', index: slotIndex });
            
            // Lock this position
            gameState.lockedPositions[slotIndex] = color;
        } else {
            // Check if color exists elsewhere in the formula
            const targetIndex = gameState.currentFormula.indexOf(color);
            
            if (targetIndex !== -1 && gameState.lockedPositions[targetIndex] !== color) {
                // Color exists elsewhere in formula
                feedback.push({ potion, result: 'wrong-position', index: slotIndex });
                
                // Add splash for this color in this position
                if (!gameState.splashPositions[slotIndex].includes(color)) {
                    gameState.splashPositions[slotIndex].push(color);
                }
            } else {
                // Color doesn't exist in formula
                feedback.push({ potion, result: 'wrong-color', index: slotIndex });
                
                // Add splash for this color in this position
                if (!gameState.splashPositions[slotIndex].includes(color)) {
                    gameState.splashPositions[slotIndex].push(color);
                }
            }
        }
    });
    
    // Show feedback animation
    animateFeedback(feedback, () => {
        // Check if all positions are correct
        const allCorrect = gameState.lockedPositions.every((color, index) => 
            color === gameState.currentFormula[index]
        );
        
        if (allCorrect) {
            // Level completed!
            handleLevelComplete();
        } else if (gameState.attempts > 0) {
            // Continue playing - create new rack for next attempt
            createNewRack();
            
            // Repopulate bottom rack
            populateBottomRack();
            
            // Allow selecting potions again
            gameState.isChecking = false;
        } else {
            // Game over - out of attempts
            alert("You're out of attempts! Try again.");
            
            // Reset the level
            generateLevel(gameState.currentLevel);
        }
    });
}

// Animate feedback for the current attempt
function animateFeedback(feedback, callback) {
    let animationsCompleted = 0;
    
    feedback.forEach(item => {
        setTimeout(() => {
            if (item.result === 'correct') {
                // Correct potion - stays in place
                item.potion.style.transform = 'scale(1.2)';
                
                // Add highlight to the slot
                item.potion.parentNode.classList.add('correct-position');
                
                setTimeout(() => {
                    item.potion.style.transform = 'scale(1)';
                    item.potion.dataset.locked = 'true';
                    
                    // Update animation counter
                    animationsCompleted++;
                    if (animationsCompleted === feedback.length) {
                        callback();
                    }
                }, 300);
            } else {
                // Wrong potion - explode and create splash
                item.potion.style.animation = 'explode 0.5s forwards';
                
                // Create splash in the slot
                const slot = item.potion.parentNode;
                const color = item.potion.dataset.color;
                
                const splash = document.createElement('div');
                splash.classList.add('splash', `splash-${color}`);
                splash.style.animation = 'splash 0.5s forwards';
                
                slot.appendChild(splash);
                
                // Remove potion after animation
                setTimeout(() => {
                    item.potion.remove();
                    
                    // Update animation counter
                    animationsCompleted++;
                    if (animationsCompleted === feedback.length) {
                        callback();
                    }
                }, 500);
            }
        }, 200 * feedback.indexOf(item)); // Stagger the animations
    });
    
    // If no animations to run, call callback immediately
    if (feedback.length === 0) {
        callback();
    }
}

// Handle level completion
function handleLevelComplete() {
    console.log("Level completed!");
    
    // Add to completed levels if not already there
    if (!gameState.completedLevels.includes(gameState.currentLevel)) {
        gameState.completedLevels.push(gameState.currentLevel);
    }
    
    // Update score
    gameState.score += 50;
    coinAmount.textContent = gameState.score;
    
    // Update progress bar
    updateProgressBar();
    
    // Animate potions into cauldron
    animatePotionsIntoCauldron(() => {
        // Show success overlay
        successOverlay.classList.add('active');
    });
}

// Animate potions pouring into cauldron
function animatePotionsIntoCauldron(callback) {
    // Get all locked potions
    const lockedPotions = document.querySelectorAll('.potion[data-locked="true"]');
    
    // Get cauldron position
    const cauldron = document.querySelector('.cauldron');
    const cauldronRect = cauldron.getBoundingClientRect();
    
    // Animate each potion
    let animationsCompleted = 0;
    
    lockedPotions.forEach((potion, index) => {
        // Clone the potion for animation
        const clone = potion.cloneNode(true);
        const rect = potion.getBoundingClientRect();
        
        // Style the clone
        clone.style.position = 'fixed';
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '100';
        
        // Add to body
        document.body.appendChild(clone);
        
        // Start animation after delay
        setTimeout(() => {
            clone.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1.2)';
            clone.style.left = `${cauldronRect.left + cauldronRect.width/2}px`;
            clone.style.top = `${cauldronRect.top + cauldronRect.height/2}px`;
            clone.style.transform = 'scale(0.1)';
            clone.style.opacity = '0';
            
            // Remove clone after animation
            setTimeout(() => {
                clone.remove();
                
                // Check if all animations completed
                animationsCompleted++;
                if (animationsCompleted === lockedPotions.length && callback) {
                    // Add bubbling effect to cauldron
                    addBubblingEffect();
                    callback();
                }
            }, 800);
        }, index * 200);
    });
}

// Add bubbling effect to cauldron
function addBubblingEffect() {
    // Create additional bubbles
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        const size = 5 + Math.random() * 15;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        
        bubble.style.left = `${10 + Math.random() * 80}%`;
        bubble.style.bottom = `${Math.random() * 70}%`;
        
        bubble.style.animation = `bubble ${0.5 + Math.random()}s infinite ease-in-out`;
        
        cauldronBubbles.appendChild(bubble);
        
        // Remove extra bubbles after a while
        setTimeout(() => {
            bubble.remove();
        }, 3000);
    }
}

// Update progress bar
function updateProgressBar() {
    const progress = (gameState.completedLevels.length / config.maxLevels) * 100;
    progressFill.style.width = `${progress}%`;
}

// Helper function to shuffle array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);