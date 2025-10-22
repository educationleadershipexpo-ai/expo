
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
            // Prevent default for nav links that are just toggles
            const target = e.currentTarget as HTMLAnchorElement;
            if (target.getAttribute('href') === '#' || window.innerWidth <= 768) {
                e.preventDefault();
            }
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

  // --- Sticky CTA Logic ---
  const stickyCta = document.getElementById('sticky-cta');
  const triggerSection = document.getElementById('exhibitor-benefits'); // Updated trigger section

  if (stickyCta && triggerSection) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stickyCta.classList.add('visible');
        } else {
           if (window.scrollY < triggerSection.offsetTop) {
             stickyCta.classList.remove('visible');
           }
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    observer.observe(triggerSection);
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


  // --- New Interactive Floor Plan Logic ---
  const floorPlanPage = document.getElementById('new-floor-plan');
  if (floorPlanPage) {
      const detailsModalEl = document.getElementById('booth-details-modal') as HTMLElement;
      const enquiryModalEl = document.getElementById('booth-booking-modal') as HTMLElement;
      const viewDetailsBtns = document.querySelectorAll('.view-details-btn');
      
      const detailsModalCloseBtn = detailsModalEl.querySelector('.modal-close-btn') as HTMLButtonElement;
      const enquiryModalCloseBtn = enquiryModalEl.querySelector('.modal-close-btn') as HTMLButtonElement;
      
      const enquireFromDetailsBtn = document.getElementById('enquire-from-details-btn') as HTMLButtonElement;
      const enquiryForm = document.getElementById('booth-booking-form') as HTMLFormElement;
      const formContent = enquiryModalEl.querySelector('#booth-form-content') as HTMLElement;
      const formSuccess = enquiryModalEl.querySelector('#booth-form-success') as HTMLElement;
      const successCloseBtn = enquiryModalEl.querySelector('#success-close-btn') as HTMLButtonElement;

      // Filter elements
      const filterBtns = document.querySelectorAll('.filter-btn');
      const packageCards = document.querySelectorAll('.package-info-card');
      const markerContainer = document.getElementById('floor-plan-markers');

      let lastFocusedElement: HTMLElement | null = null;
      let currentPackage = '';

      const packageData = {
          basic: {
              name: "Basic Booth",
              size: "3x3 (9 sqm)",
              benefits: ["Standard-row booth", "Name on website list", "2 exhibitor passes", "Access to networking lounge"],
              status: "Available",
          },
          silver: {
              name: "Silver Booth",
              size: "4x3 (12 sqm)",
              benefits: ["Priority row booth", "Logo on website", "3 exhibitor passes", "Lounge access"],
              status: "On Hold",
          },
          gold: {
              name: "Gold Booth",
              size: "6x3 (18 sqm)",
              benefits: ["High-traffic booth", "Catalog entry", "1 speaking slot", "4 passes"],
              status: "Available",
          },
          platinum: {
              name: "Platinum Booth",
              size: "7x5 (35 sqm)",
              benefits: ["Max visibility corner booth", "Premium furniture", "Homepage logo", "3 speaking slots", "8 passes", "VIP lounge access"],
              status: "Booked",
          }
      };

      const boothData = [
          // Basic 3x3 booths
          { id: 'B101', packageType: 'basic', status: 'available', coords: { top: '33%', left: '20%' } },
          { id: 'B102', packageType: 'basic', status: 'booked', coords: { top: '33%', left: '25.5%' } },
          { id: 'B103', packageType: 'basic', status: 'available', coords: { top: '33%', left: '31%' } },
          { id: 'B104', packageType: 'basic', status: 'available', coords: { top: '38.5%', left: '20%' } },
          { id: 'B105', packageType: 'basic', status: 'on-hold', coords: { top: '38.5%', left: '25.5%' } },
          { id: 'B106', packageType: 'basic', status: 'available', coords: { top: '38.5%', left: '31%' } },
          { id: 'B107', packageType: 'basic', status: 'available', coords: { top: '33%', left: '44%' } },
          { id: 'B108', packageType: 'basic', status: 'available', coords: { top: '33%', left: '49.5%' } },
          { id: 'B109', packageType: 'basic', status: 'booked', coords: { top: '33%', left: '55%' } },
          
          // Silver 4x3 booths
          { id: 'S201', packageType: 'silver', status: 'on-hold', coords: { top: '61.5%', left: '22%' } },
          { id: 'S202', packageType: 'silver', status: 'available', coords: { top: '61.5%', left: '31%' } },
          { id: 'S203', packageType: 'silver', status: 'available', coords: { top: '61.5%', left: '46%' } },
          { id: 'S204', packageType: 'silver', status: 'booked', coords: { top: '61.5%', left: '55%' } },
          { id: 'S205', packageType: 'silver', status: 'available', coords: { top: '61.5%', left: '69.5%' } },
          
          // Gold 6x3 booths
          { id: 'G301', packageType: 'gold', status: 'available', coords: { top: '75%', left: '35%' } },
          { id: 'G302', packageType: 'gold', status: 'on-hold', coords: { top: '75%', left: '49.5%' } },
          { id: 'G303', packageType: 'gold', status: 'available', coords: { top: '75%', left: '64%' } },
          
          // Platinum 7x5 booths
          { id: 'P401', packageType: 'platinum', status: 'booked', coords: { top: '88%', left: '30%' } },
          { id: 'P402', packageType: 'platinum', status: 'booked', coords: { top: '88%', left: '50%' } },
          { id: 'P403', packageType: 'platinum', status: 'booked', coords: { top: '88%', left: '70%' } },
      ];
      
      // --- Filtering Logic ---
      const filterPackages = (filter: string) => {
        // Update button active state
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
        });

        // Filter package list
        packageCards.forEach(card => {
            const cardStatus = card.getAttribute('data-status');
            const show = filter === 'all' || filter === cardStatus;
            card.classList.toggle('hidden', !show);
        });

        // Filter map markers
        const markers = document.querySelectorAll('.floor-plan-marker');
        markers.forEach(marker => {
            const markerStatus = marker.getAttribute('data-status');
            const show = filter === 'all' || filter === markerStatus;
            marker.classList.toggle('marker-hidden', !show);
        });
      };

      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            if(filter) filterPackages(filter);
        });
      });
      
      // --- Marker Creation ---
      if(markerContainer) {
        boothData.forEach(booth => {
            const pkgDetails = packageData[booth.packageType as keyof typeof packageData];
            if (!pkgDetails) return;
            
            const marker = document.createElement('div');
            marker.className = `floor-plan-marker marker-${booth.status}`;
            marker.style.top = booth.coords.top;
            marker.style.left = booth.coords.left;
            marker.dataset.status = booth.status;
            marker.dataset.packageName = booth.packageType;
            marker.dataset.boothId = booth.id;

            marker.textContent = pkgDetails.name.split(' ')[0]; // e.g., "Basic"
            const statusText = booth.status.charAt(0).toUpperCase() + booth.status.slice(1);
            marker.dataset.tooltip = `${statusText} (${pkgDetails.size})`;

            markerContainer.appendChild(marker);
        });
      }

      // --- Panzoom Initialization ---
      const panzoomElem = floorPlanPage.querySelector('.floor-plan-image-container');
      if (panzoomElem) {
        const panzoom = Panzoom(panzoomElem, {
            maxScale: 3,
            minScale: 0.7,
            canvas: true,
            contain: 'outside'
        });
        const parent = panzoomElem.parentElement;
        parent?.addEventListener('wheel', panzoom.zoomWithWheel);

        const zoomInBtn = floorPlanPage.querySelector('#zoom-in');
        const zoomOutBtn = floorPlanPage.querySelector('#zoom-out');
        const zoomResetBtn = floorPlanPage.querySelector('#zoom-reset');

        zoomInBtn?.addEventListener('click', () => panzoom.zoomIn());
        zoomOutBtn?.addEventListener('click', () => panzoom.zoomOut());
        zoomResetBtn?.addEventListener('click', () => panzoom.reset());
      }


      // --- Modal Logic ---
      const trapFocus = (modal: HTMLElement, e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;
          const focusableElements = Array.from(modal.querySelectorAll('button, [href], input, select, textarea')) as HTMLElement[];
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) { // Shift + Tab
              if (document.activeElement === firstElement) {
                  lastElement.focus();
                  e.preventDefault();
              }
          } else { // Tab
              if (document.activeElement === lastElement) {
                  firstElement.focus();
                  e.preventDefault();
              }
          }
      }

      const openModal = (modal: HTMLElement) => {
          lastFocusedElement = document.activeElement as HTMLElement;
          modal.classList.add('visible');
          modal.setAttribute('aria-hidden', 'false');

          const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Escape') closeModal(modal);
              trapFocus(modal, e);
          };
          modal.dataset.keydownListener = String(handleKeyDown);
          document.addEventListener('keydown', handleKeyDown);
          
          setTimeout(() => {
              (modal.querySelector('button, [href], input, select, textarea') as HTMLElement)?.focus();
          }, 100);
      };

      const closeModal = (modal: HTMLElement) => {
          modal.classList.remove('visible');
          modal.setAttribute('aria-hidden', 'true');
          const listener = modal.dataset.keydownListener;
          if (listener) {
            document.removeEventListener('keydown', eval(listener));
            delete modal.dataset.keydownListener;
          }
          lastFocusedElement?.focus();
      };

      const openDetailsModal = (boothId: string | null, packageName: string) => {
          const booth = boothId ? boothData.find(b => b.id === boothId) : null;
          const data = packageData[packageName as keyof typeof packageData];
          if (!data) return;
          
          currentPackage = packageName;

          // Populate modal
          (detailsModalEl.querySelector('#details-modal-title') as HTMLElement).textContent = data.name;
          (detailsModalEl.querySelector('#details-modal-size') as HTMLElement).textContent = data.size;
          
          const boothIdEl = detailsModalEl.querySelector('#details-modal-booth-id') as HTMLElement;
          if (booth) {
              boothIdEl.textContent = `Booth ID: ${booth.id}`;
              boothIdEl.style.display = 'block';
          } else {
              boothIdEl.style.display = 'none';
          }

          const benefitsList = detailsModalEl.querySelector('#details-modal-benefits') as HTMLElement;
          benefitsList.innerHTML = data.benefits.map(b => `<li><i class="fas fa-check"></i> ${b}</li>`).join('');

          const statusTag = detailsModalEl.querySelector('#details-modal-status') as HTMLElement;
          const currentStatus = booth ? booth.status : data.status.toLowerCase().replace(' ', '-');
          const statusText = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);

          statusTag.textContent = statusText;
          statusTag.className = 'status-tag'; // Reset classes
          statusTag.classList.add(currentStatus);
          
          if (currentStatus === 'booked') {
              enquireFromDetailsBtn.disabled = true;
              enquireFromDetailsBtn.textContent = 'Booked';
              enquireFromDetailsBtn.classList.add('disabled');
          } else {
              enquireFromDetailsBtn.disabled = false;
              enquireFromDetailsBtn.textContent = 'Enquire About This Booth';
              enquireFromDetailsBtn.classList.remove('disabled');
          }

          openModal(detailsModalEl);
      };
      
      viewDetailsBtns.forEach(btn => {
          btn.addEventListener('click', () => {
              const pkg = (btn as HTMLElement).dataset.package;
              if (pkg) {
                  openDetailsModal(null, pkg);
              }
          });
      });

      if (markerContainer) {
          markerContainer.addEventListener('click', (e) => {
              const marker = (e.target as HTMLElement).closest('.floor-plan-marker');
              if (marker) {
                  const boothId = (marker as HTMLElement).dataset.boothId;
                  const pkgName = (marker as HTMLElement).dataset.packageName;
                  if (boothId && pkgName) {
                      openDetailsModal(boothId, pkgName);
                  }
              }
          });
      }

      enquireFromDetailsBtn.addEventListener('click', () => {
          if(enquireFromDetailsBtn.disabled) return;
          closeModal(detailsModalEl);
          
          formContent.style.display = 'block';
          formSuccess.style.display = 'none';
          enquiryForm.reset();
          enquiryInputs.forEach(input => clearError(input));

          const data = packageData[currentPackage as keyof typeof packageData];
          const interestSelect = enquiryModalEl.querySelector('#form-modal-interest') as HTMLSelectElement;
          if (interestSelect) {
              interestSelect.value = data.name;
          }

          openModal(enquiryModalEl);
      });
      
      const nameInput = document.getElementById('form-booth-name') as HTMLInputElement;
      const emailInput = document.getElementById('form-booth-email') as HTMLInputElement;
      const companyInput = document.getElementById('form-booth-company') as HTMLInputElement;
      const interestSelect = document.getElementById('form-modal-interest') as HTMLSelectElement;
      const consentCheckbox = document.getElementById('form-booth-consent') as HTMLInputElement;

      const enquiryInputs: HTMLElement[] = [nameInput, emailInput, companyInput, interestSelect, consentCheckbox];

      enquiryInputs.forEach(input => {
        if (!input) return;
        const eventType = input.tagName.toLowerCase() === 'select' || input.getAttribute('type') === 'checkbox' ? 'change' : 'input';
        input.addEventListener(eventType, () => validateField(input));
      });

      enquiryForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const isFormValid = enquiryInputs.map(input => validateField(input)).every(Boolean);

          if (isFormValid) {
              (formSuccess.querySelector('#success-booth-package') as HTMLElement).textContent = interestSelect.value;
              formContent.style.display = 'none';
              formSuccess.style.display = 'block';
              successCloseBtn.focus();
          }
      });
      
      detailsModalEl.addEventListener('click', (e) => e.target === detailsModalEl && closeModal(detailsModalEl));
      detailsModalCloseBtn.addEventListener('click', () => closeModal(detailsModalEl));

      enquiryModalEl.addEventListener('click', (e) => e.target === enquiryModalEl && closeModal(enquiryModalEl));
      enquiryModalCloseBtn.addEventListener('click', () => closeModal(enquiryModalEl));
      successCloseBtn.addEventListener('click', () => closeModal(enquiryModalEl));
      
      filterPackages('all');
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

    const systemInstruction = `You are Socrates the Owl, the wise and friendly mascot and official AI Assistant for the QATAR EDUCATION LEADERSHIP EXPO 2026 (QELE 2026). Your goal is to answer questions from potential exhibitors, sponsors, and attendees. Be friendly, professional, and concise, incorporating a wise and helpful owl persona.

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
            addMessage("Hoot hoot! I'm Socrates, the QELE AI Assistant. How can I help you learn about the expo today?", 'ai');
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
                } else if (entry.target.id === 'new-floor-plan') {
                    message = 'Need help choosing a booth?';
                }
                
                if (message) {
                    setTimeout(() => showBubble(message), 2000);
                }
            }
        });
    }, { threshold: 0.6 });

    const sponsorshipSection = document.getElementById('booth-packages');
    const boothsSection = document.getElementById('new-floor-plan');
    if (sponsorshipSection) observer.observe(sponsorshipSection);
    if (boothsSection) observer.observe(boothsSection);
  }

  // --- FOMO & Urgency Features ---
  function initializeFomoFeatures() {
    const popup = document.getElementById('fomo-popup');
    const messageEl = document.getElementById('fomo-message');
    const timestampEl = document.getElementById('fomo-timestamp');

    if (!popup || !messageEl || !timestampEl) return;

    const orgTypes = [
        'A university', 'An EdTech company', 'A K-12 school', 'A recruitment agency', 'A STEM provider'
    ];
    const locations = [
        'from Dubai, UAE', 'from London, UK', 'from Riyadh, KSA', 'from Cairo, Egypt', 'from Singapore', 'from New York, USA'
    ];
    const actions = [
        'just booked a Gold Booth!', 'just reserved a Platinum Booth!', 'inquired about Platinum Sponsorship.', 'just secured a Silver Booth!'
    ];
    
    const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomTime = () => Math.floor(Math.random() * 59) + 1; // 1 to 59
    const getRandomInterval = () => (Math.random() * 8000) + 7000; // 7-15 seconds

    const showPopup = () => {
        const org = getRandomItem(orgTypes);
        const loc = getRandomItem(locations);
        const act = getRandomItem(actions);
        const time = getRandomTime();
        
        messageEl.textContent = `${org} ${loc} ${act}`;
        timestampEl.textContent = `${time} minutes ago`;

        popup.classList.add('visible');

        setTimeout(() => {
            popup.classList.remove('visible');
        }, 5000); // Hide after 5 seconds
    };

    // Initial delay before first popup
    setTimeout(() => {
        showPopup();
        // Subsequent popups
        setInterval(showPopup, getRandomInterval());
    }, 5000); // Show first popup after 5 seconds
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

  highlightActiveNav();
  initializeMobileNav();
  initializeDropdowns();
  initializeChatbot();
  initializeProactiveChat();
  initializeFomoFeatures();
  initializeFaqAccordion();
});