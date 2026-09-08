import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const navigate = useNavigate();


  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");

    try {

      const response = await axios.get(
        "http://localhost:3001/users"
      );

      const users = response.data;


      const user = users.find(
        (user) =>
          user.email === email &&
          user.password === password
      );


      if (user) {

        // حفظ بيانات الأدمن
        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        // الانتقال إلى Dashboard
        navigate("/dashboard");

      } else {

        setError(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );

      }

    } catch (error) {

      console.log(error);

      setError(
        "حدث خطأ في الاتصال بالسيرفر"
      );

    }

  };


  return (

    <div className="login-page">

      <div className="login-card">


        {/* Header */}
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


        {/* Form */}
        <form onSubmit={handleLogin}>


          {/* Email */}
          <div className="login-input">

            <label>
              البريد الإلكتروني
            </label>

            <input
              type="email"
              placeholder="admin@gmail.com"
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
              placeholder="123456"
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


          {/* Button */}
          <button
            type="submit"
            className="login-btn"
          >
            تسجيل الدخول
          </button>


        </form>


        {/* Back */}
        <button
          className="back-store-btn"
          onClick={() => navigate("/products")}
        >
          ← العودة إلى المنتجات
        </button>


      </div>

    </div>

  );
}

export default Login;