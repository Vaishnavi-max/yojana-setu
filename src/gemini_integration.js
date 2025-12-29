/**
 * Gemini AI Integration
 * Uses Google Gemini API for enhanced natural language understanding
 */

const GeminiIntegration = {
    apiKey: 'AIzaSyDg-lhYMIJhN-kAAby-mdL9JZA30EDKH5k',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

    /**
     * Enhance scheme recommendations using Gemini AI
     */
    /**
     * Enhance scheme recommendations using Gemini AI
     * STRICTLY for explaining why the user is eligible
     */
    async enhanceRecommendations(userQuery, profile, matchedSchemes) {
        if (!matchedSchemes || matchedSchemes.length === 0) return null;

        const prompt = this.buildPrompt(userQuery, profile, matchedSchemes);

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048
                    }
                })
            });

            if (!response.ok) {
                // If quota exceeded or other error, just return null so app uses default logic
                return null;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (text) {
                return this.parseGeminiResponse(text, matchedSchemes);
            }

            return null;
        } catch (error) {
            // Silently fail on API error to fall back to basic matching
            return null;
        }
    },

    /**
     * Build prompt for Gemini - Focused ONLY on explanation
     */
    buildPrompt(userQuery, profile, matchedSchemes) {
        // Only take top 3 schemes to save tokens
        const schemeSummaries = matchedSchemes.slice(0, 3).map((m, i) => {
            const s = m.scheme;
            return `SCHEME ${i + 1}: ${s.name}
   - Benefits: ${s.benefits?.substring(0, 300)}...
   - Eligibility: ${s.eligibility?.substring(0, 300)}...`;
        }).join('\n\n');

        const profileSummary = UserParser.getProfileSummary(profile);

        return `You are a helpful government scheme advisor.
        
USER PROFILE: ${profileSummary}

I have identified these potential schemes for them:

${schemeSummaries}

TASK:
For each scheme, provide a 1-sentence SIMPLE explanation of why this specific user is eligible.
Focus on their specific details (e.g. "Because you are a female farmer..." or "Since you are a student...").

Format as JSON:
{
  "explanations": [
    {
      "scheme_index": 1,
      "text": "Explanation for first scheme..."
    },
    {
       "scheme_index": 2,
       "text": "Explanation for second scheme..."
    }
  ]
}
Respond ONLY with JSON.`;
    },

    /**
     * Parse Gemini response
     */
    parseGeminiResponse(text, matchedSchemes) {
        try {
            let cleanText = text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
            if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
            if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

            const parsed = JSON.parse(cleanText);

            if (parsed.explanations) {
                for (const expl of parsed.explanations) {
                    const idx = expl.scheme_index - 1;
                    if (matchedSchemes[idx]) {
                        matchedSchemes[idx].aiExplanation = expl.text;
                    }
                }
            }
            return { schemes: matchedSchemes };
        } catch (error) {
            return null;
        }
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiIntegration;
}
