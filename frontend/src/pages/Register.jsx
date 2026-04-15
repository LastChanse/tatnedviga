import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);

    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (!username || username.length < 3) {
      setError("Минимум 3 символа в имени пользователя");
      setLoading(false);
      return;
    }

    if (!email) {
      setError("Введите email");
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/user/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.error || data.detail || "Ошибка регистрации");
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Регистрация</h1>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={onFinish}>
          <div className="auth-form-group">
            <input
              type="text"
              name="username"
              placeholder="Имя пользователя"
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <input
              type="password"
              name="password"
              placeholder="Пароль"
              className="auth-input"
            />
          </div>

          <div className="auth-form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Подтвердите пароль"
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Загрузка..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;