import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import Login from "./components/Login";
import Products from "./components/Products";

import "./App.css";


// ===============================
// Protected Route
// ===============================

function ProtectedRoute({ children }) {

  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// ===============================
// Dashboard
// ===============================

function Dashboard() {

  const user = JSON.parse(
    localStorage.getItem("user")
  );


  const logout = () => {

    localStorage.removeItem("user");

    window.location.href = "/products";

  };


  return (

    <div className="dashboard">


      {/* Sidebar */}

      <aside className="sidebar">

        <div className="logo">
          لوحة التحكم
        </div>


        <nav className="sidebar-nav">

          <Link
            to="/dashboard"
            className="sidebar-link active"
          >
            🏠 الرئيسية
          </Link>


          <Link
            to="/products"
            className="sidebar-link"
          >
            📦 المنتجات
          </Link>

        </nav>


        <button
          className="logout-btn"
          onClick={logout}
        >
          تسجيل الخروج
        </button>

      </aside>


      {/* Main */}

      <main className="dashboard-main">

        <div className="dashboard-header">

          <h1>
            أهلاً بك 👋
          </h1>

          <p>
            {user?.email}
          </p>

        </div>


        <div className="dashboard-cards">


          {/* Products */}

          <div className="dashboard-card">

            <div className="card-icon">
              📦
            </div>

            <h3>
              المنتجات
            </h3>

            <p>
              إدارة وإضافة وتعديل وحذف المنتجات
            </p>

            <Link
              to="/products"
              className="card-btn"
            >
              إدارة المنتجات
            </Link>

          </div>


          {/* User */}

          <div className="dashboard-card">

            <div className="card-icon">
              👤
            </div>

            <h3>
              المستخدم
            </h3>

            <p>
              {user?.email}
            </p>

          </div>


          {/* Dashboard */}

          <div className="dashboard-card">

            <div className="card-icon">
              📊
            </div>

            <h3>
              لوحة التحكم
            </h3>

            <p>
              إدارة المتجر من مكان واحد
            </p>

          </div>


        </div>

      </main>

    </div>

  );
}


// ===============================
// App
// ===============================

function App() {

  return (

    <BrowserRouter>

      <Routes>


        {/* Home */}

        <Route
          path="/"
          element={
            <Navigate
              to="/products"
              replace
            />
          }
        />


        {/* Products */}

        <Route
          path="/products"
          element={<Products />}
        />


        {/* Login */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* Dashboard */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* Any wrong URL */}

        <Route
          path="*"
          element={
            <Navigate
              to="/products"
              replace
            />
          }
        />


      </Routes>

    </BrowserRouter>

  );
}

export default App;