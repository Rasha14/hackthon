
  import { createRoot } from "react-dom/client";
  import { AuthProvider } from "./contexts/AuthContext";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  // Initialize Firebase client (optional analytics)
  import "./services/firebase";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  