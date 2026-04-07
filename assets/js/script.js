'use strict';

/**
 * Gestech - JavaScript Refatorado
 * Arquitetura modular com performance e acessibilidade
 */

// ==================== STATE MANAGEMENT ====================
const App = {
  elements: {
    overlay: null,
    navOpenBtn: null,
    navbar: null,
    navCloseBtn: null,
    navLinks: null,
    header: null,
    goTopBtn: null,
    statNumbers: null,
    statsSection: null
  },
  stats: {
    observer: null,
    animationStarted: false,
    animatedElements: new Set()
  },
  scroll: {
    ticking: false
  },
  initialized: false
};

// ==================== DOM CACHE ====================
function cacheElements() {
  App.elements = {
    overlay: document.querySelector('[data-overlay]'),
    navOpenBtn: document.querySelector('[data-nav-open-btn]'),
    navbar: document.querySelector('[data-navbar]'),
    navCloseBtn: document.querySelector('[data-nav-close-btn]'),
    navLinks: document.querySelectorAll('[data-nav-link]'),
    header: document.querySelector('[data-header]'),
    goTopBtn: document.querySelector('[data-go-top]'),
    statNumbers: document.querySelectorAll('.stat-number'),
    statsSection: document.querySelector('.stats'),
    proposalLayer: document.querySelector('[data-proposal-layer]'),
    proposalDrawer: document.querySelector('#proposal-drawer'),
    proposalForm: document.querySelector('[data-proposal-form]'),
    proposalTriggers: document.querySelectorAll('.js-open-proposal'),
    proposalCloseButtons: document.querySelectorAll('[data-proposal-close]'),
    proposalWhatsappBtn: document.querySelector('[data-proposal-whatsapp]')
  };
}

// ==================== NAVBAR TOGGLE ====================
function setupNavbar() {
  const { overlay, navOpenBtn, navbar, navCloseBtn, navLinks } = App.elements;
  
  // Guard clauses para elementos ausentes
  if (!navbar || !overlay) {
    console.warn('Navbar elements missing');
    return;
  }
  
  const isMobileMenu = () => window.innerWidth < 992;

  const setNavbarState = (shouldOpen) => {
    if (!isMobileMenu()) {
      navbar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('menu-open');
      if (navOpenBtn) navOpenBtn.setAttribute('aria-expanded', 'false');
      if (navCloseBtn) navCloseBtn.setAttribute('aria-expanded', 'false');
      return;
    }

    navbar.classList.toggle('active', shouldOpen);
    overlay.classList.toggle('active', shouldOpen);

    if (navOpenBtn) navOpenBtn.setAttribute('aria-expanded', String(shouldOpen));
    if (navCloseBtn) navCloseBtn.setAttribute('aria-expanded', String(shouldOpen));

    document.body.classList.toggle('menu-open', shouldOpen);

    if (shouldOpen && navCloseBtn) {
      setTimeout(() => navCloseBtn.focus(), 100);
    }
  };

  const openNavbar = () => setNavbarState(true);
  const closeNavbar = () => setNavbarState(false);

  if (navOpenBtn) navOpenBtn.addEventListener('click', openNavbar);
  if (navCloseBtn) navCloseBtn.addEventListener('click', closeNavbar);
  if (overlay) overlay.addEventListener('click', closeNavbar);

  if (navLinks && navLinks.length) {
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navbar.classList.contains('active')) closeNavbar();
      });
    });
  }

  window.addEventListener('resize', () => {
    if (!isMobileMenu()) closeNavbar();
  });
  
  // Fechar com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar?.classList.contains('active')) {
      closeNavbar();
    }
  });
}

// ==================== HEADER STICKY & GO TOP ====================
function setupScrollEffects() {
  const { header, goTopBtn } = App.elements;
  if (!header || !goTopBtn) return;
  
  const updateHeaderAndButton = () => {
    const shouldActivate = window.scrollY >= 200;
    header.classList.toggle('active', shouldActivate);
    goTopBtn.classList.toggle('active', shouldActivate);
    App.scroll.ticking = false;
  };
  
  const onScroll = () => {
    if (!App.scroll.ticking) {
      window.requestAnimationFrame(updateHeaderAndButton);
      App.scroll.ticking = true;
    }
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });
  
  // Initial check
  updateHeaderAndButton();
}

