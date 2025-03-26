export type GridCell = {
    x: number;
    y: number;
    width: number;
    height: number;
    isBomb: boolean;
    bombsAround: number;
    pressed: boolean;
    text: string;
    index: number;
    hasFlag: boolean;
    textColor: string;
    backgroundColor: string;
};

export type GridConfig = {
    startX: number;
    startY: number;
    finalWidth: number;
    cellSize: number;
    rows: number;
    columns: number;
    frequency: number;
}

const bombColors = {
    0: "#D3D3D3",  // Light Gray for empty cells
    1: "#1976D2",  // Bright Blue
    2: "#388E3C",  // Vibrant Green
    3: "#F57C00",  // Deep Orange
    4: "#7B1FA2",  // Strong Purple
    5: "#D32F2F",  // Intense Red
    6: "#00838F",  // Teal for '6'
    default: "#000000", // Black for unknown cases
};

export const backgroundColors = {
    default: "#B0BEC5",
    pressed: "#e0dcdc",
    openBomb: "#FF4C4C"
}

export const getGridConfig = (
    width: number,
    height: number,
    padding: number,
    columns: number = 5,
    frequency: number = 0.1
): GridConfig => {
    const startX = width * padding / 100;
    const startY = height * padding / 100

    const finalWidth = width;
    const cellSize = finalWidth / columns;
    const rows = Math.floor(height / cellSize) - 1;

    return {
        startX,
        startY,
        finalWidth,
        cellSize,
        rows,
        columns, frequency
    }
}

export const getCellText = (cell: GridCell) => (cell.isBomb ? '💣' : cell.bombsAround > 0 ? cell.bombsAround.toString() : "");

export const generateGrid = (
    gridConfig: GridConfig
): GridCell[] => {

    const grid: GridCell[] = [];

    let index = 0;
    for (let row = 0; row < gridConfig.rows; row++) {
        for (let col = 0; col < gridConfig.columns; col++) {
            grid.push({
                x: gridConfig.startX + col * gridConfig.cellSize,   // X position
                y: gridConfig.startY + row * gridConfig.cellSize,  // Y position
                width: gridConfig.cellSize,     // Cell width
                height: gridConfig.cellSize,   // Cell height
                isBomb: Math.random() < gridConfig.frequency,
                bombsAround: -1,
                pressed: false,
                text: '',
                hasFlag: false,
                textColor: bombColors.default,
                backgroundColor: backgroundColors.default,
                index
            });
            index++;
        }
    }
    return calculateGridTexts(grid, gridConfig.rows, gridConfig.columns);
};

const calculateGridTexts = (grid: GridCell[], rows: number, columns: number) => {
    for (let index = 0; index < grid.length; index++) {
        const cell = grid[index];

        if (cell.isBomb) continue;

        let bombsAround: number = 0;
        const rowIndex = Math.floor(index / columns);
        const colIndex = index % columns;

        // check if there is top left
        if (colIndex != 0 && rowIndex > 0 && grid[index - columns - 1].isBomb) bombsAround++;

        // check top mid
        if (rowIndex > 0 && grid[index - columns].isBomb) bombsAround++;

        // top right
        if (colIndex != columns - 1 && rowIndex > 0 && grid[index - columns + 1].isBomb) bombsAround++;

        // mid left
        if (colIndex > 0 && grid[index - 1].isBomb) bombsAround++;

        // mid right
        if (colIndex < columns - 1 && grid[index + 1].isBomb) bombsAround++;

        // bottom left
        if (rowIndex < rows - 1 && colIndex > 0 && grid[index + columns - 1].isBomb) bombsAround++;

        // bottom mid
        if (rowIndex < rows - 1 && grid[index + columns].isBomb) bombsAround++;

        // bottom right
        if (rowIndex < rows - 1 && colIndex < columns - 1 && grid[index + columns + 1].isBomb) bombsAround++;

        cell.bombsAround = bombsAround;
        cell.textColor = bombColors[bombsAround] || bombColors.default;
    }
    return grid
}

export const updateCellsAround = (index: number, grid: GridCell[], rows: number, columns: number) => {

    if (grid[index].bombsAround > 0 || grid[index].isBomb) return;

    const rowIndex = Math.floor(index / columns);
    const colIndex = index % columns;

    const checkCell = (index: number) => {
        const currentCell = grid[index];
        const alreadyPressed = currentCell.pressed;
        if (alreadyPressed || currentCell.hasFlag) return;
        if (!currentCell.isBomb) {
            currentCell.text = getCellText(currentCell);
            currentCell.pressed = true;
            currentCell.backgroundColor = backgroundColors.pressed;
        }
        if (currentCell.bombsAround === 0) return updateCellsAround(index, grid, rows, columns);
    }

    // check if there is top left
    if (colIndex != 0 && rowIndex > 0) checkCell(index - columns - 1);

    // check top mid
    if (rowIndex > 0) checkCell(index - columns);

    // top right
    if (colIndex != columns - 1 && rowIndex > 0) checkCell(index - columns + 1);

    // mid left
    if (colIndex > 0) checkCell(index - 1);

    // mid right
    if (colIndex < columns - 1) checkCell(index + 1);

    // bottom left
    if (rowIndex < rows - 1 && colIndex > 0) checkCell(index + columns - 1);

    // bottom mid
    if (rowIndex < rows - 1) checkCell(index + columns);

    // bottom right
    if (rowIndex < rows - 1 && colIndex < columns - 1) checkCell(index + columns + 1);
}

export const checkVictory = (grid: GridCell[]) => {
    let countTotalBombs = 0;
    let countRemainingCells = 0;
    for (const cell of grid) {
        if (!cell.pressed) countRemainingCells++;
        if (cell.isBomb) countTotalBombs++;
    }
    return countTotalBombs === countRemainingCells;
}

export const openBombs = (grid: GridCell[]) => {
    for (const cell of grid) {
        if (cell.isBomb && !cell.hasFlag) {
            cell.text = '💣';
            cell.pressed = true;
            cell.backgroundColor = backgroundColors.pressed;
        }
    }
}