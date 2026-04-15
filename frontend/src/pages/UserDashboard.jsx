import { getStoredUser } from "../auth";

function UserDashboard() {
    const user = getStoredUser();

    return (
        <section className="page-container">
            <h1>Интерфейс пользователя</h1>
            <p>Добро пожаловать, {user?.full_name || user?.email}.</p>
            <ul>
                <li>Просмотр доступных помещений</li>
                <li>Отправка заявок и запросов</li>
                <li>Управление своим профилем</li>
            </ul>
        </section>
    );
}

export default UserDashboard;
