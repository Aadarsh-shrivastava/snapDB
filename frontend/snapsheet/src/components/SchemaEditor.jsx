import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const TreeNode = ({
  node,
  onAddChild,
  onDeleteNode,
  handleUpdateLabel,
  onRenameNode,
}) => {
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [name, setName] = useState(node.name);
  const [label, setLabel] = useState(node.label);

  // Update local state when the node prop changes
  useEffect(() => {
    setName(node.name);
    setLabel(node.label);
  }, [node]);

  const handleDelete = () => {
    onDeleteNode(node.id);
  };

  const HandleUpdateLabel = async (val) => {
    await handleUpdateLabel(node.id, val);
    setLabel(val);
  };

  const handleAddChild = () => {
    const performAddChild = async () => {
      setIsAddingChild(true);
      try {
        await onAddChild(node.id);
      } finally {
        setIsAddingChild(false);
      }
    };

    if (!isAddingChild) {
      performAddChild();
    }
  };

  const handleRenameNode = async (val) => {
    await onRenameNode(node.id, val);
  };

  return (
    <div>
      <div className="d-flex justify-content-center flex-wrap mb-3">
        <div className="row g-3 align-items-center">
          <div className="col-auto align-temns-center">
            <input
              name="label"
              className="form-control"
              value={node.label}
              onChange={(e) => HandleUpdateLabel(e.target.value)}
            />
          </div>
          <div className="col-auto align-items-center">
            <input
              className="form-control"
              name="name"
              value={node.name}
              onChange={(e) => handleRenameNode(e.target.value)}
            />
          </div>
          <div className="col-auto align-items-center">
            <button
              className="btn py-1 px-2 btn-outline-primary"
              onClick={handleAddChild}
              disabled={isAddingChild}
            >
              +
            </button>
          </div>
          <div className="col-auto align-items-center">
            <button
              className="btn py-1 px-2 btn-outline-primary"
              onClick={handleDelete}
            >
              -
            </button>
          </div>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ms-5">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              handleUpdateLabel={handleUpdateLabel}
              onRenameNode={onRenameNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeEditor = () => {
  const [tree, setTree] = React.useState({
    id: 1,
    label: "label-root",
    name: "root",
    children: [],
    data: [],
  });

  const [fullData, setFullData] = React.useState();
  const { paramName } = useParams();
  const [dataVal, setDataVal] = React.useState();
  var dataList = [];
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3030/get_entity/${paramName}`
        );
        dataList = response.data[0].data;
        dataList.forEach((element) => {
          element.value = 0;
        });
        setDataVal(dataList);
        setTree(traverseAndAssignIds(response.data[0]));
        setFullData(response.data);
      } catch (error) {
        console.error("Error fetching daa:", error);
      }
    };

    fetchData();
  }, []);

  const traverseAndAssignIds = (currentNode) => {
    currentNode["id"] = generateUniqueId();
    if (currentNode.data && currentNode.data.length < 1) {
      currentNode.data = dataVal;
    }

    if (currentNode.children) {
      for (const child of currentNode.children) {
        traverseAndAssignIds(child);
      }
    }
    return currentNode;
  };

  const handleAddChild = async (parentId) => {
    setTree((prevTree) => {
      const newTree = { ...prevTree };
      const parentNode = findNode(newTree, parentId);
      const newChildId = generateUniqueId();
      console.log("adding child", dataVal);
      const newChild = {
        id: newChildId,
        label: `label ${newChildId}`,
        name: `child ${newChildId}`,
        children: [],
        data: dataVal,
      };
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(newChild);

      return newTree;
    });
  };

  const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 4);
  };

  const findNode = (currentNode, targetId) => {
    if (currentNode.id === targetId) return currentNode;

    if (currentNode.children) {
      for (const child of currentNode.children) {
        const foundNode = findNode(child, targetId);
        if (foundNode) return foundNode;
      }
    }
    return null;
  };

  const handleDeleteNode = (nodeId) => {
    setTree((prevTree) => {
      const newTree = { ...prevTree };
      const parentNode = findParentNode(newTree, nodeId);

      if (parentNode) {
        parentNode.children = parentNode.children.filter(
          (child) => child.id !== nodeId
        );
      } else {
        // Deleting the root node
        return {
          id: generateUniqueId(),
          name: "root",
          children: newTree.children.filter((child) => child.id !== nodeId),
        };
      }

      return newTree;
    });
  };

  const findParentNode = (currentNode, targetId) => {
    if (currentNode.children) {
      for (const child of currentNode.children) {
        if (child.id === targetId) {
          return currentNode;
        }

        const parent = findParentNode(child, targetId);
        if (parent) {
          return parent;
        }
      }
    }

    return null;
  };

  const handleUpdateLabel = async (nodeId, label) => {
    setTree((prevTree) => {
      const newTree = { ...prevTree };
      const parentNode = findParentNode(newTree, nodeId);

      if (parentNode) {
        parentNode.children.forEach((child) => {
          child.label = label;
        });
      }

      return newTree;
    });
  };

  const handleRenameNode = async (nodeId, name) => {
    setTree((prevTree) => {
      const newTree = { ...prevTree };
      const Node = findNode(newTree, nodeId);

      if (Node) {
        Node.name = name;
      }

      return newTree;
    });
  };

  function modifyTreeList() {
    // Helper function to recursively update the tree structures
    function updateTree(tree, referenceNode, dataval) {
      // Array to track indices of children to remove
      const indicesToRemove = [];
  
      // Recursively update children
      (tree.children || []).forEach((treeChild, index) => {
        const matchingChild = (referenceNode.children || []).find(
          (referenceChild) =>
            referenceChild.label === treeChild.label &&
            referenceChild.name === treeChild.name
        );
  
        if (matchingChild) {
          updateTree(treeChild, matchingChild, dataval);
        } else {
          // Child not found in referenceNode, mark for removal
          indicesToRemove.push(index);
        }
      });
  
      // Remove extra children
      indicesToRemove.reverse().forEach((index) => {
        tree.children.splice(index, 1);
      });
  
      // Add new children from referenceNode
      (referenceNode.children || []).forEach((referenceChild) => {
        const matchingChild = (tree.children || []).find(
          (treeChild) =>
            treeChild.label === referenceChild.label &&
            treeChild.name === referenceChild.name
        );
  
        if (!matchingChild) {
          const newChild = { ...referenceChild };
          (tree.children = tree.children || []).push(newChild);
          updateTree(newChild, referenceChild, dataval);
        }
      });
    }
  
    // Create a deep copy of the tree
    const modifiedTreeList = fullData.map((mainTree) => {
      const newTree = { ...mainTree };
      updateTree(newTree, tree, dataVal);
      return newTree;
    });
  
    // Optionally set full data if needed
    setFullData(modifiedTreeList);
  
    // Return the modified list
    return modifiedTreeList;
  }
  
  const modifyAllDocs = () => {
    const tempFullData = JSON.parse(JSON.stringify(fullData));
    console.log(tempFullData);
    const traverse = (datanode, referencenode) => {
      if (datanode.children && datanode.children.length > 0) {
        referencenode.children.forEach((referencechild) => {
          var exists = false;
          datanode.forEach((datanodechild) => {
            if (datanodechild.name == referencechild.name) {
              exists = true;
              return;
            }
          });
          if (exists == false) datanode.children.push(referencechild);
        });
      }

      tempFullData.forEach((element) => {
        traverse(element, tree);
      });

      setFullData(tempFullData);
    };
  };

  const [schemaname, setSchemaName] = useState("");
  const saveSchema = async () => {
    console.log(modifyTreeList());
    console.log(JSON.stringify(fullData));

    const response = await fetch(
      `http://localhost:3030/replace_entities/${schemaname}`,
      {
        method: "POST",
        body: JSON.stringify(fullData),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };

  const renameSchema = (val) => {
    setSchemaName(val);
    console.log(schemaname);
  };

  return (
    <div>
      {JSON.stringify(tree)}
      {tree ? (
        <TreeNode
          node={tree}
          onAddChild={handleAddChild}
          onDeleteNode={handleDeleteNode}
          handleUpdateLabel={handleUpdateLabel}
          onRenameNode={handleRenameNode}
        />
      ) : (
        <p>loading</p>
      )}

      <div className="d-flex justify-content-center flex-wrap ">
        <div className="row align-items-center ">
          <div className="col-auto align-temns-center m-2">
            <input
              name="label"
              className="form-control"
              placeholder="Schema Name"
              onChange={(e) => renameSchema(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-success m-2" onClick={saveSchema}>
          Save Schema
        </button>
        {JSON.stringify(dataVal)}
      </div>
    </div>
  );
};

export default TreeEditor;
