/**
 * User Input Parser
 * Extracts user profile from natural language input
 */

const UserParser = {
    // Patterns for extracting user information
    patterns: {
        age: [
            /(\d{1,3})\s*(?:year|yr|yrs|years?)?\s*old/i,
            /age\s*(?:is|:)?\s*(\d{1,3})/i,
            /i\s*am\s*(\d{1,3})/i,
            /(\d{1,3})\s*(?:year|yr)s?\s*(?:of\s*age)?/i
        ],
        gender: {
            female: /(woman|women|female|girl|lady|mahila|widow|mother|ಮಹಿಳೆ|ಹೆಣ್ಣು|ಹುಡುಗಿ|stree|aurat|ladki|ಮಗಳು)/i,
            male: /(man|men|male|boy|guy|ಗಂಡ|ಹುಡುಗ|aadmi|ladka|ಮಗ)/i
        },
        occupation: {
            farmer: /(farmer|kisan|agriculture|farming|cultivat|krishi|ಕೃಷಿಕ|ರೈತ|krishik|raita)/i,
            student: /(student|studying|college|university|school|education|ವಿದ್ಯಾರ್ಥಿ|vidyarthi|padhai|chhatra)/i,
            unemployed: /(unemployed|jobless|no job|without job|berozgar|ನಿರುದ್ಯೋಗಿ|nirudyogi)/i,
            worker: /(worker|labour|laborer|mazdoor|construction|daily wage|ಕಾರ್ಮಿಕ|karmik|shramik)/i,
            artisan: /(artisan|craftsman|handicraft|weaver|potter|blacksmith|ಕುಶಲಕರ್ಮಿ|karigar)/i,
            fisherman: /(fisherman|fisher|fishing|matsya|ಮೀನುಗಾರ|meengar|machhiwara)/i,
            entrepreneur: /(entrepreneur|business|startup|self.?employ|msme|ಉದ್ಯಮಿ|vyapari|udyami)/i,
            teacher: /(teacher|professor|lecturer|shikshak|ಶಿಕ್ಷಕ|adhyapak)/i,
            healthcare: /(doctor|nurse|medical|healthcare|hospital|ವೈದ್ಯ|vaidya|chikitsak)/i
        },
        income: [
            /(?:income|earn|salary|kamata|kamai)\s*(?:is|of|:)?\s*(?:rs\.?|₹|inr)?\s*([\d,\.]+)\s*(?:lakh|lac|lacs|lakhs?)?/i,
            /(?:rs\.?|₹|inr)\s*([\d,\.]+)\s*(?:lakh|lac|lacs|lakhs?)?\s*(?:per\s*(?:year|annum|month)|annual|yearly|monthly)?/i,
            /([\d,\.]+)\s*(?:lakh|lac|lacs|lakhs?)\s*(?:per\s*(?:year|annum)|annual|yearly)?/i,
            /bpl|below\s*poverty\s*line/i,
            /poor|low\s*income|economically\s*weak/i
        ],
        caste: {
            sc: /(sc|scheduled\s*caste|dalit|ಪರಿಶಿಷ್ಟ\s*ಜಾತಿ)/i,
            st: /(st|scheduled\s*tribe|tribal|adivasi|ಪರಿಶಿಷ್ಟ\s*ಪಂಗಡ|ಬುಡಕಟ್ಟು)/i,
            obc: /(obc|other\s*backward\s*class|backward\s*class|ಹಿಂದುಳಿದ\s*ವರ್ಗ)/i,
            general: /(general|unreserved|open\s*category|ಸಾಮಾನ್ಯ)/i,
            minority: /(minority|muslim|christian|sikh|buddhist|jain|parsi|ಅಲ್ಪಸಂಖ್ಯಾತ)/i
        },
        state: {
            'andhra pradesh': /\b(andhra|ap|andhra\s*pradesh)\b/i,
            'arunachal pradesh': /\b(arunachal)\b/i,
            'assam': /\b(assam)\b/i,
            'bihar': /\b(bihar)\b/i,
            'chhattisgarh': /\b(chhattisgarh|chattisgarh)\b/i,
            'goa': /\b(goa)\b/i,
            'gujarat': /\b(gujarat)\b/i,
            'haryana': /\b(haryana)\b/i,
            'himachal pradesh': /\b(himachal)\b/i,
            'jharkhand': /\b(jharkhand)\b/i,
            'karnataka': /\b(karnataka|bangalore|bengaluru)\b/i,
            'kerala': /\b(kerala)\b/i,
            'madhya pradesh': /\b(madhya\s*pradesh|mp)\b/i,
            'maharashtra': /\b(maharashtra|mumbai|pune)\b/i,
            'manipur': /\b(manipur)\b/i,
            'meghalaya': /\b(meghalaya)\b/i,
            'mizoram': /\b(mizoram)\b/i,
            'nagaland': /\b(nagaland)\b/i,
            'odisha': /\b(odisha|orissa)\b/i,
            'punjab': /\b(punjab)\b/i,
            'rajasthan': /\b(rajasthan|jaipur)\b/i,
            'sikkim': /\b(sikkim)\b/i,
            'tamil nadu': /\b(tamil\s*nadu|tn|chennai)\b/i,
            'telangana': /\b(telangana|hyderabad)\b/i,
            'tripura': /\b(tripura)\b/i,
            'uttar pradesh': /\b(uttar\s*pradesh|up|lucknow)\b/i,
            'uttarakhand': /\b(uttarakhand|uttaranchal)\b/i,
            'west bengal': /\b(west\s*bengal|wb|kolkata)\b/i,
            'delhi': /\b(delhi|ncr)\b/i,
            'puducherry': /\b(puducherry|pondicherry)\b/i,
            'jammu and kashmir': /\b(jammu|kashmir|j&k)\b/i
        },
        land: [
            /([\d,\.]+)\s*(?:acre|acres|acr)\b/i,
            /([\d,\.]+)\s*(?:hectare|hectares|ha)\b/i,
            /\bland\s*(?:of)?\s*([\d,\.]+)/i,
            /small\s*(?:farmer|land|holding)/i,
            /marginal\s*(?:farmer|land)/i,
            /landless/i
        ],
        disability: /(disabled|disability|handicapped|divyang|blind|deaf|physically\s*challenged|ವಿಕಲಚೇತನ|viklang)/i,
        widow: /(widow|widowed|vidhwa|ವಿಧವೆ)/i,
        senior: /(senior\s*citizen|old\s*age|elderly|pension|60\+|above\s*60|ಹಿರಿಯ\s*ನಾಗರಿಕ|vridh)/i,
        bpl: /(bpl|below\s*poverty|poor|economically\s*weak|ews|low\s*income|ಬಡವ|garib)/i,
        // Education level patterns
        education: {
            primary: /(1st|2nd|3rd|4th|5th|class\s*[1-5]|primary|ಪ್ರಾಥಮಿಕ|prathamik)/i,
            middle: /(6th|7th|8th|class\s*[6-8]|middle\s*school|ಮಧ್ಯಮ)/i,
            secondary: /(9th|10th|class\s*[6-9]|class\s*10|sslc|10th\s*(?:std|standard|class)|secondary|high\s*school|ಪ್ರೌಢಶಾಲೆ|matric)/i,
            higher_secondary: /(11th|12th|class\s*11|class\s*12|puc|12th\s*(?:std|standard|class)|higher\s*secondary|inter|ಪಿಯುಸಿ|intermediate)/i,
            undergraduate: /(ug|undergraduate|bachelor|ba|bsc|bcom|btech|be|degree|graduation|ಪದವಿ|graduate)/i,
            postgraduate: /(pg|postgraduate|master|ma|msc|mcom|mtech|mba|ಸ್ನಾತಕೋತ್ತರ|post\s*graduation)/i,
            diploma: /(diploma|iti|polytechnic|ಡಿಪ್ಲೊಮಾ)/i,
            phd: /(phd|doctorate|research|ಪಿಎಚ್\s*ಡಿ)/i
        }
    },

    /**
     * Parse user input and extract profile
     */
    parse(input) {
        const profile = {
            rawInput: input,
            age: null,
            gender: null,
            occupation: null,
            income: null,
            incomeLevel: null,
            caste: null,
            state: null,
            landSize: null,
            educationLevel: null,  // NEW: Education level
            isDisabled: false,
            isWidow: false,
            isSeniorCitizen: false,
            isBPL: false,
            detailLevel: 'ambiguous', // 'ambiguous' | 'partial' | 'detailed'
            extractedFields: []
        };

        const inputLower = input.toLowerCase();

        // Extract age
        for (const pattern of this.patterns.age) {
            const match = input.match(pattern);
            if (match && match[1]) {
                profile.age = parseInt(match[1]);
                profile.extractedFields.push('age');
                break;
            }
        }

        // Extract gender
        if (this.patterns.gender.female.test(inputLower)) {
            profile.gender = 'female';
            profile.extractedFields.push('gender');
        } else if (this.patterns.gender.male.test(inputLower)) {
            profile.gender = 'male';
            profile.extractedFields.push('gender');
        }

        // Extract occupation
        for (const [occ, pattern] of Object.entries(this.patterns.occupation)) {
            if (pattern.test(inputLower)) {
                profile.occupation = occ;
                profile.extractedFields.push('occupation');
                break;
            }
        }

        // Extract income
        for (const pattern of this.patterns.income) {
            const match = input.match(pattern);
            if (match) {
                if (/bpl|poor|low\s*income|economically\s*weak/i.test(match[0])) {
                    profile.incomeLevel = 'bpl';
                    profile.isBPL = true;
                    profile.extractedFields.push('income');
                } else if (match[1]) {
                    let amount = parseFloat(match[1].replace(/,/g, ''));
                    if (/lakh|lac/i.test(match[0])) {
                        amount *= 100000;
                    }
                    profile.income = amount;
                    profile.extractedFields.push('income');

                    // Categorize income level
                    if (amount <= 200000) profile.incomeLevel = 'bpl';
                    else if (amount <= 500000) profile.incomeLevel = 'low';
                    else if (amount <= 1000000) profile.incomeLevel = 'middle';
                    else profile.incomeLevel = 'high';
                }
                break;
            }
        }

        // Extract caste
        for (const [caste, pattern] of Object.entries(this.patterns.caste)) {
            if (pattern.test(inputLower)) {
                profile.caste = caste;
                profile.extractedFields.push('caste');
                break;
            }
        }

        // Extract state
        for (const [state, pattern] of Object.entries(this.patterns.state)) {
            if (pattern.test(inputLower)) {
                profile.state = state;
                profile.extractedFields.push('state');
                break;
            }
        }

        // Extract land size
        for (const pattern of this.patterns.land) {
            const match = input.match(pattern);
            if (match) {
                if (/landless/i.test(match[0])) {
                    profile.landSize = 0;
                } else if (/small|marginal/i.test(match[0])) {
                    profile.landSize = 1; // Assume 1 acre for small/marginal
                } else if (match[1]) {
                    profile.landSize = parseFloat(match[1].replace(/,/g, ''));
                    if (/hectare/i.test(match[0])) {
                        profile.landSize *= 2.47; // Convert hectares to acres
                    }
                }
                profile.extractedFields.push('land');
                break;
            }
        }

        // Extract special conditions
        if (this.patterns.disability.test(inputLower)) {
            profile.isDisabled = true;
            profile.extractedFields.push('disability');
        }
        if (this.patterns.widow.test(inputLower)) {
            profile.isWidow = true;
            profile.extractedFields.push('widow');
        }
        if (this.patterns.senior.test(inputLower) || (profile.age && profile.age >= 60)) {
            profile.isSeniorCitizen = true;
            profile.extractedFields.push('senior');
        }
        if (this.patterns.bpl.test(inputLower)) {
            profile.isBPL = true;
            profile.incomeLevel = 'bpl';
            profile.extractedFields.push('bpl');
        }

        // Extract education level (NEW)
        for (const [level, pattern] of Object.entries(this.patterns.education)) {
            if (pattern.test(inputLower)) {
                profile.educationLevel = level;
                profile.extractedFields.push('education');
                break;
            }
        }

        // Determine detail level
        const fieldCount = profile.extractedFields.length;
        if (fieldCount >= 4) {
            profile.detailLevel = 'detailed';
        } else if (fieldCount >= 2) {
            profile.detailLevel = 'partial';
        } else {
            profile.detailLevel = 'ambiguous';
        }

        return profile;
    },

    /**
     * Get profile summary for display
     */
    getProfileSummary(profile) {
        const parts = [];

        if (profile.age) parts.push(`${profile.age} years old`);
        if (profile.gender) parts.push(profile.gender);
        if (profile.occupation) parts.push(profile.occupation);
        if (profile.educationLevel) {
            const eduLabels = {
                primary: 'Primary school',
                middle: 'Middle school',
                secondary: '10th class/SSLC',
                higher_secondary: '12th class/PUC',
                undergraduate: 'Undergraduate/Degree',
                postgraduate: 'Postgraduate/Masters',
                diploma: 'Diploma/ITI',
                phd: 'PhD/Doctorate'
            };
            parts.push(eduLabels[profile.educationLevel] || profile.educationLevel);
        }
        if (profile.caste) parts.push(profile.caste.toUpperCase());
        if (profile.state) parts.push(`from ${profile.state}`);
        if (profile.income) parts.push(`income ₹${(profile.income / 100000).toFixed(1)} lakh`);
        if (profile.landSize) parts.push(`${profile.landSize} acres land`);
        if (profile.isBPL) parts.push('BPL');
        if (profile.isDisabled) parts.push('Person with disability');
        if (profile.isWidow) parts.push('Widow');
        if (profile.isSeniorCitizen && !parts.includes('senior')) parts.push('Senior citizen');

        return parts.length > 0 ? parts.join(', ') : 'No specific details provided';
    }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserParser;
}
