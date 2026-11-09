// Acesso protegido ao localStorage: em modo anônimo ou com dados bloqueados
// ele pode falhar, e a ferramenta precisa continuar funcionando sem ele.

export const BASE_PATH_CLIENT = "/awp/levantamento";

export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento local: o banco continua sendo a fonte das respostas.
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // idem
  }
}
