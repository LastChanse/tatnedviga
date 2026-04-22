import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Input,
  Form,
  message,
  Tag,
  Space,
  Typography,
  Divider,
  List,
  Avatar,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  CrownOutlined,
  HomeOutlined,
  SettingOutlined,
  LogoutOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  MailOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

function getRoleConfig(role) {
  switch (role) {
    case "admin":
      return {
        title: "Администратор",
        color: "red",
        icon: <CrownOutlined />,
        subtitle: "Управление системой, пользователями и модерацией",
      };
    case "publisher":
      return {
        title: "Выкладыватель объявлений",
        color: "gold",
        icon: <HomeOutlined />,
        subtitle: "Управление публикациями и своими объектами",
      };
    default:
      return {
        title: "Пользователь",
        color: "blue",
        icon: <UserOutlined />,
        subtitle: "Личный кабинет и настройки аккаунта",
      };
  }
}

function RoleSection({ role }) {
  if (role === "admin") {
    return (
      <Card title="Панель администратора" className="shadow-sm">
        <List
          dataSource={[
            "Модерация объявлений",
            "Управление пользователями",
            "Контроль жалоб и обращений",
            "Системные настройки платформы",
          ]}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
        <Space wrap className="mt-4">
          <Button type="primary">Открыть модерацию</Button>
          <Button>Пользователи</Button>
          <Button>Жалобы</Button>
        </Space>
      </Card>
    );
  }

  if (role === "publisher") {
    return (
      <Card title="Кабинет выкладывателя" className="shadow-sm">
        <List
          dataSource={[
            "Создание новых объявлений",
            "Редактирование опубликованных объектов",
            "Просмотр статистики по объявлениям",
            "Управление архивом публикаций",
          ]}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
        <Space wrap className="mt-4">
          <Button type="primary">Создать объявление</Button>
          <Button>Мои объявления</Button>
          <Button>Статистика</Button>
        </Space>
      </Card>
    );
  }

  return (
    <Card title="Кабинет пользователя" className="shadow-sm">
      <List
        dataSource={[
          "Просмотр личных данных",
          "Избранные объявления",
          "История действий",
          "Настройки аккаунта",
        ]}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
      <Space wrap className="mt-4">
        <Button type="primary">Избранное</Button>
        <Button>История</Button>
        <Button>Настройки</Button>
      </Space>
    </Card>
  );
}

function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/profile/")
      .then((res) => {
        setProfile(res.data);
        form.setFieldsValue({
          username: res.data.username,
          email: res.data.email,
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          password: "",
        });
      })
      .catch(() => {
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [form, navigate]);

  const role = profile?.role || "client";
  const roleConfig = useMemo(() => getRoleConfig(role), [role]);

  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    navigate("/login");
  };

  const onFinish = async (values) => {
    const payload = { ...values };

    if (!payload.password) {
      delete payload.password;
    }

    try {
      const res = await api.put("/api/profile/", payload);
      setProfile(res.data);
      form.setFieldsValue({
        ...res.data,
        password: "",
      });
      setEditing(false);
      message.success("Профиль обновлён");
    } catch (error) {
      message.error("Не удалось обновить профиль");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      form.setFieldsValue({
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        password: "",
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
  <div
    style={{
      minHeight: "100vh",
      background: "#eef3f8",
      padding: "32px 16px",
    }}
  >
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="shadow-sm">
            <div style={{ textAlign: "center" }}>
              <Avatar size={88} icon={<UserOutlined />} />
              <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
                {profile?.first_name || profile?.last_name
                  ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
                  : profile?.username}
              </Title>

              <Tag color={roleConfig.color} icon={roleConfig.icon}>
                {roleConfig.title}
              </Tag>

              <div style={{ marginTop: 16 }}>
                <Text type="secondary">{roleConfig.subtitle}</Text>
              </div>

              <Divider />

              <Space direction="vertical" size="small">
                <Text>
                  <UserOutlined /> {profile?.username}
                </Text>
                <Text>
                  <MailOutlined /> {profile?.email || "Email не указан"}
                </Text>
                <Text>
                  <TeamOutlined />{" "}
                  {profile?.groups?.length ? profile.groups.join(", ") : "Без групп"}
                </Text>
              </Space>

              <Divider />

              <Space wrap style={{ justifyContent: "center" }}>
                {!editing ? (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setEditing(true)}
                  >
                    Редактировать
                  </Button>
                ) : (
                  <>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={() => form.submit()}
                    >
                      Сохранить
                    </Button>
                    <Button icon={<CloseOutlined />} onClick={handleCancel}>
                      Отмена
                    </Button>
                  </>
                )}

                <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                  Выйти
                </Button>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <RoleSection role={role} />

            <Card title="Личные данные" className="shadow-sm">
              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Имя пользователя"
                      name="username"
                      rules={[{ required: true, message: "Введите username" }]}
                    >
                      <Input disabled={!editing} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[{ type: "email", message: "Некорректный email" }]}
                    >
                      <Input disabled={!editing} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Имя" name="first_name">
                      <Input disabled={!editing} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label="Фамилия" name="last_name">
                      <Input disabled={!editing} />
                    </Form.Item>
                  </Col>

                  {editing && (
                    <Col xs={24}>
                      <Form.Item
                        label="Новый пароль"
                        name="password"
                        rules={[
                          {
                            min: 6,
                            message: "Минимум 6 символов",
                          },
                        ]}
                      >
                        <Input.Password placeholder="Оставь пустым, если не меняешь" />
                      </Form.Item>
                    </Col>
                  )}
                </Row>
              </Form>
            </Card>

            <Card title="Быстрые действия" className="shadow-sm">
              <Space wrap>
                <Button icon={<SettingOutlined />}>Настройки</Button>
                <Button icon={<UserOutlined />}>Безопасность</Button>
                {role === "publisher" && <Button icon={<HomeOutlined />}>Мои объекты</Button>}
                {role === "admin" && <Button icon={<CrownOutlined />}>Админ-инструменты</Button>}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  </div>
  );
}

export default Profile;