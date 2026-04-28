import sys, json
sys.stdout.reconfigure(encoding='utf-8')

with open('D:/onelapMap/data/road-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def first_match(lat, lon):
    best = None
    smallest_area = float('inf')
    for city, v in data['regions'].items():
        b = v['bounds']
        if b['min_lat'] <= lat <= b['max_lat'] and b['min_lon'] <= lon <= b['max_lon']:
            area = (b['max_lat'] - b['min_lat']) * (b['max_lon'] - b['min_lon'])
            if area < smallest_area:
                smallest_area = area
                best = city
    return best or "none"

pts = [
    ("Rizhao city center", 35.42, 119.53),
    ("Rizhao south", 35.10, 119.30),
    ("Rizhao east coast", 35.38, 119.55),
    ("Qingdao center", 36.07, 120.38),
    ("Qingdao Huangdao", 35.96, 120.19),
    ("Jinan center", 36.67, 116.99),
    ("Jinan south", 36.15, 117.10),
]

for name, lat, lon in pts:
    print(f"  {name} ({lat}, {lon}) -> {first_match(lat, lon)}")
