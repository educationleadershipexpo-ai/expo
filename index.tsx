


    import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

    declare var Panzoom: any;

    document.addEventListener('DOMContentLoaded', () => {

    // Initialize Gemini AI
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // --- Reusable Form Validation Helpers ---
    const showError = (input: HTMLElement, message: string) => {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup?.querySelector('.error-message') as HTMLElement;
        if (errorElement) {
            errorElement.innerText = message;
            errorElement.style.display = 'block';
        }
        input.classList.add('invalid');
    };

    const clearError = (input: HTMLElement) => {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup?.querySelector('.error-message') as HTMLElement;
        if (errorElement) {
            errorElement.innerText = '';
            errorElement.style.display = 'none';
        }
        input.classList.remove('invalid');
    };

    // --- Universal Real-Time Validator ---
    const validateField = (field: HTMLElement): boolean => {
        if (!field) return true;
        let isValid = true;
        const input = field as HTMLInputElement;
        const select = field as HTMLSelectElement;
        const checkbox = field as HTMLInputElement;

        const value = input.value?.trim();
        clearError(field);

        switch (field.id) {
            case 'form-name':
            case 'form-booth-name':
                if (value === '') {
                    showError(field, 'Name is required.');
                    isValid = false;
                }
                break;
            
            case 'form-organization':
            case 'form-booth-company':
                if (value === '') {
                    const fieldName = (field.id === 'form-booth-company') ? 'Company' : 'Organization';
                    showError(field, `${fieldName} is required.`);
                    isValid = false;
                }
                break;
                
            case 'form-email':
            case 'form-booth-email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (value === '') {
                    showError(field, 'Email is required.');
                    isValid = false;
                } else if (!emailRegex.test(value)) {
                    showError(field, 'Please enter a valid email address.');
                    isValid = false;
                }
                break;
            
            case 'form-phone':
                const phoneRegex = /^[\d\s()+-]+$/;
                if (value !== '' && !phoneRegex.test(value)) {
                    showError(field, 'Please enter a valid phone number.');
                    isValid = false;
                }
                break;
            
            case 'form-interest':
            case 'form-modal-interest':
                if (select.value === '') {
                    showError(field, 'Please select an interest.');
                    isValid = false;
                }
                break;
            
            case 'form-booth-consent':
                if (!checkbox.checked) {
                    showError(checkbox, 'You must consent to continue.');
                    isValid = false;
                }
                break;
        }
        return isValid;
    }


    // --- Active Nav Link Highlighting ---
    function highlightActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('#main-nav a.nav-link');

        navLinks.forEach(link => {
            const linkPage = (link as HTMLAnchorElement).href.split('/').pop();

            if (linkPage === currentPage) {
                link.classList.add('active');
                
                // For dropdowns, also highlight the parent
                const parentDropdown = link.closest('.has-dropdown');
                if (parentDropdown) {
                    parentDropdown.querySelector('a.nav-link')?.classList.add('active');
                }
            }
        });
    }


    // --- Mobile Navigation Logic ---
    function initializeMobileNav() {
        const header = document.getElementById('main-header');
        const navToggle = document.querySelector('.nav-toggle') as HTMLButtonElement;
        const mainNav = document.getElementById('main-nav');

        if (!header || !navToggle || !mainNav) return;

        navToggle.addEventListener('click', () => {
        header.classList.toggle('nav-open');
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!isExpanded));
        
        if (header.classList.contains('nav-open')) {
            (mainNav.querySelector('a') as HTMLAnchorElement)?.focus();
        } else {
            navToggle.focus();
        }
        });

        // Close menu when a link is clicked, unless it's a dropdown toggle on mobile
        mainNav.addEventListener('click', (e) => {
            const link = (e.target as HTMLElement).closest('a');
            if (!link) return;
            
            // Let the dropdown handler manage clicks on dropdown toggles in mobile view.
            // The dropdown handler now uses stopPropagation, so this logic mainly prevents
            // the nav from closing on mobile if a non-link area in a dropdown li is clicked.
            if (link.parentElement?.classList.contains('has-dropdown') && window.innerWidth <= 768) {
                return; 
            }

            if (header.classList.contains('nav-open')) {
                header.classList.remove('nav-open');
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.focus();
            }
        });
    }
    
    // --- Dropdown Navigation Logic ---
    function initializeDropdowns() {
        const dropdownToggles = document.querySelectorAll('.has-dropdown > a');

        // Setup ARIA attributes
        dropdownToggles.forEach((toggle, index) => {
            const menu = toggle.nextElementSibling as HTMLElement;
            toggle.setAttribute('aria-haspopup', 'true');
            toggle.setAttribute('aria-expanded', 'false');
            if (menu) {
                const menuId = `dropdown-menu-${index}`;
                menu.id = menuId;
                toggle.setAttribute('aria-controls', menuId);
            }

            toggle.addEventListener('click', (e) => {
                // Prevent default for nav links that are just toggles, so they only open the dropdown.
                e.preventDefault();
                e.stopPropagation(); // Stop click from propagating to the document listener
                
                const parentLi = toggle.parentElement as HTMLElement;
                const isCurrentlyOpen = parentLi.classList.contains('dropdown-open');

                // First, close all other dropdowns
                document.querySelectorAll('.has-dropdown.dropdown-open').forEach(openDropdown => {
                    if (openDropdown !== parentLi) {
                        openDropdown.classList.remove('dropdown-open');
                        openDropdown.querySelector('a')?.setAttribute('aria-expanded', 'false');
                    }
                });

                // Then, toggle the current dropdown
                parentLi.classList.toggle('dropdown-open');
                toggle.setAttribute('aria-expanded', String(!isCurrentlyOpen));
            });
        });
        
        // Add a single listener to the document to close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.has-dropdown.dropdown-open').forEach(openDropdown => {
                openDropdown.classList.remove('dropdown-open');
                openDropdown.querySelector('a')?.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // --- Countdown Timer Logic ---
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const countdownContainer = document.getElementById('countdown-timer');

    if (daysEl && hoursEl && minutesEl && countdownContainer) {
        const countdownDate = new Date('2025-11-20T00:00:00').getTime();

        const triggerUpdateAnimation = (element: HTMLElement | null) => {
            if (!element) return;
            const parentUnit = element.closest('.timer-unit');
            if (parentUnit) {
                parentUnit.classList.add('updated');
                parentUnit.addEventListener('animationend', () => {
                    parentUnit.classList.remove('updated');
                }, { once: true });
            }
        };

        const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = countdownDate - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            countdownContainer.innerHTML = '<h4>The early-bird offer has expired!</h4>';
            return;
        }

        const days = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
        const hours = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        
        if (daysEl.textContent !== days) {
            daysEl.textContent = days;
            triggerUpdateAnimation(daysEl);
        }
        if (hoursEl.textContent !== hours) {
            hoursEl.textContent = hours;
            triggerUpdateAnimation(hoursEl);
        }
        if (minutesEl.textContent !== minutes) {
            minutesEl.textContent = minutes;
            triggerUpdateAnimation(minutesEl);
        }
        }, 1000);
    }
    
    // --- Form Submission Logic ---
    const form = document.getElementById('contact-form') as HTMLFormElement;
    const successMessage = document.getElementById('form-success-message');

    if (form && successMessage) {
        const nameInput = document.getElementById('form-name') as HTMLInputElement;
        const orgInput = document.getElementById('form-organization') as HTMLInputElement;
        const emailInput = document.getElementById('form-email') as HTMLInputElement;
        const phoneInput = document.getElementById('form-phone') as HTMLInputElement;
        const interestSelect = document.getElementById('form-interest') as HTMLSelectElement;

        const inputs: HTMLElement[] = [nameInput, orgInput, emailInput, phoneInput, interestSelect];

        inputs.forEach(input => {
            if (!input) return;
            const eventType = input.tagName.toLowerCase() === 'select' ? 'change' : 'input';
            input.addEventListener(eventType, () => validateField(input));
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate all fields on submit and check overall validity
            const isFormValid = inputs.map(input => validateField(input)).every(Boolean);

            if (isFormValid) {
                form.style.display = 'none';
                successMessage.style.display = 'block';

                // Trigger sponsorship deck download
                const link = document.createElement('a');
                link.href = '#'; // Placeholder for actual file
                link.download = 'QELE2026-Sponsorship-Deck.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }

    // --- Interactive Floor Plan Logic (New 2D Version) ---
    const floorPlanContainer = document.getElementById('floor-plan-container');
    if (floorPlanContainer) {
        const map = document.getElementById('floor-plan-map');
        const tooltip = document.getElementById('floor-plan-tooltip');
        const filterButtons = document.querySelectorAll('.fp-filter-btn');

        const boothData = [
            { id: 'B01', size: '3X3', package: 'basic', status: 'available' }, { id: 'B02', size: '3X3', package: 'basic', status: 'available' }, { id: 'B03', size: '3X3', package: 'basic', status: 'sold' }, { id: 'spacer1', size: '', package: '', status: 'spacer' }, { id: 'B04', size: '3X3', package: 'basic', status: 'available' }, { id: 'B05', size: '3X3', package: 'basic', status: 'sold' }, { id: 'B06', size: '3X3', package: 'basic', status: 'available' }, { id: 'spacer2', size: '', package: '', status: 'spacer' }, { id: 'S01', size: '3X3', package: 'silver', status: 'reserved' }, { id: 'S02', size: '3X3', package: 'silver', status: 'available' }, { id: 'S03', size: '3X3', package: 'silver', status: 'sold' }, { id: 'S04', size: '3X3', package: 'silver', status: 'available' },
            { id: 'B07', size: '3X3', package: 'basic', status: 'available' }, { id: 'B08', size: '3X3', package: 'basic', status: 'reserved' }, { id: 'B09', size: '3X3', package: 'basic', status: 'available' }, { id: 'spacer3', size: '', package: '', status: 'spacer' }, { id: 'B10', size: '3X3', package: 'basic', status: 'available' }, { id: 'B11', size: '3X3', package: 'basic', status: 'available' }, { id: 'B12', size: '3X3', package: 'basic', status: 'available' }, { id: 'spacer4', size: '', package: '', status: 'spacer' }, { id: 'S05', size: '3X3', package: 'silver', status: 'available' }, { id: 'S06', size: '3X3', package: 'silver', status: 'available' }, { id: 'S07', size: '3X3', package: 'silver', status: 'sold' }, { id: 'S08', size: '3X3', package: 'silver', status: 'available' },
            { id: 'B13', size: '3X3', package: 'basic', status: 'sold' }, { id: 'B14', size: '3X3', package: 'basic', status: 'available' }, { id: 'B15', size: '3X3', package: 'basic', status: 'available' }, { id: 'spacer5', size: '', package: '', status: 'spacer' }, { id: 'B16', size: '3X3', package: 'basic', status: 'sold' }, { id: 'B17', size: '3X3', package: 'basic', status: 'available' }, { id: 'B18', size: '3X3', package: 'basic', status: 'available' }, { id: 'spacer6', size: '', package: '', status: 'spacer' }, { id: 'S09', size: '3X3', package: 'silver', status: 'available' }, { id: 'S10', size: '3X3', package: 'silver', status: 'reserved' }, { id: 'S11', size: '3X3', package: 'silver', status: 'available' }, { id: 'S12', size: '3X3', package: 'silver', status: 'available' },
            { id: 'B19', size: '3X3', package: 'basic', status: 'available' }, { id: 'B20', size: '3X3', package: 'basic', status: 'available' }, { id: 'B21', size: '3X3', package: 'basic', status: 'sold' }, { id: 'B22', size: '3X3', package: 'basic', status: 'available' }, { id: 'spacer7', size: '', package: '', status: 'spacer' }, { id: 'B23', size: '3X3', package: 'basic', status: 'available' }, { id: 'B24', size: '3X3', package: 'basic', status: 'reserved' }, { id: 'B25', size: '3X3', package: 'basic', status: 'available' }, { id: 'spacer8', size: '', package: '', status: 'spacer' }, { id: 'S13', size: '3X3', package: 'silver', status: 'sold' }, { id: 'S14', size: '3X3', package: 'silver', status: 'available' }, { id: 'S15', size: '3X3', package: 'silver', status: 'available' },
            { id: 'midspacer1', size: '', package: '', status: 'mid-spacer' },
            { id: 'S20', size: '4X3', package: 'silver', status: 'available' }, { id: 'S21', size: '4X3', package: 'silver', status: 'available' }, { id: 'spacer9', size: '', package: '', status: 'spacer' }, { id: 'G01', size: '4X3', package: 'gold', status: 'reserved' }, { id: 'G02', size: '4X3', package: 'gold', status: 'available' }, { id: 'G03', size: '4X3', package: 'gold', status: 'sold' }, { id: 'spacer10', size: '', package: '', status: 'spacer' }, { id: 'S22', size: '4X3', package: 'silver', status: 'available' }, { id: 'S23', size: '4X3', package: 'silver', status: 'available' }, { id: 'spacer11', size: '', package: '', status: 'spacer' }, { id: 'G04', size: '4X3', package: 'gold', status: 'reserved' },
            { id: 'S24', size: '4X3', package: 'silver', status: 'sold' }, { id: 'S25', size: '4X3', package: 'silver', status: 'available' }, { id: 'spacer12', size: '', package: '', status: 'spacer' }, { id: 'G05', size: '4X3', package: 'gold', status: 'available' }, { id: 'G06', size: '4X3', package: 'gold', status: 'available' }, { id: 'G07', size: '4X3', package: 'gold', status: 'available' }, { id: 'spacer13', size: '', package: '', status: 'spacer' }, { id: 'S26', size: '4X3', package: 'silver', status: 'available' }, { id: 'S27', size: '4X3', package: 'silver', status: 'available' }, { id: 'spacer14', size: '', package: '', status: 'spacer' }, { id: 'G08', size: '4X3', package: 'gold', status: 'available' },
            { id: 'midspacer2', size: '', package: '', status: 'mid-spacer' },
            { id: 'bigspacer1', size: '', package: '', status: 'big-spacer' }, { id: 'G09', size: '6X3', package: 'gold', status: 'reserved' }, { id: 'bigspacer2', size: '', package: '', status: 'big-spacer' }, { id: 'G10', size: '6X3', package: 'gold', status: 'sold' }, { id: 'bigspacer3', size: '', package: '', status: 'big-spacer' },
            { id: 'midspacer3', size: '', package: '', status: 'mid-spacer' },
            { id: 'P01', size: '7X3', package: 'platinum', status: 'available' }, { id: 'bigspacer4', size: '', package: '', status: 'big-spacer' }, { id: 'P02', size: '7X3', package: 'platinum', status: 'available' }, { id: 'bigspacer5', size: '', package: '', status: 'big-spacer' }, { id: 'P03', size: '7X3', package: 'platinum', status: 'sold' },
        ];
        
        // 1. Render Booths
        if(map) {
            boothData.forEach(data => {
                if(data.status === 'spacer' || data.status === 'mid-spacer' || data.status === 'big-spacer') {
                    const spacer = document.createElement('div');
                    spacer.className = `booth-spacer ${data.status}`;
                    if (data.status === 'mid-spacer') spacer.style.gridColumn = 'span 12';
                    if (data.status === 'big-spacer') spacer.style.gridColumn = 'span 3';
                    if (data.id === 'bigspacer1' || data.id === 'bigspacer4') spacer.style.gridColumn = 'span 2';
                    map.appendChild(spacer);
                    return;
                }
                
                const booth = document.createElement('div');
                booth.className = `booth ${data.status} ${data.package}`;
                booth.dataset.id = data.id;
                booth.dataset.package = data.package;
                booth.dataset.status = data.status;
                booth.textContent = data.size;

                if (data.size === '4X3') booth.style.gridColumn = 'span 2';
                if (data.size === '6X3') booth.style.gridColumn = 'span 4';
                if (data.size === '7X3') booth.style.gridColumn = 'span 5';

                map.appendChild(booth);
            });
        }

        // 2. Update Status Counts
        const updateStatusCounts = () => {
        const counts = { available: 0, reserved: 0, sold: 0 };
        boothData.forEach(booth => {
            if (counts[booth.status as keyof typeof counts] !== undefined) {
                counts[booth.status as keyof typeof counts]++;
            }
        });

        document.getElementById('available-count')!.textContent = counts.available.toString();
        document.getElementById('reserved-count')!.textContent = counts.reserved.toString();
        document.getElementById('sold-count')!.textContent = counts.sold.toString();
        };
        
        // 3. Handle Filtering
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                
                // Update button styles
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter booths
                document.querySelectorAll('.booth').forEach(boothEl => {
                    const booth = boothEl as HTMLElement;
                    const packageType = booth.dataset.package;
                    const shouldShow = filter === 'all' || packageType === filter;
                    booth.classList.toggle('hidden', !shouldShow);
                });
            });
        });

        // 4. Handle Tooltip
        if (map && tooltip) {
            map.addEventListener('mouseover', (e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('booth')) {
                    const id = target.dataset.id;
                    const pkg = target.dataset.package;
                    const status = target.dataset.status;
                    
                    tooltip.innerHTML = `
                        <strong>Booth ${id}</strong>
                        <p>Package: <span>${pkg}</span></p>
                        <p>Status: <span class="status-${status}">${status}</span></p>
                    `;
                    tooltip.style.display = 'block';
                }
            });

            map.addEventListener('mousemove', (e) => {
                if (tooltip.style.display === 'block') {
                    // Position tooltip relative to the container
                    const containerRect = floorPlanContainer.getBoundingClientRect();
                    const x = e.clientX - containerRect.left;
                    const y = e.clientY - containerRect.top;
                    
                    tooltip.style.left = `${x + 15}px`;
                    tooltip.style.top = `${y + 15}px`;
                }
            });

            map.addEventListener('mouseout', (e) => {
                const target = e.target as HTMLElement;
                if (target.classList.contains('booth')) {
                    tooltip.style.display = 'none';
                }
            });
        }

        // Initial setup
        updateStatusCounts();
    }


    // --- AI Chatbot Logic ---
    function initializeChatbot() {
        const fab = document.getElementById('chatbot-fab');
        const windowEl = document.getElementById('chatbot-window');
        const closeBtn = document.getElementById('chatbot-close-btn');
        const form = document.getElementById('chatbot-form') as HTMLFormElement;
        const input = document.getElementById('chatbot-input') as HTMLInputElement;
        const messagesContainer = document.getElementById('chatbot-messages');
        const suggestionsContainer = document.getElementById('chatbot-suggestions');
        const consentCheckbox = document.getElementById('chatbot-consent') as HTMLInputElement;
        const submitBtn = form?.querySelector('button[type="submit"]') as HTMLButtonElement;

        if (!fab || !windowEl || !closeBtn || !form || !input || !messagesContainer || !suggestionsContainer || !consentCheckbox || !submitBtn) return;

        let chat: Chat;
        let hasWelcomed = false;

        const systemInstruction = `You are the official AI Assistant for the QATAR EDUCATION LEADERSHIP EXPO 2026 (QELE 2026). Your goal is to answer questions from potential exhibitors, sponsors, and attendees. Be friendly, professional, and concise.

        Here is key information about the event:
        - Event Name: QATAR EDUCATION LEADERSHIP EXPO 2026 (QELE 2026)
        - Date: April 14–15, 2026
        - Location: Sheraton Grand Doha Resort & Convention Hotel, Qatar.
        - Organized by: Student Diwan, Qatar's leading EdTech platform.
        - Early Bird Offer: 15% discount ends November 20, 2025.
        
        Market Opportunity:
        - The MENA education market has over $100B+ in annual spending.
        - There are over 60M+ K-12 students in the region.
        - Qatar is the #1 education hub in the Gulf, with the highest GDP per capita globally and over 200+ international schools.

        Audience (Who is Attending):
        - 4000+ Students
        - 100+ Universities & Colleges
        - 50+ Edutech Companies
        - 75+ Education Consultants
        - 120+ Speakers & Influencers
        - Government Representatives
        - Decision-Makers breakdown: 45% from K-12 Schools (Principals, Teachers), 20% from Universities (Chancellors, Deans), 10% from Government, 10% from Consultants.

        Exhibitor Benefits:
        - Recruitment: Engage Grade 11-12 students.
        - Visibility: Gain 1M+ brand impressions.
        - Thought Leadership: Shape the agenda through panels and roundtables.
        - Partnerships: Connect with leaders, government, and industry experts.

        Booth Packages:
        - There are four tiers: Basic, Silver, Gold, and Platinum.
        - Basic: Standard booth, website listing, 2 passes.
        - Silver: Priority booth, logo on website, 3 passes.
        - Gold (Most Popular): High-traffic booth, catalog entry, 1 speaking slot, 4 passes.
        - Platinum: Max visibility corner booth, premium furniture, homepage logo, 3 speaking slots, 8 passes, VIP lounge access.

        IMPORTANT RULE: Prices for packages are NOT public. DO NOT provide any prices or estimates. Your goal is to highlight the value and encourage users to submit an inquiry. If asked for pricing, politely respond with: "Pricing details are provided in our official sponsorship deck. If you fill out the inquiry form on our website, our partnership team will send it to you right away."
        
        Contact for partnerships: partnerships@eduexpoqatar.com or call +974 7444 9111.
        
        LEAD CAPTURE RULE: If a user expresses a clear intent to purchase, book, or speak to a sales representative (e.g., "I want to buy a platinum package," "How do I book booth A2?", "Can I talk to someone about sponsoring?"), your primary goal is to capture their contact information. Politely ask for their name and email address so a partnership manager can get in touch with them. For example: "That's great to hear! I can have a partnership manager reach out to you directly. Could I get your name and email address, please?" Do not be pushy if they decline.`;

        const addMessage = (text: string, sender: 'user' | 'ai' | 'system') => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        messageElement.textContent = text;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const showTypingIndicator = () => {
            const indicator = document.createElement('div');
            indicator.textContent = 'Typing...';
            indicator.classList.add('typing-indicator');
            indicator.id = 'typing-indicator';
            messagesContainer.appendChild(indicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };

        const hideTypingIndicator = () => {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) {
                indicator.remove();
            }
        };

        const showErrorForConsent = (message: string) => {
            const formGroup = consentCheckbox.closest('.form-group-consent-chatbot');
            const errorElement = formGroup?.querySelector('.error-message') as HTMLElement;
            if (errorElement) {
                errorElement.innerText = message;
                errorElement.style.display = 'block';
            }
        };
        
        const clearErrorForConsent = () => {
            const formGroup = consentCheckbox.closest('.form-group-consent-chatbot');
            const errorElement = formGroup?.querySelector('.error-message') as HTMLElement;
            if (errorElement) {
                errorElement.innerText = '';
                errorElement.style.display = 'none';
            }
        };

        const validateChatForm = () => {
            const message = input.value.trim();
            const consentGiven = consentCheckbox.checked;
            submitBtn.disabled = !message || !consentGiven;
        };

        const sendUserMessage = async (message: string) => {
            if (!message) return;

            if (!consentCheckbox.checked) {
                showErrorForConsent('Please consent to continue.');
                return;
            }
            clearErrorForConsent();

            addMessage(message, 'user');
            input.value = '';
            validateChatForm();
            suggestionsContainer.style.display = 'none';
            showTypingIndicator();

            try {
                const response: GenerateContentResponse = await chat.sendMessage({ message: message });
                hideTypingIndicator();
                addMessage(response.text, 'ai');
            } catch (error) {
                console.error("Chatbot error:", error);
                hideTypingIndicator();
                addMessage("Sorry, I'm having trouble connecting right now. Please try again later.", 'ai');
            }
        };

        const createSuggestionChips = () => {
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'flex';
            
            const suggestions = ["Exhibitor Benefits", "Audience Demographics", "Event Dates"];
            suggestions.forEach(suggestionText => {
                const chip = document.createElement('button');
                chip.classList.add('suggestion-chip');
                chip.textContent = suggestionText;
                chip.onclick = () => {
                    sendUserMessage(suggestionText);
                };
                suggestionsContainer.appendChild(chip);
            });
        };

        const openChat = () => {
            windowEl.classList.add('visible');
            if(fab) fab.style.display = 'none';
            if (!chat) {
                chat = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: { systemInstruction },
                });
            }
            if (!hasWelcomed) {
                addMessage("Hello! I'm the QELE AI Assistant. How can I help you learn about the expo today?", 'ai');
                createSuggestionChips();
                hasWelcomed = true;
            }
            validateChatForm();
        };
        
        const closeChat = () => {
            windowEl.classList.remove('visible');
            if(fab) fab.style.display = 'flex';
        };

        input.addEventListener('input', validateChatForm);
        consentCheckbox.addEventListener('change', () => {
            if (consentCheckbox.checked) {
                clearErrorForConsent();
            }
            validateChatForm();
        });

        fab.addEventListener('click', openChat);
        closeBtn.addEventListener('click', closeChat);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            sendUserMessage(input.value.trim());
        });

        validateChatForm();
    }
    
    // --- Proactive Chatbot Engagement ---
    function initializeProactiveChat() {
        const fabContainer = document.getElementById('chatbot-fab-container');
        const bubble = document.getElementById('chatbot-bubble') as HTMLElement;
        const chatbotWindow = document.getElementById('chatbot-window');

        if (!fabContainer || !bubble || !chatbotWindow) return;
        
        let bubbleTimeout: number;

        const showBubble = (message: string) => {
            if (chatbotWindow?.classList.contains('visible') || bubble.style.display === 'block') {
                return;
            }
            bubble.textContent = message;
            bubble.style.display = 'block';

            clearTimeout(bubbleTimeout);
            bubbleTimeout = window.setTimeout(() => {
                hideBubble();
            }, 8000);
        };
        
        const hideBubble = () => {
            bubble.style.display = 'none';
        };
        
        fabContainer.addEventListener('click', () => {
            hideBubble();
            // The main openChat logic is already on the fab itself.
            if(!chatbotWindow.classList.contains('visible')) {
            document.getElementById('chatbot-fab')?.click();
            }
        });

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    let message = '';
                    if (entry.target.id === 'booth-packages') {
                        message = 'Questions about packages?';
                    } else if (entry.target.id === 'floor-plan-container') {
                        message = 'Need help choosing a booth?';
                    }
                    
                    if (message) {
                        setTimeout(() => showBubble(message), 2000);
                    }
                }
            });
        }, { threshold: 0.6 });

        const sponsorshipSection = document.getElementById('booth-packages');
        const boothsSection = document.getElementById('floor-plan-container');
        if (sponsorshipSection) observer.observe(sponsorshipSection);
        if (boothsSection) observer.observe(boothsSection);
    }

    // --- FOMO & Urgency Features ---
    function initializeFomoFeatures() {
        const popup = document.getElementById('fomo-popup');
        if (!popup) return;

        const titleEl = document.getElementById('fomo-title');
        const detailsEl = document.getElementById('fomo-details');
        const closeBtn = document.getElementById('fomo-close');
        const iconEl = popup.querySelector('.fomo-icon-wrapper i') as HTMLElement;

        if (!titleEl || !detailsEl || !closeBtn || !iconEl) return;

        const names = ["Aysha Al-Suwaidi", "Mohammed Al-Malki", "Fatima Al-Thani", "Khalid Al-Kuwari", "Noora Al-Marri", "Yousef Al-Jaber", "Sara Al-Obaidli", "Ahmed Hassan"];
        const locations = ["Egypt", "Qatar", "Saudi Arabia", "UAE", "Kuwait", "Oman", "Jordan", "Bahrain"];
        const universities = ["Qatar University", "Texas A&M", "Georgetown University", "Northwestern University", "Ahmadu Bello University"];
        const companies = ["Edutech Global", "Learnify Inc.", "Future Minds Co.", "MENA Scholars"];
        const tiers = ["Gold", "Platinum", "Silver"];
        
        const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
        const getRandomInterval = () => (Math.random() * 8000) + 7000;

        let popupTimeout: number;

        const hidePopup = () => {
            popup.classList.remove('visible');
        };

        const showPopup = () => {
            if (popup.classList.contains('visible')) return;
            
            let title = '';
            let details = '';
            let iconClass = 'fas fa-user';
            
            const messageType = Math.floor(Math.random() * 4);

            switch (messageType) {
                case 0: // University booking
                    title = "New Booth Booking!";
                    details = `${getRandomItem(universities)} from ${getRandomItem(locations)} just booked a ${getRandomItem(tiers)} Booth!`;
                    iconClass = 'fas fa-university';
                    break;
                case 1: // Company sponsorship
                    title = "New Sponsorship!";
                    details = `${getRandomItem(companies)} from ${getRandomItem(locations)} just secured Platinum Sponsorship.`;
                    iconClass = 'fas fa-star';
                    break;
                case 2: // Individual registration
                    title = "New Registration!";
                    details = `${getRandomItem(names)} from ${getRandomItem(locations)}`;
                    iconClass = 'fas fa-user';
                    break;
                default: // Generic inquiry
                    title = "New Inquiry!";
                    details = `A university from ${getRandomItem(locations)} just inquired about exhibiting.`;
                    iconClass = 'fas fa-comments-dollar';
                    break;
            }

            titleEl.textContent = title;
            detailsEl.textContent = details;
            iconEl.className = iconClass;

            popup.classList.add('visible');

            popupTimeout = window.setTimeout(hidePopup, 5000);
        };

        closeBtn.addEventListener('click', () => {
            hidePopup();
            clearTimeout(popupTimeout);
        });

        setTimeout(() => {
            showPopup();
            setInterval(showPopup, getRandomInterval());
        }, 5000);
    }
    
    // --- FAQ Accordion ---
    function initializeFaqAccordion() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(button => {
            button.addEventListener('click', () => {
                const item = button.closest('.faq-item');
                if (item) {
                    const isOpened = item.classList.toggle('open');
                    button.setAttribute('aria-expanded', String(isOpened));
                }
            });
        });
    }

    // --- Exit Intent Modal ---
    function initializeExitIntentModal() {
        const modal = document.getElementById('exit-intent-modal');
        if (!modal) return;

        const closeModalBtn = modal.querySelector('.modal-close-btn');
        const modalShownInSession = sessionStorage.getItem('exitModalShown') === 'true';

        if (modalShownInSession) {
            return; // Don't set up anything if it's already been shown
        }

        const showModal = () => {
            modal.classList.add('visible');
            sessionStorage.setItem('exitModalShown', 'true');
            // Clean up all triggers once shown
            document.removeEventListener('mouseout', handleMouseOut);
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
        };

        const hideModal = () => {
            modal.classList.remove('visible');
        };

        const handleMouseOut = (e: MouseEvent) => {
            // Check if mouse is leaving the viewport top
            if (e.clientY <= 0 && e.relatedTarget == null) {
                showModal();
            }
        };

        const handleScroll = () => {
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent >= 50) {
                showModal();
            }
        };

        const timer = setTimeout(showModal, 10000);

        // Add triggers
        document.addEventListener('mouseout', handleMouseOut);
        window.addEventListener('scroll', handleScroll);

        // Add closing event listeners
        closeModalBtn?.addEventListener('click', hideModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                hideModal();
            }
        });
    }

    // --- Dynamic Partner Logos ---
    function initializePastPartners() {
        const logoGrid = document.querySelector('.logo-grid');
        if (!logoGrid || logoGrid.id === 'home-partners-grid') return; // Ensure we are on the right page

        const partners = [
            "microsoft.com", "cambridge.org", "coursera.org", "qf.org.qa",
            "britishcouncil.org", "idp.com", "ooredoo.qa", "vodafone.com"
        ];
        
        logoGrid.innerHTML = ''; // Clear existing static logos

        partners.forEach(domain => {
            const logoItem = document.createElement('div');
            logoItem.className = 'logo-item';
            
            const img = document.createElement('img');
            img.src = `https://logo.clearbit.com/${domain}`;
            
            const altText = domain.split('.')[0];
            img.alt = `${altText.charAt(0).toUpperCase() + altText.slice(1)} Logo`;
            
            logoItem.appendChild(img);
            logoGrid.appendChild(logoItem);
        });
    }
    
    // --- Dynamic Partner Logos for Homepage ---
    function initializeHomePartners() {
        const logoGrid = document.getElementById('home-partners-grid');
        if (!logoGrid) return;

        const partners = [
            "qf.org.qa", "vodafone.com", "microsoft.com", 
            "britishcouncil.org", "ooredoo.qa", "cambridge.org"
        ];
        
        partners.forEach(domain => {
            const logoItem = document.createElement('div');
            logoItem.className = 'logo-item';
            
            const img = document.createElement('img');
            img.src = `https://logo.clearbit.com/${domain}`;
            
            const altText = domain.split('.')[0];
            img.alt = `${altText.charAt(0).toUpperCase() + altText.slice(1)} Logo`;
            
            logoItem.appendChild(img);
            logoGrid.appendChild(logoItem);
        });
    }


    highlightActiveNav();
    initializeMobileNav();
    initializeDropdowns();
    initializeChatbot();
    initializeProactiveChat();
    initializeFomoFeatures();
    initializeFaqAccordion();
    initializeExitIntentModal();
    initializePastPartners();
    initializeHomePartners();
    });