import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "poleinlove",
    short_name: "poleinlove",
    description: "폴댄스 기술 기록과 회고를 위한 개인 아카이브",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
