(function() {
  const scriptTag = document.currentScript;
  const SCRIPT_URL = scriptTag ? scriptTag.src : '';
  // Fallback to localhost:3000 if someone copy-pastes the code directly instead of using src="..."
  const widgetHost = SCRIPT_URL ? new URL(SCRIPT_URL).origin : 'http://localhost:3000';
  const embedKey = scriptTag ? scriptTag.getAttribute('data-key') : '';

  if (!embedKey) {
    console.error('Sutra Widget: Missing data-key attribute on script tag.');
    // Don't return early, maybe they hardcoded the key below if they copy pasted
  }

  // Inject styles
  const style = document.createElement('style');
  style.innerHTML = `
    .cw-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .cw-toggle-btn {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: linear-gradient(135deg, #00F0FF, #7000FF);
      color: #fff;
      border: none;
      box-shadow: 0 0 20px rgba(112,0,255,0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cw-toggle-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 0 30px rgba(112,0,255,0.6);
    }
    .cw-chat-panel {
      position: absolute;
      bottom: 76px;
      right: 0;
      width: 380px;
      height: 600px;
      background: rgba(5, 5, 5, 0.85);
      backdrop-filter: blur(16px);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      pointer-events: none;
      transform: scale(0.95) translateY(10px);
    }
    .cw-chat-panel.cw-open {
      opacity: 1;
      pointer-events: all;
      transform: scale(1) translateY(0);
    }
    .cw-header {
      background: rgba(0,0,0,0.5);
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cw-header h3 {
      margin: 0;
      font-size: 16px;
      color: #fff;
      font-weight: 600;
    }
    .cw-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cw-msg {
      max-width: 85%;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      color: #fff;
    }
    .cw-msg-user {
      align-self: flex-end;
      background: #18181b;
      border: 1px solid #27272a;
      border-bottom-right-radius: 2px;
    }
    .cw-msg-ai {
      align-self: flex-start;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-bottom-left-radius: 2px;
    }
    .cw-footer {
      padding: 16px;
      background: rgba(0,0,0,0.5);
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .cw-form {
      display: flex;
      gap: 8px;
    }
    .cw-input {
      flex: 1;
      padding: 12px 16px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      font-size: 14px;
      color: #fff;
      outline: none;
      transition: border-color 0.2s;
    }
    .cw-input::placeholder {
      color: #a1a1aa;
    }
    .cw-input:focus {
      border-color: #00F0FF;
    }
    .cw-send-btn {
      padding: 0 20px;
      border-radius: 24px;
      background: linear-gradient(135deg, #00F0FF, #7000FF);
      color: #fff;
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .cw-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @media (max-width: 480px) {
      .cw-chat-panel {
        width: calc(100vw - 48px);
        height: 70vh;
      }
    }
  `;
  document.head.appendChild(style);

  // Inject HTML structure
  const container = document.createElement('div');
  container.className = 'cw-widget-container';
  
  container.innerHTML = `
    <div class="cw-chat-panel" id="cwChatPanel">
      <div class="cw-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" stroke-width="2"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        <h3>Sutra Intelligence</h3>
      </div>
      <div class="cw-body" id="cwBody">
        <div class="cw-msg cw-msg-ai">Hello! I am connected to the enterprise knowledge graph. How can I help you today?</div>
      </div>
      <div class="cw-footer">
        <form class="cw-form" id="cwForm">
          <input type="text" class="cw-input" id="cwInput" placeholder="Ask a question..." autocomplete="off">
          <button type="submit" class="cw-send-btn" id="cwBtn">Send</button>
        </form>
      </div>
    </div>
    <button class="cw-toggle-btn" id="cwToggleBtn">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
    </button>
  `;
  
  document.body.appendChild(container);

  // Logic
  const toggleBtn = document.getElementById('cwToggleBtn');
  const chatPanel = document.getElementById('cwChatPanel');
  const cwForm = document.getElementById('cwForm');
  const cwInput = document.getElementById('cwInput');
  const cwBtn = document.getElementById('cwBtn');
  const cwBody = document.getElementById('cwBody');

  let isOpen = false;
  let isLoading = false;
  let sessionId = null;

  toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      chatPanel.classList.add('cw-open');
    } else {
      chatPanel.classList.remove('cw-open');
    }
  });

  const appendMsg = (text, role) => {
    const el = document.createElement('div');
    el.className = 'cw-msg cw-msg-' + role;
    el.innerText = text;
    cwBody.appendChild(el);
    cwBody.scrollTop = cwBody.scrollHeight;
    return el;
  };

  cwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = cwInput.value.trim();
    if (!q || isLoading) return;

    appendMsg(q, 'user');
    cwInput.value = '';
    isLoading = true;
    cwBtn.disabled = true;

    const asstEl = appendMsg('Searching knowledge graph...', 'ai');

    try {
      const activeKey = embedKey || 'YOUR_KEY_HERE'; // Fallback if copy pasted
      
      const res = await fetch(widgetHost + '/api/embed-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-embed-key': activeKey
        },
        body: JSON.stringify({ question: q, sessionId: sessionId })
      });

      if (!res.ok) {
        const text = await res.json();
        asstEl.innerText = text.error || 'Error occurred';
        return;
      }

      const newSessionId = res.headers.get('x-session-id');
      if (newSessionId && !sessionId) {
        sessionId = newSessionId;
      }

      if (res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        asstEl.innerText = data.answer || "No response";
      } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiText = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiText += decoder.decode(value);
          asstEl.innerText = aiText;
          cwBody.scrollTop = cwBody.scrollHeight;
        }
      }
    } catch (err) {
      asstEl.innerText = 'Network error: ' + err.message + '. Ensure the Sutra server is running at ' + widgetHost;
    } finally {
      isLoading = false;
      cwBtn.disabled = false;
    }
  });

})();
