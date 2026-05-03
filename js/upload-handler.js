window.uploadedTracks = window.uploadedTracks || [];

const CITY_COORDINATES = {
  // 直辖市
  '北京': { lat: 39.9042, lng: 116.4074, zoom: 11 },
  '上海': { lat: 31.2304, lng: 121.4737, zoom: 11 },
  '天津': { lat: 39.1252, lng: 117.1904, zoom: 11 },
  '重庆': { lat: 29.5630, lng: 106.5516, zoom: 11 },

  // 河北省
  '石家庄': { lat: 38.0428, lng: 114.5149, zoom: 12 },
  '唐山': { lat: 39.6292, lng: 118.1802, zoom: 12 },
  '秦皇岛': { lat: 39.9354, lng: 119.5982, zoom: 12 },
  '邯郸': { lat: 36.6093, lng: 114.4928, zoom: 12 },
  '邢台': { lat: 37.0659, lng: 114.5047, zoom: 12 },
  '保定': { lat: 38.8739, lng: 115.4646, zoom: 12 },
  '张家口': { lat: 40.7676, lng: 114.8863, zoom: 12 },
  '承德': { lat: 40.9510, lng: 117.9328, zoom: 12 },
  '沧州': { lat: 38.3037, lng: 116.8388, zoom: 12 },
  '廊坊': { lat: 39.5380, lng: 116.6837, zoom: 12 },
  '衡水': { lat: 37.7350, lng: 115.6860, zoom: 12 },

  // 山西省
  '太原': { lat: 37.8706, lng: 112.5489, zoom: 12 },
  '大同': { lat: 40.0764, lng: 113.3000, zoom: 12 },
  '阳泉': { lat: 37.8569, lng: 113.5775, zoom: 12 },
  '长治': { lat: 36.1954, lng: 113.1165, zoom: 12 },
  '晋城': { lat: 35.4907, lng: 112.8513, zoom: 12 },
  '朔州': { lat: 39.3316, lng: 112.4331, zoom: 12 },
  '晋中': { lat: 37.6870, lng: 112.7527, zoom: 12 },
  '运城': { lat: 35.0264, lng: 111.0075, zoom: 12 },
  '忻州': { lat: 38.4166, lng: 112.7342, zoom: 12 },
  '临汾': { lat: 36.0880, lng: 111.5190, zoom: 12 },
  '吕梁': { lat: 37.5189, lng: 111.1448, zoom: 12 },

  // 内蒙古自治区
  '呼和浩特': { lat: 40.8414, lng: 111.7519, zoom: 12 },
  '包头': { lat: 40.6584, lng: 109.8404, zoom: 12 },
  '乌海': { lat: 39.6552, lng: 106.7953, zoom: 12 },
  '赤峰': { lat: 42.2578, lng: 118.8869, zoom: 12 },
  '通辽': { lat: 43.6525, lng: 122.2443, zoom: 12 },
  '鄂尔多斯': { lat: 39.6084, lng: 109.7809, zoom: 12 },
  '呼伦贝尔': { lat: 49.2116, lng: 119.7657, zoom: 12 },
  '巴彦淖尔': { lat: 40.7432, lng: 107.3877, zoom: 12 },
  '乌兰察布': { lat: 40.9948, lng: 113.1330, zoom: 12 },

  // 辽宁省
  '沈阳': { lat: 41.8057, lng: 123.4315, zoom: 12 },
  '大连': { lat: 38.9140, lng: 121.6147, zoom: 12 },
  '鞍山': { lat: 41.1086, lng: 122.9943, zoom: 12 },
  '抚顺': { lat: 41.8797, lng: 123.9572, zoom: 12 },
  '本溪': { lat: 41.2943, lng: 123.7665, zoom: 12 },
  '丹东': { lat: 40.1244, lng: 124.3770, zoom: 12 },
  '锦州': { lat: 41.0951, lng: 121.1276, zoom: 12 },
  '营口': { lat: 40.6674, lng: 122.2354, zoom: 12 },
  '阜新': { lat: 42.0216, lng: 121.6703, zoom: 12 },
  '辽阳': { lat: 41.2694, lng: 123.2397, zoom: 12 },
  '盘锦': { lat: 41.1199, lng: 122.0707, zoom: 12 },
  '铁岭': { lat: 42.2866, lng: 123.8435, zoom: 12 },
  '朝阳': { lat: 41.5744, lng: 120.4509, zoom: 12 },
  '葫芦岛': { lat: 40.7110, lng: 120.8369, zoom: 12 },

  // 吉林省
  '长春': { lat: 43.8171, lng: 125.3235, zoom: 12 },
  '吉林': { lat: 43.8378, lng: 126.5494, zoom: 12 },
  '四平': { lat: 43.1669, lng: 124.3504, zoom: 12 },
  '辽源': { lat: 42.8880, lng: 125.1437, zoom: 12 },
  '通化': { lat: 41.7283, lng: 125.9399, zoom: 12 },
  '白山': { lat: 41.9438, lng: 126.4278, zoom: 12 },
  '松原': { lat: 45.1113, lng: 124.8250, zoom: 12 },
  '白城': { lat: 45.6200, lng: 122.8411, zoom: 12 },

  // 黑龙江省
  '哈尔滨': { lat: 45.8038, lng: 126.5350, zoom: 12 },
  '齐齐哈尔': { lat: 47.3543, lng: 123.9182, zoom: 12 },
  '鸡西': { lat: 45.2953, lng: 130.9698, zoom: 12 },
  '鹤岗': { lat: 47.3499, lng: 130.2775, zoom: 12 },
  '双鸭山': { lat: 46.6430, lng: 131.1573, zoom: 12 },
  '大庆': { lat: 46.5893, lng: 125.1038, zoom: 12 },
  '伊春': { lat: 47.7275, lng: 128.8409, zoom: 12 },
  '佳木斯': { lat: 46.7999, lng: 130.3188, zoom: 12 },
  '七台河': { lat: 45.7712, lng: 130.8485, zoom: 12 },
  '牡丹江': { lat: 44.5514, lng: 129.6332, zoom: 12 },
  '黑河': { lat: 50.2454, lng: 127.5283, zoom: 12 },

  // 江苏省
  '南京': { lat: 32.0603, lng: 118.7969, zoom: 12 },
  '无锡': { lat: 31.4912, lng: 120.3119, zoom: 12 },
  '徐州': { lat: 34.2610, lng: 117.1848, zoom: 12 },
  '常州': { lat: 31.7976, lng: 119.9462, zoom: 12 },
  '苏州': { lat: 31.2989, lng: 120.5853, zoom: 12 },
  '南通': { lat: 32.0142, lng: 120.8683, zoom: 12 },
  '连云港': { lat: 34.6004, lng: 119.1790, zoom: 12 },
  '淮安': { lat: 33.6107, lng: 119.0158, zoom: 12 },
  '盐城': { lat: 33.3776, lng: 120.1398, zoom: 12 },
  '扬州': { lat: 32.3932, lng: 119.4210, zoom: 12 },
  '镇江': { lat: 32.1878, lng: 119.4258, zoom: 12 },
  '泰州': { lat: 32.4555, lng: 119.9255, zoom: 12 },
  '宿迁': { lat: 33.9611, lng: 118.2755, zoom: 12 },

  // 浙江省
  '杭州': { lat: 30.2741, lng: 120.1551, zoom: 12 },
  '宁波': { lat: 29.8683, lng: 121.5440, zoom: 12 },
  '温州': { lat: 27.9938, lng: 120.6994, zoom: 12 },
  '嘉兴': { lat: 30.7461, lng: 120.7555, zoom: 12 },
  '湖州': { lat: 30.8944, lng: 120.0880, zoom: 12 },
  '绍兴': { lat: 30.0021, lng: 120.5792, zoom: 12 },
  '金华': { lat: 29.0781, lng: 119.6472, zoom: 12 },
  '衢州': { lat: 28.9359, lng: 118.8742, zoom: 12 },
  '舟山': { lat: 30.0160, lng: 122.1068, zoom: 12 },
  '台州': { lat: 28.6564, lng: 121.4208, zoom: 12 },
  '丽水': { lat: 28.4676, lng: 119.9228, zoom: 12 },

  // 安徽省
  '合肥': { lat: 31.8206, lng: 117.2272, zoom: 12 },
  '芜湖': { lat: 31.3340, lng: 118.4331, zoom: 12 },
  '蚌埠': { lat: 32.9166, lng: 117.3893, zoom: 12 },
  '淮南': { lat: 32.6255, lng: 116.9999, zoom: 12 },
  '马鞍山': { lat: 31.6758, lng: 118.5063, zoom: 12 },
  '淮北': { lat: 33.9558, lng: 116.7983, zoom: 12 },
  '铜陵': { lat: 30.9454, lng: 117.8123, zoom: 12 },
  '安庆': { lat: 30.5429, lng: 117.0635, zoom: 12 },
  '黄山': { lat: 29.7147, lng: 118.3375, zoom: 12 },
  '滁州': { lat: 32.3016, lng: 118.3163, zoom: 12 },
  '阜阳': { lat: 32.8896, lng: 115.8145, zoom: 12 },
  '宿州': { lat: 33.6464, lng: 116.9639, zoom: 12 },
  '六安': { lat: 31.7337, lng: 116.5219, zoom: 12 },
  '亳州': { lat: 33.8446, lng: 115.7797, zoom: 12 },
  '池州': { lat: 30.6648, lng: 117.4892, zoom: 12 },
  '宣城': { lat: 30.9407, lng: 118.7587, zoom: 12 },

  // 福建省
  '福州': { lat: 26.0745, lng: 119.2965, zoom: 12 },
  '厦门': { lat: 24.4798, lng: 118.0894, zoom: 12 },
  '莆田': { lat: 25.4541, lng: 119.0076, zoom: 12 },
  '三明': { lat: 26.2639, lng: 117.6392, zoom: 12 },
  '泉州': { lat: 24.8744, lng: 118.6757, zoom: 12 },
  '漳州': { lat: 24.5133, lng: 117.6614, zoom: 12 },
  '南平': { lat: 26.6439, lng: 118.1784, zoom: 12 },
  '龙岩': { lat: 25.0750, lng: 117.0177, zoom: 12 },
  '宁德': { lat: 26.6663, lng: 119.5479, zoom: 12 },

  // 江西省
  '南昌': { lat: 28.6820, lng: 115.8579, zoom: 12 },
  '景德镇': { lat: 29.2688, lng: 117.1784, zoom: 12 },
  '萍乡': { lat: 27.6229, lng: 113.8547, zoom: 12 },
  '九江': { lat: 29.7051, lng: 116.0019, zoom: 12 },
  '新余': { lat: 27.8174, lng: 114.9171, zoom: 12 },
  '鹰潭': { lat: 28.2602, lng: 117.0687, zoom: 12 },
  '赣州': { lat: 25.8317, lng: 114.9335, zoom: 12 },
  '吉安': { lat: 27.1138, lng: 114.9938, zoom: 12 },
  '宜春': { lat: 27.8156, lng: 114.4168, zoom: 12 },
  '抚州': { lat: 27.9478, lng: 116.3581, zoom: 12 },
  '上饶': { lat: 28.4546, lng: 117.9436, zoom: 12 },

  // 山东省
  '济南': { lat: 36.6512, lng: 117.1201, zoom: 12 },
  '青岛': { lat: 36.0671, lng: 120.3826, zoom: 12 },
  '淄博': { lat: 36.8135, lng: 118.0550, zoom: 12 },
  '枣庄': { lat: 34.8107, lng: 117.3237, zoom: 12 },
  '东营': { lat: 37.4337, lng: 118.6747, zoom: 12 },
  '烟台': { lat: 37.4638, lng: 121.4481, zoom: 12 },
  '潍坊': { lat: 36.7089, lng: 119.1619, zoom: 12 },
  '济宁': { lat: 35.4154, lng: 116.5872, zoom: 12 },
  '泰安': { lat: 36.2003, lng: 117.0876, zoom: 12 },
  '威海': { lat: 37.5091, lng: 122.1214, zoom: 12 },
  '日照': { lat: 35.4262, lng: 119.5272, zoom: 12 },
  '临沂': { lat: 35.0535, lng: 118.3426, zoom: 12 },
  '德州': { lat: 37.4355, lng: 116.3593, zoom: 12 },
  '聊城': { lat: 36.4570, lng: 115.9804, zoom: 12 },
  '滨州': { lat: 37.3835, lng: 117.9712, zoom: 12 },
  '菏泽': { lat: 35.2336, lng: 115.4806, zoom: 12 },

  // 河南省
  '郑州': { lat: 34.7466, lng: 113.6253, zoom: 12 },
  '开封': { lat: 34.7973, lng: 114.3073, zoom: 12 },
  '洛阳': { lat: 34.6197, lng: 112.4536, zoom: 12 },
  '平顶山': { lat: 33.7661, lng: 113.1927, zoom: 12 },
  '安阳': { lat: 36.0976, lng: 114.3931, zoom: 12 },
  '鹤壁': { lat: 35.7482, lng: 114.2981, zoom: 12 },
  '新乡': { lat: 35.3030, lng: 113.9268, zoom: 12 },
  '焦作': { lat: 35.2159, lng: 113.2418, zoom: 12 },
  '濮阳': { lat: 35.7619, lng: 115.0292, zoom: 12 },
  '许昌': { lat: 34.0357, lng: 113.8523, zoom: 12 },
  '漯河': { lat: 33.5815, lng: 114.0168, zoom: 12 },
  '三门峡': { lat: 34.7749, lng: 111.2001, zoom: 12 },
  '南阳': { lat: 32.9908, lng: 112.5283, zoom: 12 },
  '商丘': { lat: 34.4145, lng: 115.6564, zoom: 12 },
  '信阳': { lat: 32.1469, lng: 114.0910, zoom: 12 },
  '周口': { lat: 33.6261, lng: 114.6969, zoom: 12 },
  '驻马店': { lat: 33.0114, lng: 114.0247, zoom: 12 },

  // 湖北省
  '武汉': { lat: 30.5928, lng: 114.3055, zoom: 12 },
  '黄石': { lat: 30.1996, lng: 115.0389, zoom: 12 },
  '十堰': { lat: 32.6292, lng: 110.7980, zoom: 12 },
  '宜昌': { lat: 30.6921, lng: 111.2866, zoom: 12 },
  '襄阳': { lat: 32.0090, lng: 112.1223, zoom: 12 },
  '鄂州': { lat: 30.3909, lng: 114.8949, zoom: 12 },
  '荆门': { lat: 31.0355, lng: 112.1995, zoom: 12 },
  '孝感': { lat: 30.9179, lng: 113.9165, zoom: 12 },
  '荆州': { lat: 30.3352, lng: 112.2397, zoom: 12 },
  '黄冈': { lat: 30.4539, lng: 114.8723, zoom: 12 },
  '咸宁': { lat: 29.8410, lng: 114.3225, zoom: 12 },
  '随州': { lat: 31.6901, lng: 113.3820, zoom: 12 },

  // 湖南省
  '长沙': { lat: 28.2280, lng: 112.9388, zoom: 12 },
  '株洲': { lat: 27.8278, lng: 113.1330, zoom: 12 },
  '湘潭': { lat: 27.8297, lng: 112.9441, zoom: 12 },
  '衡阳': { lat: 26.8932, lng: 112.5719, zoom: 12 },
  '邵阳': { lat: 27.2389, lng: 111.4678, zoom: 12 },
  '岳阳': { lat: 29.3571, lng: 113.1289, zoom: 12 },
  '常德': { lat: 29.0391, lng: 111.6985, zoom: 12 },
  '张家界': { lat: 29.1171, lng: 110.4792, zoom: 12 },
  '益阳': { lat: 28.5540, lng: 112.3552, zoom: 12 },
  '郴州': { lat: 25.7706, lng: 113.0149, zoom: 12 },
  '永州': { lat: 26.4204, lng: 111.5917, zoom: 12 },
  '怀化': { lat: 27.5501, lng: 109.9785, zoom: 12 },
  '娄底': { lat: 27.7281, lng: 112.0010, zoom: 12 },

  // 广东省
  '广州': { lat: 23.1291, lng: 113.2644, zoom: 12 },
  '韶关': { lat: 24.8104, lng: 113.5972, zoom: 12 },
  '深圳': { lat: 22.5431, lng: 114.0579, zoom: 12 },
  '珠海': { lat: 22.2707, lng: 113.5677, zoom: 12 },
  '汕头': { lat: 23.3540, lng: 116.7324, zoom: 12 },
  '佛山': { lat: 23.0218, lng: 113.1219, zoom: 12 },
  '江门': { lat: 22.5793, lng: 113.0815, zoom: 12 },
  '湛江': { lat: 21.2707, lng: 110.3594, zoom: 12 },
  '茂名': { lat: 21.6629, lng: 110.9252, zoom: 12 },
  '肇庆': { lat: 23.0472, lng: 112.4651, zoom: 12 },
  '惠州': { lat: 23.1115, lng: 114.4152, zoom: 12 },
  '梅州': { lat: 24.2886, lng: 116.1225, zoom: 12 },
  '汕尾': { lat: 22.7862, lng: 115.3751, zoom: 12 },
  '河源': { lat: 23.7435, lng: 114.7004, zoom: 12 },
  '阳江': { lat: 21.8579, lng: 111.9826, zoom: 12 },
  '清远': { lat: 23.6820, lng: 113.0560, zoom: 12 },
  '东莞': { lat: 23.0489, lng: 113.7447, zoom: 12 },
  '中山': { lat: 22.5176, lng: 113.3927, zoom: 12 },
  '潮州': { lat: 23.6565, lng: 116.6228, zoom: 12 },
  '揭阳': { lat: 23.5499, lng: 116.3727, zoom: 12 },
  '云浮': { lat: 22.9158, lng: 112.0444, zoom: 12 },

  // 广西壮族自治区
  '南宁': { lat: 22.8170, lng: 108.3665, zoom: 12 },
  '柳州': { lat: 24.3255, lng: 109.4155, zoom: 12 },
  '桂林': { lat: 25.2740, lng: 110.2993, zoom: 12 },
  '梧州': { lat: 23.4765, lng: 111.2791, zoom: 12 },
  '北海': { lat: 21.4813, lng: 109.1202, zoom: 12 },
  '防城港': { lat: 21.6869, lng: 108.3543, zoom: 12 },
  '贵港': { lat: 23.1115, lng: 109.5989, zoom: 12 },
  '玉林': { lat: 22.6545, lng: 110.1810, zoom: 12 },
  '百色': { lat: 23.9025, lng: 106.6184, zoom: 12 },
  '贺州': { lat: 24.4036, lng: 111.5667, zoom: 12 },
  '河池': { lat: 24.6928, lng: 108.0854, zoom: 12 },
  '来宾': { lat: 23.7521, lng: 109.2215, zoom: 12 },
  '崇左': { lat: 22.3789, lng: 107.3652, zoom: 12 },

  // 海南省
  '海口': { lat: 20.0440, lng: 110.1999, zoom: 12 },
  '三亚': { lat: 18.2525, lng: 109.5121, zoom: 12 },

  // 四川省
  '成都': { lat: 30.5728, lng: 104.0668, zoom: 12 },
  '自贡': { lat: 29.3392, lng: 104.7784, zoom: 12 },
  '攀枝花': { lat: 26.5823, lng: 101.7187, zoom: 12 },
  '泸州': { lat: 28.8718, lng: 105.4423, zoom: 12 },
  '德阳': { lat: 31.1270, lng: 104.3980, zoom: 12 },
  '绵阳': { lat: 31.4677, lng: 104.6785, zoom: 12 },
  '广元': { lat: 32.4355, lng: 105.8433, zoom: 12 },
  '遂宁': { lat: 30.5055, lng: 105.5929, zoom: 12 },
  '内江': { lat: 29.5809, lng: 105.0584, zoom: 12 },
  '乐山': { lat: 29.5823, lng: 103.7660, zoom: 12 },
  '南充': { lat: 30.8378, lng: 106.1107, zoom: 12 },
  '眉山': { lat: 30.0756, lng: 103.8467, zoom: 12 },
  '宜宾': { lat: 28.7665, lng: 104.6432, zoom: 12 },
  '广安': { lat: 30.4564, lng: 106.6334, zoom: 12 },
  '达州': { lat: 31.2093, lng: 107.4680, zoom: 12 },
  '雅安': { lat: 29.9805, lng: 103.0134, zoom: 12 },
  '巴中': { lat: 31.8679, lng: 106.7477, zoom: 12 },
  '资阳': { lat: 30.1286, lng: 104.6276, zoom: 12 },

  // 贵州省
  '贵阳': { lat: 26.6470, lng: 106.6302, zoom: 12 },
  '六盘水': { lat: 26.5927, lng: 104.8303, zoom: 12 },
  '遵义': { lat: 27.7255, lng: 106.9274, zoom: 12 },
  '安顺': { lat: 26.2535, lng: 105.9476, zoom: 12 },

  // 云南省
  '昆明': { lat: 25.0389, lng: 102.7183, zoom: 12 },
  '曲靖': { lat: 25.4900, lng: 103.7962, zoom: 12 },
  '玉溪': { lat: 24.3505, lng: 102.5471, zoom: 12 },
  '保山': { lat: 25.1121, lng: 99.1618, zoom: 12 },
  '昭通': { lat: 27.3380, lng: 103.7172, zoom: 12 },
  '丽江': { lat: 26.8550, lng: 100.2278, zoom: 12 },
  '临沧': { lat: 23.8859, lng: 100.0869, zoom: 12 },

  // 陕西省
  '西安': { lat: 34.3416, lng: 108.9398, zoom: 12 },
  '铜川': { lat: 34.8967, lng: 108.9640, zoom: 12 },
  '宝鸡': { lat: 34.3617, lng: 107.2377, zoom: 12 },
  '咸阳': { lat: 34.3296, lng: 108.7089, zoom: 12 },
  '渭南': { lat: 34.4994, lng: 109.5101, zoom: 12 },
  '延安': { lat: 36.5853, lng: 109.4898, zoom: 12 },
  '汉中': { lat: 33.0677, lng: 107.0230, zoom: 12 },
  '榆林': { lat: 38.2852, lng: 109.7349, zoom: 12 },
  '安康': { lat: 32.6847, lng: 109.0291, zoom: 12 },
  '商洛': { lat: 33.8704, lng: 109.9405, zoom: 12 },

  // 甘肃省
  '兰州': { lat: 36.0611, lng: 103.8343, zoom: 12 },
  '嘉峪关': { lat: 39.7723, lng: 98.2773, zoom: 12 },
  '金昌': { lat: 38.5201, lng: 102.1880, zoom: 12 },
  '白银': { lat: 36.5448, lng: 104.1385, zoom: 12 },
  '天水': { lat: 34.5809, lng: 105.7249, zoom: 12 },
  '武威': { lat: 37.9282, lng: 102.6382, zoom: 12 },
  '张掖': { lat: 38.9259, lng: 100.4497, zoom: 12 },
  '平凉': { lat: 35.5431, lng: 106.6652, zoom: 12 },
  '酒泉': { lat: 39.7326, lng: 98.4942, zoom: 12 },
  '庆阳': { lat: 35.7098, lng: 107.6436, zoom: 12 },
  '定西': { lat: 35.5796, lng: 104.6263, zoom: 12 },
  '陇南': { lat: 33.4061, lng: 104.9235, zoom: 12 },

  // 青海省
  '西宁': { lat: 36.6171, lng: 101.7782, zoom: 12 },

  // 宁夏回族自治区
  '银川': { lat: 38.4872, lng: 106.2309, zoom: 12 },
  '石嘴山': { lat: 39.0133, lng: 106.3826, zoom: 12 },
  '吴忠': { lat: 37.9830, lng: 106.1994, zoom: 12 },
  '固原': { lat: 36.0046, lng: 106.2782, zoom: 12 },

  // 新疆维吾尔自治区
  '乌鲁木齐': { lat: 43.8256, lng: 87.6168, zoom: 12 },
  '克拉玛依': { lat: 45.5792, lng: 84.7739, zoom: 12 },

  // 西藏自治区
  '拉萨': { lat: 29.6500, lng: 91.1000, zoom: 12 }
};

