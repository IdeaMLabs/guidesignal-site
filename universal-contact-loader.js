// Universal Contact Button Loader
// Automatically loads on any page that includes this script

(function() {
    'use strict';
    
    // Check if contact component is already loaded
    if (window.contactModal || document.getElementById('contact-us-btn')) {
        return;
    }
    
    // Load the main contact component
    function loadContactComponent() {
        const script = document.createElement('script');
        script.src = 'contact-us.js';
        script.defer = true;
        script.onload = function() {
            console.log('📞 Contact component loaded on:', window.location.pathname);
        };
        script.onerror = function() {
            console.warn('Failed to load contact component');
            createFallbackContactButton();
        };
        document.head.appendChild(script);
    }
    
    // Fallback contact button if main component fails
    function createFallbackContactButton() {
        const button = document.createElement('a');
        button.href = 'mailto:contact@guidesignal.com?subject=Contact from GuideSignal';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4a9eff, #1e3a5f);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(74, 158, 255, 0.3);
            z-index: 1000;
            transition: transform 0.2s ease;
        `;
        button.innerHTML = '📧 Email Us';
        button.onmouseenter = () => button.style.transform = 'translateY(-2px)';
        button.onmouseleave = () => button.style.transform = 'translateY(0)';
        
        document.body.appendChild(button);
    }
    
    // Load when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadContactComponent);
    } else {
        loadContactComponent();
    }
    
})();