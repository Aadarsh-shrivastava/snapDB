import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/sb">schemabuildeer</Link>
          </li>
          {/* <li>{<Link to="/sheet">Sheet</Link>}</li> */}
        </ul>
      </nav>

      <Outlet />
    </>
  );
};
export default Layout;
