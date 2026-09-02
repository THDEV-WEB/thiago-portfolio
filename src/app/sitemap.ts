import type { MetadataRoute } from "next";

const BASE_URL = "https://thiago.valionsistemas.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/trajetoria", "/projetos", "/projetos/encanto", "/contato"];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
