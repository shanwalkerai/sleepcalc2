// This script is specific to the sleep-cycle-calculator.html page
// It assumes main.js and header.js handle general functionality like theme, nav, etc.

// --- DOM Elements ---
const getElement = (id) => document.getElementById(id);

// --- Utility Functions (Copied from main.js for standalone use if needed, or ensure main.js loads first) ---
function parseFormattedTime(timeString) {
    if (!timeString || typeof timeString !== 'string') return null;
    const match = timeString.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);
    if (match) {
        return { hour: match[1], minute: match[2], ampm: match[3].toUpperCase() };
    }
    console.warn("Could not parse time string:", timeString);
    return null;
}

// --- Initialization specific to this page ---
function initSleepCyclePage() {
    console.log("Initializing sleep-cycle-calculator page specific script.");
    // Any specific logic for this page can go here.
    // For now, it mainly relies on the HTML structure and main.js for calculator logic.

    // Example: Set publish date dynamically if needed (though it's static in HTML now)
    // const publishDateSpan = getElement('publish-date');
    // if (publishDateSpan) {
    //     // You could fetch this date or use a fixed one
    //     // publishDateSpan.textContent = new Date('2024-07-27').toLocaleDateString();
    // }
}

// --- Run Initialization ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSleepCyclePage);
} else {
    initSleepCyclePage();
}
