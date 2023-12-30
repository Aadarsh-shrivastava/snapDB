import React, { useState, useEffect } from "react";

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
    <div style={{ marginLeft: 20 }}>
      <div>
        <input
          name="label"
          value={node.label}
          onChange={(e) => HandleUpdateLabel(e.target.value)}
        />
        <input
          name="name"
          value={node.name}
          onChange={(e) => handleRenameNode(e.target.value)}
        />
        <button onClick={handleAddChild} disabled={isAddingChild}>
          +
        </button>
        <button onClick={handleDelete}>-</button>
      </div>
      {node.children && node.children.length > 0 && (
        <div style={{ marginLeft: 20 }}>
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
    data: 0,
  });

  const handleAddChild = async (parentId) => {
    setTree((prevTree) => {
      const newTree = { ...prevTree };
      const parentNode = findNode(newTree, parentId);
      const newChildId = generateUniqueId();
      const newChild = {
        id: newChildId,
        label: `label ${newChildId}`,
        name: `child ${newChildId}`,
        children: [],
        data: 0,
      };
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(newChild);

      return newTree;
    });
  };

  // React.useEffect(() => {
  //   // Log the updated tree for debugging purposes
  //   console.log(tree);
  // }, [tree]);

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

  const treeToJson = (node) => {
    const result = {
      label: node.label,
      name: node.name,
      children: node.children,
      data: node.data,
    };

    if (node.children && node.children.length > 0) {
      result.children = node.children.map((child) => treeToJson(child));
    }

    return result;
  };

  var jsonTree = treeToJson(tree);

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

  const setDataValues = (node) => {
    if (!node) {
      return;
    }
    const traverse = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => traverse(child));
      } else {
        node.data = [];
      }
    };

    traverse(node);

    return node;
  };
  const saveSchema = async () => {
    jsonTree = setDataValues(jsonTree);
    console.log(JSON.stringify(jsonTree, null, 2));
    const response = await fetch("http://localhost:3030/add_entity", {
      method: "POST",
      body: JSON.stringify(jsonTree),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return (
    <div>
      <TreeNode
        node={tree}
        onAddChild={handleAddChild}
        onDeleteNode={handleDeleteNode}
        handleUpdateLabel={handleUpdateLabel}
        onRenameNode={handleRenameNode}
      />
      <button onClick={saveSchema}>Save Schema</button>
    </div>
  );
};

export default TreeEditor;
