import cityStatusJson from './city-status.json'

// 街の状況の段階データ（tools/build-city-status-data-v3.py がゲーム内データから生成した city-status.json を読み込む）
export default {
  load() {
    return cityStatusJson
  },
}
