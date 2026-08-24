---
applyTo: "packages/**,apps/demo-site/**,tests/**"
---

# Playable paths

Simulation stateはsafe integerだけで表し、60 Hz固定tickで更新する。Simulation
packageではruntime乱数、時計、三角関数、暗黙順序へ依存しない。Rendererのfloatを
stateへ戻さない。BrowserからGitHub APIを呼ばない。
