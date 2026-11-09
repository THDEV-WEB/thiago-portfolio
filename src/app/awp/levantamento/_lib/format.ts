// Datas sempre no horário de Brasília, igual no servidor e no navegador
// (evita diferença de hidratação e de relatório conforme o fuso do aparelho).
const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const time = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return Number.isNaN(d.getTime()) ? "—" : dateTime.format(d);
}

export function formatTime(d: Date): string {
  return time.format(d);
}

export function fileStamp(d: Date): string {
  return d.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
}
