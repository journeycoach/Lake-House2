import type { MetadataRoute } from "next";

/* "Add to Home Screen" on family phones installs this like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paine Pointe",
    short_name: "Paine Pointe",
    description:
      "Paine Pointe: who is up, what needs doing, and how the house works.",
    start_url: "/",
    display: "standalone",
    background_color: "#123236",
    theme_color: "#123236",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
