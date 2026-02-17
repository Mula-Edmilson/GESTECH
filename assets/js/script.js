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
    statsSection: document.querySelector('.stats')
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
  
  const toggleNavbar = () => {
    navbar.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Accessibility: update aria-expanded
    const isExpanded = navbar.classList.contains('active');
    if (navOpenBtn) navOpenBtn.setAttribute('aria-expanded', isExpanded);
    if (navCloseBtn) navCloseBtn.setAttribute('aria-expanded', isExpanded);
    
    // Gerenciar foco para acessibilidade
    if (isExpanded && navCloseBtn) {
      setTimeout(() => navCloseBtn.focus(), 100);
    }
  };
  
  // Event listeners com verificação de existência
  [navOpenBtn, navCloseBtn, overlay].forEach(btn => {
    if (btn) btn.addEventListener('click', toggleNavbar);
  });
  
  // Fechar navbar ao clicar em links
  if (navLinks && navLinks.length) {
    navLinks.forEach(link => {
      link.addEventListener('click', toggleNavbar);
    });
  }
  
  // Fechar com tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar?.classList.contains('active')) {
      toggleNavbar();
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
      border-radius: 4px;
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
      border-radius: var(--radius-sm, 6px);
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