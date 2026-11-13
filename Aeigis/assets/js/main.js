/**
 * AEGIS LEARNING ACADEMY - BENGALURU
 * Client Controller & Form Automation Engine
 * Connects directly to Google Sheets & WhatsApp Instant Chat
 */

// ============================================================================
// CONFIGURATION: Set your WhatsApp number and Google Sheet Webhook URL here
// ============================================================================
const ACADEMY_CONFIG = {
  // Your WhatsApp Number in international format without '+' or spaces (e.g. 919880123456)
  whatsappNumber: '919380034536',

  // Google Sheet Webhook URL (Follow instructions in GOOGLE_SHEETS_SETUP.md)
  // Leave empty for now if testing offline; it will still save to browser storage and WhatsApp.
  googleSheetWebhookUrl: 'https://script.google.com/macros/s/AKfycbxOrVd_d3A-64C_DNeec2M_15jv_KbJu98rMczF4AWWNzqRN8Vi6f_BQty_ByzATEM/exec'
};

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFaqAccordion();
  initBookingModal();
  initProgramTabs();
  initLeadViewer();
});

/* ----------------------------------------------------
   1. MOBILE NAVIGATION
---------------------------------------------------- */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isShowing = navMenu.classList.toggle('show');
      toggleBtn.setAttribute('aria-expanded', isShowing);
      toggleBtn.innerHTML = isShowing ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
      document.body.style.overflow = isShowing ? 'hidden' : '';
    });

    // Auto-close menu when clicking any nav link or action inside
    const interactiveElements = navMenu.querySelectorAll('a, button');
    interactiveElements.forEach(elem => {
      elem.addEventListener('click', () => {
        if (navMenu.classList.contains('show')) {
          navMenu.classList.remove('show');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
          document.body.style.overflow = '';
        }
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains('show')) {
        navMenu.classList.remove('show');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('show')) {
        navMenu.classList.remove('show');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      }
    });
  }
}

/* ----------------------------------------------------
   2. FAQ ACCORDION
---------------------------------------------------- */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        faqItems.forEach(other => {
          if (other !== item) other.classList.remove('active');
        });

        item.classList.toggle('active', !isActive);
      });
    }
  });
}

/* ----------------------------------------------------
   4. DATA DISPATCHER: GOOGLE SHEET & WHATSAPP
---------------------------------------------------- */
async function sendToGoogleSheet(formData) {
  // Always save to browser storage backup
  saveLead(formData);

  // If webhook URL is configured, send HTTP POST to Google Apps Script
  if (ACADEMY_CONFIG.googleSheetWebhookUrl && ACADEMY_CONFIG.googleSheetWebhookUrl.trim() !== '') {
    try {
      await fetch(ACADEMY_CONFIG.googleSheetWebhookUrl, {
        method: 'POST',
        mode: 'no-cors', // Standard for Google Apps Script Web App
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(formData)
      });
      console.log('Successfully posted to Google Sheet webhook.');
    } catch (error) {
      console.warn('Note: Google Sheet submission error or offline:', error);
    }
  }
}

