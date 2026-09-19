import splendorJson from './splendor.json'

// 輝きランクデータ（tools/build-splendor-data.py が公式データから生成した splendor.json を読み込む）
export default {
  load() {
    return splendorJson
  },
}
