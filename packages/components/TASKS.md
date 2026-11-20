# TASK: Component polish — done

- [x] buat statement klarifikasi pada setiap readme.md nya, bahwa component hanya merupakan pabrik assembly element, jadi pada dasarnya stylingnya akan tetap berlaku dam dapat digunakan seperti css library biasa selama susunan / struktur / markup htmlnya sesuai konvensi setiap component. dan tentunya mudah dicustomize langsung meng-overrides selector atau melalui variabel token --app/--nama-component.
      lalu berikan juga struktur html dari masing-masing componentnya.

Landed 2026-11-21: every `packages/components/*/README.md` states the factory / CSS-library
contract in its lead paragraph and carries an `### Structure` block under `## Nodes` with the
assembled markup. `COMPONENT-CONVENTIONS.md` §1c / §4 / §14 record the requirement.

This file can be deleted; the rule now lives in `docs/framework/COMPONENT-CONVENTIONS.md`.
