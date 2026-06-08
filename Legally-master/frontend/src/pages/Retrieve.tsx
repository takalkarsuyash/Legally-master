import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const Retrieve = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/retrieve`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log("API response:", data?.data?.data?.fileList);

        // Defensive fallback
        setFiles(data?.data?.data?.fileList || []);
      } catch (err: any) {
        console.error("Error fetching files:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="p-6">
      {files.map((f) => (
        <div key={f.id} className="mb-4 p-4 border rounded shadow">
          <p className="text-black font-semibold">{f.fileName}</p>
          <p className="text-gray-600 text-sm">CID: {f.cid}</p>
          <a
            href={`https://gateway.lighthouse.storage/ipfs/${f.cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            Download
          </a>
        </div>
      ))}
    </div>
  );
};

export default Retrieve;
