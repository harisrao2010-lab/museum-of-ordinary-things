const storageKey = 'museum-of-ordinary-things-v1';
const form = document.querySelector('#entry-form');
const nameField = document.querySelector('#object-name');
const storyField = document.querySelector('#object-story');
const grid = document.querySelector('#exhibit-grid');
const emptyState = document.querySelector('#empty-state');
const collectionMessage = document.querySelector('#collection-message');
const prompts = [
  'What sound would you put in a jar and keep?',
  'What tiny kindness do you still remember?',
  'What did the light touch today?',
  'What made you smile before you could stop it?',
  'What ordinary taste belongs to this season?',
  'What would you tell tomorrow-you not to forget?',
  'What small thing felt like a quiet yes?'
];
const rooms = {
  'Warm & golden': 'room-warm',
  'Soft & quiet': 'room-quiet',
  'A little funny': 'room-funny',
  'Wild & alive': 'room-alive'
};
let exhibits = loadExhibits();
document.querySelector('#year').textContent = new Date().getFullYear();
render();

function loadExhibits() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(data) ? data.filter(item =>
      item && typeof item.id === 'string' && typeof item.name === 'string' &&
      typeof item.story === 'string' && typeof item.room === 'string' &&
      typeof item.date === 'string'
    ).slice(0, 60) : [];
  } catch {
    return [];
  }
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(exhibits));
    return true;
  } catch {
    return false;
  }
}

function render() {
  grid.replaceChildren();
  document.querySelector('#nav-count').textContent = `(${exhibits.length})`;
  document.querySelector('#collection-count').textContent = String(exhibits.length);
  emptyState.hidden = exhibits.length > 0;
  for (const exhibit of exhibits) {
    const card = document.createElement('article');
    card.className = `exhibit-card ${rooms[exhibit.room] || ''}`;
    const title = document.createElement('h3');
    title.textContent = exhibit.name;
    const story = document.createElement('p');
    story.textContent = exhibit.story;
    const footer = document.createElement('footer');
    const label = document.createElement('span');
    label.textContent = `${exhibit.room} · ${exhibit.date}`;
    const actions = document.createElement('div');
    actions.className = 'exhibit-actions';
    const share = document.createElement('button');
    share.type = 'button';
    share.textContent = 'SHARE';
    share.setAttribute('aria-label', `Share exhibit: ${exhibit.name}`);
    share.addEventListener('click', async () => {
      const url = location.href.split('#')[0];
      const shareText = `“${exhibit.name}”\n${exhibit.story}\nFrom The Museum of Ordinary Things.`;
      try {
        if (navigator.share) {
          await navigator.share({ title: exhibit.name, text: shareText, url });
          collectionMessage.textContent = 'Your device shared the exhibit you chose.';
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${shareText}\n${url}`);
          collectionMessage.textContent = 'Exhibit text and website link copied. Share them wherever you like.';
        } else {
          collectionMessage.textContent = 'Sharing is not available in this browser. You can still copy the exhibit text yourself.';
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          collectionMessage.textContent = 'The share did not complete. Your exhibit is still saved here.';
        }
      }
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'REMOVE';
    remove.setAttribute('aria-label', `Remove exhibit: ${exhibit.name}`);
    remove.addEventListener('click', () => {
      exhibits = exhibits.filter(item => item.id !== exhibit.id);
      persist();
      render();
    });
    actions.append(share, remove);
    footer.append(label, actions);
    card.append(title, story, footer);
    grid.append(card);
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const name = nameField.value.trim();
  const story = storyField.value.trim();
  if (!name || !story) {
    (name ? storyField : nameField).focus();
    return;
  }
  const room = form.querySelector('input[name="room"]:checked')?.value || 'Warm & golden';
  const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date());
  exhibits.unshift({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, story, room, date });
  exhibits = exhibits.slice(0, 60);
  const saved = persist();
  render();
  form.reset();
  document.querySelector('#form-success').textContent = saved
    ? 'Your exhibit is in. Thank you for noticing it.'
    : 'Your exhibit is showing for now, but this browser could not save it for next time.';
  if (document.querySelector('#sound-toggle').getAttribute('aria-pressed') === 'true') playChime();
  document.querySelector('#collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#new-prompt').addEventListener('click', () => {
  const prompt = document.querySelector('#prompt-text');
  const options = prompts.filter(item => item !== prompt.textContent);
  prompt.textContent = options[Math.floor(Math.random() * options.length)];
});

document.querySelector('#share-museum').addEventListener('click', async () => {
  const shareUrl = location.href.split('#')[0];
  const shareText = 'A tiny online museum for the little moments worth keeping.';
  const feedback = document.querySelector('#share-feedback');
  try {
    if (navigator.share) {
      await navigator.share({ title: 'The Museum of Ordinary Things', text: shareText, url: shareUrl });
      feedback.textContent = 'Thanks for passing the museum along.';
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      feedback.textContent = 'Museum link copied. Share it wherever you like.';
    } else {
      feedback.textContent = 'Copy this link to share the museum: ' + shareUrl;
    }
  } catch (error) {
    if (error?.name !== 'AbortError') feedback.textContent = 'The share did not complete. The museum is still here whenever you want it.';
  }
});

document.querySelector('#clear-collection').addEventListener('click', () => {
  if (exhibits.length === 0) return;
  exhibits = [];
  try { localStorage.removeItem(storageKey); } catch { /* Local storage is optional. */ }
  document.querySelector('#form-success').textContent = 'Your museum is clear. There is always room to start again.';
  render();
});

function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(990, context.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.46);
    oscillator.addEventListener('ended', () => context.close(), { once: true });
  } catch { /* The museum works when sound is unavailable. */ }
}

document.querySelector('#sound-toggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const enabled = button.getAttribute('aria-pressed') !== 'true';
  button.setAttribute('aria-pressed', String(enabled));
  button.lastChild.textContent = enabled ? ' SOUND ON' : ' SOUND OFF';
  if (enabled) playChime();
});
