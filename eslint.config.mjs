import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: ["src/generated/**", ".next/**", "node_modules/**", "scripts/reference/**", "next-env.d.ts"] },
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
export default config;
// Server components render once per request; Date.now() there is a request timestamp, not a re-render hazard.
config.push({ files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"], rules: { "react-hooks/purity": "off" } });