// ==================== STATS ANIMATION ====================
function animateSingleStat(statElement) {
  if (!statElement || App.stats.animatedElements.has(statElement)) return;
  
  const target = parseInt(statElement.getAttribute('data-target'), 10);
  if (isNaN(target)) return;
  
  App.stats.animatedElements.add(statElement);
  let current = 0;
  const increment = Math.ceil(target / 60); // Smooth animation
  
  const updateCount = () => {
    current += increment;
    
    if (current < target) {
      statElement.textContent = Math.min(Math.ceil(current), target);
      requestAnimationFrame(updateCount);
    } else {
      statElement.textContent = target;
    }
  };
  
  requestAnimationFrame(updateCount);
}

function setupStatsObserver() {
  const { statsSection, statNumbers } = App.elements;
  
  if (!statsSection || !statNumbers?.length) return;
  
  // Usando Intersection Observer (moderno e performático)
  if ('IntersectionObserver' in window) {
    App.stats.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !App.stats.animationStarted) {
          App.stats.animationStarted = true;
          
          // Animar cada stat individualmente
          statNumbers.forEach(stat => animateSingleStat(stat));
          
          // Desconectar após iniciar
          if (App.stats.observer) {
            App.stats.observer.disconnect();
          }
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '0px'
    });
    
    App.stats.observer.observe(statsSection);
  } else {
    // Fallback para browsers antigos
    window.addEventListener('scroll', function fallbackStats() {
      if (!statsSection) return;
      
      const rect = statsSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isVisible && !App.stats.animationStarted) {
        App.stats.animationStarted = true;
        statNumbers.forEach(stat => animateSingleStat(stat));
        window.removeEventListener('scroll', fallbackStats);
      }
    }, { passive: true });
  }
}


// ==================== PREMIUM INTERACTIONS ====================
function setupRevealAnimations() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = document.querySelectorAll(
    '.hero > .container > *, .solutions .section-subtitle, .solutions .section-title, .solutions .section-text, .solution-card, .package .section-subtitle, .package .section-title, .package .section-text, .package-card, .services-note, .about .section-subtitle, .about .section-title, .about .section-text, .about-image, .feature-card, .cta .section-subtitle, .cta .section-title, .cta .section-text, .cta-actions, .cta-contact-list li, .footer-brand, .footer-contact, .footer-form'
  );

  if (!revealTargets.length) return;

  revealTargets.forEach((element, index) => {
    element.classList.add('reveal-up');
    element.style.transitionDelay = prefersReducedMotion ? '0s' : `${Math.min(index * 35, 260)}ms`;
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -40px 0px'
  });

  revealTargets.forEach(element => observer.observe(element));
}

function setupPointerDepth() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const interactiveCards = document.querySelectorAll('.solution-card, .package-card, .feature-card');
  interactiveCards.forEach(card => {
    card.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 992) return;
      const rect = card.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-3px) rotateX(${(-offsetY * 1.2).toFixed(2)}deg) rotateY(${(offsetX * 1.2).toFixed(2)}deg)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}


