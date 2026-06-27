# Workspace Shell Polish Design

## Goal

Merapikan area `/workspace` di luar bubble chat agar satu bahasa visual dengan pass `Claude-style chat polish`.

Scope:

- `WorkspaceShell`
- `WorkspaceIconRail`
- `WorkspaceSidebar`
- `WorkspaceTopbar`
- `NotificationCenter`
- `app/workspace/projects/[projectId]/page.tsx`

## Design Direction

- hilangkan nuansa neon/grid yang masih terlalu "dashboard AI template"
- gunakan palet hangat netral yang sama dengan chat baru
- pertahankan struktur informasi dan perilaku runtime yang sudah ada
- perjelas hierarchy visual pada rail, sidebar, topbar, drawer notifikasi, dan project detail

## Shell

- background utama lebih tenang dan lebih flat
- glow dinamis dan mesh grid dihapus
- modal/loading surfaces disamakan dengan shell baru

## Navigation

- icon rail dibuat lebih premium dan tidak terlalu teknis
- topbar dipadatkan dan dibuat lebih editorial
- sidebar menggunakan project history yang lebih mudah dibaca, dengan footer cards lebih ringan

## Notifications

- drawer notifikasi mengikuti tone stone/ink
- unread/read state tetap jelas tanpa glow agresif

## Project Detail

- tab, summary card, task list, file list, dan settings card diselaraskan dengan chat shell
- empty states dibuat lebih bersih
- task history dan linked chat tetap mempertahankan data flow sekarang

## Non-Goals

- tidak mengubah route
- tidak mengubah task runtime
- tidak mengubah approval logic
- tidak mengubah data contract workspace
