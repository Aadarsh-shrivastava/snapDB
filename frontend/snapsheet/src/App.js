import "./App.css";
import TreeEditor from "./components/SchemaBuilder";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Layout from "./components/Layout";
import Ksheet from "./components/Ksheet";

function App() {
  return (
    <div className="App">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossOrigin="anonymous" />
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossOrigin="anonymous"></script>
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
