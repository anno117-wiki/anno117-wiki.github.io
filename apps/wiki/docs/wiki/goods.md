---
title: 商品一覧（生産チェーン・全商品一覧へ移動しました）
description: 商品一覧は、生産チェーン・全商品一覧のページにまとめました。
head:
  - - meta
    - name: robots
      content: noindex
  - - meta
    - http-equiv: refresh
      content: 0; url=/wiki/production-chains
---

<script setup lang="ts">
import { onMounted } from 'vue'
import { withBase } from 'vitepress'

// 以前の「商品一覧」のURLで来た人（アンカー付きを含む）を、生産チェーン・全商品一覧へ移す
onMounted(() => {
  window.location.replace(withBase('/wiki/production-chains') + window.location.hash)
})
</script>

# 商品一覧

商品一覧は、[生産チェーン・全商品一覧](/wiki/production-chains)にまとめました。自動で移動しない場合は、リンクを押してください。
