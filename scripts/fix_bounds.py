import json

# 中国地级市精确行政边界 bounding box 数据
# 数据来源: 基于各城市行政区划地理范围整理
# 格式: "城市名": {"min_lat": 最南, "max_lat": 最北, "min_lon": 最西, "max_lon": 最东}
city_bounds = {
    # ===== 北京、天津 =====
    "北京": {"min_lat": 39.44, "max_lat": 41.06, "min_lon": 115.42, "max_lon": 117.51},
    "天津": {"min_lat": 38.56, "max_lat": 40.25, "min_lon": 116.70, "max_lon": 118.07},

    # ===== 河北省 =====
    "石家庄": {"min_lat": 37.49, "max_lat": 38.88, "min_lon": 113.48, "max_lon": 115.23},
    "唐山": {"min_lat": 39.03, "max_lat": 40.23, "min_lon": 117.63, "max_lon": 119.25},
    "秦皇岛": {"min_lat": 39.48, "max_lat": 40.62, "min_lon": 118.62, "max_lon": 119.88},
    "邯郸": {"min_lat": 36.04, "max_lat": 37.01, "min_lon": 113.45, "max_lon": 115.52},
    "邢台": {"min_lat": 36.75, "max_lat": 37.81, "min_lon": 113.52, "max_lon": 115.68},
    "保定": {"min_lat": 38.10, "max_lat": 39.95, "min_lon": 113.40, "max_lon": 116.20},
    "张家口": {"min_lat": 39.55, "max_lat": 41.95, "min_lon": 113.80, "max_lon": 116.30},
    "承德": {"min_lat": 40.12, "max_lat": 42.62, "min_lon": 115.78, "max_lon": 119.15},
    "沧州": {"min_lat": 37.50, "max_lat": 38.95, "min_lon": 115.70, "max_lon": 117.85},
    "廊坊": {"min_lat": 38.70, "max_lat": 39.80, "min_lon": 116.05, "max_lon": 117.45},
    "衡水": {"min_lat": 37.03, "max_lat": 38.25, "min_lon": 115.10, "max_lon": 116.35},

    # ===== 山西省 =====
    "太原": {"min_lat": 37.27, "max_lat": 38.25, "min_lon": 111.50, "max_lon": 113.09},
    "大同": {"min_lat": 39.03, "max_lat": 40.44, "min_lon": 112.06, "max_lon": 114.33},
    "阳泉": {"min_lat": 37.57, "max_lat": 38.19, "min_lon": 113.08, "max_lon": 114.07},
    "长治": {"min_lat": 35.49, "max_lat": 37.08, "min_lon": 111.58, "max_lon": 113.44},
    "晋城": {"min_lat": 35.12, "max_lat": 36.05, "min_lon": 111.93, "max_lon": 113.15},
    "朔州": {"min_lat": 39.05, "max_lat": 40.22, "min_lon": 111.53, "max_lon": 113.32},
    "晋中": {"min_lat": 36.65, "max_lat": 38.06, "min_lon": 111.23, "max_lon": 114.05},
    "运城": {"min_lat": 34.53, "max_lat": 35.85, "min_lon": 110.15, "max_lon": 112.04},
    "忻州": {"min_lat": 38.15, "max_lat": 39.40, "min_lon": 111.00, "max_lon": 113.58},
    "临汾": {"min_lat": 35.23, "max_lat": 36.93, "min_lon": 110.22, "max_lon": 112.28},
    "吕梁": {"min_lat": 36.50, "max_lat": 38.84, "min_lon": 110.22, "max_lon": 112.19},

    # ===== 内蒙古自治区 =====
    "呼和浩特": {"min_lat": 39.58, "max_lat": 41.40, "min_lon": 110.46, "max_lon": 112.89},
    "包头": {"min_lat": 40.20, "max_lat": 42.73, "min_lon": 109.15, "max_lon": 111.27},
    "乌海": {"min_lat": 39.15, "max_lat": 39.75, "min_lon": 106.36, "max_lon": 107.08},
    "赤峰": {"min_lat": 41.17, "max_lat": 44.48, "min_lon": 116.21, "max_lon": 120.58},
    "通辽": {"min_lat": 42.15, "max_lat": 45.59, "min_lon": 119.14, "max_lon": 123.43},
    "鄂尔多斯": {"min_lat": 37.35, "max_lat": 40.51, "min_lon": 106.42, "max_lon": 111.27},
    "呼伦贝尔": {"min_lat": 47.05, "max_lat": 53.33, "min_lon": 115.31, "max_lon": 126.04},
    "巴彦淖尔": {"min_lat": 39.52, "max_lat": 42.28, "min_lon": 105.12, "max_lon": 109.53},
    "乌兰察布": {"min_lat": 40.20, "max_lat": 43.28, "min_lon": 110.26, "max_lon": 114.49},

    # ===== 辽宁省 =====
    "沈阳": {"min_lat": 41.12, "max_lat": 43.02, "min_lon": 122.25, "max_lon": 123.79},
    "大连": {"min_lat": 38.43, "max_lat": 40.12, "min_lon": 120.58, "max_lon": 123.31},
    "鞍山": {"min_lat": 40.27, "max_lat": 41.34, "min_lon": 122.10, "max_lon": 123.64},
    "抚顺": {"min_lat": 41.14, "max_lat": 42.46, "min_lon": 123.39, "max_lon": 125.28},
    "本溪": {"min_lat": 40.83, "max_lat": 41.60, "min_lon": 123.34, "max_lon": 125.46},
    "丹东": {"min_lat": 39.68, "max_lat": 41.10, "min_lon": 123.22, "max_lon": 125.42},
    "锦州": {"min_lat": 40.48, "max_lat": 42.02, "min_lon": 120.43, "max_lon": 122.19},
    "营口": {"min_lat": 39.89, "max_lat": 40.96, "min_lon": 121.73, "max_lon": 122.80},
    "阜新": {"min_lat": 41.38, "max_lat": 42.51, "min_lon": 121.01, "max_lon": 122.56},
    "辽阳": {"min_lat": 40.72, "max_lat": 41.53, "min_lon": 122.64, "max_lon": 123.62},
    "盘锦": {"min_lat": 40.69, "max_lat": 41.33, "min_lon": 121.25, "max_lon": 122.44},
    "铁岭": {"min_lat": 41.59, "max_lat": 43.41, "min_lon": 123.14, "max_lon": 125.37},
    "朝阳": {"min_lat": 40.55, "max_lat": 42.38, "min_lon": 118.50, "max_lon": 121.17},
    "葫芦岛": {"min_lat": 39.98, "max_lat": 41.12, "min_lon": 119.13, "max_lon": 121.02},

    # ===== 吉林省 =====
    "长春": {"min_lat": 43.05, "max_lat": 45.25, "min_lon": 124.18, "max_lon": 127.02},
    "吉林": {"min_lat": 42.31, "max_lat": 44.51, "min_lon": 125.40, "max_lon": 127.56},
    "四平": {"min_lat": 42.49, "max_lat": 44.09, "min_lon": 123.54, "max_lon": 125.29},
    "辽源": {"min_lat": 42.25, "max_lat": 43.22, "min_lon": 124.77, "max_lon": 125.74},
    "通化": {"min_lat": 40.85, "max_lat": 42.54, "min_lon": 125.10, "max_lon": 126.82},
    "白山": {"min_lat": 41.21, "max_lat": 42.50, "min_lon": 126.07, "max_lon": 128.18},
    "松原": {"min_lat": 43.59, "max_lat": 45.82, "min_lon": 123.56, "max_lon": 126.11},
    "白城": {"min_lat": 44.13, "max_lat": 46.18, "min_lon": 121.38, "max_lon": 124.22},

    # ===== 黑龙江省 =====
    "哈尔滨": {"min_lat": 44.04, "max_lat": 46.40, "min_lon": 125.42, "max_lon": 130.10},
    "齐齐哈尔": {"min_lat": 45.43, "max_lat": 48.73, "min_lon": 122.40, "max_lon": 126.68},
    "鸡西": {"min_lat": 44.51, "max_lat": 46.36, "min_lon": 130.24, "max_lon": 133.56},
    "鹤岗": {"min_lat": 46.66, "max_lat": 48.39, "min_lon": 129.40, "max_lon": 132.31},
    "双鸭山": {"min_lat": 45.73, "max_lat": 47.69, "min_lon": 130.24, "max_lon": 133.33},
    "大庆": {"min_lat": 45.46, "max_lat": 47.47, "min_lon": 123.79, "max_lon": 126.11},
    "伊春": {"min_lat": 46.28, "max_lat": 49.25, "min_lon": 127.42, "max_lon": 130.67},
    "佳木斯": {"min_lat": 45.56, "max_lat": 48.27, "min_lon": 129.30, "max_lon": 135.07},
    "七台河": {"min_lat": 45.18, "max_lat": 46.28, "min_lon": 130.20, "max_lon": 131.67},
    "牡丹江": {"min_lat": 43.27, "max_lat": 45.75, "min_lon": 128.02, "max_lon": 131.52},
    "黑河": {"min_lat": 47.42, "max_lat": 51.03, "min_lon": 124.45, "max_lon": 129.18},

    # ===== 上海 =====
    "上海": {"min_lat": 30.68, "max_lat": 31.88, "min_lon": 120.85, "max_lon": 122.20},

    # ===== 江苏省 =====
    "南京": {"min_lat": 31.14, "max_lat": 32.62, "min_lon": 118.22, "max_lon": 119.24},
    "无锡": {"min_lat": 31.07, "max_lat": 31.86, "min_lon": 119.33, "max_lon": 120.77},
    "徐州": {"min_lat": 33.72, "max_lat": 34.81, "min_lon": 116.22, "max_lon": 118.28},
    "常州": {"min_lat": 31.09, "max_lat": 32.04, "min_lon": 119.08, "max_lon": 120.12},
    "苏州": {"min_lat": 30.76, "max_lat": 31.87, "min_lon": 119.89, "max_lon": 121.44},
    "南通": {"min_lat": 31.41, "max_lat": 32.69, "min_lon": 120.12, "max_lon": 121.88},
    "连云港": {"min_lat": 33.97, "max_lat": 35.07, "min_lon": 118.24, "max_lon": 119.73},
    "淮安": {"min_lat": 32.43, "max_lat": 34.06, "min_lon": 118.12, "max_lon": 119.54},
    "盐城": {"min_lat": 32.85, "max_lat": 34.28, "min_lon": 119.27, "max_lon": 120.95},
    "扬州": {"min_lat": 32.15, "max_lat": 33.25, "min_lon": 119.01, "max_lon": 119.98},
    "镇江": {"min_lat": 31.56, "max_lat": 32.29, "min_lon": 118.73, "max_lon": 119.75},
    "泰州": {"min_lat": 32.05, "max_lat": 33.00, "min_lon": 119.38, "max_lon": 120.56},
    "宿迁": {"min_lat": 33.25, "max_lat": 34.25, "min_lon": 117.56, "max_lon": 119.10},

    # ===== 浙江省 =====
    "杭州": {"min_lat": 29.18, "max_lat": 30.56, "min_lon": 118.34, "max_lon": 120.72},
    "宁波": {"min_lat": 28.85, "max_lat": 30.33, "min_lon": 120.55, "max_lon": 122.16},
    "温州": {"min_lat": 27.03, "max_lat": 28.55, "min_lon": 119.37, "max_lon": 121.55},
    "嘉兴": {"min_lat": 30.21, "max_lat": 31.03, "min_lon": 120.18, "max_lon": 121.41},
    "湖州": {"min_lat": 30.22, "max_lat": 31.17, "min_lon": 119.14, "max_lon": 120.57},
    "绍兴": {"min_lat": 29.22, "max_lat": 30.19, "min_lon": 119.78, "max_lon": 121.13},
    "金华": {"min_lat": 28.32, "max_lat": 29.72, "min_lon": 119.14, "max_lon": 120.72},
    "衢州": {"min_lat": 28.14, "max_lat": 29.35, "min_lon": 118.01, "max_lon": 119.25},
    "舟山": {"min_lat": 29.32, "max_lat": 30.86, "min_lon": 121.56, "max_lon": 123.25},
    "台州": {"min_lat": 27.85, "max_lat": 29.20, "min_lon": 120.17, "max_lon": 121.86},
    "丽水": {"min_lat": 27.25, "max_lat": 28.83, "min_lon": 118.41, "max_lon": 120.26},

    # ===== 安徽省 =====
    "合肥": {"min_lat": 30.94, "max_lat": 32.63, "min_lon": 116.41, "max_lon": 117.98},
    "芜湖": {"min_lat": 30.38, "max_lat": 31.53, "min_lon": 117.41, "max_lon": 118.89},
    "蚌埠": {"min_lat": 32.42, "max_lat": 33.54, "min_lon": 116.67, "max_lon": 117.78},
    "淮南": {"min_lat": 31.94, "max_lat": 33.00, "min_lon": 116.21, "max_lon": 117.38},
    "马鞍山": {"min_lat": 31.13, "max_lat": 31.87, "min_lon": 117.92, "max_lon": 118.89},
    "淮北": {"min_lat": 33.16, "max_lat": 34.14, "min_lon": 116.23, "max_lon": 117.14},
    "铜陵": {"min_lat": 30.45, "max_lat": 31.09, "min_lon": 117.35, "max_lon": 118.09},
    "安庆": {"min_lat": 29.73, "max_lat": 31.17, "min_lon": 115.46, "max_lon": 117.44},
    "黄山": {"min_lat": 29.24, "max_lat": 30.52, "min_lon": 117.12, "max_lon": 118.89},
    "滁州": {"min_lat": 31.66, "max_lat": 33.22, "min_lon": 117.19, "max_lon": 119.13},
    "阜阳": {"min_lat": 32.25, "max_lat": 33.47, "min_lon": 114.82, "max_lon": 116.49},
    "宿州": {"min_lat": 33.18, "max_lat": 34.38, "min_lon": 116.09, "max_lon": 118.10},
    "六安": {"min_lat": 30.98, "max_lat": 32.35, "min_lon": 115.30, "max_lon": 117.27},
    "亳州": {"min_lat": 32.87, "max_lat": 34.05, "min_lon": 115.53, "max_lon": 116.49},
    "池州": {"min_lat": 29.33, "max_lat": 30.85, "min_lon": 116.38, "max_lon": 118.07},
    "宣城": {"min_lat": 29.57, "max_lat": 31.19, "min_lon": 117.59, "max_lon": 119.40},

    # ===== 福建省 =====
    "福州": {"min_lat": 25.15, "max_lat": 26.83, "min_lon": 118.08, "max_lon": 120.31},
    "厦门": {"min_lat": 24.23, "max_lat": 24.90, "min_lon": 117.75, "max_lon": 118.52},
    "莆田": {"min_lat": 24.96, "max_lat": 25.72, "min_lon": 118.27, "max_lon": 119.46},
    "三明": {"min_lat": 25.30, "max_lat": 27.07, "min_lon": 116.22, "max_lon": 118.39},
    "泉州": {"min_lat": 24.23, "max_lat": 25.72, "min_lon": 117.35, "max_lon": 119.05},
    "漳州": {"min_lat": 23.34, "max_lat": 25.12, "min_lon": 116.53, "max_lon": 118.10},
    "南平": {"min_lat": 26.14, "max_lat": 28.19, "min_lon": 116.78, "max_lon": 119.17},
    "龙岩": {"min_lat": 24.23, "max_lat": 26.02, "min_lon": 115.51, "max_lon": 117.44},
    "宁德": {"min_lat": 26.18, "max_lat": 27.77, "min_lon": 118.43, "max_lon": 120.44},

    # ===== 江西省 =====
    "南昌": {"min_lat": 28.10, "max_lat": 29.11, "min_lon": 115.27, "max_lon": 116.67},
    "景德镇": {"min_lat": 28.44, "max_lat": 29.56, "min_lon": 116.57, "max_lon": 117.63},
    "萍乡": {"min_lat": 27.05, "max_lat": 28.06, "min_lon": 113.35, "max_lon": 114.17},
    "九江": {"min_lat": 28.47, "max_lat": 30.06, "min_lon": 114.69, "max_lon": 116.67},
    "新余": {"min_lat": 27.33, "max_lat": 28.08, "min_lon": 114.31, "max_lon": 115.28},
    "鹰潭": {"min_lat": 27.76, "max_lat": 28.68, "min_lon": 116.41, "max_lon": 117.30},
    "赣州": {"min_lat": 24.29, "max_lat": 27.09, "min_lon": 113.54, "max_lon": 116.63},
    "吉安": {"min_lat": 26.02, "max_lat": 27.85, "min_lon": 113.46, "max_lon": 115.56},
    "宜春": {"min_lat": 27.33, "max_lat": 29.06, "min_lon": 113.54, "max_lon": 116.01},
    "抚州": {"min_lat": 26.29, "max_lat": 28.35, "min_lon": 115.35, "max_lon": 117.18},
    "上饶": {"min_lat": 27.48, "max_lat": 29.62, "min_lon": 116.13, "max_lon": 118.86},

    # ===== 山东省 =====
    "济南": {"min_lat": 36.02, "max_lat": 37.54, "min_lon": 116.21, "max_lon": 117.93},
    "青岛": {"min_lat": 35.35, "max_lat": 36.87, "min_lon": 119.30, "max_lon": 121.04},
    "淄博": {"min_lat": 35.88, "max_lat": 37.18, "min_lon": 117.32, "max_lon": 118.53},
    "枣庄": {"min_lat": 34.27, "max_lat": 35.19, "min_lon": 116.48, "max_lon": 117.85},
    "东营": {"min_lat": 36.55, "max_lat": 38.10, "min_lon": 118.07, "max_lon": 119.52},
    "烟台": {"min_lat": 36.16, "max_lat": 38.00, "min_lon": 119.34, "max_lon": 121.97},
    "潍坊": {"min_lat": 35.42, "max_lat": 37.26, "min_lon": 118.10, "max_lon": 120.01},
    "济宁": {"min_lat": 34.26, "max_lat": 36.02, "min_lon": 115.52, "max_lon": 117.36},
    "泰安": {"min_lat": 35.38, "max_lat": 36.62, "min_lon": 116.02, "max_lon": 117.59},
    "威海": {"min_lat": 36.41, "max_lat": 37.53, "min_lon": 121.11, "max_lon": 122.73},
    "日照": {"min_lat": 34.94, "max_lat": 36.02, "min_lon": 118.35, "max_lon": 119.86},
    "临沂": {"min_lat": 34.22, "max_lat": 36.22, "min_lon": 117.24, "max_lon": 119.11},
    "德州": {"min_lat": 36.24, "max_lat": 37.95, "min_lon": 115.45, "max_lon": 117.24},
    "聊城": {"min_lat": 35.47, "max_lat": 37.02, "min_lon": 115.16, "max_lon": 116.75},
    "滨州": {"min_lat": 36.41, "max_lat": 38.16, "min_lon": 117.15, "max_lon": 118.64},
    "菏泽": {"min_lat": 34.39, "max_lat": 35.85, "min_lon": 114.48, "max_lon": 116.24},

    # ===== 河南省 =====
    "郑州": {"min_lat": 34.16, "max_lat": 34.97, "min_lon": 112.42, "max_lon": 114.14},
    "开封": {"min_lat": 34.17, "max_lat": 35.01, "min_lon": 113.52, "max_lon": 115.15},
    "洛阳": {"min_lat": 33.39, "max_lat": 35.05, "min_lon": 110.97, "max_lon": 112.97},
    "平顶山": {"min_lat": 33.08, "max_lat": 34.23, "min_lon": 112.15, "max_lon": 113.65},
    "安阳": {"min_lat": 35.12, "max_lat": 36.44, "min_lon": 113.37, "max_lon": 114.88},
    "鹤壁": {"min_lat": 35.32, "max_lat": 36.00, "min_lon": 113.92, "max_lon": 114.74},
    "新乡": {"min_lat": 34.88, "max_lat": 35.88, "min_lon": 113.23, "max_lon": 114.78},
    "焦作": {"min_lat": 34.74, "max_lat": 35.66, "min_lon": 112.43, "max_lon": 113.65},
    "濮阳": {"min_lat": 35.20, "max_lat": 36.12, "min_lon": 114.52, "max_lon": 116.01},
    "许昌": {"min_lat": 33.42, "max_lat": 34.39, "min_lon": 113.03, "max_lon": 114.43},
    "漯河": {"min_lat": 33.20, "max_lat": 33.89, "min_lon": 113.45, "max_lon": 114.41},
    "三门峡": {"min_lat": 33.53, "max_lat": 35.06, "min_lon": 110.21, "max_lon": 112.01},
    "南阳": {"min_lat": 32.17, "max_lat": 33.72, "min_lon": 110.58, "max_lon": 113.49},
    "商丘": {"min_lat": 33.44, "max_lat": 34.80, "min_lon": 114.49, "max_lon": 116.40},
    "信阳": {"min_lat": 31.23, "max_lat": 32.94, "min_lon": 113.45, "max_lon": 115.95},
    "周口": {"min_lat": 33.03, "max_lat": 34.20, "min_lon": 114.08, "max_lon": 115.65},
    "驻马店": {"min_lat": 32.18, "max_lat": 33.55, "min_lon": 113.10, "max_lon": 115.12},

    # ===== 湖北省 =====
    "武汉": {"min_lat": 29.97, "max_lat": 31.36, "min_lon": 113.70, "max_lon": 115.05},
    "黄石": {"min_lat": 29.30, "max_lat": 30.38, "min_lon": 114.53, "max_lon": 115.63},
    "十堰": {"min_lat": 31.30, "max_lat": 33.16, "min_lon": 109.29, "max_lon": 111.25},
    "宜昌": {"min_lat": 29.56, "max_lat": 31.34, "min_lon": 110.15, "max_lon": 112.04},
    "襄阳": {"min_lat": 31.14, "max_lat": 32.76, "min_lon": 110.46, "max_lon": 113.04},
    "鄂州": {"min_lat": 30.00, "max_lat": 30.56, "min_lon": 114.52, "max_lon": 115.09},
    "荆门": {"min_lat": 30.32, "max_lat": 31.47, "min_lon": 111.51, "max_lon": 113.20},
    "孝感": {"min_lat": 30.15, "max_lat": 31.64, "min_lon": 113.19, "max_lon": 114.53},
    "荆州": {"min_lat": 29.26, "max_lat": 31.07, "min_lon": 111.15, "max_lon": 113.37},
    "黄冈": {"min_lat": 29.45, "max_lat": 31.35, "min_lon": 114.25, "max_lon": 116.11},
    "咸宁": {"min_lat": 28.97, "max_lat": 30.19, "min_lon": 113.54, "max_lon": 114.88},
    "随州": {"min_lat": 31.19, "max_lat": 32.37, "min_lon": 112.43, "max_lon": 113.88},

    # ===== 湖南省 =====
    "长沙": {"min_lat": 27.85, "max_lat": 28.67, "min_lon": 111.88, "max_lon": 114.15},
    "株洲": {"min_lat": 26.03, "max_lat": 28.01, "min_lon": 112.57, "max_lon": 114.07},
    "湘潭": {"min_lat": 27.21, "max_lat": 28.14, "min_lon": 111.58, "max_lon": 113.05},
    "衡阳": {"min_lat": 26.07, "max_lat": 27.31, "min_lon": 111.63, "max_lon": 113.17},
    "邵阳": {"min_lat": 25.58, "max_lat": 27.62, "min_lon": 109.73, "max_lon": 112.13},
    "岳阳": {"min_lat": 28.25, "max_lat": 29.72, "min_lon": 112.14, "max_lon": 114.09},
    "常德": {"min_lat": 28.42, "max_lat": 30.07, "min_lon": 110.56, "max_lon": 112.18},
    "张家界": {"min_lat": 28.52, "max_lat": 29.48, "min_lon": 109.40, "max_lon": 110.68},
    "益阳": {"min_lat": 27.58, "max_lat": 29.07, "min_lon": 111.43, "max_lon": 112.72},
    "郴州": {"min_lat": 24.89, "max_lat": 26.50, "min_lon": 112.13, "max_lon": 114.14},
    "永州": {"min_lat": 24.76, "max_lat": 26.97, "min_lon": 110.95, "max_lon": 112.57},
    "怀化": {"min_lat": 25.52, "max_lat": 28.24, "min_lon": 108.78, "max_lon": 111.06},
    "娄底": {"min_lat": 27.08, "max_lat": 28.15, "min_lon": 110.89, "max_lon": 112.31},

    # ===== 广东省 =====
    "广州": {"min_lat": 22.47, "max_lat": 23.93, "min_lon": 112.57, "max_lon": 114.05},
    "韶关": {"min_lat": 23.50, "max_lat": 25.52, "min_lon": 112.53, "max_lon": 114.45},
    "深圳": {"min_lat": 22.27, "max_lat": 22.83, "min_lon": 113.68, "max_lon": 114.68},
    "珠海": {"min_lat": 21.48, "max_lat": 22.41, "min_lon": 113.05, "max_lon": 114.19},
    "汕头": {"min_lat": 23.02, "max_lat": 23.68, "min_lon": 116.14, "max_lon": 117.19},
    "佛山": {"min_lat": 22.38, "max_lat": 23.58, "min_lon": 112.47, "max_lon": 113.39},
    "江门": {"min_lat": 21.48, "max_lat": 22.88, "min_lon": 112.23, "max_lon": 113.39},
    "湛江": {"min_lat": 20.13, "max_lat": 21.57, "min_lon": 109.40, "max_lon": 110.92},
    "茂名": {"min_lat": 21.22, "max_lat": 22.42, "min_lon": 110.19, "max_lon": 111.79},
    "肇庆": {"min_lat": 22.47, "max_lat": 24.24, "min_lon": 111.21, "max_lon": 112.52},
    "惠州": {"min_lat": 22.34, "max_lat": 23.76, "min_lon": 113.51, "max_lon": 115.42},
    "梅州": {"min_lat": 23.36, "max_lat": 24.90, "min_lon": 115.18, "max_lon": 116.88},
    "汕尾": {"min_lat": 22.37, "max_lat": 23.38, "min_lon": 114.54, "max_lon": 116.13},
    "河源": {"min_lat": 23.10, "max_lat": 24.50, "min_lon": 114.14, "max_lon": 115.83},
    "阳江": {"min_lat": 21.51, "max_lat": 22.41, "min_lon": 111.16, "max_lon": 112.43},
    "清远": {"min_lat": 23.27, "max_lat": 25.12, "min_lon": 111.55, "max_lon": 113.92},
    "东莞": {"min_lat": 22.67, "max_lat": 23.10, "min_lon": 113.58, "max_lon": 114.24},
    "中山": {"min_lat": 22.17, "max_lat": 22.78, "min_lon": 113.10, "max_lon": 113.66},
    "潮州": {"min_lat": 23.26, "max_lat": 24.14, "min_lon": 116.22, "max_lon": 117.08},
    "揭阳": {"min_lat": 22.89, "max_lat": 23.85, "min_lon": 115.36, "max_lon": 116.78},
    "云浮": {"min_lat": 22.28, "max_lat": 23.47, "min_lon": 111.03, "max_lon": 112.37},

    # ===== 广西壮族自治区 =====
    "南宁": {"min_lat": 22.13, "max_lat": 24.02, "min_lon": 107.23, "max_lon": 109.58},
    "柳州": {"min_lat": 23.54, "max_lat": 25.49, "min_lon": 108.32, "max_lon": 110.20},
    "桂林": {"min_lat": 24.15, "max_lat": 26.23, "min_lon": 109.36, "max_lon": 111.29},
    "梧州": {"min_lat": 22.52, "max_lat": 24.10, "min_lon": 110.18, "max_lon": 111.67},
    "北海": {"min_lat": 20.54, "max_lat": 21.98, "min_lon": 108.50, "max_lon": 109.82},
    "防城港": {"min_lat": 20.90, "max_lat": 22.11, "min_lon": 107.28, "max_lon": 108.60},
    "贵港": {"min_lat": 22.51, "max_lat": 23.92, "min_lon": 109.11, "max_lon": 110.44},
    "玉林": {"min_lat": 21.86, "max_lat": 23.05, "min_lon": 109.25, "max_lon": 110.86},
    "百色": {"min_lat": 22.55, "max_lat": 25.07, "min_lon": 104.28, "max_lon": 108.18},
    "贺州": {"min_lat": 23.59, "max_lat": 24.93, "min_lon": 110.34, "max_lon": 112.03},
    "河池": {"min_lat": 23.42, "max_lat": 25.53, "min_lon": 106.34, "max_lon": 109.09},
    "来宾": {"min_lat": 22.98, "max_lat": 24.78, "min_lon": 108.31, "max_lon": 110.27},
    "崇左": {"min_lat": 21.36, "max_lat": 23.31, "min_lon": 106.33, "max_lon": 108.35},

    # ===== 海南省 =====
    "海口": {"min_lat": 19.32, "max_lat": 20.15, "min_lon": 109.85, "max_lon": 110.70},
    "三亚": {"min_lat": 18.09, "max_lat": 18.70, "min_lon": 108.93, "max_lon": 109.95},

    # ===== 重庆 =====
    "重庆": {"min_lat": 28.16, "max_lat": 32.20, "min_lon": 105.11, "max_lon": 110.20},

    # ===== 四川省 =====
    "成都": {"min_lat": 30.05, "max_lat": 31.44, "min_lon": 102.54, "max_lon": 104.88},
    "自贡": {"min_lat": 28.86, "max_lat": 29.66, "min_lon": 104.02, "max_lon": 105.40},
    "攀枝花": {"min_lat": 26.05, "max_lat": 27.21, "min_lon": 100.75, "max_lon": 102.15},
    "泸州": {"min_lat": 27.39, "max_lat": 29.52, "min_lon": 104.30, "max_lon": 106.31},
    "德阳": {"min_lat": 30.50, "max_lat": 31.84, "min_lon": 103.45, "max_lon": 105.03},
    "绵阳": {"min_lat": 30.72, "max_lat": 33.03, "min_lon": 103.73, "max_lon": 105.43},
    "广元": {"min_lat": 31.31, "max_lat": 32.56, "min_lon": 104.36, "max_lon": 106.45},
    "遂宁": {"min_lat": 30.10, "max_lat": 31.10, "min_lon": 104.90, "max_lon": 106.21},
    "内江": {"min_lat": 29.11, "max_lat": 30.12, "min_lon": 104.16, "max_lon": 105.65},
    "乐山": {"min_lat": 28.28, "max_lat": 30.15, "min_lon": 102.73, "max_lon": 104.36},
    "南充": {"min_lat": 30.25, "max_lat": 31.78, "min_lon": 105.27, "max_lon": 106.88},
    "眉山": {"min_lat": 29.30, "max_lat": 30.52, "min_lon": 102.49, "max_lon": 104.41},
    "宜宾": {"min_lat": 27.50, "max_lat": 29.20, "min_lon": 103.36, "max_lon": 105.73},
    "广安": {"min_lat": 30.01, "max_lat": 30.79, "min_lon": 105.56, "max_lon": 107.18},
    "达州": {"min_lat": 30.38, "max_lat": 32.17, "min_lon": 106.39, "max_lon": 108.44},
    "雅安": {"min_lat": 28.51, "max_lat": 30.56, "min_lon": 101.56, "max_lon": 103.87},
    "巴中": {"min_lat": 31.15, "max_lat": 32.78, "min_lon": 105.73, "max_lon": 107.74},
    "资阳": {"min_lat": 29.64, "max_lat": 30.56, "min_lon": 104.21, "max_lon": 105.55},

    # ===== 贵州省 =====
    "贵阳": {"min_lat": 26.11, "max_lat": 27.22, "min_lon": 106.07, "max_lon": 107.17},
    "六盘水": {"min_lat": 25.19, "max_lat": 26.89, "min_lon": 104.18, "max_lon": 105.55},
    "遵义": {"min_lat": 26.97, "max_lat": 29.23, "min_lon": 105.36, "max_lon": 107.85},
    "安顺": {"min_lat": 25.20, "max_lat": 26.67, "min_lon": 104.99, "max_lon": 106.42},

    # ===== 云南省 =====
    "昆明": {"min_lat": 24.23, "max_lat": 26.22, "min_lon": 102.10, "max_lon": 103.75},
    "曲靖": {"min_lat": 24.19, "max_lat": 27.03, "min_lon": 103.03, "max_lon": 104.50},
    "玉溪": {"min_lat": 23.19, "max_lat": 24.80, "min_lon": 101.16, "max_lon": 103.09},
    "保山": {"min_lat": 24.08, "max_lat": 25.88, "min_lon": 98.05, "max_lon": 100.02},
    "昭通": {"min_lat": 26.55, "max_lat": 28.64, "min_lon": 102.52, "max_lon": 105.19},
    "丽江": {"min_lat": 25.59, "max_lat": 27.86, "min_lon": 99.23, "max_lon": 101.31},
    "临沧": {"min_lat": 23.02, "max_lat": 24.77, "min_lon": 98.40, "max_lon": 100.48},

    # ===== 陕西省 =====
    "西安": {"min_lat": 33.42, "max_lat": 34.77, "min_lon": 107.40, "max_lon": 109.87},
    "铜川": {"min_lat": 34.48, "max_lat": 35.48, "min_lon": 108.34, "max_lon": 109.43},
    "宝鸡": {"min_lat": 33.35, "max_lat": 35.10, "min_lon": 106.18, "max_lon": 108.03},
    "咸阳": {"min_lat": 34.02, "max_lat": 35.47, "min_lon": 107.39, "max_lon": 109.14},
    "渭南": {"min_lat": 34.14, "max_lat": 35.71, "min_lon": 108.58, "max_lon": 110.35},
    "延安": {"min_lat": 35.21, "max_lat": 37.57, "min_lon": 107.41, "max_lon": 110.62},
    "汉中": {"min_lat": 32.08, "max_lat": 33.70, "min_lon": 105.30, "max_lon": 108.16},
    "榆林": {"min_lat": 36.57, "max_lat": 39.58, "min_lon": 107.23, "max_lon": 111.15},
    "安康": {"min_lat": 31.42, "max_lat": 33.49, "min_lon": 108.01, "max_lon": 110.21},
    "商洛": {"min_lat": 33.02, "max_lat": 34.25, "min_lon": 108.34, "max_lon": 111.01},

    # ===== 甘肃省 =====
    "兰州": {"min_lat": 35.32, "max_lat": 37.14, "min_lon": 102.36, "max_lon": 104.33},
    "嘉峪关": {"min_lat": 39.30, "max_lat": 40.16, "min_lon": 97.67, "max_lon": 98.68},
    "金昌": {"min_lat": 37.89, "max_lat": 39.29, "min_lon": 101.15, "max_lon": 102.85},
    "白银": {"min_lat": 35.12, "max_lat": 37.62, "min_lon": 103.33, "max_lon": 105.11},
    "天水": {"min_lat": 34.05, "max_lat": 35.21, "min_lon": 104.34, "max_lon": 106.44},
    "武威": {"min_lat": 36.29, "max_lat": 39.27, "min_lon": 101.49, "max_lon": 104.17},
    "张掖": {"min_lat": 37.28, "max_lat": 39.95, "min_lon": 97.21, "max_lon": 102.12},
    "平凉": {"min_lat": 34.54, "max_lat": 35.75, "min_lon": 105.40, "max_lon": 107.62},
    "酒泉": {"min_lat": 38.09, "max_lat": 42.48, "min_lon": 92.09, "max_lon": 100.20},
    "庆阳": {"min_lat": 35.15, "max_lat": 37.10, "min_lon": 106.20, "max_lon": 108.42},
    "定西": {"min_lat": 34.26, "max_lat": 36.16, "min_lon": 103.52, "max_lon": 105.47},
    "陇南": {"min_lat": 32.38, "max_lat": 34.31, "min_lon": 104.01, "max_lon": 106.78},

    # ===== 青海省 =====
    "西宁": {"min_lat": 36.19, "max_lat": 37.25, "min_lon": 100.77, "max_lon": 102.63},

    # ===== 宁夏回族自治区 =====
    "银川": {"min_lat": 37.60, "max_lat": 38.83, "min_lon": 105.49, "max_lon": 106.82},
    "石嘴山": {"min_lat": 38.67, "max_lat": 39.38, "min_lon": 106.06, "max_lon": 106.96},
    "吴忠": {"min_lat": 36.62, "max_lat": 38.18, "min_lon": 105.45, "max_lon": 107.41},
    "固原": {"min_lat": 34.84, "max_lat": 36.56, "min_lon": 105.18, "max_lon": 106.94},

    # ===== 新疆维吾尔自治区 =====
    "乌鲁木齐": {"min_lat": 42.45, "max_lat": 44.71, "min_lon": 86.37, "max_lon": 88.58},
    "克拉玛依": {"min_lat": 44.04, "max_lat": 46.41, "min_lon": 84.07, "max_lon": 86.44},
}


