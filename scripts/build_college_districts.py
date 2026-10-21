"""Add a "district" to every college in data/cutoffs/MCC/2026/college-index.json.

The MCC files carry no district. ASMI's "city" (taken from the institute name) is, for most colleges, already
the district headquarters, so district = city unless it is listed below (a town inside another district, an old
spelling, or a city that is not a district name). A few colleges are fixed by MCC code.
This mapping was compiled by hand from public geography; ASMI should review it before relying on it.

Usage: python3 scripts/build_college_districts.py
"""
import json

PATH = 'nextjs-sandbox/public/data/cutoffs/MCC/2026/college-index.json'

BY_CITY = {
    'Alibaug': 'Raigad', 'Ambajogai': 'Beed', 'Ambernath': 'Thane', 'Ambedkarnagar': 'Ambedkar Nagar', 'Andheri': 'Mumbai',
    'Annamalai': 'Cuddalore', 'Annamalainagar': 'Cuddalore', 'Arambagh': 'Hooghly', 'Asaripallam': 'Kanyakumari',
    'Asifabad': 'Kumuram Bheem Asifabad', 'Aurangabad': 'Chhatrapati Sambhajinagar', 'Badaun': 'Budaun', 'Bagalkote': 'Bagalkot',
    'Ambikapur': 'Surguja', 'Baramati': 'Pune', 'Baripada': 'Mayurbhanj', 'Barmar': 'Barmer', 'Barasat': 'North 24 Parganas',
    'Bellary': 'Ballari', 'Bengaluru': 'Bengaluru Urban', 'Bettiah': 'West Champaran', 'Bhadradri': 'Bhadradri Kothagudem',
    'Bhawanipatna': 'Kalahandi', 'Bhubaneswar': 'Khordha', 'Bhupalpally': 'Jayashankar Bhupalpally', 'Bihta': 'Patna',
    'Bijapur': 'Vijayapura', 'Burdwan': 'Purba Bardhaman', 'Burla': 'Sambalpur', 'Chapra': 'Saran', 'Coochbehar': 'Cooch Behar',
    'Delhi': 'Delhi', 'New Delhi': 'Delhi', 'Diphu': 'Karbi Anglong', 'Falkawn': 'Aizawl', 'Gangtok': 'East Sikkim',
    'Goa': 'North Goa', 'Panaji': 'North Goa', 'Greater Noida': 'Gautam Buddha Nagar', 'Noida': 'Gautam Buddha Nagar',
    'Guwahati': 'Kamrup Metropolitan', 'Gulbarga': 'Kalaburagi', 'Haldwani': 'Nainital', 'Handwara': 'Kupwara',
    'Harindanga': 'South 24 Parganas', 'Hosur': 'Krishnagiri', 'Hubballi': 'Dharwad', 'Jagdalpur': 'Bastar', 'Janjgir': 'Janjgir-Champa',
    'Jamshedpur': 'East Singhbhum', 'Jashpur-Kunkuri': 'Jashpur', 'Joka': 'South 24 Parganas', 'Jogulamba': 'Jogulamba Gadwal',
    'KGF': 'Kolar', 'Kabeerdham': 'Kabirdham', 'Kadapa': 'YSR Kadapa', 'Kalyani': 'Nadia', 'Kanpur': 'Kanpur Nagar',
    'Karad': 'Satara', 'Karan Nagar Srinagar': 'Srinagar', 'Karwar': 'Uttara Kannada', 'Kochi': 'Ernakulam', 'Konni': 'Pathanamthitta',
    'Laheriasarai': 'Darbhanga', 'Loni': 'Ahilyanagar', 'Machilipatnam': 'Krishna', 'Maduranthagam': 'Chengalpattu',
    'Mahabubangar': 'Mahabubnagar', 'Maheshwaram': 'Ranga Reddy', 'Manendragarh': 'Manendragarh-Chirmiri-Bharatpur',
    'Mangalagiri': 'Guntur', 'Mangaluru': 'Dakshina Kannada', 'Manipal': 'Udupi', 'Manjeri': 'Malappuram', 'Midnapur': 'Paschim Medinipur',
    'Miraj': 'Sangli', 'Mohali': 'Sahibzada Ajit Singh Nagar', 'Mullana': 'Ambala', 'Mursidabad': 'Murshidabad', 'Nahan': 'Sirmaur',
    'Nalhar': 'Nuh', 'Narsampet': 'Warangal', 'Navi Mumbai': 'Thane', 'Nellore': 'SPSR Nellore', 'Nerul': 'Thane',
    'Omandurar': 'Chennai', 'Ongole': 'Prakasam', 'Osmanabad': 'Dharashiv', 'Panchmahal Godhra': 'Panchmahal', 'Panvel': 'Raigad',
    'Perundurai': 'Erode', 'Phulbani': 'Kandhamal', 'Piduguralla': 'Palnadu', 'Port Blair': 'South Andaman', 'Purnea': 'Purnia',
    'Quthbullapur': 'Medchal-Malkajgiri', 'Rai Bareli': 'Raebareli', 'Raiganj': 'Uttar Dinajpur', 'Rajamahendravaram': 'East Godavari',
    'Rajpipla': 'Narmada', 'Ramagundam': 'Peddapalli', 'Rampurhat': 'Birbhum', 'Rishikesh': 'Dehradun', 'Samayapuram': 'Tiruchirappalli',
    'Secunderabad': 'Hyderabad', 'Sevagram': 'Wardha', 'Shillong': 'East Khasi Hills', 'Shimoga': 'Shivamogga', 'Silchar': 'Cachar',
    'Silvassa': 'Dadra And Nagar Haveli', 'Siddharthnagar': 'Siddharth Nagar', 'Sonepat': 'Sonipat', 'Sushrutnagar': 'Darjeeling',
    'Talcher': 'Angul', 'Tamluk': 'Purba Medinipur', 'Tanda': 'Ambedkar Nagar', 'Tezpur': 'Sonitpur', 'Thirunnamalai': 'Tiruvannamalai',
    'Tiruchirapalli': 'Tiruchirappalli', 'Trivandrum': 'Thiruvananthapuram', 'Tumkur': 'Tumakuru', 'Uluberia': 'Howrah',
    'Vijayawada': 'NTR', 'Yadadri': 'Yadadri Bhuvanagiri', 'Yadgiri': 'Yadgir', 'Ananthapuram': 'Anantapur', 'Naharlagun': 'Papum Pare',
    'Agartala': 'West Tripura', 'Deogarh': 'Deoghar', 'Badrinath': 'Pauri Garhwal', 'Thalarasingi': 'Alluri Sitharama Raju',
    'Sehud': 'Auraiya', 'Koriawas': 'Rewari', 'Kodangal': 'Vikarabad', 'Rangalikhata': 'Kokrajhar', 'T Begur': 'Bengaluru Rural',
    'Kancheepuram': 'Kanchipuram',
}
BY_CODE = {   # colleges whose city is blank or whose district the city cannot tell
    '200231': 'Imphal West', '200233': 'Imphal West', '200232': 'Imphal East', '200436': 'Imphal East',
    '904769': 'Bongaigaon', '904770': 'Chengalpattu',
}

idx = json.load(open(PATH))
for code, v in idx.items():
    v['district'] = BY_CODE.get(code) or BY_CITY.get(v['city']) or v['city']
    if not v['district']: raise SystemExit(f'no district for {code}')
with open(PATH, 'w', encoding='utf-8') as f:
    json.dump(idx, f, ensure_ascii=False, separators=(',', ':'))
print(len({v['district'] for v in idx.values()}), 'districts for', len(idx), 'colleges')
