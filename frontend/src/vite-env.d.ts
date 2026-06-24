/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_APP_NAME?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
