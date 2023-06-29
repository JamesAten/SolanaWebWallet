import logo from './logo.svg';
import './App.css';
import Header from './components/Header';
import ManageAccount from "./components/ManageAccount";
import SmartContract from "./components/SmartContract";

function App() {
  return (
    <div className="App">
        <Header />
        <ManageAccount />
    </div>
  );
}

export default App;
