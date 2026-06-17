import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@clerk/react";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey="pk_test_bGlnaHQtbW9jY2FzaW4tNjUuY2xlcmsuYWNjb3VudHMuZGV2JA">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);