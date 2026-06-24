(function(){
  const STORE_EVENTS = 'hydrohealth_events_v1';
  const STORE_LEADS = 'hydrohealth_leads_v1';
  const STORE_SESSION = 'hydrohealth_session_id_v1';
  const SHEETS_TIMEOUT_MS = 8000;
  const get = key => JSON.parse(localStorage.getItem(key) || '[]');
  const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const sessionId = localStorage.getItem(STORE_SESSION) || uid('session');
  localStorage.setItem(STORE_SESSION, sessionId);

  function getUTM(){
    const params = new URLSearchParams(location.search);
    return {
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'none',
      utm_campaign: params.get('utm_campaign') || 'not_set',
      utm_content: params.get('utm_content') || 'not_set',
      utm_term: params.get('utm_term') || 'not_set'
    };
  }
  function track(eventName, data={}){
    const event = { id:uid('evt'), event:eventName, timestamp:new Date().toISOString(), path:location.pathname.split('/').pop() || 'index.html', session_id:sessionId, ...getUTM(), ...data };
    const events = get(STORE_EVENTS); events.push(event); set(STORE_EVENTS, events.slice(-500));
    window.dispatchEvent(new CustomEvent('hydrohealth:event',{detail:event}));
    return event;
  }
  window.HHConversion = { track, getUTM, events:()=>get(STORE_EVENTS), leads:()=>get(STORE_LEADS), saveLead };
  function saveLead(lead){
    const leads = get(STORE_LEADS);
    const saved = { id:uid('lead'), created_at:new Date().toISOString(), status:'New Lead', session_id:sessionId, ...getUTM(), ...lead };
    leads.unshift(saved); set(STORE_LEADS, leads); track('form_submit',{lead_id:saved.id, interest:saved.interest, preferred_channel:saved.preferred_channel});
    return saved;
  }
  function buildSheetsPayload(lead){
    return {
      lead_id: lead.id,
      created_at: lead.created_at,
      session_id: lead.session_id,
      name: lead.name,
      phone: lead.phone,
      line_id: lead.line_id,
      preferred_channel: lead.preferred_channel || '',
      interest: lead.interest || '',
      preferred_time: lead.preferred_time || '',
      status: lead.status || 'New Lead',
      utm_source: lead.utm_source || 'direct',
      utm_medium: lead.utm_medium || 'none',
      utm_campaign: lead.utm_campaign || 'not_set',
      utm_content: lead.utm_content || 'not_set',
      utm_term: lead.utm_term || 'not_set',
      pdpa_consent: lead.pdpa_consent === true,
      consent_timestamp: lead.consent_timestamp,
      page_path: location.pathname.split('/').pop() || 'index.html',
      user_agent: navigator.userAgent,
      source_system: 'hydrohealth_static_landing_v1'
    };
  }
  async function submitLeadToSheets(endpoint, payload){
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SHEETS_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        credentials: 'omit',
        signal: controller.signal
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};
      if (!response.ok || result.success === false) {
        throw new Error(result.error || `Google Sheets sync failed with status ${response.status}`);
      }
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  track('page_view',{title:document.title});

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navPanel = document.querySelector('.nav-panel');
  const navLinks = document.querySelectorAll('.nav a');
  const heroVisual = document.querySelector('.hero-visual');
  const heroImage = document.querySelector('.hero-visual img');
  const selectedPlan = document.querySelector('.selected-plan strong');
  const planSelect = document.querySelector('.plan-select');
  const form = document.querySelector('.mock-form');
  const formMessage = document.querySelector('.form-message');
  let formStarted = false;
  let scroll75Tracked = false;
  let isSubmitting = false;

  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      event.preventDefault();
      const label = (link.textContent || '').trim();
      const href = link.getAttribute('href');
      if (href.includes('line-consult') || label.includes('LINE')) track('line_cta_click',{label, location:link.closest('header')?'header':'page'});
      else if (href.includes('contact')) track('consultation_cta_click',{label});
      else track('nav_click',{label, href});
      navPanel?.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded','false');
      target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }));

  document.querySelectorAll('a[href^="tel:"]').forEach(link => link.addEventListener('click',()=>track('call_click',{number:link.getAttribute('href').replace('tel:','')})));
  menuToggle?.addEventListener('click', () => { const isOpen = navPanel.classList.toggle('is-open'); menuToggle.setAttribute('aria-expanded', String(isOpen)); track('mobile_menu_toggle',{is_open:isOpen}); });

  const onScroll = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    let current = '';
    document.querySelectorAll('main section[id]').forEach(section => { if (window.scrollY >= section.offsetTop - 130) current = section.id; });
    navLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href') === `#${current}`));
    document.querySelectorAll('.reveal, .soft-card, .step-card, .price-card, .proof-card').forEach(el => { const rect = el.getBoundingClientRect(); if (rect.top < window.innerHeight * .88) el.classList.add('is-visible'); });
    const depth = (window.scrollY + window.innerHeight) / Math.max(1, document.documentElement.scrollHeight);
    if (!scroll75Tracked && depth >= .75) { scroll75Tracked = true; track('scroll_75'); }
  };
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  heroVisual?.addEventListener('pointermove', event => { const rect = heroVisual.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width - .5) * 10; const y = ((event.clientY - rect.top) / rect.height - .5) * 10; if(heroImage) heroImage.style.transform = `scale(1.025) translate(${x}px, ${y}px)`; });
  heroVisual?.addEventListener('pointerleave', () => { if(heroImage) heroImage.style.transform = ''; });

  document.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click', () => {
    const plan = button.dataset.plan;
    if (selectedPlan) selectedPlan.textContent = plan;
    if (planSelect) planSelect.value = plan;
    track('program_pathway_select',{interest:plan});
    document.querySelector('#contact')?.scrollIntoView({behavior:'smooth'});
  }));

  document.querySelectorAll('.faq-list details').forEach(item => item.addEventListener('toggle', () => {
    if (item.open) { track('faq_expand',{question:(item.querySelector('summary')?.textContent || '').trim()}); document.querySelectorAll('.faq-list details').forEach(other => { if (other !== item) other.open = false; }); }
  }));

  document.querySelectorAll('.gallery-card').forEach(card => card.addEventListener('click', () => { document.querySelectorAll('.gallery-card').forEach(c => c.classList.remove('active')); card.classList.add('active'); const caption = document.querySelector('.gallery-caption'); if(caption) caption.textContent = card.dataset.caption; track('image_gallery_click',{caption:card.dataset.caption}); }));
  document.querySelector('.line-chat-trigger')?.addEventListener('click', () => { document.querySelector('.line-chat')?.classList.toggle('is-open'); track('line_mock_open'); });

  form?.querySelectorAll('input,select,textarea').forEach(field => field.addEventListener('input',()=>{ if(!formStarted){ formStarted=true; track('form_start'); }}));
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (isSubmitting) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const consent = form.querySelector('input[name="pdpa_consent"]')?.checked;
    if(!data.name || !data.phone || !data.line_id || !consent){
      if(formMessage){formMessage.className='form-message error'; formMessage.textContent='Please complete required fields and PDPA consent before submitting. / กรุณากรอกข้อมูลที่จำเป็นและยินยอม PDPA ก่อนส่งฟอร์ม';}
      track('form_error',{reason:'missing_required_or_consent'});
      return;
    }
    isSubmitting = true;
    const lead = saveLead({ name:data.name, phone:data.phone, line_id:data.line_id, preferred_channel:data.preferred_channel, interest:data.interest, preferred_time:data.preferred_time || '', pdpa_consent:true, consent_timestamp:new Date().toISOString() });
    const endpoint = (form.dataset.sheetsEndpoint || '').trim();
    if(!endpoint){
      if(formMessage){formMessage.className='form-message ok'; formMessage.textContent=`Request saved. Lead ID: ${lead.id}. This is a local prototype record. / บันทึกข้อมูลในระบบต้นแบบแล้ว`;}
      form.reset(); if(selectedPlan) selectedPlan.textContent='Initial Consultation';
      isSubmitting = false;
      return;
    }
    try {
      await submitLeadToSheets(endpoint, buildSheetsPayload(lead));
      track('sheets_submit_success',{lead_id:lead.id});
      if(formMessage){formMessage.className='form-message ok'; formMessage.textContent=`Request saved. Lead ID: ${lead.id}. Google Sheets sync completed. / บันทึกข้อมูลและส่งเข้า Google Sheets แล้ว`;}
    } catch(error) {
      track('sheets_submit_error',{lead_id:lead.id, message:error.message});
      if(formMessage){formMessage.className='form-message error'; formMessage.textContent=`Request saved locally. Google Sheets sync failed. Lead ID: ${lead.id}. / บันทึกข้อมูลในเครื่องแล้ว แต่ส่งเข้า Google Sheets ไม่สำเร็จ`;}
    } finally {
      form.reset(); if(selectedPlan) selectedPlan.textContent='Initial Consultation';
      isSubmitting = false;
    }
  });
})();
