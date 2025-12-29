/**
 * Eligibility Scoring Engine
 * Calculates eligibility scores for government schemes based on user profile
 * Uses weighted scoring: Critical (50), Important (30), Relevant (20)
 */

const EligibilityEngine = {
    // Fixed total score base for accurate percentages
    TOTAL_POSSIBLE_SCORE: 200, // Maximum possible points

    // Parameter weights for scoring
    weights: {
        critical: 50,    // Must match - occupation, gender
        important: 30,   // Should match - age, income, caste
        relevant: 20     // Nice to have - state, land, special conditions
    },

    // Keywords for matching
    keywords: {
        occupation: {
            farmer: ['farmer', 'kisan', 'agriculture', 'farming', 'cultivat', 'crop', 'irrigation', 'krishi', 'kheti', 'pm-kisan', 'pradhan mantri kisan'],
            student: ['student', 'scholar', 'education', 'school', 'college', 'university', 'study', 'academic', 'scholarship'],
            unemployed: ['unemployed', 'jobless', 'employment', 'berozgar', 'rozgar', 'skill training', 'vocational'],
            worker: ['worker', 'labour', 'laborer', 'construction', 'building', 'mazdoor', 'shramik', 'daily wage'],
            artisan: ['artisan', 'handicraft', 'craft', 'weaver', 'handloom', 'potter', 'blacksmith', 'traditional'],
            fisherman: ['fisherman', 'fisher', 'fishing', 'fish', 'marine', 'boat', 'matsya', 'coastal'],
            entrepreneur: ['entrepreneur', 'msme', 'business', 'startup', 'enterprise', 'industry', 'self-employ', 'mudra'],
            healthcare: ['health', 'medical', 'hospital', 'medicine', 'treatment', 'disease', 'ayushman']
        },
        gender: {
            female: ['woman', 'women', 'female', 'girl', 'lady', 'mahila', 'widow', 'mother', 'pregnant', 'maternity', 'beti'],
            male: ['man', 'men', 'male', 'boy']
        },
        caste: {
            sc: ['scheduled caste', ' sc ', 'sc/', '/sc', 'dalit', 'sc category'],
            st: ['scheduled tribe', ' st ', 'st/', '/st', 'tribal', 'adivasi', 'tribe', 'st category'],
            obc: [' obc ', 'obc/', '/obc', 'backward class', 'other backward', 'obc category'],
            minority: ['minority', 'minorities', 'muslim', 'christian', 'sikh', 'buddhist', 'jain']
        },
        income: {
            bpl: ['bpl', 'below poverty', 'poor', 'economically weak', 'ews', 'low income', 'destitute', 'antyodaya'],
            low: ['small', 'marginal', 'weaker section']
        },
        special: {
            senior: ['senior citizen', 'old age', 'pension', 'elderly', '60 years', 'aged', 'vridha'],
            disabled: ['disabled', 'disability', 'handicapped', 'divyang', 'differently abled', 'pwd'],
            widow: ['widow', 'widowed', 'vidhwa', 'destitute women']
        },
        education: {
            primary: ['primary', 'class 1', 'class 2', 'class 3', 'class 4', 'class 5', '1st', '2nd', '3rd', '4th', '5th'],
            middle: ['middle school', 'class 6', 'class 7', 'class 8', '6th', '7th', '8th'],
            secondary: ['10th', 'class 10', 'sslc', 'secondary', 'high school', 'matric', 'class 9', '9th'],
            higher_secondary: ['12th', 'class 12', 'puc', 'higher secondary', 'intermediate', 'class 11', '11th'],
            undergraduate: ['undergraduate', 'degree', 'bachelor', 'ba', 'bsc', 'bcom', 'btech', 'graduation', 'graduate'],
            postgraduate: ['postgraduate', 'masters', 'ma', 'msc', 'mcom', 'mtech', 'mba', 'post graduation'],
            diploma: ['diploma', 'iti', 'polytechnic', 'vocational'],
            phd: ['phd', 'doctorate', 'research', 'doctoral']
        }
    },

    /**
     * Calculate eligibility score for a scheme based on user profile
     */
    calculateScore(scheme, profile) {
        let score = 0;
        let matchedCriteria = [];
        let reasons = [];
        let penaltyApplied = false;

        const schemeText = `${scheme.name} ${scheme.eligibility} ${scheme.category} ${scheme.tags} ${scheme.details || ''}`.toLowerCase();
        const eligibilityText = (scheme.eligibility || '').toLowerCase();

        // 1. Occupation Matching (Critical - up to 50 points)
        if (profile.occupation) {
            const occupationKeywords = this.keywords.occupation[profile.occupation] || [];
            const matchedKeywords = occupationKeywords.filter(kw => schemeText.includes(kw));

            if (matchedKeywords.length > 0) {
                // Score based on relevance: more keywords = more relevant
                const occupationScore = Math.min(this.weights.critical, 20 + (matchedKeywords.length * 10));
                score += occupationScore;
                matchedCriteria.push('occupation');
                reasons.push(`Related to ${profile.occupation} (${matchedKeywords.length} matching terms)`);
            }
        }

        // 2. Gender Matching (Critical - 50 points for gender-specific schemes)
        if (profile.gender) {
            const genderKeywords = this.keywords.gender[profile.gender] || [];
            const oppositeGenderKeywords = this.keywords.gender[profile.gender === 'female' ? 'male' : 'female'] || [];

            const isForThisGender = genderKeywords.some(kw => schemeText.includes(kw));
            const isForOppositeGender = oppositeGenderKeywords.some(kw =>
                schemeText.includes(kw) && !['employment', 'man'].some(ignore => kw.includes(ignore))
            );

            if (isForThisGender && !isForOppositeGender) {
                score += this.weights.critical;
                matchedCriteria.push('gender');
                reasons.push(`Specifically for ${profile.gender === 'female' ? 'women' : 'men'}`);
            } else if (isForOppositeGender && !isForThisGender) {
                // Penalty for opposite gender specific schemes
                score -= 30;
                penaltyApplied = true;
            }
        }

        // 3. Age Matching (Important - 30 points)
        if (profile.age && scheme.eligibility) {
            const agePatterns = [
                { regex: /(\d{1,2})\s*(?:to|-)\s*(\d{1,2})\s*years?/i, type: 'range' },
                { regex: /between\s*(\d{1,2})\s*(?:and|-)\s*(\d{1,2})/i, type: 'range' },
                { regex: /above\s*(\d{1,2})\s*years?/i, type: 'above' },
                { regex: /below\s*(\d{1,2})\s*years?/i, type: 'below' },
                { regex: /(\d{1,2})\s*years?\s*(?:of\s*age|old|or\s*above)/i, type: 'above' },
                { regex: /minimum\s*(?:age\s*)?(\d{1,2})/i, type: 'above' },
                { regex: /maximum\s*(?:age\s*)?(\d{1,2})/i, type: 'below' }
            ];

            let ageMatched = false;
            for (const pattern of agePatterns) {
                const match = eligibilityText.match(pattern.regex);
                if (match) {
                    if (pattern.type === 'range') {
                        const min = parseInt(match[1]);
                        const max = parseInt(match[2]);
                        if (profile.age >= min && profile.age <= max) {
                            score += this.weights.important;
                            matchedCriteria.push('age');
                            reasons.push(`Age ${profile.age} is within ${min}-${max} years requirement`);
                            ageMatched = true;
                        } else {
                            score -= 20; // Penalty for not meeting age requirement
                            penaltyApplied = true;
                        }
                    } else if (pattern.type === 'above') {
                        const minAge = parseInt(match[1]);
                        if (profile.age >= minAge) {
                            score += this.weights.important;
                            matchedCriteria.push('age');
                            reasons.push(`Age ${profile.age} meets minimum ${minAge} years`);
                            ageMatched = true;
                        } else {
                            score -= 20;
                            penaltyApplied = true;
                        }
                    } else if (pattern.type === 'below') {
                        const maxAge = parseInt(match[1]);
                        if (profile.age < maxAge) {
                            score += this.weights.important;
                            matchedCriteria.push('age');
                            reasons.push(`Age ${profile.age} is under ${maxAge} years limit`);
                            ageMatched = true;
                        } else {
                            score -= 20;
                            penaltyApplied = true;
                        }
                    }
                    break;
                }
            }
        }

        // 4. Caste/Category Matching (Important - 30 points)
        if (profile.caste) {
            const casteKeywords = this.keywords.caste[profile.caste] || [];
            const hasCasteRequirement = casteKeywords.some(kw => eligibilityText.includes(kw) || schemeText.includes(kw));

            if (hasCasteRequirement) {
                score += this.weights.important;
                matchedCriteria.push('caste');
                reasons.push(`For ${profile.caste.toUpperCase()} category`);
            }

            // Check if scheme is for a different category
            const otherCastes = ['sc', 'st', 'obc', 'minority'].filter(c => c !== profile.caste);
            for (const otherCaste of otherCastes) {
                const otherKeywords = this.keywords.caste[otherCaste] || [];
                if (otherKeywords.some(kw => eligibilityText.includes(`only ${kw}`) || eligibilityText.includes(`exclusively for ${kw}`))) {
                    score -= 25;
                    penaltyApplied = true;
                    break;
                }
            }
        }

        // 5. Income/BPL Matching (Important - 30 points)
        if (profile.isBPL || profile.incomeLevel === 'bpl' || profile.incomeLevel === 'low') {
            const hasBPLRequirement = this.keywords.income.bpl.some(kw => schemeText.includes(kw));
            const hasLowIncomeReq = this.keywords.income.low.some(kw => schemeText.includes(kw));

            if (hasBPLRequirement || hasLowIncomeReq) {
                score += this.weights.important;
                matchedCriteria.push('income');
                reasons.push('For economically weaker sections');
            }
        }

        // 6. State Matching (Relevant - 20 points)
        if (profile.state) {
            const stateText = profile.state.toLowerCase();
            const isCentral = scheme.level && scheme.level.toLowerCase() === 'central';
            const isStateScheme = scheme.level && scheme.level.toLowerCase() === 'state';

            if (isCentral) {
                score += this.weights.relevant;
                matchedCriteria.push('state');
                reasons.push('Central scheme (available nationwide)');
            } else if (schemeText.includes(stateText)) {
                score += this.weights.relevant;
                matchedCriteria.push('state');
                reasons.push(`Available in ${profile.state}`);
            } else if (isStateScheme && !schemeText.includes(stateText)) {
                // State scheme but not for user's state
                score -= 15;
                penaltyApplied = true;
            }
        }

        // 7. Special Conditions (Relevant - 20 points each)
        if (profile.isSeniorCitizen) {
            const hasSenior = this.keywords.special.senior.some(kw => schemeText.includes(kw));
            if (hasSenior) {
                score += this.weights.relevant;
                matchedCriteria.push('senior');
                reasons.push('For senior citizens');
            }
        }

        if (profile.isDisabled) {
            const hasDisability = this.keywords.special.disabled.some(kw => schemeText.includes(kw));
            if (hasDisability) {
                score += this.weights.relevant;
                matchedCriteria.push('disability');
                reasons.push('For persons with disabilities');
            }
        }

        if (profile.isWidow) {
            const hasWidow = this.keywords.special.widow.some(kw => schemeText.includes(kw));
            if (hasWidow) {
                score += this.weights.relevant;
                matchedCriteria.push('widow');
                reasons.push('For widows');
            }
        }

        // 8. Land Size for Farmers (Relevant - 20 points)
        if (profile.occupation === 'farmer' && profile.landSize !== null) {
            const hasLandCriteria = schemeText.includes('small farmer') || schemeText.includes('marginal farmer') ||
                schemeText.includes('hectare') || schemeText.includes('acre') || schemeText.includes('land holding');

            if (hasLandCriteria) {
                if (profile.landSize <= 2) {
                    score += this.weights.relevant;
                    matchedCriteria.push('land');
                    reasons.push(`Marginal farmer with ${profile.landSize} acres`);
                } else if (profile.landSize <= 5) {
                    score += Math.floor(this.weights.relevant * 0.7);
                    matchedCriteria.push('land');
                    reasons.push(`Small farmer with ${profile.landSize} acres`);
                }
            }
        }

        // 9. Education Level Matching (Important - 30 points for education schemes)
        if (profile.educationLevel) {
            const eduKeywords = this.keywords.education[profile.educationLevel] || [];
            const hasEduMatch = eduKeywords.some(kw => schemeText.includes(kw));

            // Also check for general scholarship/education keywords
            const isEducationScheme = schemeText.includes('scholarship') || schemeText.includes('education') ||
                schemeText.includes('student') || schemeText.includes('school') || schemeText.includes('college');

            if (hasEduMatch || (isEducationScheme && profile.occupation === 'student')) {
                score += this.weights.important;
                matchedCriteria.push('education');
                const eduLabels = {
                    primary: 'Primary school',
                    middle: 'Middle school',
                    secondary: '10th class',
                    higher_secondary: '12th class',
                    undergraduate: 'Degree/Graduation',
                    postgraduate: 'Post-graduation',
                    diploma: 'Diploma/ITI',
                    phd: 'PhD'
                };
                reasons.push(`For ${eduLabels[profile.educationLevel] || profile.educationLevel} students`);
            }
        }

        // Calculate percentage with proper scaling
        // Ensure score doesn't go below 0
        score = Math.max(0, score);

        // Calculate percentage based on matched criteria vs possible criteria
        let percentage;
        if (matchedCriteria.length === 0) {
            percentage = 0;
        } else {
            // Base percentage on actual score relative to total possible
            percentage = Math.round((score / this.TOTAL_POSSIBLE_SCORE) * 100);

            // Apply bonus for multiple criteria matches
            if (matchedCriteria.length >= 4) {
                percentage = Math.min(95, percentage + 15);
            } else if (matchedCriteria.length >= 3) {
                percentage = Math.min(90, percentage + 10);
            } else if (matchedCriteria.length >= 2) {
                percentage = Math.min(85, percentage + 5);
            }

            // Cap single-criteria matches
            if (matchedCriteria.length === 1) {
                percentage = Math.min(60, percentage);
            }
        }

        // Ensure percentage is within bounds
        percentage = Math.max(0, Math.min(100, percentage));

        return {
            scheme: scheme,
            score: score,
            maxScore: this.TOTAL_POSSIBLE_SCORE,
            percentage: percentage,
            matchedCriteria: matchedCriteria,
            reasons: reasons,
            matchCount: matchedCriteria.length,
            penaltyApplied: penaltyApplied
        };
    },

    /**
     * Find and rank eligible schemes for a user profile
     */
    findEligibleSchemes(schemes, profile, limit = 6) {
        const results = [];

        for (const scheme of schemes) {
            const result = this.calculateScore(scheme, profile);

            // Only include schemes with positive score and at least one match
            if (result.matchCount > 0 && result.score > 0) {
                results.push(result);
            }
        }

        // Sort by percentage (descending), then by match count, then by score
        results.sort((a, b) => {
            if (b.percentage !== a.percentage) {
                return b.percentage - a.percentage;
            }
            if (b.matchCount !== a.matchCount) {
                return b.matchCount - a.matchCount;
            }
            return b.score - a.score;
        });

        return results.slice(0, limit);
    },

    /**
     * Quick filter for ambiguous queries (e.g., "I am a woman")
     * Returns schemes without scoring, just relevance check
     */
    quickFilter(schemes, profile, limit = 10) {
        const results = [];

        for (const scheme of schemes) {
            const schemeText = `${scheme.name} ${scheme.eligibility} ${scheme.category} ${scheme.tags}`.toLowerCase();
            let relevanceScore = 0;
            let reasons = [];

            // Check for occupation match
            if (profile.occupation) {
                const occupationKeywords = this.keywords.occupation[profile.occupation] || [];
                const matches = occupationKeywords.filter(kw => schemeText.includes(kw));
                if (matches.length > 0) {
                    relevanceScore += 30 + matches.length * 5;
                    reasons.push(`Related to ${profile.occupation}`);
                }
            }

            // Check for gender match
            if (profile.gender) {
                const genderKeywords = this.keywords.gender[profile.gender] || [];
                if (genderKeywords.some(kw => schemeText.includes(kw))) {
                    relevanceScore += 25;
                    reasons.push(`For ${profile.gender === 'female' ? 'women' : 'men'}`);
                }
            }

            // Check for caste match
            if (profile.caste) {
                const casteKeywords = this.keywords.caste[profile.caste] || [];
                if (casteKeywords.some(kw => schemeText.includes(kw))) {
                    relevanceScore += 20;
                    reasons.push(`For ${profile.caste.toUpperCase()} category`);
                }
            }

            // Check for special conditions
            if (profile.isBPL && this.keywords.income.bpl.some(kw => schemeText.includes(kw))) {
                relevanceScore += 20;
                reasons.push('For BPL families');
            }
            if (profile.isSeniorCitizen && this.keywords.special.senior.some(kw => schemeText.includes(kw))) {
                relevanceScore += 15;
                reasons.push('For senior citizens');
            }
            if (profile.isDisabled && this.keywords.special.disabled.some(kw => schemeText.includes(kw))) {
                relevanceScore += 15;
                reasons.push('For persons with disabilities');
            }

            if (relevanceScore > 0) {
                results.push({
                    scheme: scheme,
                    percentage: Math.min(75, relevanceScore), // Cap at 75% for ambiguous queries
                    reasons: reasons,
                    score: relevanceScore
                });
            }
        }

        // Sort by relevance score
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EligibilityEngine;
}
