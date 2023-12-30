import "./App.css";
import TreeEditor from "./components/SchemaBuilder";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Layout from "./components/Layout";
import Ksheet from "./components/Ksheet";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home></Home>} />
            <Route path="sb" element={<TreeEditor />} />
            <Route path="/sheet/:paramName" element={<Ksheet />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
