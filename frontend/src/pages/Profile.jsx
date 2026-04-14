import { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { Card, Button, Input, Form, message } from "antd";

function Profile() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/profile/")
      .then((res) => {
        form.setFieldsValue(res.data);
        setLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    navigate("/login");
  };

  const onFinish = (values) => {
    api.put("/api/profile/", values)
      .then(() => {
        message.success("Profile updated");
        setEditing(false);
      })
      .catch(() => {
        message.error("Update failed");
      });
  };

  if (loading) return <div className="text-center mt-10 text-black">Loading...</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">

        <h1 className="text-2xl font-bold text-center mb-6 text-black">
          Profile
        </h1>

        <Form form={form} layout="vertical" onFinish={onFinish}>

          {/* Username */}
          <Form.Item label={<span className="text-black">Username</span>} name="username">
            <Input
              disabled={!editing}
              className="text-black"
            />
          </Form.Item>

          {/* Email */}
          <Form.Item
            label={<span className="text-black">Email</span>}
            name="email"
            rules={[{ type: "email", message: "Invalid email" }]}
          >
            <Input
              disabled={!editing}
              className="text-black"
            />
          </Form.Item>

          {/* Password (только при редактировании) */}
          {editing && (
            <Form.Item
              label={<span className="text-black">New Password</span>}
              name="password"
              rules={[{ min: 6, message: "Min 6 chars" }]}
            >
              <Input.Password
                placeholder="Leave empty to keep current"
                className="text-black"
              />
            </Form.Item>
          )}

          {/* Кнопки */}
          {!editing ? (
            <Button
              type="primary"
              block
              onClick={() => setEditing(true)}
              className="mt-2"
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                htmlType="submit"
                block
                className="mt-2"
              >
                Save Changes
              </Button>

              <Button
                block
                className="mt-2"
                onClick={() => {
                  setEditing(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </>
          )}
        </Form>

        <Button
          danger
          block
          className="mt-4"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Card>
    </div>
  );
}

export default Profile;