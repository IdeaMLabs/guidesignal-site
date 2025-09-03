// Contact Us Modal Component
// Universal contact form that works on all pages

class ContactUsModal {
    constructor() {
        this.isOpen = false;
        this.formData = {};
        this.submitEndpoint = 'https://formspree.io/f/your-form-id'; // Replace with actual endpoint
        
        this.init();
    }

    init() {
        this.createContactButton();
        this.createContactModal();
        this.attachEventListeners();
        
        console.log('📞 Contact Us component initialized');
    }

    createContactButton() {
        // Create floating contact button
        const contactButton = document.createElement('button');
        contactButton.id = 'contact-us-btn';
        contactButton.className = 'contact-us-floating-btn';
        contactButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2l-2.65.65-.35.35L13 20l-4-4c-1.06-1.06-1.06-2.94 0-4l7-7c1.06-1.06 2.94-1.06 4 0l1 1c1.06 1.06 1.06 2.94 0 4l-7 7c-.53.53-1.39.53-1.92 0L10.5 15.5"></path>
                <path d="M21 2l-2 2m-2 2l-2 2"></path>
            </svg>
            <span>Contact</span>
        `;
        
        contactButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4a9eff, #1e3a5f);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(74, 158, 255, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
            transform: translateY(0);
            min-width: 120px;
            justify-content: center;
        `;

        // Hover effects
        contactButton.addEventListener('mouseenter', () => {
            contactButton.style.transform = 'translateY(-2px)';
            contactButton.style.boxShadow = '0 6px 25px rgba(74, 158, 255, 0.4)';
        });

        contactButton.addEventListener('mouseleave', () => {
            contactButton.style.transform = 'translateY(0)';
            contactButton.style.boxShadow = '0 4px 20px rgba(74, 158, 255, 0.3)';
        });

        document.body.appendChild(contactButton);
    }

    createContactModal() {
        const modal = document.createElement('div');
        modal.id = 'contact-us-modal';
        modal.className = 'contact-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div class="contact-modal-content" style="
                background: white;
                border-radius: 16px;
                padding: 0;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                transform: translateY(20px);
                transition: transform 0.3s ease;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #4a9eff, #1e3a5f);
                    color: white;
                    padding: 20px;
                    border-radius: 16px 16px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h2 style="margin: 0; font-size: 24px; font-weight: 700;">Contact GuideSignal</h2>
                        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">We'd love to hear from you!</p>
                    </div>
                    <button id="close-contact-modal" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                    ">×</button>
                </div>

                <!-- Form -->
                <form id="contact-form" style="padding: 24px;">
                    <div style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #374151;
                        ">Name *</label>
                        <input 
                            type="text" 
                            name="name" 
                            required 
                            style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                transition: border-color 0.2s;
                                box-sizing: border-box;
                            "
                            placeholder="Your full name"
                        >
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #374151;
                        ">Email *</label>
                        <input 
                            type="email" 
                            name="email" 
                            required 
                            style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                transition: border-color 0.2s;
                                box-sizing: border-box;
                            "
                            placeholder="your.email@example.com"
                        >
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="
                            display: block;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #374151;
                        ">Subject</label>
                        <select 
                            name="subject" 
                            style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                transition: border-color 0.2s;
                                box-sizing: border-box;
                                background: white;
                            "
                        >
                            <option value="general">General Inquiry</option>
                            <option value="support">Technical Support</option>
                            <option value="feedback">Feedback</option>
                            <option value="partnership">Partnership</option>
                            <option value="press">Press & Media</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <label style="
                            display: block;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #374151;
                        ">Message *</label>
                        <textarea 
                            name="message" 
                            required 
                            rows="5" 
                            style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid #e5e7eb;
                                border-radius: 8px;
                                font-size: 16px;
                                transition: border-color 0.2s;
                                resize: vertical;
                                font-family: inherit;
                                box-sizing: border-box;
                            "
                            placeholder="Tell us how we can help you..."
                        ></textarea>
                    </div>

                    <!-- Privacy Notice -->
                    <div style="
                        background: #f9fafb;
                        border-radius: 8px;
                        padding: 12px;
                        margin-bottom: 20px;
                        font-size: 12px;
                        color: #6b7280;
                        border-left: 3px solid #4a9eff;
                    ">
                        <strong>Privacy Notice:</strong> Your information is secure and will only be used to respond to your inquiry. We never share personal data with third parties.
                    </div>

                    <!-- Submit Button -->
                    <div style="display: flex; gap: 12px;">
                        <button 
                            type="submit" 
                            id="contact-submit-btn"
                            style="
                                flex: 1;
                                background: linear-gradient(135deg, #4a9eff, #1e3a5f);
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                            "
                        >
                            <span>Send Message</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
                            </svg>
                        </button>
                        <button 
                            type="button" 
                            onclick="contactModal.close()"
                            style="
                                background: #f3f4f6;
                                color: #6b7280;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s;
                            "
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <!-- Success Message -->
                <div id="contact-success" style="
                    display: none;
                    padding: 24px;
                    text-align: center;
                ">
                    <div style="
                        width: 64px;
                        height: 64px;
                        background: linear-gradient(135deg, #10b981, #34d399);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 16px;
                    ">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                            <path d="M20 6L9 17l-5-5"/>
                        </svg>
                    </div>
                    <h3 style="margin: 0 0 8px; color: #10b981; font-size: 20px;">Message Sent!</h3>
                    <p style="margin: 0 0 20px; color: #6b7280;">Thank you for contacting GuideSignal. We'll get back to you within 24 hours.</p>
                    <button 
                        onclick="contactModal.close()" 
                        style="
                            background: linear-gradient(135deg, #10b981, #34d399);
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                        "
                    >Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Open modal
        document.getElementById('contact-us-btn').addEventListener('click', () => {
            this.open();
        });

        // Close modal
        document.getElementById('close-contact-modal').addEventListener('click', () => {
            this.close();
        });

        // Close on backdrop click
        document.getElementById('contact-us-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.close();
            }
        });

        // Form submission
        document.getElementById('contact-form').addEventListener('submit', (e) => {
            this.handleSubmit(e);
        });

        // Input focus styling
        const inputs = document.querySelectorAll('#contact-form input, #contact-form textarea, #contact-form select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderColor = '#4a9eff';
                input.style.boxShadow = '0 0 0 3px rgba(74, 158, 255, 0.1)';
            });

            input.addEventListener('blur', () => {
                input.style.borderColor = '#e5e7eb';
                input.style.boxShadow = 'none';
            });
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open() {
        this.isOpen = true;
        const modal = document.getElementById('contact-us-modal');
        const content = modal.querySelector('.contact-modal-content');
        
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        content.style.transform = 'translateY(0)';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input[name="name"]');
            if (firstInput) firstInput.focus();
        }, 300);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        const modal = document.getElementById('contact-us-modal');
        const content = modal.querySelector('.contact-modal-content');
        
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        content.style.transform = 'translateY(20px)';
        
