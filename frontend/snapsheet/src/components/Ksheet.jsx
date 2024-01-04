import React, { useState, useEffect } from "react";
import axios from "axios";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useParams } from "react-router-dom";
import ExcelSheet from "./ASGrid";

function NewSheet() {
  const { paramName } = useParams();
  const [treeData, setTreeData] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3030/get_entity/${paramName}`
        );
        setTreeData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  var headings, finaldata;
  var data = [];
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);

  useEffect(() => {
    const extractingData = async () => {
      try {
        if (treeData) {
          headings = extractHeadings(treeData[0]);
          treeData.forEach((doc) => {
            data.push(extractData(doc));
          });
          setRowData(data);
          setColDefs(headings);
        }
      } catch {
        console.log("fetchin...");
      }
    };
    extractingData();
  }, [treeData]);
  return (
    // Container with theme & dimensions
    <div>
      {treeData ? (
        <div className="ag-theme-quartz" style={{ height: 500 }}>
          <ExcelSheet
            rowData={rowData}
            columnData={colDefs}
            datatree={treeData}
            collection_name={paramName}
          />
        </div>
      ) : (
        <p>loading...</p>
      )}
    </div>
  );
}

const extractHeadings = (data) => {
  if (!data) {
    return null;
  }
  var finalHeadingList = [];
  const traverse = (node, currentPath) => {
    if (node.children && node.children.length > 0) {
      currentPath.push({ field: String(node.label) });
      node.children.forEach((child) => traverse(child, [...currentPath]));
    } else {
      currentPath.push({ field: String(node.label) });
      node.data.forEach((child) => {
        currentPath.push({ field: String(child.column_name), editable: true });
      });
      finalHeadingList = currentPath;
      return;
    }
  };
  traverse(data, []);
  finalHeadingList[0].editable = true;
  return finalHeadingList;
};

const extractData = (data) => {
  if (!data) {
    return null;
  }

  let finalDataObject = [];

  const traverse = (node, currentPath) => {
    if (node.children && node.children.length > 0) {
      const newPath = {
        ...currentPath,
        [String(node.label)]: String(node.name),
      };
      node.children.forEach((child) => traverse(child, newPath));
    } else {
      const newPath = {
        ...currentPath,
        [String(node.label)]: String(node.name),
      };
      node.data.forEach((child) => {
        newPath[String(child.column_name)] = String(child.value);
      });
      finalDataObject.push(newPath);
    }
    if (node.children && node.children.length > 0) {
      finalDataObject.push({
        "field 3": node.data
      });
    }
  };

  traverse(data, {});
  return finalDataObject;
};

export default NewSheet;
// export default NewSheet;
