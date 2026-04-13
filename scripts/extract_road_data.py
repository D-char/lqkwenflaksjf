"""
OpenStreetMap 道路数据提取脚本
提取各城市道路网络长度，生成 road-data.json 格式的数据

依赖安装:
pip install osmnx geopandas

使用方法:
python extract_road_data.py
"""

import json
import os
from datetime import datetime

try:
    import osmnx as ox
    ox.settings(use_cache=True, cache_folder="./osm_cache")
except ImportError:
    print("请先安装 osmnx: pip install osmnx")
    exit(1)


CITIES = [
    {"name": "青岛市", "query": "Qingdao, China", "bounds": {"min_lat": 35.5, "max_lat": 37.5, "min_lon": 119.5, "max_lon": 121.5}},
    {"name": "北京市", "query": "Beijing, China", "bounds": {"min_lat": 39.4, "max_lat": 41.0, "min_lon": 115.4, "max_lon": 117.5}},
    {"name": "上海市", "query": "Shanghai, China", "bounds": {"min_lat": 30.6, "max_lat": 31.9, "min_lon": 120.9, "max_lon": 122.2}},
    {"name": "深圳市", "query": "Shenzhen, China", "bounds": {"min_lat": 22.4, "max_lat": 22.9, "min_lon": 113.7, "max_lon": 114.6}},
    {"name": "广州市", "query": "Guangzhou, China", "bounds": {"min_lat": 22.5, "max_lat": 23.5, "min_lon": 112.9, "max_lon": 114.0}},
    {"name": "杭州市", "query": "Hangzhou, China", "bounds": {"min_lat": 29.8, "max_lat": 30.9, "min_lon": 119.6, "max_lon": 121.0}},
]

ROAD_TYPE_MAPPING = {
    "motorway": "primary",
    "motorway_link": "primary",
    "trunk": "primary",
    "trunk_link": "primary",
    "primary": "primary",
    "primary_link": "primary",
    "secondary": "secondary",
    "secondary_link": "secondary",
    "tertiary": "tertiary",
    "tertiary_link": "tertiary",
    "residential": "tertiary",
    "living_street": "tertiary",
    "unclassified": "tertiary",
    "cycleway": "cycleway",
    "path": "cycleway",
    "footway": "cycleway",
    "pedestrian": "cycleway",
}


def classify_road_type(highway_type):
    return ROAD_TYPE_MAPPING.get(highway_type, "tertiary")


def extract_city_roads(city_info):
    print(f"\n{'='*50}")
    print(f"正在提取: {city_info['name']}")
    print(f"查询: {city_info['query']}")
    print(f"{'='*50}")
    
    try:
        print("  下载道路网络数据...")
        G = ox.graph_from_place(
            city_info['query'],
            network_type='all',
            retain_all=True,
            simplify=False
        )
        
        print(f"  获取到 {len(G.edges)} 条道路边")
        
        road_lengths = {"primary": 0, "secondary": 0, "tertiary": 0, "cycleway": 0}
        total_length = 0
        
        for u, v, data in G.edges(data=True):
            highway = data.get('highway', 'unclassified')
            if isinstance(highway, list):
                highway = highway[0]
            
            length = data.get('length', 0)
            total_length += length
            
            road_type = classify_road_type(highway)
            road_lengths[road_type] += length
        
        total_km = total_length / 1000
        
        print(f"  ✓ 道路总长度: {total_km:.1f} km")
        print(f"    - 主干道(primary): {road_lengths['primary']/1000:.1f} km")
        print(f"    - 次干道(secondary): {road_lengths['secondary']/1000:.1f} km")
        print(f"    - 一般道路(tertiary): {road_lengths['tertiary']/1000:.1f} km")
        print(f"    - 非机动车道(cycleway): {road_lengths['cycleway']/1000:.1f} km")
        
        return {
            "total_km": round(total_km, 1),
            "road_lengths": {
                "primary": round(road_lengths['primary'] / 1000, 1),
                "secondary": round(road_lengths['secondary'] / 1000, 1),
                "tertiary": round(road_lengths['tertiary'] / 1000, 1),
                "cycleway": round(road_lengths['cycleway'] / 1000, 1),
            },
            "edges_count": len(G.edges),
            "status": "success"
        }
        
    except Exception as e:
        print(f"  ✗ 提取失败: {str(e)}")
        return {"status": "error", "error": str(e)}


def generate_road_data_json(results):
    regions = {}
    
    for city_info, result in results:
        city_name = city_info['name']
        
        if result['status'] == 'success':
            regions[city_name] = {
                "region_id": city_name.lower().replace("市", "")[:2] + "_001",
                "province": get_province(city_name),
                "city": city_name,
                "total_road_km": result['total_km'],
                "data_source": "OpenStreetMap",
                "data_date": datetime.now().strftime("%Y-%m-%d"),
                "road_types": result['road_lengths'],
                "bounds": city_info['bounds'],
                "update_time": datetime.now().strftime("%Y-%m-%d")
            }
        else:
            print(f"跳过 {city_name} (提取失败)")
    
    road_data = {
        "regions": regions,
        "default_region": "青岛市",
        "metadata": {
            "source": "OpenStreetMap",
            "extract_date": datetime.now().strftime("%Y-%m-%d"),
            "tool": "osmnx",
            "note": "道路长度基于OSM道路网络计算，实际道路长度可能因OSM数据完整性而有所不同"
        }
    }
    
    return road_data


def get_province(city_name):
    province_mapping = {
        "青岛市": "山东省",
        "北京市": "北京市",
        "上海市": "上海市",
        "深圳市": "广东省",
        "广州市": "广东省",
        "杭州市": "浙江省",
    }
    return province_mapping.get(city_name, "未知")


def main():
    print("\n" + "="*60)
    print("OpenStreetMap 道路数据提取工具")
    print("="*60)
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"目标城市: {len(CITIES)} 个")
    
    results = []
    
    for city_info in CITIES:
        result = extract_city_roads(city_info)
        results.append((city_info, result))
    
    print("\n" + "="*60)
    print("生成 road-data.json...")
    print("="*60)
    
    road_data = generate_road_data_json(results)
    
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'road-data.json')
    output_path = os.path.abspath(output_path)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(road_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ 数据已保存到: {output_path}")
    
    success_count = sum(1 for _, r in results if r['status'] == 'success')
    print(f"\n完成! 成功: {success_count}/{len(CITIES)} 个城市")
    print(f"结束时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()