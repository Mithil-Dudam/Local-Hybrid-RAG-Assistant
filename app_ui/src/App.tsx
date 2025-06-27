import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import RAGAssistant from "./pages/RAGAssistant";
import PageNotFound from "./pages/PageNotFound";
import { AppContextProvider } from "./pages/AppContext";

function App() {
  return (
    <AppContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/rag" element={<RAGAssistant />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
    </AppContextProvider>
  );
}

export default App;
