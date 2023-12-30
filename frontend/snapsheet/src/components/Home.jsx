import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Home.css";
import { Link } from "react-router-dom";
function Home() {
  const [listsheet, setListSheet] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3030/list_collections"
        );
        setListSheet(response.data.collections_info);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const openSheet = (sheetName) => {};
  const onDeleteSheet = async (collection) => {
    try {
      const response = await axios.delete(
        `http://localhost:3030/delete_collection/${collection}`
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    const newlist = [...listsheet];

    var index = newlist.indexOf(collection);
    if (index > -1) {
      newlist.splice(index, 1);
    }
    setListSheet(newlist);
  };

  return (
    <div className="container">
      {listsheet ? (
        <div>
          <h2>All Sheets</h2>
          <div className="card-list">
            {listsheet.map((collection, index) => (
              <div key={index} className="card">
                <h3>
                  <Link to={`/sheet/${collection}`}> {collection}</Link>
                  <button onClick={() => onDeleteSheet(collection)}>
                    delete
                  </button>
                </h3>
                {/* Add more details if needed */}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default Home;
