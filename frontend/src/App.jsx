import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PanelControl from "./pages/PanelControl";
import ExpedientesClinicos from "./pages/ExpedientesClinicos";
import RegistroPacientes from "./pages/RegistroPacientes";
import Login from "./pages/Login";
import ControlAcceso from "./pages/ControlAcceso";
import Preconsulta from "./pages/Preconsulta";
import ConsultaMedica from "./pages/ConsultaMedica";

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem("auth");
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RoleRoute = ({ roles, children }) => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(auth.rol)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><PanelControl /></ProtectedRoute>} />
        <Route path="/expedientes" element={<ProtectedRoute><ExpedientesClinicos /></ProtectedRoute>} />
        <Route path="/registro" element={<ProtectedRoute><RegistroPacientes /></ProtectedRoute>} />
        <Route path="/admin" element={<RoleRoute roles={["administrador", "director", "medico"]}><ControlAcceso /></RoleRoute>} />
        <Route path="/preconsulta" element={<ProtectedRoute><Preconsulta /></ProtectedRoute>} />
        <Route path="/consulta" element={<ProtectedRoute><ConsultaMedica /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
