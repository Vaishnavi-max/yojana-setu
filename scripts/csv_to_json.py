"""
CSV to JSON Converter for Government Schemes Dataset
Converts the updated_data.csv to all_schemes.js for the chatbot
"""

import csv
import json
import os

def clean_text(text):
    """Clean and normalize text content"""
    if not text:
        return ""
    # Remove extra whitespace and normalize
    text = ' '.join(text.split())
    # Remove quotes at start/end
    text = text.strip('"').strip()
    return text

def parse_csv_to_json(csv_path, output_path):
    """Convert CSV file to JSON format"""
    schemes = []
    
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as file:
        reader = csv.DictReader(file)
        
        for i, row in enumerate(reader):
            try:
                scheme = {
                    'id': i + 1,
                    'name': clean_text(row.get('scheme_name', '')),
                    'slug': clean_text(row.get('slug', '')),
                    'details': clean_text(row.get('details', '')),
                    'benefits': clean_text(row.get('benefits', '')),
                    'eligibility': clean_text(row.get('eligibility', '')),
                    'application': clean_text(row.get('application', '')),
                    'documents': clean_text(row.get('documents', '')),
                    'level': clean_text(row.get('level', '')),
                    'category': clean_text(row.get('schemeCategory', '')),
                    'tags': clean_text(row.get('tags', ''))
                }
                
                # Only add if has valid name
                if scheme['name']:
                    schemes.append(scheme)
                    
            except Exception as e:
                print(f"Error processing row {i}: {e}")
                continue
    
    # Write as JavaScript file for browser use
    js_content = f"// Government Schemes Data - {len(schemes)} schemes\n"
    js_content += f"// Generated from updated_data.csv\n\n"
    js_content += f"const SCHEMES_DATA = {json.dumps(schemes, indent=2, ensure_ascii=False)};\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Successfully converted {len(schemes)} schemes to {output_path}")
    return schemes

def extract_priority_schemes(schemes, output_path):
    """Extract priority schemes across key categories"""
    
    # Define priority categories and keywords
    priority_categories = {
        'agriculture': ['farmer', 'kisan', 'agriculture', 'crop', 'farm', 'land', 'irrigation'],
        'women': ['woman', 'women', 'mahila', 'female', 'girl', 'widow', 'mother'],
        'healthcare': ['health', 'medical', 'hospital', 'treatment', 'medicine', 'disease'],
        'education': ['education', 'student', 'scholarship', 'school', 'college', 'training'],
        'employment': ['employment', 'job', 'work', 'unemployed', 'skill', 'training'],
        'financial': ['loan', 'subsidy', 'financial', 'assistance', 'poor', 'bpl'],
        'senior_citizen': ['pension', 'old age', 'senior', 'elderly', 'widow'],
        'sc_st': ['sc', 'st', 'scheduled caste', 'scheduled tribe', 'tribal', 'backward'],
        'disability': ['disability', 'disabled', 'handicapped', 'divyang'],
        'housing': ['house', 'housing', 'awas', 'home', 'shelter']
    }
    
    priority_schemes = []
    seen_names = set()
    
    for category, keywords in priority_categories.items():
        count = 0
        for scheme in schemes:
            if count >= 10:  # Max 10 per category
                break
                
            # Check if scheme matches category
            text_to_search = f"{scheme['name']} {scheme['category']} {scheme['tags']} {scheme['eligibility']}".lower()
            
            if any(kw in text_to_search for kw in keywords):
                if scheme['name'] not in seen_names and scheme['eligibility']:
                    priority_schemes.append({
                        **scheme,
                        'priority_category': category
                    })
                    seen_names.add(scheme['name'])
                    count += 1
    
    # Write priority schemes
    js_content = f"// Priority Schemes - {len(priority_schemes)} schemes\n"
    js_content += f"// Curated for key categories\n\n"
    js_content += f"const PRIORITY_SCHEMES = {json.dumps(priority_schemes, indent=2, ensure_ascii=False)};\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"Extracted {len(priority_schemes)} priority schemes to {output_path}")
    return priority_schemes

if __name__ == "__main__":
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    
    csv_path = os.path.join(os.path.dirname(project_dir), 'updated_data.csv')
    output_path = os.path.join(project_dir, 'data', 'all_schemes.js')
    priority_output = os.path.join(project_dir, 'data', 'priority_schemes.js')
    
    # Create data directory
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Convert
    schemes = parse_csv_to_json(csv_path, output_path)
    extract_priority_schemes(schemes, priority_output)
    
    print("\nConversion complete!")
