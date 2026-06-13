import csv
import json
import os
import re

csv_path = "colleges_template.csv"
json_path = "nextjs-sandbox/public/data/colleges.json"

def clean_val(val):
    if val is None:
        return None
    val = val.strip()
    if val == "" or val.lower() == "null" or val.lower() == "none":
        return None
    return val

def to_int(val):
    cleaned = clean_val(val)
    if cleaned is None:
        return None
    try:
        # Remove commas or currency symbols (e.g. ₹ or rs)
        sanitized = re.sub(r"[^\d\-]", "", cleaned)
        return int(sanitized)
    except ValueError:
        return cleaned

def to_float(val):
    cleaned = clean_val(val)
    if cleaned is None:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return cleaned

def to_bool(val):
    cleaned = clean_val(val)
    if cleaned is None:
        return False
    return cleaned.lower() in ("true", "yes", "y", "1", "t")

def generate_slug(name):
    if not name:
        return ""
    # Lowercase, replace non-alphanumeric characters with spaces, then collapse spaces to a single hyphen
    s = name.lower()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = "-".join(s.split())
    return s

def convert_csv_to_json():
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found in current directory.")
        return

    colleges = []
    
    # Read with utf-8-sig to handle Excel BOM automatically
    with open(csv_path, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = clean_val(row.get("name"))
            if not name:
                continue
                
            slug = clean_val(row.get("slug"))
            if not slug:
                slug = generate_slug(name)
                
            college = {
                "name": name,
                "slug": slug,
                "type": clean_val(row.get("type")),
                "state": clean_val(row.get("state")),
                "city": clean_val(row.get("city")),
                "seats": to_int(row.get("seats")),
                "annual_fees": to_int(row.get("annual_fees")),
                "closing_rank_open": to_int(row.get("closing_rank_open")),
                "nirf_rank": to_int(row.get("nirf_rank")),
                "asmi_recommended": to_bool(row.get("asmi_recommended")),
                "course": clean_val(row.get("course")) or "MBBS",
                "established_year": to_int(row.get("established_year")),
                "hospital_beds": to_int(row.get("hospital_beds")),
                "photo": clean_val(row.get("photo")),
                "photo_placeholder_color": clean_val(row.get("photo_placeholder_color")) or "#1a0040",
                "contact_phone": clean_val(row.get("contact_phone")),
                "contact_email": clean_val(row.get("contact_email")),
                "website": clean_val(row.get("website")),
                "address": clean_val(row.get("address")),
                "affiliated_university": clean_val(row.get("affiliated_university")),
                "opd_daily": to_int(row.get("opd_daily")),
                "bond_years": to_int(row.get("bond_years")),
                "bond_penalty": to_int(row.get("bond_penalty")),
                "hostel_available": clean_val(row.get("hostel_available")),
                "asmi_pulse_score": to_float(row.get("asmi_pulse_score")),
                "asmi_verdict": clean_val(row.get("asmi_verdict")),
                "description": clean_val(row.get("description"))
            }
            colleges.append(college)

    # Make target directory if missing
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(colleges, f, indent=2, ensure_ascii=False)
        
    print(f"Success! Converted {len(colleges)} colleges to {json_path}")

if __name__ == "__main__":
    convert_csv_to_json()
