import Navbar from "../components/Navbar";

import "../styles/Home.css";

function Home() {
  return (
    <div className="home-container">
      <Navbar />
      <h1>Welcome to the Application</h1>
      <p>You are logged in!</p>
    </div>
  );
}

export default Home;
