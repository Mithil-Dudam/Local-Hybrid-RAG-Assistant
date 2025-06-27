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
    <div className="bg-black border-red-900 text-red-900 min-w-screen h-screen flex flex-col">
      <h1 className="text-center mt-10 text-6xl font-bold text-white">
        <span className="border-red-900 border-b">Local RAG Assistant</span>
      </h1>
      <div className="my-auto mx-auto border w-[80%] h-[80%] px-5 rounded overflow-auto">
        <MoveLeft className="mt-2 text-white cursor-pointer" onClick={GoBack} />
        <div className="w-full flex mt-10 mx-auto">
          <label className="w-[15%] text-center text-lg text-white">
            <span className="border-red-900 border-b">Enter query: </span>
          </label>
          <div className="flex w-full">
            <input
              className="w-full border border-red-900 rounded px-2 text-white focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900"
              type="text"
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  SendQuery();
                }
              }}
            />
            <button
              className="border px-2 text-lg ml-5 text-white border-red-900 rounded cursor-pointer hover:font-semibold"
              onClick={SendQuery}
            >
              Send
            </button>
          </div>
        </div>
        {error && <p className="text-red-500 text-center mt-10">{error}</p>}
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
            <p className="ml-2 text-white">Fetching Results</p>
          </div>
        )}
        {result && (
          <div className="border my-10 px-5 text-white text-lg border-red-900 py-2">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}

export default RAGAssistant;
