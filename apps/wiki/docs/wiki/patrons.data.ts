import patronsJson from './patrons.json'

// 信仰神データ（tools/build-patrons-data.py が公式データから生成した patrons.json を読み込む）
export default {
  load() {
    return patronsJson
  },
}
