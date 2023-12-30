import React, { useRef } from "react";

const ExcelCell = ({ value }) => {
  const cellRef = useRef(null);

  const handleKeyDown = (e) => {
    // Check if Ctrl+C is pressed (event.keyCode = 67) and Ctrl key is held down
    if (e.keyCode === 67 && e.ctrlKey) {
      const range = document.createRange();
      range.selectNodeContents(cellRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("copy");
      selection.removeAllRanges();
    }
  };

  return (
    <div
      ref={cellRef}
      contentEditable
      style={{
        border: "1px solid #ccc",
        padding: "5px",
        minWidth: "100px",
        minHeight: "30px",
      }}
      onKeyDown={handleKeyDown}
    >
      {value}
    </div>
  );
};

const ExcelTable = () => {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Column 1</th>
            <th>Column 2</th>
            {/* Add more columns as needed */}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ExcelCell value="A1" />
            </td>
            <td>
              <ExcelCell value="B1" />
            </td>
            {/* Add more cells as needed */}
          </tr>
          <tr>
            <td>
              <ExcelCell value="A2" />
            </td>
            <td>
              <ExcelCell value="B2" />
            </td>
            {/* Add more cells as needed */}
          </tr>
          {/* Add more rows as needed */}
        </tbody>
      </table>
    </div>
  );
};

export default ExcelTable;
