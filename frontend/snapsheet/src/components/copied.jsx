import React, { useState, useEffect } from "react";
import { useSelectionContainer } from "@air/react-drag-to-select";
import "./ExcelSheet.css";
import "scrollable-component";
const ExcelSheet = ({ rowData, columnData, datatree, collection_name }) => {
  const [dataTree, setDataTree] = useState([]);
  const [data, setData] = useState([]);
  const [headings, setheadings] = useState([]);

  useEffect(() => {
    setDataTree(datatree);
  }, [datatree]);

  useEffect(() => {
    setData(rowData);
  }, [rowData]);

  useEffect(() => {
    setheadings(columnData);
  }, [columnData]);

  const handleCellChange = (
    sheetIndex,
    rowIndex,
    columnField,
    value,
    colIndex
  ) => {
    const newData = [...data];
    if (colIndex == 0) {
      newData[sheetIndex].forEach((datum) => {
        datum[columnField.field] = value;
      });
      updateRootInTree(sheetIndex, value, "cell", 0);
    } else {
      newData[sheetIndex][rowIndex][columnField] = value;
    }
    setData(newData);
    const path = Object.values(data[sheetIndex][rowIndex]);
    updateTreeNodes(sheetIndex, path, columnField, value);
  };

  const updateRootInTree = (sheetIndex, new_value, updateType, oldValue) => {
    setDataTree((prevDataTree) => {
      const newDataTree = JSON.parse(JSON.stringify(prevDataTree));

      if (updateType === "cell") {
        newDataTree[sheetIndex].name = new_value;
      } else if (updateType === "heading") {
        newDataTree.forEach((element) => {
          element.label = new_value;
        });

        const newData = data.map((sheet) =>
          sheet.map((element) => {
            if (element.hasOwnProperty(oldValue)) {
              element[new_value] = element[oldValue];
              delete element[oldValue];
            }
            return element;
          })
        );

        setData(newData);
      }

      return newDataTree;
    });
  };

  const updateTreeNodes = (sheetIndex, path, column_name, new_value) => {
    setDataTree((prevDataTree) => {
      const newDataTree = JSON.parse(JSON.stringify(prevDataTree));

      const findNodeByPath = (node, path, pathIndex = 0) => {
        // console.log(path[pathIndex]);
        if (
          node.children &&
          node.children.length === 0 &&
          path[pathIndex] === node.name
        ) {
          node.data.forEach((element) => {
            if (element["column_name"] === column_name.field) {
              element.value = new_value;
            }
          });
          return node.data;
        }

        if (
          !node ||
          pathIndex >= path.length ||
          node.name !== path[pathIndex]
        ) {
          return null; // Node not found
        }

        if (pathIndex === path.length - 1) {
          return node; // Node found
        }

        // Continue traversing to the next level
        for (const child of node.children) {
          const result = findNodeByPath(child, path, pathIndex + 1);
          if (result) {
            return result; // Node found in one of the children
          }
        }

        return null; // Node not found in this branch
      };

      const result = findNodeByPath(newDataTree[sheetIndex], path, 0);
      recalTotal();
      return newDataTree;
    });
  };

  const handleHeadingChange = (columnIndex, value) => {
    const newHeadings = headings;
    if (columnIndex == 0) {
      console.log(newHeadings);
      updateRootInTree(0, value, "heading", newHeadings[columnIndex].field);
    } else {
      replaceHeadingsInDataAndTree(headings[columnIndex].field, value);
    }
    newHeadings[columnIndex].field = value;
    setheadings(newHeadings);
  };

  const replaceHeadingsInDataAndTree = (oldValue, newValue) => {
    const newData = data.map((sheet) =>
      sheet.map((element) => {
        if (element.hasOwnProperty(oldValue)) {
          element[newValue] = element[oldValue];
          delete element[oldValue];
        }
        return element;
      })
    );

    setData(newData);

    changeColumnNameInDataTree(oldValue, newValue);
  };

  const addEntity = () => {
    const newDataTree = JSON.parse(JSON.stringify(dataTree));
    const newEntity = JSON.parse(JSON.stringify(newDataTree[0])); // Create a deep copy
    if (newEntity) {
      const traverse = (node) => {
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => traverse(child));
        } else {
          if (node.data) {
            node.data.forEach((entry) => {
              entry["value"] = 0;
            });
          }
        }
      };
      traverse(newEntity);
    }
    newDataTree.push(newEntity);
    setDataTree([...newDataTree]); // Update state with a new array
    const newData = [...data];
    const newArr = newData[0];
    const newObject = {};
    newArr.forEach((element) => {
      newObject[element[headings[0].field]] = 0;
    });
    newData.push(newArr);
    setData([...newData]); // Update state with a new array
  };

  const changeColumnNameInDataTree = (oldColumnName, newColumnName) => {
    setDataTree((prevDataTree) => {
      const newDataTree = JSON.parse(JSON.stringify(prevDataTree));

      const traverse = (node) => {
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => traverse(child));
        } else {
          if (node.data) {
            node.data.forEach((entry) => {
              if (entry["column_name"] === oldColumnName) {
                entry["column_name"] = newColumnName;
              }
            });
          }
        }
      };

      newDataTree.forEach((root) => {
        traverse(root);
      });

      return newDataTree;
    });
  };

  const onAddData = () => {
    const newHeadings = [...headings];
    const heading = `field ${headings.length}`;
    newHeadings.push({ field: heading, editable: true });
    setheadings(newHeadings);
    const newData = [...data];
    newData.forEach((sheet) => {
      sheet.forEach((datum) => {
        datum[heading] = 0;
      });
    });
    addDataInDataTree(heading);
  };

  const deleteColumn = (column_name) => {
    console.log(column_name);
    const newHeadings = [...headings];

    const index = newHeadings.findIndex(
      (heading) => heading.field === column_name
    );

    if (index > -1) {
      newHeadings.splice(index, 1);
    }

    setheadings(newHeadings);

    const newData = [...data];

    newData.forEach((sheet) => {
      sheet.forEach((datum) => {
        delete datum[column_name];
      });
    });

    setData(newData);

    setDataTree((prevDataTree) => {
      const newDataTree = JSON.parse(JSON.stringify(prevDataTree));

      const traverse = (node) => {
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => traverse(child));
        } else {
          if (node.data) {
            node.data = node.data.filter(
              (entry) => entry["column_name"] !== column_name
            );
          }
        }
      };

      newDataTree.forEach((root) => {
        traverse(root);
      });

      return newDataTree;
    });
  };

  const addDataInDataTree = (column_name) => {
    setDataTree((prevDataTree) => {
      // Create a deep copy of the dataTree
      const newDataTrees = JSON.parse(JSON.stringify(prevDataTree));

      const traverse = (node) => {
        if (node.children && node.children.length > 0) {
          node.children.forEach((child) => traverse(child));
        } else {
          // Make sure 'data' property exists before pushing
          if (!node.data) {
            node.data = [];
          }

          node.data.push({ column_name: column_name, value: 0 });
        }
      };

      newDataTrees.forEach((newDataTree) => {
        traverse(newDataTree);
      });

      return newDataTrees;
    });
  };

  const recalTotal = () => {
    // if (!data) {
    //   return null;
    // }
    const data = JSON.parse(JSON.stringify(dataTree));
    console.log(data);

    let finalDataObject = [];

    // const traverse = (node, currentPath) => {
    //   if (node.children && node.children.length > 0) {
    //     const newPath = {
    //       ...currentPath,
    //       [String(node.label)]: String(node.name),
    //     };
    //     node.children.forEach((child) => traverse(child, newPath));
    //   } else {
    //     const newPath = {
    //       ...currentPath,
    //       [String(node.label)]: String(node.name),
    //     };
    //     node.data.forEach((child) => {
    //       newPath[String(child.column_name)] = String(child.value);
    //     });
    //     finalDataObject.push(newPath);
    //   }
    //   if (node.children && node.children.length > 0) {
    //     let summedUpArray = Array.from(
    //       { length: node.children[0].data.length },
    //       () => 0
    //     );
    //     node.children.forEach((child) => {
    //       const valuesArray = child.data.map((item) => item.value);
    //       summedUpArray = sumArrays(summedUpArray, valuesArray);
    //     });
    //     const headingsArray = node.children[0].data.map(
    //       (item) => item.column_name
    //     );
    //     const resultObject = {};

    //     for (let i = 0; i < headingsArray.length; i++) {
    //       resultObject[headingsArray[i]] = summedUpArray[i];
    //     }
    //     node.data = node.children[0].data;
    //     node.data.map((child, index) => (child.value = summedUpArray[index]));

    //     finalDataObject.push(resultObject);
    //     console.log(data, "tree data");
    //   }
    // };
    // traverse(data, {});
    setDataTree(data);
    // return [finalDataObject, newDataTree];
  };

  useEffect(() => {
    const postData = async () => {
      try {
        // You can use the state variable or any other logic to check if the data is ready

        const response = await fetch(
          `http://localhost:3030/replace_entities/${collection_name}`,
          {
            method: "POST",
            body: JSON.stringify(dataTree),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Handle response or additional logic
      } catch (error) {
        console.error("Error saving data:", error);
      }
    };

    postData();
  }, [dataTree]);

  return (
    <>
      {JSON.stringify(dataTree)}
      <button className="btn btn-outline-primary p-1 m-2" onClick={addEntity}>
        Add Entity
      </button>
      <button className="btn btn-outline-primary p-1 m-2" onClick={onAddData}>
        Add Data
      </button>
      <div className="excel-sheet">
        <div className="header-row">
          {headings.map((column, colIndex) => (
            <div className="header-cell-container">
              <div
                key={column.field}
                className="header-cell"
                contentEditable={column.editable}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleHeadingChange(colIndex, e.target.innerText)
                }
              >
                {column.field}
              </div>
              <button
                className="delete-button icon icon-tabler icon-tabler-trash"
                onClick={() => {
                  deleteColumn(column.field);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 7l16 0" />
                  <path d="M10 11l0 6" />
                  <path d="M14 11l0 6" />
                  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {data.map((sheet, sheetIndex) => (
          <div key={sheetIndex} className="sheet">
            {sheet.map((row, rowIndex) => (
              <div key={rowIndex} className="data-row">
                {headings.map((column, colIndex) => (
                  <div
                    key={colIndex}
                    className="data-cell"
                    contentEditable={column.editable}
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleCellChange(
                        sheetIndex,
                        rowIndex,
                        column,
                        e.target.innerText,
                        colIndex
                      )
                    }
                  >
                    {row[column.field]}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
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
export default ExcelSheet;