def main():
    # 读取现有的 JSON 文件
    json_path = 'd:/onelapMap/data/road-data.json'
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updated = 0
    missing = []

    for city_name in data['regions']:
        if city_name in city_bounds:
            data['regions'][city_name]['bounds'] = city_bounds[city_name]
            updated += 1
        else:
            missing.append(city_name)

    # 保存更新后的 JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ 已更新 {updated} 个城市的 bounds")
    if missing:
        print(f"⚠️ 以下城市未找到 bounds 数据: {missing}")

    # 验证关键城市
    print("\n=== 关键城市 bounds 验证 ===")
    for city in ["青岛", "济南", "日照", "石家庄", "南京"]:
        if city in data['regions']:
            b = data['regions'][city]['bounds']
            print(f"{city}: lat [{b['min_lat']}, {b['max_lat']}], lon [{b['min_lon']}, {b['max_lon']}]")

    # 检查山东省城市是否仍有重叠
    print("\n=== 山东省城市 bounds 唯一性检查 ===")
    sd_cities = ["济南", "青岛", "淄博", "枣庄", "东营", "烟台", "潍坊", "济宁", "泰安", "威海", "日照", "临沂", "德州", "聊城", "滨州", "菏泽"]
    for i, c1 in enumerate(sd_cities):
        for c2 in sd_cities[i+1:]:
            if c1 in data['regions'] and c2 in data['regions']:
                b1 = data['regions'][c1]['bounds']
                b2 = data['regions'][c2]['bounds']
                if b1 == b2:
                    print(f"❌ {c1} 和 {c2} 的 bounds 完全相同!")


if __name__ == '__main__':
    main()
