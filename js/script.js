/* ============================================
   Jhaz — Interactividad mínima
   ============================================ */

// Cotizador rápido (estimación referencial)
(function () {
  const form = document.getElementById('quote-form');
  if (!form) return;

  const origen = document.getElementById('origen');
  const destino = document.getElementById('destino');
  const tipo = document.getElementById('tipo');
  const volumen = document.getElementById('volumen');
  const resultBox = document.getElementById('quote-result');
  const rangeEl = document.getElementById('quote-range');

  // Tarifas referenciales muy simplificadas (PEN)
  const baseByPair = {
    'Lima-Lima': 280,
    'Lima-Callao': 220,
    'Lima-Arequipa': 1600,
    'Lima-Trujillo': 1100,
    'Lima-Piura': 1900,
    'Lima-Chiclayo': 1500,
    'Lima-Cusco': 2400
  };

  function estimar(o, d, t, v) {
    const key1 = `${o}-${d}`;
    const key2 = `${d}-${o}`;
    let base = baseByPair[key1] || baseByPair[key2] || 1400;

    const tipoFactor = {
      'General / paletizada': 1,
      'Refrigerada': 1.45,
      'Frágil': 1.2,
      'Contenedor completo': 1.9
    }[t] || 1;

    const volFactor = {
      'Menos de 1 tonelada': 0.7,
      '1 — 5 toneladas': 1,
      '5 — 15 toneladas': 1.8,
      'Más de 15 toneladas': 3.2
    }[v] || 1;

    const central = base * tipoFactor * volFactor;
    const low = Math.round(central * 0.88 / 50) * 50;
    const high = Math.round(central * 1.18 / 50) * 50;
    return { low, high };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!origen.value || !destino.value || !tipo.value || !volumen.value) return;
    const { low, high } = estimar(origen.value, destino.value, tipo.value, volumen.value);
    rangeEl.textContent = `S/ ${low.toLocaleString('es-PE')} — S/ ${high.toLocaleString('es-PE')}`;
    resultBox.classList.remove('show');
    requestAnimationFrame(() => resultBox.classList.add('show'));
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
})();

// FAQ accordion
(function () {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', !wasOpen);
    });
  });
})();

// Scroll reveal
(function () {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Stagger when in a group
        const siblings = entry.target.parentElement?.querySelectorAll('.reveal');
        if (siblings && siblings.length > 1) {
          const index = Array.from(siblings).indexOf(entry.target);
          entry.target.style.transitionDelay = `${index * 80}ms`;
        }
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();
