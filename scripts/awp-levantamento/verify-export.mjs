// Confere a integridade de um JSON exportado pelo painel (formato, contagens
// e SHA-256). Não acessa banco nenhum.
//
//   node scripts/awp-levantamento/verify-export.mjs caminho/do/arquivo.json
import { readFileSync } from "node:fs";
import { verifyExportFile } from "./lib.mjs";

const path = process.argv[2];
if (!path) {
  console.error("Uso: node scripts/awp-levantamento/verify-export.mjs <arquivo.json>");
  process.exit(1);
}

const file = JSON.parse(readFileSync(path, "utf8"));
const result = verifyExportFile(file);

if (result.ok) {
  console.log(`OK: ${path}`);
  console.log(`Gerado em ${file.generated_at}, SHA-256 ${file.sha256}`);
  for (const [table, count] of Object.entries(file.counts)) console.log(`  ${table}: ${count}`);
} else {
  console.error(`FALHOU: ${path}`);
  for (const p of result.problems) console.error(`  - ${p}`);
  process.exit(2);
}
