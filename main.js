(function() {
    const tmpl = document.createElement('template');
    tmpl.innerHTML = `
        <style>
            :host {
                display: block;
                font-family: 72, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .widget-container {
                padding: 20px;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: 800px;
                margin: 0 auto;
            }
            .widget-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #0a6ed1;
            }
            .input-group {
                margin-bottom: 15px;
            }
            .input-label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #32363a;
            }
            .input-field {
                width: 100%;
                padding: 10px;
                border: 1px solid #d9d9d9;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            }
            .input-field:focus {
                outline: none;
                border-color: #0a6ed1;
            }
            textarea.input-field {
                min-height: 100px;
                resize: vertical;
                font-family: inherit;
            }
            .btn-submit {
                background-color: #0a6ed1;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .btn-submit:hover {
                background-color: #085caf;
            }
            .btn-submit:disabled {
                background-color: #d9d9d9;
                cursor: not-allowed;
            }
            .response-container {
                margin-top: 20px;
                padding: 15px;
                background-color: #f5f5f5;
                border-radius: 4px;
                border-left: 4px solid #0a6ed1;
                display: none;
            }
            .response-container.show {
                display: block;
            }
            .response-title {
                font-weight: 600;
                margin-bottom: 10px;
                color: #32363a;
            }
            .response-text {
                white-space: pre-wrap;
                word-wrap: break-word;
                color: #32363a;
                line-height: 1.5;
            }
            .error-message {
                background-color: #fef0f0;
                border-left-color: #e00000;
                color: #a70000;
            }
            .loading {
                display: inline-block;
                margin-left: 10px;
            }
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #0a6ed1;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                animation: spin 1s linear infinite;
                display: inline-block;
                vertical-align: middle;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
        
        <div class="widget-container">
            <div class="widget-title">DataRobot AI Assistant</div>
            
            <div class="input-group">
                <label class="input-label" for="token-input">Authorization Token:</label>
                <input 
                    type="password" 
                    id="token-input" 
                    class="input-field" 
                    placeholder="Enter your DataRobot API token"
                />
            </div>
            
            <div class="input-group">
                <label class="input-label" for="question-input">Your Question:</label>
                <textarea 
                    id="question-input" 
                    class="input-field" 
                    placeholder="Ask your question here..."
                ></textarea>
            </div>
            
            <button id="submit-btn" class="btn-submit">
                Send Question
                <span id="loading-spinner" class="loading" style="display: none;">
                    <span class="spinner"></span>
                </span>
            </button>
            
            <div id="response-container" class="response-container">
                <div class="response-title">Response:</div>
                <div id="response-text" class="response-text"></div>
            </div>
        </div>
    `;

    // Check if custom element is already defined
    if (!customElements.get('com-datarobot-chat-widget')) {
        customElements.define('com-datarobot-chat-widget', class extends HTMLElement {
            constructor() {
                super();
                this._shadowRoot = this.attachShadow({mode: 'open'});
                this._shadowRoot.appendChild(tmpl.content.cloneNode(true));
                this._setupElements();
                this._setupEventListeners();
            }

            _setupElements() {
                this._elements = {
                    tokenInput: this._shadowRoot.getElementById('token-input'),
                    questionInput: this._shadowRoot.getElementById('question-input'),
                    submitBtn: this._shadowRoot.getElementById('submit-btn'),
                    responseContainer: this._shadowRoot.getElementById('response-container'),
                    responseText: this._shadowRoot.getElementById('response-text'),
                    loadingSpinner: this._shadowRoot.getElementById('loading-spinner')
                };
            }

            _setupEventListeners() {
                this._elements.submitBtn.addEventListener('click', () => this._handleSubmit());
                
                this._elements.questionInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        this._handleSubmit();
                    }
                });
            }

            async _handleSubmit() {
                const token = this._elements.tokenInput.value.trim();
                const question = this._elements.questionInput.value.trim();
                
                if (!token) {
                    this._showError('Please enter an authorization token.');
                    return;
                }
                
                if (!question) {
                    this._showError('Please enter a question.');
                    return;
                }
                
                this._setLoading(true);
                this._elements.responseContainer.classList.remove('show');
                
                try {
                    const response = await this._callDataRobotAPI(token, question);
                    this._showResponse(response);
                } catch (error) {
                    this._showError(error.message);
                } finally {
                    this._setLoading(false);
                }
            }

            async _callDataRobotAPI(token, userQuestion) {
                const url = 'https://app.datarobot.com/api/v2/deployments/68e519c5287763e42cd91f60/chat/completions';
                
                const requestBody = {
                    model: 'datarobot-deployed-llm',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant'
                        },
                        {
                            role: 'user',
                            content: userQuestion
                        }
                    ]
                };
                
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json; charset=UTF-8',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error('API Error (' + response.status + '): ' + (errorText || response.statusText));
                    }
                    
                    const data = await response.json();
                    
                    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                        return data.choices[0].message.content;
                    }
                    
                    throw new Error('Unexpected response format from API');
                } catch (error) {
                    console.error('Fetch error details:', error);
                    if (error.message === 'Failed to fetch') {
                        throw new Error('CORS Error: DataRobot API is blocking requests from this domain. Please configure CORS settings in your DataRobot deployment to allow requests from: ' + window.location.origin);
                    }
                    throw error;
                }
            }

            _showResponse(text) {
                this._elements.responseContainer.classList.remove('error-message');
                this._elements.responseContainer.classList.add('show');
                this._elements.responseText.textContent = text;
            }

            _showError(message) {
                this._elements.responseContainer.classList.add('error-message', 'show');
                this._elements.responseText.textContent = 'Error: ' + message;
            }

            _setLoading(isLoading) {
                this._elements.submitBtn.disabled = isLoading;
                this._elements.loadingSpinner.style.display = isLoading ? 'inline-block' : 'none';
                this._elements.tokenInput.disabled = isLoading;
                this._elements.questionInput.disabled = isLoading;
            }
        });
    }
})();
