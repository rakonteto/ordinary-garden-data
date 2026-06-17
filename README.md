# ordinary-garden-data

"보통의 정원" 앱의 정적 데이터 발행소. GitHub Pages로 서빙한다.

## 발행물

| 파일 | 내용 | 발행 방식 |
|---|---|---|
| `weather.json` | 기상청·에어코리아 날씨/미세먼지 | **GitHub Actions 자동** (10분 cron — `.github/workflows/publish-weather.yml`) |
| `plants.json` | 농사로 식물 도감 (정원식물 garden) | **로컬 수동** (아래) |

## plants.json 발행 (로컬에서)

농사로 API(`api.nongsaro.go.kr`)는 **해외 IP(GitHub Actions 러너)를 차단**하므로 Actions에서 자동 발행할 수 없다. 국내(한국) IP에서 로컬로 발행한다. 식물 정보는 거의 불변이라 가끔 수동 발행으로 충분하다.

```bash
# data.go.kr에서 발급받은 농사로 서비스키 필요
NONGSARO_SERVICE_KEY='발급키' npm run publish:plants

# 생성된 plants.json을 커밋·푸시 (Pages 배포는 weather 워크플로가 함께 처리)
git add public/plants.json
git commit -m "data: plants.json 갱신"
git push
```

푸시 후 다음 `publish-weather` 실행(≤10분) 시 `public/` 전체가 Pages에 배포되어 `plants.json`도 함께 갱신된다. 즉시 반영하려면 Actions 탭에서 `Publish weather`를 수동 실행한다.

- 발행 URL: `https://rakonteto.github.io/ordinary-garden-data/plants.json`
- 설계·구현 문서: 앱 repo `ordinary-garden`의 `docs/superpowers/`.

## 테스트

```bash
node --test
```
