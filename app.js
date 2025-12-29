/**
 * Yojana Setu - Main Application
 * Government Scheme Eligibility Chatbot
 */

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const quickSuggestions = document.getElementById('quickSuggestions');
const schemeCount = document.getElementById('schemeCount');

// State
let conversationHistory = [];
let lastProfile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    // Update scheme count
    if (typeof SCHEMES_DATA !== 'undefined') {
        schemeCount.textContent = SCHEMES_DATA.length.toLocaleString();
    }

    // Event listeners
    userInput.addEventListener('input', handleInputChange);
    userInput.addEventListener('keydown', handleKeyDown);
    sendBtn.addEventListener('click', handleSend);

    // Quick suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            userInput.value = chip.dataset.query;
            handleInputChange();
            handleSend();
        });
    });

    // Auto-resize textarea
    userInput.addEventListener('input', autoResize);
}

function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

function handleInputChange() {
    const hasText = userInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
            handleSend();
        }
    }
}

async function handleSend() {
    const query = userInput.value.trim();
    if (!query) return;

    // Clear input
    userInput.value = '';
    handleInputChange();
    autoResize();

    // Hide suggestions after first message
    quickSuggestions.style.display = 'none';

    // Add user message
    addMessage(query, 'user');

    // Show loading
    showLoading(true);

    try {
        // Process query
        const result = await processQuery(query);

        // Add bot response
        addBotResponse(result);
    } catch (error) {
        console.error('Error processing query:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
        showLoading(false);
    }
}

async function processQuery(query) {
    // Parse user input
    const profile = UserParser.parse(query);
    lastProfile = profile;

    console.log('Parsed profile:', profile);

    // Check if schemes data is loaded
    if (typeof SCHEMES_DATA === 'undefined' || SCHEMES_DATA.length === 0) {
        return {
            type: 'error',
            message: 'Scheme data is not loaded. Please refresh the page.'
        };
    }

    let matchedSchemes = [];
    let aiEnhanced = null;

    // Determine processing strategy based on detail level
    if (profile.detailLevel === 'detailed' || profile.detailLevel === 'partial') {
        // Use scoring engine for detailed queries
        matchedSchemes = EligibilityEngine.findEligibleSchemes(SCHEMES_DATA, profile, 6);
    } else {
        // Quick filter for ambiguous queries
        matchedSchemes = EligibilityEngine.quickFilter(SCHEMES_DATA, profile, 10);
    }

    // Try to enhance with Gemini AI specific explanations
    try {
        if (matchedSchemes.length > 0) {
            aiEnhanced = await GeminiIntegration.enhanceRecommendations(query, profile, matchedSchemes);
        }
    } catch (e) {
        console.log('AI enhancement skipped:', e.message);
    }

    if (matchedSchemes.length === 0) {
        return {
            type: 'no_results',
            profile: profile
        };
    }

    return {
        type: 'results',
        profile: profile,
        schemes: aiEnhanced?.schemes || matchedSchemes,
        // Clarifying questions removed as we only use AI for explanation now
        clarifyingQuestions: [],
        additionalTips: '',
        confidence: 'high'
    };
}

function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = content;

    contentDiv.appendChild(bubble);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addBotResponse(result) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = renderBotResponse(result);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function renderBotResponse(result) {
    if (result.type === 'error') {
        return `<div class="message-bubble" style="background: rgba(255,0,0,0.1); border-color: #ff4444;">
            <p>❌ ${result.message}</p>
        </div>`;
    }

    if (result.type === 'no_results') {
        return `<div class="message-bubble">
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3>No matching schemes found</h3>
                <p>I couldn't find schemes matching your profile. Please provide more details:</p>
                <ul>
                    <li>Your age and gender</li>
                    <li>Occupation (farmer, student, worker, etc.)</li>
                    <li>Income level or BPL status</li>
                    <li>State you're from</li>
                    <li>Category (SC/ST/OBC/General)</li>
                </ul>
            </div>
        </div>`;
    }

    const profileSummary = UserParser.getProfileSummary(result.profile);
    let html = `<div class="message-bubble">`;

    // Profile acknowledgment
    html += `<p><strong>📋 Understood:</strong> ${profileSummary}</p>`;

    // (Clarifying questions section removed)

    // Scheme count
    const schemeLabel = result.schemes.length === 1 ? 'scheme' : 'schemes';
    html += `<p>I found <strong style="color: #1DB954;">${result.schemes.length} ${schemeLabel}</strong> you may be eligible for:</p>`;
    html += `</div>`;

    // Scheme cards
    html += `<div class="scheme-cards">`;

    for (const match of result.schemes) {
        const scheme = match.scheme;
        const percentage = match.percentage;
        const reasons = match.aiExplanation || (match.reasons && match.reasons.length > 0 ? match.reasons.join('. ') : '');
        // const benefits = match.aiKeyBenefits || []; // Removed AI benefits

        html += `<div class="scheme-card">
            <div class="scheme-header">
                <h4 class="scheme-name">${scheme.name}</h4>
                ${percentage !== null ? `<div class="scheme-score">
                    <span class="score-value">${percentage}%</span>
                    <span class="score-label">Match</span>
                </div>` : ''}
            </div>
            
            ${scheme.category ? `<span class="scheme-category">${scheme.category}</span>` : ''}
            
            ${reasons ? `<div class="eligibility-reason">${reasons}</div>` : ''}
            
            <div class="scheme-section">
                <div class="scheme-section-title">💰 Benefits</div>
                <div class="scheme-section-content">
                    ${renderTextWithToggle(scheme.benefits, 150)}
                </div>
            </div>
            
            <div class="scheme-section">
                <div class="scheme-section-title">✅ Eligibility</div>
                <div class="scheme-section-content">${renderTextWithToggle(scheme.eligibility, 150)}</div>
            </div>
            
            <div class="scheme-section">
                <div class="scheme-section-title">📝 How to Apply</div>
                <div class="scheme-section-content">${renderTextWithToggle(scheme.application, 100)}</div>
            </div>
            
            ${scheme.tags ? `<div class="scheme-tags">
                ${scheme.tags.split(',').slice(0, 5).map(tag => `<span class="scheme-tag">${tag.trim()}</span>`).join('')}
            </div>` : ''}
        </div>`;
    }

    html += `</div>`;

    // (Additional tips section removed)

    return html;
}

// Helper to toggle text
function renderTextWithToggle(text, maxLength) {
    if (!text) return 'Information not available';
    if (text.length <= maxLength) return text;

    // Escape single quotes for HTML attribute safety
    const safeText = text.replace(/'/g, "&apos;").replace(/"/g, "&quot;");

    return `
        <span class="short-text">${text.substring(0, maxLength)}...</span>
        <span class="full-text" style="display:none;">${text}</span>
        <button class="read-more-btn" onclick="toggleText(this)">Read More</button>
    `;
}

// Global toggle function
window.toggleText = function (btn) {
    const parent = btn.parentElement;
    const shortSpan = parent.querySelector('.short-text');
    const fullSpan = parent.querySelector('.full-text');

    if (fullSpan.style.display === 'none') {
        fullSpan.style.display = 'inline';
        shortSpan.style.display = 'none';
        btn.textContent = 'Read Less';
    } else {
        fullSpan.style.display = 'none';
        shortSpan.style.display = 'inline';
        btn.textContent = 'Read More';
    }
};

function truncateText(text, maxLength) {
    if (!text) return 'Information not available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function showLoading(show) {
    // Disabled as per user request
    // loadingOverlay.classList.toggle('active', show);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Expose for debugging
window.debugProfile = () => lastProfile;
window.debugSchemes = () => typeof SCHEMES_DATA !== 'undefined' ? SCHEMES_DATA.length : 0;
