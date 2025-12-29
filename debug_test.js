/**
 * Yojana Setu Debugging Test Script
 * Tests all components step by step
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("========================================");
console.log("  YOJANA SETU - DEBUGGING TEST SUITE  ");
console.log("========================================\n");

// ============ STEP 1: Load and verify data files ============
console.log("STEP 1: VERIFYING DATA FILES");
console.log("-".repeat(40));

// Load and parse all_schemes.js
const allSchemesPath = path.join(__dirname, 'data', 'all_schemes.js');
const allSchemesCode = fs.readFileSync(allSchemesPath, 'utf-8');
// Wrap code to capture the const declaration and return it
const wrappedAllSchemesCode = allSchemesCode + '\nSCHEMES_DATA;';
const SCHEMES_DATA = vm.runInNewContext(wrappedAllSchemesCode, {});

// Load and parse priority_schemes.js  
const prioritySchemesPath = path.join(__dirname, 'data', 'priority_schemes.js');
const prioritySchemesCode = fs.readFileSync(prioritySchemesPath, 'utf-8');
const wrappedPriorityCode = prioritySchemesCode + '\nPRIORITY_SCHEMES;';
const PRIORITY_SCHEMES = vm.runInNewContext(wrappedPriorityCode, {});

console.log(`✅ all_schemes.js loaded: ${SCHEMES_DATA.length} schemes`);
console.log(`✅ priority_schemes.js loaded: ${PRIORITY_SCHEMES.length} schemes`);

// Check data structure
const sampleScheme = SCHEMES_DATA[0];
const requiredFields = ['id', 'name', 'details', 'benefits', 'eligibility', 'application', 'documents', 'level', 'category', 'tags'];
const missingFields = requiredFields.filter(f => !(f in sampleScheme));

if (missingFields.length === 0) {
    console.log(`✅ Data structure correct - all required fields present`);
} else {
    console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
}

// Show sample scheme
console.log(`\n📄 Sample Scheme (ID: ${sampleScheme.id}):`);
console.log(`   Name: ${sampleScheme.name.substring(0, 60)}...`);
console.log(`   Level: ${sampleScheme.level}`);
console.log(`   Category: ${sampleScheme.category}`);

// ============ STEP 2: Load UserParser and EligibilityEngine ============
console.log("\n\nSTEP 2: LOADING MODULES");
console.log("-".repeat(40));

// Load UserParser
const userParserCode = fs.readFileSync(path.join(__dirname, 'src', 'user_parser.js'), 'utf-8');
const wrappedUserParserCode = userParserCode + '\nUserParser;';
const UserParser = vm.runInNewContext(wrappedUserParserCode, {});
console.log(`✅ UserParser loaded`);

// Load EligibilityEngine
const eligibilityEngineCode = fs.readFileSync(path.join(__dirname, 'src', 'eligibility_engine.js'), 'utf-8');
const wrappedEligibilityCode = eligibilityEngineCode + '\nEligibilityEngine;';
const EligibilityEngine = vm.runInNewContext(wrappedEligibilityCode, {});
console.log(`✅ EligibilityEngine loaded`);

// ============ STEP 3: Test UserParser ============
console.log("\n\nSTEP 3: TESTING USER PARSER");
console.log("-".repeat(40));

const testCases = [
    {
        input: "I am a 25 year old female farmer from Maharashtra with 2 acres land and income of 1.5 lakh",
        expected: { age: 25, gender: 'female', occupation: 'farmer', state: 'maharashtra' }
    },
    {
        input: "I am a woman",
        expected: { gender: 'female' }
    },
    {
        input: "I am a 65 year old SC widow from Bihar BPL",
        expected: { age: 65, caste: 'sc', isWidow: true, state: 'bihar', isBPL: true }
    },
    {
        input: "unemployed youth 22 years from Rajasthan",
        expected: { age: 22, occupation: 'unemployed', state: 'rajasthan' }
    },
    {
        input: "disabled student from Kerala",
        expected: { occupation: 'student', state: 'kerala', isDisabled: true }
    }
];

let parserTestsPassed = 0;
testCases.forEach((test, i) => {
    console.log(`\nTest ${i + 1}: "${test.input}"`);
    const result = UserParser.parse(test.input);

    let passed = true;
    for (const [key, expectedValue] of Object.entries(test.expected)) {
        const actualValue = result[key];
        if (actualValue !== expectedValue) {
            console.log(`  ❌ ${key}: expected "${expectedValue}", got "${actualValue}"`);
            passed = false;
        } else {
            console.log(`  ✅ ${key}: ${actualValue}`);
        }
    }

    if (passed) parserTestsPassed++;
    console.log(`  📊 Detail Level: ${result.detailLevel}`);
    console.log(`  📋 Extracted Fields: [${result.extractedFields.join(', ')}]`);
});

console.log(`\n🏆 Parser Tests: ${parserTestsPassed}/${testCases.length} passed`);

// ============ STEP 4: Test EligibilityEngine ============
console.log("\n\nSTEP 4: TESTING ELIGIBILITY ENGINE");
console.log("-".repeat(40));

// Test with detailed profile
const testProfile = {
    rawInput: "I am a 25 year old female farmer from Maharashtra with 2 acres land and income of 1.5 lakh",
    age: 25,
    gender: 'female',
    occupation: 'farmer',
    income: 150000,
    incomeLevel: 'low',
    caste: null,
    state: 'maharashtra',
    landSize: 2,
    isDisabled: false,
    isWidow: false,
    isSeniorCitizen: false,
    isBPL: false,
    detailLevel: 'detailed',
    extractedFields: ['age', 'gender', 'occupation', 'state', 'land', 'income']
};

console.log("\nTest Profile:", UserParser.getProfileSummary(testProfile));

// Find eligible schemes
const eligibleSchemes = EligibilityEngine.findEligibleSchemes(SCHEMES_DATA, testProfile, 10);

console.log(`\n📌 Found ${eligibleSchemes.length} eligible schemes:\n`);

eligibleSchemes.slice(0, 6).forEach((result, i) => {
    console.log(`${i + 1}. ${result.scheme.name.substring(0, 70)}...`);
    console.log(`   🎯 Match: ${result.percentage}% | Score: ${result.score}/${result.maxScore}`);
    console.log(`   ✓ Matched: [${result.matchedCriteria.join(', ')}]`);
    console.log(`   💡 Reasons: ${result.reasons.slice(0, 2).join('; ')}`);
    console.log();
});

// ============ STEP 5: Verify Priority Schemes ============
console.log("\n\nSTEP 5: VERIFYING PRIORITY SCHEMES");
console.log("-".repeat(40));

const categoryCounts = {};
PRIORITY_SCHEMES.forEach(s => {
    categoryCounts[s.priority_category] = (categoryCounts[s.priority_category] || 0) + 1;
});

console.log("Priority schemes by category:");
Object.entries(categoryCounts).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} schemes`);
});

// ============ STEP 6: Test Different User Profiles ============
console.log("\n\nSTEP 6: TESTING DIFFERENT USER PROFILES");
console.log("-".repeat(40));

const userProfiles = [
    "I am a 30 year old farmer from Punjab",
    "I am a woman entrepreneur from Gujarat",
    "I am an SC student from Uttar Pradesh",
    "I am a 70 year old senior citizen widow",
    "I am a disabled person from Tamil Nadu"
];

userProfiles.forEach(query => {
    const profile = UserParser.parse(query);
    const schemes = EligibilityEngine.findEligibleSchemes(SCHEMES_DATA, profile, 3);

    console.log(`\n🔍 "${query}"`);
    console.log(`   Profile: ${UserParser.getProfileSummary(profile)}`);
    console.log(`   Top matches (${schemes.length} found):`);

    schemes.slice(0, 2).forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.scheme.name.substring(0, 50)}... (${s.percentage}%)`);
    });
});

// ============ STEP 7: Keyword Coverage Analysis ============
console.log("\n\nSTEP 7: KEYWORD COVERAGE ANALYSIS");
console.log("-".repeat(40));

const keywords = {
    farmer: ['farmer', 'kisan', 'agriculture', 'farming', 'crop'],
    women: ['woman', 'women', 'mahila', 'female', 'widow'],
    student: ['student', 'scholarship', 'education', 'school'],
    senior: ['senior', 'pension', 'old age', 'elderly'],
    disabled: ['disabled', 'disability', 'divyang', 'handicapped'],
    sc_st: ['scheduled caste', 'scheduled tribe', ' sc ', ' st ', 'dalit', 'tribal'],
    bpl: ['bpl', 'below poverty', 'poor', 'economically weak']
};

console.log("Schemes matching each category:");
Object.entries(keywords).forEach(([category, kws]) => {
    let matchCount = 0;
    SCHEMES_DATA.forEach(scheme => {
        const text = `${scheme.name} ${scheme.eligibility} ${scheme.category} ${scheme.tags}`.toLowerCase();
        if (kws.some(kw => text.includes(kw))) {
            matchCount++;
        }
    });
    const percent = (matchCount / SCHEMES_DATA.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(percent / 5)) + '░'.repeat(20 - Math.round(percent / 5));
    console.log(`  ${category.padEnd(10)} ${bar} ${matchCount} (${percent}%)`);
});

// ============ STEP 8: Test Ambiguous Query Handling ============
console.log("\n\nSTEP 8: TESTING AMBIGUOUS QUERY HANDLING");
console.log("-".repeat(40));

const ambiguousProfile = UserParser.parse("I am a woman");
console.log(`\nQuery: "I am a woman"`);
console.log(`Detail Level: ${ambiguousProfile.detailLevel}`);
console.log(`Extracted: [${ambiguousProfile.extractedFields.join(', ')}]`);

const quickResults = EligibilityEngine.quickFilter(SCHEMES_DATA, ambiguousProfile, 5);
console.log(`\nQuick Filter Results (${quickResults.length} schemes):`);

quickResults.forEach((result, i) => {
    console.log(`${i + 1}. ${result.scheme.name.substring(0, 50)}...`);
    console.log(`   Match: ${result.percentage}% | Reasons: ${result.reasons.join(', ')}`);
});

console.log("\n========================================");
console.log("  ✅ DEBUGGING COMPLETE  ");
console.log("========================================");
