## Polishing tasks

1. [x] tambah `config.color` : `{ title?: string; subtitle?: string; icon?: string; metadata?: string }`
       — tiap field menulis satu token `--header-*` di root; field yang kosong tetap ikut tema.
2. [x] `.meta` sejajar dengan `.title` dan `.subtitle` saat `iconPosition` bernilai `left`/`right`
       (hanya `.divider` yang tetap selebar blok).3. [x] `config.appearance` : `normal | bordered | block | editorial` — bentuk blok, bukan palet.
       `bordered`/`block` berbagi padding + radius; `editorial` = rule atas, face formal, meta byline.
3. [x] `config.color.block` (`--header-surface-bg`) dan `config.color.border`
       (`--header-surface-border`).
4. [x] pintu umum `config.selectors[@key].color` — ditulis sebagai inline `color` oleh
       `Base._applyNodeAttributes`, jadi menang atas sheet. `.subtitle`/`.meta` memakai
       `currentColor` supaya ikut warna root. (eksperimen lintas komponen, bukan khusus Header)