function buildWhatsAppUrl(formData) {
  const phone = ACADEMY_CONFIG.whatsappNumber;
  const gradeDisplay = formData.class || formData.grade || 'Class 9';
  const boardDisplay = formData.board || formData.schoolBoard || 'CBSE';
  const schoolLine = (formData.school && formData.school !== boardDisplay) ? `\n*School:* ${formData.school}` : '';

  const message = `Hello Sir, I have submitted a Free Trial Class request for my child on your website.

*Ref Code:* ${formData.id}
*Student Name:* ${formData.studentName}
*Class & Board:* ${gradeDisplay} (${boardDisplay})${schoolLine}
*Bengaluru Area:* ${formData.area}
*Subject Needed:* ${formData.subject}
*Preferred Mode:* ${formData.mode}
${formData.notes ? `*Notes:* ${formData.notes}` : ''}

Please let me know the available time slots for our trial class.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/* ----------------------------------------------------
   5. FREE TRIAL / ASSESSMENT BOOKING MODAL
---------------------------------------------------- */
function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  const openButtons = document.querySelectorAll('[data-open-modal="bookingModal"]');
  const closeBtn = document.querySelector('.modal-close');
  const bookingForm = document.getElementById('bookingForm');
  const successBanner = document.getElementById('modalSuccess');
  const programSelect = document.getElementById('targetSubject');
  const whatsappCtaBtn = document.getElementById('modalWhatsAppBtn');

  if (!modal) return;

  function openModal(prefillValue = '') {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (prefillValue && programSelect) {
      let found = false;
      for (let option of programSelect.options) {
        if (option.text.toLowerCase().includes(prefillValue.toLowerCase())) {
          option.selected = true;
          found = true;
          break;
        }
      }
      // Removed custom Option generation to prevent arbitrary button text 
      // (like "Free Trial Class") from injecting into the "Subjects Needed" dropdown.
    }
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    setTimeout(() => {
      if (bookingForm && successBanner) {
        bookingForm.style.display = 'block';
        successBanner.style.display = 'none';
        bookingForm.reset();
      }
    }, 300);
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const prefill = btn.dataset.prefillProgram || '';
      openModal(prefill);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = bookingForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering Details...';
      }

      const idVal = 'BLR-' + Math.floor(100000 + Math.random() * 900000);
      const timeNow = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const parentVal = document.getElementById('parentName')?.value?.trim() || 'Parent';
      const studentVal = document.getElementById('studentName')?.value?.trim() || 'Student';
      const phoneVal = document.getElementById('contactPhone')?.value?.trim() || '';
      const areaVal = document.getElementById('studentArea')?.value?.trim() || 'Bengaluru';
      const gradeVal = document.getElementById('studentGrade')?.value || 'Class 9';
      const boardVal = document.getElementById('schoolBoard')?.value || 'CBSE';
      const schoolInput = document.getElementById('studentSchool')?.value?.trim();
      const schoolVal = schoolInput || boardVal;
      const subjectVal = document.getElementById('targetSubject')?.value || 'Maths & Science';
      const modeVal = document.getElementById('preferredMode')?.value || 'Live Interactive Online Class';
      const notesVal = document.getElementById('studentGoals')?.value?.trim() || '';

      const formData = {
        // IDs & Timestamps
        id: idVal,
        refId: idVal,
        timestamp: timeNow,
        submittedAt: timeNow,

        // Parent & Student Names
        parentName: parentVal,
        parent: parentVal,
        name: parentVal,
        studentName: studentVal,
        student: studentVal,

        // Contact & Location
        phone: phoneVal,
        phoneNumber: phoneVal,
        mobile: phoneVal,
        contactPhone: phoneVal,
        area: areaVal,
        bengaluruArea: areaVal,
        location: areaVal,

        // Class / Grade (Supports all aliases: class, grade, studentClass, studentGrade)
        class: gradeVal,
        grade: gradeVal,
        studentClass: gradeVal,
        studentGrade: gradeVal,

        // School & Board (Supports all aliases: school, schoolName, board, schoolBoard)
        school: schoolVal,
        schoolName: schoolInput || schoolVal,
        board: boardVal,
        schoolBoard: boardVal,

        // Subjects & Mode
        subject: subjectVal,
        subjects: subjectVal,
        targetSubject: subjectVal,
        mode: modeVal,
        preferredMode: modeVal,
        schedule: modeVal,
        classMode: modeVal,

        // Notes / Goals
        notes: notesVal,
        studentGoals: notesVal,
        goals: notesVal,
        message: notesVal
      };

      // 1. Send data to Google Sheet & Browser storage
      await sendToGoogleSheet(formData);

      // 2. Prepare WhatsApp Instant Connect Link
      const waUrl = buildWhatsAppUrl(formData);
      if (whatsappCtaBtn) {
        whatsappCtaBtn.href = waUrl;
      }

      // 3. UI Transition
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }

      bookingForm.style.display = 'none';
      if (successBanner) {
        successBanner.style.display = 'block';
        const leadRefSpan = document.getElementById('leadReferenceNumber');
        if (leadRefSpan) leadRefSpan.textContent = formData.id;
      }
    });
  }
}

/* ----------------------------------------------------
   6. CLASS FILTER TABS
---------------------------------------------------- */
function initProgramTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const cards = document.querySelectorAll('.division-card');

  if (!tabs.length || !cards.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;

      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ----------------------------------------------------
   7. LEAD CAPTURE & DISCRETE TUTOR ADMIN VIEWER
---------------------------------------------------- */
function saveLead(lead) {
  let leads = [];
  try {
    leads = JSON.parse(localStorage.getItem('aegis_blr_leads') || '[]');
    leads.unshift(lead);
    localStorage.setItem('aegis_blr_leads', JSON.stringify(leads));
  } catch (err) {
    console.warn('Browser storage is disabled. Lead not saved locally, but will proceed to Sheet/WhatsApp.');
  }
}

function initLeadViewer() {
  const portalLinks = document.querySelectorAll('[data-action="open-leads"]');
  const leadDrawer = document.getElementById('leadDrawer');

  if (!portalLinks.length || !leadDrawer) return;

  function renderLeads() {
    let leads = [];
    try {
      leads = JSON.parse(localStorage.getItem('aegis_blr_leads') || '[]');
    } catch (e) {
      leads = [];
    }

    const listContainer = document.getElementById('leadsContainer');
    if (!listContainer) return;

    if (leads.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 2.5rem 1rem; text-align: center; color: var(--slate-500);">
          <i class="fas fa-clipboard-list" style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--slate-400);"></i>
          <p>No student inquiries submitted yet.</p>
          <p style="font-size: 0.8rem; margin-top: 0.35rem;">Fill out a trial class request on the page to see how parent inquiries appear here and sync with your Google Sheet.</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = leads.map(l => {
      const classStr = l.class || l.grade || 'Class 9';
      const boardStr = l.board || l.schoolBoard || 'CBSE';
      const schoolStr = (l.school && l.school !== boardStr) ? l.school : '';
      
      return `
      <div style="background: var(--slate-50); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <strong style="color: var(--navy-900); font-size: 1rem;">${escapeHtml(l.studentName)} (${escapeHtml(classStr)} - ${escapeHtml(boardStr)})</strong>
          <span style="font-size: 0.75rem; background: var(--blue-100); color: var(--blue-600); padding: 0.2rem 0.5rem; border-radius: var(--radius-full); font-weight: 700;">${escapeHtml(l.id)}</span>
        </div>
        <div style="font-size: 0.825rem; color: var(--slate-600); margin-bottom: 0.35rem;">
          <strong>Parent:</strong> ${escapeHtml(l.parentName)} | <strong>Phone:</strong> <a href="tel:${escapeHtml(l.phone)}" style="color:var(--blue-600); font-weight:600;">${escapeHtml(l.phone)}</a>
        </div>
        ${schoolStr ? `<div style="font-size: 0.825rem; color: var(--slate-600); margin-bottom: 0.35rem;"><strong>School:</strong> ${escapeHtml(schoolStr)}</div>` : ''}
        <div style="font-size: 0.825rem; color: var(--slate-600); margin-bottom: 0.35rem;">
          <strong>Bangalore Area:</strong> ${escapeHtml(l.area || 'Bangalore')} | <strong>Mode:</strong> ${escapeHtml(l.mode || 'Online')}
        </div>
        <div style="font-size: 0.825rem; color: var(--slate-600); margin-bottom: 0.35rem;">
          <strong>Subject:</strong> ${escapeHtml(l.subject)}
        </div>
        ${l.notes ? `<div style="font-size: 0.825rem; color: var(--slate-700); background: var(--white); padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-subtle); margin-top: 0.5rem;"><em>"${escapeHtml(l.notes)}"</em></div>` : ''}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 0.65rem; border-top:1px dashed var(--border-light); padding-top:0.5rem;">
          <a href="https://wa.me/91${escapeHtml(l.phone).replace(/\D/g,'')}?text=Hello%20${encodeURIComponent(l.parentName)}%2C%20regarding%20the%20trial%20class%20for%20${encodeURIComponent(l.studentName)}%20at%20Aegis%20Academy..." target="_blank" style="font-size:0.75rem; color:#25D366; font-weight:700;">
            <i class="fab fa-whatsapp"></i> Chat with Parent
          </a>
          <span style="font-size: 0.725rem; color: var(--slate-400);">Received: ${l.submittedAt}</span>
        </div>
      </div>
      `;
    }).join('');
  }

  function authenticateAndOpen() {
    const enteredPin = prompt("Academy Teacher Access\nEnter Teacher PIN to view student leads (Default: 1234):");
    if (enteredPin === null) return;
    if (enteredPin.trim() === '1234' || enteredPin.trim() === 'admin') {
      renderLeads();
      leadDrawer.classList.add('active');
    } else {
      alert('Access Denied: Incorrect PIN. Student inquiry details are confidential.');
    }
  }

  portalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      authenticateAndOpen();
    });
  });

  const closeDrawerBtn = document.getElementById('closeLeadDrawer');
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', () => {
      leadDrawer.classList.remove('active');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      authenticateAndOpen();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
