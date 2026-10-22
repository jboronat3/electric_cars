# Pendientes

## Ajustes de seguridad en GitHub (hacer a mano)

- [ ] **Ramas protegidas** — *Settings → Rules → Rulesets → New branch ruleset*: aplicar a `main` con *Restrict deletions* y *Block force pushes*.
- [ ] **Seguridad del código** — *Settings → Advanced Security* (o *Code security*): activar *Dependabot alerts*, *Secret scanning*, *Push protection* y *Private vulnerability reporting*.
- [ ] **Permisos de Actions** — *Settings → Actions → General → Workflow permissions*: *Read repository contents* y desmarcar *Allow GitHub Actions to create and approve pull requests*.
- [ ] **Pages** — *Settings → Pages*: *Source* = **GitHub Actions** (solo publica los archivos de la web y quita el despliegue duplicado) y marcar **Enforce HTTPS**.
- [ ] **Cuenta** — activar la verificación en dos pasos en <https://github.com/settings/security>.
- [ ] Revisar las pull requests de Dependabot antes de aceptarlas.