function addTrackUnique(trackData) {
  console.log('addTrackUnique called, fit_url:', trackData.fit_url, 'current tracks:', window.uploadedTracks.length);
  
  if (!trackData.fit_url) {
    const existingById = window.uploadedTracks.findIndex(t => 
      t.track_id && t.track_id === trackData.track_id
    );
    if (existingById === -1) {
      window.uploadedTracks.push(trackData);
      console.log('Added by track_id, new count:', window.uploadedTracks.length);
      return true;
    }
    console.log('Skipped, exists by track_id');
    return false;
  }
  
  const existingByFitUrl = window.uploadedTracks.findIndex(t => 
    t.fit_url && t.fit_url === trackData.fit_url
  );
  if (existingByFitUrl !== -1) {
    console.log('Skipped, exists by fit_url');
    return false;
  }
  
  window.uploadedTracks.push(trackData);
  console.log('Added by fit_url, new count:', window.uploadedTracks.length);
  return true;
}

function triggerUpload() {
  const input = document.getElementById('fit-file-input');
  input.click();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  showUploadProgress();

  try {
    const trackData = await readAndParseFitFile(file);
    addTrackUnique(trackData);
    
    hideUploadProgress();
    showToast(`成功导入轨迹：${trackData.total_distance_km.toFixed(2)}km`);
    
    renderTrackOnMap(trackData);
    updateStats();
    
  } catch (error) {
    hideUploadProgress();
    showToast(`解析失败：${error.message}`, 'error');
  }

  event.target.value = '';
}

