import { useEffect } from "react";
import api from "../api";
import { useAppContext } from "./AppContext";
import { MoveLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function RAGAssistant() {
  const {
    setError,
    error,
    query,
    setQuery,
    setResult,
    result,
    spinner,
    setSpinner,
  } = useAppContext();
  const navigate = useNavigate();

  const SendQuery = async () => {
    setError(null);
    if (query === "") {
      setError("Enter your query");
      return;
    }
    setResult("");
    setSpinner(true);
    const formData = new FormData();
    formData.append("query", query);
    try {
      const response = await api.post("/query", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 200) {
        setQuery("");
        setSpinner(false);
        setResult(response.data.message);
      }
    } catch (error: any) {
      setError("Error: Couldnt upload file");
    }
  };

  useEffect(() => {
    if (query !== "") {
      setError(null);
    }
  }, [query]);

  const GoBack = () => {
    setQuery("");
    setError(null);
    setResult("");
    navigate("/home");
  };

  return (
    <div className="min-w-screen h-screen flex flex-col bg-gradient-to-br from-black via-gray-900 to-red-950">
      <h1 className="text-center mt-10 text-6xl font-extrabold text-white drop-shadow-lg tracking-tight">
        <span className="border-b-4 border-red-600 pb-2 px-4 rounded">Local RAG Assistant</span>
      </h1>
      <div className="my-auto mx-auto shadow-2xl bg-black/80 border border-red-900 w-full max-w-2xl min-h-[400px] px-8 py-8 rounded-2xl flex flex-col overflow-auto relative">
        <button
          className="absolute top-6 left-6 p-2 rounded-full bg-black/60 border border-red-900 text-white hover:bg-red-900 hover:text-white transition shadow-lg"
          onClick={GoBack}
          aria-label="Back"
        >
          <MoveLeft size={28} />
        </button>
        <div className="w-full flex flex-col gap-6 mt-10">
          <label className="text-lg text-white font-semibold mb-2">
            <span className="border-b-2 border-red-600 pb-1">Enter query:</span>
          </label>
          <div className="flex w-full gap-3">
            <input
              className="w-full border border-red-900 rounded-lg px-3 py-2 text-white bg-black/60 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-900 placeholder-gray-400 transition"
              type="text"
              placeholder="Ask anything about your document..."
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (spinner) return;
                if (e.key === "Enter") {
                  SendQuery();
                }
              }}
              disabled={spinner}
              style={spinner ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            />
            <button
              className="bg-gradient-to-r from-red-700 to-red-500 px-5 py-2 text-lg text-white rounded-lg shadow hover:from-red-600 hover:to-red-400 font-bold transition"
              onClick={SendQuery}
              disabled={spinner}
              style={spinner ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              Send
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-center mt-8 font-semibold">{error}</p>}
        {spinner && (
          <div className="flex justify-center items-center my-10">
            <svg
              className="animate-spin h-6 w-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="ml-2 text-white">Fetching Results...</p>
          </div>
        )}
        {result && (
          <div className="bg-gradient-to-br from-gray-900 via-black to-red-950 border border-red-700 my-10 px-6 py-4 text-white text-lg rounded-xl shadow-lg max-w-full break-words animate-fade-in">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}

export default RAGAssistant;
