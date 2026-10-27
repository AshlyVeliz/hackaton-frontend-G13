import { Navigate, createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Sagas from "./pages/Sagas";
import SagaStory from "./pages/SagaStory";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import Wanted from "./pages/Wanted";
import WantedDetail from "./pages/WantedDetail";

export const router = createBrowserRouter([
  // Rutas públicas: solo sin sesión
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ],
  },
  // Rutas privadas: PrivateRoute decide si deja pasar o manda al login
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <Dashboard /> },
          {
            path: "/wanted",
            element: <Wanted />,
            // Ruta hija: el detalle se dibuja ENCIMA del listado (en su <Outlet />),
            // así el listado nunca se desmonta y al volver está exactamente igual.
            children: [{ path: ":id", element: <WantedDetail /> }],
          },
          {
            path: "/news",
            element: <News />,
            // Igual que en /wanted: el detalle se abre encima y el feed conserva su posición.
            children: [{ path: ":id", element: <NewsDetail /> }],
          },
          { path: "/sagas", element: <Sagas /> },
          { path: "/sagas/:id", element: <SagaStory /> },
        ],
      },
    ],
  },
  // 404: cualquier ruta que no exista
  { path: "*", element: <NotFound /> },
]);