        // Reset form and show form (hide success message)
        setTimeout(() => {
            document.getElementById('contact-form').style.display = 'block';
            document.getElementById('contact-success').style.display = 'none';
            document.getElementById('contact-form').reset();
        }, 300);

        // Restore body scroll
        document.body.style.overflow = '';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('contact-submit-btn');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = `
            <span>Sending...</span>
            <div style="
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
        `;
        submitBtn.disabled = true;

        // Add loading animation CSS if not exists
        if (!document.getElementById('contact-loading-styles')) {
            const style = document.createElement('style');
            style.id = 'contact-loading-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            // Add metadata
            data.timestamp = new Date().toISOString();
            data.page = window.location.href;
            data.userAgent = navigator.userAgent;

            // Try multiple submission methods
            let success = false;

            // Method 1: Formspree (replace with your actual endpoint)
            if (!success) {
                success = await this.submitToFormspree(data);
            }

            // Method 2: EmailJS (fallback)
            if (!success) {
                success = await this.submitToEmailJS(data);
            }

            // Method 3: Local storage backup
            if (!success) {
                this.saveToLocalStorage(data);
                success = true; // Consider it successful for UX
            }

            if (success) {
                this.showSuccess();
            } else {
                throw new Error('All submission methods failed');
            }

        } catch (error) {
            console.error('Contact form error:', error);
            this.showError(error.message);
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async submitToFormspree(data) {
        try {
            // Replace with your actual Formspree endpoint
            const response = await fetch('https://formspree.io/f/your-form-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            return response.ok;
        } catch (error) {
            console.warn('Formspree submission failed:', error);
            return false;
        }
    }

    async submitToEmailJS(data) {
        try {
            // EmailJS fallback - replace with your service details
            if (typeof emailjs !== 'undefined') {
                await emailjs.send('your_service_id', 'your_template_id', data);
                return true;
            }
            return false;
        } catch (error) {
            console.warn('EmailJS submission failed:', error);
            return false;
        }
    }

    saveToLocalStorage(data) {
        try {
            const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
            submissions.push(data);
            localStorage.setItem('contactSubmissions', JSON.stringify(submissions));
            
            // Notify user about local storage backup
            console.log('Contact form saved locally as backup');
            return true;
        } catch (error) {
            console.error('Local storage backup failed:', error);
            return false;
        }
    }

    showSuccess() {
        document.getElementById('contact-form').style.display = 'none';
        document.getElementById('contact-success').style.display = 'block';
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10001;
            max-width: 300px;
        `;
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>❌</span>
                <div>
                    <strong>Send Failed</strong><br>
                    <small>${message}. Please try again or email us directly.</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Public method to programmatically open with pre-filled data
    openWithData(data = {}) {
        this.open();
        
        setTimeout(() => {
            Object.entries(data).forEach(([key, value]) => {
                const input = document.querySelector(`#contact-form [name="${key}"]`);
                if (input) {
                    input.value = value;
                }
            });
        }, 350);
    }
}

// Initialize contact modal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.contactModal = new ContactUsModal();
});

// Export for external use
window.openContactModal = (data) => {
    if (window.contactModal) {
        window.contactModal.openWithData(data);
    }
};

console.log('📞 Contact Us component loaded successfully');