# BoundaryFlow Codex Ready Asset Manifest

This package is organized for Codex ingestion.

## Folder structure

- `01_preconstruction_boards/`
  - The original 8 AIVIS preconstruction boards.
  - Use these as product, UX, IA, and visual-language source boards.

- `02_generated_asset_packs/`
  - The 7 generated support packs.
  - Use these as visual reference material and extraction sources.
  - Some of these should remain references rather than be pasted as static images.

## Recommended use in Codex

### Direct reference boards
1. `boundaryflow_v01_board_01_project_cover.png`
2. `boundaryflow_v01_board_02_project_overview.png`
3. `boundaryflow_v01_board_03_visual_system.png`
4. `boundaryflow_v01_board_04_information_architecture.png`
5. `boundaryflow_v01_board_05_key_screens_overview.png`
6. `boundaryflow_v01_board_06_ui_components.png`
7. `boundaryflow_v01_board_07_icons_illustration_assets.png`
8. `boundaryflow_v01_board_08_user_flow.png`

### Generated asset packs
1. `boundaryflow_asset_pack_01_wearable_master_pack.png`
2. `boundaryflow_asset_pack_02_boundary_field_master_pack.png`
3. `boundaryflow_asset_pack_03_custom_icon_pack_a.png`
4. `boundaryflow_asset_pack_04_custom_icon_pack_b_status_set.png`
5. `boundaryflow_asset_pack_05_glass_plates_brand_ui_chrome.png`
6. `boundaryflow_asset_pack_06_support_illustration_pack.png`
7. `boundaryflow_asset_pack_07_atmosphere_texture_pack.png`

## Important implementation note

- Asset Pack 02 (`boundaryflow_asset_pack_02_boundary_field_master_pack.png`) should primarily be treated as an SVG/component specification reference, not as a final raster image to paste directly.
- The 8 preconstruction boards should be treated as source-of-truth design boards.
- The generated asset packs are support material to accelerate implementation.
