import { useEffect, useState } from "react";
import { useAppContext } from "./AppContext";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const { setError, error, spinner, setSpinner } = useAppContext();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const UploadFile = async () => {
    setError(null);
    if (!file) {
      setError("Upload a pdf or csv file");
      return;
    }
    setSpinner(true);
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    try {
      const response = await api.post("/upload-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.status === 201) {
        try {
          await api.post("/create-vector-database");
          navigate("/rag");
        } catch (error: any) {
          setError("Error: Couldnt upload file");
        }
      }
    } catch (error: any) {
      setError("Error: Couldnt upload file");
    } finally {
      setSpinner(false);
    }
  };

  useEffect(() => {
    if (file) {
      setError(null);
    }
  }, [file]);

  return (
    <div className="bg-black border-red-900 text-red-900 min-w-screen min-h-screen flex flex-col">
      <h1 className="text-center mt-10 text-6xl font-bold text-white">
        <span className="border-red-900 border-b">Local RAG Assistant</span>
      </h1>
      <div className="my-auto mx-auto border w-[80%] h-[80%] rounded">
        <h1 className="text-center text-3xl my-10 text-white font-semibold">
          <span className="border-red-900 border-b">
            Add Your File <span className="font-normal">(PDF,CSV)</span>
          </span>
        </h1>
        <label className="flex items-center px-4 py-2 bg-white text-black border-gray-300 rounded cursor-pointer hover:bg-gray-100 transition w-[10%] mx-auto my-10">
          <span className="mx-auto">Choose File</span>
          <input
            type="file"
            accept=".pdf,.csv"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
        {fileName && (
          <div className="my-10 truncate flex items-center justify-center">
            <p className=" text-gray-300 my-auto text-lg">
              <span className="border-red-900 border-b">{fileName}</span>
            </p>
          </div>
        )}
        <div className="my-10 flex">
          <button
            className="cursor-pointer mx-auto p-2 text-white rounded bg-red-950 border-red-900 border"
            onClick={UploadFile}
            disabled={spinner}
          >
            {spinner ? "Uploading" : "Upload File"}
          </button>
        </div>
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
            <p className="ml-2 text-white">Uploading & processing...</p>
          </div>
        )}
        {error && <p className="text-red-500 text-center my-10">{error}</p>}
      </div>
    </div>
  );
}

export default Home;
