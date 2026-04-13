"""
快速提取单个城市道路数据
用法: python quick_extract.py "青岛市"
"""

import sys
import osmnx as ox

ox.settings(use_cache=True)

def extract(city_name):
    G = ox.graph_from_place(city_name, network_type='all')
    total = sum(data.get('length', 0) for _, _, data in G.edges(data=True))
    print(f"{city_name}: {total/1000:.1f} km")

if __name__ == "__main__":
    city = sys.argv[1] if len(sys.argv) > 1 else "青岛市, China"
    extract(city)