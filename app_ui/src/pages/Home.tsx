import { useState } from "react";
import { useAppContext } from "./AppContext";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const { error, columns, setColumns, spinner, setSpinner } = useAppContext();
  // Upload file to backend and handle columns for CSV
  const UploadFile = async () => {
    if (!file) return;
    setSpinner(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.columns) {
        setColumns(response.data.columns);
      } else {
        setColumns([]);
        // If PDF, immediately create vector DB
        await CreateVectorDatabase();
      }
    } catch (err) {
      // Optionally handle error
    } finally {
      setSpinner(false);
    }
  };

  // Send selected columns to backend and create vector DB for CSV
  const CreateVectorDatabase = async () => {
    setSpinner(true);
    try {
      if (columns.length > 0) {
        await api.post(
          "/set-columns",
          new URLSearchParams({
            columns: JSON.stringify(columns),
            page_content: JSON.stringify(pageContent),
          })
        );
      }
      await api.post("/create-vector-database");
      setColumns([]);
      setFile(null);
      setFileName("");
      setPageContent([]);
      navigate("/rag");
    } catch (err) {
      // Optionally handle error
    } finally {
      setSpinner(false);
    }
  };
  const navigate = useNavigate();

  const [pageContent, setPageContent] = useState<string[]>([]);

  const ToggleColumn = (column: string) => {
    if (pageContent.includes(column)) {
      setPageContent(pageContent.filter((c) => c !== column));
    } else {
      setPageContent([...pageContent, column]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-red-950 flex flex-col items-center justify-center">
      <h1 className="text-6xl font-extrabold text-white drop-shadow-lg tracking-tight mb-10 mt-10 text-center">
        <span className="border-b-4 border-red-600 pb-2 px-4 rounded">Local RAG Assistant</span>
      </h1>
      <div className="bg-black/80 border border-red-900 rounded-2xl shadow-2xl p-10 w-full max-w-xl flex flex-col gap-6 animate-fade-in">
        <label className="block text-white text-lg font-semibold mb-2">Upload PDF or CSV</label>
        <label className="relative block w-full">
          <input
            type="file"
            accept=".pdf,.csv"
            className="hidden"
            onChange={handleImageChange}
            disabled={spinner}
          />
          <div className="flex items-center">
            <button
              type="button"
              className={`flex-1 bg-black/60 border border-red-900 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-900 transition ${spinner ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-red-950'}`}
              onClick={() => {
                if (spinner) return;
                const input = document.querySelector('input[type=file]') as HTMLInputElement | null;
                input?.click();
              }}
              disabled={spinner}
            >
              {fileName ? fileName : "Click to select a file..."}
            </button>
          </div>
        </label>
        <button
          className="bg-gradient-to-r from-red-700 to-red-500 px-5 py-2 text-lg text-white rounded-lg shadow hover:from-red-600 hover:to-red-400 font-bold transition"
          onClick={UploadFile}
          disabled={spinner || !file}
          style={spinner ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
        >
          {spinner ? "Uploading..." : "Upload"}
        </button>
        {columns.length > 0 && (
          <div className="mt-4">
            <label className="block text-white text-lg font-semibold mb-2">Select columns for page content:</label>
            <div className="flex flex-wrap gap-2">
              {columns.map((col) => (
                <button
                  key={col}
                  className={`px-3 py-1 rounded-full border-2 text-white font-semibold transition ${pageContent.includes(col) ? "bg-red-700 border-red-700" : "bg-black/60 border-red-900 hover:bg-red-900"}`}
                  onClick={() => ToggleColumn(col)}
                >
                  {col}
                </button>
              ))}
            </div>
            <button
              className="mt-4 bg-gradient-to-r from-red-700 to-red-500 px-5 py-2 text-lg text-white rounded-lg shadow hover:from-red-600 hover:to-red-400 font-bold transition"
              onClick={CreateVectorDatabase}
              disabled={spinner}
              style={spinner ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              {spinner ? "Processing..." : "Create Vector Database"}
            </button>
          </div>
        )}
        {error && <p className="text-red-400 text-center mt-4 font-semibold">{error}</p>}
        {spinner && (
          <div className="flex justify-center items-center my-4">
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
            <p className="ml-2 text-white">Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
