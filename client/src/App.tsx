import { useEffect, useState } from "react";
import "./index.css";

type ApiResponse = {
    message: string;
    application: string;
    status: string;
};

export function App() {
    const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/")
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }

                return response.json();
            })
            .then((data: ApiResponse) => {
                setApiResponse(data);
            })
            .catch((err: Error) => {
                setError(err.message);
            });
    }, []);

    return (
        <div className="app">
            <h1>My application is deployed on Fly.io!</h1>

            <h2>.NET API Connection</h2>

            {error && <p>Connection error: {error}</p>}

            {!apiResponse && !error && <p>Loading API response...</p>}

            {apiResponse && (
                <div>
                    <p><strong>Message:</strong> {apiResponse.message}</p>
                    <p><strong>Application:</strong> {apiResponse.application}</p>
                    <p><strong>Status:</strong> {apiResponse.status}</p>
                </div>
            )}
        </div>
    );
}

export default App;
