/**
 * Gemini API Integration Test Script
 * Tests the Gemini API connection and response parsing
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("========================================");
console.log("  GEMINI API INTEGRATION TEST  ");
console.log("========================================\n");

// Load dependencies
const allSchemesPath = path.join(__dirname, 'data', 'all_schemes.js');
const allSchemesCode = fs.readFileSync(allSchemesPath, 'utf-8');
const SCHEMES_DATA = vm.runInNewContext(allSchemesCode + '\nSCHEMES_DATA;', {});

const userParserCode = fs.readFileSync(path.join(__dirname, 'src', 'user_parser.js'), 'utf-8');
const UserParser = vm.runInNewContext(userParserCode + '\nUserParser;', {});

const eligibilityCode = fs.readFileSync(path.join(__dirname, 'src', 'eligibility_engine.js'), 'utf-8');
const EligibilityEngine = vm.runInNewContext(eligibilityCode + '\nEligibilityEngine;', {});

console.log("✅ Loaded dependencies");
console.log(`   - ${SCHEMES_DATA.length} schemes`);
console.log(`   - UserParser ready`);
console.log(`   - EligibilityEngine ready\n`);

// Gemini API Configuration
const GEMINI_API_KEY = 'AIzaSyDg-lhYMIJhN-kAAby-mdL9JZA30EDKH5k';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function testGeminiAPI() {
    console.log("TEST 1: Basic API Connection");
    console.log("-".repeat(40));

    try {
        // Simple test prompt
        const testPrompt = "Hello, I need help finding government schemes for a farmer. Please respond with just 'API Connected' if you can understand this.";

        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: testPrompt }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 100
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ API Error: ${response.status}`);
            console.log(`   Error details: ${errorText.substring(0, 200)}`);
            return false;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log(`✅ API Connected Successfully!`);
        console.log(`   Response: ${text?.substring(0, 100)}...`);
        return true;

    } catch (error) {
        console.log(`❌ Connection Error: ${error.message}`);
        return false;
    }
}

async function testEnhanceRecommendations() {
    console.log("\n\nTEST 2: Enhance Recommendations");
    console.log("-".repeat(40));

    // Create a test profile
    const userQuery = "I am a 25 year old female farmer from Maharashtra with 2 acres land";
    const profile = UserParser.parse(userQuery);
    const matchedSchemes = EligibilityEngine.findEligibleSchemes(SCHEMES_DATA, profile, 5);

    console.log(`Testing with: "${userQuery}"`);
    console.log(`Found ${matchedSchemes.length} matched schemes\n`);

    // Build the prompt
    const schemeSummaries = matchedSchemes.slice(0, 3).map((m, i) => {
        const s = m.scheme;
        return `${i + 1}. ${s.name}
   - Category: ${s.category}
   - Benefits: ${s.benefits?.substring(0, 150)}...
   - Match Score: ${m.percentage}%`;
    }).join('\n\n');

    const profileSummary = UserParser.getProfileSummary(profile);

    const prompt = `You are an expert Indian government scheme advisor. A citizen has asked for scheme recommendations.

USER QUERY: "${userQuery}"

USER PROFILE:
${profileSummary}

MATCHED SCHEMES (based on eligibility scoring):
${schemeSummaries}

YOUR TASK:
1. For each scheme, provide a brief personalized explanation of WHY this person is likely eligible
2. Highlight the most relevant benefits for their situation
3. Suggest any additional information they should provide

Format your response as JSON:
{
  "enhanced_schemes": [
    {
      "scheme_index": 1,
      "eligibility_explanation": "Brief explanation of why they qualify",
      "key_benefits": ["benefit1", "benefit2"],
      "relevance_score": 85
    }
  ],
  "clarifying_questions": ["question1"],
  "additional_tips": "Any helpful advice",
  "confidence": "high/medium/low"
}

Respond ONLY with valid JSON, no markdown or explanations.`;

    try {
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            console.log(`❌ API Error: ${response.status}`);
            return false;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log(`✅ Received AI Response!`);
        console.log(`   Raw length: ${text?.length || 0} chars\n`);

        // Parse the JSON response
        let cleanText = text?.trim() || '';
        if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

        const parsed = JSON.parse(cleanText);

        console.log("📊 PARSED RESPONSE:");
        console.log(`   Confidence: ${parsed.confidence}`);
        console.log(`   Enhanced Schemes: ${parsed.enhanced_schemes?.length || 0}`);

        if (parsed.enhanced_schemes?.[0]) {
            const es = parsed.enhanced_schemes[0];
            console.log(`\n   First Scheme Enhancement:`);
            console.log(`   - Index: ${es.scheme_index}`);
            console.log(`   - Explanation: ${es.eligibility_explanation?.substring(0, 100)}...`);
            console.log(`   - Benefits: ${es.key_benefits?.join(', ')}`);
            console.log(`   - Relevance: ${es.relevance_score}%`);
        }

        if (parsed.clarifying_questions?.length > 0) {
            console.log(`\n   Clarifying Questions:`);
            parsed.clarifying_questions.forEach((q, i) => {
                console.log(`   ${i + 1}. ${q}`);
            });
        }

        if (parsed.additional_tips) {
            console.log(`\n   Additional Tips: ${parsed.additional_tips.substring(0, 100)}...`);
        }

        return true;

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

async function testAmbiguousQuery() {
    console.log("\n\nTEST 3: Ambiguous Query Analysis");
    console.log("-".repeat(40));

    const ambiguousQuery = "I need help";
    console.log(`Testing with: "${ambiguousQuery}"`);

    const sampleSchemes = SCHEMES_DATA.slice(0, 30).map(s => ({
        name: s.name,
        category: s.category,
        tags: s.tags
    }));

    const prompt = `A user asked: "${ambiguousQuery}"

This is a vague query. Based on these sample government schemes:
${JSON.stringify(sampleSchemes.slice(0, 10), null, 2)}

Identify:
1. What categories of schemes might be relevant
2. What additional information we should ask the user
3. Key keywords to search for in our database

Respond as JSON:
{
  "relevant_categories": ["category1", "category2"],
  "search_keywords": ["keyword1", "keyword2"],
  "clarifying_questions": ["question1", "question2"],
  "interpretation": "Your interpretation of what the user needs"
}`;

    try {
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 1024
                }
            })
        });

        if (!response.ok) {
            console.log(`❌ API Error: ${response.status}`);
            return false;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log(`✅ Received AI Analysis!\n`);

        let cleanText = text?.trim() || '';
        if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
        if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

        const parsed = JSON.parse(cleanText);

        console.log("📊 ANALYSIS:");
        console.log(`   Interpretation: ${parsed.interpretation}`);
        console.log(`   Relevant Categories: ${parsed.relevant_categories?.join(', ')}`);
        console.log(`   Search Keywords: ${parsed.search_keywords?.join(', ')}`);

        if (parsed.clarifying_questions?.length > 0) {
            console.log(`\n   Clarifying Questions:`);
            parsed.clarifying_questions.forEach((q, i) => {
                console.log(`   ${i + 1}. ${q}`);
            });
        }

        return true;

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    const test1 = await testGeminiAPI();

    if (test1) {
        await testEnhanceRecommendations();
    } else {
        console.log("\n⚠️ Skipping remaining tests due to API connection failure");
    }

    console.log("\n========================================");
    console.log("  ✅ GEMINI INTEGRATION TEST COMPLETE  ");
    console.log("========================================");
}

runAllTests();