function showUploadProgress() {
}

function hideUploadProgress() {
}

function hideUploadOverlay() {
  const overlay = document.getElementById('upload-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  const duration = type === 'info' ? 5000 : 2000;
  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function renderTrackOnMap(trackData) {
  if (!window.map) {
    console.error('地图未初始化');
    return;
  }

  const coords = trackData.points.map(p => {
    if (typeof wgs84ToGcj02 === 'function') {
      const [gcjLat, gcjLon] = wgs84ToGcj02(p.lat, p.lon);
      return [gcjLon, gcjLat];
    }
    return [p.lon, p.lat];
  });

  if (coords.length < 2) {
    console.warn('轨迹点数不足');
    return;
  }

  new AMap.Polyline({
    path: coords,
    strokeColor: '#FFD93D',
    strokeWeight: 2,
    strokeOpacity: 0.85,
    lineJoin: 'round',
    lineCap: 'round'
  }).setMap(window.map);

  window.map.setFitView(null, false, [50, 50, 50, 50]);
}

async function updateStats() {
  await loadRoadData();
  
  const stats = await calculateAllStats(window.uploadedTracks);
  
  const lightingRateEl = document.querySelector('.achievement-card .stat-item:nth-child(1) .stat-value');
  const litDistanceEl = document.querySelector('.achievement-card .stat-item:nth-child(2) .stat-value');
  const totalRoadEl = document.querySelector('.achievement-card .stat-item:nth-child(3) .stat-value');
  const weeklyBadgeEl = document.querySelector('.achievement-card .card-badge');
  const regionNameEl = document.getElementById('region-name');
  const progressBarEl = document.querySelector('.achievement-card .progress-fill');
  
  if (lightingRateEl) {
    lightingRateEl.textContent = `${stats.lighting_rate.toFixed(1)}%`;
  }
  
  if (litDistanceEl) {
    litDistanceEl.textContent = `${stats.unique_distance_km.toFixed(1)}km`;
  }
  
  if (totalRoadEl) {
    totalRoadEl.textContent = `${stats.total_road_km}km`;
  }
  
  if (weeklyBadgeEl) {
    weeklyBadgeEl.textContent = `本周+${stats.this_week_uploads}`;
  }
  
  if (regionNameEl) {
    regionNameEl.textContent = stats.region;
  }
  
  if (progressBarEl) {
    progressBarEl.style.width = `${Math.min(stats.lighting_rate, 100)}%`;
  }
  
  updateCitySelector(stats.regions);
}

function updateCitySelector(regions) {
  const citySelector = document.getElementById('city-selector');
  const cityList = document.getElementById('city-list');
  const currentCityEl = document.getElementById('current-city');
  
  if (!citySelector || !cityList || !currentCityEl) return;
  
  if (regions && regions.length >= 1) {
    citySelector.style.display = 'block';
    const currentRegion = window.getCurrentRegion();
    if (currentRegion) {
      currentCityEl.textContent = currentRegion;
    } else {
      currentCityEl.textContent = '请选择您所探索过的区域';
    }
    
    cityList.innerHTML = '';
    regions.forEach(region => {
      const item = document.createElement('div');
      item.className = 'city-item' + (region.name === currentRegion ? ' active' : '');
      item.innerHTML = `<span>${region.name}</span>`;
      item.onclick = () => switchCity(region.name);
      cityList.appendChild(item);
    });
  } else {
    citySelector.style.display = 'none';
  }
}

function toggleCityDropdown() {
  const dropdown = document.querySelector('.city-dropdown');
  const cityList = document.getElementById('city-list');
  dropdown.classList.toggle('open');
  cityList.classList.toggle('show');
}

async function switchCity(cityName) {
  window.setCurrentRegion(cityName);

  const stats = await calculateAllStats(window.uploadedTracks, cityName);

  const lightingRateEl = document.querySelector('.achievement-card .stat-item:nth-child(1) .stat-value');
  const litDistanceEl = document.querySelector('.achievement-card .stat-item:nth-child(2) .stat-value');
  const totalRoadEl = document.querySelector('.achievement-card .stat-item:nth-child(3) .stat-value');
  const regionNameEl = document.getElementById('region-name');
  const progressBarEl = document.querySelector('.achievement-card .progress-fill');

  if (lightingRateEl) {
    lightingRateEl.textContent = `${stats.lighting_rate.toFixed(1)}%`;
  }

  if (litDistanceEl) {
    litDistanceEl.textContent = `${stats.unique_distance_km.toFixed(1)}km`;
  }

  if (totalRoadEl) {
    totalRoadEl.textContent = `${stats.total_road_km}km`;
  }

  if (regionNameEl) {
    regionNameEl.textContent = cityName;
  }

  if (progressBarEl) {
    progressBarEl.style.width = `${Math.min(stats.lighting_rate, 100)}%`;
  }

  document.getElementById('current-city').textContent = cityName;
  document.querySelector('.city-dropdown').classList.remove('open');
  document.getElementById('city-list').classList.remove('show');

  updateCitySelector(stats.regions);

  if (window.map) {
    let centerLat, centerLng, zoom;

    if (CITY_COORDINATES[cityName]) {
      const coord = CITY_COORDINATES[cityName];
      centerLat = coord.lat;
      centerLng = coord.lng;
      zoom = coord.zoom;
    } else {
      const roadData = await loadRoadData();
      const regionData = roadData.regions[cityName];
      if (regionData && regionData.bounds) {
        const bounds = regionData.bounds;
        centerLat = (bounds.min_lat + bounds.max_lat) / 2;
        centerLng = (bounds.min_lon + bounds.max_lon) / 2;
        zoom = 12;
      }
    }

    if (centerLat && centerLng) {
      window.map.setZoomAndCenter(zoom || 12, [centerLng, centerLat]);
    }
  }
}

window.toggleCityDropdown = toggleCityDropdown;
window.switchCity = switchCity;

async function uploadFitFileFromUrl(url, skipCache = false) {
  if (!url) {
    throw new Error('请提供FIT文件的URL');
  }

  if (!skipCache && window.trackStorage) {
    const cachedTrack = await trackStorage.getTrack(url);
    if (cachedTrack) {
      addTrackUnique(cachedTrack);
      showToast(`从缓存加载：${cachedTrack.total_distance_km.toFixed(2)}km`);
      renderTrackOnMap(cachedTrack);
      updateStats();
      return cachedTrack;
    }
  }

  showUploadProgress();
  const progressText = document.getElementById('progress-text');
  progressText.textContent = '正在下载FIT文件...';

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`下载失败: HTTP ${response.status}`);
    }

    progressText.textContent = '正在解析FIT文件...';
    const buffer = await response.arrayBuffer();

    const trackData = await parseFitFile(buffer);
    trackData.fit_file_name = url.split('/').pop() || 'remote.fit';
    trackData.fit_url = url;

    addTrackUnique(trackData);

    if (window.trackStorage) {
      await trackStorage.saveTrack(trackData, url);
    }

    hideUploadProgress();
    showToast(`成功导入轨迹：${trackData.total_distance_km.toFixed(2)}km`);
    
    renderTrackOnMap(trackData);
    updateStats();

    return trackData;

  } catch (error) {
    hideUploadProgress();
    
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = '网络错误或跨域限制，请检查URL是否可访问';
    } else if (error.message.includes('HTTP')) {
      errorMessage = `文件下载失败: ${error.message}`;
    } else if (error.message.includes('解析失败')) {
      errorMessage = `FIT文件解析失败: ${error.message}`;
    }
    
    showToast(errorMessage, 'error');
    throw new Error(errorMessage);
  }
}

