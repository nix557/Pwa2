// =======================================================
// SOLUSI UNTUK MASALAH KEYBOARD MOBILE
// =======================================================

const setAppHeight = () => {
    const appContainer = document.getElementById('app-container');
    // 'window.innerHeight' SELALU memberikan tinggi viewport yang terlihat saat ini,
    // bahkan ketika keyboard terbuka. Ini adalah sumber kebenaran kita.
    appContainer.style.height = `${window.innerHeight}px`;
};

// Atur tinggi saat halaman pertama kali dimuat
window.addEventListener('load', setAppHeight);

// Atur ulang tinggi SETIAP KALI ukuran jendela berubah.
// Ini terpicu saat keyboard muncul dan HILANG.
window.addEventListener('resize', setAppHeight);

// =======================================================
// SISA KODE (PWA & LOGIKA CHAT)
// =======================================================

// Pendaftaran Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => console.log('SW terdaftar')).catch(err => console.log('SW Gagal:', err));
  });
}

// Logika Aplikasi Chat
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    let apiKey = sessionStorage.getItem('geminiApiKey');

    if (!apiKey) {
        addMessageToChat('bot', 'Selamat datang! Silakan masukkan Google AI API Key Anda untuk memulai.');
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        if (!apiKey) {
            apiKey = message;
            sessionStorage.setItem('geminiApiKey', apiKey);
            addMessageToChat('bot', 'API Key Anda telah disimpan. Mulai bertanya.');
            messageInput.value = '';
            return;
        }

        addMessageToChat('user', message);
        const thinkingMessage = addMessageToChat('bot', '...', true);
        messageInput.value = '';

        try {
            const botResponse = await getGeminiResponse(message, apiKey);
            updateMessage(thinkingMessage, botResponse);
        } catch (error) {
            const errorMessage = `Error: ${error.message}. Pastikan API Key valid.`;
            updateMessage(thinkingMessage, errorMessage);
            sessionStorage.removeItem('geminiApiKey');
            apiKey = null;
        }
    });

    function addMessageToChat(sender, message, isThinking = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        messageElement.textContent = message;
        if (isThinking) messageElement.id = 'thinking-message';
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    }

    function updateMessage(element, newMessage) {
        element.textContent = newMessage;
        element.id = '';
    }

    async function getGeminiResponse(prompt, key) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const requestBody = { "contents": [{"parts": [{ "text": prompt }]}], "tools": [{"google_search": {}}] };
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts[0].text) {
             return candidate.content.parts[0].text;
        }
        return "Gagal memproses respons.";
    }
});
