import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Badge, List, Spin, Tag, message } from 'antd';
import { chatService } from '../services/chatService';

export default function Chats() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAuthed = Boolean(localStorage.getItem('access'));
  const role = localStorage.getItem('role');

  useEffect(() => {
    async function loadChats() {
      try {
        setLoading(true);
        const data = await chatService.getConversations();
        setConversations(data);
      } catch (error) {
        console.error(error);
        message.error('Не удалось загрузить чаты');
      } finally {
        setLoading(false);
      }
    }

    if (isAuthed) loadChats();
  }, [isAuthed]);

  if (!isAuthed) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight text-gray-900">
            <span className="h-3 w-3 rounded-full bg-gray-900" />
            Недвижимость
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/profile" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Профиль</Link>
            {role === 'owner' && <Link to="/owner/properties" className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100">Мои объявления</Link>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-gray-900">Сообщения</h1>
          <p className="mt-1 text-sm text-gray-600">Диалоги клиента и собственника по объектам недвижимости.</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {loading ? (
            <div className="grid place-items-center py-12"><Spin /></div>
          ) : (
            <List
              dataSource={conversations}
              locale={{ emptyText: 'Диалогов пока нет' }}
              renderItem={(chat) => (
                <List.Item>
                  <Link to={`/chats/${chat.id}`} className="flex w-full items-center gap-4 rounded-xl p-3 hover:bg-gray-50">
                    <img
                      src={chat.property_image || 'https://via.placeholder.com/96x72?text=Нет+фото'}
                      alt={chat.property_title}
                      className="h-16 w-20 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate font-extrabold text-gray-900">{chat.property_title}</div>
                        {chat.unread_count > 0 && <Badge count={chat.unread_count} />}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {role === 'owner' ? `Клиент: ${chat.client_name}` : `Собственник: ${chat.owner_name}`}
                      </div>
                      <div className="mt-1 truncate text-sm text-gray-500">
                        {chat.last_message ? `${chat.last_message.sender_name}: ${chat.last_message.text}` : 'Сообщений пока нет'}
                      </div>
                    </div>
                    <Tag>Открыть</Tag>
                  </Link>
                </List.Item>
              )}
            />
          )}
        </div>
      </main>
    </div>
  );
}
