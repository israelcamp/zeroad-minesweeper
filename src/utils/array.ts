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

const directions = [
    [0, 1], [0, -1],
    [1, 0], [-1, 0],
    [1, 1], [1, -1],
    [-1, 1], [-1, -1]
]

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

export const getCellText = (cell: GridCell) => (cell.isBomb ? '' : cell.bombsAround > 0 ? cell.bombsAround.toString() : "");

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

const indexToRowCol = (index: number, columns: number) => {
    const rowIndex = Math.floor(index / columns);
    const colIndex = index % columns;
    return [rowIndex, colIndex]
}

const RowColToIndex = (rowIndex: number, colIndex: number, columns: number) => columns * rowIndex + colIndex;

const calculateGridTexts = (grid: GridCell[], rows: number, columns: number) => {

    for (let index = 0; index < grid.length; index++) {
        const cell = grid[index];

        if (cell.isBomb) continue;

        let bombsAround: number = 0;
        const [rowIndex, colIndex] = indexToRowCol(index, columns);

        for (const [drow, dcol] of directions) {
            const cRowIndex = rowIndex + drow;
            const cColIndex = colIndex + dcol;

            if (cRowIndex < 0 || cRowIndex >= rows || cColIndex < 0 || cColIndex >= columns)
                continue;

            bombsAround += Number(grid[RowColToIndex(cRowIndex, cColIndex, columns)].isBomb);

        }

        cell.bombsAround = bombsAround;
        cell.textColor = bombColors[bombsAround] || bombColors.default;
    }
    return grid
}

export const updateCellsAround = (index: number, grid: GridCell[], rows: number, columns: number) => {
    const startingCell = grid[index];
    let currentCells = [startingCell];

    let loopCount = 0;
    while (currentCells.length > 0 && loopCount < rows * columns) {
        const nextCells = [];

        for (const cell of currentCells) {
            if (cell.pressed || cell.hasFlag) continue;

            // Reveal the current cell
            cell.text = getCellText(cell);
            cell.pressed = true;
            cell.backgroundColor = backgroundColors.pressed;

            // Only continue expanding if this is an empty cell (bombsAround === 0)
            if (cell.bombsAround !== 0) continue;

            const [rowIndex, colIndex] = indexToRowCol(cell.index, columns);

            for (const [drow, dcol] of directions) {
                const cRowIndex = rowIndex + drow;
                const cColIndex = colIndex + dcol;

                if (cRowIndex < 0 || cRowIndex >= rows || cColIndex < 0 || cColIndex >= columns)
                    continue;

                nextCells.push(grid[RowColToIndex(cRowIndex, cColIndex, columns)]);
            }
        }
        loopCount++;
        currentCells = nextCells;
    }
    return startingCell;
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
            cell.pressed = true;
            cell.backgroundColor = backgroundColors.pressed;
        }
    }
}