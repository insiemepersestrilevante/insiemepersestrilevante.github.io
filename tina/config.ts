import { defineConfig } from "tinacms";

export default defineConfig({
  branch: "main",
  clientId: "f94823dc-3603-4061-899e-cc2426d522c5", // Sostituisci con il Client ID preso dalla dashboard di Tina.io
  token: "c5f1d4b70df66591ab2fbff01846ca344dd9dac6",         // Sostituisci con il Read-Only Token preso da Tina.io
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
        name: "pagine",
        label: "Pagine del sito",
        path: "/",
        format: "html",
        fields: [
          {
            type: "string",
            name: "title",
            label: "Titolo",
            isTitle: true,
            required: true,
          },
          {
            type: "rich-text",
            name: "body",
            label: "Contenuto",
            isBody: true,
          },
        ],
      },
    ],
  },
});
