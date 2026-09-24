// Fills public/ (gitignored): the recorded footage and cursor tracks from
// ../capture/out, the self-hosted fonts, and the package logo.
import { copyFileSync, mkdirSync, readdirSync } from "node:fs"

mkdirSync("public/footage", { recursive: true })
mkdirSync("public/fonts", { recursive: true })
for (const file of readdirSync("../capture/out")) {
  if (file.endsWith(".mp4") || file.endsWith(".cursor.json")) {
    copyFileSync(`../capture/out/${file}`, `public/footage/${file}`)
  }
}
for (const weight of ["400", "500", "600"]) {
  const name = `inter-latin-${weight}-normal.woff2`
  copyFileSync(`node_modules/@fontsource/inter/files/${name}`, `public/fonts/${name}`)
}
copyFileSync(
  "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2",
  "public/fonts/jetbrains-mono-latin-500-normal.woff2",
)
copyFileSync("../../assets/logo.svg", "public/logo.svg")
console.log("public/ ready")
