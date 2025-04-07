// --- Import HTML Content ---
// Use Vite's ?raw suffix to import the file content as a string
import headerHtmlContent from '/includes/header.html?raw';
import footerHtmlContent from '/includes/footer.html?raw';

// --- DOM Elements ---
const getElement = (id) => document.getElementById(id);
const querySelector = (selector) => document.querySelector(selector);
const querySelectorAll = (selector) => document.querySelectorAll(selector);

// --- Google Analytics Injection ---
function injectGoogleAnalytics() {
    const gaScriptId = 'google-analytics-script';
    const gaCodeId = 'google-analytics-code';
    const gaId = 'G-0C13MC18T8'; // Your Google Analytics ID

    // Check if scripts already exist
    if (document.getElementById(gaScriptId) || document.getElementById(gaCodeId)) {
        console.log("Google Analytics scripts already injected.");
        return;
    }

    // Create the async script tag
    const gaScript = document.createElement('script');
    gaScript.id = gaScriptId;
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;

    // Create the inline script tag
    const gaCode = document.createElement('script');
    gaCode.id = gaCodeId;
    gaCode.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;

    // Append scripts to the head
    document.head.appendChild(gaScript);
    document.head.appendChild(gaCode);

    console.log("Google Analytics scripts injected into <head>.");
}


// --- Mobile Navigation Toggle ---
// Note: Assumes hamburger button and nav links container are part of loaded header.html
function toggleMobileMenu() {
    const navLinksContainer = getElement('nav-links'); // Get elements after load
    const hamburgerButton = getElement('hamburger-button');
    if (navLinksContainer && hamburgerButton) {
        const isExpanded = hamburgerButton.getAttribute('aria-expanded') === 'true';
        hamburgerButton.setAttribute('aria-expanded', (!isExpanded).toString()); // Use string for ARIA
        navLinksContainer.classList.toggle('active');
        document.body.classList.toggle('no-scroll', !isExpanded); // Prevent body scroll when menu is open
    }
}

// --- Set Active Nav Link ---
// This needs to run *after* the header HTML is loaded
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const headerElement = getElement('main-header') || querySelector('header');
    if (!headerElement) return; // Header not loaded yet

    const navLinks = headerElement.querySelectorAll('.main-nav a.nav-link'); // Scope links to header

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        link.classList.remove('active');
        link.removeAttribute('aria-current'); // Remove aria-current

        // Handle exact match or root path '/'
        if (linkPath === currentPath || (currentPath === '/' && linkPath === '/')) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page'); // Add aria-current
        }
        // Special handling for blog section (highlight Blog link on blog index and individual posts)
        else if (linkPath === '/blog.html' && (currentPath.startsWith('/blog/') || currentPath === '/blog.html')) {
             link.classList.add('active');
             link.setAttribute('aria-current', 'page');
        }
        // Add similar logic for other sections if needed
    });
}

// --- Function to Load Header/Footer Includes (using imported content) ---
function loadIncludes() {
    const headerElement = getElement('main-header') || querySelector('header');
    const footerElement = getElement('main-footer') || querySelector('footer');

    try {
        // Insert Header Content
        if (headerElement) {
            if (headerHtmlContent) {
                headerElement.innerHTML = headerHtmlContent;
                // Header loaded, now attach listeners and update UI elements within it
                // Theme toggle listener removed from here
                const loadedHamburgerButton = getElement('hamburger-button');
                if (loadedHamburgerButton) {
                    loadedHamburgerButton.addEventListener('click', toggleMobileMenu); // Attach listener
                } else {
                     console.warn("Hamburger button not found in loaded header.");
                }
                // Close mobile menu on link click (if applicable)
                const loadedNavLinksContainer = getElement('nav-links');
                 if (loadedNavLinksContainer) {
                    loadedNavLinksContainer.addEventListener('click', (e) => {
                        // Close only if a link inside the nav is clicked and the menu is active
                        if (e.target.tagName === 'A' && loadedNavLinksContainer.classList.contains('active')) {
                            toggleMobileMenu();
                        }
                    });
                } else {
                     console.warn("Nav links container not found in loaded header.");
                }
                setActiveNavLink(); // Set active link now that header exists
            } else {
                 headerElement.innerHTML = '<p class="error-indicator">Error: Header content could not be imported.</p>';
                 console.error("Failed to import header.html content.");
            }
        } else {
             console.warn("Header element not found in the DOM.");
        }

        // Insert Footer Content
        if (footerElement) {
             if (footerHtmlContent) {
                footerElement.innerHTML = footerHtmlContent;
                // Footer loaded, update dynamic elements within it
                const loadedYearSpan = getElement('current-year');
                if (loadedYearSpan) {
                    loadedYearSpan.textContent = new Date().getFullYear();
                } else {
                     console.warn("Current year span not found in loaded footer.");
                }
            } else {
                 footerElement.innerHTML = '<p class="error-indicator">Error: Footer content could not be imported.</p>';
                 console.error("Failed to import footer.html content.");
            }
        } else {
             console.warn("Footer element not found in the DOM.");
        }

    } catch (err) {
        console.error("Error during include insertion:", err);
        if (headerElement) headerElement.innerHTML = '<p class="error-indicator">Error inserting header content.</p>';
        if (footerElement) footerElement.innerHTML = '<p class="error-indicator">Error inserting footer content.</p>';
    }
}


// --- Initialization ---
function init() {
    // applyInitialTheme removed - handled by main.js
    injectGoogleAnalytics(); // Inject GA scripts into <head>
    loadIncludes(); // Load header/footer content using imports and attach listeners
    console.log("Header/Footer Loader Initialized (using imports)");
}

// --- Run Initialization ---
// Use DOMContentLoaded to ensure elements are available
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOMContentLoaded has already fired
    init();
}
