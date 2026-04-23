/**
 * 距离计算工具函数
 * 使用 Haversine 公式计算两个经纬度坐标之间的直线距离
 */

/**
 * 计算两个经纬度坐标之间的距离（单位：公里）
 * @param lat1 起点纬度
 * @param lng1 起点经度
 * @param lat2 终点纬度
 * @param lng2 终点经度
 * @returns 距离（公里）
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // 地球半径（公里）

  // 将经纬度转换为弧度
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * 将角度转换为弧度
 * @param degrees 角度
 * @returns 弧度
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * 格式化距离显示
 * @param distance 距离（公里）
 * @returns 格式化后的字符串
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}米`
  }
  return `${distance.toFixed(1)}公里`
}

/**
 * 根据距离计算建议运费（基础参考价）
 * @param distance 距离（公里）
 * @param basePrice 基础单价（元/公里，默认 5 元/公里）
 * @returns 建议运费
 */
export function calculateSuggestedFare(
  distance: number,
  basePrice: number = 5
): number {
  // 基础运费 = 距离 × 单价
  const baseFare = distance * basePrice

  // 最低起运费 30 元
  const minFare = 30

  return Math.max(baseFare, minFare)
}
