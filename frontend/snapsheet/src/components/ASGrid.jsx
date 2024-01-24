import React, { useState, useEffect } from "react";
import { useSelectionContainer } from "@air/react-drag-to-select";
import "./ExcelSheet.css";
import "scrollable-component";
import { Link } from "react-router-dom";
const ExcelSheet = ({
  rowData,
  columnData,
  datatree,
  collection_name,
  drillCount,
}) => {
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

  const reloadTable = (newdatatree) => {
    console.log("updating tyree nodes", newdatatree);
    const extractingData = async (newdatatree) => {
      var reloadedData = [];
      var tempTreeData = [];
      try {
        if (newdatatree) {
          newdatatree.forEach((doc) => {
            let a = extractData(doc);
            reloadedData.push(a[0]);
            tempTreeData.push(a[1]);
          });
          if (newdatatree[0].data.length > 0) {
            var entityTotal = Array(newdatatree[0].data.length).fill(0);
            tempTreeData.forEach((node) => {
              const valuesArray = node.data.map((item) => item.value);
              entityTotal = sumArrays(entityTotal, valuesArray);
            });
            console.log("beforr new row", tempTreeData);
            var newrow = {};
            const keyArrays = tempTreeData[0].data.map(
              (item) => item.column_name
            );
            keyArrays.forEach((keys, index) => {
              newrow[keys] = entityTotal[index];
            });
            newrow[tempTreeData[0].label] = "total";
            reloadedData.push([newrow]);
            console.log("reloaded data", newrow);
            setDataTree(tempTreeData);
          }
        }
      } catch {
        console.log("fetchin...");
      }
      setData(reloadedData);
    };

    const extractData = (doc) => {
      if (!doc) {
        return null;
      }
      const newDataTree = JSON.parse(JSON.stringify(doc));

      let finalDataObject = [];
      const traverse = (node, currentPath) => {
        var totalsPath = {};
        if (node.children && node.children.length > 0) {
          const newPath = {
            ...currentPath,
            [String(node.label)]: String(node.name),
          };
          totalsPath = { ...totalsPath, ...newPath };
          node.children.forEach((child) => traverse(child, newPath));
        } else {
          const newPath = {
            ...currentPath,
            [String(node.label)]: String(node.name),
          };

          node.data.forEach((child) => {
            newPath[String(child.column_name)] = parseInt(child.value);
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
            totalsPath[headingsArray[i]] = parseInt(summedUpArray[i]);
            resultObject[headingsArray[i]] = parseInt(summedUpArray[i]);
          }

          node.data = JSON.parse(JSON.stringify(node.children[0].data));

          node.data.forEach(
            (child, index) => (child.value = parseInt(summedUpArray[index]))
          );

          finalDataObject.push(totalsPath);
        }
      };
      traverse(newDataTree, {});
      return [finalDataObject, newDataTree];
    };
    extractingData(newdatatree);
  };

  const handleCellChange = (
    sheetIndex,
    rowIndex,
    columnField,
    value,
    colIndex
  ) => {
    if (data[sheetIndex][rowIndex][columnField.field] == value) {
      return 0;
    }
    const path = Object.values(data[sheetIndex][rowIndex]);
    if (Object.values(data[sheetIndex][rowIndex]).includes("total")) {
      console.log(
        "itds a parent row",
        data[sheetIndex][rowIndex][columnField.field]
      );
      if (data[sheetIndex][rowIndex][columnField.field] == 0)
        handleParentRowCellChange(
          sheetIndex,
          path,
          columnField,
          colIndex,
          value
        );
      else
        handleParentRowCellChangewithoutPreviousRatio(
          sheetIndex,
          path,
          columnField,
          colIndex,
          value
        );
    }

    const newData = [...data];
    if (colIndex == 0) {
      newData[sheetIndex].forEach((datum) => {
        datum[columnField.field] = parseInt(value);
      });
      updateRootInTree(sheetIndex, value, "cell", 0);
    } else {
      newData[sheetIndex][rowIndex][columnField] = value;
    }
    // setData(newData);
    updateTreeNodes(sheetIndex, path, columnField, value);
    // reloadTable(dataTree);
  };

  const handleParentRowCellChange = (
    sheetIndex,
    path,
    column_name,
    colIndex,
    new_value
  ) => {
    setDataTree((prevDataTree) => {
      const newDataTree = JSON.parse(JSON.stringify(prevDataTree));
      var currentIndex = colIndex - drillCount;
      
      const handleDrillDown = (node) => {
        var prevIndex=currentIndex-1;
        while(node.data[prevIndex].value==0){
          prevIndex-=1
          if(prevIndex<0)return;
        }
        console.log(prevIndex,'previndex fro',node.data[prevIndex])
        const traverse = (node) => {
          if (node.children && node.children.length > 0) {
            let sum = 0,
              index = 0;
            node.children.forEach((childNode) => {
              index += 1;
              if (node.children.length === index)
                childNode.data[currentIndex].value =
                  node.data[currentIndex].value - sum;
              else {
                childNode.data[currentIndex].value = Math.round(
                  (node.data[currentIndex].value *
                    childNode.data[prevIndex].value) /
                    node.data[prevIndex].value
                );
              }

              sum += childNode.data[currentIndex].value;
              traverse(childNode);
            });
          }
        };
        traverse(node);
      };

      const findNodeByPath = (node, path, pathIndex = 0) => {
        // console.log(path[pathIndex], node.name);
        if (path[pathIndex + 1] === "total" && path[pathIndex] === node.name) {
          // console.log(node, "found node");
          node.data.forEach((element) => {
            if (element["column_name"] === column_name.field) {
              element.value = new_value;
            }
          });
          if (currentIndex == 0) return;
          handleDrillDown(node);
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
      return newDataTree;
    });
  };

  const handleParentRowCellChangewithoutPreviousRatio = (
    sheetIndex,
    path,
    column_name,
    colIndex,
    new_value
  ) => {
    console.log("handleParentRowCellChangewithoutPreviousRatio");
    setDataTree((prevDataTree) => {
      const newDataTree = JSON.parse(JSON.stringify(prevDataTree));
      var currentIndex = colIndex - drillCount;
      const handleDrillDown = (node, prev_value) => {
        const traverse = (node) => {
          if (node.children && node.children.length > 0) {
            let sum = 0,
              index = 0;
            node.children.forEach((childNode) => {
              index += 1;
              if (node.children.length === index)
                childNode.data[currentIndex].value =
                  node.data[currentIndex].value - sum;
              else {
                childNode.data[currentIndex].value = Math.round(
                  (node.data[currentIndex].value *
                    childNode.data[currentIndex].value) /
                    prev_value
                );
              }

              sum += childNode.data[currentIndex].value;
              traverse(childNode);
            });
          }
        };
        traverse(node);
      };

      const findNodeByPath = (node, path, pathIndex = 0) => {
        var prev_value = 0;
        if (path[pathIndex + 1] === "total" && path[pathIndex] === node.name) {
          // console.log(node, "found node");
          node.data.forEach((element) => {
            if (element["column_name"] === column_name.field) {
              prev_value = element.value;
              element.value = new_value;
            }
          });
          handleDrillDown(node, prev_value);
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
      return newDataTree;
    });
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
              element.value = parseInt(new_value);
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
      // console.log('updating tyree nodes before reloading',newDataTree)

      reloadTable(newDataTree);
      return newDataTree;
    });
  };

  const handleHeadingChange = (columnIndex, value) => {
    if (value == "" || value == headings[columnIndex].field) return;
    const newHeadings = headings;
    if (columnIndex == 0) {
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
    window.location.reload();
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

  const calDrillDown = (field) => {
    setDataTree((prevDataTree) => {
      const newDataTree = JSON.parse(JSON.stringify(prevDataTree));

      const traverse = (node) => {
        if (node.children && node.children.length > 0) {
          //   if (node.data[field]) console.log("field exists", node.data);
          node.children.forEach((child) => traverse(child));
        } else {
        }
      };

      newDataTree.forEach((root) => {
        traverse(root);
      });

      return newDataTree;
    });
  };

  const deleteColumn = (column_name) => {
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

  const deleteEntity = (sheetIndex) => {
    setDataTree((prevDataTree) => {
      return prevDataTree.filter((_, index) => index !== sheetIndex);
    });

    setData((prevData) => {
      return prevData.filter((_, index) => index !== sheetIndex);
    });
    // reloadTable(dataTree);
    window.location.reload();
  };

  return (
    <>
      {/* {JSON.stringify(dataTree)} */}
      <button className="btn btn-outline-primary p-1 m-2" onClick={addEntity}>
        Add Entity
      </button>
      <button className="btn btn-outline-primary p-1 m-2" onClick={onAddData}>
        Add Data
      </button>
      <Link
        className="btn btn-outline-primary p-1 m-2"
        to={`/Schemaeditor/${collection_name}`}
      >
        Edit Schema
      </Link>
      <div className="excel-sheet">
        <div className="d-flex">
          <button
            style={{ visibility: "hidden" }}
            className=".delete-entity-button  icon icon-tabler icon-tabler-trash"
            disabled
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
            ></svg>
          </button>
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
        </div>
        {data.map((sheet, sheetIndex) => (
          <div className="d-flex">
            <button
              className=".delete-entity-button  icon icon-tabler icon-tabler-trash"
              onClick={() => deleteEntity(sheetIndex)}
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
            <div key={sheetIndex} className="w-100">
              {sheet.map((row, rowIndex) => (
                <div key={rowIndex} className="data-row">
                  {headings.map((column, colIndex) => (
                    <div
                      key={colIndex}
                      className={`${
                        Object.values(row).includes("total") ? "total-row" : ""
                      } data-cell `}
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
          </div>
        ))}
      </div>
      {/* {JSON.stringify(data)} */}
    </>
  );
};

function sumArrays(arr1, arr2) {
  // Check if the arrays are of the same length
  if (arr1.length !== arr2.length) {
    throw new Error("Arrays must be of the same length");
  }
  const result = [];
  for (let i = 0; i < arr1.length; i++) {
    result.push(parseInt(arr1[i]) + parseInt(arr2[i]));
  }
  return result;
}

export default ExcelSheet;
