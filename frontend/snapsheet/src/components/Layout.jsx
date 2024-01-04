import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <nav className="navbar bg-body-tertiary">
        <div className="container-fluid">
          <Link className="navbar-brand mb-0 h1" to="/">Home</Link>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link active" to="/sb">Schema Builder</Link>
            </li>
          </ul>
        </div>
      </nav>
      <div className="m-5">
        <Outlet />
      </div>
    </>
  );
};
export default Layout;
