import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { IconContext } from "@phosphor-icons/react";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/public-sans/index.css";
import "./styles/index.css";
import { router } from "./app/router";
import { installPointerLight } from "./lib/pointer-light";
import { resolveTheme, TEXT_SIZE_PX, usePrefs } from "./store/prefs";

// Apply the theme before first paint to avoid a flash.
document.documentElement.dataset.theme = resolveTheme(usePrefs.getState().theme);
document.documentElement.style.fontSize = `${TEXT_SIZE_PX[usePrefs.getState().textSize] ?? 17}px`;
installPointerLight();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <IconContext.Provider value={{ size: 20, weight: "regular", mirrored: false }}>
      <RouterProvider router={router} />
    </IconContext.Provider>
  </StrictMode>,
);
