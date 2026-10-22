import { defineConfig } from "tinacms";

export default defineConfig({
  branch: "main",
  clientId: "IL_TUO_CLIENT_ID_TINA", // Lo trovi nel dashboard di Tina.io
  token: "IL_TUO_TOKEN_TINA",       // Lo trovi nel dashboard di Tina.io
  build: {
    outputFolder: "admin",
    publicFolder: "/",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "/",
    },
  },
  schema: {
    collections: [
      {
        name: "page",
        label: "Pagine",
        path: "content",
        format: "html",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titolo Pagina",
            isTitle: true,
            required: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Contenuto della pagina",
            isBody: true,
          },
        ],
      },
    ],
  },
});
