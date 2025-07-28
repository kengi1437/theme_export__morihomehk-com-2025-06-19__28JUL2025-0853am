/**
 * Custom Tab Accordion Functionality
 * Handles collapsible page content in custom tabs
 */

// Toggle page content visibility
function togglePageContent(titleElement) {
    const pageContent = titleElement.nextElementSibling;
    const isExpanded = titleElement.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse
        titleElement.classList.remove('expanded');
        pageContent.classList.remove('expanded');
    } else {
        // Expand
        titleElement.classList.add('expanded');
        pageContent.classList.add('expanded');
    }
}

// Initialize accordion functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Find all custom tab pages
    const customTabPages = document.querySelectorAll('.custom-tab-page');
    
    customTabPages.forEach(function(page) {
        const title = page.querySelector('.page-title');
        const content = page.querySelector('.page-content');
        
        if (title && content) {
            // Add click event listener
            title.addEventListener('click', function() {
                togglePageContent(this);
            });
            
            // All pages start collapsed by default
            // Remove any existing expanded classes
            title.classList.remove('expanded');
            content.classList.remove('expanded');
        }
    });
});

// Handle dynamic content loading (for AJAX-loaded tabs)
function initializeCustomTabAccordion() {
    const customTabPages = document.querySelectorAll('.custom-tab-page:not([data-accordion-initialized])');
    
    customTabPages.forEach(function(page) {
        const title = page.querySelector('.page-title');
        const content = page.querySelector('.page-content');

        if (title && content) {
            // Mark as initialized
            page.setAttribute('data-accordion-initialized', 'true');

            // Add click event listener
            title.addEventListener('click', function() {
                togglePageContent(this);
            });

            // All pages start collapsed by default
            title.classList.remove('expanded');
            content.classList.remove('expanded');
        }
    });
}

// Auto-initialize when new content is added to the page
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check if any added nodes contain custom tab pages
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList && node.classList.contains('custom-tab-page')) {
                        initializeCustomTabAccordion();
                    } else if (node.querySelector && node.querySelector('.custom-tab-page')) {
                        initializeCustomTabAccordion();
                    }
                }
            });
        }
    });
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Expose functions globally for inline onclick handlers
window.togglePageContent = togglePageContent;
window.initializeCustomTabAccordion = initializeCustomTabAccordion;