// ==================== PROPOSAL DRAWER ====================
function setupProposalDrawer() {
  const { proposalLayer, proposalDrawer, proposalForm, proposalTriggers, proposalCloseButtons, proposalWhatsappBtn, navbar } = App.elements;

  if (!proposalLayer || !proposalDrawer || !proposalForm || !proposalTriggers?.length) return;

  const serviceField = proposalForm.querySelector('[name="servico"]');
  const firstInput = proposalForm.querySelector('input, select, textarea');

  const collectBriefing = () => {
    const formData = new FormData(proposalForm);
    const service = formData.get('servico') || 'Proposta Geral';
    const lines = [
      'Olá GESTECH, gostaria de solicitar uma proposta.',
      '',
      `Nome: ${formData.get('nome') || ''}`,
      `Empresa: ${formData.get('empresa') || ''}`,
      `Telefone / WhatsApp: ${formData.get('telefone') || ''}`,
      `Email: ${formData.get('email') || ''}`,
      `Serviço pretendido: ${service}`,
      `Prazo desejado: ${formData.get('prazo') || 'Não definido'}`,
      '',
      'Objectivo principal:',
      `${formData.get('objetivo') || ''}`,
      '',
      'Situação actual / necessidade:',
      `${formData.get('necessidade') || ''}`,
      '',
      `Orçamento estimado: ${formData.get('orcamento') || 'Não informado'}`,
      `Website / redes sociais: ${formData.get('website') || 'Não informado'}`,
      '',
      'Observações adicionais:',
      `${formData.get('observacoes') || 'Sem observações adicionais.'}`
    ];

    return {
      subject: `Pedido de proposta - ${service}`,
      body: lines.join('\n')
    };
  };

  const openProposal = (service = '') => {
    if (serviceField && service) serviceField.value = service;

    proposalLayer.hidden = false;
    requestAnimationFrame(() => proposalLayer.classList.add('active'));
    proposalDrawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('proposal-open');

    if (navbar?.classList.contains('active')) {
      navbar.classList.remove('active');
      const overlay = App.elements.overlay;
      if (overlay) overlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    }

    setTimeout(() => {
      if (firstInput) firstInput.focus();
    }, 120);
  };

  const closeProposal = () => {
    proposalLayer.classList.remove('active');
    proposalDrawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('proposal-open');

    setTimeout(() => {
      if (!proposalLayer.classList.contains('active')) proposalLayer.hidden = true;
    }, 340);
  };

  proposalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      const service = trigger.dataset.service || '';
      openProposal(service);
    });
  });

  proposalCloseButtons.forEach(button => {
    button.addEventListener('click', closeProposal);
  });

  proposalForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!proposalForm.reportValidity()) return;

    const { subject, body } = collectBriefing();
    window.location.href = `mailto:comercial@gestech.co.mz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    closeProposal();
  });

  if (proposalWhatsappBtn) {
    proposalWhatsappBtn.addEventListener('click', () => {
      if (!proposalForm.reportValidity()) return;

      const { body } = collectBriefing();
      const whatsappURL = `https://wa.me/258842309083?text=${encodeURIComponent(body)}`;
      window.open(whatsappURL, '_blank', 'noopener');
      closeProposal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !proposalLayer.hidden) {
      closeProposal();
    }
  });
}

// ==================== ACCESSIBILITY IMPROVEMENTS ====================
function setupAccessibility() {
  const { navOpenBtn, navCloseBtn } = App.elements;
  
  // Adicionar atributos ARIA para botões de menu
  if (navOpenBtn) {
    navOpenBtn.setAttribute('aria-expanded', 'false');
    navOpenBtn.setAttribute('aria-label', 'Abrir menu de navegação');
  }
  
  if (navCloseBtn) {
    navCloseBtn.setAttribute('aria-expanded', 'false');
    navCloseBtn.setAttribute('aria-label', 'Fechar menu de navegação');
  }
  
  // Melhorar foco visível para elementos interativos
  const style = document.createElement('style');
  style.textContent = `
    :focus-visible {
      outline: 3px solid var(--brand-primary, #2a6df4);
      outline-offset: 2px;
      border-radius: 0;
    }
    
    .navbar-link:focus-visible,
    .btn:focus-visible,
    .social-link:focus-visible {
      outline-offset: 2px;
    }
    
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--brand-primary);
      color: white;
      padding: 8px 16px;
      z-index: 9999;
      border-radius: 0;
      text-decoration: none;
    }
    
    .skip-link:focus {
      top: 0;
    }
  `;
  document.head.appendChild(style);
  
  // Adicionar skip link se não existir
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Saltar para conteúdo principal';
    document.body.insertBefore(skipLink, document.body.firstChild);
  }
}

// ==================== PERFORMANCE OPTIMIZATIONS ====================
function setupPerformanceOptimizations() {
  // Verificar preferência por movimento reduzido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition', '0.1s ease');
  }
  
  // Verificar economia de dados
  if ('connection' in navigator && navigator.connection.saveData === true) {
    // Desabilitar animações pesadas
    document.documentElement.style.setProperty('--transition', '0s');
    
    // Parar observer de animações se já existir
    if (App.stats.observer) {
      App.stats.observer.disconnect();
    }
  }
  
  // Adicionar lazy loading para imagens que não são críticas
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    if (!img.src.includes('hero-banner')) {
      img.setAttribute('loading', 'lazy');
    }
  });
}

// ==================== INITIALIZATION ====================
function initializeApp() {
  if (App.initialized) return;
  
  // Cache all DOM elements first
  cacheElements();
  
  // Setup all features
  setupAccessibility();
  setupNavbar();
  setupScrollEffects();
  setupStatsObserver();
  setupRevealAnimations();
  setupPointerDepth();
  setupProposalDrawer();
  setupPerformanceOptimizations();
  
  App.initialized = true;
  
  // Log only in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Gestech app initialized successfully');
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already loaded
  initializeApp();
}

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', () => {
  // Clean up observers
  if (App.stats.observer) {
    App.stats.observer.disconnect();
  }
});