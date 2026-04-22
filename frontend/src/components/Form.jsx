import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form as AntForm, Input, Button, Card, Spin, Select } from "antd";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import axios from "axios";

const { Option } = Select;

export default function Form({ route, method }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const name = method === "login" ? "Вход" : "Регистрация";

  const handleSubmit = async (values) => {
    setLoading(true);

    try {
      const res = await api.post(route, values);

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

        try {
          const profileRes = await axios.get("http://localhost:8000/api/profile/", {
            headers: { Authorization: `Bearer ${res.data.access}` }
          });
          localStorage.setItem("role", profileRes.data.role);
        } catch (e) {
          console.error("Не удалось получить роль:", e);
          if (res.data.role) {
            localStorage.setItem("role", res.data.role);
          }
        }

        navigate("/");
      } else {
        try {
          const loginRes = await api.post("/api/token/", {
            username: values.username,
            password: values.password
          });
          
          localStorage.setItem(ACCESS_TOKEN, loginRes.data.access);
          localStorage.setItem(REFRESH_TOKEN, loginRes.data.refresh);
          localStorage.setItem("role", values.role || "client");
          
          navigate("/");
        } catch (loginError) {
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Ошибка:", error);
      alert(error?.response?.data?.detail || error?.response?.data?.username || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <Card
        className="w-full max-w-md rounded-2xl border border-gray-200 shadow-sm"
        styles={{ body: { padding: 24 } }}
      >
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">
          {name}
        </h1>

        <AntForm 
          layout="vertical" 
          onFinish={handleSubmit} 
          initialValues={{ role: "client" }}
        >
          {method === "register" && (
            <AntForm.Item
              name="role"
              rules={[{ required: true, message: "Выберите роль" }]}
            >
              <Select size="large" placeholder="Выберите роль" className="rounded-xl">
                <Option value="client">Клиент</Option>
                <Option value="owner">Собственник</Option>
              </Select>
            </AntForm.Item>
          )}
      
          <AntForm.Item
            name="username"
            rules={[{ required: true, message: "Введите логин" }]}
          >
            <Input size="large" placeholder="Логин" className="rounded-xl" />
          </AntForm.Item>

          <AntForm.Item
            name="password"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password size="large" placeholder="Пароль" className="rounded-xl" />
          </AntForm.Item>

          <AntForm.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              className="!rounded-xl !bg-gray-900 !border-gray-900 hover:!bg-gray-800"
              disabled={loading}
            >
              {loading ? <Spin /> : name}
            </Button>
          </AntForm.Item>
        </AntForm>

        <div className="text-center text-sm text-gray-600 mt-2">
          {method === "login" ? (
            <>
              Нет аккаунта?{" "}
              <a href="/register" className="font-bold text-gray-900 hover:underline">
                Зарегистрироваться
              </a>
            </>
          ) : (
            <>
              Уже есть аккаунт?{" "}
              <a href="/login" className="font-bold text-gray-900 hover:underline">
                Войти
              </a>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}