// 세 소스를 WeatherBundle로 조립. 입력에 좌표/격자/측정소가 있더라도
// 여기서 만들어지는 출력 객체에는 위치 식별자를 일절 포함하지 않는다.
export function buildWeatherBundle({ ncst, vilage, air, label, generatedAt }) {
  const current = {
    tempC: ncst.tempC,
    humidity: ncst.humidity,
    precip1h: ncst.precip1h,
    precipType: ncst.precipType,
    windDeg: ncst.windDeg,
    windSpeed: ncst.windSpeed,
    // 실황엔 SKY가 없어 단기예보 첫 시각 하늘로 보강
    sky: vilage.currentSky ?? null,
  };
  return {
    current,
    hourly: vilage.hourly,
    daily: vilage.daily,
    alerts: [], // 기상특보 — 후속 보강에서 채움(스키마 미리 고정)
    airQuality: air,
    meta: {
      generatedAt,
      sources: ['KMA', 'AirKorea'],
      locationLabel: label, // 임의 표시 라벨(좌표 아님)
    },
  };
}
