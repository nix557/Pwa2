// =======================================================
// KUNCI #3: MANAJEMEN LAYOUT AKTIF DENGAN JAVASCRIPT
// =======================================================

// Fungsi untuk mengatur tinggi container aplikasi sama dengan tinggi jendela yang terlihat
const setAppHeight = () => {
	const appContainer = document.getElementById('app-container');
	// window.innerHeight adalah tinggi viewport yang sebenarnya, lebih andal dari 100vh
	const newHeight = window.innerHeight;
	appContainer.style.height = `${newHeight}px`;
};

// Panggil fungsi saat halaman pertama kali dimuat
window.addEventListener('load', setAppHeight);

// Panggil fungsi SETIAP KALI ukuran jendela berubah.
// Ini adalah kunci untuk memperbaiki masalah keyboard.
// Saat keyboard hilang, 'resize' akan terpicu dan layout akan diperbaiki.
window.addEventListener('resize', setAppHeight);


// Pendaftaran Service Worker untuk PWA (tidak berubah)
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js')
			.then(registration => {
				console.log('Pendaftaran ServiceWorker berhasil, scope: ', registration.scope);
			})
			.catch(err => {
				console.log('Pendaftaran ServiceWorker gagal: ', err);
			});
	});
}

// Logika Aplikasi Chat (tidak berubah)
document.addEventListener('DOMContentLoaded', () => {
	const chatForm = document.getElementById('chat-form');
	const messageInput = document.getElementById('message-input');
	const chatMessages = document.getElementById('chat-messages');
	let apiKey = sessionStorage.getItem('geminiApiKey');
	
	if (!apiKey) {
		addMessageToChat('bot', 'Selamat datang! Silakan masukkan Google AI API Key Anda untuk memulai.');
	}
	
	// Panggil setAppHeight lagi setelah DOM dimuat untuk memastikan
	setAppHeight();
	
	chatForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const message = messageInput.value.trim();
		if (!message) return;
		
		if (!apiKey) {
			apiKey = message;
			sessionStorage.setItem('geminiApiKey', apiKey);
			addMessageToChat('bot', 'API Key Anda telah disimpan untuk sesi ini. Sekarang Anda bisa mulai bertanya.');
			messageInput.value = '';
			return;
		}
		
		addMessageToChat('user', message);
		const thinkingMessage = addMessageToChat('bot', 'Sedang memproses...', true);
		messageInput.value = '';
		
		try {
			const botResponse = await getGeminiResponse(message, apiKey);
			updateMessage(thinkingMessage, botResponse);
		} catch (error) {
			console.error('Detailed Error:', error);
			const errorMessage = `Maaf, terjadi kesalahan: ${error.message}. Pastikan API Key Anda valid.`;
			updateMessage(thinkingMessage, errorMessage);
			sessionStorage.removeItem('geminiApiKey');
			apiKey = null;
			addMessageToChat('bot', 'Silakan masukkan kembali API Key Anda.');
		}
	});
	
	function addMessageToChat(sender, message, isThinking = false) {
		const messageElement = document.createElement('div');
		messageElement.classList.add('message', `${sender}-message`);
		messageElement.textContent = message;
		if (isThinking) {
			messageElement.id = 'thinking-message';
		}
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
		const requestBody = { "contents": [{ "parts": [{ "text": prompt }] }], "tools": [{ "google_search": {} }] };
		const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error.message || `HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		const candidate = data.candidates[0];
		if (candidate.content && candidate.content.parts[0].text) {
			return candidate.content.parts[0].text;
		} else {
			console.error("Unexpected API response format:", data);
			return "Saya menerima respons yang tidak dapat saya proses saat ini.";
		}
	}
});
