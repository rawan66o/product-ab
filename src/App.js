import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import Login from "./components/Login";
import Products from "./components/Products";
import Checks from "./components/Checks";
import OnlinePayment from "./components/OnlinePayment";
import "./App.css";
import Daily from "./components/Daily";
import Debts from "./components/Debts";
import Capital from "./components/Capital";

// =========================================
// Protected Route
// =========================================

function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// =========================================
// Dashboard
// =========================================

function Dashboard() {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const logout = () => {
    localStorage.removeItem("user");

    window.location.href = "/products";
  };

  return (
    <div
      className="dashboard"
      dir="rtl"
      lang="ar"
    >

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

  <Link
    to="/checks"
    className="sidebar-link"
  >
    📊 الكشوف
  </Link>

  <Link
    to="/online-payment"
    className="sidebar-link"
  >
    💳 الدفع الإلكتروني
  </Link>
    <Link
    to="/diaries"
    className="sidebar-link"
  >
   📦 اليوميات
  </Link>
      <Link
    to="/debts"
    className="sidebar-link"
  >
   📦 الديون
  </Link>

     <Link
    to="/capital"
    className="sidebar-link"
  >
   📊 النشرة  
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

// =========================================
// App
// =========================================

function App() {
  return (
    <div
      lang="ar"
      dir="rtl"
      className="app"
    >

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
                <Route
            path="/capital"
            element={
              <ProtectedRoute>
              <Capital/>
              </ProtectedRoute>
            }
          />


          {/* Checks */}

          <Route
            path="/checks"
            element={
              <ProtectedRoute>
                <Checks />
              </ProtectedRoute>
            }
          />
                <Route
            path="/checks"
            element={
              <ProtectedRoute>
                <Checks />
              </ProtectedRoute>
            }
          />
              <Route
            path="/diaries"
            element={
          
            <Daily/>
           
            }
          />
               <Route
            path="/debts"
            element={
          
            <Debts/>
           
            }
          />
        
          <Route
  path="/online-payment"
  element={<OnlinePayment />}
/>

          {/* Wrong URL */}

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

    </div>
  );
}

export default App;