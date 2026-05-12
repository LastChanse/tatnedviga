import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Col, Form, Input, List, Row, Space, Statistic, Tag, message } from "antd";
import { ArrowLeftOutlined, FileTextOutlined, HomeOutlined, LogoutOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
import api from "../api";
import { favoriteService } from "../services/favoriteService";
import { requestService } from "../services/requestService";
import { propertyService } from "../services/propertyService";
import OwnerIncomingRequests from "../components/OwnerIncomingRequests.jsx";

const requestStatus = {
  pending: "На рассмотрении",
  approved: "Подтверждена",
  rejected: "Отклонена",
  completed: "Завершена",
};

export default function ProfileDashboard() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [requests, setRequests] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const role = profile?.role || localStorage.getItem("role") || "client";
  const isOwner = role === "owner";
  const activeRequests = requests.filter((item) => ["pending", "approved"].includes(item.status));
  const viewsCount = properties.reduce((sum, item) => sum + (item.views_count || 0), 0);

  useEffect(() => {
    async function loadData() {
      try {
        const profileResponse = await api.get("/api/profile/");
        setProfile(profileResponse.data);
        form.setFieldsValue(profileResponse.data);

        const requestResult = await requestService.getRequests().catch(() => []);
        setRequests(requestResult);

        if ((profileResponse.data.role || localStorage.getItem("role")) === "owner") {
          const ownerProperties = await propertyService.getOwnerProperties().catch(() => []);
          setProperties(ownerProperties);
          setFavorites([]);
        } else {
          const favoriteResult = await favoriteService.getFavorites().catch(() => []);
          setFavorites(favoriteResult);
        }
      } catch (error) {
        console.error(error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [form, navigate]);

  const saveProfile = async (values) => {
    try {
      setSaving(true);
      const response = await api.patch("/api/profile/", values);
      setProfile(response.data);
      form.setFieldsValue(response.data);
      message.success("Профиль обновлён");
    } catch (error) {
      console.error(error);
      message.error("Не удалось обновить профиль");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-gray-600">Загрузка профиля...</div>;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-gray-900">
            <span className="h-3 w-3 rounded-full bg-gray-900" />
            Недвижимость
          </Link>
          <Space wrap>
            <Link to="/" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
              <ArrowLeftOutlined /> На главную
            </Link>
            {isOwner && (
              <Link to="/owner/properties" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                Мои объявления
              </Link>
            )}
            {!isOwner && (
              <Link to="/favorites" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">
                Избранное
              </Link>
            )}
            <Button danger icon={<LogoutOutlined />} onClick={logout}>Выйти</Button>
          </Space>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-6 rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-900/5 to-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <UserOutlined />
                <Tag color={isOwner ? "green" : "blue"}>{isOwner ? "Собственник" : "Клиент"}</Tag>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">{profile?.first_name || profile?.username}</h1>
              <p className="mt-2 text-gray-600">{isOwner ? "Кабинет собственника: объявления, заявки и статистика." : "Кабинет клиента: избранное, заявки и статусы просмотров."}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {!isOwner && <Card size="small"><Statistic title="Избранное" value={favorites.length} /></Card>}
              <Card size="small"><Statistic title={isOwner ? "Входящие заявки" : "Мои заявки"} value={requests.length} prefix={<FileTextOutlined />} /></Card>
              {isOwner && <Card size="small"><Statistic title="Просмотры" value={viewsCount} prefix={<HomeOutlined />} /></Card>}
            </div>
          </div>
        </section>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="Личные данные" className="rounded-2xl border-gray-200">
              <Form form={form} layout="vertical" onFinish={saveProfile}>
                <Form.Item label="Username" name="username" rules={[{ required: true, message: "Введите username" }]}>
                  <Input />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Некорректный email" }]}>
                  <Input />
                </Form.Item>
                <Row gutter={12}>
                  <Col xs={24} md={12}><Form.Item label="Имя" name="first_name"><Input /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item label="Фамилия" name="last_name"><Input /></Form.Item></Col>
                </Row>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} block>
                  Сохранить изменения
                </Button>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              {isOwner && <OwnerIncomingRequests />}

              {!isOwner && (
                <Card title="Статус текущих взаимодействий" className="rounded-2xl border-gray-200">
                  <List
                    dataSource={activeRequests}
                    locale={{ emptyText: "Нет активных взаимодействий" }}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`Заявка #${item.id} · ${requestStatus[item.status] || item.status}`}
                          description={`${item.requested_date} в ${item.requested_time}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              <Card title={isOwner ? "Опубликованные объекты" : "Избранные объекты"} className="rounded-2xl border-gray-200">
                <List
                  dataSource={isOwner ? properties : favorites}
                  locale={{ emptyText: isOwner ? "У вас пока нет объявлений" : "В избранном пока пусто" }}
                  renderItem={(item) => {
                    const property = isOwner ? item : item.property;
                    return (
                      <List.Item actions={[<Link key="open" to={`/property/${property.id}`}>Открыть</Link>]}> 
                        <List.Item.Meta
                          title={property.title}
                          description={isOwner ? `${property.is_active ? "Активно" : "Неактивно"} · ${property.views_count || 0} просмотров` : property.address || "Адрес не указан"}
                        />
                      </List.Item>
                    );
                  }}
                />
              </Card>

              {!isOwner && (
                <Card title="История заявок на просмотр" className="rounded-2xl border-gray-200">
                  <List
                    dataSource={requests}
                    locale={{ emptyText: "Заявок пока нет" }}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`Заявка #${item.id}`}
                          description={`${item.requested_date} в ${item.requested_time} · ${requestStatus[item.status] || item.status}`}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}
            </Space>
          </Col>
        </Row>
      </main>
    </div>
  );
}
