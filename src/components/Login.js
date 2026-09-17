import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  // =====================================================
  // API
  // =====================================================

  const API_URL = "https://abdbac2-11.onrender.com";

  // =====================================================
  // State
  // =====================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/users`,
        {
          timeout: 20000,
        }
      );

      console.log("USERS RESPONSE:", response.data);

      const users = response.data;

      if (!Array.isArray(users)) {
        setError(
          "بيانات المستخدمين القادمة من السيرفر غير صحيحة"
        );
        return;
      }

      // البحث عن المستخدم
      const user = users.find(
        (item) =>
          String(item.email).trim().toLowerCase() ===
            String(email).trim().toLowerCase() &&
          String(item.password) ===
            String(password)
      );

      if (user) {
        // =================================================
        // حفظ بيانات المستخدم
        // =================================================

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        // =================================================
        // الانتقال إلى Dashboard
        // =================================================

        navigate("/dashboard");

      } else {
        setError(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );
      }

    } catch (error) {
      console.log(
        "LOGIN ERROR:",
        error
      );

      console.log(
        "STATUS:",
        error.response?.status
      );

      console.log(
        "DATA:",
        error.response?.data
      );

      console.log(
        "URL:",
        error.config?.url
      );

      if (
        error.code ===
        "ECONNABORTED"
      ) {
        setError(
          "السيرفر تأخر بالاستجابة، حاول مرة ثانية"
        );
      } else if (error.response) {
        setError(
          `حدث خطأ من السيرفر (${error.response.status})`
        );
      } else {
        setError(
          "حدث خطأ في الاتصال بالسيرفر"
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="login-page">

      <div className="login-card">

        {/* ==========================================
            Header
        =========================================== */}

        <div className="login-header">

          <div className="login-icon">
            🔐
          </div>

          <h1>
            تسجيل دخول الأدمن
          </h1>

          <p>
            قم بتسجيل الدخول للوصول إلى لوحة التحكم
          </p>

        </div>

        {/* ==========================================
            Form
        =========================================== */}

        <form onSubmit={handleLogin}>

          {/* Email */}

          <div className="login-input">

            <label>
              البريد الإلكتروني
            </label>

            <input
              type="email"
              placeholder="أدخل البريد الإلكتروني"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>

          {/* Password */}

          <div className="login-input">

            <label>
              كلمة المرور
            </label>

            <input
              type="password"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>

          {/* Error */}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* Login Button */}

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading
              ? "جاري تسجيل الدخول..."
              : "تسجيل الدخول"}
          </button>

        </form>

        {/* ==========================================
            Back
        =========================================== */}

        <button
          type="button"
          className="back-store-btn"
          onClick={() =>
            navigate("/products")
          }
        >
          ← العودة إلى المنتجات
        </button>

      </div>

    </div>
  );
}

export default Login;