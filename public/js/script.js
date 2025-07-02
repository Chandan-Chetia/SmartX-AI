document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    // Load chat history from server
    fetch('/chat-history')
      .then(res => res.json())
      .then(history => {
        history.forEach(msg => {
          if (msg.userMessage) addUserMessage(msg.userMessage);
          if (msg.botResponse) addBotMessage(msg.botResponse);
        });
      });

    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);

    // Send message on Enter key
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addUserMessage(message);
            userInput.value = '';
            showTypingIndicator();
            
            // Send message to server
            fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            })
            .then(response => response.json())
            .then(data => {
                removeTypingIndicator();
                if (data.error) {
                    addBotMessage("Sorry, I encountered an error. Please try again.");
                } else {
                    addBotMessage(data.response);
                }
            })
            .catch(error => {
                removeTypingIndicator();
                addBotMessage("Sorry, there was a problem connecting to the server.");
                console.error('Error:', error);
            });
        }
    }

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.textContent = message;
        chatBox.appendChild(messageElement);
        scrollToBottom();
    }

    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message');
        messageElement.innerHTML = marked.parse(message); // Convert Markdown to HTML
        chatBox.appendChild(messageElement);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'bot-message');
        typingElement.id = 'typing-indicator';
        
        const typingText = document.createElement('div');
        typingText.classList.add('typing-indicator');
        typingText.innerHTML = '<span></span><span></span><span></span>';
        
        typingElement.appendChild(typingText);
        chatBox.appendChild(typingElement);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});