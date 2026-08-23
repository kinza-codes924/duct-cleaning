/** Tailwind theme shared by every page in /public.
 *  Rebuild the stylesheet after changing this: npm run build:css
 */
module.exports = {
  content: ["./public/**/*.html", "./public/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
          "colors": {
                "outline-variant": "#c3c6d1",
                "error-container": "#ffdad6",
                "surface-tint": "#3a5f94",
                "surface-container-lowest": "#ffffff",
                "on-primary-fixed": "#001b3c",
                "surface-bright": "#fcf9f8",
                "on-surface-variant": "#43474f",
                "surface-container-high": "#ebe7e7",
                "primary-container": "#003366",
                "on-tertiary": "#ffffff",
                "background": "#fcf9f8",
                "on-primary-fixed-variant": "#1f477b",
                "on-error": "#ffffff",
                "tertiary-container": "#003a3e",
                "on-secondary-fixed-variant": "#364a4d",
                "surface-container": "#f0edec",
                "primary": "#001e40",
                "surface-dim": "#dcd9d9",
                "on-secondary-fixed": "#091f21",
                "inverse-primary": "#a7c8ff",
                "surface-container-highest": "#e5e2e1",
                "inverse-on-surface": "#f3f0ef",
                "surface-container-low": "#f6f3f2",
                "inverse-surface": "#313030",
                "surface-variant": "#e5e2e1",
                "error": "#ba1a1a",
                "secondary-container": "#d0e7ea",
                "secondary-fixed-dim": "#b4cbce",
                "tertiary-fixed": "#7df4ff",
                "on-error-container": "#93000a",
                "primary-fixed-dim": "#a7c8ff",
                "outline": "#737780",
                "tertiary-fixed-dim": "#5dd8e2",
                "secondary-fixed": "#d0e7ea",
                "on-tertiary-fixed-variant": "#004f54",
                "on-primary-container": "#799dd6",
                "tertiary": "#002326",
                "on-secondary": "#ffffff",
                "on-surface": "#1c1b1b",
                "surface": "#fcf9f8",
                "on-tertiary-fixed": "#002022",
                "on-secondary-container": "#53686b",
                "secondary": "#4d6265",
                "primary-fixed": "#d5e3ff",
                "on-background": "#1c1b1b",
                "on-primary": "#ffffff",
                "on-tertiary-container": "#1facb6"
          },
          "spacing": {
                "margin-mobile": "20px",
                "stack-lg": "80px",
                "stack-md": "32px",
                "unit": "8px",
                "container-max": "1200px",
                "stack-sm": "16px",
                "margin-desktop": "64px",
                "gutter": "24px"
          },
          "fontFamily": {
                "label-md": [
                      "Inter",
                      "ui-sans-serif",
                      "system-ui",
                      "sans-serif"
                ],
                "headline-md": [
                      "Inter",
                      "ui-sans-serif",
                      "system-ui",
                      "sans-serif"
                ],
                "body-md": [
                      "Inter",
                      "ui-sans-serif",
                      "system-ui",
                      "sans-serif"
                ],
                "display-lg": [
                      "Inter",
                      "ui-sans-serif",
                      "system-ui",
                      "sans-serif"
                ],
                "headline-lg": [
                      "Inter",
                      "ui-sans-serif",
                      "system-ui",
                      "sans-serif"
                ],
                "headline-lg-mobile": [
                      "Inter",
                      "ui-sans-serif",
                      "system-ui",
                      "sans-serif"
                ],
                "body-lg": [
                      "Inter",
                      "ui-sans-serif",
                      "system-ui",
                      "sans-serif"
                ],
                "sans": [
                      "Inter",
                      "sans-serif"
                ]
          },
          "fontSize": {
                "label-md": [
                      "14px",
                      {
                            "lineHeight": "1",
                            "letterSpacing": "0.05em",
                            "fontWeight": "600"
                      }
                ],
                "headline-md": [
                      "24px",
                      {
                            "lineHeight": "1.3",
                            "fontWeight": "600"
                      }
                ],
                "body-md": [
                      "16px",
                      {
                            "lineHeight": "1.6",
                            "fontWeight": "400"
                      }
                ],
                "display-lg": [
                      "64px",
                      {
                            "lineHeight": "1.1",
                            "letterSpacing": "-0.02em",
                            "fontWeight": "700"
                      }
                ],
                "headline-lg": [
                      "40px",
                      {
                            "lineHeight": "1.2",
                            "letterSpacing": "-0.01em",
                            "fontWeight": "700"
                      }
                ],
                "headline-lg-mobile": [
                      "32px",
                      {
                            "lineHeight": "1.2",
                            "fontWeight": "700"
                      }
                ],
                "body-lg": [
                      "18px",
                      {
                            "lineHeight": "1.6",
                            "fontWeight": "400"
                      }
                ]
          }
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/container-queries")],
};
