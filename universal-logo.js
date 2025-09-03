// Universal Logo Component
// Ensures GuideSignal logo appears on every page with proper fallbacks

class UniversalLogo {
    constructor() {
        this.logoConfig = {
            sizes: {
                small: { width: 120, height: 120 },
                medium: { width: 180, height: 180 },
                large: { width: 240, height: 240 }
            },
            formats: [
                { src: 'assets/GuideSignalLogo.webp', type: 'image/webp' },
                { src: 'assets/GuideSignalLogo.svg', type: 'image/svg+xml' },
                { src: 'assets/GuideSignalLogo.png', type: 'image/png' }
            ],
            fallbackSVG: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODAgMTgwIiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjE4MCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJsb2dvR3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM0YTllZmY7c3RvcC1vcGFjaXR5OjEiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWUzYTVmO3N0b3Atb3BhY2l0eToxIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjkwIiBjeT0iOTAiIHI9Ijg1IiBmaWxsPSJ1cmwoI2xvZ29HcmFkaWVudCkiLz48dGV4dCB4PSI5MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI0OCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R1M8L3RleHQ+PC9zdmc+`,
            altText: 'GuideSignal Logo - AI-Powered Job Matching Platform'
        };
        
        this.init();
    }

    init() {
        console.log('🖼️ Universal Logo component initializing...');
        
        // Check if logo already exists on page
        if (!this.hasExistingLogo()) {
            this.addLogoToPage();
        } else {
            this.enhanceExistingLogo();
        }
        
        console.log('✅ Universal Logo component ready');
    }

    hasExistingLogo() {
        return !!(
            document.querySelector('.logo') ||
            document.querySelector('img[alt*="GuideSignal"]') ||
            document.querySelector('img[src*="GuideSignalLogo"]') ||
            document.querySelector('.site-logo') ||
            document.querySelector('header img')
        );
    }

    addLogoToPage() {
        console.log('📍 Adding logo to page...');
        
        // Find the best location for the logo
        const targetLocation = this.findLogoLocation();
        if (targetLocation) {
            const logoElement = this.createLogoElement('medium');
            targetLocation.insertAdjacentElement('afterbegin', logoElement);
            
            // Style the container if needed
            this.styleLogoContainer(targetLocation, logoElement);
        }
    }

    findLogoLocation() {
        // Priority order for logo placement
        const candidates = [
            'header',
            '.header',
            'nav',
            '.navbar',
            '.site-header',
            'main:first-child',
            '.container:first-child',
            '.card:first-child',
            'body'
        ];

        for (const selector of candidates) {
            const element = document.querySelector(selector);
            if (element) {
                console.log(`🎯 Found logo location: ${selector}`);
                return element;
            }
        }

        return document.body;
    }

    createLogoElement(size = 'medium') {
        const container = document.createElement('div');
        container.className = 'universal-logo-container';
        
        const logoSize = this.logoConfig.sizes[size];
        
        // Create picture element with fallbacks
        const picture = document.createElement('picture');
        
        // Add source elements for different formats
        this.logoConfig.formats.forEach(format => {
            const source = document.createElement('source');
            source.srcset = format.src;
            source.type = format.type;
            source.onerror = () => source.remove();
            picture.appendChild(source);
        });
        
        // Create main img element
        const img = document.createElement('img');
        img.src = this.logoConfig.formats[2].src; // PNG fallback
        img.alt = this.logoConfig.altText;
        img.width = logoSize.width;
        img.height = logoSize.height;
        img.loading = 'eager';
        img.decoding = 'sync';
        
        // Ultimate fallback
        img.onerror = () => {
            img.src = this.logoConfig.fallbackSVG;
            img.onerror = null;
        };
        
        picture.appendChild(img);
        container.appendChild(picture);
        
        // Add click functionality to go home
        container.style.cursor = 'pointer';
        container.addEventListener('click', () => {
            if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
                window.location.href = '/';
            }
        });
        
        return container;
    }

    enhanceExistingLogo() {
        console.log('🔧 Enhancing existing logo...');
        
        const existingLogo = this.findExistingLogo();
        if (existingLogo) {
            // Add fallback handling to existing logo
            this.addFallbackToExisting(existingLogo);
            
            // Ensure proper styling
            this.ensureLogoVisibility(existingLogo);
        }
    }

    findExistingLogo() {
        return document.querySelector('.logo img') ||
               document.querySelector('img[alt*="GuideSignal"]') ||
               document.querySelector('img[src*="GuideSignalLogo"]') ||
               document.querySelector('.site-logo img') ||
               document.querySelector('header img');
    }

    addFallbackToExisting(logoImg) {
        // Only add fallback if it doesn't already have one
        if (!logoImg.getAttribute('data-fallback-added')) {
            const originalSrc = logoImg.src;
            
            logoImg.onerror = () => {
                // Try SVG first
                logoImg.src = 'assets/GuideSignalLogo.svg';
                logoImg.onerror = () => {
                    // Ultimate fallback
                    logoImg.src = this.logoConfig.fallbackSVG;
                    logoImg.onerror = null;
                };
            };
            
            logoImg.setAttribute('data-fallback-added', 'true');
        }
    }

    ensureLogoVisibility(logoElement) {
        const logo = logoElement.closest('.logo') || logoElement.parentElement || logoElement;
        
        // Ensure logo has proper dimensions
        if (!logoElement.width || logoElement.width < 80) {
            logoElement.width = 120;
            logoElement.height = 120;
        }

        // Add visibility styles
        const style = document.createElement('style');
        style.textContent = `
            .universal-logo-container,
            .logo,
            .site-logo {
                display: block;
                margin: 16px auto;
                text-align: center;
                max-width: 200px;
            }
            
            .universal-logo-container img,
            .logo img,
            .site-logo img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 0 auto;
                border-radius: 8px;
                transition: transform 0.2s ease;
            }
            
            .universal-logo-container:hover img,
            .logo:hover img,
            .site-logo:hover img {
                transform: scale(1.05);
            }
            
            /* Ensure visibility on different backgrounds */
            .universal-logo-container img,
            .logo img {
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            }
            
            /* Responsive logo sizing */
            @media (max-width: 768px) {
                .universal-logo-container img,
                .logo img,
                .site-logo img {
                    max-width: 100px;
                    width: 100px;
                    height: 100px;
                }
            }
            
            @media (min-width: 1200px) {
                .universal-logo-container img,
                .logo img,
                .site-logo img {
                    max-width: 180px;
                }
            }
        `;
        
        if (!document.getElementById('universal-logo-styles')) {
            style.id = 'universal-logo-styles';
            document.head.appendChild(style);
        }
    }

    styleLogoContainer(container, logoElement) {
        // Add appropriate styling based on container type
        const containerTag = container.tagName.toLowerCase();
        
        switch (containerTag) {
            case 'header':
            case 'nav':
                container.style.cssText += `
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    border-bottom: 1px solid #e2e8f0;
                `;
                break;
                
            case 'main':
                logoElement.style.cssText += `
                    margin: 24px auto;
                    text-align: center;
                `;
                break;
                
            default:
                logoElement.style.cssText += `
                    margin: 16px auto;
                    text-align: center;
                    padding: 16px;
                `;
        }
    }

    // Method to update logo size dynamically
    updateLogoSize(newSize) {
        if (!this.logoConfig.sizes[newSize]) return;
        
        const logos = document.querySelectorAll('.universal-logo-container img, .logo img');
        const size = this.logoConfig.sizes[newSize];
        
        logos.forEach(logo => {
            logo.width = size.width;
            logo.height = size.height;
        });
    }

    // Method to check logo loading status
    getLogoStatus() {
        const logos = document.querySelectorAll('.universal-logo-container img, .logo img');
        const status = {
            total: logos.length,
            loaded: 0,
            failed: 0,
            loading: 0
        };

        logos.forEach(logo => {
            if (logo.complete) {
                if (logo.naturalWidth > 0) {
                    status.loaded++;
                } else {
                    status.failed++;
                }
            } else {
                status.loading++;
            }
        });

        return status;
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.universalLogo = new UniversalLogo();
});

// Export for manual initialization
window.initializeUniversalLogo = () => {
    return new UniversalLogo();
};

console.log('🖼️ Universal Logo component loaded');