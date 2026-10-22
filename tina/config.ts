import { defineConfig } from "tinacms";

export default defineConfig({
  branch: "main",
  clientId: "f94823dc-3603-4061-899e-cc2426d522c5", // Lo trovi nel dashboard di Tina.io
  token: "c5f1d4b70df66591ab2fbff01846ca344dd9dac6",       // Lo trovi nel dashboard di Tina.io
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