/**
 * 批量从URL上传FIT文件（单个加载，逐个渲染）
 * @param {Array<string>} urls - FIT文件URL数组
 * @returns {Promise<Array<Object>>} 所有解析后的轨迹数据
 */
async function uploadFitFilesFromUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('请提供FIT文件URL数组');
  }

  showUploadProgress();
  const progressText = document.getElementById('progress-text');
  
  const results = [];
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    progressText.textContent = `正在处理第 ${i + 1}/${urls.length} 个文件...`;

    try {
      const trackData = await uploadFitFileFromUrl(url);
      results.push(trackData);
    } catch (error) {
      errors.push({ url, error: error.message });
      console.warn(`文件上传失败: ${url}`, error);
    }
  }

  hideUploadProgress();

  if (errors.length > 0) {
    showToast(`成功 ${results.length} 个，失败 ${errors.length} 个`, results.length > 0 ? 'success' : 'error');
  } else {
    showToast(`成功导入 ${results.length} 个轨迹`);
  }

  return { success: results, failed: errors };
}

async function uploadFitFilesFromUrlsBatch(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return { success: [], failed: [] };
  }

  console.log('[DEBUG] uploadFitFilesFromUrlsBatch called with ' + urls.length + ' URLs');
  console.log('[DEBUG] current uploadedTracks count:', window.uploadedTracks.length);
  window.uploadedTracks.forEach(function(t, i) {
    console.log('[DEBUG] uploadedTracks[' + i + '] fit_url:', t.fit_url);
  });

  const results = [];
  const errors = [];
  const needsDownload = [];

  for (const url of urls) {
    const exists = window.uploadedTracks.some(t => t.fit_url === url);
    console.log('[DEBUG] URL ' + url + ' exists in uploadedTracks:', exists);
    if (!exists) {
      needsDownload.push(url);
    }
  }

  if (needsDownload.length === 0) {
    console.log('[DEBUG] 所有轨迹已在缓存中，跳过下载');
    await updateStats();
    return { success: [], failed: [] };
  }

  showToast(`正在加载 ${needsDownload.length} 个轨迹...`, 'info');
  
  const CONCURRENT_LIMIT = 4;

  async function downloadSingle(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const trackData = await parseFitFile(buffer);
      trackData.fit_file_name = url.split('/').pop() || 'remote.fit';
      trackData.fit_url = url;
      
      addTrackUnique(trackData);
      results.push(trackData);
      
      if (window.trackStorage) {
        await trackStorage.saveTrack(trackData, url);
      }
      
      return { success: true, trackData };
    } catch (error) {
      errors.push({ url, error: error.message });
      console.warn(`文件加载失败: ${url}`, error);
      return { success: false, url, error };
    }
  }

  const downloadBatches = [];
  for (let i = 0; i < needsDownload.length; i += CONCURRENT_LIMIT) {
    downloadBatches.push(needsDownload.slice(i, i + CONCURRENT_LIMIT));
  }

  for (const batch of downloadBatches) {
    await Promise.all(batch.map(url => downloadSingle(url)));
  }
  
  showToast(`已加载 ${results.length} 个轨迹`, 'success');

  for (const trackData of results) {
    try {
      renderTrackOnMap(trackData);
    } catch (renderError) {
      console.warn('渲染失败:', renderError);
    }
  }

  try {
    await updateStats();
  } catch (e) {
    console.error('更新统计失败:', e);
  }

  return { success: results, failed: errors };
}

window.triggerUpload = triggerUpload;
window.handleFileUpload = handleFileUpload;
window.hideUploadOverlay = hideUploadOverlay;
window.hideUploadProgress = hideUploadProgress;
window.uploadFitFileFromUrl = uploadFitFileFromUrl;
window.uploadFitFilesFromUrls = uploadFitFilesFromUrls;
window.uploadFitFilesFromUrlsBatch = uploadFitFilesFromUrlsBatch;

window.updateStats = updateStats;
window.updateCitySelector = updateCitySelector;
window.toggleCityDropdown = toggleCityDropdown;
window.switchCity = switchCity;
window.showToast = showToast;

window.uploadHandlerReady = true;

if (window.fitParserReady) {
  console.log('所有依赖已就绪');
}