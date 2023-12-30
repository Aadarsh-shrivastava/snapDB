import React, { useState, useEffect } from "react";
import { useSelectionContainer } from "@air/react-drag-to-select";
import "./ExcelSheet.css";
import "scrollable-component";
const ExcelSheet = ({ rowData, columnData, datatree, collection_name }) => {
  const [dataTree, setDataTree] = useState([]);
  const [data, setData] = useState([]);
  const [headings, setheadings] = useState([]);
  const { DragSelection } = useSelectionContainer({
    selectionProps: {
      style: {
        border: "2px dashed purple",
        borderRadius: 4,
        backgroundColor: "brown",
        opacity: 0.5,
      },
    },
  });

  useEffect(() => {
    setDataTree(datatree);
    // console.log(JSON.stringify(dataTree));
  }, [datatree]);

  useEffect(() => {
    setData(rowData);
    // console.log(JSON.stringify(rowData));
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
      console.log(colIndex, columnField);
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
    console.log(data);
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
        console.log(path[pathIndex]);
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
    // console.log(dataTree);
  };

  const addEntity = () => {
    const newDataTree = JSON.parse(JSON.stringify(dataTree));
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

  return (
    <>
      <p>{JSON.stringify(dataTree)}</p>
      <button onClick={onAddData}>Add Data</button>
      <button>Add Entity</button>
      <button>save</button>
      <div className="excel-sheet">
        <div className="header-row">
          {headings.map((column, colIndex) => (
            <div
              key={column.field}
              className="header-cell"
              contentEditable={column.editable}
              suppressContentEditableWarning
              onBlur={(e) => handleHeadingChange(colIndex, e.target.innerText)}
            >
              {column.field}
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
export default ExcelSheet;
