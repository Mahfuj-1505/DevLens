import React from "react";
import "./App.css";
import FruitList from "./components/Fruits";
import ChatBox from "./components/ChatBox";

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Fruit & Chat Management App</h1>
      </header>
      <main>
        <FruitList />
        <hr />
        <ChatBox />
      </main>
    </div>
  );
};

export default App;
