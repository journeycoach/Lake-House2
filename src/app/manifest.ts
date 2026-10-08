import type { MetadataRoute } from "next";

/* "Add to Home Screen" on family phones installs this like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paine Pointe",
    short_name: "Paine Pointe",
    description:
      "Paine Pointe: who is up, what needs doing, and how the house works.",
    id: "/",
    start_url: "/",
    scope: "/",
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
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Shopping list",
        short_name: "Shopping",
        description: "Add or check off items",
        url: "/shopping-list",
        icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
      },
      {
        name: "Report an issue",
        short_name: "Report issue",
        description: "Flag something that needs fixing",
        url: "/upkeep/report-issue",
        icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
      },
      {
        name: "Calendar",
        short_name: "Calendar",
        description: "See who's staying and when",
        url: "/calendar",
        icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
      },
    ],
  };
}
