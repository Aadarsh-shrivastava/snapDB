import React, { useState, useEffect } from "react";
import axios from "axios";
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useParams } from "react-router-dom";
import ExcelSheet from "./ASGrid";

function NewSheet() {
  const { paramName } = useParams();
  const [treeData, setTreeData] = useState(null);
  const [temptreeData, setTemptreeData] = useState(null);
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
  var tempData = [];
  const [rowData, setRowData] = useState([]);
  const [colDefs, setColDefs] = useState([]);

  useEffect(() => {
    const extractingData = async () => {
      try {
        if (treeData) {
          headings = extractHeadings(treeData[0]);
          treeData.forEach((doc) => {
            let a = extractData(doc);
            data.push(a[0]);
            tempData.push(a[1]);
          });

          if (treeData[0].data.length > 0) {
            var entityTotal = Array(treeData[0].data.length).fill(0);
            treeData.forEach((node) => {
              const valuesArray = node.data.map((item) => item.value);
              entityTotal = sumArrays(entityTotal, valuesArray);
            });
            var newrow = {};
            const keyArrays = treeData[0].data.map((item) => item.column_name);
            keyArrays.forEach((keys, index) => {
              newrow[keys] = entityTotal[index];
            });
            console.log(newrow);
            newrow[treeData[0].label]='total';
            data.push([newrow]);
          }

          setRowData(data);
          setColDefs(headings);
          setTemptreeData(tempData);
        }
      } catch {
        console.log("fetchin...");
      }
    };
    extractingData();
  }, [treeData]);
  var cal = 0,
    rd = [];
  if (treeData) cal = calDrillDown(treeData[0]) + 1;

  return (
    <div>
      {treeData ? (
        <div className="ag-theme-quartz" style={{ height: 500 }}>
          {/* {JSON.stringify(rowData)} */}
          <ExcelSheet
            rowData={rowData}
            columnData={colDefs}
            datatree={temptreeData}
            collection_name={paramName}
            drillCount={cal}
          />
          {/* {JSON.stringify(rowData)} */}
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

const calDrillDown = (node) => {
  if (!node) {
    return 0; // Return 0 for nodes without children
  }

  let drilldowncount = 0;

  const traverse = (node, depth) => {
    if (node.children && node.children.length > 0) {
      depth += 1;
      drilldowncount = Math.max(drilldowncount, depth); // Update max depth
      node.children.forEach((child) => traverse(child, depth));
    }
  };

  traverse(node, 0);
  return drilldowncount;
};
const extractData = (data) => {
  if (!data) {
    return null;
  }

  const newDataTree = JSON.parse(JSON.stringify(data));

  let finalDataObject = [];

  const traverse = (node, currentPath) => {
    var totalsPath = {};
    if (node.children && node.children.length > 0) {
      const newPath = {
        ...currentPath,
        [String(node.label)]: String(node.name),
      };
      totalsPath = { ...totalsPath, ...newPath }; // Merge newPath into totalsPath
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
      let summedUpArray = Array.from(
        { length: node.children[0].data.length },
        () => 0
      );
      node.children.forEach((child) => {
        if (!totalsPath[String(child.label)])
          totalsPath[String(child.label)] = "total";
        const valuesArray = child.data.map((item) => item.value);
        summedUpArray = sumArrays(summedUpArray, valuesArray);
      });
      const headingsArray = node.children[0].data.map(
        (item) => item.column_name
      );
      const resultObject = {};

      for (let i = 0; i < headingsArray.length; i++) {
        totalsPath[headingsArray[i]] = summedUpArray[i];
        resultObject[headingsArray[i]] = summedUpArray[i];
      }

      node.data = JSON.parse(JSON.stringify(node.children[0].data));

      node.data.forEach((child, index) => (child.value = summedUpArray[index]));

      finalDataObject.push(totalsPath);
    }
  };
  traverse(newDataTree, {});
  return [finalDataObject, newDataTree];
};

function sumArrays(arr1, arr2) {
  // Check if the arrays are of the same length
  if (arr1.length !== arr2.length) {
    throw new Error("Arrays must be of the same length");
  }

  // Sum up the arrays index-wise
  const result = [];
  for (let i = 0; i < arr1.length; i++) {
    result.push(arr1[i] + arr2[i]);
  }
  return result;
}
// const extractEntitySum=(rowData)=>{
//   const newRowData=JSON.parse(JSON.stringify(rowData));

// }

const sumAllEntities = () => {};

export default NewSheet;
