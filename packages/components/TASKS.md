# TASK: Component polish — what is left

## 0. Restructuring Package, Flow yang saya mau, kamu rumuskan cyclenya.

**Detail + fase P0–P5: `docs/framework/TASK-restructure.md`** (realita terukur, target graph, gate per
fase). Ringkasnya: P0 edge manifest ✅, P1 DOMRenderer folder + kit (defer ke P5), P2 `app` ke `core` +
hapus `frameworks` (v0.2.4) ✅, P3 styles jadi dependency core ✅, P4 bundle `AioUI` satu file ✅,
P5 (defer).

- [ ] Masalah `DOMRenderer` ini juga module bebas, karena ini kan tugasnya building element. design awal dia tidak membutuhkan siapapun, tapi karena ada fn yg bisa dishare module lain akhirnya diextract ke utilities.
      sebenarnya saya juga tidak masalah ketika domrenderer di install dia sekaligus menginstall utilities.
      tapi alangkah lebih baik kalau punya domrenderer punya kit exclusivenya sendiri. jadi meskipun itu duplicate saya ga masalah.

- [ ] untuk `modules/` saya sementara ga ada masalah