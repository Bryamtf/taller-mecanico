import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">MIAUTONORT</h1>
            <div className="space-x-4">
              <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">
                Inicio
              </Link>
              <Link to="/citas" className="hover:bg-blue-700 px-3 py-2 rounded">
                Citas
              </Link>
              <Link
                to="/clientes"
                className="hover:bg-blue-700 px-3 py-2 rounded"
              >
                Clientes
              </Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto p-4">
          <Routes>
            <Route
              path="/"
              element={
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Bienvenido a MIAUTONORT
                  </h2>
                  <p className="text-gray-600">
                    Sistema de gestión para taller mecánico AUTONORT PERU SAC
                  </p>
                  <div className="mt-4 p-4 bg-green-100 rounded">
                    <p className="text-green-800">
                      ✅ Frontend funcionando correctamente
                    </p>
                    <p className="text-green-800 mt-2">
                      Backend API:{" "}
                      {import.meta.env.VITE_API_URL ||
                        "http://localhost:3001/api"}
                    </p>
                  </div>
                </div>
              }
            />
            <Route
              path="/citas"
              element={
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">Gestión de Citas</h2>
                  <p className="text-gray-600">Módulo en construcción...</p>
                </div>
              }
            />
            <Route
              path="/clientes"
              element={
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Gestión de Clientes
                  </h2>
                  <p className="text-gray-600">Módulo en construcción...</p>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
