import sys, json
sys.stdout.reconfigure(encoding='utf-8')

with open('D:/onelapMap/data/road-data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def check(lat, lon, cities):
    for city in cities:
        b = data['regions'][city]['bounds']
        hit = b['min_lat'] <= lat <= b['max_lat'] and b['min_lon'] <= lon <= b['max_lon']
        tag = "MATCH" if hit else "no"
        print(f"  {city}: {tag}")

print("=== Qingdao point (36.07, 120.38) ===")
check(36.07, 120.38, ['石家庄','济南','青岛','日照','南京','潍坊','烟台'])

print("\n=== Jinan point (36.67, 116.99) ===")
check(36.67, 116.99, ['石家庄','济南','青岛','日照','南京'])

print("\n=== Rizhao point (35.42, 119.53) ===")
check(35.42, 119.53, ['石家庄','济南','青岛','日照','南京','临沂','连云港'])

print("\n=== Full detectRegion simulation ===")
test_cases = [
    ("Qingdao ride", 36.07, 120.38),
    ("Jinan ride", 36.67, 116.99),
    ("Rizhao ride", 35.42, 119.53),
]
for label, lat, lon in test_cases:
    found = None
    for city_name, city_data in data['regions'].items():
        b = city_data['bounds']
        if b['min_lat'] <= lat <= b['max_lat'] and b['min_lon'] <= lon <= b['max_lon']:
            found = city_name
            break
    print(f"  {label} -> detected as: {found}")
