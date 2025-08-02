/**
 * Collapsible Tabs Functionality
 * Handles collapsible content for tab.liquid snippet
 */

class CollapsibleTabs extends HTMLElement {
    constructor() {
        super();
        this.init();
    }

    init() {
        // Find all collapsible triggers within this element
        this.triggers = this.querySelectorAll('.collapsible-trigger');
        
        // Add click event listeners to all triggers
        this.triggers.forEach(trigger => {
            trigger.addEventListener('click', this.handleTriggerClick.bind(this));
        });
    }

    handleTriggerClick(event) {
        event.preventDefault();
        
        const trigger = event.currentTarget;
        const content = trigger.nextElementSibling;
        const isOpen = trigger.classList.contains('is-open');
        
        if (isOpen) {
            this.closeCollapsible(trigger, content);
        } else {
            this.openCollapsible(trigger, content);
        }
    }

    openCollapsible(trigger, content) {
        // Add open classes
        trigger.classList.add('is-open');
        content.classList.add('is-open');
        
        // Set aria attributes
        trigger.setAttribute('aria-expanded', 'true');
        content.setAttribute('aria-hidden', 'false');
        
        // Calculate and set max-height for smooth animation
        const contentHeight = content.scrollHeight;
        content.style.maxHeight = contentHeight + 'px';
        
        // Reset max-height after animation completes
        setTimeout(() => {
            if (content.classList.contains('is-open')) {
                content.style.maxHeight = 'none';
            }
        }, 300);
    }

    closeCollapsible(trigger, content) {
        // Set specific height before closing for smooth animation
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Force reflow
        content.offsetHeight;
        
        // Remove open classes
        trigger.classList.remove('is-open');
        content.classList.remove('is-open');
        
        // Set aria attributes
        trigger.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');
        
        // Animate to closed state
        content.style.maxHeight = '0px';
    }
}

// Auto-initialize collapsible tabs when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize collapsible functionality for existing elements
    initializeCollapsibleTabs();
    
    // Watch for dynamically added content
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    initializeCollapsibleTabs(node);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

function initializeCollapsibleTabs(container = document) {
    // Find all collapsible triggers that haven't been initialized
    const triggers = container.querySelectorAll('.collapsible-trigger:not([data-collapsible-initialized])');
    
    triggers.forEach(trigger => {
        // Mark as initialized
        trigger.setAttribute('data-collapsible-initialized', 'true');
        
        // Add click event listener
        trigger.addEventListener('click', function(event) {
            event.preventDefault();
            
            const content = this.nextElementSibling;
            const isOpen = this.classList.contains('is-open');
            
            if (isOpen) {
                closeCollapsible(this, content);
            } else {
                openCollapsible(this, content);
            }
        });
        
        // Set initial aria attributes
        const content = trigger.nextElementSibling;
        const isOpen = trigger.classList.contains('is-open');
        
        trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (content) {
            content.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            
            // Set initial state
            if (isOpen) {
                content.style.maxHeight = 'none';
            } else {
                content.style.maxHeight = '0px';
            }
        }
    });
}

function openCollapsible(trigger, content) {
    // Add open classes
    trigger.classList.add('is-open');
    content.classList.add('is-open');
    
    // Set aria attributes
    trigger.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');
    
    // Calculate and set max-height for smooth animation
    const contentHeight = content.scrollHeight;
    content.style.maxHeight = contentHeight + 'px';
    
    // Reset max-height after animation completes
    setTimeout(() => {
        if (content.classList.contains('is-open')) {
            content.style.maxHeight = 'none';
        }
    }, 300);
}

function closeCollapsible(trigger, content) {
    // Set specific height before closing for smooth animation
    content.style.maxHeight = content.scrollHeight + 'px';
    
    // Force reflow
    content.offsetHeight;
    
    // Remove open classes
    trigger.classList.remove('is-open');
    content.classList.remove('is-open');
    
    // Set aria attributes
    trigger.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');
    
    // Animate to closed state
    content.style.maxHeight = '0px';
}

// Define custom element if supported
if (customElements && !customElements.get('collapsible-tabs')) {
    customElements.define('collapsible-tabs', CollapsibleTabs);
}
